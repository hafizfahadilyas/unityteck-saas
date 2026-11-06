export function learnMoreHref(url: string | null | undefined, storeId: string): string {
  const raw = String(url ?? '').trim();
  if (raw === '' || raw === '#products') return '#products';
  if (/store_id=/i.test(raw)) return '';
  const foreign = raw.match(/\/stores\/([^/?#]+)/i);
  if (foreign && foreign[1] !== storeId) return '';
  return raw;
}
