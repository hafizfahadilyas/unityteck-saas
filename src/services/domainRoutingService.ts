/**
 * Domain Routing Service — Multi-Domain & Subdomain Dynamic Binding Engine
 * Supports auto-detecting custom domains (e.g. specialtycoffee.sa) and subdomains (e.g. car.unityteck.com)
 * with automatic binding of the matching store and active theme.
 */

import { Store, DomainRecord, DomainResolutionResult } from '../types';
import { resolveDomainApi } from '../api/tenantApi';
import { isApiEnabled } from '../api/client';

export interface SimulatedDomain {
  domain: string;
  expectedStoreId: string;
  expectedThemeId: string;
  labelAr: string;
  labelEn: string;
  type: 'custom' | 'subdomain';
}

export const PRESET_SIMULATED_DOMAINS: SimulatedDomain[] = [
  {
    domain: 'specialtycoffee.sa',
    expectedStoreId: 'store-coffee',
    expectedThemeId: 'coffee-roasters',
    labelAr: 'متجر محامص القهوة المختصة (نطاق سعودي رسمي)',
    labelEn: 'Specialty Coffee Store (Official .sa Domain)',
    type: 'custom',
  },
  {
    domain: 'coffee.unityteck.com',
    expectedStoreId: 'store-coffee',
    expectedThemeId: 'coffee-roasters',
    labelAr: 'نطاق فرعي سحابي لمحمصة القهوة',
    labelEn: 'Cloud Subdomain for Coffee Store',
    type: 'subdomain',
  },
  {
    domain: 'tanjeedmakkah.com',
    expectedStoreId: 'store-bleco',
    expectedThemeId: 'saudia-transport',
    labelAr: 'مركز الصعيدي وبليكو لتعديل السيارات',
    labelEn: 'Al-Saeedi & Bleco Automotive Store',
    type: 'custom',
  },
  {
    domain: 'car.unityteck.com',
    expectedStoreId: 'store-bleco',
    expectedThemeId: 'saudia-transport',
    labelAr: 'نطاق فرعي سحابي لمتجر خدمات السيارات',
    labelEn: 'Cloud Subdomain for Automotive Store',
    type: 'subdomain',
  },
  {
    domain: 'giftshop-sa.com',
    expectedStoreId: 'store-1',
    expectedThemeId: 'theme-flora-luxe',
    labelAr: 'متجر هدايا (الزهور الطبيعية والهدايا الفاخرة)',
    labelEn: 'Hadaya Gifts & Flowers Official Store (giftshop-sa.com)',
    type: 'custom',
  },
  {
    domain: 'flowers.unityteck.com',
    expectedStoreId: 'store-1',
    expectedThemeId: 'theme-flora-luxe',
    labelAr: 'نطاق فرعي سحابي لمتجر الزهور والهدايا',
    labelEn: 'Cloud Subdomain for Flowers & Gifts',
    type: 'subdomain',
  },
];

/**
 * Dynamically builds active domain records from real store data (Tenant isolation compliant).
 * When filterStoreId is set, strictly limits records to the given tenant store.
 */
export function buildLiveStoreDomains(
  stores: Store[],
  domains?: DomainRecord[],
  filterStoreId?: string
): SimulatedDomain[] {
  const result: SimulatedDomain[] = [];
  const targetStores = filterStoreId ? stores.filter((s) => s.id === filterStoreId) : stores;

  for (const st of targetStores) {
    const storeDomains = domains ? domains.filter((d) => d.storeId === st.id) : [];

    // Custom domain from domains table or store entity
    const customDom =
      storeDomains.find((d) => d.domainType === 'custom')?.domainName ||
      (st as any).custom_domain ||
      (st as any).domain;

    if (customDom && customDom.includes('.')) {
      result.push({
        domain: customDom,
        expectedStoreId: st.id,
        expectedThemeId: resolveStoreActiveTheme(st),
        labelAr: `${st.name} (نطاق رسمي مخصص)`,
        labelEn: `${st.name} (Official Custom Domain)`,
        type: 'custom',
      });
    }

    // Subdomain / Demo domain
    const subDom =
      (st as any).demo_domain ||
      storeDomains.find((d) => d.domainType === 'demo')?.domainName ||
      (st.slug ? `${st.slug}.unityteck.com` : null);

    if (subDom && subDom !== customDom) {
      result.push({
        domain: subDom,
        expectedStoreId: st.id,
        expectedThemeId: resolveStoreActiveTheme(st),
        labelAr: `${st.name} (نطاق سحابي فرعي)`,
        labelEn: `${st.name} (Cloud Subdomain)`,
        type: 'subdomain',
      });
    }
  }

  // If no dynamic store domains found and not filtered to a single store, use preset defaults as fallback
  if (result.length === 0 && !filterStoreId) {
    return PRESET_SIMULATED_DOMAINS;
  }

  return result;
}

/**
 * Normalizes incoming hostname by stripping port, protocol, path, and www.
 */
