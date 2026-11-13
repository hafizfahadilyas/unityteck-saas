/**
 * Per-store media isolation helpers.
 * Coffee must never display flower/hadaya bouquet assets (and vice versa).
 */

const FLOWER_MEDIA_RE =
  /hadaya_|bouquet|peon(?:y|ies)|floral|flora[_-]|roses?_bouquet|orchid|ورد|باقة|زهور|زهر|جوري|florist|giftshop.?flower/i;

/** Known Salla CDN demo bouquet wrongly reused on coffee PD/E2E products. */
const KNOWN_FLOWER_CDN = [
  'cdn.salla.sa/form-builder/iN2hGSe4EYU7Jl2Jt6U5uk9swZaHsPbJnnqpNpac.png',
];

const COFFEE_MEDIA_RE =
  /hibrew|coffee[_-]?machine|espresso|barista|product_machine_|grinder|mill_g5|v60|pour.?over|قهوة|إسبريسو|باريستا/i;

export const COFFEE_FALLBACK_IMAGE = '/images/product_machine_silver_pro.png';
export const FLOWERS_FALLBACK_IMAGE = '/images/hadaya_saudi_luxury_bouquet_1791300211553.webp';

export function isFlowerMediaUrl(url: string | null | undefined): boolean {
  const u = String(url || '').trim();
  if (!u) return false;
  if (KNOWN_FLOWER_CDN.some((needle) => u.includes(needle))) return true;
  return FLOWER_MEDIA_RE.test(u);
}

export function isCoffeeMediaUrl(url: string | null | undefined): boolean {
  const u = String(url || '').trim();
  if (!u) return false;
  return COFFEE_MEDIA_RE.test(u);
}

/** Return a store-safe image URL (or empty / fallback). Never invent commerce rows — only strip foreign media. */
export function isolateStoreProductImage(
  storeId: string | null | undefined,
  url: string | null | undefined,
  opts?: { fallback?: boolean },
): string {
  const sid = String(storeId || '').trim();
  const raw = String(url || '').trim();
  if (!raw) return opts?.fallback && sid === 'store-coffee' ? COFFEE_FALLBACK_IMAGE : '';

  if (sid === 'store-coffee' || sid === 'coffee' || sid.includes('coffee')) {
    if (isFlowerMediaUrl(raw)) {
      return opts?.fallback === false ? '' : COFFEE_FALLBACK_IMAGE;
    }
    return raw;
  }

  if (sid === 'store-1' || sid.includes('flower') || sid.includes('gift')) {
    if (isCoffeeMediaUrl(raw) && !isFlowerMediaUrl(raw)) {
      return opts?.fallback === false ? '' : FLOWERS_FALLBACK_IMAGE;
    }
    return raw;
  }

  return raw;
}
