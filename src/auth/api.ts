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
import {
  getStoreLoginEmailOverride,
  isStoreLoginEmailActive,
} from './storeEmailAccess';

export type LoginResult = AuthSession;

type LoginResponse = {
  token: string;
  portal: AuthPortal;
  user: AuthUser & { role_label?: string; role_level?: number };
  store_id?: string | null;
  store_name?: string | null;
  abilities?: string[];
};

/** Prefer document lang (prefs), else localStorage prefs — never mix AR+EN in one error string. */
function authIsAr(): boolean {
  try {
    if (typeof document !== 'undefined') {
      const lang = document.documentElement?.getAttribute('lang');
      if (lang === 'ar' || lang === 'en') return lang === 'ar';
    }
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('unityteck_prefs');
      if (raw) {
        const parsed = JSON.parse(raw) as { locale?: string };
        if (parsed?.locale === 'ar') return true;
        if (parsed?.locale === 'en') return false;
      }
    }
  } catch {
    /* ignore */
  }
  return false;
}

function authMsg(ar: string, en: string): string {
  return authIsAr() ? ar : en;
}

/** Default secure admin credentials per store (configurable via Vite env variables) */
export const DEMO_CREDENTIALS = {
  master: {
    email: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MASTER_ADMIN_EMAIL) || 'master@unityteck.com',
    password: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MASTER_ADMIN_PASSWORD) || 'UnityMaster@2026!Secure',
    name: 'Souq Platform SuperAdmin',
    aliases: ['master@unityteck.com', 'admin@unityteck.com', 'admin@giftshop-sa.com', 'master', 'admin', 'superadmin'],
  },
  store: {
    email: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STORE_ADMIN_EMAIL) || 'p4pakistan098@gmail.com',
    password: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_STORE_ADMIN_PASSWORD) || 'MakkahStore@2026!Secure',
    name: 'Makkah Gifts Store',
    storeId: 'store-1',
    aliases: [
      'p4pakistan098@gmail.com',
      'makkah',
      'ward',
      'giftshop',
      'store-1',
      'flowers',
      'gifts',
    ],
    supportEmail: 'p4pakistan098@gmail.com',
    supportPassword: 'WardSupport@2026!Secure',
  },
  coffee: {
    email: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_COFFEE_ADMIN_EMAIL) || 'mieraf.sa8@gmail.com',
    password: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_COFFEE_ADMIN_PASSWORD) || 'CoffeeStore@2026!Secure',
    name: 'Rayan Al-Sulaiman',
    storeId: 'store-coffee',
    aliases: [
      'mieraf.sa8@gmail.com',
      'coffee',
      'mieraf',
      'store-coffee',
    ],
  },
  car: {
    email: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CAR_ADMIN_EMAIL) || 'admin@bleco.sa',
    password: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CAR_ADMIN_PASSWORD) || 'BlackoStore@2026!Secure',
    name: 'Al-Saeedi Car Services',
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

export type RegisteredMerchant = {
  storeId: string;
  storeName: string;
  /** Canonical login email for this merchant */
  email: string;
  /** All emails / aliases that may open this store */
  emails: string[];
};

/** Emails that count as real login identifiers (skip short aliases like "coffee"). */
function emailLikeIdentifiers(values: readonly string[]): string[] {
  return values
    .map((v) => v.trim().toLowerCase())
    .filter((v) => v.includes('@'));
}

/**
 * Clerk development test emails (`+clerk_test`) skip real delivery and use OTP `424242`.
 * Strip the test subaddress so gate / membership still match the registered store email.
 * @see https://clerk.com/docs/guides/development/testing/test-emails-and-phones
 */
export function normalizeClerkDevLoginEmail(email: string): string {
  const normalized = String(email || '')
    .trim()
    .toLowerCase();
  const at = normalized.lastIndexOf('@');
  if (at <= 0) return normalized;
  const local = normalized.slice(0, at).replace(/\+clerk_test.*$/i, '');
  return `${local}@${normalized.slice(at + 1)}`;
}

/** True when the address is a Clerk reserved test email (no real inbox / fixed OTP). */
export function isClerkTestEmail(email: string): boolean {
  const normalized = String(email || '')
    .trim()
    .toLowerCase();
  const at = normalized.lastIndexOf('@');
  if (at <= 0) return false;
  return /\+clerk_test/i.test(normalized.slice(0, at));
}