export function normalizeHostname(raw: string): string {
  if (!raw) return '';
  let clean = raw.trim();
  clean = clean.replace(/^https?:\/\//i, '');
  clean = clean.replace(/:[0-9]+$/, ''); // strip port
  clean = clean.replace(/\/.*$/, ''); // strip path
  clean = clean.toLowerCase();

  if (clean.startsWith('www.')) {
    clean = clean.substring(4);
  }

  return clean;
}

/**
 * Check if the host belongs to master administration portal.
 */
export function isMasterPortalHost(hostname: string): boolean {
  const norm = normalizeHostname(hostname);
  return norm.startsWith('master.') || norm.startsWith('admin-master.') || norm === 'app.unityteck.com';
}

/**
 * Resolves active theme ID based on store category or predefined theme bindings.
 */
export function resolveStoreActiveTheme(store: Store): string {
  if (store.id === 'store-coffee' || store.category?.toLowerCase().includes('coffee')) {
    return 'coffee-roasters';
  }
  if (
    store.id === 'store-bleco' ||
    store.category?.toLowerCase().includes('car') ||
    store.category?.toLowerCase().includes('transport')
  ) {
    return 'saudia-transport';
  }
  if (
    store.id === 'store-1' ||
    store.category?.toLowerCase().includes('flower') ||
    store.category?.toLowerCase().includes('gift')
  ) {
    return 'theme-flora-luxe';
  }
  return 'theme-flora-luxe';
}

/**
 * Fast synchronous domain resolution against loaded stores and domains.
 */
export function resolveDomainLocal(
  rawHostname: string,
  stores: Store[],
  domains?: DomainRecord[]
): DomainResolutionResult {
  const clean = normalizeHostname(rawHostname);

  if (!clean || clean === 'localhost' || clean === '127.0.0.1' || clean === 'unityteck.com') {
    return {
      resolved: false,
      domain: clean,
      message: 'Base platform hostname (not bound to a specific tenant domain)',
    };
  }

  // 1. Check in domains records
  if (domains && domains.length > 0) {
    const matchedDomain = domains.find(
      (d) => normalizeHostname(d.domainName) === clean || normalizeHostname(d.domainName) === `www.${clean}`
    );
    if (matchedDomain) {
      const store = stores.find((s) => s.id === matchedDomain.storeId);
      if (store) {
        return {
          resolved: true,
          storeId: store.id,
          storeSlug: store.slug,
          storeName: store.name,
          domain: clean,
          domainType: matchedDomain.domainType || 'custom',
          activeThemeId: resolveStoreActiveTheme(store),
          sslStatus: matchedDomain.sslStatus,
          store,
        };
      }
    }
  }

  // 2. Check direct store domain properties (custom_domain, domain, demo_domain)
  for (const store of stores) {
    const sCustom = normalizeHostname((store as any).custom_domain || '');
    const sDomain = normalizeHostname((store as any).domain || '');
    const sDemo = normalizeHostname((store as any).demo_domain || '');

    if (clean === sCustom || clean === sDomain || clean === sDemo) {
      return {
        resolved: true,
        storeId: store.id,
        storeSlug: store.slug,
        storeName: store.name,
        domain: clean,
        domainType: clean === sDemo ? 'subdomain' : 'custom',
        activeThemeId: resolveStoreActiveTheme(store),
        sslStatus: 'active',
        store,
      };
    }
  }

  // 3. Check subdomain matching (e.g. coffee.unityteck.com, car.localhost, bleco.test)
  const parts = clean.split('.');
  if (parts.length >= 2) {
    const sub = parts[0].toLowerCase();
    if (!['www', 'app', 'api', 'admin', 'master', 'demo'].includes(sub)) {
      // Match by slug or id
      const matchedStore = stores.find(
        (s) => s.slug === sub || s.id === sub || s.id === `store-${sub}`
      );
      if (matchedStore) {
        return {
          resolved: true,
          storeId: matchedStore.id,
          storeSlug: matchedStore.slug,
          storeName: matchedStore.name,
          domain: clean,
          domainType: 'subdomain',
          activeThemeId: resolveStoreActiveTheme(matchedStore),
          sslStatus: 'active',
          store: matchedStore,
        };
      }

      // Match well-known aliases
      const aliasMap: Record<string, string> = {
        coffee: 'store-coffee',
        roasters: 'store-coffee',
        hibrew: 'store-coffee',
        specialtycoffee: 'store-coffee',
        car: 'store-bleco',
        cars: 'store-bleco',
        bleco: 'store-bleco',
        tanjeed: 'store-bleco',
        transport: 'store-bleco',
        alsaeedi: 'store-bleco',
        makkah: 'store-1',
        hadaya: 'store-1',
        flowers: 'store-1',
        gifts: 'store-1',
        giftshop: 'store-1',
      };

      const targetId = aliasMap[sub];
      if (targetId) {
        const store = stores.find((s) => s.id === targetId);
        if (store) {
          return {
            resolved: true,
            storeId: store.id,
            storeSlug: store.slug,
            storeName: store.name,
            domain: clean,
            domainType: 'subdomain',
            activeThemeId: resolveStoreActiveTheme(store),
            sslStatus: 'active',
            store,
          };
        }
      }
    }
  }

  return {
    resolved: false,
    domain: clean,
    message: `Domain '${clean}' is not bound to any registered store.`,
  };
}

/**
 * Dynamic resolution: queries Laravel API if available with instant local fallback.
 */
export async function resolveDomainDynamic(
  rawHostname: string,
  stores: Store[],
  domains?: DomainRecord[]
): Promise<DomainResolutionResult> {
  const clean = normalizeHostname(rawHostname);

  // If running in real API mode, fetch from Laravel API
  if (isApiEnabled() && clean) {
    try {
      const apiResult = await resolveDomainApi(clean);
      if (apiResult && apiResult.resolved) {
        return apiResult;
      }
    } catch {
      // Fallback to local resolver
    }
  }

  // Fallback to local synchronous resolver
  return resolveDomainLocal(clean, stores, domains);
}
