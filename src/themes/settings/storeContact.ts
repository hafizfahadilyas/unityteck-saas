/**
 * Per-store contact single source of truth (WhatsApp + email + phone).
 * Identity (Theme Settings → Store Identity / Store Settings) wins everywhere:
 * header, footer, slider, FAB, page builder, checkout, invoice — store_id isolated.
 * Never invent demo numbers or borrow another store’s contact.
 */

import type { StoreIdentitySettings } from './storeIdentity';

export type StoreContactFallback = {
  id?: string;
  name?: string;
  phone?: string;
  whatsapp?: string;
  contactPhone?: string;
  email?: string;
  ownerEmail?: string;
  logo?: string;
};

const identityStorageKey = (storeId: string) => `unityteck_theme_identity_${storeId}`;

/** Read identity without importing storeIdentity (avoids circular deps). */
function readIdentityBlob(
  storeId: string,
  store?: StoreContactFallback | null,
): Partial<StoreIdentitySettings> {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(identityStorageKey(storeId));
      if (raw) return JSON.parse(raw) as Partial<StoreIdentitySettings>;
    }
  } catch {
    /* ignore */
  }
  return {
    phone: store?.phone || '',
    whatsapp: store?.whatsapp || '',
    email: '',
  };
}

export type StoreContact = {
  storeId: string;
  /** Display WhatsApp (merchant typed). */
  whatsapp: string;
  /** Digits for wa.me / tel — empty when unset. */
  whatsappDigits: string;
  phone: string;
  phoneDigits: string;
  /** Public support / invoice email — NOT login email. */
  email: string;
  hasWhatsApp: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
};

/** Retired seed / demo placeholders — never treat as live merchant contact. */
const RETIRED_CONTACT_DIGITS = new Set([
  '966549876543',
  '549876543',
  '966114892030',
  '114892030',
  '9668008440443',
  '8008440443',
  '966500000000',
  '500000000',
  '966581617712',
  '581617712',
  '966504428819',
  '504428819',
  '966125558920',
  '125558920',
  '966125558899',
  '125558899',
  '966567115867',
  '567115867',
]);

const RETIRED_EMAILS = new Set([
  'support@hibrew.sa',
  'sa.support@hibrew.com',
  'billing@makkah-gifts.sa',
  'support@tanjeedmakkah.com',
  'p4pakistan098@gmail.com',
]);

function digitsOnly(raw?: string | null): string {
  return String(raw || '').replace(/\D/g, '');
}

export function isRetiredContactDigits(raw?: string | null): boolean {
  const d = digitsOnly(raw);
  if (!d) return false;
  if (RETIRED_CONTACT_DIGITS.has(d)) return true;
  // Also match without country code variants already listed
  if (d.startsWith('966') && RETIRED_CONTACT_DIGITS.has(d.slice(3))) return true;
  return false;
}

export function scrubPublicEmail(raw?: string | null): string {
  const email = String(raw || '').trim();
  if (!email || !email.includes('@')) return '';
  if (RETIRED_EMAILS.has(email.toLowerCase())) return '';
  return email;
}

/** Digits-only Saudi / intl phone for wa.me — empty when unset or retired placeholder. */
export function normalizeWhatsAppDigits(raw?: string | null): string {
  let clean = digitsOnly(raw);
  if (!clean) return '';
  if (clean.startsWith('00')) clean = clean.slice(2);
  if (clean.startsWith('05')) clean = `966${clean.slice(1)}`;
  else if (clean.startsWith('5') && clean.length === 9) clean = `966${clean}`;
  if (isRetiredContactDigits(clean)) return '';
  return clean;
}

function pickDisplay(...candidates: Array<string | undefined | null>): string {
  for (const c of candidates) {
    const v = String(c || '').trim();
    if (!v) continue;
    if (isRetiredContactDigits(v)) continue;
    return v;
  }
  return '';
}

export function emptyStoreContact(storeId = ''): StoreContact {
  return {
    storeId,
    whatsapp: '',
    whatsappDigits: '',
    phone: '',
    phoneDigits: '',
    email: '',
    hasWhatsApp: false,
    hasEmail: false,
    hasPhone: false,
  };
}

/**
 * Resolve THIS store’s public contact only.
 * Priority WhatsApp: identity.whatsapp → identity.phone → store.whatsapp → store.phone
 * Email: identity.email only (login / ownerEmail never used on storefront).
 */
