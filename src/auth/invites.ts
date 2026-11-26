/**
 * Master onboarding invites — server truth when API live (Phase 1).
 * localStorage path retired on production API; dev mock only when API disabled.
 */

import { isApiEnabled } from '../api/client';
import {
  checkOnboardingInviteTokenApi,
  createOnboardingInviteApi,
  fetchOnboardingInvites,
  redeemOnboardingInviteApi,
} from '../api/tenantApi';

export type OnboardingInvitePlan =
  | 'free'
  | 'paid'
  | 'starter'
  | 'pro'
  | 'premium'
  | 'custom';

export type OnboardingInvite = {
  token: string;
  storeId: string;
  plan: OnboardingInvitePlan;
  label: string;
  locale: 'en' | 'ar';
  textDir: 'ltr' | 'rtl';
  currency: 'SAR' | 'USD' | 'AED' | 'EUR';
  timezone: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string | null;
  redeemedStoreId?: string | null;
};

export type OnboardProvisionPayload = {
  name?: string;
  slug?: string;
  owner_name?: string;
  email?: string;
  category?: string;
  phone?: string;
  city?: string;
  seed_starter_catalog?: boolean;
};

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

export type InviteCheck =
  | { ok: true; invite: OnboardingInvite }
  | { ok: false; reason: 'missing' | 'invalid' | 'used' | 'expired' };

function mapRow(row: Record<string, unknown>): OnboardingInvite {
  return {
    token: String(row.token ?? ''),
    storeId: String(row.storeId ?? row.store_id ?? ''),
    plan: (row.plan as OnboardingInvite['plan']) ?? 'premium',
    label: String(row.label ?? ''),
    locale: row.locale === 'ar' ? 'ar' : 'en',
    textDir: row.textDir === 'rtl' || row.text_dir === 'rtl' ? 'rtl' : 'ltr',
    currency: (row.currency as OnboardingInvite['currency']) || 'SAR',
    timezone: String(row.timezone ?? 'Asia/Riyadh'),
    createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
    expiresAt: String(row.expiresAt ?? row.expires_at ?? ''),
    usedAt: (row.usedAt ?? row.used_at ?? null) as string | null,
    redeemedStoreId: (row.redeemedStoreId ?? row.redeemed_store_id ?? null) as string | null,
  };
}

export async function createOnboardingInvite(input?: {
  plan?: OnboardingInvite['plan'];
  label?: string;
  daysValid?: number;
  locale?: OnboardingInvite['locale'];
  textDir?: OnboardingInvite['textDir'];
  currency?: OnboardingInvite['currency'];
  timezone?: string;
  storeId?: string;
}): Promise<OnboardingInvite> {
  if (!isApiEnabled()) {
    throw new Error('Onboarding invites require live API — enable VITE_USE_API or deploy.');
  }
  const res = await createOnboardingInviteApi({
    plan: input?.plan ?? 'pro',
    label: input?.label ?? 'Merchant invite',
    days_valid: input?.daysValid ?? 7,
    locale: input?.locale ?? 'en',
    text_dir: input?.textDir,
    currency: input?.currency ?? 'SAR',
    timezone: input?.timezone ?? 'Asia/Riyadh',
    store_id: input?.storeId,
  });
  return mapRow(res.data);
}

export async function listOnboardingInvites(): Promise<OnboardingInvite[]> {
  if (!isApiEnabled()) {
    return [];
  }
  const res = await fetchOnboardingInvites();
  return (res.data ?? []).map((row) => mapRow(row));
}

export async function checkInviteToken(
  token: string | null | undefined,
): Promise<InviteCheck> {
  const t = (token || '').trim();
  if (!t) return { ok: false, reason: 'missing' };
  if (!isApiEnabled()) {
    return { ok: false, reason: 'invalid' };
  }
  const res = await checkOnboardingInviteTokenApi(t);
  if (!res.ok) {
    const reason = res.reason === 'expired' || res.reason === 'used' ? res.reason : 'invalid';
    return { ok: false, reason };
  }
  return { ok: true, invite: mapRow(res.invite) };
}

export async function redeemInviteToken(
  token: string,
  storeId: string,
  provision?: OnboardProvisionPayload,
): Promise<InviteCheck & { defaultThemeId?: string; provisioned?: boolean }> {
  if (!isApiEnabled()) {
    return { ok: false, reason: 'invalid' };
  }
  const res = await redeemOnboardingInviteApi(token, storeId, provision);
  if (!res.ok) {
    const reason = res.reason === 'expired' || res.reason === 'used' ? res.reason : 'invalid';
    return { ok: false, reason };
  }
  return {
    ok: true,
    invite: mapRow(res.invite),
    defaultThemeId:
      typeof res.default_theme_id === 'string'
        ? res.default_theme_id
        : 'theme-souq-common-retail',
    provisioned: Boolean(res.provisioned),
  };
}

/** Short public share URL — https://host/join/Ab3xK9m2 */
export function buildRegisterUrl(token: string): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://mieraf-ksa.com';
  const code = String(token || '').trim();
  if (!code) return `${origin}/store/register`;
  return `${origin}/join/${encodeURIComponent(code)}`;
}

/** Legacy long query URL (still valid). */
export function buildRegisterUrlLegacy(token: string): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://mieraf-ksa.com';
  return `${origin}/store/register?invite=${encodeURIComponent(token)}`;
}

export function readInviteFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  const q = new URLSearchParams(window.location.search).get('invite');
  if (q && q.trim()) return q.trim();
  const path = window.location.pathname.replace(/\/+$/, '');
  const m = path.match(/^\/(?:join|j|onboard)\/([^/]+)$/i);
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}
