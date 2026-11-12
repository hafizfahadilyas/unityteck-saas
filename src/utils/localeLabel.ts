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
  Black: 'أسود',
  Silver: 'فضي',
  White: 'أبيض',
  Red: 'أحمر',
  Blue: 'أزرق',
  Green: 'أخضر',
  Gold: 'ذهبي',
  Brown: 'بني',
};

/** One option = EN name + AR nameAr — never two separate Color / اللون rows. */
export const OPTION_NAME_TWINS: ReadonlyArray<{ en: string; ar: string }> = [
  { en: 'Color', ar: 'اللون' },
  { en: 'Edition', ar: 'الإصدار' },
  { en: 'Size', ar: 'المقاس' },
  { en: 'Material', ar: 'الخامة' },
];

export function arabicOptionNameFor(enName: string | null | undefined): string | undefined {
  const key = String(enName || '').trim().toLowerCase();
  if (!key) return undefined;
  return OPTION_NAME_TWINS.find((t) => t.en.toLowerCase() === key)?.ar;
}

export function englishOptionNameFor(arName: string | null | undefined): string | undefined {
  const key = String(arName || '').trim();
  if (!key) return undefined;
  return OPTION_NAME_TWINS.find((t) => t.ar === key)?.en;
}

/** Canonical English option key used in variant maps / selection. */
export function canonicalOptionName(name: string | null | undefined): string {
  const raw = String(name || '').trim();
  if (!raw) return '';
  const fromAr = englishOptionNameFor(raw);
  if (fromAr) return fromAr;
  const twin = OPTION_NAME_TWINS.find((t) => t.en.toLowerCase() === raw.toLowerCase());
  return twin ? twin.en : raw;
}

export function isArabicOptionNameTwin(name: string | null | undefined): boolean {
  const raw = String(name || '').trim();
  return OPTION_NAME_TWINS.some((t) => t.ar === raw);
}

/**
 * Collapse twin EN/AR keys in a variant options map to one English key.
 * `{ Color: "Black", اللون: "أسود" }` → `{ Color: "Black" }`
 */
export function collapseOptionMap(options: Record<string, string> | null | undefined): Record<string, string> {
  const src = options || {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(src)) {
    const label = String(value || '').trim();
    if (!key || !label) continue;
    if (isArabicOptionNameTwin(key)) {
      const enKey = canonicalOptionName(key);
      if (!out[enKey]) {
        // Prefer Latin/English value when only Arabic key exists.
        const enFromKnown = Object.entries(KNOWN_OPTION_VALUE_AR).find(([, ar]) => ar === label)?.[0];
        out[enKey] = enFromKnown || label;
      }
      continue;
    }
    const canon = canonicalOptionName(key);
    if (!out[canon]) out[canon] = label;
  }
  return out;
}

export function hasArabicScript(value: string | null | undefined): boolean {
  return /[\u0600-\u06FF]/.test(String(value || ''));
}

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

/**
 * Locale-pure merchant name for lists/forms.
 * EN UI never shows Arabic; AR prefers Arabic (recovers Arabic wrongly stored in `name`).
 */
export function pickLocaleName(
  isAr: boolean,
  en: string | null | undefined,
  ar: string | null | undefined,
): string {
  const english = String(en || '').trim();
  const arabic = String(ar || '').trim();
  if (isAr) {
    if (arabic) return arabic;
    if (english && hasArabicScript(english)) return english;
    return english;
  }
  if (english && !hasArabicScript(english)) return english;
  return '';
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
  const canon = canonicalOptionName(name);
  return arabicOptionNameFor(canon) || knownAr(String(name || '').trim()) || knownAr(canon);
}
