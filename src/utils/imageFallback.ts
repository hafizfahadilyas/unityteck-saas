/**
 * Standard Image Fallback Utilities
 * Provides resilient fallbacks for products, banners, and icons.
 * Guarantees zero broken image icons across all dashboards and storefronts.
 */

export const FALLBACK_PRODUCT_IMAGE =
  '/images/hadaya_saudi_luxury_bouquet_1791300211553.webp';

export const FALLBACK_STORE_LOGO =
  '/images/logo.png';

/**
 * Clean inline SVG data URL for instant zero-network fallback
 */
export const FALLBACK_SVG_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23f1f5f9"/><path d="M70 130 L95 100 L115 120 L130 105 L150 130 Z" fill="%23cbd5e1"/><circle cx="85" cy="80" r="12" fill="%23cbd5e1"/></svg>';

/**
 * Validates that an image URL is non-empty and has a valid protocol/scheme
 * (handles http, https, data:image, blob, relative path, svg)
 */
export function isValidMediaUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  if (!t) return false;
  return (
    t.startsWith('http://') ||
    t.startsWith('https://') ||
    t.startsWith('data:image/') ||
    t.startsWith('blob:') ||
    t.startsWith('/') ||
    t.startsWith('./')
  );
}

/**
 * Normalize any legacy /src/assets/images/ paths to canonical /images/
 */
export function cleanImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return FALLBACK_PRODUCT_IMAGE;
  let trimmed = url.trim();
  if (trimmed.startsWith('./src/assets/images/')) {
    trimmed = trimmed.replace('./src/assets/images/', '/images/');
  }
  if (trimmed.startsWith('/src/assets/images/')) {
    trimmed = trimmed.replace('/src/assets/images/', '/images/');
  }
  return trimmed;
}

/**
 * Image error handler that prevents infinite loop and falls back to a clean placeholder
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback: string = FALLBACK_PRODUCT_IMAGE,
) {
  const target = e.currentTarget;
  const currentSrc = target.getAttribute('src') || target.src || '';

  // If broken path had src/assets/images/, first try canonical /images/
  if (currentSrc.includes('src/assets/images/')) {
    target.src = currentSrc.replace(/^.*src\/assets\/images\//, '/images/');
    return;
  }

  if (!target.dataset.fallbackApplied) {
    target.dataset.fallbackApplied = 'true';
    target.src = fallback;
  } else if (target.dataset.fallbackApplied === 'true') {
    target.dataset.fallbackApplied = 'final';
    target.src = FALLBACK_SVG_PLACEHOLDER;
  }
}

/**
 * Resilient Catalog Image Mappings for instant resolution regardless of stale cache/localStorage
 */
