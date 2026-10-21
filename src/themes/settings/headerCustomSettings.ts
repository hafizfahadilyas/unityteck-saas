export interface HeaderAnnouncementMessage {
  id: string;
  textAr: string;
  textEn: string;
  icon: string;
  active: boolean;
  link?: string;
  badgeAr?: string;
  badgeEn?: string;
}

export interface HeaderAnnouncementSettings {
  enabled: boolean;
  template: string;
  bgColor: string;
  bgGradient: string;
  textColor: string;
  iconColor: string;
  borderColor: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  speed: number;
  pauseOnHover: boolean;
  messages: HeaderAnnouncementMessage[];
}

export interface HeaderLogoSettings {
  mode: 'image_and_text' | 'image_only' | 'text_only';
  imageUrl: string;
  logoHeight: number;
  logoWidth: number;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  titleColor: string;
  subtitleColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  letterSpacing: string;
  hoverEffect: 'scale' | 'glow' | 'rotate' | 'none';
  linkUrl: string;
  template: string;
}

export interface HeaderActionsSettings {
  template: string;
  search: {
    enabled: boolean;
    iconColor: string;
    hoverColor: string;
    hoverBg: string;
    placeholderAr: string;
    placeholderEn: string;
  };
  wishlist?: {
    enabled: boolean;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
    showBadgeCount: boolean;
  };
  whatsapp?: {
    enabled: boolean;
    phoneNumber: string;
    tooltipAr: string;
    tooltipEn: string;
    iconColor: string;
    pulseAnimation: boolean;
  };
  account: {
    enabled: boolean;
    showText: boolean;
    labelAr: string;
    labelEn: string;
    iconColor: string;
    textColor: string;
    hoverBg: string;
    showVipCrown: boolean;
  };
  cart: {
    enabled: boolean;
    icon: 'ShoppingBag' | 'ShoppingCart' | 'ShoppingBasket';
    iconColor: string;
    badgeBg: string;
    badgeText: string;
    showSubtotal: boolean;
    priceColor: string;
    pillBg: string;
    hoverBg: string;
  };
}

export interface HeaderNavLink {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: string;
  cat?: string;
  url?: string;
  active: boolean;
  isSpecial?: boolean;
}

export interface HeaderNavigationSettings {
  enabled: boolean;
  template: string;
  bgColor: string;
  bgGradient?: string;
  textColor: string;
  hoverColor: string;
  hoverBg: string;
  activeColor: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  alignment: 'center' | 'start' | 'space-between';
  showAllCollections: boolean;
  allCollectionsLabelAr: string;
  allCollectionsLabelEn: string;
  allCollectionsBg: string;
  allCollectionsTextColor: string;
  showVipPortal: boolean;
  vipPortalLabelAr: string;
  vipPortalLabelEn: string;
  vipPortalColor: string;
  links: HeaderNavLink[];
}

export interface HeaderLanguageSettings {
  enabled: boolean;
  style: 'pill' | 'toggle' | 'text';
  bgColor: string;
  textColor: string;
  activeColor: string;
  borderColor: string;
  template: string;
}

export interface HeaderGeneralSettings {
  bgColor: string;
  bgGradient: string;
  sticky: boolean;
  backdropBlur: boolean;
  borderColor: string;
  shadow: 'none' | 'sm' | 'md' | 'lg';
  paddingY: number;
}

export type HeaderSubElementKey =
  | 'general'
  | 'announcement'
  | 'logo'
  | 'navigation'
  | 'actions'
  | 'language';

export interface HeaderCustomSettings {
  subElement?: HeaderSubElementKey;
  general: HeaderGeneralSettings;
  announcement: HeaderAnnouncementSettings;
  logo: HeaderLogoSettings;
  navigation: HeaderNavigationSettings;
  actions: HeaderActionsSettings;
  language: HeaderLanguageSettings;
}

