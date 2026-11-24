/** Dedupe page_view when both shell + theme fire for the same path (same session). */
const recentPageViews = new Map<string, number>();
export const PAGE_VIEW_DEDUPE_MS = 2500;

export function shouldSkipDuplicatePageView(
  storeId: string,
  session: string,
  path: string,
  now = Date.now(),
): boolean {
  const dedupeKey = `${storeId}|${session}|${path}`;
  const prev = recentPageViews.get(dedupeKey) || 0;
  if (now - prev < PAGE_VIEW_DEDUPE_MS) return true;
  recentPageViews.set(dedupeKey, now);
  if (recentPageViews.size > 200) {
    const cutoff = now - PAGE_VIEW_DEDUPE_MS * 4;
    for (const [k, ts] of recentPageViews) {
      if (ts < cutoff) recentPageViews.delete(k);
    }
  }
  return false;
}

export function resetPageViewDedupeForTests(): void {
  recentPageViews.clear();
}
