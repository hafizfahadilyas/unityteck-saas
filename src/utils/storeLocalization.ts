import { Store, Product } from '../types';
import { localizedSaudiCity } from '../data/saudiCities';

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
  'مطاحن القهوة الاحترافية': 'Precision Coffee Mills',
  'مطاحن القهوة': 'Coffee Mills',
  'دواليب وأركان القهوة الفاخرة': 'Luxury Coffee Cabinets & Stations',
  'دواليب وأركان القهوة': 'Coffee Cabinets & Stations',
  'أركان ودواليب القهوة الفاخرة ومستلزمات الباريستا': 'Luxury Coffee Stations & Barista Tools',
  'مستلزمات الباريستا والأكواب': 'Barista Accessories & Ceramic Cups',
  'مستلزمات الباريستا': 'Barista Accessories',
  'العروض والبكجات الحصرية': 'Exclusive Offers & Bundles',

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
  'Precision Coffee Mills': 'مطاحن القهوة الاحترافية',
  'Coffee Mills': 'مطاحن القهوة',
  'Luxury Coffee Cabinets & Stations': 'دواليب وأركان القهوة الفاخرة',
  'Coffee Cabinets & Stations': 'دواليب وأركان القهوة',
  'Luxury Coffee Stations & Barista Tools': 'أركان ودواليب القهوة الفاخرة ومستلزمات الباريستا',
  'Barista Accessories & Ceramic Cups': 'مستلزمات الباريستا والأكواب',
  'Barista Accessories': 'مستلزمات الباريستا',
  'Exclusive Offers & Bundles': 'العروض والبكجات الحصرية',

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
  'متجر هدايا': 'Makkah Gifts Store',
  'هدايا مكة': 'Makkah Gifts Store',
  'ريان السليمان': 'Rayan Al-Sulaiman',
  'ريان السليمان - وكيل هاي برو المعتمد': 'Rayan Al-Sulaiman',
  'متجر السعيدي لخدمات السيارات': 'Al-Saeedi Car Services',
  'متجر السعيدي لخدمات السيارات (مؤسسة بلاكو)': 'Al-Saeedi Car Services',
  'متجر السعيدي لخدمات السيارات (مؤسسة بلاكو للتجارة)': 'Al-Saeedi Car Services',
  'فهد العتيبي': 'Fahad Al-Otaibi',
  'سلطان العتيبي': 'Sultan Al-Otaibi',
};

const OWNER_MAP_TO_AR: Record<string, string> = {
  'Makkah Gifts Store': 'متجر هدايا مكة',
  'Makkah Flowers': 'متجر هدايا مكة',
  'Rayan Al-Sulaiman': 'ريان السليمان',
  'Rayan Al-Sulaiman - HiBrew Official Agent': 'ريان السليمان',
  'Al-Saeedi Car Services': 'متجر السعيدي لخدمات السيارات',
  'Al-Saeedi Manager': 'متجر السعيدي لخدمات السيارات',
  'Fahad Al-Otaibi': 'فهد العتيبي',
  'Sultan Al-Otaibi': 'سلطان العتيبي',
};

/** Short owner chip for topbar (strip title after " - "). */
export function shortStoreOwnerName(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return '';
  const cut = trimmed.split(/\s[-–—]\s/)[0]?.trim();
  return cut || trimmed;
}

export function getStoreDisplayOwner(store?: Partial<Store> | null, locale: string = 'ar'): string {
  if (!store) return '';
  const isAr = locale === 'ar';
  const id = String(store.id || '');
  const owner = (store.owner || '').trim();
  const ownerAr = shortStoreOwnerName((store.ownerAr || '').trim());
  const ownerEn = shortStoreOwnerName((store.ownerEn || '').trim());

  if (id === 'store-1') {
    return shortStoreOwnerName(
      isAr ? ownerAr || OWNER_MAP_TO_AR[owner] || 'متجر هدايا مكة' : ownerEn || OWNER_MAP_TO_EN[owner] || 'Makkah Gifts Store',
    );
  }
  if (id === 'store-coffee') {
    return shortStoreOwnerName(
      isAr ? ownerAr || OWNER_MAP_TO_AR[owner] || 'ريان السليمان' : ownerEn || OWNER_MAP_TO_EN[owner] || 'Rayan Al-Sulaiman',
    );
  }
  if (id === 'store-bleco') {
    return shortStoreOwnerName(
      isAr
        ? ownerAr || OWNER_MAP_TO_AR[owner] || 'متجر السعيدي لخدمات السيارات'
        : ownerEn || OWNER_MAP_TO_EN[owner] || 'Al-Saeedi Car Services',
    );
  }

  if (isAr) {
    if (ownerAr) return ownerAr;
    if (OWNER_MAP_TO_AR[owner]) return OWNER_MAP_TO_AR[owner];
    return shortStoreOwnerName(owner);
  }
  if (ownerEn && !/[\u0600-\u06FF]/.test(ownerEn)) return ownerEn;
  if (OWNER_MAP_TO_EN[owner]) return OWNER_MAP_TO_EN[owner];
  if (!/[\u0600-\u06FF]/.test(owner) && owner) return shortStoreOwnerName(owner);
  return shortStoreOwnerName(ownerEn || OWNER_MAP_TO_EN[owner] || owner);
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
  }

  if (CATEGORY_MAP_TO_EN[raw]) return CATEGORY_MAP_TO_EN[raw];
  // Never leak Arabic into English chrome — unmapped AR → neutral label.
  if (/[\u0600-\u06FF]/.test(raw)) return 'General';
  return raw || 'General';
}