export const DEFAULT_HEADER_SETTINGS: HeaderCustomSettings = {
  subElement: 'general',
  general: {
    bgColor: '#FAF9F5',
    bgGradient: 'from-[#fbf9f4] via-[#FAF9F5] to-[#f6f2e9]',
    sticky: true,
    backdropBlur: true,
    borderColor: 'rgba(230,202,152,0.4)',
    shadow: 'sm',
    paddingY: 10,
  },
  announcement: {
    enabled: true,
    template: 'luxury-emerald',
    bgColor: '#05140b',
    bgGradient: 'from-[#05140b] via-[#0d2719] to-[#05140b]',
    textColor: '#ffffff',
    iconColor: '#f3e5ab',
    borderColor: 'rgba(212,175,55,0.35)',
    fontSize: 11,
    fontFamily: 'Tajawal',
    fontWeight: '600',
    speed: 25,
    pauseOnHover: true,
    messages: [
      {
        id: 'msg-1',
        icon: 'Clock',
        textAr: 'توصيل عاجل مبرد خلال 60 دقيقة في مكة المكرمة',
        textEn: '60-Min Chilled Express Delivery in Mecca',
        active: true,
      },
      {
        id: 'msg-2',
        icon: 'Truck',
        textAr: 'شحن مجاني لكافة الطلبات فوق 299 ريال',
        textEn: 'Free Shipping on Orders Above 299 SAR',
        active: true,
      },
      {
        id: 'msg-3',
        icon: 'CreditCard',
        textAr: 'قسّط مشترياتك على 4 دفعات بدون أي فوائد مع تابي وتمارا',
        textEn: 'Split into 4 interest-free payments with Tabby & Tamara',
        active: true,
      },
      {
        id: 'msg-4',
        icon: 'Sparkles',
        textAr: 'أفخم باقات الورد الطبيعي المستورد يومياً من هولندا والإكوادور',
        textEn: '100% Fresh Natural Flowers Imported Daily from Holland & Ecuador',
        active: true,
      },
    ],
  },
  logo: {
    mode: 'image_and_text',
    imageUrl:
      'https://cdn.salla.sa/cdn-cgi/image/fit=scale-down,width=400,height=400,onerror=redirect,format=auto/NKOjvD/2Cnfzx8q23nZJ0tRXo8cUjOa6GP3vTWdrOePAhRl.png',
    logoHeight: 44,
    logoWidth: 44,
    titleAr: 'هدايا مكة',
    titleEn: 'Hadaya Makkah',
    subtitleAr: 'GIFTS AND FLOWERS',
    subtitleEn: 'GIFTS AND FLOWERS',
    titleColor: '#102a1c',
    subtitleColor: '#8c8275',
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: '0.25em',
    hoverEffect: 'scale',
    linkUrl: '/',
    template: 'centered-crest',
  },
  actions: {
    template: 'pill-luxury',
    search: {
      enabled: true,
      iconColor: '#343a40',
      hoverColor: '#102a1c',
      hoverBg: '#ede9df',
      placeholderAr: 'ابحث عن باقات ورد، هدايا فاخرة...',
      placeholderEn: 'Search bouquets, luxury gifts...',
    },
    account: {
      enabled: true,
      showText: true,
      labelAr: 'دخول / Google',
      labelEn: 'Sign In',
      iconColor: '#343a40',
      textColor: '#343a40',
      hoverBg: '#ede9df',
      showVipCrown: true,
    },
    cart: {
      enabled: true,
      icon: 'ShoppingBag',
      iconColor: '#102a1c',
      badgeBg: '#8b263e',
      badgeText: '#ffffff',
      showSubtotal: true,
      priceColor: '#102a1c',
      pillBg: 'rgba(16,42,28,0.05)',
      hoverBg: 'rgba(16,42,28,0.1)',
    },
  },
  navigation: {
    enabled: true,
    template: 'emerald-gold',
    bgColor: '#ffffff',
    bgGradient: 'from-white via-[#faf8f4] to-white',
    textColor: '#333a35',
    hoverColor: '#102a1c',
    hoverBg: 'rgba(16,42,28,0.05)',
    activeColor: '#102a1c',
    fontSize: 14.5,
    fontFamily: 'Tajawal',
    fontWeight: '600',
    alignment: 'center',
    showAllCollections: true,
    allCollectionsLabelAr: 'كافة المجموعات',
    allCollectionsLabelEn: 'All Collections',
    allCollectionsBg: '#102a1c',
    allCollectionsTextColor: '#e6ca98',
    showVipPortal: true,
    vipPortalLabelAr: 'بوابة VIP',
    vipPortalLabelEn: 'VIP Portal',
    vipPortalColor: '#8b263e',
    links: [
      {
        id: 'nav-1',
        labelAr: 'باقات الورد الطبيعي',
        labelEn: 'Natural Flowers',
        icon: 'Sparkles',
        cat: 'باقات الورود الطبيعية',
        active: true,
      },
      {
        id: 'nav-2',
        labelAr: 'المناسبات والهدايا',
        labelEn: 'Occasions & Gifts',
        icon: 'Gift',
        cat: 'تصنيفات حسب المناسبة',
        active: true,
      },
      {
        id: 'nav-3',
        labelAr: 'العروض والتخفيضات',
        labelEn: 'Exclusive Offers',
        icon: 'Percent',
        cat: 'باقات ورود طبيعية مخفضة',
        active: true,
      },
      {
        id: 'nav-4',
        labelAr: 'مجلة هدايا مكة',
        labelEn: 'Hadaya Magazine',
        icon: 'BookOpen',
        url: '#magazine-section',
        active: true,
      },
    ],
  },
    language: {
    enabled: true,
    style: 'pill',
    bgColor: '#ffffff',
    textColor: '#495057',
    activeColor: '#102a1c',
    borderColor: '#d8d2c4',
    template: 'luxury-pill',
  },
};