/** Insert `+clerk_test` before @ so Clerk does not burn the monthly email quota. */
export function toClerkTestEmail(email: string): string {
  const normalized = normalizeClerkDevLoginEmail(email);
  const at = normalized.lastIndexOf('@');
  if (at <= 0) return normalized;
  return `${normalized.slice(0, at)}+clerk_test@${normalized.slice(at + 1)}`;
}

/**
 * Resolve URL ?store= / ?demo= param → canonical store id.
 * Empty / unknown → null (generic merchant portal).
 */
export function resolveStoreIdFromLoginParam(param: string | null | undefined): string | null {
  const p = String(param || '')
    .toLowerCase()
    .trim();
  if (!p) return null;
  if (p === 'coffee' || p === 'store-coffee' || p === 'specialtycoffee' || p === 'roasters') {
    return 'store-coffee';
  }
  if (
    p === 'bleco' ||
    p === 'store-bleco' ||
    p === 'car' ||
    p === 'cars' ||
    p === 'tanjeed' ||
    p === 'alsaeedi' ||
    p === 'blacko'
  ) {
    return 'store-bleco';
  }
  if (
    p === 'store-1' ||
    p === 'makkah' ||
    p === 'giftshop' ||
    p === 'flowers' ||
    p === 'gifts' ||
    p === 'hadaya' ||
    p === 'ward'
  ) {
    return 'store-1';
  }
  if (p.startsWith('store-')) return p;
  return null;
}

/** Seeded + locally registered merchants (one entry per store). */
export function listRegisteredMerchants(): RegisteredMerchant[] {
  const seeded: RegisteredMerchant[] = [
    {
      storeId: DEMO_CREDENTIALS.store.storeId,
      storeName: 'Makkah Flowers',
      email: DEMO_CREDENTIALS.store.email.toLowerCase(),
      emails: emailLikeIdentifiers([
        DEMO_CREDENTIALS.store.email,
        DEMO_CREDENTIALS.store.supportEmail,
        ...(DEMO_CREDENTIALS.store.aliases as readonly string[]),
      ]),
    },
    {
      storeId: DEMO_CREDENTIALS.coffee.storeId,
      storeName: 'HiBrew KSA',
      email: DEMO_CREDENTIALS.coffee.email.toLowerCase(),
      emails: emailLikeIdentifiers([
        DEMO_CREDENTIALS.coffee.email,
        ...(DEMO_CREDENTIALS.coffee.aliases as readonly string[]),
      ]),
    },
    {
      storeId: DEMO_CREDENTIALS.car.storeId,
      storeName: 'Al-Saeedi Car Services',
      email: DEMO_CREDENTIALS.car.email.toLowerCase(),
      emails: emailLikeIdentifiers([
        DEMO_CREDENTIALS.car.email,
        'owner@tanjeedmakkah.com',
        ...(DEMO_CREDENTIALS.car.aliases as readonly string[]),
      ]),
    },
  ];

  const registered = readDemoClients().map((c) => ({
    storeId: c.storeId,
    storeName: c.storeName,
    email: c.email.toLowerCase(),
    emails: [c.email.toLowerCase()],
  }));

  // Registered clients win over seeded if same storeId (keep both emails by merging)
  const byStore = new Map<string, RegisteredMerchant>();
  for (const m of [...seeded, ...registered]) {
    const prev = byStore.get(m.storeId);
    if (!prev) {
      byStore.set(m.storeId, { ...m, emails: [...new Set(m.emails)] });
      continue;
    }
    byStore.set(m.storeId, {
      storeId: m.storeId,
      storeName: m.storeName || prev.storeName,
      email: prev.email,
      emails: [...new Set([...prev.emails, ...m.emails])],
    });
  }

  // Live MySQL / Master override is preferred, but NEVER drop seeded store emails.
  // Exclusive wipe caused false "not registered" when localStorage override was stale
  // (e.g. coffee mieraf.sa8 blocked while UI said coffee store).
  return [...byStore.values()].map((m) => {
    const override = getStoreLoginEmailOverride(m.storeId);
    if (!override) return m;
    return {
      ...m,
      email: override,
      emails: [...new Set([override, ...m.emails])],
    };
  });
}