const CUSTOMER_NAME_EN_MAP: Record<string, string> = {
  'ريان بن عبد الله السليمان': 'Rayan Al-Sulaiman',
  'نورة بنت سعد القحطاني': 'Noura Al-Qahtani',
  'سلطان فهد الغامدي': 'Sultan Al-Ghamdi',
  'أحمد بن محمد القحطاني': 'Ahmed Al-Qahtani',
  'أحمد القحطاني': 'Ahmed Al-Qahtani',
  'أحمد محمد': 'Ahmed Mohammed',
  'سارة أحمد': 'Sarah Ahmed',
  'محمد علي': 'Mohammed Ali',
  'ريم خالد': 'Reem Khalid',
  'عبد الله الشمري': 'Abdullah Al-Shammari',
  'عبد الرحمن الشمري': 'Abdulrahman Al-Shammari',
  'فيصل المطيري': 'Faisal Al-Mutairi',
  'فيصل بن سعود المطيري': 'Faisal Al-Mutairi',
  'لمى بنت فهد العتيبي': 'Lama Al-Otaibi',
  'نورة الحربي': 'Noura Al-Harbi',
  'سعد الغامدي': 'Saad Al-Ghamdi',
  'منى العتيبي': 'Mona Al-Otaibi',
  'خالد الدوسري': 'Khalid Al-Dossari',
  'فهد العنزي': 'Fahad Al-Enezi',
  'نورة سعد': 'Noura Saad',
  'سارة المحمدي': 'Sarah Al-Mohammadi',
  'بدر بن خالد العتيبي': 'Bader Al-Otaibi',
  'هند بنت ماجد التميمي': 'Hind Al-Tamimi',
  'مشعل بن ناصر الدوسري': 'Meshal Al-Dossari',
  'أحمد بن طارق الزهراني': 'Ahmed Al-Zahrani',
  'عبدالرحمن السديس': 'Abdulrahman Al-Sudais',
  'فهد العتيبي': 'Fahad Al-Otaibi',
  'حسان الزهراني': 'Hassan Al-Zahrani',
  'حسن الزهراني': 'Hassan Al-Zahrani',
  'طارق المنصور': 'Tariq Al-Mansoor',
  'سارة عبد العزيز الشريف': 'Sarah Abdulaziz Al-Sharif',
  'محمد أنس القحطاني': 'Mohammed Anas Al-Qahtani',
  'فاطمة الشهري': 'Fatima Al-Shehri',
  'عبد الله السعيد': 'Abdullah Al-Saeed',
  'نورة الدوسري': 'Noura Al-Dossari',
  'خالد بن ناصر الغامدي': 'Khalid Al-Ghamdi',
  'الأمير فيصل بن خالد آل سعود': 'Prince Faisal bin Khalid Al Saud',
  'ماجد بن ناصر الحربي': 'Majed Al-Harbi',
  'خالد بن عبد الرحمن الدوسري': 'Khalid Al-Dossari',
  'بندر بن عبد الله السبيعي': 'Bandar Al-Subaie',
  'تركي بن سعد العتيبي': 'Turki Al-Otaibi',
  'سعد بن فهد الغامدي': 'Saad Al-Ghamdi',
  'عبد العزيز بن سعود المقرن': 'Abdulaziz Al-Muqrin',
  'محمد بن يحيى الشهري': 'Mohammed Al-Shehri',
  'نواف بن فهد العنزي': 'Nawaf Al-Enezi',
  'سلمان بن ظافر القحطاني': 'Salman Al-Qahtani',
  'فهد بن منصور المطيري': 'Fahad Al-Mutairi',
  'ياسر بن عبد الله الزهراني': 'Yasser Al-Zahrani',
  'عبد الله بن حمد الهاجري': 'Abdullah Al-Hajri',
  'حمد بن راشد المري': 'Hamad Al-Marri',
};

