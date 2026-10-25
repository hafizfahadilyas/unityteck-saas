/**
 * Split EN+AR mixed chrome strings like "Cash on Delivery (الدفع عند الاستلام)".
 * EN locale → English only; AR locale → Arabic paren text when present.
 */
export function localeMixedLabel(raw: string | null | undefined, isAr: boolean): string {
  const text = (raw || '').trim();
  if (!text) return '';
  const arParen = text.match(/\(([^)]*[\u0600-\u06FF][^)]*)\)/);
  if (isAr && arParen?.[1]) return arParen[1].trim();
  const enOnly = text.replace(/\s*\([^)]*[\u0600-\u06FF][^)]*\)\s*/g, '').trim();
  return enOnly || text;
}