/** Find which registered store this email belongs to (or null). */
export function findRegisteredMerchantByEmail(email: string): RegisteredMerchant | null {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) return null;
  const accountEmail = normalizeClerkDevLoginEmail(normalized);

  const masterEmails = emailLikeIdentifiers([
    DEMO_CREDENTIALS.master.email,
    ...(DEMO_CREDENTIALS.master.aliases as readonly string[]),
  ]);
  if (
    masterEmails.includes(normalized) ||
    masterEmails.includes(accountEmail) ||
    normalized.includes('master@') ||
    accountEmail.includes('master@')
  ) {
    return null; // master is not a merchant store
  }

  for (const m of listRegisteredMerchants()) {
    if (m.emails.includes(normalized) || m.emails.includes(accountEmail)) return m;
  }
  return null;
}

export function isMasterLoginEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const accountEmail = normalizeClerkDevLoginEmail(normalized);
  const masterEmails = emailLikeIdentifiers([
    DEMO_CREDENTIALS.master.email,
    ...(DEMO_CREDENTIALS.master.aliases as readonly string[]),
  ]);
  return (
    masterEmails.includes(normalized) ||
    masterEmails.includes(accountEmail) ||
    normalized === 'master@unityteck.com' ||
    accountEmail === 'master@unityteck.com' ||
    normalized.startsWith('master@') ||
    accountEmail.startsWith('master@')
  );
}

/**
 * Strict store login gate:
 * - Only a registered merchant email may open a store.
 * - If URL targets a specific store, email must belong to that store.
 * - Coffee email cannot open Flowers, and vice versa.
 * - Master Admin Active/Inactive: inactive store email cannot login.
 */
