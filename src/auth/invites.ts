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

export type OnboardingInvite = {
  token: string;
  storeId: string;
  plan: 'free' | 'paid' | 'pro' | 'custom';
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
    plan: (row.plan as OnboardingInvite['plan']) ?? 'pro',
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
): Promise<InviteCheck> {
  if (!isApiEnabled()) {
    return { ok: false, reason: 'invalid' };
  }
  const res = await redeemOnboardingInviteApi(token, storeId);
  if (!res.ok) {
    const reason = res.reason === 'expired' || res.reason === 'used' ? res.reason : 'invalid';
    return { ok: false, reason };
  }
  return { ok: true, invite: mapRow(res.invite) };
}

export function buildRegisterUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/store/register?invite=${encodeURIComponent(token)}`;
}

export function readInviteFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('invite');
}
