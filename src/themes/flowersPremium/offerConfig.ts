import { offerTemplateById, type OfferTemplateId } from './offerTemplates';

const STORAGE_PREFIX = 'unityteck_offer_popup_';
export const OFFER_PREVIEW_FLAG = 'unityteck_offer_preview_once';

function dismissKey(storeId: string) {
  return `unityteck_offer_dismissed_${storeId}`;
}

export function markOfferDismissed(storeId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(dismissKey(storeId), '1');
}

export function clearOfferDismissed(storeId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(dismissKey(storeId));
}

export function isOfferDismissed(storeId: string): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(dismissKey(storeId)) === '1';
}

export type StoreOfferConfig = {
  /** Default OFF — popup only when merchant turns this on */
  enabled: boolean;
  templateId: OfferTemplateId;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  code: string;
  discountPercent: number;
};

export function defaultOfferConfig(): StoreOfferConfig {
  const t = offerTemplateById('emerald');
  return {
    enabled: false,
    templateId: t.id,
    titleEn: t.titleEn,
    titleAr: t.titleAr,
    bodyEn: t.bodyEn,
    bodyAr: t.bodyAr,
    code: t.code,
    discountPercent: t.discountPercent,
  };
}

function storageKey(storeId: string) {
  return `${STORAGE_PREFIX}${storeId}`;
}

export function readOfferConfig(storeId: string): StoreOfferConfig {
  const base = defaultOfferConfig();
  if (typeof window === 'undefined') return base;
  try {
    const raw = localStorage.getItem(storageKey(storeId));
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<StoreOfferConfig>;
    return {
      ...base,
      ...parsed,
      enabled: Boolean(parsed.enabled),
      templateId: (parsed.templateId as OfferTemplateId) || base.templateId,
    };
  } catch {
    return base;
  }
}

export function writeOfferConfig(storeId: string, config: StoreOfferConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(storeId), JSON.stringify(config));
  if (config.enabled) {
    clearOfferDismissed(storeId);
  }
  window.dispatchEvent(new CustomEvent('unityteck:offer-config', { detail: { storeId } }));
}

/** Force popup once when merchant clicks View from dashboard */
export function flagOfferPreviewOnce(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(OFFER_PREVIEW_FLAG, '1');
}

export function consumeOfferPreviewOnce(): boolean {
  if (typeof window === 'undefined') return false;
  const v = sessionStorage.getItem(OFFER_PREVIEW_FLAG);
  if (v) sessionStorage.removeItem(OFFER_PREVIEW_FLAG);
  return Boolean(v);
}
