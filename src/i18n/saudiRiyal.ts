/**
 * Official Saudi Riyal symbol (SAMA, Feb 2025).
 * Unicode U+20C1 SAUDI RIYAL SIGN (stylized Riyal).
 * ISO code stays "SAR" for APIs / JSON-LD; this module is for UI display only.
 *
 * Font support for U+20C1 is still uneven — for critical price chips prefer
 * `<SaudiRiyalSymbol />` or CSS `.currency-sar` / `.sar-sign` (mask SVG).
 * Asset: public/currency/saudi-riyal-symbol.svg
 */

/** Unicode SAUDI RIYAL SIGN (U+20C1) — same in AR + EN per SAMA guidelines. */
export const SAUDI_RIYAL_SIGN = '\u20C1';

/** Full word fallback when a plain-text channel cannot render the symbol. */
export const SAUDI_RIYAL_WORD_AR = '\u0631\u064A\u0627\u0644';
export const SAUDI_RIYAL_WORD_EN = 'Riyal';

/**
 * Display label for prices / totals.
 * Prefer the official symbol in both locales (SAMA: one national symbol).
 */
export function currencySarLabel(_isAr?: boolean): string {
  return SAUDI_RIYAL_SIGN;
}

/** Human-readable word (WhatsApp / SMS / emails that strip rare unicode). */
export function currencySarWord(isAr: boolean): string {
  return isAr ? SAUDI_RIYAL_WORD_AR : SAUDI_RIYAL_WORD_EN;
}

/**
 * Format an amount with the official symbol to the LEFT (SAMA rule),
 * with a space between symbol and number.
 */
export function formatSarAmount(
  amount: number | string,
  locale: 'ar' | 'en' = 'ar',
  opts?: { fractionDigits?: number },
): string {
  const n = typeof amount === 'number' ? amount : Number(amount);
  const digits = opts?.fractionDigits ?? (Number.isInteger(n) ? 0 : 2);
  const formatted = Number.isFinite(n)
    ? new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: 2,
      }).format(n)
    : String(amount);
  return `${SAUDI_RIYAL_SIGN} ${formatted}`;
}
