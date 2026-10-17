import { Store, Product } from '../types';

/**
 * Returns a clean, concise, language-appropriate store name for dashboard and UI.
 * In Arabic: Returns the clean full Arabic name (e.g. "هدايا مكة").
 * In English: Returns the clean concise English name (e.g. "Makkah Flowers").
 */
export function getStoreDisplayName(store?: Partial<Store> | null, locale: string = 'ar'): string {
  if (!store) {
    return locale === 'ar' ? 'المتجر' : 'Store';
  }

  const isAr = locale === 'ar';
  const rawName = (store.name || '').trim();
  const slug = (store.slug || '').toLowerCase();
  const id = String(store.id || '');

  // 1. Check known store IDs / slugs / names first for clean parity
  if (
    id === 'store-1' ||
    id === '1' ||
    slug === 'giftshop-sa' ||
    slug === 'makkah-fresh-flowers' ||
    /هدايا مكة|ورود مكة|gift ?shop|makkah/i.test(rawName)
  ) {
    if (isAr) {
      return store.name || store.nameAr || 'هدايا مكة';
    }
    return store.nameEn || 'Makkah Flowers';
  }

  if (
    id === 'store-coffee' ||
    slug === 'coffee-store' ||
    /قهوة|coffee/i.test(rawName)
  ) {
    if (isAr) {
      return store.nameAr || store.name || 'متجر القهوة المختصة';
    }
    return store.nameEn || 'Specialty Coffee Roasters';
  }

  if (
    id === 'store-bleco' ||
    id === 'store-car' ||
    slug === 'alsaeedi-cars' ||
    /سعيدي|سيارات|bleco|car/i.test(rawName)
  ) {
    if (isAr) {
      return store.nameAr || store.name || 'متجر السعيدي لخدمات السيارات';
    }
    return store.nameEn || 'Al-Saeedi Car Services & Accessories';
  }

  // 2. Explicit localized fields
  if (isAr) {
    if (store.nameAr && !store.nameAr.includes('(')) return store.nameAr;
    if (/[\u0600-\u06FF]/.test(rawName)) {
      const cleaned = rawName.replace(/\s*\([^)]*\)\s*$/, '').trim();
      const parts = cleaned.split(/[-–—]/);
      const arPart = parts.find((p) => /[\u0600-\u06FF]/.test(p));
      if (arPart) return arPart.trim();
      return cleaned;
    }
    return store.nameAr || rawName || 'المتجر';
  } else {
    if (store.nameEn && !/[\u0600-\u06FF]/.test(store.nameEn)) return store.nameEn;
    // Extract English within parentheses or after hyphen if present
    const matchParen = rawName.match(/\(([^)]+)\)/);
    if (matchParen && /^[A-Za-z0-9\s&'-]+$/.test(matchParen[1].trim())) {
      return matchParen[1].trim();
    }
    const parts = rawName.split(/[-–—]/);
    const enPart = parts.find((p) => /[A-Za-z]/.test(p) && !/[\u0600-\u06FF]/.test(p));
    if (enPart) return enPart.trim();
    if (/[\u0600-\u06FF]/.test(rawName) && !/[A-Za-z]/.test(rawName)) {
      return store.slug || 'Store';
    }
    return rawName || 'Store';
  }
}

