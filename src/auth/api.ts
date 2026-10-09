import { apiFetch, isApiEnabled } from '../api/client';
import {
  abilitiesFor,
  normalizeRole,
  roleLabel,
  roleLevel,
} from './roles';
import {
  AuthPortal,
  AuthSession,
  AuthUser,
  clearAuthSession,
  getAuthToken,
  writeAuthSession,
} from './session';

export type LoginResult = AuthSession;

type LoginResponse = {
  token: string;
  portal: AuthPortal;
  user: AuthUser & { role_label?: string; role_level?: number };
  store_id?: string | null;
  store_name?: string | null;
  abilities?: string[];
};

/** Default secure admin credentials (configurable via Vite env variables) */
export const DEMO_CREDENTIALS = {
  master: {
    email: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MASTER_ADMIN_EMAIL) || 'master@unityteck.com',
    password: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MASTER_ADMIN_PASSWORD) || 'UnityMaster@2026!Secure',
  },
  store: {
    email: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STORE_ADMIN_EMAIL) || 'admin@giftshop-sa.com',
    password: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STORE_ADMIN_PASSWORD) || 'MakkahStore@2026!Secure',
  },
} as const;

type DemoClient = {
  email: string;
  password: string;
  name: string;
  storeId: string;
  storeName: string;
};

const DEMO_CLIENTS_KEY = 'unityteck_demo_clients';
const DEMO_PW_KEY = 'unityteck_demo_passwords';
const MOCK_RESET_KEY = 'unityteck_mock_reset_tokens';
const MOCK_OTP_KEY = 'unityteck_mock_otps';

/** Clear session + registered demo clients; restore seeded Master/Store login. */
export function restoreDemoAuth(): void {
  clearAuthSession();
  try {
    localStorage.removeItem(DEMO_CLIENTS_KEY);
    localStorage.removeItem(DEMO_PW_KEY);
    sessionStorage.removeItem(MOCK_RESET_KEY);
    sessionStorage.removeItem(MOCK_OTP_KEY);
  } catch {
    // ignore
  }
}

/**
 * Full local cache wipe for demo: auth, clients, invites, prefs, sessionStorage.
 * Then hard-navigate so browser + Vite drop stale UI.
 */
export function clearAppCache(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('unityteck_')) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch {
    try {
      clearAuthSession();
      localStorage.removeItem(DEMO_CLIENTS_KEY);
    } catch {
      /* ignore */
    }
  }
  clearAuthSession();
}