export const COFFEE_HEADER_SETTINGS: HeaderCustomSettings = {
  subElement: 'general',
  general: {
    bgColor: '#160e0a',
    bgGradient: 'from-[#160e0a] via-[#21140e] to-[#160e0a]',
    sticky: true,
    backdropBlur: true,
    borderColor: 'rgba(200,138,88,0.3)',
    shadow: 'sm',
    paddingY: 10,
  },
  announcement: {
    enabled: true,
    template: 'luxury-coffee',
    bgColor: '#0d0704',
    bgGradient: 'from-[#0d0704] via-[#160d08] to-[#0d0704]',
    textColor: '#f7ede2',
    iconColor: '#c88a58',
    borderColor: 'rgba(200,138,88,0.35)',
    fontSize: 11,
    fontFamily: 'Tajawal',
    fontWeight: '600',
    speed: 25,
    pauseOnHover: true,
    messages: [
      {
        id: 'cof-msg-1',
        icon: 'Sparkles',
        textAr: 'محاصيل بن مختصة 100% طازجة التحميص أسبوعياً مع كرت الإيحاءات وتاريخ الحمص',
        textEn: '100% Specialty Arabica Beans Roasted Fresh Weekly with Tasting Notes',
        active: true,
      },
      {
        id: 'cof-msg-2',
        icon: 'Truck',
        textAr: 'شحن سريع ومبرد لجميع مدن المملكة خلال 24-48 ساعة',
        textEn: 'Fast Express Delivery Across All KSA Cities in 24-48 Hours',
        active: true,
      },
      {
        id: 'cof-msg-3',
        icon: 'CreditCard',
        textAr: 'قسّط مكائن القهوة وأدوات الباريستا على 4 دفعات بدون فوائد مع تابي وتمارا',
        textEn: 'Split Espresso Machines & Barista Gear into 4 Payments with Tabby & Tamara',
        active: true,
      },
      {
        id: 'cof-msg-4',
        icon: 'Gift',
        textAr: 'شحن مجاني لكافة طلبات محاصيل القهوة والمعدات فوق 199 ريال',
        textEn: 'Free Express Shipping on Coffee & Gear Orders Above 199 SAR',
        active: true,
      },
    ],
  },
  logo: {
    mode: 'image_and_text',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
    logoHeight: 44,
    logoWidth: 44,
    titleAr: 'محمصة القهوة المختصة',
    titleEn: 'Specialty Coffee Roasters',
    subtitleAr: 'ARTISAN ROASTERY & BREW',
    subtitleEn: 'ARTISAN ROASTERY & BREW',
    titleColor: '#f7ede2',
    subtitleColor: '#c88a58',
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: '0.2em',
    hoverEffect: 'scale',
    linkUrl: '/',
    template: 'centered-crest',
  },
  actions: {
    template: 'pill-luxury',
    search: {
      enabled: true,
      iconColor: '#c88a58',
      hoverColor: '#ffffff',
      hoverBg: '#2a1a12',
      placeholderAr: 'ابحث عن محاصيل قهوة، أدوات V60، مكائن إسبريسو، مطاحن...',
      placeholderEn: 'Search specialty beans, V60 gear, espresso machines...',
    },
    account: {
      enabled: true,
      showText: true,
      labelAr: 'دخول / حسابي',
      labelEn: 'Sign In',
      iconColor: '#c88a58',
      textColor: '#f7ede2',
      hoverBg: '#2a1a12',
      showVipCrown: true,
    },
    cart: {
      enabled: true,
      icon: 'ShoppingBag',
      iconColor: '#f7ede2',
      badgeBg: '#c88a58',
      badgeText: '#ffffff',
      showSubtotal: true,
      priceColor: '#c88a58',
      pillBg: 'rgba(200,138,88,0.15)',
      hoverBg: 'rgba(200,138,88,0.25)',
    },
  },
  navigation: {
    enabled: true,
    template: 'coffee-gold',
    bgColor: '#160e0a',
    bgGradient: 'from-[#160e0a] via-[#1f140d] to-[#160e0a]',
    textColor: '#e6ccb2',
    hoverColor: '#ffffff',
    hoverBg: 'rgba(200,138,88,0.15)',
    activeColor: '#c88a58',
    fontSize: 14.5,
    fontFamily: 'Tajawal',
    fontWeight: '600',
    alignment: 'center',
    showAllCollections: true,
    allCollectionsLabelAr: 'كافة المحاصيل والمعدات',
    allCollectionsLabelEn: 'All Roasts & Gear',
    allCollectionsBg: '#2b170e',
    allCollectionsTextColor: '#c88a58',
    showVipPortal: true,
    vipPortalLabelAr: 'نادي الباريستا VIP',
    vipPortalLabelEn: 'Barista Club VIP',
    vipPortalColor: '#c88a58',
    links: [
      {
        id: 'cof-nav-1',
        labelAr: 'حبوب القهوة المختصة',
        labelEn: 'Specialty Coffee Beans',
        icon: 'Sparkles',
        cat: 'حبوب القهوة المختصة',
        active: true,
      },
      {
        id: 'cof-nav-2',
        labelAr: 'أدوات التحضير V60',
        labelEn: 'Manual Pour-Over Tools',
        icon: 'Gift',
        cat: 'أدوات التحضير المقطرة',
        active: true,
      },
      {
        id: 'cof-nav-3',
        labelAr: 'مكائن وإكسسوارات الإسبريسو',
        labelEn: 'Espresso Equipment',
        icon: 'Percent',
        cat: 'معدات الإسبريسو',
        active: true,
      },
      {
        id: 'cof-nav-4',
        labelAr: 'محاصيل المايكرولوت النادرة',
        labelEn: 'Rare Micro-Lots',
        icon: 'Flame',
        cat: 'محاصيل نادرة',
        active: true,
      },
      {
        id: 'cof-nav-5',
        labelAr: 'دليل التحضير والمقالات',
        labelEn: 'Brew Guides & Journal',
        icon: 'BookOpen',
        url: '#magazine-section',
        active: true,
      },
    ],
  },
  language: {
    enabled: true,
    style: 'pill',
    bgColor: '#241710',
    textColor: '#e6ccb2',
    activeColor: '#ffffff',
    borderColor: 'rgba(200,138,88,0.3)',
    template: 'luxury-pill',
  },
};