function isCorruptedDisplayName(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return true;
  // ASCII ?, fullwidth ？, replacement char — classic mojibake leftovers
  if (/^[?\uFFFD？\s.·_\-]+$/u.test(trimmed)) return true;
  const marks = (trimmed.match(/[?\uFFFD？]/gu) || []).length;
  const letters = (trimmed.match(/[A-Za-z\u0600-\u06FF]/gu) || []).length;
  return marks >= 2 && letters === 0;
}

export function getCustomerDisplayName(rawName?: string | null, locale: string = 'ar'): string {
  if (!rawName) return locale === 'ar' ? 'عميل المتجر' : 'Store Customer';
  const trimmed = rawName.trim();
  // Corrupted charset rows often arrive as ??? / � — show a clean fallback.
  if (isCorruptedDisplayName(trimmed)) {
    return locale === 'ar' ? 'عميل المتجر' : 'Store Customer';
  }
  if (locale === 'ar') {
    return trimmed;
  }
  // EN locale: prefer mapped transliteration; otherwise keep the real customer name
  // (merchant/customer content — never invent "Store Customer" for a valid name).
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    if (CUSTOMER_NAME_EN_MAP[trimmed]) return CUSTOMER_NAME_EN_MAP[trimmed];
    const simplified = trimmed.replace(/\s+(بن|بنت)\s+/g, ' ');
    if (CUSTOMER_NAME_EN_MAP[simplified]) return CUSTOMER_NAME_EN_MAP[simplified];
    return trimmed;
  }
  return trimmed;
}

