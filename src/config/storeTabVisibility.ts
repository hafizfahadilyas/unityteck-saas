/**
 * Store admin tabs that stay visible in the sidebar as disabled "Soon" buttons
 * (no click, no dropdown) until the feature is ready for production.
 *
 * To unlock a tab: remove its id from this set.
 */
export const STORE_TABS_COMING_SOON = new Set<string>([
  'notifications',
  'commerce-tools',
  // Hosting & Domain — locked until ready
  'hosting',
  // Native store mobile app — sidebar placeholder until launch
  'mobile-app',
  // Communication Tools channels (WhatsApp stays live; these show Coming Soon)
  'email',
  'sms',
  'live-chat',
  'in-app-notifications',
  'ai-conversations',
  // Unlocked for all stores: Design Studio (Canva), AI Media, WhatsApp
]);

/**
 * Communication Tools channel tabs (Coming Soon except WhatsApp).
 * AI Conversations is NOT listed here — all AI tools live under AI Tools (`ai-media`).
 */
export const STORE_COMM_CHANNEL_SOON_TABS = [
  'email',
  'sms',
  'live-chat',
  'in-app-notifications',
] as const;

export function isStoreCommChannelSoonTab(tabId: string): boolean {
  return (STORE_COMM_CHANNEL_SOON_TABS as readonly string[]).includes(tabId);
}

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