export const KNOWN_PRODUCT_CATALOG_IMAGES: Record<string, string> = {
  // Ethiopian Coffee
  'COF-ETH-01': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
  // Colombian Geisha
  'COF-COL-02': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  // V60 Kit
  'COF-KIT-03': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  // Precision Hand Grinder
  'COF-GRIND-04': '/images/coffee_grinder_mill_banner_1791218928342.jpg',
  // Espresso Blend 1kg / 250g
  'COF-ESP-05': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  'COF-ESP-03': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  // Cold Brew
  'COF-CB-06': 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
  // Costa Rica Tarrazu
  'COF-CR-07': 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=800&q=80',
  // Yemeni Haraz Mocha
  'COF-YEM-08': 'https://images.unsplash.com/photo-1610632380989-680fe40816c6?auto=format&fit=crop&w=800&q=80',
  // Fellow Stagg EKG Kettle
  'COF-STG-09': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
  // Chemex
  'COF-CHM-10': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
  // Acaia Lunar Scale
  'COF-ACA-11': 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=800&q=80',
  // Milk Pitcher
  'COF-PIT-12': 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80',
  // HiBrew Flagship Machines (Pure PNG catalog)
  'hb-h10a-dualboiler': '/images/hibrew_h7a_flagship_machine.png',
  'hb-barista-silver-pro': '/images/product_machine_silver_pro.png',
  'hb-smart-capsule-compact': '/images/product_machine_compact_black.png',
  'hb-thermal-drip-brewer': '/images/product_machine_drip_carafe.png',
  'hb-classic-duo-espresso': '/images/product_machine_delonghi_black.png',
  // Luxury Flowers & Hadaya Makkah Catalog (Pure Local Images)
  'WM-PEONY-05': '/images/hadaya_pink_peonies_1791216156090.jpg',
  'wm-peony-05': '/images/hadaya_pink_peonies_1791216156090.jpg',
  'WM-VAL-06': '/images/hadaya_red_roses_bouquet_1791276749666.jpg',
  'wm-val-06': '/images/hadaya_red_roses_bouquet_1791276749666.jpg',
  'WM-ROSE-01': '/images/hadaya_red_roses_bouquet_1791276749666.jpg',
  'wm-rose-01': '/images/hadaya_red_roses_bouquet_1791276749666.jpg',
  'WM-WHITE-02': '/images/hadaya_white_roses_bouquet_1791276726730.jpg',
  'wm-white-02': '/images/hadaya_white_roses_bouquet_1791276726730.jpg',
  'WM-ORCHID-03': '/images/hadaya_white_orchid_penthouse_1791218732789.jpg',
  'wm-orchid-03': '/images/hadaya_white_orchid_penthouse_1791218732789.jpg',
  'WM-LUXURY-04': '/images/hadaya_luxury_gift_set_1791216170853.jpg',
  'wm-luxury-04': '/images/hadaya_luxury_gift_set_1791216170853.jpg',
  'WM-WED-07': '/images/hadaya_royal_wedding_flowers_1791300194084.jpg',
  'wm-wed-07': '/images/hadaya_royal_wedding_flowers_1791300194084.jpg',
  'WM-SAUDI-08': '/images/hadaya_saudi_luxury_bouquet_1791300211553.jpg',
  'wm-saudi-08': '/images/hadaya_saudi_luxury_bouquet_1791300211553.jpg',
  'WM-WOMEN-01': '/images/hadaya_women_luxury_gift_zedaan.webp',
  'women-gift-1': '/images/hadaya_women_luxury_gift_zedaan.webp',
  'WM-MEN-01': '/images/hadaya_men_luxury_gift_1791219799100.jpg',
  'men-gift-1': '/images/hadaya_men_luxury_gift_1791219799100.jpg',
  'WM-CAKE-01': '/images/hadaya_luxury_velvet_cake_1791218716453.jpg',
  'cake-1': '/images/hadaya_luxury_velvet_cake_1791218716453.jpg',
};

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآء]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .trim();
}

/**
 * Universal resolver that always finds the correct real catalog image
 * Even if order items in stale cache/localStorage are missing image URLs
 */