export const ITEM_NAME_MAP_EN: Record<string, string> = {
  // Coffee store products
  'كولومبيا غيشا ريزيرف فاخرة ٢٠٠ جرام': 'Colombian Geisha Reserve 200g',
  'كولومبيا عيشا ريزيرف فاخره ٢٠٠ جرام': 'Colombian Geisha Reserve 200g',
  'كولومبيا غيشا ريزيرف': 'Colombian Geisha Reserve',
  'طقم تقطير القهوة V60 المتكامل مع السيرفر والفلاتر': 'V60 Drip Brewing Kit with Server & Filters',
  'المتكامل مع السيرفر والفلاتر V60 طقم تقطير القهوه': 'V60 Drip Brewing Kit with Server & Filters',
  'غلاية فلو ستاغ EKG الكهربائية الذكية مع تحكم حراري رقمي': 'Fellow Stagg EKG Digital Variable Temp Kettle',
  'غلاية فلو ستاغ EKG الكهربائية الذكية': 'Fellow Stagg EKG Digital Electric Kettle',
  'إثيوبيا يرقاتشيفي - معالجة مجففة ٢٥٠ جرام': 'Ethiopia Yirgacheffe Natural 250g',
  'كوستاريكا تارازو - معالجة عسلية صفراء ٢٥٠ جرام': 'Costa Rica Tarrazu Yellow Honey 250g',
  'مطحنة قهوة يدوية بتروس فولاذية مخروطية دقيقة': 'Precision Conical Burr Manual Coffee Grinder',
  'مطحنة قهوة يدوية بتروس فولاذية مخروطية': 'Precision Conical Burr Manual Coffee Grinder',
  'ميزان أكايا لونار الذكي المقاوم للماء لإسبريسو احترافي': 'Acaia Lunar Waterproof Precision Espresso Scale',
  'خلطة إسبريسو سيغنتشر - شوكولاتة داكنة وبندق ١ كجم': 'Signature Espresso Blend Dark Choc & Hazelnut 1kg',
  'أداة تحضير كيمكس الزجاجية الكلاسيكية ٦ أكواب': 'Chemex Classic 6-Cup Glass Pour-Over Brewer',
  'بتشر تبخير الحليب ستانلس ستيل ٤٥٠ مل مع قلم رسم': 'Stainless Milk Steaming Pitcher 450ml with Latte Pen',
  'بتشر تبخير الحليب ستانلس ستيل ٤٥٠ مل': 'Stainless Milk Steaming Pitcher 450ml',
  'يمن حراز - موكا بري عتيق ٢٠٠ جرام': 'Yemen Haraaz Wild Moka Vintage Roast 200g',
  'ماكينة قهوة بارستا برو هايبرو H7A دبل بويلر 20 بار': 'HiBrew Barista Pro H7A Dual-Boiler 20-Bar',
  'مطحنة هايبرو G5 الفاخرة بدون احتباس': 'HiBrew G5 Zero-Retention Luxury Mill',
  'ماكينة إسبريسو هايبرو H10A الاحترافية': 'HiBrew H10A Pro Espresso Machine',
  'ماكينة هاي برو H10A دبل بويلر 20 بار': 'HiBrew H10A Dual Boiler 20-Bar Espresso Machine',
  'ماكينة هاي برو H10A دبل بويلر 20 بار شاشة تحكم PID': 'HiBrew H10A Dual Boiler Espresso Machine (20-Bar PID)',
  'مطحنة بن هاي برو G5 شفرات مخروطية تيتانيوم 36 درجة': 'HiBrew G5 Precision Titanium Conical Burr Grinder',
  'مطحنة بن هاي برو G5 شفرات تيتانيوم': 'HiBrew G5 Precision Titanium Conical Burr Grinder',
  'ماكينة تحضير قهوة إسبريسو متنقلة للسفر والسيارة 3 في 1': 'HiBrew H4A Portable Travel Espresso Maker Kit',
  'طقم ماكينة القهوة المحمولة للسفر 3 في 1': 'HiBrew H4A Portable Travel Espresso Kit',
  'ماكينة كبسولات متعددة الاستخدام 4 في 1': 'Multi-Capsule 4-in-1 Espresso Machine',
  'ماكينة قهوة متنقلة لاسلكية للسيارة والرحلات': 'Cordless Portable Travel & Car Espresso Maker',
  'ميزان قهوة رقمي مع مؤقت ذكي': 'Digital Precision Coffee Scale with Timer',
  'بورتافلتر مكشوف 58 مم مع باسكت احترافي': 'Bottomless 58mm Portafilter with Pro Basket',
  'طقم أكواب سيراميك فخار يدوي (قطعتين)': 'Handmade Ceramic Flat White Cups (Set of 2)',
  'دولاب ركن القهوة خشب بلوط مضلع فاخر': 'Luxury Ribbed Oak Coffee Bar Cabinet',
  'ركن قهوة مودرن مع رفوف معلقة وإضاءة ليد': 'Modern Coffee Station with Floating Shelves & LED',

  // Flowers / Gifts store products
  'صندوق مخملي فاخر بالورود الهولندية الحمراء': 'Royal Dutch Red Roses Velvet Box',
  'تشكيلة ترفل باتشي الملكية الفاخرة 500 جم': 'Patchi Luxury Truffles Collection 500g',
  'فازة كريستال بزهور الأوركيد والبيبي روز': 'Crystal Orchid & Baby Rose Vase',
  'سلة هدايا العيد الملكية الفاخرة': 'Royal Festive Luxury Gift Basket',
  'صندوق بيوني هولندي وردي ناعم': 'Soft Pink Dutch Peony Box',
  'شوكولاتة باتشي فاخرة مع تغليف إهداء ملكي': 'Luxury Patchi Chocolate with Royal Gift Wrapping',
  'باقة جوري إكوادوري أحمر ملكي ٥٠ وردة': 'Royal Ecuadorian Red Rose Bouquet 50 Stems',
  'فازة أوركيد بيضاء ملكية مزدوجة الساق': 'Royal Double-Stem White Orchid Vase',
  'صندوق تخرج مبهج مع بالونات وقبعة تخرج مطرزة': 'Graduation Gift Box with Balloons & Embroidered Cap',
  'باقة VIP زهور هيدرانجيا مع شوكولاتة باتشي': 'VIP Hydrangea Bouquet with Patchi Chocolate',
  'توليب هولندي أبيض في فازة سيراميك إيطالية': 'Dutch White Tulips in Italian Ceramic Vase',
  'زجاجة كولد برو منقوع بارد مركز ٥٠٠ مل': 'Cold Brew Coffee Concentrate 500ml',

  // Car store products
  'تلبيس مقاعد جلد ألماني فاخر مقاوم للحرارة': 'German Thermal-Resistant Leather Seat Covers',
  'طقم أرضيات دايموند خماسي الأبعاد 5D': '5D Diamond Precision Custom Floor Mats',
  'داش كام أمامية وخلفية بدقة 4K مع GPS': 'Front & Rear 4K Dashcam with GPS & Parking Mode',
  'بكج اليوم الوطني الذهبي (تنجيد كراسي + أرضيات 7D + وسائد إهداء)': 'Golden National Day Package (Seats + 7D Mats + Gift Pillows)',
  'طقم تنجيد كراسي ملكي كامل جلد نابا ألماني فاخر': 'Full Royal Nappa German Leather Seat Cover Set',
  'أرضيات ودعاسات دايموند 7D تغطية شاملة مع دواسة معدنية': '7D Diamond Full-Coverage Floor Mats with Metal Pedal',
  'بطانة وعازل الشنطة الخلفية ثلاثي الأبعاد مضاد للسوائل': '3D Waterproof Trunk Liner & Insulator',
  'خدمة الفحص والتركيب المنزلي السريع لكبار الشخصيات': 'VIP On-Site Inspection & Installation Service',
  'تلبيس وتخشيب ديكورات الأبواب وسقف الكانتارا الرياضي': 'Door Trim & Alcantara Sport Ceiling Kit',
  'غلاف وتلبيس مقود جلد مثقب مع خياطة يدوية دقيقة': 'Perforated Leather Steering Wrap with Hand Stitching',
  'مجموعة نانو سيراميك ألمانية لحماية وترطيب المقاعد الجلدية': 'German Nano-Ceramic Leather Seat Protection Kit',
  'غطاء طبلون جلد ليزري مخصص حماية من حرارة شمس الخليج': 'Custom Laser Leather Dashboard Cover (Gulf Heat Shield)',
  'طقم وسائد الرقبة والقطنية ميموري فوم جلد فاخر': 'Luxury Memory-Foam Neck & Lumbar Leather Pillow Set',
};

