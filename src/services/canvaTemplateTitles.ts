/**
 * Translation & title resolver for Canva Studio templates.
 * Guarantees NO Arabic text leaks into English mode, and clean, beautiful Arabic in Arabic mode.
 */

// Normalized dictionary of all imported PPTX pack keys and Arabic titles to natural English
const PACK_KEY_TO_ENGLISH: Record<string, string> = {
  // Beauty & Cosmetics
  'أبيض-ورمادي-وأسود-حديث-منتجات-تجميل-محتوى-انستغرام': 'Monochrome Modern Beauty & Cosmetics Post',
  'أبيض_ورمادي_وأسود_حديث_منتجات_تجميل_محتوى_انستغرام': 'Monochrome Modern Beauty & Cosmetics Post',

  // Food & Pizza
  'أحمر-وبرتقالي-حديث-بيتزا-منشور-إنستغرام': 'Red & Orange Modern Pizza Promo Post',
  'أحمر_وبرتقالي_حديث_بيتزا_منشور_إنستغرام': 'Red & Orange Modern Pizza Promo Post',
  'أسود-وبرتقالي-حديث-خصم-بيتزا-منشور-إنستغرام': 'Black & Orange Pizza Mega Sale Post',
  'أسود_وبرتقالي_حديث_خصم_بيتزا_منشور_إنستغرام': 'Black & Orange Pizza Mega Sale Post',

  // Hiring & Careers
  'أخضر-حديث-اعلان-وظيفي-منشور-instagram': 'Modern Job Hiring Announcement Post',
  'أخضر_حديث_اعلان_وظيفي_منشور_Instagram': 'Modern Job Hiring Announcement Post',

  // Quotes & Inspiration
  'أخضر-ذهبي-عصري-ملهم-اقتباس-منشور-انستغرام': 'Emerald & Gold Inspirational Quote Post',
  'أخضر_ذهبي_عصري_ملهم_اقتباس_منشور_انستغرام_': 'Emerald & Gold Inspirational Quote Post',
  'أسود-وأبيض-رمادي-ملهم-اقتباس-ديني-إنستغرام-بوست': 'Minimalist Spiritual Wisdom Post',
  'أسود_وأبيض_رمادي_ملهم_اقتباس_ديني_إنستغرام_بوست': 'Minimalist Spiritual Wisdom Post',
  'أسود-وأرجواني-وأزرق-غامض-نص-اقتباس-حكمي-منشور-انستغرام': 'Mystic Wisdom Quote Instagram Post',
  'أسود_وأرجواني_وأزرق_غامض_نص_اقتباس_حكمي_منشور_انستغرام': 'Mystic Wisdom Quote Instagram Post',

  // Jewelry
  'أسود-وذهبي-ورمادي-فخم-مجوهرات-instagram-post': 'Luxury Black & Gold Fine Jewelry Post',
  'أسود_وذهبي_ورمادي_فخم_مجوهرات_Instagram_Post': 'Luxury Black & Gold Fine Jewelry Post',
  'تصميم-منشور-انستجرام-عن-منتجات-متجر-بيع-مجوهرات-بسيط-1': 'Minimalist Jewelry Showcase Post 1',
  'تصميم_منشور_انستجرام_عن_منتجات_متجر_بيع_مجوهرات_بسيط_1': 'Minimalist Jewelry Showcase Post 1',
  'تصميم-منشور-انستجرام-عن-منتجات-متجر-بيع-مجوهرات-بسيط': 'Minimalist Jewelry Showcase Post',
  'تصميم_منشور_انستجرام_عن_منتجات_متجر_بيع_مجوهرات_بسيط': 'Minimalist Jewelry Showcase Post',
  'تصميم-منشور-انستجرام-لمنتجات-متجر-بيع-مجوهرات-بسيط': 'Fine Jewelry Boutique Highlights Post',
  'تصميم_منشور_انستجرام_لمنتجات_متجر_بيع_مجوهرات_بسيط': 'Fine Jewelry Boutique Highlights Post',
  'منشور-إنستغرام-للمجوهرات-الفاخرة-أنيق-وعصري-بألوان-داكنة': 'Dark Elegant Luxury Jewelry Post',
  'منشور_إنستغرام_للمجوهرات_الفاخرة_أنيق_وعصري_بألوان_داكنة': 'Dark Elegant Luxury Jewelry Post',
  'منشور-instagram-حملة-خصومات-على-المجوهرات-الفاخرة-الوردي-والبيج': 'Blush & Beige Fine Jewelry Discounts Post',
  'منشور_Instagram_حملة_خصومات_على_المجوهرات_الفاخرة_الوردي_والبيج': 'Blush & Beige Fine Jewelry Discounts Post',
  'منشور-instagram-حملة-مجوهرات-الجمال-الخالدة-بني-داكن-وأبيض-أنيق': 'Timeless Beauty Luxury Jewelry Campaign',
  'منشور_Instagram_حملة_مجوهرات_الجمال_الخالدة_بني_داكن_وأبيض_أنيق': 'Timeless Beauty Luxury Jewelry Campaign',
  'منشور-instagram-مجموعة-مجوهرات-رمضان-الفاخرة-ذهبي-وبيج-أنيق-وفوتوغرافي': 'Ramadan Fine Jewelry Gold & Beige Collection',
  'منشور_Instagram_مجموعة_مجوهرات_رمضان_الفاخرة_ذهبي_وبيج_أنيق_وفوتوغرافي': 'Ramadan Fine Jewelry Gold & Beige Collection',

  // Perfume & Fragrances
  'بنفسجي-وأزرق-ووردي-عصري-إعلان-عطر-منشور-instagram': 'Vibrant Modern Perfume Campaign Post',
  'بنفسجي_وأزرق_ووردي_عصري_إعلان_عطر_منشور_Instagram': 'Vibrant Modern Perfume Campaign Post',
  'بنفسجي-ورمادي-عصري-ترويج-عطر-برائحة-اللافندر-إنستغرام-پوست': 'Lavender Fragrance Special Launch Post',
  'بنفسجي_ورمادي_عصري_ترويج_عطر_برائحة_اللافندر_إنستغرام_پوست': 'Lavender Fragrance Special Launch Post',
  'ذهبي-وأسود-عصري-عطر-منشور-إنستغرام': 'Black & Gold Luxury Perfume Post',
  'ذهبي_وأسود_عصري_عطر_منشور_إنستغرام': 'Black & Gold Luxury Perfume Post',
  'منشور-instagram-أخضر-بسيط-إعلان-متجر-عطور': 'Emerald Green Perfume Store Promotion Post',
  'منشور_Instagram_أخضر_بسيط_إعلان_متجر_عطور': 'Emerald Green Perfume Store Promotion Post',

  // Ramadan Perfume Offers
  'تصميم-بوست-انستجرام-عن-عروض-شهر-رمضان-بسيط': 'Ramadan Special Deals Minimalist Post',
  'تصميم_بوست_انستجرام_عن_عروض_شهر_رمضان_بسيط': 'Ramadan Special Deals Minimalist Post',
  'تصميم-بوست-انستجرام-عن-عروض-عطور-شهر-رمضان-بسيط-1': 'Ramadan Perfume Offers Post 1',
  'تصميم_بوست_انستجرام_عن_عروض_عطور_شهر_رمضان_بسيط_1': 'Ramadan Perfume Offers Post 1',
  'تصميم-بوست-انستجرام-عن-عروض-عطور-شهر-رمضان-بسيط-2': 'Ramadan Perfume Offers Post 2',
  'تصميم_بوست_انستجرام_عن_عروض_عطور_شهر_رمضان_بسيط_2': 'Ramadan Perfume Offers Post 2',
  'تصميم-بوست-انستجرام-عن-عروض-عطور-شهر-رمضان-بسيط-3': 'Ramadan Perfume Offers Post 3',
  'تصميم_بوست_انستجرام_عن_عروض_عطور_شهر_رمضان_بسيط_3': 'Ramadan Perfume Offers Post 3',
  'تصميم-بوست-انستجرام-عن-عروض-عطور-شهر-رمضان-بسيط-4': 'Ramadan Perfume Offers Post 4',
  'تصميم_بوست_انستجرام_عن_عروض_عطور_شهر_رمضان_بسيط_4': 'Ramadan Perfume Offers Post 4',
  'تصميم-بوست-انستجرام-عن-عروض-عطور-شهر-رمضان-بسيط-5': 'Ramadan Perfume Offers Post 5',
  'تصميم_بوست_انستجرام_عن_عروض_عطور_شهر_رمضان_بسيط_5': 'Ramadan Perfume Offers Post 5',
  'تصميم-بوست-انستجرام-عن-عروض-عطور-شهر-رمضان-بسيط': 'Ramadan Perfume Deals Minimalist Post',
  'تصميم_بوست_انستجرام_عن_عروض_عطور_شهر_رمضان_بسيط': 'Ramadan Perfume Deals Minimalist Post',

  // Ramadan Fashion
  'تصميم-بوست-انستجرام-عن-عروض-متجر-ازياء-لشهر-رمضان-بسيط': 'Ramadan Fashion Boutique Sale Post',
  'تصميم_بوست_انستجرام_عن_عروض_متجر_ازياء_لشهر_رمضان_بسيط': 'Ramadan Fashion Boutique Sale Post',

  // Year End Offers
  'تصميم-بوست-انستجرام-عن-عروض-نهاية-العام-بسيط-1': 'Year-End Mega Offers Post 1',
  'تصميم_بوست_انستجرام_عن_عروض_نهاية_العام_بسيط_1': 'Year-End Mega Offers Post 1',
  'تصميم-بوست-انستجرام-عن-عروض-نهاية-العام-بسيط-2': 'Year-End Mega Offers Post 2',
  'تصميم_بوست_انستجرام_عن_عروض_نهاية_العام_بسيط_2': 'Year-End Mega Offers Post 2',
  'تصميم-بوست-انستجرام-عن-عروض-نهاية-العام-بسيط-3': 'Year-End Mega Offers Post 3',
  'تصميم_بوست_انستجرام_عن_عروض_نهاية_العام_بسيط_3': 'Year-End Mega Offers Post 3',
  'تصميم-بوست-انستجرام-عن-عروض-نهاية-العام-بسيط-4': 'Year-End Mega Offers Post 4',
  'تصميم_بوست_انستجرام_عن_عروض_نهاية_العام_بسيط_4': 'Year-End Mega Offers Post 4',
  'تصميم-بوست-انستجرام-عن-عروض-نهاية-العام-بسيط-5': 'Year-End Mega Offers Post 5',
  'تصميم_بوست_انستجرام_عن_عروض_نهاية_العام_بسيط_5': 'Year-End Mega Offers Post 5',
  'تصميم-بوست-انستجرام-عن-عروض-نهاية-العام-بسيط': 'Year-End Mega Offers Post',
  'تصميم_بوست_انستجرام_عن_عروض_نهاية_العام_بسيط': 'Year-End Mega Offers Post',

  // Coffee & Roasters
  'منشور-انستجرام-instagram-post-بنى-عصرى-عن-القهوة-1': 'Modern Specialty Coffee Post 1',
  'منشور_انستجرام_Instagram_post_بنى_عصرى_عن_القهوة_1': 'Modern Specialty Coffee Post 1',
  'منشور-انستجرام-instagram-post-بنى-عصرى-عن-القهوة': 'Modern Specialty Coffee Post',
  'منشور_انستجرام_Instagram_post_بنى_عصرى_عن_القهوة': 'Modern Specialty Coffee Post',

  // Flyers (already English keys)
  'green-white-modern-grocery-mega-sale-flyer': 'Green & White Modern Grocery Mega Sale Flyer',
  'red-white-modern-grocery-big-sale-flyer': 'Red & White Modern Grocery Big Sale Flyer',
};