export function resolveProductThumbnail(item?: {
  image?: string;
  id?: string;
  sku?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  product_name?: string;
} | null): string {
  if (!item) return FALLBACK_PRODUCT_IMAGE;
  if (item.image && typeof item.image === 'string' && item.image.trim().length > 5) {
    return item.image;
  }

  // 1. Direct SKU or ID match
  const sku = (item.sku || '').toUpperCase();
  if (sku && KNOWN_PRODUCT_CATALOG_IMAGES[sku]) {
    return KNOWN_PRODUCT_CATALOG_IMAGES[sku];
  }
  const id = (item.id || '').toLowerCase();
  if (id && KNOWN_PRODUCT_CATALOG_IMAGES[id]) {
    return KNOWN_PRODUCT_CATALOG_IMAGES[id];
  }

  // 2. Keyword matching on product name with Arabic & English normalization
  const combinedNames = [item.name, item.nameAr, item.nameEn, item.product_name, item.id, item.sku]
    .filter(Boolean)
    .join(' ');
  const norm = normalizeSearchText(combinedNames);

  if (norm) {
    // ── Coffee Roasters Catalog ──
    if (norm.includes('اثيوبيا') || norm.includes('يرقاتشيفي') || norm.includes('يرغاتشيفي') || norm.includes('yirgacheffe') || norm.includes('ethiopia')) {
      return KNOWN_PRODUCT_CATALOG_IMAGES['COF-ETH-01'];
    }
    if (norm.includes('كولومبيا') || norm.includes('غيشا') || norm.includes('جيشا') || norm.includes('geisha') || norm.includes('colombia')) {
      return KNOWN_PRODUCT_CATALOG_IMAGES['COF-COL-02'];
    }
    if (norm.includes('اكايا') || norm.includes('لونار') || norm.includes('acaia') || norm.includes('lunar') || (norm.includes('ميزان') && norm.includes('اسبريسو'))) {
      return KNOWN_PRODUCT_CATALOG_IMAGES['COF-ACA-11'];
    }
    if (norm.includes('حراز') || norm.includes('يمن') || norm.includes('موكا بري') || norm.includes('haraz') || norm.includes('yemen')) {
      return KNOWN_PRODUCT_CATALOG_IMAGES['COF-YEM-08'];
    }
    if (norm.includes('ستاغ') || norm.includes('stagg') || norm.includes('غلايه') || norm.includes('kettle')) {
      return KNOWN_PRODUCT_CATALOG_IMAGES['COF-STG-09'];
    }
    if (norm.includes('اسبريسو') || norm.includes('سيغنتشر') || norm.includes('سيجنتشر') || norm.includes('espresso')) {
      return KNOWN_PRODUCT_CATALOG_IMAGES['COF-ESP-05'];
    }
    if (norm.includes('تارازو') || norm.includes('كوستاريكا') || norm.includes('tarrazu') || norm.includes('costa')) {
      return KNOWN_PRODUCT_CATALOG_IMAGES['COF-CR-07'];
    }
    if (norm.includes('كيمكس') || norm.includes('chemex')) {
      return KNOWN_PRODUCT_CATALOG_IMAGES['COF-CHM-10'];
    }
    if (norm.includes('بتشر') || norm.includes('تبخير') || norm.includes('pitcher')) {
      return KNOWN_PRODUCT_CATALOG_IMAGES['COF-PIT-12'];
    }
    if (norm.includes('كولد برو') || norm.includes('منقوع بارد') || norm.includes('cold brew')) {
      return KNOWN_PRODUCT_CATALOG_IMAGES['COF-CB-06'];
    }
    if (norm.includes('مطحنه') || norm.includes('grinder') || norm.includes('mill')) {
      return KNOWN_PRODUCT_CATALOG_IMAGES['COF-GRIND-04'];
    }
    if (norm.includes('تقطير') || norm.includes('v60')) {
      return KNOWN_PRODUCT_CATALOG_IMAGES['COF-KIT-03'];
    }

    // ── Luxury Flowers & Mecca Gifts Catalog ──
    if (norm.includes('ورد') || norm.includes('زهور') || norm.includes('باقه') || norm.includes('flower') || norm.includes('rose')) {
      return '/images/hadaya_red_roses_bouquet_1791276749666.jpg';
    }
    if (norm.includes('بيوني') || norm.includes('peony')) {
      return '/images/hadaya_pink_peonies_1791216156090.jpg';
    }
    if (norm.includes('اوركيد') || norm.includes('فازه') || norm.includes('orchid') || norm.includes('vase')) {
      return '/images/hadaya_white_orchid_penthouse_1791218732789.jpg';
    }
    if (norm.includes('شوكولات') || norm.includes('chocolate') || norm.includes('باتشي')) {
      return '/images/hadaya_luxury_gift_set_1791216170853.jpg';
    }
    if (norm.includes('عطر') || norm.includes('عود') || norm.includes('perfume') || norm.includes('oud')) {
      return '/images/hadaya_men_luxury_gift_1791219799100.jpg';
    }
    if (norm.includes('كيك') || norm.includes('cake')) {
      return '/images/hadaya_luxury_velvet_cake_1791218716453.jpg';
    }
    if (norm.includes('سجاده') || norm.includes('مصحف') || norm.includes('قران') || norm.includes('prayer')) {
      return '/images/hadaya_luxury_master_hero_1791217937117.jpg';
    }
    if (norm.includes('هديه') || norm.includes('gift') || norm.includes('مكه')) {
      return '/images/hadaya_luxury_gift_set_1791216170853.jpg';
    }

    // ── Bleco Car & Electronics Catalog ──
    if (norm.includes('تنجيد') || norm.includes('مقاعد') || norm.includes('مراتب') || norm.includes('جلد') || norm.includes('seat')) {
      return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80';
    }
    if (norm.includes('دعاسات') || norm.includes('ارضيات') || norm.includes('فرشات') || norm.includes('mat')) {
      return 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&auto=format&fit=crop&q=80';
    }
    if (norm.includes('شماسه') || norm.includes('تظليل') || norm.includes('sunshade')) {
      return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80';
    }
    if (norm.includes('فواحه') || norm.includes('diffuser')) {
      return 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80';
    }
    if (norm.includes('داش كام') || norm.includes('dashcam') || norm.includes('كاميرا')) {
      return 'https://images.unsplash.com/photo-1508974239320-0a029497e820?w=800&auto=format&fit=crop&q=80';
    }
    if (norm.includes('earbud') || norm.includes('wireless') || norm.includes('سماعات') || norm.includes('headphone')) {
      return 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80';
    }
  }

  return FALLBACK_PRODUCT_IMAGE;
}