export const ADDRESS_MAP_EN: Record<string, string> = {
  'الرياض - حي العليا': 'Riyadh - Al Olaya District',
  'الرياض - حي النرجس': 'Riyadh - Al Narjis District',
  'الخبر - حي الحزام الذهبي': 'Al Khobar - Golden Belt District',
  'الظهران - حي الدوحة': 'Dhahran - Al Doha District',
  'جدة - حي الشاطئ': 'Jeddah - Al Shati District',
  'الرياض - حي حطين': 'Riyadh - Hittin District',
  'الدمام - حي الشاطئ الشرقي': 'Dammam - East Shati District',
  'مكة المكرمة - حي الشوقية': 'Makkah - Al Shawqiyyah District',
  'فندق رافلز برج الساعة، جناح 1804': 'Clock Tower Raffles Hotel, Suite 1804',
  'طريق الملك فهد، حي العليا، الرياض، المملكة العربية السعودية': 'King Fahd Road, Al-Olaya District, Riyadh, Saudi Arabia',
  'طريق الملك عبد العزيز، حي الياسمين، الرياض، المملكة العربية السعودية': 'King Abdulaziz Rd, Al Yasmin District, Riyadh, Saudi Arabia',
  'طريق إبراهيم الخليل، منطقة جبل عمر، مكة المكرمة، المملكة العربية السعودية': 'Ibrahim Al-Khalil Road, Jabal Omar District, Makkah, Saudi Arabia',
  'حي العوالي، شارع إبراهيم الخليل، مكة المكرمة، المملكة العربية السعودية': 'Al-Awali District, Ibrahim Al-Khalil St, Makkah, Saudi Arabia',
  'حي البساتين، طريق المدينة، جدة، المملكة العربية السعودية': 'Al-Basateen District, Madinah Road, Jeddah, Saudi Arabia',
  'طريق خريص الفرعي، حي الروضة، الرياض، المملكة العربية السعودية': 'Khurais Branch Rd, Al Rawdah, Riyadh, Saudi Arabia',
};

/** Normalize Arabic product labels for EN map / fuzzy match (digits, alef, taa marbuta, dashes). */
function normalizeItemLabel(raw: string): string {
  return raw
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // harakat + tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ىي]/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[\u2010-\u2015―‒–—−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function lookupItemNameEn(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (ITEM_NAME_MAP_EN[trimmed]) return ITEM_NAME_MAP_EN[trimmed];
  const cleaned = trimmed.replace(/\s*\([^)]*\)\s*$/, '').trim();
  if (ITEM_NAME_MAP_EN[cleaned]) return ITEM_NAME_MAP_EN[cleaned];

  const normalized = normalizeItemLabel(trimmed);
  if (!normalized) return null;
  for (const [ar, en] of Object.entries(ITEM_NAME_MAP_EN)) {
    const keyNorm = normalizeItemLabel(ar);
    if (keyNorm === normalized) return en;
  }
  // Fuzzy: long substring overlap (handles lean items_summary / truncated labels)
  let best: { en: string; score: number } | null = null;
  for (const [ar, en] of Object.entries(ITEM_NAME_MAP_EN)) {
    const keyNorm = normalizeItemLabel(ar);
    if (keyNorm.length < 8 || normalized.length < 8) continue;
    if (keyNorm.includes(normalized) || normalized.includes(keyNorm)) {
      const score = Math.min(keyNorm.length, normalized.length);
      if (!best || score > best.score) best = { en, score };
    }
  }
  return best && best.score >= 10 ? best.en : null;
}

