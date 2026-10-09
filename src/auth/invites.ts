/**
 * Master-generated onboarding invites (opaque tokens).
 * Phase 2.5: unique store_id reserved on generate + lang · RTL/LTR · currency · timezone.
 * Register blocked without valid unused invite. Laravel owns invites server-side later.
 */

export type OnboardingInvite = {
  /** Opaque public token (URL). Not an email. */
  token: string;
  /** Reserved unique tenant id — bound at generate, redeemed at register. */
  storeId: string;
  plan: 'free' | 'paid' | 'pro' | 'custom';
  label: string;
  /** Default storefront/admin language */
  locale: 'en' | 'ar';
  /** Text direction — usually follows locale; Master may override. */
  textDir: 'ltr' | 'rtl';
  currency: 'SAR' | 'USD' | 'AED' | 'EUR';
  timezone: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string | null;
  redeemedStoreId?: string | null;
};

const INVITES_KEY = 'unityteck_invites_v1';

export const ONBOARD_TIMEZONES = [
  'Asia/Riyadh',
  'Asia/Dubai',
  'Asia/Kuwait',
  'Asia/Bahrain',
  'Asia/Qatar',
  'Asia/Muscat',
  'Europe/London',
  'UTC',
] as const;

function readAll(): OnboardingInvite[] {
  try {
    const raw = localStorage.getItem(INVITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OnboardingInvite[];
    if (!Array.isArray(parsed)) return [];
    // Migrate pre-2.5 invites missing fields
    return parsed.map((i) => normalizeInvite(i));
  } catch {
    return [];
  }
}

function writeAll(list: OnboardingInvite[]): void {
  localStorage.setItem(INVITES_KEY, JSON.stringify(list));
}

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Unique store_id allocated when Master generates the invite. */
export function allocateStoreId(): string {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `store-${hex}`;
}

function normalizeInvite(raw: Partial<OnboardingInvite> & { token: string }): OnboardingInvite {
  const locale = raw.locale === 'ar' ? 'ar' : 'en';
  const textDir =
    raw.textDir === 'rtl' || raw.textDir === 'ltr'
      ? raw.textDir
      : locale === 'ar'
        ? 'rtl'
        : 'ltr';
  return {
    token: raw.token,
    storeId: raw.storeId && raw.storeId.startsWith('store-') ? raw.storeId : allocateStoreId(),
    plan: raw.plan ?? 'pro',
    label: raw.label ?? 'Merchant invite',
    locale,
    textDir,
    currency: (raw.currency as OnboardingInvite['currency']) || 'SAR',
    timezone: raw.timezone || 'Asia/Riyadh',
    createdAt: raw.createdAt || new Date().toISOString(),
    expiresAt: raw.expiresAt || new Date(Date.now() + 7 * 86400000).toISOString(),
    usedAt: raw.usedAt ?? null,
    redeemedStoreId: raw.redeemedStoreId ?? null,
  };
}

export function createOnboardingInvite(input?: {
  plan?: OnboardingInvite['plan'];
  label?: string;
  daysValid?: number;
  locale?: OnboardingInvite['locale'];
  textDir?: OnboardingInvite['textDir'];
  currency?: OnboardingInvite['currency'];
  timezone?: string;
  storeId?: string;
}): OnboardingInvite {
  const days = input?.daysValid ?? 7;
  const locale = input?.locale ?? 'en';
  const invite = normalizeInvite({
    token: randomToken(),
    storeId: input?.storeId || allocateStoreId(),
    plan: input?.plan ?? 'pro',
    label: input?.label?.trim() || 'Merchant invite',
    locale,
    textDir: input?.textDir ?? (locale === 'ar' ? 'rtl' : 'ltr'),
    currency: input?.currency ?? 'SAR',
    timezone: input?.timezone ?? 'Asia/Riyadh',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + days * 86400000).toISOString(),
    usedAt: null,
    redeemedStoreId: null,
  });

  // Ensure storeId uniqueness among active invites
  const existing = new Set(readAll().map((i) => i.storeId));
  let guard = 0;
  while (existing.has(invite.storeId) && guard < 5) {
    invite.storeId = allocateStoreId();
    guard += 1;
  }

  writeAll([invite, ...readAll()].slice(0, 50));
  return invite;
}

export function listOnboardingInvites(): OnboardingInvite[] {
  return readAll();
}

export type InviteCheck =
  | { ok: true; invite: OnboardingInvite }
  | { ok: false; reason: 'missing' | 'invalid' | 'used' | 'expired' };

/** Validate invite for the register wizard — no other client PII returned. */
export function checkInviteToken(token: string | null | undefined): InviteCheck {
  const t = (token || '').trim();
  if (!t) return { ok: false, reason: 'missing' };
  const invite = readAll().find((i) => i.token === t);
  if (!invite) return { ok: false, reason: 'invalid' };
  if (invite.usedAt) return { ok: false, reason: 'used' };
  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    return { ok: false, reason: 'expired' };
  }
  return { ok: true, invite: normalizeInvite(invite) };
}

export function redeemInviteToken(
  token: string,
  storeId: string,
): InviteCheck {
  const check = checkInviteToken(token);
  if (!check.ok) return check;
  const next = readAll().map((i) =>
    i.token === token
      ? {
          ...normalizeInvite(i),
          usedAt: new Date().toISOString(),
          redeemedStoreId: storeId,
        }
      : i,
  );
  writeAll(next);
  return { ok: true, invite: next.find((i) => i.token === token)! };
}

export function buildRegisterUrl(token: string): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/store/register?invite=${encodeURIComponent(token)}`;
}

export function readInviteFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('invite');
}
