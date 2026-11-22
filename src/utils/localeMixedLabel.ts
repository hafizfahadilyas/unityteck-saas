/**
 * Split EN+AR mixed chrome strings like "Cash on Delivery (الدفع عند الاستلام)".
 * EN locale → English only (strip Arabic); AR locale → Arabic only (paren or Arabic script).
 */
export function localeMixedLabel(raw: string | null | undefined, isAr: boolean): string {
  const text = (raw || '').trim();
  if (!text) return '';

  const arParen = text.match(/\(([^)]*[\u0600-\u06FF][^)]*)\)/);
  const enParen = text.match(/\(([^)]*[A-Za-z][^)]*)\)/);
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  const hasLatin = /[A-Za-z]/.test(text);

  if (isAr) {
    if (arParen?.[1]) return arParen[1].trim();
    // "عربي (English)" → keep Arabic outside parens
    const arOutside = text.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/[A-Za-z0-9#@._/+-]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (arOutside && /[\u0600-\u06FF]/.test(arOutside)) return arOutside;
    if (hasArabic && hasLatin) {
      const arabicOnly = text.replace(/[A-Za-z0-9#@._/+-]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (arabicOnly) return arabicOnly;
    }
    return text;
  }

  // English UI: drop Arabic parentheses and any Arabic script leftovers
  if (enParen?.[1] && !/[\u0600-\u06FF]/.test(enParen[1]) && hasArabic) {
    /* keep going — prefer Latin outside */
  }
  const enOnly = text
    .replace(/\s*\([^)]*[\u0600-\u06FF][^)]*\)\s*/g, ' ')
    .replace(/[\u0600-\u06FF]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return enOnly || text;
}
