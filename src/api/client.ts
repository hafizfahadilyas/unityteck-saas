/**
 * Lean fetch wrapper for Laravel API (Hostinger).
 * Empty / disabled env → mock mode in TenantContext.
 * All thrown errors are user-friendly (EN/AR) — never raw SQL/HTTP dumps.
 */

import { renewLifetimeToken } from '../auth/renewSession';
import { getAuthToken } from '../auth/session';
import { friendlyHttpError, toUserFriendlyError } from '../utils/userFriendlyError';

export function getApiBase(): string {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  if (url && String(url).trim() !== '') {
    return String(url).replace(/\/$/, '');
  }
  return '/api';
}

/** API live when explicitly enabled or a base URL is configured. */
export function isApiEnabled(): boolean {
  return (
    import.meta.env.VITE_USE_API === 'true' ||
    Boolean(import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim())
  );
}

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

function extractBodyMessage(json: unknown): string | null {
  if (!json || typeof json !== 'object') return null;
  const obj = json as Record<string, unknown>;
  if (obj.errors && typeof obj.errors === 'object' && obj.errors !== null) {
    const first = Object.values(obj.errors as Record<string, unknown>)[0];
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
    if (typeof first === 'string') return first;
  }
  if (typeof obj.message === 'string' && obj.message) return obj.message;
  return null;
}

export type ApiFetchOptions = {
  method?: string;
  body?: unknown;
  storeId?: string;
  portal?: 'master' | 'store';
  /** Skip bearer (login endpoints). */
  skipAuth?: boolean;
  /** Internal: one silent token renew after 401. Never logs the admin out. */
  authRetried?: boolean;
};

const GET_MEMORY_TTL_MS = 8_000;
/** One product page is small. 20s covers a slow Hostinger round trip without parking the whole app. */
const GET_TIMEOUT_MS = 20_000;
const WRITE_TIMEOUT_MS = 25_000;

type MemHit = { at: number; data: unknown };
const getMemory = new Map<string, MemHit>();
const getInflight = new Map<string, Promise<unknown>>();

/** Drop short-lived GET coalescing so the next read hits MySQL. */
export function invalidateApiGetCache(storeId?: string): void {
  if (!storeId) {
    getMemory.clear();
    return;
  }
  const needle = storeId;
  for (const key of getMemory.keys()) {
    if (key.includes(needle)) getMemory.delete(key);
  }
}

function getCacheKey(method: string, url: string, storeId: string | undefined, token: string | null): string {
  return `${method}|${storeId || ''}|${token ? token.slice(-10) : ''}|${url}`;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { method = 'GET', body, storeId, portal, skipAuth, authRetried } = options;
  const methodUp = method.toUpperCase();
  const isGet = methodUp === 'GET';
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (!isGet) {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    headers.Pragma = 'no-cache';
    headers.Expires = '0';
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (portal === 'master') {
    headers['X-Portal'] = 'master';
  } else if (storeId) {
    headers['X-Store-Id'] = storeId;
  }

  const isPublicEndpoint =
    Boolean(skipAuth) ||
    path.startsWith('/storefront') ||
    path.startsWith('/health') ||
    path.startsWith('/auth/otp') ||
    path.startsWith('/auth/forgot') ||
    path.startsWith('/auth/reset') ||
    path.startsWith('/auth/master/login') ||
    path.startsWith('/auth/store/login') ||
    path.startsWith('/webhooks') ||
    path.startsWith('/resolve-domain') ||
    path.startsWith('/whatsapp') ||
    path.includes('/blog/');

  const token = getAuthToken();
  if (token && !token.startsWith('mock-') && !skipAuth) {
    headers.Authorization = `Bearer ${token}`;
  } else if (!isPublicEndpoint) {
    throw new Error(toUserFriendlyError('No active backend API session (mock/guest mode).'));
  }

  if (!isGet) {
    invalidateApiGetCache(storeId);
  }

  const requestUrl = joinUrl(getApiBase(), path);
  const cacheKey = getCacheKey(methodUp, requestUrl, storeId, token && !token.startsWith('mock-') ? token : null);

  if (isGet) {
    const hit = getMemory.get(cacheKey);
    if (hit && Date.now() - hit.at < GET_MEMORY_TTL_MS) {
      return hit.data as T;
    }
    const pending = getInflight.get(cacheKey);
    if (pending) return pending as Promise<T>;
  }

  const run = async (): Promise<T> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), isGet ? GET_TIMEOUT_MS : WRITE_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(requestUrl, {
        method: methodUp,
        headers,
        cache: 'no-store',
        signal: controller.signal,
        body: isFormData ? (body as FormData) : (body !== undefined ? JSON.stringify(body) : undefined),
      });
    } catch (err) {
      throw new Error(toUserFriendlyError(err));
    } finally {
      clearTimeout(timer);
    }

    let json: unknown = null;
    const text = await res.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }

    if (!res.ok) {
      if (res.status === 401 && !authRetried && !skipAuth && token?.includes('|')) {
        const renewed = await renewLifetimeToken();
        if (renewed) {
          return apiFetch<T>(path, { ...options, authRetried: true });
        }
      }
      const bodyMessage = extractBodyMessage(json);
      throw new Error(friendlyHttpError(res.status, res.statusText, bodyMessage));
    }

    if (json === null) {
      throw new Error(toUserFriendlyError('API server returned non-JSON response.'));
    }

    return json as T;
  };

  const execute = async (): Promise<T> => {
    const data = await run();
    if (isGet) getMemory.set(cacheKey, { at: Date.now(), data });
    return data;
  };

  if (!isGet) return execute();

  const promise = execute().finally(() => {
    getInflight.delete(cacheKey);
  });
  getInflight.set(cacheKey, promise);
  return promise;
}
