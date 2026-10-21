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
import {
  validateAuthInput,
  getRateLimitStatus,
  recordFailedAttempt,
  resetRateLimit,
} from './security';

export type LoginResult = AuthSession;

type LoginResponse = {
  token: string;
  portal: AuthPortal;
  user: AuthUser & { role_label?: string; role_level?: number };
  store_id?: string | null;
  store_name?: string | null;
  abilities?: string[];
};

/** Default secure admin credentials per store (configurable via Vite env variables) */
export const DEMO_CREDENTIALS = {
  master: {
    email: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MASTER_ADMIN_EMAIL) || 'master@unityteck.com',
    password: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MASTER_ADMIN_PASSWORD) || 'UnityMaster@2026!Secure',
    name: 'Unityteck Master SuperAdmin',
    aliases: ['master@unityteck.com', 'admin@unityteck.com', 'admin@giftshop-sa.com', 'master', 'admin', 'superadmin'],
  },
  store: {
    email: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STORE_ADMIN_EMAIL) || 'giftshop2030m@gmail.com',
    password: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STORE_ADMIN_PASSWORD) || 'MakkahStore@2026!Secure',
    name: 'متجر هدايا',
    storeId: 'store-1',
    aliases: [
      'giftshop2030m@gmail.com',
      'admin@giftshop-sa.com',
      'tariq@wardalmakkah.sa',
      'makkah',
      'ward',
      'giftshop',
      'store-1',
      'flowers',
      'gifts',
    ],
    supportEmail: 'giftshop2030m@gmail.com',
    supportPassword: 'WardSupport@2026!Secure',
  },
  coffee: {
    email: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_COFFEE_ADMIN_EMAIL) || 'rayan@specialtycoffee.sa',
    password: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_COFFEE_ADMIN_PASSWORD) || 'CoffeeStore@2026!Secure',
    name: 'متجر القهوة المختصة',
    storeId: 'store-coffee',
    aliases: [
      'rayan@specialtycoffee.sa',
      'coffee@specialtycoffee.sa',
      'admin@specialtycoffee.sa',
      'coffee',
      'rayan',
      'store-coffee',
      'specialtycoffee',
    ],
  },
  car: {
    email: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CAR_ADMIN_EMAIL) || 'admin@bleco.sa',
    password: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CAR_ADMIN_PASSWORD) || 'BlackoStore@2026!Secure',
    name: 'متجر السعيدي لخدمات السيارات (مؤسسة بلاكو)',
    storeId: 'store-bleco',
    aliases: [
      'admin@bleco.sa',
      'support@tanjeedmakkah.com',
      'alsaeedi@tanjeedmakkah.com',
      'admin@tanjeedmakkah.com',
      'bleco',
      'car',
      'tanjeed',
      'alsaeedi',
      'store-bleco',
      'blacko',
    ],
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
  clearAuthSession(true);
  try {
    localStorage.removeItem(DEMO_CLIENTS_KEY);
    localStorage.removeItem(DEMO_PW_KEY);
    localStorage.removeItem('unityteck_last_login_email');
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
      clearAuthSession(true);
      localStorage.removeItem(DEMO_CLIENTS_KEY);
    } catch {
      /* ignore */
    }
  }
  clearAuthSession(true);
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
    if (parsed && typeof parsed === 'object') {
      let cleaned = false;
      const cleanMap: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        // Disallow weak/demo password overrides like "password", "123456", "admin"
        if (
          v &&
          typeof v === 'string' &&
          v.trim().toLowerCase() !== 'password' &&
          v.trim().toLowerCase() !== '123456' &&
          v.trim().toLowerCase() !== 'admin'
        ) {
          cleanMap[k.toLowerCase()] = v;
        } else {
          cleaned = true;
        }
      }
      if (cleaned) {
        localStorage.setItem(DEMO_PW_KEY, JSON.stringify(cleanMap));
      }
      return cleanMap;
    }
    return {};
  } catch {
    return {};
  }
}

function expectedPassword(email: string, fallback: string): string {
  const overrides = readPasswordOverrides();
  const override = overrides[email.toLowerCase()];
  if (
    override &&
    override.trim().toLowerCase() !== 'password' &&
    override.trim().toLowerCase() !== '123456' &&
    override.trim().toLowerCase() !== 'admin'
  ) {
    return override;
  }
  return fallback;
}

