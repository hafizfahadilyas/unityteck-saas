/** Drop huge embedded data-URLs so Hostinger JSON/page publish does not 500. */
const HEAVY_DATA_URL_RE = /^data:(image|video|application)\/[^;]+;base64,/i;
export const HEAVY_DATA_URL_MAX = 8_192;

export function stripHeavyDataUrls<T>(value: T, maxLen = HEAVY_DATA_URL_MAX): T {
  if (typeof value === 'string') {
    if (value.length > maxLen && HEAVY_DATA_URL_RE.test(value)) return '' as T;
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => stripHeavyDataUrls(item, maxLen)) as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = stripHeavyDataUrls(child, maxLen);
    }
    return out as T;
  }
  return value;
}

/** Best usable media URL from a library asset (CDN / optimized / original / thumb). */
export function resolveMediaAssetUrl(asset: {
  optimizedUrl?: string | null;
  webpUrl?: string | null;
  originalUrl?: string | null;
  thumbnailUrl?: string | null;
  avifUrl?: string | null;
  url?: string | null;
} | null | undefined): string {
  if (!asset) return '';
  const candidates = [
    asset.optimizedUrl,
    asset.webpUrl,
    asset.avifUrl,
    asset.originalUrl,
    asset.thumbnailUrl,
    asset.url,
  ];
  for (const raw of candidates) {
    const url = String(raw || '').trim();
    if (!url) continue;
    if (url.startsWith('data:') && url.length > HEAVY_DATA_URL_MAX) continue;
    return url;
  }
  return '';
}
