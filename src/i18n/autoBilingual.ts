/**
 * Global merchant bilingual rule (ALL stores · ALL elements):
 * One text input → auto-fill EN + AR siblings.
 * Known glossary pairs translate; unknown text mirrors to both sides.
 * Chrome UI still follows locale; this only fills merchant content fields.
 */
import { COMMERCE_TERMS } from './commerceTerms';

export type BilingualPair = { en: string; ar: string };

const EXTRA_PAIRS: BilingualPair[] = [
  { en: 'Home', ar: 'الرئيسية' },
  { en: 'Shop', ar: 'المتجر' },
  { en: 'Machines', ar: 'المكائن' },
  { en: 'Mills', ar: 'المطاحن' },
  { en: 'Coffee Bars', ar: 'أركان ودواليب القهوة' },
  { en: 'Accessories', ar: 'الأكواب والمستلزمات' },
  { en: 'HiBrew CHOICE', ar: 'العروض والباقات' },
  { en: 'Offers', ar: 'العروض والباقات' },
  { en: 'AI', ar: 'الذكاء الاصطناعي' },
  { en: 'Business', ar: 'قطاع الأعمال' },
  { en: 'Support', ar: 'الدعم والضمان' },
  { en: 'Reviews', ar: 'التقييمات والدعم' },
];

function glossaryPairs(): BilingualPair[] {
  const fromCommerce = Object.values(COMMERCE_TERMS).map((row) => ({
    en: row.en,
    ar: row.ar,
  }));
  return [...fromCommerce, ...EXTRA_PAIRS];
}

function norm(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Resolve EN+AR from a single typed value.
 * Exact (case-insensitive) glossary hit → proper pair; else mirror.
 */
export function autoBilingualPair(
  text: string,
  extraPairs: BilingualPair[] = [],
): BilingualPair {
  const raw = text ?? '';
  if (!raw.trim()) return { en: '', ar: '' };
  const key = norm(raw);
  const pool = [...extraPairs, ...glossaryPairs()];
  for (const pair of pool) {
    if (norm(pair.en) === key || norm(pair.ar) === key) {
      return { en: pair.en, ar: pair.ar };
    }
  }
  return { en: raw, ar: raw };
}

/** Convenience for React onChange handlers that write labelEn/labelAr. */
export function autoBilingualLabels(
  text: string,
  extraPairs: BilingualPair[] = [],
): { labelEn: string; labelAr: string } {
  const pair = autoBilingualPair(text, extraPairs);
  return { labelEn: pair.en, labelAr: pair.ar };
}