export function getLocalizedItemName(
  item: { name?: string; nameAr?: string; nameEn?: string; sku?: string },
  locale: string = 'ar'
): string {
  const isAr = locale === 'ar';
  if (isAr) {
    return item.nameAr || item.name || '';
  }
  if (item.nameEn && !/[\u0600-\u06FF]/.test(item.nameEn)) {
    return item.nameEn;
  }

  const candidates = [item.name, item.nameAr]
    .map((v) => (v || '').trim())
    .filter(Boolean);

  for (const raw of candidates) {
    const mapped = lookupItemNameEn(raw);
    if (mapped) return mapped;
  }

  for (const raw of candidates) {
    if (raw && !/[\u0600-\u06FF]/.test(raw)) return raw;
  }

  // Fallback by SKU if known
  const sku = (item.sku || '').toUpperCase();
  if (sku.includes('H10A')) return 'HiBrew H10A Dual Boiler 20-Bar Espresso Machine';
  if (sku.includes('G5')) return 'HiBrew G5 Precision Titanium Conical Burr Grinder';
  if (sku.includes('H4A')) return 'HiBrew H4A Portable Travel Espresso Maker Kit';
  if (sku.includes('H7A')) return 'HiBrew Barista Pro H7A Dual-Boiler 20-Bar';
  if (sku.includes('COL') || sku.includes('GEISHA')) return 'Colombian Geisha Reserve 200g';
  if (sku.includes('KIT') || sku.includes('V60')) return 'V60 Drip Brewing Kit with Server & Filters';
  if (sku.includes('STG') || sku.includes('KETTLE')) return 'Fellow Stagg EKG Digital Electric Kettle';
  if (sku.includes('ETH')) return 'Ethiopia Yirgacheffe Natural 250g';
  if (sku.includes('CR') || sku.includes('COSTA')) return 'Costa Rica Tarrazu Yellow Honey 250g';
  if (sku.includes('GRIND')) return 'Precision Conical Burr Manual Coffee Grinder';
  if (sku.includes('ACA') || sku.includes('SCALE')) return 'Acaia Lunar Waterproof Precision Espresso Scale';
  if (sku.includes('ESP') || sku.includes('BLEND')) return 'Signature Espresso Blend Dark Choc & Hazelnut 1kg';
  if (sku.includes('CHM')) return 'Chemex Classic 6-Cup Glass Pour-Over Brewer';
  if (sku.includes('PIT')) return 'Stainless Milk Steaming Pitcher 450ml';
  if (sku.includes('YEM')) return 'Yemen Haraaz Wild Moka Vintage Roast 200g';
  if (sku.includes('CB') || sku.includes('COLD')) return 'Cold Brew Coffee Concentrate 500ml';
  if (sku.includes('ROSE')) return 'Royal Dutch Red Roses Velvet Box';
  if (sku.includes('TRUF') || sku.includes('PAT')) return 'Patchi Luxury Truffles Collection 500g';

  // Keyword hints when map miss (never leak Arabic into English chrome)
  const blob = candidates.join(' ');
  if (
    /سيغنتشر|سيجنتشر/i.test(blob) ||
    (/اسبريسو|إسبريسو/i.test(blob) && /بندق|شوكولات/i.test(blob)) ||
    (/داكنه|داكنة/i.test(blob) && /بندق/i.test(blob))
  ) {
    return 'Signature Espresso Blend Dark Choc & Hazelnut 1kg';
  }
  if (/غيشا|جيشا/i.test(blob) || (/كولومبيا/i.test(blob) && /ريزيرف|عيشا/i.test(blob))) {
    return 'Colombian Geisha Reserve 200g';
  }
  if (/حراز/i.test(blob) || (/موكا/i.test(blob) && /يمن/i.test(blob))) {
    return 'Yemen Haraaz Wild Moka Vintage Roast 200g';
  }
  if (/يرقاتشيفي/i.test(blob)) return 'Ethiopia Yirgacheffe Natural 250g';
  if (/تارازو/i.test(blob) || (/كوستاريكا/i.test(blob) && /عسل/i.test(blob))) {
    return 'Costa Rica Tarrazu Yellow Honey 250g';
  }
  if (/v60/i.test(blob) || (/تقطير/i.test(blob) && /فلاتر|سيرفر/i.test(blob))) {
    return 'V60 Drip Brewing Kit with Server & Filters';
  }
  if (/ستاغ|ekg/i.test(blob) || (/غلاية/i.test(blob) && /فلو|حرار/i.test(blob))) {
    return 'Fellow Stagg EKG Digital Electric Kettle';
  }
  if (/كيمكس|chemex/i.test(blob)) return 'Chemex Classic 6-Cup Glass Pour-Over Brewer';
  if (/بتشر/i.test(blob) && /تبخير|حليب/i.test(blob)) {
    return 'Stainless Milk Steaming Pitcher 450ml';
  }
  if (/مطحنة/i.test(blob) && /g5/i.test(blob)) return 'HiBrew G5 Precision Titanium Conical Burr Grinder';
  if (/h10a/i.test(blob) || (/هاي\s*برو|هايبرو/i.test(blob) && /دبل|بويلر|20/i.test(blob))) {
    return 'HiBrew H10A Dual Boiler 20-Bar Espresso Machine';
  }
  if (/كولد\s*برو/i.test(blob) || (/منقوع/i.test(blob) && /قهو/i.test(blob))) {
    return 'Cold Brew Coffee Concentrate 500ml';
  }

  return 'Product Item';
}

