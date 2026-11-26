/**
 * Detect Souq common / new-merchant tenants (not flagship flowers/coffee/car).
 */
export function isSouqCommonTenant(store?: {
  id?: string;
  category?: string;
  slug?: string;
} | null, themeId?: string | null): boolean {
  const sid = String(store?.id || '').toLowerCase();
  const slug = String(store?.slug || '').toLowerCase();
  const tid = String(themeId || '').toLowerCase();

  if (sid === 'store-1' || sid === 'store-coffee' || sid === 'store-bleco') return false;
  if (sid.includes('coffee') || sid.includes('bleco') || sid.includes('flora')) return false;

  if (
    tid.includes('souq-common') ||
    tid.includes('souqcommon') ||
    tid.includes('commerce-starter') ||
    tid === 'theme-souq-common-retail' ||
    tid === 'theme-souq-common-catalog' ||
    tid === 'theme-souq-common-services' ||
    tid === 'theme-souq-common-boutique'
  ) {
    return true;
  }

  if (sid === 'store-souq-default' || slug === 'souq-default') return true;

  // Any other post-pilot tenant id
  if (sid.startsWith('store-') && sid !== 'store-1') return true;

  return false;
}