export function resolveStoreContact(
  storeId: string,
  store?: StoreContactFallback | null,
  identityOverride?: Partial<StoreIdentitySettings> | null,
): StoreContact {
  if (!storeId) return emptyStoreContact();

  const fallback: StoreContactFallback = {
    id: storeId,
    name: store?.name || '',
    phone: store?.phone,
    whatsapp: store?.whatsapp,
    contactPhone: store?.contactPhone,
    email: store?.email,
    ownerEmail: store?.ownerEmail,
    logo: store?.logo,
  };

  const identity = {
    ...readIdentityBlob(storeId, fallback),
    ...(identityOverride || {}),
  };

  const whatsappDisplay = pickDisplay(
    identity.whatsapp,
    identity.phone,
    fallback.whatsapp,
    fallback.phone,
    fallback.contactPhone,
  );
  const phoneDisplay = pickDisplay(identity.phone, fallback.phone, fallback.contactPhone);
  const email = scrubPublicEmail(identity.email);

  const whatsappDigits = normalizeWhatsAppDigits(whatsappDisplay);
  const phoneDigits = normalizeWhatsAppDigits(phoneDisplay);

  return {
    storeId,
    whatsapp: whatsappDisplay,
    whatsappDigits,
    phone: phoneDisplay,
    phoneDigits,
    email,
    hasWhatsApp: whatsappDigits.length >= 9,
    hasEmail: Boolean(email),
    hasPhone: phoneDigits.length >= 8,
  };
}

export function storeWhatsAppUrl(storeId: string, text?: string, store?: StoreContactFallback | null): string {
  const { whatsappDigits, hasWhatsApp } = resolveStoreContact(storeId, store);
  if (!hasWhatsApp) return '';
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${whatsappDigits}${q}`;
}

export function storeMailtoUrl(storeId: string, store?: StoreContactFallback | null): string {
  const { email, hasEmail } = resolveStoreContact(storeId, store);
  return hasEmail ? `mailto:${email}` : '';
}

type ThemeContactBlob = {
  updatedAt?: string;
  identity?: Partial<StoreIdentitySettings>;
  whatsappNumber?: string;
  phoneNumber?: string;
  emailAddress?: string;
  heroBanners?: { whatsappNumber?: string; [k: string]: unknown };
  customOrder?: { whatsappNumber?: string; [k: string]: unknown };
  footer?: {
    contactEmail?: string;
    contactPhone?: string;
    contactWhatsApp?: string;
    [k: string]: unknown;
  };
  maintenance?: { whatsappNumber?: string; [k: string]: unknown };
  customHeader?: {
    actions?: { whatsapp?: { phoneNumber?: string; [k: string]: unknown }; [k: string]: unknown };
    [k: string]: unknown;
  };
  [k: string]: unknown;
};

function applyContactToThemeBlob(
  data: ThemeContactBlob,
  waDisplay: string,
  waDigits: string,
  phone: string,
  email: string,
): void {
  if (data.identity) {
    if (waDisplay) data.identity.whatsapp = waDisplay;
    if (phone) data.identity.phone = phone;
    if (email) data.identity.email = email;
  }
  if (data.heroBanners) {
    data.heroBanners = { ...data.heroBanners, whatsappNumber: waDisplay || waDigits || '' };
  }
  if (data.customOrder) {
    data.customOrder = { ...data.customOrder, whatsappNumber: waDisplay || waDigits || '' };
  }
  if (data.footer) {
    data.footer = {
      ...data.footer,
      contactEmail: email || '',
      contactPhone: phone || '',
      contactWhatsApp: waDisplay || waDigits || '',
    };
  }
  if (data.maintenance) {
    data.maintenance = { ...data.maintenance, whatsappNumber: waDisplay || waDigits || '' };
  }
  if (waDisplay || waDigits) data.whatsappNumber = waDisplay || waDigits;
  if (phone) data.phoneNumber = phone;
  if (email) data.emailAddress = email;
  if (data.customHeader?.actions?.whatsapp) {
    data.customHeader = {
      ...data.customHeader,
      actions: {
        ...data.customHeader.actions,
        whatsapp: {
          ...data.customHeader.actions.whatsapp,
          phoneNumber: waDigits || '',
        },
      },
    };
  }
  data.updatedAt = new Date().toISOString();
}

/**
 * Push identity WhatsApp / email / phone into theme localStorage mirrors
 * (header / footer / hero / maintenance / page-builder) without re-entering
 * writeAllThemeSettings (avoids recursion with writeStoreIdentity).
 */
export function syncStoreContactIntoTheme(
  storeId: string,
  identity: Pick<StoreIdentitySettings, 'whatsapp' | 'phone' | 'email'>,
  store?: StoreContactFallback | null,
): void {
  if (!storeId || typeof localStorage === 'undefined') return;

  const contact = resolveStoreContact(storeId, store, identity);
  const waDisplay = contact.whatsapp || contact.phone;
  const waDigits = contact.whatsappDigits;
  const phone = contact.phone || contact.whatsapp;
  const email = contact.email;

  const prefix = `unityteck_theme_settings_`;
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix) && k.includes(storeId)) keys.push(k);
    }
  } catch {
    keys.push(`unityteck_theme_settings_full_${storeId}`);
  }
  if (!keys.includes(`unityteck_theme_settings_full_${storeId}`)) {
    keys.push(`unityteck_theme_settings_full_${storeId}`);
  }

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw) as ThemeContactBlob;
      applyContactToThemeBlob(data, waDisplay, waDigits, phone, email);
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      /* ignore corrupt blob */
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('unityteck-store-contact', {
        detail: { storeId, whatsappDigits: waDigits, email, phone },
      }),
    );
  }
}
