import type { ThemeManifest } from './types';
import { coffeeRoastersThemeConfig } from './coffeeRoasters/theme.config';
import { saudiaTransportThemeConfig } from './saudiaTransport/theme.config';
import { meccaGiftsThemeConfig } from './meccaGifts/theme.config';
import {
  souqCommonBoutiqueThemeConfig,
  souqCommonCatalogThemeConfig,
  souqCommonRetailThemeConfig,
  souqCommonServicesThemeConfig,
} from './souqCommon/theme.config';

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

// Common Souq pack (post-pilot default) — docs/36 CT-4
registerTheme(souqCommonRetailThemeConfig, [
  'souq-common',
  'souq-retail',
  'theme-commerce-starter',
  'commerce-starter',
]);
registerTheme(souqCommonCatalogThemeConfig, ['souq-catalog']);
registerTheme(souqCommonServicesThemeConfig, ['souq-services']);
registerTheme(souqCommonBoutiqueThemeConfig, ['souq-boutique']);

// Flagship pilots — do not force-migrate
registerTheme(coffeeRoastersThemeConfig, [
  'coffee',
  'hibrew',
  'roasters',
  'theme-coffee-artisan',
  'coffeeRoasters',
  'theme-coffee',
]);
registerTheme(saudiaTransportThemeConfig, [
  'transport',
  'car',
  'bleco',
  'saeedi',
  'theme-saudia-transport',
]);
registerTheme(meccaGiftsThemeConfig, [
  'gifts',
  'flowers',
  'theme-flora-luxe',
  'flora-luxe',
  'theme-makkah-royal',
  'theme-gifts',
]);

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
 * Resolve theme for a store:
 * 1. Explicit activeThemeId
 * 2. Flagship store IDs (coffee / bleco / flowers)
 * 3. Default → Souq common retail (NOT flora) for new tenants
 */
export function resolveStoreTheme(
  storeId?: string,
  activeThemeId?: string,
  storeCategory?: string,
): ThemeManifest {
  let sId = (storeId || '').toLowerCase().trim();
  if ((!sId || sId === 'store' || sId === 'undefined') && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    sId = (
      params.get('store') ||
      params.get('demo') ||
      params.get('tenant') ||
      params.get('storeId') ||
      ''
    )
      .toLowerCase()
      .trim();
    if (!sId) {
      const p = window.location.pathname.toLowerCase();
      if (p.startsWith('/coffee')) sId = 'store-coffee';
      else if (p.startsWith('/car') || p.startsWith('/bleco') || p.startsWith('/transport')) sId = 'store-bleco';
      else if (p.startsWith('/flowers') || p.startsWith('/hadaya') || p.startsWith('/gifts')) sId = 'store-1';
      else if (p === '/store/souq-default' || p.startsWith('/store/souq-default/')) sId = 'store-souq-default';
    }
  }

  const isCoffee =
    sId === 'store-coffee' ||
    sId === 'coffee' ||
    sId.includes('coffee') ||
    sId.includes('hibrew') ||
    sId.includes('roasters') ||
    (storeCategory || '').toLowerCase().includes('coffee') ||
    (storeCategory || '').toLowerCase().includes('قهوة');
  const isCar =
    sId === 'store-bleco' ||
    sId === 'bleco' ||
    sId === 'car' ||
    sId === 'cars' ||
    sId.includes('car') ||
    sId.includes('transport') ||
    sId.includes('bleco') ||
    sId.includes('saeedi') ||
    (storeCategory || '').toLowerCase().includes('سيار') ||
    (storeCategory || '').toLowerCase().includes('تنجيد');
  const isFlowers =
    sId === 'store-1' ||
    sId === 'flowers' ||
    sId === 'hadaya' ||
    sId.includes('flower') ||
    (sId.includes('gift') && !sId.includes('souq')) ||
    sId.includes('makkah');

  // Explicit assignment
  if (activeThemeId) {
    const cleanTid = activeThemeId.trim();
    const found = getThemeManifest(cleanTid);
    if (found) {
      const isFlowerTheme =
        cleanTid === 'theme-flora-luxe' ||
        cleanTid === 'flora-luxe' ||
        cleanTid === 'theme-makkah-royal' ||
        cleanTid === 'theme-gifts' ||
        cleanTid === 'gifts' ||
        cleanTid === 'flowers';
      const isTransportTheme =
        cleanTid === 'theme-saudia-transport' ||
        cleanTid === 'transport' ||
        cleanTid === 'car' ||
        cleanTid === 'bleco';
      const isCoffeeTheme =
        cleanTid === 'theme-coffee' ||
        cleanTid === 'theme-coffee-artisan' ||
        cleanTid === 'coffee' ||
        cleanTid === 'hibrew' ||
        cleanTid === 'roasters' ||
        cleanTid === 'coffeeRoasters';

      if (isCoffee && isCoffeeTheme) return found;
      if (isCar && isTransportTheme) return found;
      if (isFlowers && isFlowerTheme) return found;
      // Common / other themes allowed for any non-conflicting flagship mismatch
      if (!isCoffeeTheme && !isTransportTheme && !isFlowerTheme) return found;
      if (!isCoffee && !isCar && !isFlowers) return found;
    }
  }

  if (isCoffee) return coffeeRoastersThemeConfig;
  if (isCar) return saudiaTransportThemeConfig;
  if (isFlowers) return meccaGiftsThemeConfig;

  const cat = (storeCategory || '').toLowerCase();
  if (
    cat.includes('coffee') ||
    cat.includes('cafe') ||
    cat.includes('roaster') ||
    cat.includes('قهوة')
  ) {
    return coffeeRoastersThemeConfig;
  }
  if (
    cat.includes('car') ||
    cat.includes('transport') ||
    cat.includes('سيار') ||
    cat.includes('تنجيد')
  ) {
    return saudiaTransportThemeConfig;
  }

  if (typeof window !== 'undefined') {
    const s = window.location.search.toLowerCase();
    const p = window.location.pathname.toLowerCase();
    if (s.includes('coffee') || p.includes('coffee')) return coffeeRoastersThemeConfig;
    if (s.includes('car') || s.includes('bleco') || p.includes('car') || p.includes('bleco')) {
      return saudiaTransportThemeConfig;
    }
  }

  // NEW tenants → common retail (never flora/coffee/car by URL heuristic alone)
  return souqCommonRetailThemeConfig;
}

export const THEME_REGISTRY = {
  get: getThemeManifest,
  list: getAllThemes,
  resolve: resolveStoreTheme,
  register: registerTheme,
};

if (typeof window !== 'undefined') {
  try {
    const s = window.location.search.toLowerCase();
    const p = window.location.pathname.toLowerCase();
    if (s.includes('coffee') || p.includes('coffee')) {
      void import('./coffeeRoasters/CoffeeRoastersThemeView');
    } else if (
      s.includes('car') ||
      s.includes('bleco') ||
      s.includes('transport') ||
      p.includes('car') ||
      p.includes('bleco')
    ) {
      void import('./saudiaTransport/SaudiaTransportThemeView');
    } else if (
      s.includes('flower') ||
      s.includes('gift') ||
      p.includes('flower') ||
      p.includes('/hadaya')
    ) {
      void import('./meccaGifts/MeccaGiftsThemeView');
    } else {
      void import('./meccaGifts/MeccaGiftsThemeView'); // souq common shell
    }
  } catch {}
}