export function assertStoreLoginEmailAllowed(
  email: string,
  storeParam?: string | null,
): RegisteredMerchant {
  const merchant = findRegisteredMerchantByEmail(email);
  if (!merchant) {
    throw new Error('STORE_EMAIL_UNREGISTERED');
  }

  const expectedStoreId = resolveStoreIdFromLoginParam(storeParam);
  if (expectedStoreId && merchant.storeId !== expectedStoreId) {
    throw new Error('STORE_EMAIL_WRONG_STORE');
  }

  if (!isStoreLoginEmailActive(merchant.storeId)) {
    throw new Error('STORE_EMAIL_INACTIVE');
  }

  return merchant;
}

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
  const fromApi = Array.isArray(data.abilities) ? data.abilities : [];
  const fromRole = abilitiesFor(role);
  // Expand legacy store:* / empty lists — role matrix is the floor for store owner/admin.
  let abilities = fromRole;
  if (fromApi.includes('*')) {
    abilities = ['*', ...fromRole];
  } else if (fromApi.includes('store:*') || fromApi.length === 0) {
    abilities = fromRole;
  } else {
    abilities = [...new Set([...fromRole, ...fromApi])];
  }
  return {
    token: data.token || 'auth-token',
    portal: data.portal,
    user: {
      ...data.user,
      role,
      role_label:
        data.user.role_label ||
        (data.portal === 'store' && role === 'admin' ? 'Store Owner' : roleLabel(role)),
      role_level: data.user.role_level ?? roleLevel(role),
    },
    storeId: data.store_id ?? null,
    storeName: data.store_name ?? null,
    abilities,
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
    throw new Error(
      authMsg(
        secCheck.messageAr || 'فشل فحص الأمان. تم اكتشاف إدخال غير آمن.',
        secCheck.messageEn || 'Security check failed. Malicious input detected.',
      ),
    );
  }

  const normalized = (identifier || '').trim().toLowerCase();
  const inputPw = (password || '').trim();

  if (!normalized) {
    throw new Error(
      authMsg(
        'يرجى إدخال اسم المستخدم أو البريد الإلكتروني.',
        'Username or email is required.',
      ),
    );
  }

  if (!inputPw || inputPw.length < 6) {
    throw new Error(
      authMsg(
        'كلمة المرور يجب ألا تقل عن ٦ خانات.',
        'Password must be at least 6 characters.',
      ),
    );
  }

  // Strictly block generic demo password "password"
  if (inputPw.toLowerCase() === 'password') {
    recordFailedAttempt(normalized);
    throw new Error(
      authMsg(
        'كلمة المرور غير صحيحة. يرجى إدخال كلمة المرور المعتمدة لمتجرك.',
        'Invalid password.',
      ),
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
          name: 'Souq Platform SuperAdmin',
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
        authMsg(
          `تم حظر الدخول مؤقتاً لحماية الحساب من محاولات التخمين. يرجى الانتظار ${rateLimitMaster.remainingSeconds} ثانية.`,
          `Login temporarily locked to protect the account. Please wait ${rateLimitMaster.remainingSeconds} seconds.`,
        ),
      );
    }

    recordFailedAttempt(normalized);
    throw new Error(
      authMsg(
        'بيانات دخول إدارة المنصة غير صحيحة.',
        'Invalid master credentials.',
      ),
    );
  }

  // 2. Rate limiting check (anti-brute-force)
  const rateLimit = getRateLimitStatus(normalized);
  if (rateLimit.isLocked) {
    throw new Error(
      authMsg(
        `تم حظر الدخول مؤقتاً لحماية الحساب من محاولات التخمين. يرجى الانتظار ${rateLimit.remainingSeconds} ثانية.`,
        `Login temporarily locked to protect the account. Please wait ${rateLimit.remainingSeconds} seconds.`,
      ),
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
      throw new Error(
        authMsg(
          'كلمة المرور غير صحيحة لحساب هذا المتجر.',
          'Invalid password for this store account.',
        ),
      );
    }
    resetRateLimit(normalized);
    return mockSession(
      'store',
      {
        id: `user-${existingClient.storeId}`,
        name: existingClient.name,
        email: existingClient.email,
        role: 'admin',
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
      throw new Error(
        authMsg(
          'كلمة المرور غير صحيحة لمتجر القهوة المختصة.',
          'Invalid password for Specialty Coffee store.',
        ),
      );
    }
    resetRateLimit(normalized);
    return mockSession(
      'store',
      {
        id: 'store-coffee',
        name: 'Rayan Al-Sulaiman',
        email: coffeeCreds.email,
        role: 'admin',
      },
      'store-coffee',
      'HiBrew KSA',
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
      throw new Error(
        authMsg(
          'كلمة المرور غير صحيحة لمتجر تنجيد وإكسسوارات السيارات.',
          'Invalid password for Car Accessories store.',
        ),
      );
    }
    resetRateLimit(normalized);
    return mockSession(
      'store',
      {
        id: 'store-bleco',
        name: 'Al-Saeedi Car Services',
        email: carCreds.email,
        role: 'admin',
      },
      'store-bleco',
      'Al-Saeedi Car Services',
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
      throw new Error(
        authMsg(
          'كلمة المرور غير صحيحة لمتجر هدايا مكة.',
          'Invalid password for Makkah Gifts store.',
        ),
      );
    }
    resetRateLimit(normalized);
    return mockSession(
      'store',
      {
        id: 'user-store-1',
        name: isSupport ? 'Makkah Gifts Support' : 'Makkah Gifts Store',
        email: seeded.email,
        role: isSupport ? 'support' : 'admin',
      },
      'store-1',
      'Makkah Flowers',
      'mock-store-token',
    );
  }

  // Account not found
  recordFailedAttempt(normalized);
  throw new Error(
    authMsg(
      'اسم المستخدم أو البريد الإلكتروني غير مسجل. يرجى التحقق من بيانات الدخول لمتجرك.',
      'Account not found. Please verify your username or email.',
    ),
  );
}

/**
 * Password login is permanently closed. Master / store admin must use email OTP (Clerk).
 * Kept as a hard guard so old callers cannot mint a session without OTP.
 */
export async function loginPortal(
  _portal: AuthPortal,
  _email: string,
  _password: string,
): Promise<LoginResult> {
  throw new Error(
    authMsg(
      'OTP_REQUIRED: تسجيل الدخول بكلمة المرور مغلق. استخدم رمز التحقق المرسل إلى البريد.',
      'OTP_REQUIRED: Password login is disabled. Use the email verification code.',
    ),
  );
}

/** Merchant Google sign-in is closed until a verified store account is linked. */
export async function loginWithGoogleMerchant(
  _googleAccount?: { email: string; name: string; picture?: string },
): Promise<LoginResult> {
  throw new Error('STORE_GOOGLE_UNAVAILABLE');
}