// ─── ULTRA-SPEED IMAGE OPTIMIZATION UTILITIES ─────────────────────────────────

/**
 * Builds an optimized image URL for known CDNs.
 * - Unsplash: enforces WebP + proper size/quality params
 * - Hostinger/relative: returned as-is (Vite handles bundled assets)
 * - Data / blob URLs: returned as-is
 */
export function getOptimizedImageUrl(
  url: string,
  opts: { width?: number; quality?: number } = {}
): string {
  if (!url) return FALLBACK_SVG_PLACEHOLDER;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  const { width = 800, quality = 80 } = opts;

  // Unsplash CDN optimization
  if (url.includes('images.unsplash.com')) {
    const base = url.split('?')[0];
    return `${base}?w=${width}&auto=format&fit=crop&q=${quality}&fm=webp`;
  }

  // Salla CDN — already optimized
  if (url.includes('cdn.salla.sa')) return url;

  return url;
}

/**
 * Returns a tiny inline SVG blur placeholder (instant, zero-network).
 * Used as background color while real image loads.
 */
export function getBlurPlaceholder(bgColor = '#f1f5f9'): string {
  const hex = bgColor.replace('#', '%23');
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="${hex}"/></svg>`;
}

/**
 * Checks whether a URL is a valid absolute URL or a non-empty relative path.
 * Returns false for empty, null, or clearly-broken strings.
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length < 3) return false;
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return true;
  if (trimmed.startsWith('/') || trimmed.startsWith('./')) return true;
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe image src resolver — always returns a valid display URL.
 * Priority: provided url → getOptimizedImageUrl → FALLBACK_SVG_PLACEHOLDER
 */
export function safeImageSrc(
  url?: string | null,
  opts: { width?: number; quality?: number; fallback?: string } = {}
): string {
  const { fallback = FALLBACK_PRODUCT_IMAGE } = opts;
  if (!isValidImageUrl(url)) return fallback;
  return getOptimizedImageUrl(url as string, opts);
}