export const AUTO_HEADER_SETTINGS: HeaderCustomSettings = {
  subElement: 'general',
  general: {
    bgColor: '#0f172a',
    bgGradient: 'from-[#0f172a] via-[#1e293b] to-[#0f172a]',
    sticky: true,
    backdropBlur: true,
    borderColor: 'rgba(217,119,6,0.3)',
    shadow: 'sm',
    paddingY: 10,
  },
  announcement: {
    enabled: true,
    template: 'luxury-auto',
    bgColor: '#020617',
    bgGradient: 'from-[#020617] via-[#0b1329] to-[#020617]',
    textColor: '#ffffff',
    iconColor: '#f59e0b',
    borderColor: 'rgba(245,158,11,0.3)',
    fontSize: 11,
    fontFamily: 'Tajawal',
    fontWeight: '600',
    speed: 25,
    pauseOnHover: true,
    messages: [
      {
        id: 'auto-msg-1',
        icon: 'Sparkles',
        textAr: 'تفصيل وتنجيد ملكي فاخر لجميع موديلات السيارات وضمان 5 سنوات',
        textEn: 'Royal Custom Upholstery for Luxury Vehicles with 5-Year Warranty',
        active: true,
      },
      {
        id: 'auto-msg-2',
        icon: 'Truck',
        textAr: 'شحن سريع ومجاني لكافة مناطق المملكة للطلبات فوق 400 ريال',
        textEn: 'Fast Free Delivery Across KSA on Orders Above 400 SAR',
        active: true,
      },
      {
        id: 'auto-msg-3',
        icon: 'CreditCard',
        textAr: 'قسّط تنجيد سيارتك ودعاسات 7D على 4 دفعات بدون فوائد مع تابي وتمارا',
        textEn: 'Split 7D Mats & Upholstery into 4 Payments with Tabby & Tamara',
        active: true,
      },
      {
        id: 'auto-msg-4',
        icon: 'Percent',
        textAr: 'خصم اليوم الوطني 20% لفترة محدودة على كافة أطقم الدعاسات الملكية',
        textEn: 'Exclusive 20% National Day Discount on Luxury Mat Sets',
        active: true,
      },
    ],
  },
  logo: {
    mode: 'image_and_text',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80',
    logoHeight: 44,
    logoWidth: 44,
    titleAr: 'مؤسسة بلاكو للتجارة',
    titleEn: 'Blacko Car Styling',
    subtitleAr: 'تنجيد ودعاسات السيارات الفاخرة',
    subtitleEn: 'LUXURY CAR UPHOLSTERY & 7D MATS',
    titleColor: '#ffffff',
    subtitleColor: '#f59e0b',
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: '0.15em',
    hoverEffect: 'scale',
    linkUrl: '/',
    template: 'centered-crest',
  },
  actions: {
    template: 'pill-luxury',
    search: {
      enabled: true,
      iconColor: '#f59e0b',
      hoverColor: '#ffffff',
      hoverBg: '#1e293b',
      placeholderAr: 'ابحث عن نوع سيارتك، خامات التنجيد، دعاسات 7D...',
      placeholderEn: 'Search car model, upholstery materials, 7D mats...',
    },
    account: {
      enabled: true,
      showText: true,
      labelAr: 'دخول / حسابي',
      labelEn: 'Sign In',
      iconColor: '#f59e0b',
      textColor: '#ffffff',
      hoverBg: '#1e293b',
      showVipCrown: true,
    },
    cart: {
      enabled: true,
      icon: 'ShoppingBag',
      iconColor: '#ffffff',
      badgeBg: '#d97706',
      badgeText: '#ffffff',
      showSubtotal: true,
      priceColor: '#f59e0b',
      pillBg: 'rgba(245,158,11,0.15)',
      hoverBg: 'rgba(245,158,11,0.25)',
    },
  },
  navigation: {
    enabled: true,
    template: 'auto-transport',
    bgColor: '#090d16',
    bgGradient: 'from-[#090d16] via-[#0f172a] to-[#090d16]',
    textColor: '#cbd5e1',
    hoverColor: '#ffffff',
    hoverBg: 'rgba(245,158,11,0.15)',
    activeColor: '#f59e0b',
    fontSize: 14.5,
    fontFamily: 'Tajawal',
    fontWeight: '600',
    alignment: 'center',
    showAllCollections: true,
    allCollectionsLabelAr: 'كافة خدمات السيارات',
    allCollectionsLabelEn: 'All Auto Services',
    allCollectionsBg: '#1e293b',
    allCollectionsTextColor: '#f59e0b',
    showVipPortal: true,
    vipPortalLabelAr: 'أسطول VIP',
    vipPortalLabelEn: 'VIP Fleet Portal',
    vipPortalColor: '#f59e0b',
    links: [
      {
        id: 'auto-nav-1',
        labelAr: 'تنجيد المراتب الفاخر',
        labelEn: 'Luxury Seat Upholstery',
        icon: 'Sparkles',
        cat: 'تنجيد المراتب',
        active: true,
      },
      {
        id: 'auto-nav-2',
        labelAr: 'دعاسات الأرضيات الملكية 7D',
        labelEn: '7D Royal Floor Mats',
        icon: 'ShieldCheck',
        cat: 'دعاسات 7D',
        active: true,
      },
      {
        id: 'auto-nav-3',
        labelAr: 'إكسسوارات المقصورة',
        labelEn: 'Cabin Accessories',
        icon: 'Gift',
        cat: 'إكسسوارات',
        active: true,
      },
      {
        id: 'auto-nav-4',
        labelAr: 'حاسبة الأسعار الفورية',
        labelEn: 'Instant Price Calculator',
        icon: 'Percent',
        url: '#calculator',
        active: true,
      },
    ],
  },
  language: {
    enabled: true,
    style: 'pill',
    bgColor: '#1e293b',
    textColor: '#cbd5e1',
    activeColor: '#f59e0b',
    borderColor: 'rgba(245,158,11,0.25)',
    template: 'luxury-pill',
  },
};

