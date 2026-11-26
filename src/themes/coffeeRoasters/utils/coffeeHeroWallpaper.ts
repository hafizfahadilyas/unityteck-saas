/**
 * Hero wallpaper URLs — full-bleed scenic shots for object-fit:cover.
 * Square product cutouts (ksa_almari_*.png) must never be used as wallpaper.
 */

type WallpaperPair = { desktop: string; mobile: string; desktopJpg: string; mobileJpg: string };

const BY_SKU: Record<string, WallpaperPair> = {
  'hb-almari-fluted-oak': {
    desktop: '/images/coffee_wallpaper_oak_desktop.webp',
    mobile: '/images/coffee_wallpaper_oak_mobile.webp',
    desktopJpg: '/images/coffee_wallpaper_oak_desktop.jpg',
    mobileJpg: '/images/coffee_wallpaper_oak_mobile.jpg',
  },
  'hb-almari-white-marble': {
    desktop: '/images/coffee_wallpaper_marble_desktop.webp',
    mobile: '/images/coffee_wallpaper_marble_mobile.webp',
    desktopJpg: '/images/coffee_wallpaper_marble_desktop.jpg',
    mobileJpg: '/images/coffee_wallpaper_marble_mobile.jpg',
  },
  'hb-almari-najdi-heritage': {
    desktop: '/images/coffee_wallpaper_najdi_heritage_desktop.webp',
    mobile: '/images/coffee_wallpaper_najdi_heritage_mobile.webp',
    desktopJpg: '/images/coffee_wallpaper_najdi_heritage_desktop.jpg',
    mobileJpg: '/images/coffee_wallpaper_najdi_heritage_mobile.jpg',
  },
  'hb-almari-dual-door-villa': {
    desktop: '/images/coffee_wallpaper_villa_desktop.webp',
    mobile: '/images/coffee_wallpaper_villa_mobile.webp',
    desktopJpg: '/images/coffee_wallpaper_villa_desktop.jpg',
    mobileJpg: '/images/coffee_wallpaper_villa_mobile.jpg',
  },
  'hb-almari-makkah-corner': {
    desktop: '/images/coffee_wallpaper_makkah_desktop.webp',
    mobile: '/images/coffee_wallpaper_makkah_mobile.webp',
    desktopJpg: '/images/coffee_wallpaper_makkah_desktop.jpg',
    mobileJpg: '/images/coffee_wallpaper_makkah_mobile.jpg',
  },
};

const BY_FRAGMENT: Array<[RegExp, WallpaperPair]> = [
  [/fluted_oak|almari-fluted-oak/i, BY_SKU['hb-almari-fluted-oak']],
  [/white_marble|almari-white-marble/i, BY_SKU['hb-almari-white-marble']],
  [/najdi_heritage|almari-najdi/i, BY_SKU['hb-almari-najdi-heritage']],
  [/dual_door_villa|almari-dual-door/i, BY_SKU['hb-almari-dual-door-villa']],
  [/makkah_corner|almari-makkah/i, BY_SKU['hb-almari-makkah-corner']],
];

/** True when URL is a square product cutout — unsafe as hero wallpaper. */
export function isCoffeeProductCutoutUrl(url?: string | null): boolean {
  return /\/images\/ksa_almari_[a-z0-9_]+\.(png|jpe?g|webp)/i.test(String(url || ''));
}

function pairFor(productId?: string | null, url?: string | null): WallpaperPair | null {
  const id = String(productId || '').trim();
  if (id && BY_SKU[id]) return BY_SKU[id];
  const blob = `${id} ${url || ''}`;
  for (const [re, pair] of BY_FRAGMENT) {
    if (re.test(blob)) return pair;
  }
  return null;
}

/**
 * Resolve a cover-safe wallpaper URL.
 * Remaps product cutouts → scenic wallpaper; prefers WebP.
 */
export function coffeeHeroWallpaperUrl(opts: {
  url?: string | null;
  productId?: string | null;
  mobile?: boolean;
}): string {
  const raw = String(opts.url || '').trim();
  const pair = pairFor(opts.productId, raw);
  const wantMobile = Boolean(opts.mobile);

  if (pair && (isCoffeeProductCutoutUrl(raw) || !raw)) {
    return wantMobile ? pair.mobile : pair.desktop;
  }

  if (!raw) {
    if (!pair) return '';
    return wantMobile ? pair.mobile : pair.desktop;
  }

  // Prefer webp twin for already-scenic hero/wallpaper JPG paths.
  if (/\.(jpe?g)(\?.*)?$/i.test(raw) && /coffee_(wallpaper|hero_almari)/i.test(raw)) {
    return raw.replace(/\.(jpe?g)(\?.*)?$/i, '.webp$2');
  }

  return raw;
}

export function coffeeHeroWallpaperJpgFallback(webpOrAny: string): string {
  const s = String(webpOrAny || '').trim();
  if (!s) return '';
  if (/\.webp(\?.*)?$/i.test(s)) return s.replace(/\.webp(\?.*)?$/i, '.jpg$1');
  return s;
}
