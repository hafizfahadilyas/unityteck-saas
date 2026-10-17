import type { ThemeManifest } from './types';
import { coffeeRoastersThemeConfig } from './coffeeRoasters/theme.config';
import { saudiaTransportThemeConfig } from './saudiaTransport/theme.config';
import { meccaGiftsThemeConfig } from './meccaGifts/theme.config';

/**
 * Primary registry mapping canonical theme IDs and aliases to their manifests.
 */
const registryMap: Map<string, ThemeManifest> = new Map();

/**
 * Register a theme manifest with all its supported lookup aliases.
 */
export function registerTheme(manifest: ThemeManifest, aliases: string[] = []): void {
  registryMap.set(manifest.id, manifest);
  registryMap.set(manifest.slug, manifest);
  for (const alias of aliases) {
    registryMap.set(alias, manifest);
  }
}

// Initial Registration of Built-in Flagship Themes
registerTheme(coffeeRoastersThemeConfig, ['coffee', 'hibrew', 'roasters', 'theme-coffee-artisan', 'coffeeRoasters', 'theme-coffee']);
registerTheme(saudiaTransportThemeConfig, ['transport', 'car', 'bleco', 'saeedi', 'theme-saudia-transport']);
registerTheme(meccaGiftsThemeConfig, ['gifts', 'flowers', 'theme-flora-luxe', 'flora-luxe', 'theme-makkah-royal']);

/**
 * Retrieve a theme manifest by ID, slug, or alias.
 */
export function getThemeManifest(idOrSlug?: string): ThemeManifest | undefined {
  if (!idOrSlug) return undefined;
  return registryMap.get(idOrSlug.trim());
}

/**
 * Return a list of all distinct registered themes.
 */
export function getAllThemes(): ThemeManifest[] {
  const distinct = new Set<ThemeManifest>(registryMap.values());
  return Array.from(distinct);
}

/**
 * Intelligently resolve the appropriate theme for a store based on:
 * 1. Explicit storeActiveTheme assignment
 * 2. Store ID matching (e.g. store-coffee, store-bleco, store-1)
 * 3. Store industry category
 * 4. Fallback to default flagship theme
 */
export function resolveStoreTheme(
  storeId?: string,
  activeThemeId?: string,
  storeCategory?: string,
): ThemeManifest {
  // 1. Resolve store context from ID, URL query, or URL pathname
  let sId = (storeId || '').toLowerCase().trim();
  if ((!sId || sId === 'store' || sId === 'undefined') && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    sId = (params.get('store') || params.get('demo') || params.get('tenant') || params.get('storeId') || '').toLowerCase().trim();
    if (!sId) {
      const p = window.location.pathname.toLowerCase();
      if (p.startsWith('/coffee')) sId = 'store-coffee';
      else if (p.startsWith('/car') || p.startsWith('/bleco') || p.startsWith('/transport')) sId = 'store-bleco';
      else if (p.startsWith('/flowers') || p.startsWith('/hadaya') || p.startsWith('/gifts')) sId = 'store-1';
    }
  }

  const isCoffee = sId === 'store-coffee' || sId === 'coffee' || sId.includes('coffee') || sId.includes('hibrew') || sId.includes('roasters') || (storeCategory || '').toLowerCase().includes('coffee') || (storeCategory || '').toLowerCase().includes('قهوة');
  const isCar = sId === 'store-bleco' || sId === 'bleco' || sId === 'car' || sId === 'cars' || sId.includes('car') || sId.includes('transport') || sId.includes('bleco') || sId.includes('saeedi') || (storeCategory || '').toLowerCase().includes('سيار') || (storeCategory || '').toLowerCase().includes('تنجيد');

  // 2. Explicit theme assignment (with strict store isolation guard)
  if (activeThemeId) {
    const cleanTid = activeThemeId.trim();
    const isFlowerTheme = cleanTid === 'theme-flora-luxe' || cleanTid === 'flora-luxe' || cleanTid === 'theme-makkah-royal' || cleanTid === 'gifts' || cleanTid === 'flowers';
    const isTransportTheme = cleanTid === 'theme-saudia-transport' || cleanTid === 'transport' || cleanTid === 'car' || cleanTid === 'bleco';
    const isCoffeeTheme = cleanTid === 'theme-coffee' || cleanTid === 'theme-coffee-artisan' || cleanTid === 'coffee' || cleanTid === 'hibrew' || cleanTid === 'roasters' || cleanTid === 'coffeeRoasters';

    if (isCoffee && isCoffeeTheme) {
      const found = getThemeManifest(cleanTid);
      if (found) return found;
    } else if (isCar && isTransportTheme) {
      const found = getThemeManifest(cleanTid);
      if (found) return found;
    } else if (!isCoffee && !isCar) {
      const found = getThemeManifest(cleanTid);
      if (found) return found;
    }
  }

  // 3. Known store ID convention
  if (isCoffee) {
    return coffeeRoastersThemeConfig;
  }
  if (isCar) {
    return saudiaTransportThemeConfig;
  }
  if (sId === 'store-1' || sId === 'flowers' || sId === 'hadaya' || sId.includes('flower') || sId.includes('gift') || sId.includes('makkah')) {
    return meccaGiftsThemeConfig;
  }

  // 4. Category matching (Arabic + English)
  const cat = (storeCategory || '').toLowerCase();
  if (cat.includes('coffee') || cat.includes('cafe') || cat.includes('roaster') || cat.includes('espresso') || cat.includes('قهوة') || cat.includes('باريستا') || cat.includes('مطاحن')) {
    return coffeeRoastersThemeConfig;
  }
  if (cat.includes('car') || cat.includes('auto') || cat.includes('transport') || cat.includes('upholstery') || cat.includes('سيار') || cat.includes('مقاعد') || cat.includes('تلابيس') || cat.includes('تنجيد')) {
    return saudiaTransportThemeConfig;
  }
  if (cat.includes('flower') || cat.includes('gift') || cat.includes('souvenir') || cat.includes('perfume') || cat.includes('زهور') || cat.includes('ورد') || cat.includes('هدايا')) {
    return meccaGiftsThemeConfig;
  }

  // 4. Default fallback: check URL path or search one last time
  if (typeof window !== 'undefined') {
    const s = window.location.search.toLowerCase();
    const p = window.location.pathname.toLowerCase();
    if (s.includes('coffee') || p.includes('coffee')) return coffeeRoastersThemeConfig;
    if (s.includes('car') || s.includes('bleco') || p.includes('car') || p.includes('bleco')) return saudiaTransportThemeConfig;
  }

  return meccaGiftsThemeConfig;
}

export const THEME_REGISTRY = {
  get: getThemeManifest,
  list: getAllThemes,
  resolve: resolveStoreTheme,
  register: registerTheme,
};

// Eagerly prefetch active theme component during initial bootstrap for sub-second smooth render
if (typeof window !== 'undefined') {
  try {
    const s = window.location.search.toLowerCase();
    const p = window.location.pathname.toLowerCase();
    if (s.includes('coffee') || p.includes('coffee')) {
      void import('./coffeeRoasters/CoffeeRoastersThemeView');
    } else if (s.includes('car') || s.includes('bleco') || s.includes('transport') || p.includes('car') || p.includes('bleco')) {
      void import('./saudiaTransport/SaudiaTransportThemeView');
    } else {
      void import('./meccaGifts/MeccaGiftsThemeView');
    }
  } catch {}
}