const CATEGORY_MAP_TO_EN: Record<string, string> = {
  // Store identity categories
  'زهور طبيعية وهدايا فاخرة': 'Flowers & Luxury Gifts',
  'قهوة مختصة وأدوات باريستا': 'Specialty Coffee & Barista Tools',
  'تلابيس مقاعد وأرضيات واكسسوارات سيارات': 'Car Seat Covers, Precision Floor Mats & Accessories',
  'المجوهرات والذهب': 'Jewelry & Gold',
  'مجوهرات': 'Jewelry',
  'الدراجات': 'Cycles & Bikes',
  'القهوة والإسبريسو': 'Coffee & Espresso',
  'الأزياء والملابس': 'Fashion & Apparel',
  'أزياء وموضة': 'Fashion & Apparel',
  'المنزل والمعيشة': 'Home & Living',
  'الجمال والصحة': 'Beauty & Health',
  'الإلكترونيات': 'Electronics',
  'إلكترونيات': 'Electronics',
  'الرياضة واللياقة': 'Sports & Fitness',
  'تجارة عامة': 'Retail',
  'عطور وبخور': 'Perfumes & Oud',
  'أحذية رياضية': 'Sneakers',
  'ملابس': 'Apparel',
  'إكسسوارات': 'Accessories',
  'إكسسوارات سيارات': 'Car Accessories',
  'زهور طبيعية': 'Natural Flowers',
  'هدايا فاخرة': 'Luxury Gifts',
  'كيك وحلويات': 'Cakes & Sweets',

  // Hadaya Makkah / Flowers categories
  'باقات الورود الطبيعية': 'Natural Flower Bouquets',
  'هدايا عيد الحب والرومانسية': 'Valentine & Romance Gifts',
  'فازات ورد طبيعي': 'Natural Flower Vases',
  'هدايا رجالية ملكية': "Royal Men's Gifts",
  'هدايا الزواج والعرائس': 'Wedding & Bridal Gifts',
  'باقات فاخرة': 'Luxury Bouquets',
  'ورد أبيض': 'White Roses',
  'ورد أحمر': 'Red Roses',
  'هدايا وخطوبة': 'Gifts & Engagement',
  'هدايا رومانسية': 'Romantic Gifts',
  'ورد وشوكولاتة بلجيكية فاخرة': 'Belgian Chocolate & Luxury Roses',
  'ورد و شوكليت باتشي': 'Roses & Patchi Chocolate',
  'ورد وشوكوليت بستاني': 'Roses & Bostani Chocolate',
  'عيد ميلاد': 'Birthday Gifts',
  'ورد مع كيك': 'Roses with Cake',
  'هدايا رجالية': "Men's Gifts",
  'تقديمة ورد مع قهوة وحلا': 'Roses with Coffee & Sweets',
  'لوحات مواجيب': 'Mawajib Wooden Plaques',
  'لوحات مواجيب وتراث حجازي': 'Mawajeeb Wooden Plaques',
  'هدايا المواليد': 'Newborn Welcome Gifts',
  'هدايا التخرج': 'Graduation Milestones',
  'هدايا نسائية': "Luxury Women's Gifts",
  'فازات الورود مع شوكليت': 'Flower Vases with Chocolate',
  'ورود مع أسماك زينة': 'Roses with Aquarium Fish',
  'ورود مع عصافير الحب': 'Roses with Lovebirds',
  'تقديمة ورد وقهوة': 'Roses & Coffee Presentation',
  'بينتو كيك وورد': 'Bento Cake & Flowers',
  'باقات مختارة': 'Selected Bouquets',
  'باقات': 'Bouquets',

  // HiBrew Coffee categories
  'حبوب القهوة المختصة': 'Specialty Coffee Beans',
  'أدوات التحضير المقطرة': 'Drip Brewing Tools',
  'معدات الإسبريسو': 'Espresso Equipment',
  'القهوة الباردة': 'Cold Brew',
  'مكائن القهوة والإسبريسو': 'Espresso & Coffee Machines',
  'مكائن ومطاحن قهوة وأدوات باريستا وأركان فاخرة': 'Coffee Machines, Grinders & Barista Stations',
  'أكواب وسيراميك فاخر': 'Ceramic Cups & Glassware',

  // Bleco / Car Accessories categories
  'أرضيات': 'Car Floor Mats',
  'أرضيات السيارة': 'Car Floor Mats',
  'تلابيس مقاعد': 'Car Seat Covers',
  'تلابيس المقاعد': 'Car Seat Covers',
  'أرضيات 5D': '5D Car Floor Mats',
  'تنجيد مقاعد': 'Custom Seat Upholstery',
};