export function getDefaultHeaderSettings(store?: any, themeId?: string): HeaderCustomSettings {
  const isCoffee =
    (themeId && themeId.includes('coffee')) ||
    store?.id === 'store-coffee' ||
    store?.slug === 'coffee-store' ||
    store?.slug?.includes('coffee') ||
    (store?.category && store.category.includes('قهوة')) ||
    (store?.domain && store.domain.includes('coffee'));

  if (isCoffee) {
    const sNameAr = store?.nameAr || store?.name || 'متجر القهوة المختصة';
    const sNameEn = store?.nameEn || store?.name || 'Specialty Coffee Roasters';
    const logoImg = store?.logo && store.logo.startsWith('http') ? store.logo : COFFEE_HEADER_SETTINGS.logo.imageUrl;
    return {
      ...COFFEE_HEADER_SETTINGS,
      logo: {
        ...COFFEE_HEADER_SETTINGS.logo,
        titleAr: sNameAr,
        titleEn: sNameEn,
        imageUrl: logoImg,
      },
    };
  }

  const isCar =
    (themeId && (themeId.includes('saudia') || themeId.includes('transport') || themeId.includes('bleco'))) ||
    store?.id === 'store-bleco' ||
    store?.slug === 'bleco-sa' ||
    store?.slug?.includes('car') ||
    store?.slug?.includes('transport') ||
    (store?.category && (store.category.includes('سيارات') || store.category.includes('تنجيد')));

  if (isCar) {
    const sNameAr = store?.nameAr || store?.name || 'مؤسسة بلاكو للتجارة';
    const sNameEn = store?.nameEn || store?.name || 'Blacko Car Styling';
    const logoImg = store?.logo && store.logo.startsWith('http') ? store.logo : AUTO_HEADER_SETTINGS.logo.imageUrl;
    return {
      ...AUTO_HEADER_SETTINGS,
      logo: {
        ...AUTO_HEADER_SETTINGS.logo,
        titleAr: sNameAr,
        titleEn: sNameEn,
        imageUrl: logoImg,
      },
    };
  }

  const isHadayaFlowers =
    store?.id === 'store-1' ||
    (themeId && (themeId.includes('flora') || themeId.includes('makkah'))) ||
    store?.slug?.includes('flower') ||
    store?.slug?.includes('makkah') ||
    store?.slug?.includes('hadaya') ||
    store?.slug?.includes('giftshop');

  if (isHadayaFlowers) {
    const sNameAr = store?.nameAr || store?.name || DEFAULT_HEADER_SETTINGS.logo.titleAr;
    const sNameEn = store?.nameEn || store?.name || DEFAULT_HEADER_SETTINGS.logo.titleEn;
    const logoImg = store?.logo && store.logo.startsWith('http') ? store.logo : DEFAULT_HEADER_SETTINGS.logo.imageUrl;
    return {
      ...DEFAULT_HEADER_SETTINGS,
      logo: {
        ...DEFAULT_HEADER_SETTINGS.logo,
        titleAr: sNameAr,
        titleEn: sNameEn,
        imageUrl: logoImg,
      },
    };
  }

  // Dynamic default for any other independent store
  const storeDisplayNameAr = store?.nameAr || store?.name || 'المتجر الإلكتروني';
  const storeDisplayNameEn = store?.nameEn || store?.name || 'Online Store';
  const accent = store?.accentColor || '#059669';
  const catAr = store?.categoryAr || store?.category || 'المنتجات المميزة';
  const catEn = store?.categoryEn || store?.category || 'Featured Products';

  return {
    subElement: 'general',
    general: {
      bgColor: '#ffffff',
      bgGradient: 'from-white via-[#f8fafc] to-white',
      sticky: true,
      backdropBlur: true,
      borderColor: 'rgba(0,0,0,0.08)',
      shadow: 'sm',
      paddingY: 10,
    },
    announcement: {
      enabled: true,
      template: 'custom-store',
      bgColor: accent,
      bgGradient: `from-[${accent}] to-[#022c22]`,
      textColor: '#ffffff',
      iconColor: '#ffffff',
      borderColor: 'rgba(255,255,255,0.15)',
      fontSize: 11,
      fontFamily: 'Tajawal',
      fontWeight: '600',
      speed: 25,
      pauseOnHover: true,
      messages: [
        {
          id: 'gen-msg-1',
          icon: 'Sparkles',
          textAr: `أهلاً بكم في متجر ${storeDisplayNameAr} — منتجات أصلية ومضمونة 100%`,
          textEn: `Welcome to ${storeDisplayNameEn} — 100% Authentic Guaranteed Products`,
          active: true,
        },
        {
          id: 'gen-msg-2',
          icon: 'Truck',
          textAr: 'شحن سريع لجميع مدن ومناطق المملكة',
          textEn: 'Fast Express Delivery Across All KSA Cities',
          active: true,
        },
        {
          id: 'gen-msg-3',
          icon: 'CreditCard',
          textAr: 'قسّط مشترياتك على 4 دفعات بدون أي فوائد مع تابي وتمارا',
          textEn: 'Split into 4 interest-free payments with Tabby & Tamara',
          active: true,
        },
      ],
    },
    logo: {
      mode: 'image_and_text',
      imageUrl: store?.logo && store.logo.startsWith('http') ? store.logo : '',
      logoHeight: 44,
      logoWidth: 44,
      titleAr: storeDisplayNameAr,
      titleEn: storeDisplayNameEn,
      subtitleAr: catAr,
      subtitleEn: catEn,
      titleColor: '#0f172a',
      subtitleColor: '#64748b',
      fontFamily: 'Tajawal',
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: '0.05em',
      hoverEffect: 'scale',
      linkUrl: '/',
      template: 'centered-crest',
    },
    actions: {
      template: 'pill-clean',
      search: {
        enabled: true,
        iconColor: '#334155',
        hoverColor: accent,
        hoverBg: '#f1f5f9',
        placeholderAr: `ابحث في منتجات ${storeDisplayNameAr}...`,
        placeholderEn: `Search ${storeDisplayNameEn} products...`,
      },
      account: {
        enabled: true,
        showText: true,
        labelAr: 'دخول / حسابي',
        labelEn: 'Sign In',
        iconColor: '#334155',
        textColor: '#0f172a',
        hoverBg: '#f1f5f9',
        showVipCrown: true,
      },
      cart: {
        enabled: true,
        icon: 'ShoppingBag',
        iconColor: '#0f172a',
        badgeBg: accent,
        badgeText: '#ffffff',
        showSubtotal: true,
        priceColor: accent,
        pillBg: 'rgba(0,0,0,0.04)',
        hoverBg: 'rgba(0,0,0,0.08)',
      },
    },
    navigation: {
      enabled: true,
      template: 'clean-nav',
      bgColor: '#ffffff',
      bgGradient: 'from-white via-[#f8fafc] to-white',
      textColor: '#334155',
      hoverColor: accent,
      hoverBg: 'rgba(0,0,0,0.04)',
      activeColor: accent,
      fontSize: 14.5,
      fontFamily: 'Tajawal',
      fontWeight: '600',
      alignment: 'center',
      showAllCollections: true,
      allCollectionsLabelAr: 'كافة الأقسام',
      allCollectionsLabelEn: 'All Collections',
      allCollectionsBg: '#0f172a',
      allCollectionsTextColor: '#ffffff',
      showVipPortal: true,
      vipPortalLabelAr: 'عضوية VIP',
      vipPortalLabelEn: 'VIP Portal',
      vipPortalColor: accent,
      links: [
        {
          id: 'gen-nav-1',
          labelAr: 'أحدث المنتجات',
          labelEn: 'Latest Products',
          icon: 'Sparkles',
          cat: 'latest',
          active: true,
        },
        {
          id: 'gen-nav-2',
          labelAr: 'العروض الخاصة',
          labelEn: 'Special Offers',
          icon: 'Percent',
          cat: 'offers',
          active: true,
        },
        {
          id: 'gen-nav-3',
          labelAr: 'الأكثر طلباً',
          labelEn: 'Best Sellers',
          icon: 'Star',
          cat: 'bestsellers',
          active: true,
        },
      ],
    },
    language: {
      enabled: true,
      style: 'pill',
      bgColor: '#f1f5f9',
      textColor: '#334155',
      activeColor: '#0f172a',
      borderColor: 'rgba(0,0,0,0.08)',
      template: 'pill',
    },
  };
}
