/**
 * Store admin tabs that stay visible in the sidebar but open as Coming Soon
 * until the feature is ready for production.
 *
 * To unlock a tab: remove its id from this set.
 */
export const STORE_TABS_COMING_SOON = new Set<string>([
  'notifications',
  'whatsapp',
]);

/** @deprecated use isStoreTabComingSoon — kept so existing imports keep working */
export const STORE_TABS_HIDDEN_UNTIL_READY = STORE_TABS_COMING_SOON;

export function isStoreTabComingSoon(tabId: string): boolean {
  return STORE_TABS_COMING_SOON.has(tabId);
}

/** Legacy alias — same as coming soon (sidebar still shows; content is Coming Soon). */
export function isStoreTabHiddenUntilReady(tabId: string): boolean {
  return isStoreTabComingSoon(tabId);
}