const CATEGORY_MAP_TO_AR: Record<string, string> = {
  // Store identity categories
  'Flowers & Luxury Gifts': 'زهور طبيعية وهدايا فاخرة',
  'Specialty Coffee & Barista Tools': 'قهوة مختصة وأدوات باريستا',
  'Car Seat Covers, Precision Floor Mats & Accessories': 'تلابيس مقاعد وأرضيات واكسسوارات سيارات',
  'Jewelry & Gold': 'المجوهرات والذهب',
  'Jewelry': 'المجوهرات والذهب',
  'Cycles & Bikes': 'الدراجات',
  'Coffee & Espresso': 'القهوة والإسبريسو',
  'Coffee Machines': 'القهوة والإسبريسو',
  'Fashion & Apparel': 'الأزياء والملابس',
  'Fashion': 'الأزياء والملابس',
  'Home & Living': 'المنزل والمعيشة',
  'Beauty & Health': 'الجمال والصحة',
  'Electronics': 'الإلكترونيات',
  'Sports & Fitness': 'الرياضة واللياقة',
  'Sports': 'الرياضة واللياقة',
  'Retail': 'تجارة عامة',
  'Sneakers': 'أحذية رياضية',
  'Apparel': 'ملابس',
  'Accessories': 'إكسسوارات',
  'Car Accessories': 'إكسسوارات سيارات',
  'Natural Flowers': 'زهور طبيعية',
  'Luxury Gifts': 'هدايا فاخرة',
  'Cakes & Sweets': 'كيك وحلويات',

  // Hadaya Makkah / Flowers categories
  'Natural Flower Bouquets': 'باقات الورود الطبيعية',
  'Valentine & Romance Gifts': 'هدايا عيد الحب والرومانسية',
  'Valentine & Romantic Gifts': 'هدايا عيد الحب والرومانسية',
  'Natural Flower Vases': 'فازات ورد طبيعي',
  "Royal Men's Gifts": 'هدايا رجالية ملكية',
  'Wedding & Bridal Gifts': 'هدايا الزواج والعرائس',
  'Wedding & Bridal Keepsakes': 'هدايا الزواج والعرائس',
  'Luxury Bouquets': 'باقات فاخرة',
  'White Roses': 'ورد أبيض',
  'Red Roses': 'ورد أحمر',
  'Gifts & Engagement': 'هدايا وخطوبة',
  'Romantic Gifts': 'هدايا رومانسية',
  'Belgian Chocolate & Luxury Roses': 'ورد وشوكولاتة بلجيكية فاخرة',
  'Roses & Patchi Chocolate': 'ورد و شوكليت باتشي',
  'Roses & Bostani Chocolate': 'ورد وشوكوليت بستاني',
  'Birthday Gifts': 'عيد ميلاد',
  'Birthday': 'عيد ميلاد',
  'Birthday Celebrations': 'عيد ميلاد',
  'Roses with Cake': 'ورد مع كيك',
  "Men's Gifts": 'هدايا رجالية',
  'Roses with Coffee & Sweets': 'تقديمة ورد مع قهوة وحلا',
  'Mawajib Wooden Plaques': 'لوحات مواجيب',
  'Mawajeeb Wooden Plaques': 'لوحات مواجيب وتراث حجازي',
  'Newborn Welcome Gifts': 'هدايا المواليد',
  'Graduation Milestones': 'هدايا التخرج',
  "Luxury Women's Gifts": 'هدايا نسائية',
  'Flower Vases with Chocolate': 'فازات الورود مع شوكليت',
  'Roses with Aquarium Fish': 'ورود مع أسماك زينة',
  'Roses with Lovebirds': 'ورود مع عصافير الحب',
  'Roses & Coffee Presentation': 'تقديمة ورد وقهوة',
  'Bento Cake & Flowers': 'بينتو كيك وورد',
  'Selected Bouquets': 'باقات مختارة',
  'Bouquets': 'باقات',

  // HiBrew Coffee categories
  'Specialty Coffee Beans': 'حبوب القهوة المختصة',
  'Drip Brewing Tools': 'أدوات التحضير المقطرة',
  'Espresso Equipment': 'معدات الإسبريسو',
  'Cold Brew': 'القهوة الباردة',
  'Espresso & Coffee Machines': 'مكائن القهوة والإسبريسو',
  'Coffee Machines, Grinders & Barista Stations': 'مكائن ومطاحن قهوة وأدوات باريستا وأركان فاخرة',
  'Ceramic Cups & Glassware': 'أكواب وسيراميك فاخر',

  // Bleco / Car Accessories categories
  'Car Floor Mats': 'أرضيات السيارة',
  'Floors & Mats': 'أرضيات السيارة',
  'Car Seat Covers': 'تلابيس مقاعد',
  '5D Car Floor Mats': 'أرضيات 5D',
  'Custom Seat Upholstery': 'تنجيد مقاعد',
};

export function getStoreDisplayCategory(store?: Partial<Store> | null, locale: string = 'ar'): string {
  if (!store) return locale === 'ar' ? 'تجارة عامة' : 'Retail';
  const isAr = locale === 'ar';
  const id = String(store.id || '');
  const cat = (store.category || '').trim();

  if (id === 'store-1') {
    return isAr
      ? (store.categoryAr || 'زهور طبيعية وهدايا فاخرة')
      : (store.categoryEn || 'Flowers & Luxury Gifts');
  }
  if (id === 'store-coffee') {
    return isAr
      ? (store.categoryAr || 'قهوة مختصة وأدوات باريستا')
      : (store.categoryEn || 'Specialty Coffee & Barista Tools');
  }
  if (id === 'store-bleco') {
    return isAr
      ? (store.categoryAr || 'تلابيس مقاعد وأرضيات واكسسوارات سيارات')
      : (store.categoryEn || 'Car Seat Covers, Precision Floor Mats & Accessories');
  }

  if (isAr) {
    if (store.categoryAr) return store.categoryAr;
    if (CATEGORY_MAP_TO_AR[cat]) return CATEGORY_MAP_TO_AR[cat];
    if (/[\u0600-\u06FF]/.test(cat)) return cat;
    return cat || 'تجارة عامة';
  } else {
    if (store.categoryEn && !/[\u0600-\u06FF]/.test(store.categoryEn)) return store.categoryEn;
    if (CATEGORY_MAP_TO_EN[cat]) return CATEGORY_MAP_TO_EN[cat];
    if (!/[\u0600-\u06FF]/.test(cat) && cat) return cat;
    return 'Retail';
  }
}

