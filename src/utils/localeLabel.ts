/**
 * Locale-pure display helpers. AR chrome never falls back to EN when Arabic exists.
 */

/** Known catalog / seed option values → original Arabic (not mixed). */
export const KNOWN_OPTION_VALUE_AR: Record<string, string> = {
  'Standard 58mm Kit': 'طقم بورتفلتر 58 مم القياسي',
  'Pro Barista Edition': 'إصدار باريستا برو',
  'Master Barista Edition': 'إصدار ماستر باريستا الشامل',
  'Standard Trio Adapter': 'محول ثلاثي قياسي',
  '1.5L Glass Carafe Edition': 'إصدار إبريق زجاجي 1.5 لتر',
  'Dual Cup Barista Kit': 'طقم باريستا بمخرجين للكوبين',
  Color: 'اللون',
  Edition: 'الإصدار',
  Size: 'المقاس',
  Material: 'الخامة',
};

export function pickLocaleText(
  isAr: boolean,
  en: string | null | undefined,
  ar: string | null | undefined,
): string {
  const english = String(en || '').trim();
  const arabic = String(ar || '').trim();
  if (isAr) return arabic || KNOWN_OPTION_VALUE_AR[english] || english;
  return english || arabic;
}

/** Fill missing Arabic labels from known map / catalog twin. */
function knownAr(en: string): string | undefined {
  if (!en) return undefined;
  return (
    KNOWN_OPTION_VALUE_AR[en] ||
    KNOWN_OPTION_VALUE_AR[en.toLowerCase()] ||
    Object.entries(KNOWN_OPTION_VALUE_AR).find(([k]) => k.toLowerCase() === en.toLowerCase())?.[1]
  );
}

export function resolveOptionValueAr(
  label: string | null | undefined,
  labelAr?: string | null | undefined,
): string | undefined {
  const ar = String(labelAr || '').trim();
  if (ar) return ar;
  return knownAr(String(label || '').trim());
}

export function resolveOptionNameAr(
  name: string | null | undefined,
  nameAr?: string | null | undefined,
): string | undefined {
  const ar = String(nameAr || '').trim();
  if (ar) return ar;
  return knownAr(String(name || '').trim());
}