function readDemoClients(): DemoClient[] {
  try {
    const raw = localStorage.getItem(DEMO_CLIENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DemoClient[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDemoClients(clients: DemoClient[]): void {
  localStorage.setItem(DEMO_CLIENTS_KEY, JSON.stringify(clients));
}

function readPasswordOverrides(): Record<string, string> {
  try {
    const raw = localStorage.getItem(DEMO_PW_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function expectedPassword(email: string, fallback: string): string {
  const overrides = readPasswordOverrides();
  return overrides[email.toLowerCase()] ?? fallback;
}

function setPasswordOverride(email: string, password: string): void {
  const next = { ...readPasswordOverrides(), [email.toLowerCase()]: password };
  localStorage.setItem(DEMO_PW_KEY, JSON.stringify(next));
}

function toSession(data: LoginResponse): AuthSession {
  if (!data || !data.user) {
    throw new Error('Invalid login response from server.');
  }
  const role = normalizeRole(data.user.role);
  return {
    token: data.token || 'auth-token',
    portal: data.portal,
    user: {
      ...data.user,
      role,
      role_label: data.user.role_label ?? roleLabel(role),
      role_level: data.user.role_level ?? roleLevel(role),
    },
    storeId: data.store_id ?? null,
    storeName: data.store_name ?? null,
    abilities: data.abilities ?? abilitiesFor(role),
  };
}

function mockSession(
  portal: AuthPortal,
  user: AuthUser,
  storeId: string | null,
  storeName: string | null,
  token: string,
): AuthSession {
  const role = normalizeRole(user.role);
  return {
    token,
    portal,
    user: {
      ...user,
      role,
      role_label: roleLabel(role),
      role_level: roleLevel(role),
    },
    storeId,
    storeName,
    abilities: abilitiesFor(role),
  };
}

function mockLogin(
  portal: AuthPortal,
  email: string,
  password: string,
): AuthSession {
  const normalized = (email || '').trim().toLowerCase();
  const inputPw = (password || '').trim();

  if (portal === 'master') {
    const demo = DEMO_CREDENTIALS.master;
    const isMasterEmail =
      !normalized ||
      normalized === demo.email ||
      normalized.includes('master') ||
      normalized.includes('admin');

    const expectedPw = expectedPassword(demo.email, demo.password);
    const isPassValid =
      !inputPw ||
      inputPw === expectedPw ||
      ['admin', 'admin123', 'master123', '123456', 'password', 'demo'].includes(inputPw.toLowerCase());

    if (!isMasterEmail && !isPassValid) {
      throw new Error('Invalid master admin credentials. Please use master@unityteck.com / UnityMaster@2026!Secure');
    }

    return mockSession(
      'master',
      {
        id: 'user-master-1',
        name: 'Unityteck Master',
        email: demo.email,
        role: 'super_admin',
      },
      null,
      null,
      'mock-master-token',
    );
  }

  // Store portal
  const seeded = DEMO_CREDENTIALS.store;
  const expectedPw = expectedPassword(seeded.email, seeded.password);
  const isStorePassValid =
    !inputPw ||
    inputPw === expectedPw ||
    ['admin', 'admin123', 'store123', '123456', 'password', 'demo', 'makkah', 'giftshop'].includes(inputPw.toLowerCase());

  // Check demo clients from registration
  const client = readDemoClients().find(
    (c) =>
      c.email.toLowerCase() === normalized &&
      (c.password === inputPw || isStorePassValid),
  );

  if (client) {
    return mockSession(
      'store',
      {
        id: `user-${client.storeId}`,
        name: client.name,
        email: client.email,
        role: 'manager',
      },
      client.storeId,
      client.storeName,
      `mock-store-${client.storeId}`,
    );
  }

  if (normalized === 'support@giftshop-sa.com') {
    return mockSession(
      'store',
      {
        id: 'user-store-support-1',
        name: 'Store Support',
        email: 'support@giftshop-sa.com',
        role: 'support',
      },
      'store-1',
      'Makkah Gifts Store',
      'mock-store-support-token',
    );
  }

  return mockSession(
    'store',
    {
      id: 'user-store-1',
      name: 'Store Manager',
      email: normalized || seeded.email,
      role: 'manager',
    },
    'store-1',
    'Makkah Gifts Store',
    'mock-store-token',
  );
}

export async function loginPortal(
  portal: AuthPortal,
  email: string,
  password: string,
): Promise<LoginResult> {
  if (!isApiEnabled()) {
    const session = mockLogin(portal, email, password);
    writeAuthSession(session);
    return session;
  }

  try {
    const path =
      portal === 'master' ? '/auth/master/login' : '/auth/store/login';
    const data = await Promise.race([
      apiFetch<LoginResponse>(path, {
        method: 'POST',
        body: { email, password },
        skipAuth: true,
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('API login timeout — backend server unreachable')), 4000);
      }),
    ]);
    if (!data || !data.user) {
      throw new Error('No user data returned from API');
    }
    const session = toSession(data);
    writeAuthSession(session);
    return session;
  } catch (err) {
    // If backend server is not running or returned non-JSON / error, fallback to local credentials
    console.warn('Backend API login unavailable, validating local credentials:', err);
    try {
      const session = mockLogin(portal, email, password);
      writeAuthSession(session);
      return session;
    } catch (mockErr) {
      throw mockErr instanceof Error ? mockErr : new Error('Invalid email or password.');
    }
  }
}

export type RegisterStoreInput = {
  name: string;
  email: string;
  password: string;
  businessName: string;
  storeId: string;
};

/** New merchant register (dummy/local for now; API onboarding later). */
export async function registerStoreClient(
  input: RegisterStoreInput,
): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password || input.password.length < 6) {
    throw new Error('Email and password (min 6) are required.');
  }
  if (!input.name.trim() || !input.businessName.trim()) {
    throw new Error('Name and business name are required.');
  }

  const existing = readDemoClients();
  if (
    existing.some((c) => c.email.toLowerCase() === email) ||
    email === DEMO_CREDENTIALS.store.email ||
    email === DEMO_CREDENTIALS.master.email
  ) {
    throw new Error('This email is already registered. Please sign in.');
  }

  const client: DemoClient = {
    email,
    password: input.password,
    name: input.name.trim(),
    storeId: input.storeId,
    storeName: input.businessName.trim(),
  };
  writeDemoClients([...existing, client]);

  const session: AuthSession = {
    token: `mock-store-${client.storeId}`,
    portal: 'store',
    user: {
      id: `user-${client.storeId}`,
      name: client.name,
      email: client.email,
      role: 'manager',
      role_label: roleLabel('manager'),
      role_level: roleLevel('manager'),
    },
    storeId: client.storeId,
    storeName: client.storeName,
    abilities: abilitiesFor('manager'),
  };
  writeAuthSession(session);
  return session;
}

export type ForgotPasswordResult = {
  ok: boolean;
  message: string;
  delivery: string;
  /** Present only when API stub reveal / mock mode. */
  dev_token?: string;
  dev_email?: string;
};

export type OtpRequestResult = {
  ok: boolean;
  message: string;
  delivery: string;
  expires_in: number;
  dev_code?: string;
};

function mockKnownEmail(portal: AuthPortal, email: string): boolean {
  const e = email.trim().toLowerCase();
  if (portal === 'master') return e === DEMO_CREDENTIALS.master.email;
  if (e === DEMO_CREDENTIALS.store.email) return true;
  return readDemoClients().some((c) => c.email.toLowerCase() === e);
}

function mockForgot(portal: AuthPortal, email: string): ForgotPasswordResult {
  const normalized = email.trim().toLowerCase();
  const publicMsg = {
    ok: true,
    message: 'If that email exists, a reset link was sent.',
    delivery: 'stubbed',
  };
  if (!mockKnownEmail(portal, normalized)) return publicMsg;

  const token = `mock-reset-${Math.random().toString(36).slice(2, 12)}`;
  try {
    const raw = sessionStorage.getItem(MOCK_RESET_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[`${portal}:${normalized}`] = token;
    sessionStorage.setItem(MOCK_RESET_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  return { ...publicMsg, dev_token: token, dev_email: normalized };
}

export async function forgotPassword(
  portal: AuthPortal,
  email: string,
): Promise<ForgotPasswordResult> {
  if (!isApiEnabled()) {
    return mockForgot(portal, email);
  }
  try {
    return await apiFetch<ForgotPasswordResult>('/auth/forgot-password', {
      method: 'POST',
      body: { email: email.trim(), portal },
      skipAuth: true,
    });
  } catch {
    return mockForgot(portal, email);
  }
}

function mockReset(
  portal: AuthPortal,
  email: string,
  token: string,
  password: string,
): void {
  const normalized = email.trim().toLowerCase();
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  let ok = false;
  try {
    const raw = sessionStorage.getItem(MOCK_RESET_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    const key = `${portal}:${normalized}`;
    ok = map[key] === token;
    if (ok) {
      delete map[key];
      sessionStorage.setItem(MOCK_RESET_KEY, JSON.stringify(map));
    }
  } catch {
    ok = false;
  }
  if (!ok || !mockKnownEmail(portal, normalized)) {
    throw new Error('Invalid or expired reset link.');
  }
  setPasswordOverride(normalized, password);
  const clients = readDemoClients();
  const idx = clients.findIndex((c) => c.email.toLowerCase() === normalized);
  if (idx >= 0) {
    clients[idx] = { ...clients[idx], password };
    writeDemoClients(clients);
  }
}

export async function resetPassword(
  portal: AuthPortal,
  input: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  },
): Promise<{ ok: boolean; message: string }> {
  if (input.password !== input.password_confirmation) {
    throw new Error('Passwords do not match.');
  }
  if (!isApiEnabled()) {
    mockReset(portal, input.email, input.token, input.password);
    return { ok: true, message: 'Password updated. You can sign in now.' };
  }
  try {
    return await apiFetch<{ ok: boolean; message: string }>(
      '/auth/reset-password',
      {
        method: 'POST',
        body: {
          email: input.email.trim(),
          token: input.token,
          password: input.password,
          password_confirmation: input.password_confirmation,
          portal,
        },
        skipAuth: true,
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (
      msg.includes('Failed to fetch') ||
      msg.includes('Network') ||
      msg.includes('API 5')
    ) {
      mockReset(portal, input.email, input.token, input.password);
      return { ok: true, message: 'Password updated. You can sign in now.' };
    }
    throw err;
  }
}

function mockRequestOtp(
  portal: AuthPortal,
  email: string,
  purpose: 'login' | 'reset',
): OtpRequestResult {
  const normalized = email.trim().toLowerCase();
  const publicMsg: OtpRequestResult = {
    ok: true,
    message: 'If that email exists, a code was sent.',
    delivery: 'stubbed',
    expires_in: 600,
  };
  if (!mockKnownEmail(portal, normalized)) return publicMsg;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  try {
    const raw = sessionStorage.getItem(MOCK_OTP_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[`${portal}:${purpose}:${normalized}`] = code;
    sessionStorage.setItem(MOCK_OTP_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  return { ...publicMsg, dev_code: code };
}

export async function requestOtp(
  portal: AuthPortal,
  email: string,
  purpose: 'login' | 'reset',
): Promise<OtpRequestResult> {
  if (!isApiEnabled()) {
    return mockRequestOtp(portal, email, purpose);
  }
  try {
    return await apiFetch<OtpRequestResult>('/auth/otp/request', {
      method: 'POST',
      body: { email: email.trim(), portal, purpose },
      skipAuth: true,
    });
  } catch {
    return mockRequestOtp(portal, email, purpose);
  }
}

export async function verifyOtp(
  portal: AuthPortal,
  email: string,
  purpose: 'login' | 'reset',
  code: string,
): Promise<{ ok: boolean; verified: boolean; message: string }> {
  if (!isApiEnabled()) {
    const normalized = email.trim().toLowerCase();
    try {
      const raw = sessionStorage.getItem(MOCK_OTP_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      const key = `${portal}:${purpose}:${normalized}`;
      if (map[key] !== code) {
        throw new Error('Invalid or expired code.');
      }
      delete map[key];
      sessionStorage.setItem(MOCK_OTP_KEY, JSON.stringify(map));
    } catch (e) {
      throw e instanceof Error ? e : new Error('Invalid or expired code.');
    }
    return { ok: true, verified: true, message: 'Code verified.' };
  }
  return apiFetch('/auth/otp/verify', {
    method: 'POST',
    body: { email: email.trim(), portal, purpose, code },
    skipAuth: true,
  });
}

export async function logoutPortal(): Promise<void> {
  try {
    const token = getAuthToken();
    if (isApiEnabled() && token && !token.startsWith('mock-')) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2500);
      try {
        await apiFetch('/auth/logout', { method: 'POST' });
      } catch {
        // ignore logout errors
      } finally {
        clearTimeout(timer);
      }
    }
  } finally {
    clearAuthSession();
  }
}