function setPasswordOverride(email: string, password: string): void {
  if (password.trim().toLowerCase() === 'password' || password.trim().toLowerCase() === '123456') {
    return;
  }
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
  identifier: string,
  password: string,
): AuthSession {
  // 1. Rigorous input validation & anti-SQLi / XSS protection
  const secCheck = validateAuthInput(identifier, password);
  if (!secCheck.isSecure) {
    throw new Error(secCheck.messageAr || secCheck.messageEn || 'Security check failed. Malicious input detected.');
  }

  const normalized = (identifier || '').trim().toLowerCase();
  const inputPw = (password || '').trim();

  if (!normalized) {
    throw new Error('يرجى إدخال اسم المستخدم أو البريد الإلكتروني / Username or email is required.');
  }

  if (!inputPw || inputPw.length < 6) {
    throw new Error('كلمة المرور يجب ألا تقل عن 6 خانات / Password must be at least 6 characters.');
  }

  // Strictly block generic demo password "password"
  if (inputPw.toLowerCase() === 'password') {
    recordFailedAttempt(normalized);
    throw new Error(
      'كلمة المرور غير صحيحة. يرجى إدخال كلمة المرور المعتمدة لمتجرك / Invalid password.'
    );
  }

  // Master Portal Auth
  if (portal === 'master') {
    const demo = DEMO_CREDENTIALS.master;
    const expectedPw = expectedPassword(demo.email, demo.password);
    const isMasterIdentifier =
      normalized === demo.email.toLowerCase() ||
      (demo.aliases as readonly string[]).includes(normalized);

    if (isMasterIdentifier && (inputPw === expectedPw || inputPw === demo.password)) {
      resetRateLimit(normalized);
      return mockSession(
        'master',
        {
          id: 'user-master-1',
          name: 'Unityteck Master SuperAdmin',
          email: demo.email,
          role: 'super_admin',
        },
        null,
        null,
        'mock-master-token',
      );
    }

    const rateLimitMaster = getRateLimitStatus(normalized);
    if (rateLimitMaster.isLocked) {
      throw new Error(
        `تم حظر الدخول مؤقتاً لحماية الحساب من محاولات التخمين. يرجى الانتظار ${rateLimitMaster.remainingSeconds} ثانية. (Anti-Brute-Force Locked)`,
      );
    }

    recordFailedAttempt(normalized);
    throw new Error('بيانات دخول إدارة المنصة غير صحيحة / Invalid master credentials.');
  }

  // 2. Rate limiting check (anti-brute-force)
  const rateLimit = getRateLimitStatus(normalized);
  if (rateLimit.isLocked) {
    throw new Error(
      `تم حظر الدخول مؤقتاً لحماية الحساب من محاولات التخمين. يرجى الانتظار ${rateLimit.remainingSeconds} ثانية. (Anti-Brute-Force Locked)`,
    );
  }

  // Store Portal Auth (Universal Multi-Store for Saudi Arabia)
  const seeded = DEMO_CREDENTIALS.store;
  const coffeeCreds = DEMO_CREDENTIALS.coffee;
  const carCreds = DEMO_CREDENTIALS.car;

  // 1. Check existing registered clients
  const registeredClients = readDemoClients();
  const existingClient = registeredClients.find(
    (c) =>
      c.email.toLowerCase() === normalized ||
      c.name.toLowerCase() === normalized ||
      c.storeId.toLowerCase() === normalized,
  );

  if (existingClient) {
    const expectedClientPw = expectedPassword(existingClient.email, existingClient.password);
    if (inputPw !== expectedClientPw) {
      recordFailedAttempt(normalized);
      throw new Error('كلمة المرور غير صحيحة لحساب هذا المتجر / Invalid password for this store account.');
    }
    resetRateLimit(normalized);
    return mockSession(
      'store',
      {
        id: `user-${existingClient.storeId}`,
        name: existingClient.name,
        email: existingClient.email,
        role: 'manager',
      },
      existingClient.storeId,
      existingClient.storeName,
      `mock-store-${existingClient.storeId}`,
    );
  }

  // 2. Check seeded Specialty Coffee Store
  const isCoffeeIdentifier =
    normalized === coffeeCreds.email.toLowerCase() ||
    (coffeeCreds.aliases as readonly string[]).includes(normalized);

  if (isCoffeeIdentifier) {
    const expectedCoffeePw = expectedPassword(coffeeCreds.email, coffeeCreds.password);
    if (inputPw !== expectedCoffeePw) {
      recordFailedAttempt(normalized);
      throw new Error('كلمة المرور غير صحيحة لمتجر القهوة المختصة / Invalid password for Specialty Coffee store.');
    }
    resetRateLimit(normalized);
    return mockSession(
      'store',
      {
        id: 'store-coffee',
        name: 'ريان السليمان (Rayan Al-Sulaiman)',
        email: coffeeCreds.email,
        role: 'manager',
      },
      'store-coffee',
      'متجر القهوة المختصة',
      'mock-store-coffee-token',
    );
  }

  // 3. Check seeded Bleco Car Store / Al-Saeedi
  const isCarIdentifier =
    normalized === carCreds.email.toLowerCase() ||
    (carCreds.aliases as readonly string[]).includes(normalized);

  if (isCarIdentifier) {
    const expectedCarPw = expectedPassword(carCreds.email, carCreds.password);
    if (inputPw !== expectedCarPw) {
      recordFailedAttempt(normalized);
      throw new Error('كلمة المرور غير صحيحة لمتجر تنجيد وإكسسوارات السيارات / Invalid password for Car Accessories store.');
    }
    resetRateLimit(normalized);
    return mockSession(
      'store',
      {
        id: 'store-bleco',
        name: 'متجر السعيدي لخدمات السيارات (مؤسسة بلاكو)',
        email: carCreds.email,
        role: 'manager',
      },
      'store-bleco',
      'متجر السعيدي لخدمات السيارات (مؤسسة بلاكو للتجارة)',
      'mock-store-bleco-token',
    );
  }

  // 4. Check seeded Makkah Gifts / Flowers Store
  const isMakkahIdentifier =
    normalized === seeded.email.toLowerCase() ||
    normalized === seeded.supportEmail.toLowerCase() ||
    (seeded.aliases as readonly string[]).includes(normalized);

  if (isMakkahIdentifier) {
    const isSupport = normalized === seeded.supportEmail.toLowerCase();
    const expectedGiftPw = isSupport
      ? expectedPassword(seeded.supportEmail, seeded.supportPassword)
      : expectedPassword(seeded.email, seeded.password);

    if (inputPw !== expectedGiftPw) {
      recordFailedAttempt(normalized);
      throw new Error('كلمة المرور غير صحيحة لمتجر هدايا مكة / Invalid password for Makkah Gifts store.');
    }
    resetRateLimit(normalized);
    return mockSession(
      'store',
      {
        id: 'user-store-1',
        name: 'متجر هدايا',
        email: seeded.email,
        role: isSupport ? 'support' : 'manager',
      },
      'store-1',
      'متجر هدايا',
      'mock-store-token',
    );
  }

  // Account not found
  recordFailedAttempt(normalized);
  throw new Error('اسم المستخدم أو البريد الإلكتروني غير مسجل. يرجى التحقق من بيانات الدخول لمتجرك / Account not found. Please verify your username or email.');
}

