/**
 * Shared KSA city catalog for customer / checkout / shipping / auth dropdowns.
 * English `id` is the stored value; labels follow locale (AR/EN).
 */

export type SaudiCityOption = {
  id: string;
  nameEn: string;
  nameAr: string;
};

/** Built-in Saudi Arabia cities. Do not invent store metrics here — catalog only. */
export const DEFAULT_SAUDI_CITIES: readonly SaudiCityOption[] = [
  { id: 'Riyadh', nameEn: 'Riyadh', nameAr: 'الرياض' },
  { id: 'Jeddah', nameEn: 'Jeddah', nameAr: 'جدة' },
  { id: 'Makkah', nameEn: 'Makkah', nameAr: 'مكة المكرمة' },
  { id: 'Madinah', nameEn: 'Madinah', nameAr: 'المدينة المنورة' },
  { id: 'Dammam', nameEn: 'Dammam', nameAr: 'الدمام' },
  { id: 'Khobar', nameEn: 'Al Khobar', nameAr: 'الخبر' },
  { id: 'Dhahran', nameEn: 'Dhahran', nameAr: 'الظهران' },
  { id: 'Ahsa', nameEn: 'Al Ahsa', nameAr: 'الأحساء' },
  { id: 'Taif', nameEn: 'Taif', nameAr: 'الطائف' },
  { id: 'Tabuk', nameEn: 'Tabuk', nameAr: 'تبوك' },
  { id: 'Abha', nameEn: 'Abha', nameAr: 'أبها' },
  { id: 'KhamisMushait', nameEn: 'Khamis Mushait', nameAr: 'خميس مشيط' },
  { id: 'Buraidah', nameEn: 'Buraidah', nameAr: 'بريدة' },
  { id: 'Unaizah', nameEn: 'Unaizah', nameAr: 'عنيزة' },
  { id: 'Hail', nameEn: 'Hail', nameAr: 'حائل' },
  { id: 'Jazan', nameEn: 'Jazan', nameAr: 'جازان' },
  { id: 'Najran', nameEn: 'Najran', nameAr: 'نجران' },
  { id: 'Yanbu', nameEn: 'Yanbu', nameAr: 'ينبع' },
  { id: 'Jubail', nameEn: 'Jubail', nameAr: 'الجبيل' },
  { id: 'Qatif', nameEn: 'Qatif', nameAr: 'القطيف' },
  { id: 'Hofuf', nameEn: 'Hofuf', nameAr: 'الهفوف' },
  { id: 'Sakaka', nameEn: 'Sakaka', nameAr: 'سكاكا' },
  { id: 'Arar', nameEn: 'Arar', nameAr: 'عرعر' },
  { id: 'AlBahah', nameEn: 'Al Bahah', nameAr: 'الباحة' },
  { id: 'Neom', nameEn: 'NEOM', nameAr: 'نيوم' },
  { id: 'Kharj', nameEn: 'Al Kharj', nameAr: 'الخرج' },
  { id: 'Diriyah', nameEn: 'Diriyah', nameAr: 'الدرعية' },
  { id: 'Dawadmi', nameEn: 'Dawadmi', nameAr: 'الدوادمي' },
  { id: 'Zulfi', nameEn: 'Az Zulfi', nameAr: 'الزلفي' },
  { id: 'Majmaah', nameEn: 'Al Majmaah', nameAr: 'المجمعة' },
  { id: 'Qurayyat', nameEn: 'Al Qurayyat', nameAr: 'القريات' },
  { id: 'Rafha', nameEn: 'Rafha', nameAr: 'رفحاء' },
  { id: 'Turaif', nameEn: 'Turaif', nameAr: 'طريف' },
  { id: 'WadiAldawair', nameEn: 'Wadi Al Dawasir', nameAr: 'وادي الدواسر' },
  { id: 'Bisha', nameEn: 'Bisha', nameAr: 'بيشة' },
  { id: 'Muhayil', nameEn: 'Muhayil Asir', nameAr: 'محايل عسير' },
  { id: 'Namira', nameEn: 'An Namas', nameAr: 'النماص' },
  { id: 'Sabya', nameEn: 'Sabya', nameAr: 'صبيا' },
  { id: 'AbuArish', nameEn: 'Abu Arish', nameAr: 'أبو عريش' },
  { id: 'Samtah', nameEn: 'Samtah', nameAr: 'صامطة' },
  { id: 'RasTanura', nameEn: 'Ras Tanura', nameAr: 'رأس تنورة' },
  { id: 'Khafji', nameEn: 'Al Khafji', nameAr: 'الخفجي' },
  { id: 'HafarAlBatin', nameEn: 'Hafar Al Batin', nameAr: 'حفر الباطن' },
  { id: 'Rabigh', nameEn: 'Rabigh', nameAr: 'رابغ' },
  { id: 'Lith', nameEn: 'Al Lith', nameAr: 'الليث' },
  { id: 'Qunfudhah', nameEn: 'Al Qunfudhah', nameAr: 'القنفذة' },
  { id: 'Umluj', nameEn: 'Umluj', nameAr: 'أملج' },
  { id: 'Duba', nameEn: 'Duba', nameAr: 'ضباء' },
  { id: 'Haql', nameEn: 'Haql', nameAr: 'حقل' },
] as const;