export function getLocalizedWhatsAppMessage(rawContent?: string | null, locale: string = 'ar'): string {
  if (!rawContent) return '';
  const text = rawContent.trim();
  const isAr = locale === 'ar';

  if (isAr) {
    if (/[\u0600-\u06FF]/.test(text) && !/[a-zA-Z]/.test(text.replace(/https?:\/\/\S+/g, ''))) {
      return text;
    }

    if (/wrapped and is on its way to Fairmont Hotel/i.test(text)) {
      return 'تم تجهيز وتغليف باقتك الفاخرة بعناية وهي الآن في طريقها إلى فندق فيرمونت، مكة المكرمة.';
    }
    if (/FIRST15/i.test(text)) {
      return 'استمتع بخصم 15% على أول طلب لك باستخدام كود القسيمة: FIRST15 عند إتمام الطلب!';
    }
    if (/address in Medina.*verify reception/i.test(text)) {
      return 'تحديث الشحن: طلبك في طريقه إلى عنوانك بالمدينة المنورة. يُرجى التحقق من الاستلام مع مندوب التوصيل.';
    }
    if (/llection is now live.*Explore exclusively/i.test(text)) {
      return 'التشكيلة الملكية الفاخرة الجديدة متاحة الآن! تصفحها واكتشف أرقى المنتجات الحصرية عبر موقعنا.';
    }
    if (/approved.*Courier will visit you between 4-6 PM/i.test(text)) {
      return 'تمت الموافقة على طلب الإرجاع. سيقوم مندوب شركة الشحن بزيارتكم للاستلام بين 4-6 مساءً.';
    }
    if (/free greeting card calligraphy/i.test(text)) {
      return 'مرحباً! لاحظنا وجود منتجات فاخرة في سلتك. أكمل طلبك اليوم لتحصل على كتابة كرت إهداء مجاني بخط يدوي فاخر!';
    }
    if (/awaiting bank transfer verification/i.test(text) || /pay\/10279/i.test(text)) {
      return 'تحديث الدفع: تذكير لطيف بشأن الطلب #10279 بانتظار تأكيد التحويل البنكي. رابط السداد: https://giftshop-sa.com/pay/10279';
    }
    if (/Natural Flower Bouquet with Patchi Chocolate is confirmed/i.test(text) || /Patchi Chocolate/i.test(text)) {
      return 'تم تأكيد طلبك #10278: باقة الزهور الطبيعية مع شوكولاتة باتشي الفاخرة ومجدولة للتسليم في الموعد.';
    }
    if (/VIP20/i.test(text)) {
      return 'خصم حصري 20% على جميع أطقم شوكولاتة بستاني الفاخرة! استخدم كود الخصم VIP20 اليوم عند الطلب.';
    }
    if (/Royal Dutch Velvet Rose collection/i.test(text)) {
      return 'اكتشف مجموعتنا الملكية الجديدة من الجوري المخملي مع توصيل فاخر مجاني في جميع أنحاء مكة هذا الأسبوع!';
    }
    if (/heading to Jabal Omar/i.test(text)) {
      return 'تحديث التوصيل: استلم مندوبنا الطلب #10280 وهو في طريقه الآن إلى منطقة جبل عمر، مكة المكرمة.';
    }
    if (/Your bouquet is being prepared with love/i.test(text)) {
      return 'تأكيد الطلب #10283. شكراً لاختياركم متجرنا! باقتكم الفاخرة قيد التجهيز والتنسيق بكل حب وإتقان.';
    }
    if (/Message undeliverable/i.test(text)) {
      return 'تعذر تسليم الرسالة: رقم الهاتف غير متاح حالياً أو غير مفعل على تطبيق واتساب.';
    }
    return text;
  } else {
    // English mode
    if (/تم تجهيز وتغليف باقتك الفاخرة|فيرمونت/i.test(text)) {
      return 'Your luxury bouquet has been freshly wrapped and is on its way to Fairmont Hotel, Makkah.';
    }
    if (/FIRST15/i.test(text)) {
      return 'Enjoy a 15% discount on your first order with voucher FIRST15 upon checkout!';
    }
    if (/المدينة المنورة.*مندوب/i.test(text)) {
      return 'Delivery update: Your order is on its way to your address in Medina. Please verify reception with driver.';
    }
    if (/التشكيلة الملكية|متاحة الآن/i.test(text)) {
      return 'New luxury collection is now live! Explore exclusively on our website.';
    }
    if (/طلب الإرجاع|مندوب شركة الشحن/i.test(text)) {
      return 'Your return request has been approved. Courier will visit you between 4-6 PM.';
    }
    if (/كرت إهداء مجاني/i.test(text)) {
      return 'Hi! Complete your order today and get free handwritten luxury greeting card calligraphy!';
    }
    if (/تأكيد التحويل البنكي|رابط السداد/i.test(text)) {
      return 'Payment update: Friendly reminder for order #10279 awaiting bank transfer verification. Link: https://giftshop-sa.com/pay/10279';
    }
    if (/باتشي/i.test(text)) {
      return 'Order confirmation #10278: Natural flower bouquet with luxury Patchi chocolate is confirmed and scheduled.';
    }
    if (/VIP20/i.test(text)) {
      return 'Exclusive 20% discount on luxury gift sets! Use code VIP20 today.';
    }
    return text;
  }
}

