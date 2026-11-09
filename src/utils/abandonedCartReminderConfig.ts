/** Per-store abandoned-cart reminder message (local memory + optional API settings sync). */

const STORAGE_PREFIX = 'unityteck_abandoned_cart_reminder_';

export type AbandonedCartReminderConfig = {
  subjectEn: string;
  subjectAr: string;
  contentEn: string;
  contentAr: string;
  updatedAt?: string;
};

export const DEFAULT_ABANDONED_REMINDER: AbandonedCartReminderConfig = {
  subjectEn: 'You have items waiting in your store cart!',
  subjectAr: 'لديك منتجات بانتظارك في سلة متجرك!',
  contentEn:
    "Hello {name},\nWe noticed you left items in your cart at our store and haven't completed your order. Complete your purchase now and get a 10% discount with code {discount_code}!\n{checkout_link}",
  contentAr:
    'مرحباً {name}،\nلاحظنا أنك تركت منتجات في سلتك لدى متجرنا ولم تكمل عملية الشراء بعد. أكمل طلبك الآن واحصل على خصم بنسبة ١٠٪ باستخدام الكود {discount_code}!\n{checkout_link}',
};

function storageKey(storeId: string) {
  return `${STORAGE_PREFIX}${storeId}`;
}

export function readAbandonedCartReminder(storeId: string): AbandonedCartReminderConfig {
  const base = { ...DEFAULT_ABANDONED_REMINDER };
  if (typeof window === 'undefined' || !storeId) return base;
  try {
    const raw = localStorage.getItem(storageKey(storeId));
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<AbandonedCartReminderConfig>;
    return {
      subjectEn: String(parsed.subjectEn ?? base.subjectEn),
      subjectAr: String(parsed.subjectAr ?? base.subjectAr),
      contentEn: String(parsed.contentEn ?? base.contentEn),
      contentAr: String(parsed.contentAr ?? base.contentAr),
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return base;
  }
}

export function writeAbandonedCartReminder(
  storeId: string,
  config: AbandonedCartReminderConfig,
): AbandonedCartReminderConfig {
  const next: AbandonedCartReminderConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window === 'undefined' || !storeId) return next;
  localStorage.setItem(storageKey(storeId), JSON.stringify(next));
  return next;
}

export function mergeAbandonedReminderFromSettings(
  storeId: string,
  settings: Record<string, unknown> | null | undefined,
): AbandonedCartReminderConfig {
  const local = readAbandonedCartReminder(storeId);
  const remote = settings?.abandoned_cart_reminder;
  if (!remote || typeof remote !== 'object') return local;
  const r = remote as Partial<AbandonedCartReminderConfig>;
  const merged: AbandonedCartReminderConfig = {
    subjectEn: String(r.subjectEn ?? local.subjectEn),
    subjectAr: String(r.subjectAr ?? local.subjectAr),
    contentEn: String(r.contentEn ?? local.contentEn),
    contentAr: String(r.contentAr ?? local.contentAr),
    updatedAt: r.updatedAt || local.updatedAt,
  };
  writeAbandonedCartReminder(storeId, merged);
  return merged;
}
