/**
 * Store logo helpers — reject placeholder tokens (flower/store/coffee)
 * so Master/Store avatars never render a broken blank circle.
 */

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)(\?.*)?$/i;

/** True when value is a real usable image URL/path (not emoji / keyword placeholders). */
export function isUsableStoreLogoUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return false;
  if (/^(flower|store|coffee|car|logo|emoji|null|undefined)$/i.test(v)) return false;
  if (v.startsWith('data:image/') || v.startsWith('blob:')) return true;
  if (/^https?:\/\//i.test(v)) return true;
  if (v.startsWith('//') && v.length > 4) return true;
  if (v.startsWith('/') && (IMAGE_EXT.test(v) || v.includes('/images/') || v.includes('/media/') || v.includes('/uploads/') || v.includes('/storage/'))) {
    return true;
  }
  return false;
}

/** Normalize API/store logo for <img src>. Empty string → caller should use icon fallback. */
export function resolveStoreLogoSrc(value: unknown): string {
  if (!isUsableStoreLogoUrl(value)) return '';
  return value.trim();
}