/**
 * Saudi mobile OTP for merchants — not wired to a real SMS gateway yet.
 * Never invent a store session from phone+code alone.
 */
export async function loginWithSaudiPhoneOtp(
  _phone: string,
  _code: string,
): Promise<LoginResult> {
  throw new Error(
    authMsg(
      'OTP_REQUIRED: تسجيل الدخول برمز الجوال غير مفعّل بعد. استخدم رمز التحقق عبر البريد.',
      'OTP_REQUIRED: Phone verification login is not enabled. Use the email verification code.',
    ),
  );
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
      role: 'admin',
      role_label: roleLabel('admin'),
      role_level: roleLevel('admin'),
    },
    storeId: client.storeId,
    storeName: client.storeName,
    abilities: abilitiesFor('admin'),
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

/** OTP validity window — 1 minute */
export const OTP_TTL_SECONDS = 60;

function mockRequestOtp(
  portal: AuthPortal,
  email: string,
  purpose: 'login' | 'reset',
): OtpRequestResult {
  const normalized = email.trim().toLowerCase();
  // Always issue a local OTP for login (passwordless). Reset still requires known email.
  if (purpose === 'reset' && !mockKnownEmail(portal, normalized)) {
    return {
      ok: true,
      message: 'If that email exists, a code was sent.',
      delivery: 'stubbed',
      expires_in: OTP_TTL_SECONDS,
    };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  try {
    const raw = sessionStorage.getItem(MOCK_OTP_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[`${portal}:${purpose}:${normalized}`] = code;
    sessionStorage.setItem(MOCK_OTP_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  return {
    ok: true,
    message: 'Verification code ready. SMTP not configured — use the on-screen code.',
    delivery: 'on_screen',
    expires_in: OTP_TTL_SECONDS,
    // Shown in UI when real email delivery is unavailable
    dev_code: code,
  };
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
    const res = await apiFetch<OtpRequestResult>('/auth/otp/request', {
      method: 'POST',
      body: { email: email.trim(), portal, purpose },
      skipAuth: true,
    });

    const delivery = (res.delivery || '').toLowerCase();
    const emailDelivered = delivery === 'email';

    // No real inbox delivery → keep a local copy of the same code for SPA login fallback
    if (purpose === 'login' && !emailDelivered) {
      if (res.dev_code) {
        try {
          const normalized = email.trim().toLowerCase();
          const raw = sessionStorage.getItem(MOCK_OTP_KEY);
          const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
          map[`${portal}:${purpose}:${normalized}`] = String(res.dev_code);
          sessionStorage.setItem(MOCK_OTP_KEY, JSON.stringify(map));
        } catch {
          /* ignore */
        }
        return {
          ...res,
          expires_in: OTP_TTL_SECONDS,
          message: 'SMTP not sending real mail — use the on-screen OTP code.',
        };
      }
      return mockRequestOtp(portal, email, purpose);
    }

    return {
      ...res,
      expires_in: OTP_TTL_SECONDS,
    };
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

/** Resolve a mock session from email/username after OTP succeeds (no password). */
function mockSessionFromEmail(portal: AuthPortal, identifier: string): AuthSession {
  const normalized = (identifier || '').trim().toLowerCase();
  if (!normalized) {
    throw new Error(
      authMsg('يرجى إدخال البريد الإلكتروني.', 'Email is required.'),
    );
  }

  if (portal === 'master') {
    const demo = DEMO_CREDENTIALS.master;
    const isMasterIdentifier =
      normalized === demo.email.toLowerCase() ||
      (demo.aliases as readonly string[]).includes(normalized);
    if (!isMasterIdentifier) {
      throw new Error(
        authMsg(
          'بيانات دخول إدارة المنصة غير صحيحة.',
          'Invalid master credentials.',
        ),
      );
    }
    return mockSession(
      'master',
      {
        id: 'user-master-1',
        name: 'Souq Platform SuperAdmin',
        email: demo.email,
        role: 'super_admin',
      },
      null,
      null,
      'mock-master-token',
    );
  }

  const seeded = DEMO_CREDENTIALS.store;
  const coffeeCreds = DEMO_CREDENTIALS.coffee;
  const carCreds = DEMO_CREDENTIALS.car;

  const registeredClients = readDemoClients();
  const existingClient = registeredClients.find(
    (c) =>
      c.email.toLowerCase() === normalized ||
      c.name.toLowerCase() === normalized ||
      c.storeId.toLowerCase() === normalized,
  );
  if (existingClient) {
    return mockSession(
      'store',
      {
        id: `user-${existingClient.storeId}`,
        name: existingClient.name,
        email: existingClient.email,
        role: 'admin',
      },
      existingClient.storeId,
      existingClient.storeName,
      `mock-store-${existingClient.storeId}`,
    );
  }

  const isCoffeeIdentifier =
    normalized === coffeeCreds.email.toLowerCase() ||
    (coffeeCreds.aliases as readonly string[]).includes(normalized);
  if (isCoffeeIdentifier) {
    return mockSession(
      'store',
      {
        id: 'store-coffee',
        name: 'Rayan Al-Sulaiman',
        email: coffeeCreds.email,
        role: 'admin',
      },
      'store-coffee',
      'HiBrew KSA',
      'mock-store-coffee-token',
    );
  }

  const isCarIdentifier =
    normalized === carCreds.email.toLowerCase() ||
    (carCreds.aliases as readonly string[]).includes(normalized);
  if (isCarIdentifier) {
    return mockSession(
      'store',
      {
        id: 'store-bleco',
        name: 'Al-Saeedi Car Services',
        email: carCreds.email,
        role: 'admin',
      },
      'store-bleco',
      'Al-Saeedi Car Services',
      'mock-store-bleco-token',
    );
  }

  const isMakkahIdentifier =
    normalized === seeded.email.toLowerCase() ||
    normalized === seeded.supportEmail.toLowerCase() ||
    (seeded.aliases as readonly string[]).includes(normalized);
  if (isMakkahIdentifier) {
    const isSupport = normalized === seeded.supportEmail.toLowerCase();
    return mockSession(
      'store',
      {
        id: 'user-store-1',
        name: isSupport ? 'Makkah Gifts Support' : 'Makkah Gifts Store',
        email: seeded.email,
        role: isSupport ? 'support' : 'admin',
      },
      'store-1',
      'Makkah Flowers',
      'mock-store-token',
    );
  }

  // Passwordless OTP: any verified email can open an isolated merchant session
  const emailPrefix =
    normalized.split('@')[0].replace(/[^a-zA-Z0-9]/g, '-').replace(/^-+|-+$/g, '') || 'store';
  const storeId = `store-${emailPrefix.toLowerCase().slice(0, 16)}`;
  const storeName = `متجر ${emailPrefix} - السعودية`;
  return mockSession(
    'store',
    {
      id: `user-otp-${storeId}`,
      name: emailPrefix,
      email: normalized,
      role: 'admin',
    },
    storeId,
    storeName,
    `mock-store-otp-${storeId}`,
  );
}

function consumeMockOtp(portal: AuthPortal, email: string, code: string): void {
  const normalized = email.trim().toLowerCase();
  const raw = sessionStorage.getItem(MOCK_OTP_KEY);
  const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
  const key = `${portal}:login:${normalized}`;
  if (map[key] !== code.trim()) {
    throw new Error(
      authMsg('رمز التحقق غير صحيح أو منتهي.', 'Invalid or expired code.'),
    );
  }
  delete map[key];
  sessionStorage.setItem(MOCK_OTP_KEY, JSON.stringify(map));
}

/**
 * Email OTP login — request code via requestOtp(), then verify + open lifetime session.
 */
/** Dedupe + cooldown so failed Clerk→Sanctum never infinite-loops (422/429 storms). */
const clerkExchangeInflight = new Map<string, Promise<AuthSession | null>>();
const clerkExchangeFailUntil = new Map<string, number>();

/**
 * Hostinger MySQL cold-start often 20–50s; exchange also does 2 Clerk Backend API calls.
 * 25s was aborting before Sanctum mint → login stuck / empty dashboard.
 */
export const CLERK_EXCHANGE_TIMEOUT_MS = 60_000;

function clerkExchangeKey(portal: AuthPortal, email: string, storeId?: string | null): string {
  return `${portal}:${email.trim().toLowerCase()}:${storeId || ''}`;
}

async function warmApiDatabase(timeoutMs = 45_000): Promise<void> {
  try {
    await apiFetch<{ status?: string; database?: string }>('/health', {
      method: 'GET',
      skipAuth: true,
      timeoutMs,
    });
  } catch {
    // Exchange will surface a real error if API/DB is still down
  }
}

export type ExchangeClerkOptions = {
  /** Skip fail-cooldown (use after fresh OTP). */
  force?: boolean;
  /** Throw instead of returning null so PortalLogin can toast + stay on OTP. */
  throwOnFail?: boolean;
};

/**
 * After Clerk verifies email OTP, mint a real Sanctum PAT so /products etc. work.
 * Requires the Clerk session JWT — email alone cannot mint a token.
 * Never writes a Clerk-JWT-only session; only persists after Sanctum mint succeeds.
 */
export async function exchangeClerkForSanctum(
  portal: AuthPortal,
  email: string,
  storeId?: string | null,
  clerkToken?: string | null,
  options?: ExchangeClerkOptions,
): Promise<AuthSession | null> {
  if (!isApiEnabled()) return null;

  const token = (clerkToken || '').trim();
  if (!token || token.startsWith('mock-') || token.includes('|')) {
    // Sanctum PAT / mock tokens are not Clerk proofs
    return null;
  }

  const key = clerkExchangeKey(portal, email, storeId);
  const force = options?.force === true;
  const throwOnFail = options?.throwOnFail === true;
  const failUntil = clerkExchangeFailUntil.get(key) ?? 0;
  if (!force && Date.now() < failUntil) {
    if (throwOnFail) {
      throw new Error(
        authMsg(
          'محاولة ربط الجلسة ما زالت قيد الانتظار. انتظر لحظات ثم أعد المحاولة.',
          'Session link still cooling down. Wait a moment and try again.',
        ),
      );
    }
    return null;
  }
  if (force) {
    clerkExchangeFailUntil.delete(key);
  }

  const inflight = clerkExchangeInflight.get(key);
  if (inflight) return inflight;

  const fail = (err: unknown): AuthSession | null => {
    const msg = err instanceof Error ? err.message : String(err);
    const backoffMs = /429|Too Many/i.test(msg)
      ? 45_000
      : /timeout|network|Failed to fetch|ECONNREFUSED|abort/i.test(msg)
        ? 4_000
        : 4_000;
    clerkExchangeFailUntil.set(key, Date.now() + backoffMs);
    console.warn('Clerk→Sanctum exchange unavailable:', err);
    if (
      throwOnFail ||
      /422|inactive|CLERK_SECRET|matching account|Unprocessable|timeout|abort/i.test(msg)
    ) {
      throw err instanceof Error ? err : new Error(msg);
    }
    return null;
  };

  const run = (async (): Promise<AuthSession | null> => {
    try {
      // Wake Hostinger PDO before the heavy Clerk+membership exchange.
      await warmApiDatabase(Math.min(45_000, CLERK_EXCHANGE_TIMEOUT_MS - 5_000));

      const data = await Promise.race([
        apiFetch<LoginResponse>('/auth/clerk/exchange', {
          method: 'POST',
          body: {
            email: email.trim().toLowerCase(),
            portal,
            store_id: storeId || undefined,
            clerk_token: token,
          },
          skipAuth: true,
          timeoutMs: CLERK_EXCHANGE_TIMEOUT_MS,
        }),
        new Promise<never>((_, reject) => {
          setTimeout(
            () =>
              reject(
                new Error(
                  authMsg(
                    'انتهت مهلة ربط الجلسة (قاعدة البيانات بطيئة). أعد إدخال رمز التحقق أو انتظر قليلاً ثم حاول مرة أخرى.',
                    'Session link timed out (database is slow). Re-enter the verification code, or wait a moment and try again.',
                  ),
                ),
              ),
            CLERK_EXCHANGE_TIMEOUT_MS,
          );
        }),
      ]);
      if (!data?.token || !data?.user) {
        return fail(
          new Error(
            authMsg(
              'تعذّر ربط الجلسة بقاعدة البيانات. أعد تسجيل الدخول.',
              'Could not link your session to the database. Sign in again.',
            ),
          ),
        );
      }
      // Reject Clerk JWT masquerading as Sanctum (must be PAT: id|hash)
      if (!data.token.includes('|')) {
        return fail(
          new Error(
            authMsg(
              'استجابة تسجيل الدخول غير صالحة. أعد المحاولة.',
              'Invalid login response. Try again.',
            ),
          ),
        );
      }
      clerkExchangeFailUntil.delete(key);
      const session = toSession(data);
      writeAuthSession(session);
      return session;
    } catch (err) {
      return fail(err);
    } finally {
      clerkExchangeInflight.delete(key);
    }
  })();

  clerkExchangeInflight.set(key, run);
  return run;
}

export async function loginWithEmailOtp(
  portal: AuthPortal,
  email: string,
  code: string,
): Promise<LoginResult> {
  const cleanEmail = email.trim();
  const cleanCode = code.trim();

  const secCheck = validateAuthInput(cleanEmail, cleanCode);
  if (!secCheck.isSecure) {
    throw new Error(
      authMsg(
        secCheck.messageAr || 'فشل فحص الأمان. تم حظر إدخال غير آمن.',
        secCheck.messageEn || 'Security check failed. Malicious input blocked.',
      ),
    );
  }

  if (!cleanCode || cleanCode.length !== 6) {
    throw new Error(
      authMsg(
        'رمز التحقق يجب أن يتكون من ٦ أرقام.',
        'Verification code must be 6 digits.',
      ),
    );
  }

  if (!isApiEnabled()) {
    throw new Error(
      authMsg(
        'OTP_REQUIRED: واجهة البرمجة غير مفعّلة — لا يمكن تسجيل الدخول بدون تحقق حقيقي.',
        'OTP_REQUIRED: API disabled — login requires live verification.',
      ),
    );
  }

  try {
    const data = await Promise.race([
      apiFetch<LoginResponse & { ok?: boolean; verified?: boolean }>('/auth/otp/verify', {
        method: 'POST',
        body: { email: cleanEmail, portal, purpose: 'login', code: cleanCode },
        skipAuth: true,
      }),
      new Promise<never>((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                authMsg(
                  'انتهت مهلة التحقق عبر رمز التحقق — الخادم غير متاح.',
                  'Verification login timeout — backend server unreachable',
                ),
              ),
            ),
          45_000,
        );
      }),
    ]);

    if (data?.token && data?.user) {
      const session = toSession(data);
      writeAuthSession(session);
      resetRateLimit(cleanEmail.toLowerCase());
      return session;
    }

    throw new Error(
      authMsg(
        'رمز التحقق غير صالح أو منتهٍ.',
        'Invalid or expired verification code.',
      ),
    );
  } catch (err) {
    // Never fall back to mock OTP when live API mode is on
    throw err instanceof Error
      ? err
      : new Error(
          authMsg(
            'رمز التحقق غير صالح أو منتهٍ.',
            'Invalid or expired verification code.',
          ),
        );
  }
}

export async function logoutPortal(): Promise<void> {
  // Clear local session FIRST so the UI never looks "stuck" on Sign out.
  const token = getAuthToken();
  clearAuthSession(true);

  // Best-effort remote logout — never block the login screen on a hung API.
  if (isApiEnabled() && token && !token.startsWith('mock-') && !token.startsWith('clerk-')) {
    void Promise.race([
      apiFetch('/auth/logout', { method: 'POST' }).catch(() => undefined),
      new Promise<void>((resolve) => setTimeout(resolve, 1500)),
    ]);
  }

  // Clear Clerk browser session — otherwise next OTP hits "already signed in".
  // Do not await forever; do not use redirectUrl (SPA navigates itself).
  try {
    const clerkApi =
      typeof window !== 'undefined'
        ? (
            window as Window & {
              Clerk?: { signOut?: (opts?: { redirectUrl?: string }) => Promise<void> };
            }
          ).Clerk
        : undefined;
    if (clerkApi?.signOut) {
      await Promise.race([
        // null redirect = stay in SPA (no full page reload)
        clerkApi.signOut({ redirectUrl: undefined }).catch(() => undefined),
        new Promise<void>((resolve) => setTimeout(resolve, 2000)),
      ]);
    }
  } catch {
    /* ignore Clerk sign-out failures */
  }
}