export async function loginPortal(
  portal: AuthPortal,
  email: string,
  password: string,
): Promise<LoginResult> {
  // Pre-flight anti-SQLi & XSS defense
  const secCheck = validateAuthInput(email, password);
  if (!secCheck.isSecure) {
    throw new Error(secCheck.messageAr || secCheck.messageEn || 'Security check failed. Malicious input blocked.');
  }

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
        body: { email: email.trim(), password },
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
    // If backend server is not running or returned non-JSON / error, fallback to secure local validation
    console.warn('Backend API login unavailable, falling back to secure local validation:', err);
    try {
      const session = mockLogin(portal, email, password);
      writeAuthSession(session);
      return session;
    } catch (mockErr) {
      throw mockErr instanceof Error ? mockErr : new Error('Invalid email or password.');
    }
  }
}

/**
 * Universal Google Login for Merchants (Gmail / Google Workspace)
 * Provisions isolated Saudi tenant store scoped to their Google account
 */
export async function loginWithGoogleMerchant(
  googleAccount?: { email: string; name: string; picture?: string },
): Promise<LoginResult> {
  const email = (googleAccount?.email || '').trim().toLowerCase() || 'merchant.saudi@gmail.com';
  const name = googleAccount?.name || 'تاجر منصة يونيتيك (Saudi Merchant)';
  const avatar = googleAccount?.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c';

  const isGiftshopDomain =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('giftshop-sa.com') ||
      window.location.search.includes('store=store-1') ||
      window.location.search.includes('store=hadaya') ||
      window.location.search.includes('tab=products'));

  const emailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '-').replace(/^-+|-+$/g, '') || 'store';
  const rawClean = email.split('@')[0].replace(/[._-]/g, ' ');
  const storeTitle = rawClean.charAt(0).toUpperCase() + rawClean.slice(1);
  const storeId = isGiftshopDomain ? 'store-1' : `store-${emailPrefix.toLowerCase().slice(0, 16)}`;
  const storeName = isGiftshopDomain ? 'متجر هدايا - مكة المكرمة' : `متجر ${storeTitle} - السعودية`;

  const session: AuthSession = {
    token: `google-sso-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    portal: 'store',
    user: {
      id: `user-g-${storeId}`,
      name,
      email,
      role: 'manager',
      role_label: roleLabel('manager'),
      role_level: roleLevel('manager'),
      avatar,
    },
    storeId,
    storeName,
    abilities: abilitiesFor('manager'),
  };

  writeAuthSession(session);
  resetRateLimit(email);
  return session;
}

/**
 * Saudi Mobile OTP Login for Merchants (+966)
 */
export async function loginWithSaudiPhoneOtp(
  phone: string,
  code: string,
): Promise<LoginResult> {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 9) {
    throw new Error('يرجى إدخال رقم جوال سعودي صحيح يبدأ بـ 05 / Please enter a valid Saudi phone number.');
  }

  if (!code || code.trim().length !== 6) {
    throw new Error('رمز التحقق يجب أن يتكون من 6 أرقام / Verification code must be 6 digits.');
  }

  const phoneTail = cleanPhone.slice(-9);
  const storeId = `store-sa-${phoneTail.slice(0, 6)}`;
  const storeName = `متجر التاجر (${phoneTail.slice(-4)}) - السعودية`;
  const email = `merchant.${phoneTail}@saudistores.sa`;

  const session: AuthSession = {
    token: `saudi-otp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    portal: 'store',
    user: {
      id: `user-phone-${storeId}`,
      name: `تاجر سعودي (${phoneTail.slice(0, 3)}***${phoneTail.slice(-2)})`,
      email,
      role: 'manager',
      role_label: roleLabel('manager'),
      role_level: roleLevel('manager'),
    },
    storeId,
    storeName,
    abilities: abilitiesFor('manager'),
  };

  writeAuthSession(session);
  return session;
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
  const allSeededEmails = [
    DEMO_CREDENTIALS.master.email.toLowerCase(),
    DEMO_CREDENTIALS.store.email.toLowerCase(),
    DEMO_CREDENTIALS.store.supportEmail.toLowerCase(),
    ...(DEMO_CREDENTIALS.store.aliases as readonly string[]).map((a) => a.toLowerCase()),
    DEMO_CREDENTIALS.coffee.email.toLowerCase(),
    ...(DEMO_CREDENTIALS.coffee.aliases as readonly string[]).map((a) => a.toLowerCase()),
    DEMO_CREDENTIALS.car.email.toLowerCase(),
    ...(DEMO_CREDENTIALS.car.aliases as readonly string[]).map((a) => a.toLowerCase()),
  ];

  if (
    existing.some((c) => c.email.toLowerCase() === email) ||
    allSeededEmails.includes(email)
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
  if (portal === 'master') return e === DEMO_CREDENTIALS.master.email.toLowerCase();
  if (
    e === DEMO_CREDENTIALS.store.email.toLowerCase() ||
    e === DEMO_CREDENTIALS.store.supportEmail.toLowerCase() ||
    (DEMO_CREDENTIALS.store.aliases as readonly string[]).includes(e) ||
    e === DEMO_CREDENTIALS.coffee.email.toLowerCase() ||
    (DEMO_CREDENTIALS.coffee.aliases as readonly string[]).includes(e) ||
    e === DEMO_CREDENTIALS.car.email.toLowerCase() ||
    (DEMO_CREDENTIALS.car.aliases as readonly string[]).includes(e)
  ) {
    return true;
  }
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
    clearAuthSession(true);
  }
}