export type CustomerGenderOption = 'Male' | 'Female' | 'Other';

export const CUSTOMER_GENDER_OPTIONS: Array<{
  id: CustomerGenderOption;
  nameEn: string;
  nameAr: string;
}> = [
  { id: 'Male', nameEn: 'Male', nameAr: 'ذكر' },
  { id: 'Female', nameEn: 'Female', nameAr: 'أنثى' },
  { id: 'Other', nameEn: 'Other', nameAr: 'أخرى' },
];

export function saudiCityStorageKey(storeId: string): string {
  return `unityteck_saudi_cities_${storeId}`;
}

export type SaudiCityCatalogState = {
  /** Extra merchant-added cities for this store */
  custom: SaudiCityOption[];
  /** Built-in city ids the merchant removed from dropdowns */
  removedIds: string[];
};

export function emptySaudiCityCatalog(): SaudiCityCatalogState {
  return { custom: [], removedIds: [] };
}

export function loadSaudiCityCatalog(storeId: string): SaudiCityCatalogState {
  if (!storeId) return emptySaudiCityCatalog();
  try {
    const raw = localStorage.getItem(saudiCityStorageKey(storeId));
    if (!raw) return emptySaudiCityCatalog();
    const parsed = JSON.parse(raw) as Partial<SaudiCityCatalogState>;
    const custom = Array.isArray(parsed.custom)
      ? parsed.custom
          .filter((c) => c && typeof c.id === 'string' && c.id.trim())
          .map((c) => ({
            id: String(c.id).trim(),
            nameEn: String(c.nameEn || c.id).trim(),
            nameAr: String(c.nameAr || c.nameEn || c.id).trim(),
          }))
      : [];
    const removedIds = Array.isArray(parsed.removedIds)
      ? parsed.removedIds.map((id) => String(id)).filter(Boolean)
      : [];
    return { custom, removedIds };
  } catch {
    return emptySaudiCityCatalog();
  }
}

export function saveSaudiCityCatalog(storeId: string, state: SaudiCityCatalogState): void {
  if (!storeId) return;
  try {
    localStorage.setItem(saudiCityStorageKey(storeId), JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

export function resolveSaudiCities(catalog: SaudiCityCatalogState): SaudiCityOption[] {
  const removed = new Set(catalog.removedIds);
  const base = DEFAULT_SAUDI_CITIES.filter((c) => !removed.has(c.id));
  const seen = new Set(base.map((c) => c.id.toLowerCase()));
  const extras = catalog.custom.filter((c) => {
    const key = c.id.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [...base, ...extras];
}

export function cityLabel(city: SaudiCityOption, isAr: boolean): string {
  return isAr ? city.nameAr : city.nameEn;
}

/** Checkout helpers that need `{ en, ar }` shape */
export function saudiCitiesAsEnAr(catalog?: SaudiCityCatalogState): Array<{ en: string; ar: string }> {
  return resolveSaudiCities(catalog ?? emptySaudiCityCatalog()).map((c) => ({
    en: c.nameEn,
    ar: c.nameAr,
  }));
}