const ARABIC_CHAR_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

/** Helper to clean raw filenames or snake_case/kebab-case into clean words */
export function cleanRawTitle(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\.[a-zA-Z0-9]+$/, '') // remove extension
    .replace(/[_\-]+/g, ' ') // replace _ and - with space
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();
}

/** Check if a string contains any Arabic characters */
export function hasArabicChars(str?: string): boolean {
  if (!str) return false;
  return ARABIC_CHAR_REGEX.test(str);
}

/** Translate common Arabic design phrases to clean English when not found in exact dictionary */
function fallbackTranslateArabicToEnglish(arabicText: string): string {
  let cleaned = cleanRawTitle(arabicText);

  // Extract trailing numbers (e.g. "1", "2")
  const numMatch = cleaned.match(/\s+(\d+)$/);
  const trailingNum = numMatch ? ` ${numMatch[1]}` : '';
  if (numMatch) {
    cleaned = cleaned.replace(/\s+\d+$/, '').trim();
  }

  // Keywords mapping for design domains
  const isPerfume = /عطور|عطر|برائحة|لافندر/i.test(cleaned);
  const isRamadan = /رمضان/i.test(cleaned);
  const isYearEnd = /نهاية العام/i.test(cleaned);
  const isJewelry = /مجوهرات/i.test(cleaned);
  const isCoffee = /قهوة|بنى/i.test(cleaned);
  const isPizza = /بيتزا/i.test(cleaned);
  const isFashion = /ازياء|أزياء/i.test(cleaned);
  const isJob = /وظيفي|اعلان وظيفي/i.test(cleaned);
  const isBeauty = /تجميل/i.test(cleaned);
  const isQuote = /اقتباس|حكمي|ديني/i.test(cleaned);
  const isSale = /عروض|خصم|خصومات|تخفيضات/i.test(cleaned);

  const parts: string[] = [];

  if (isRamadan) parts.push('Ramadan');
  if (isYearEnd) parts.push('Year-End');

  if (isPerfume) parts.push('Perfume');
  else if (isJewelry) parts.push('Fine Jewelry');
  else if (isCoffee) parts.push('Artisan Coffee');
  else if (isPizza) parts.push('Pizza Promo');
  else if (isFashion) parts.push('Fashion Boutique');
  else if (isJob) parts.push('Job Hiring');
  else if (isBeauty) parts.push('Cosmetics & Beauty');
  else if (isQuote) parts.push('Inspiring Quote');

  if (isSale) parts.push('Offers');
  parts.push('Instagram Post');

  const baseTitle = parts.length > 1 ? parts.join(' ') : 'Modern Design Template';
  return `${baseTitle}${trailingNum}`;
}