export function getLocalizedAddress(address?: string | null, locale: string = 'ar'): string {
  if (!address) return '';
  const isAr = locale === 'ar';
  const trimmed = address.trim();
  if (isAr) {
    return trimmed;
  }
  if (ADDRESS_MAP_EN[trimmed]) {
    return ADDRESS_MAP_EN[trimmed];
  }
  if (!/[\u0600-\u06FF]/.test(trimmed)) {
    return trimmed;
  }
  // Translate parts if possible
  if (trimmed.includes('الرياض')) return 'Riyadh, Saudi Arabia';
  if (trimmed.includes('جدة')) return 'Jeddah, Saudi Arabia';
  if (trimmed.includes('الدمام')) return 'Dammam, Saudi Arabia';
  if (trimmed.includes('الخبر')) return 'Al Khobar, Saudi Arabia';
  if (trimmed.includes('مكة')) return 'Makkah, Saudi Arabia';
  return 'Saudi Arabia';
}

/** Locale-pure Saudi city for dashboard tables / filters / profiles. */
export function getLocalizedCity(city?: string | null, locale: string = 'ar'): string {
  const trimmed = (city || '').trim();
  if (!trimmed) return '';
  return localizedSaudiCity(trimmed, locale === 'ar');
}

/** Locale-pure country label for common GCC values stored as EN or AR. */
export function getLocalizedCountry(country?: string | null, locale: string = 'ar'): string {
  const trimmed = (country || '').trim();
  if (!trimmed) return '';
  const isAr = locale === 'ar';
  const key = trimmed.toLowerCase().replace(/\s+/g, ' ');
  if (
    key === 'saudi arabia' ||
    key === 'ksa' ||
    key === 'sa' ||
    trimmed === 'المملكة العربية السعودية' ||
    trimmed === 'السعودية'
  ) {
    return isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia';
  }
  if (key === 'uae' || key === 'united arab emirates' || trimmed === 'الإمارات' || trimmed === 'الامارات') {
    return isAr ? 'الإمارات' : 'United Arab Emirates';
  }
  if (key === 'kuwait' || trimmed === 'الكويت') {
    return isAr ? 'الكويت' : 'Kuwait';
  }
  if (key === 'bahrain' || trimmed === 'البحرين') {
    return isAr ? 'البحرين' : 'Bahrain';
  }
  if (key === 'qatar' || trimmed === 'قطر') {
    return isAr ? 'قطر' : 'Qatar';
  }
  if (key === 'oman' || trimmed === 'عمان') {
    return isAr ? 'عمان' : 'Oman';
  }
  return trimmed;
}


