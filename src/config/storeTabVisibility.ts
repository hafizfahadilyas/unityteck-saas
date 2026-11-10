/**
 * Store admin tabs that stay visible in the sidebar as disabled "Soon" buttons
 * (no click, no dropdown) until the feature is ready for production.
 *
 * To unlock a tab: remove its id from this set.
 */
export const STORE_TABS_COMING_SOON = new Set<string>([
  'notifications',
  'whatsapp',
  'commerce-tools',
  // Hosting & Domain · Design Studio · AI Image & Video — locked until ready
  'hosting',
  'canva',
  'canva-studio',
  'canva-banner',
  'canva-logo',
  'canva-product-card',
  'ai-media',
]);

/** @deprecated use isStoreTabComingSoon — kept so existing imports keep working */
export const STORE_TABS_HIDDEN_UNTIL_READY = STORE_TABS_COMING_SOON;

export function isStoreTabComingSoon(tabId: string): boolean {
  if (STORE_TABS_COMING_SOON.has(tabId)) return true;
  // Design Studio child routes stay locked with the parent Design Tools button
  if (tabId.startsWith('canva-')) return STORE_TABS_COMING_SOON.has('canva');
  return false;
}

/** Legacy alias — same as coming soon (sidebar still shows; content is Coming Soon). */
export function isStoreTabHiddenUntilReady(tabId: string): boolean {
  return isStoreTabComingSoon(tabId);
}
