/**
 * Prefer cut-out / isolated product shots (no lifestyle BG) for cards & mega menu.
 * Hero/banner lifestyle photos stay untouched.
 * Live store-coffee catalog = 5 KSA almari SKUs only (zero-mock).
 * Product shots ship as transparent PNG (white studio BG removed).
 */

const BY_PRODUCT_ID: Record<string, string> = {
  'hb-almari-fluted-oak': '/images/ksa_almari_fluted_oak.png',
  'hb-almari-white-marble': '/images/hb_jeddah_blackgold_cut_1125.png',
  'hb-almari-makkah-corner': '/images/ksa_almari_makkah_corner.png',
  'hb-almari-najdi-heritage': '/images/ksa_almari_najdi_heritage.png',
  'hb-almari-dual-door-villa': '/images/ksa_almari_dual_door_villa.png',
};

const BY_PATH_FRAGMENT: Array<[RegExp, string]> = [
  [/ksa_almari_fluted_oak|almari-fluted-oak/i, '/images/ksa_almari_fluted_oak.png'],
  [/ksa_almari_white_marble|ksa_almari_golden|ksa_almari_black_gold|hb_jeddah_blackgold|almari-white-marble/i, '/images/hb_jeddah_blackgold_cut_1125.png'],
  [/ksa_almari_makkah_corner|almari-makkah/i, '/images/ksa_almari_makkah_corner.png'],
  [/ksa_almari_najdi_heritage|almari-najdi/i, '/images/ksa_almari_najdi_heritage.png'],
  [/ksa_almari_dual_door_villa|almari-dual-door/i, '/images/ksa_almari_dual_door_villa.png'],
];

/** Remap legacy JPG / white-marble / golden almari URLs → current transparent PNG. */
export function coffeeAlmariPngUrl(url?: string | null): string {
  const raw = String(url || '').trim();
  if (!raw) return '';
  for (const [re, path] of BY_PATH_FRAGMENT) {
    if (re.test(raw)) return path;
  }
  const m = raw.match(/^(.*\/images\/ksa_almari_[a-z0-9_]+)\.(jpe?g|webp)(\?.*)?$/i);
  if (m) return `${m[1]}.png${m[3] || ''}`;
  return raw;
}

/** Card / mega-menu / grid — isolated product cutout when known. */
export function coffeeIsolatedCardImage(productId?: string | null, fallbackUrl?: string | null): string {
  const id = String(productId || '').trim();
  if (id && BY_PRODUCT_ID[id]) return BY_PRODUCT_ID[id];
  const url = coffeeAlmariPngUrl(fallbackUrl);
  if (!url) return id && BY_PRODUCT_ID[id] ? BY_PRODUCT_ID[id] : '';
  for (const [re, path] of BY_PATH_FRAGMENT) {
    if (re.test(url) || re.test(id)) return path;
  }
  return url;
}
