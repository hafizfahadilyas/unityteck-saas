/**
 * Lean fetch wrapper for Laravel API (Hostinger).
 * Empty / disabled env → mock mode in TenantContext.
 */

import { getAuthToken, clearAuthSession, readAuthSession } from '../auth/session';

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

function extractErrorMessage(json: unknown, status: number, statusText: string): string {
  if (!json || typeof json !== 'object') {
    return `API ${status} ${statusText}`;
  }
  const obj = json as Record<string, unknown>;
  if (typeof obj.message === 'string' && obj.message && !obj.message.includes('given data was invalid')) {
    return obj.message;
  }
  if (obj.errors && typeof obj.errors === 'object' && obj.errors !== null) {
    const first = Object.values(obj.errors as Record<string, unknown>)[0];
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
    if (typeof first === 'string') return first;
  }
  if (typeof obj.message === 'string') return obj.message;
  return `API ${status} ${statusText}`;
}

export type ApiFetchOptions = {
  method?: string;
  body?: unknown;
  storeId?: string;
  portal?: 'master' | 'store';
  /** Skip bearer (login endpoints). */
  skipAuth?: boolean;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { method = 'GET', body, storeId, portal, skipAuth } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const isPublicEndpoint =
    Boolean(skipAuth) ||
    path.startsWith('/products') ||
    path.startsWith('/stores') ||
    path.startsWith('/upload') ||
    path.startsWith('/storefront') ||
    path.startsWith('/health') ||
    path.startsWith('/auth/otp') ||
    path.startsWith('/auth/me') ||
    path.startsWith('/auth/forgot') ||
    path.startsWith('/auth/reset') ||
    path.startsWith('/auth/master/login') ||
    path.startsWith('/auth/store/login') ||
    path.startsWith('/webhooks') ||
    path.startsWith('/resolve-domain') ||
    path.startsWith('/whatsapp') ||
    path.includes('/blog/');

  if (portal === 'master') {
    headers['X-Portal'] = 'master';
  } else if (storeId) {
    headers['X-Store-Id'] = storeId;
  } else if (!isPublicEndpoint) {
    const session = readAuthSession();
    if (session?.portal === 'store' && session.storeId) {
      headers['X-Store-Id'] = session.storeId;
    }
  }

  const token = getAuthToken();
  if (token && !token.startsWith('mock-')) {
    headers.Authorization = `Bearer ${token}`;
  } else if (!isPublicEndpoint) {
    throw new Error('No active backend API session (mock/guest mode).');
  }

  let requestUrl = joinUrl(getApiBase(), path);
  if (method.toUpperCase() === 'GET') {
    const sep = requestUrl.includes('?') ? '&' : '?';
    requestUrl = `${requestUrl}${sep}_t=${Date.now()}`;
  }

  const res = await fetch(requestUrl, {
    method,
    headers,
    cache: 'no-store',
    body: isFormData ? (body as FormData) : (body !== undefined ? JSON.stringify(body) : undefined),
  });

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
    // Note: Do not auto-close or clear session on 401; user session remains active lifetime until manual logout
    throw new Error(extractErrorMessage(json, res.status, res.statusText));
  }

  if (json === null) {
    throw new Error('API server returned non-JSON response.');
  }

  return json as T;
}
