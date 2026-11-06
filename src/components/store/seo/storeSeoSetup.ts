export type SeoSetupStep = 'need_email' | 'need_domain' | 'ready';

const FAKE_ID = /^(G-UNITYKSA|GTM-KSA9901)/i;
const FAKE_TAG = /KSA-.+-AUTO|properties\/398210451/i;

export function realTrackingId(value: string | null | undefined): string {
  const v = String(value || '').trim();
  if (!v || FAKE_ID.test(v) || FAKE_TAG.test(v)) return '';
  return v;
}

export function storePublicHost(store: { custom_domain?: string | null; domain?: string | null }): string {
  return String(store.custom_domain || store.domain || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .trim();
}

export function storeGoogleEmail(store: { ownerEmail?: string | null }): string {
  const email = String(store.ownerEmail || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

export function seoSetupStep(store: {
  ownerEmail?: string | null;
  custom_domain?: string | null;
  domain?: string | null;
}): SeoSetupStep {
  if (!storeGoogleEmail(store)) return 'need_email';
  if (!storePublicHost(store)) return 'need_domain';
  return 'ready';
}
