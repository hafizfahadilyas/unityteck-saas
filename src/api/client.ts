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
  if (import.meta.env.VITE_USE_API === 'true') {
    return true;
  }
  if (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim()) {
    return true;
  }
  // Hostinger production SPA shares origin with /api — never run storefront in mock-only mode.
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    return true;
  }
  return false;
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
  if (typeof obj.error === 'string' && obj.error) return obj.error;
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
  /** Override default abort timeout (ms). AI image gen needs ~120s. */
  timeoutMs?: number;
  /** Absolute API origin override (e.g. live Hostinger when local :8010 MySQL hangs). */
  baseUrl?: string;
  /** GET optional module — return null on 404 instead of throwing (empty store / route lag). */
  allowNotFound?: boolean;
};

/** Live Hostinger API for a store when local artisan cannot reach MySQL. */
export function liveApiBaseForStore(storeId?: string): string {
  const id = String(storeId || '').toLowerCase();
  if (
    id === 'store-1' ||
    id.includes('flower') ||
    id.includes('gift') ||
    id.includes('hadaya') ||
    id.includes('makkah')
  ) {
    return 'https://giftshop-sa.com/api';
  }
  return 'https://mieraf-ksa.com/api';
}

/**
 * Pick the API origin that owns this store's MySQL rows.
 * DEV Vite proxies /api → giftshop by default (coffee orders = 0 there).
 * PROD: never read coffee/bleco from giftshop SQLite or flowers from central by mistake.
 */
export function resolveApiBaseForStore(storeId?: string, override?: string): string {
  if (override) return override.replace(/\/$/, '');
  const base = getApiBase();
  if (!storeId) return base;
  const live = liveApiBaseForStore(storeId);
  if (typeof window === 'undefined') return base;

  const host = window.location.hostname.toLowerCase();
  const wantsMieraf = /mieraf-ksa\.com/i.test(live);
  const wantsGiftshop = /giftshop-sa\.com/i.test(live);
  const onGiftshop = /giftshop-sa\.com$/i.test(host);
  const onMieraf = /mieraf-ksa\.com$/i.test(host);
  const relativeOrLocal =
    base === '/api' ||
    base.endsWith('/api') ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/api$/i.test(base);

  // Local Vite /api defaults to giftshop proxy — coffee/bleco rows live on mieraf MySQL.
  if (relativeOrLocal) {
    if (import.meta.env.DEV && wantsMieraf) return live;
    if (wantsMieraf && onGiftshop) return live;
    if (wantsGiftshop && onMieraf) return live;
  }
  return base;
}

/**
 * Absolute live Hostinger only when VITE_API_URL is already a full live URL.
 * Default DEV uses Vite `/api` proxy (see vite.config → VITE_API_PROXY_TARGET).
 */
export function preferLiveApiInDev(): boolean {
  if (!import.meta.env.DEV) return false;
  const base = getApiBase();
  return /^https?:\/\//i.test(base) && /giftshop-sa|mieraf-ksa/i.test(base);
}

/** Structured API failure — preserves business `code` + payload for UI handling. */
export class ApiRequestError extends Error {
  status: number;
  code?: string;
  payload?: unknown;

  constructor(message: string, status: number, code?: string, payload?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

const GET_MEMORY_TTL_MS = 20_000;
/** One product page is small. 20s covers a slow Hostinger round trip without parking the whole app. */
/** Hostinger catalog/list can be slow on flowers host; keep under soft UX limit. */
const GET_TIMEOUT_MS = 18_000;
/** Theme / page writes on Hostinger often need >25s; keep default under soft UX limit. */
const WRITE_TIMEOUT_MS = 45_000;

type MemHit = { at: number; data: unknown };
const getMemory = new Map<string, MemHit>();
const getInflight = new Map<string, Promise<unknown>>();

/** Drop short-lived GET coalescing so the next read hits MySQL (memory + in-flight). */
export function invalidateApiGetCache(storeId?: string): void {
  if (!storeId) {
    getMemory.clear();
    getInflight.clear();
    return;
  }
  const needle = storeId;
  for (const key of [...getMemory.keys()]) {
    if (key.includes(needle)) getMemory.delete(key);
  }
  // Clear in-flight GETs too — otherwise a pre-write request can finish after
  // POST and overwrite fresh UI state (e.g. newly created manual orders vanish).
  for (const key of [...getInflight.keys()]) {
    if (key.includes(needle)) getInflight.delete(key);
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
  // Do NOT send Expires/Pragma on cross-origin writes — Hostinger gateway CORS
  // allow-list rejects them (preflight → Failed to fetch / "Unable to connect").
  if (!isGet) {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
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
    path.startsWith('/onboarding/') ||
    path.includes('/blog/');

  const token = getAuthToken();
  // Only Sanctum PATs (`{id}|{hash}`) go on Authorization. Clerk JWT / google-sso /
  // mock tokens poison guest-readable GETs (orders/products) with 401 and empty dashboards.
  const liveSanctum =
    Boolean(token) &&
    token!.includes('|') &&
    !token!.startsWith('mock-') &&
    !token!.startsWith('clerk-') &&
    !token!.startsWith('google-sso-');
  if (liveSanctum && !skipAuth) {
    headers.Authorization = `Bearer ${token}`;
  }
  const guestReadable =
    isGet &&
    (path.startsWith('/products') ||
      path.startsWith('/categories') ||
      path.startsWith('/orders') ||
      path.startsWith('/customers') ||
      path.startsWith('/coupons') ||
      path.startsWith('/seo') ||
      path.startsWith('/reports') ||
      path.startsWith('/analytics/dashboard-home') ||
      path.includes('/store-settings') ||
      path.includes('/loyalty/overview') ||
      path.startsWith('/domains') ||
      path.startsWith('/shipping') ||
      path.startsWith('/notifications/deliveries') ||
      path.startsWith('/payments/transactions') ||
      path.startsWith('/couriers/shipments') ||
      path.startsWith('/customer-activities') ||
      path.startsWith('/delivery-drivers') ||
      path.startsWith('/google/'));
  if (!isPublicEndpoint && !guestReadable && !liveSanctum) {
    throw new Error(toUserFriendlyError('No active backend API session (mock/guest mode).'));
  }

  if (!isGet) {
    invalidateApiGetCache(storeId);
  }

  const requestUrl = joinUrl(resolveApiBaseForStore(storeId, options.baseUrl), path);
  const cacheKey = getCacheKey(methodUp, requestUrl, storeId, liveSanctum ? token : null);

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
    const timeoutMs =
      typeof options.timeoutMs === 'number' && options.timeoutMs > 0
        ? options.timeoutMs
        : isGet
          ? GET_TIMEOUT_MS
          : WRITE_TIMEOUT_MS;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
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
      // Never leak raw AbortError to the console / uncaught rejection path.
      const aborted =
        (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof Error && /abort/i.test(err.name + err.message));
      throw new Error(toUserFriendlyError(aborted ? 'timeout' : err));
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
      if (res.status === 404 && options.allowNotFound && isGet) {
        return null as T;
      }
      if (res.status === 401 && !authRetried && !skipAuth && token?.includes('|')) {
        const renewed = await renewLifetimeToken();
        if (renewed) {
          return apiFetch<T>(path, { ...options, authRetried: true });
        }
      }
      const bodyMessage = extractBodyMessage(json);
      const code =
        json && typeof json === 'object' && typeof (json as { code?: unknown }).code === 'string'
          ? String((json as { code: string }).code)
          : undefined;
      throw new ApiRequestError(
        friendlyHttpError(res.status, res.statusText, bodyMessage),
        res.status,
        code,
        json,
      );
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