const OWNER_MAP_TO_EN: Record<string, string> = {
  'متجر هدايا مكة': 'Makkah Gifts Store',
  'ريان السليمان': 'Rayan Al-Sulaiman',
  'متجر السعيدي لخدمات السيارات': 'Al-Saeedi Car Services',
  'فهد العتيبي': 'Fahad Al-Otaibi',
  'سلطان العتيبي': 'Sultan Al-Otaibi',
};

const OWNER_MAP_TO_AR: Record<string, string> = {
  'Makkah Gifts Store': 'متجر هدايا مكة',
  'Rayan Al-Sulaiman': 'ريان السليمان',
  'Al-Saeedi Car Services': 'متجر السعيدي لخدمات السيارات',
  'Fahad Al-Otaibi': 'فهد العتيبي',
  'Sultan Al-Otaibi': 'سلطان العتيبي',
};

export function getStoreDisplayOwner(store?: Partial<Store> | null, locale: string = 'ar'): string {
  if (!store) return '';
  const isAr = locale === 'ar';
  const id = String(store.id || '');
  const owner = (store.owner || '').trim();

  if (id === 'store-1') {
    return isAr ? (store.ownerAr || 'متجر هدايا مكة') : (store.ownerEn || 'Makkah Gifts Store');
  }
  if (id === 'store-coffee') {
    return isAr ? (store.ownerAr || 'ريان السليمان') : (store.ownerEn || 'Rayan Al-Sulaiman');
  }
  if (id === 'store-bleco') {
    return isAr ? (store.ownerAr || 'متجر السعيدي لخدمات السيارات') : (store.ownerEn || 'Al-Saeedi Car Services');
  }

  if (isAr) {
    if (store.ownerAr) return store.ownerAr;
    if (OWNER_MAP_TO_AR[owner]) return OWNER_MAP_TO_AR[owner];
    return owner;
  } else {
    if (store.ownerEn && !/[\u0600-\u06FF]/.test(store.ownerEn)) return store.ownerEn;
    if (OWNER_MAP_TO_EN[owner]) return OWNER_MAP_TO_EN[owner];
    if (!/[\u0600-\u06FF]/.test(owner) && owner) return owner;
    return store.ownerEn || owner;
  }
}

export function getProductDisplayName(product?: Partial<Product> | null, locale: string = 'ar'): string {
  if (!product) return '';
  const isAr = locale === 'ar';
  if (isAr) {
    return product.nameAr || product.name || '';
  }
  return product.nameEn || product.name || '';
}

export function getProductDisplayCategory(
  categoryOrProduct?: string | Partial<Product> | null,
  locale: string = 'ar',
): string {
  if (!categoryOrProduct) return locale === 'ar' ? 'عام' : 'General';
  const isAr = locale === 'ar';

  if (typeof categoryOrProduct !== 'string' && categoryOrProduct) {
    if (isAr && categoryOrProduct.categoryAr) return categoryOrProduct.categoryAr;
    if (!isAr && categoryOrProduct.categoryEn && !/[\u0600-\u06FF]/.test(categoryOrProduct.categoryEn)) {
      return categoryOrProduct.categoryEn;
    }
  }

  const raw = (
    typeof categoryOrProduct === 'string'
      ? categoryOrProduct
      : categoryOrProduct.category || categoryOrProduct.categoryAr || categoryOrProduct.categoryEn || ''
  ).trim();

  if (!raw) return isAr ? 'عام' : 'General';

  if (isAr) {
    if (CATEGORY_MAP_TO_AR[raw]) return CATEGORY_MAP_TO_AR[raw];
    if (/[\u0600-\u06FF]/.test(raw)) return raw;
    return CATEGORY_MAP_TO_AR[raw] || raw || 'عام';
  } else {
    if (CATEGORY_MAP_TO_EN[raw]) return CATEGORY_MAP_TO_EN[raw];
    if (!/[\u0600-\u06FF]/.test(raw)) return raw;
    return CATEGORY_MAP_TO_EN[raw] || 'Bouquets & Gifts';
  }
}