/**
 * Resolves the display title for a template, strictly respecting the target language.
 * When isAr is false: GUARANTEES no Arabic characters appear!
 */
export function resolveDesignTitle(
  tpl: {
    id?: string;
    packKey?: string;
    nameEn?: string;
    nameAr?: string;
    title?: string;
    category?: string;
  },
  isAr: boolean,
): string {
  const packKey = tpl.packKey || (tpl.id ? String(tpl.id).replace(/^(mytpl-pptx-|dsd-pptx-[^-]+-)/, '') : '');
  const rawAr = tpl.nameAr || tpl.title || '';
  const rawEn = tpl.nameEn || tpl.title || '';

  if (isAr) {
    // In Arabic mode: prefer nameAr, otherwise clean packKey or nameEn
    if (rawAr && hasArabicChars(rawAr)) {
      return cleanRawTitle(rawAr);
    }
    if (packKey && PACK_KEY_TO_ENGLISH[packKey]) {
      // If we have an Arabic packKey directly, clean it
      if (hasArabicChars(packKey)) return cleanRawTitle(packKey);
    }
    return cleanRawTitle(rawAr || rawEn || 'تصميم المتجر');
  }

  // ENGLISH MODE (isAr === false):
  // 1. If packKey matches known dictionary, use polished English title
  if (packKey && PACK_KEY_TO_ENGLISH[packKey]) {
    return PACK_KEY_TO_ENGLISH[packKey];
  }

  // 2. Check if rawEn has NO Arabic characters and is meaningful
  if (rawEn && !hasArabicChars(rawEn) && rawEn.trim().length > 1) {
    const cleaned = cleanRawTitle(rawEn);
    // Don't show technical internal ids as title
    if (!cleaned.startsWith('mytpl-') && !cleaned.startsWith('dsd-pptx-')) {
      return cleaned;
    }
  }

  // 3. Check if packKey is in dictionary with variations
  const normalizedKey = cleanRawTitle(packKey).replace(/\s+/g, '-');
  if (PACK_KEY_TO_ENGLISH[normalizedKey]) {
    return PACK_KEY_TO_ENGLISH[normalizedKey];
  }

  // 4. Check if rawAr or rawEn matches any known dictionary key
  const normalizedAr = cleanRawTitle(rawAr).replace(/\s+/g, '-');
  if (PACK_KEY_TO_ENGLISH[normalizedAr]) {
    return PACK_KEY_TO_ENGLISH[normalizedAr];
  }

  // 5. If Arabic text is present, fallback translate so NO Arabic is output in English mode
  const arabicSource = hasArabicChars(rawAr) ? rawAr : hasArabicChars(rawEn) ? rawEn : hasArabicChars(packKey) ? packKey : '';
  if (arabicSource) {
    return fallbackTranslateArabicToEnglish(arabicSource);
  }

  // 6. Safe default English title
  return cleanRawTitle(rawEn) || 'Modern Store Template';
}

/**
 * Detect language of a template based on its original content & titles.
 * Useful for the language filter (All / English / Arabic).
 */
export function detectTemplateLanguage(tpl: {
  id?: string;
  packKey?: string;
  nameEn?: string;
  nameAr?: string;
  title?: string;
}): 'ar' | 'en' | 'universal' {
  const packKey = tpl.packKey || String(tpl.id || '');
  const hasArInKey = hasArabicChars(packKey);
  const hasArInTitle = hasArabicChars(tpl.nameAr) || hasArabicChars(tpl.title);

  if (hasArInKey || hasArInTitle) {
    return 'ar';
  }

  // Specific English flyer templates
  if (packKey.includes('grocery') || packKey.includes('flyer') || packKey.includes('mega-sale')) {
    return 'en';
  }

  return 'universal';
}
