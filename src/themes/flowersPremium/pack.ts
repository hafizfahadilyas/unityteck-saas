/**
 * Makkah Fresh Flowers — 1st client premium dummy theme pack.
 * All premium commerce features designed-in; client picks homepage (Eid / Ramadan / Valentine).
 */

export const FLOWERS_THEME_ID = 'theme-flora-luxe';

export const FLOWERS_HOMEPAGES = [
  'Default Commerce',
  'Eid Home',
  'Ramadan Home',
  'Valentine Home',
] as const;
export type FlowersHomepage = (typeof FLOWERS_HOMEPAGES)[number];

export const FLOWERS_PREMIUM_FEATURES = [
  'advanced_slider_carousel',
  'circle_categories_with_images',
  'add_to_cart',
  'order_on_whatsapp',
  'chat_support',
  'single_product_page',
  'archive_shop_page',
  'cart_page',
  'checkout_page',
  'thank_you_page',
  'faq_section',
  'customer_reviews',
  'advanced_product_cards',
  'customer_crm_login_gate',
  'payment_cod',
  'payment_online',
  'product_variations',
  'banner_offer_popup',
  'promo_banners',
  'about_page',
  'contact_page',
  'privacy_page',
  'return_page',
  'store_location_page',
  'coupon_code',
  'multi_homepage',
] as const;

export type FlowersSfPage =
  | 'home'
  | 'shop'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'thankyou'
  | 'profile'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'return'
  | 'location'
  | 'track-order'
  | 'blog'
  | 'custom-page';

export type CircleCategory = {
  id: string;
  nameEn: string;
  nameAr: string;
  image: string;
  filter: string; // matches Product.category or 'All'
};

export const FLOWERS_CIRCLE_CATEGORIES: CircleCategory[] = [
  {
    id: 'all',
    nameEn: 'All Blooms',
    nameAr: 'كل الورود',
    image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=400&q=80',
    filter: 'All',
  },
  {
    id: 'bouquets',
    nameEn: 'Hand Bouquets',
    nameAr: 'باقات يدوية',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    filter: 'Luxury Hand Bouquets',
  },
  {
    id: 'vases',
    nameEn: 'Luxury Vases',
    nameAr: 'فازات فاخرة',
    image: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=400&q=80',
    filter: 'Luxury Vases',
  },
  {
    id: 'haram',
    nameEn: 'Haram Gifts',
    nameAr: 'هدايا الحرم',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80',
    filter: 'Haram & Hotel Gifts',
  },
  {
    id: 'bridal',
    nameEn: 'Bridal',
    nameAr: 'أعراس',
    image: 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=400&q=80',
    filter: 'Bridal & Weddings',
  },
  {
    id: 'seasonal',
    nameEn: 'Seasonal',
    nameAr: 'موسمية',
    image: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=400&q=80',
    filter: 'Seasonal Specials',
  },
];

export type HeroSlide = {
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  image: string;
  badge: string;
  ctaAr: string;
  ctaEn: string;
};

export const FLOWERS_HERO_BY_HOME: Record<FlowersHomepage, HeroSlide[]> = {
  'Default Commerce': [
    {
      titleAr: 'متجر الورود الفاخرة والهدايا الملكية',
      titleEn: 'Luxury Floral Boutique & Royal Gifts',
      subtitleAr: 'أرقى تشكيلات الورد الطبيعي المستورد مع توصيل فوري مبرد في مكة والمملكة',
      subtitleEn: 'Finest imported fresh blooms with express chilled delivery across Saudi Arabia',
      image: 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?auto=format&fit=crop&w=1600&q=80',
      badge: 'العصري الفاخر · Universal Luxury 2026',
      ctaAr: 'تسوق التشكيلة الفاخرة',
      ctaEn: 'Shop Luxury Collection',
    },
    {
      titleAr: 'تنسيقات حصرية لجميع المناسبات والاحتفالات',
      titleEn: 'Exclusive Arrangements for Every Grand Occasion',
      subtitleAr: 'فازات كريستال وباقات يدوية صممت بعناية فائقة بأيدي أمهر المنسقين',
      subtitleEn: 'Handcrafted crystal vases and bespoke bouquets curated by master florists',
      image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1600&q=80',
      badge: 'الأكثر مبيعاً · Bestseller',
      ctaAr: 'اطلب باقتك الآن',
      ctaEn: 'Order Bouquet Now',
    },
  ],
  'Eid Home': [
    {
      titleAr: 'عيد مبارك · باقات الفرح الفاخرة في مكة',
      titleEn: 'Eid Mubarak · Luxury Joy Blooms in Makkah',
      subtitleAr: 'تنسيقات عيدية ذهبية وخضراء مع توصيل سريع لفنادق الحرم',
      subtitleEn: 'Gold & emerald Eid arrangements with express Haram hotel delivery',
      image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1600&q=80',
      badge: 'عيد · Eid Premium 2026',
      ctaAr: 'تسوق مجموعة العيد',
      ctaEn: 'Shop Eid Collection',
    },
    {
      titleAr: 'هدايا العيد للعائلة والزيارات',
      titleEn: 'Eid Family & Visit Gift Hampers',
      subtitleAr: 'ورد طبيعي + بطاقة تهنئة عربية فاخرة',
      subtitleEn: 'Fresh flowers + premium Arabic greeting card',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
      badge: 'توصيل ساعتين · 2h Express',
      ctaAr: 'اطلب هدية العيد',
      ctaEn: 'Order Eid Gift',
    },
    {
      titleAr: 'صواني عيد فاخرة مع زمزم',
      titleEn: 'Luxury Eid Trays with Zamzam',
      subtitleAr: 'مناسبة لضيوف الرحمن في مكة المكرمة',
      subtitleEn: 'Perfect for guests of the Holy City',
      image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1600&q=80',
      badge: 'Haram VIP',
      ctaAr: 'استكشف الهدايا',
      ctaEn: 'Explore Gifts',
    },
  ],
  'Ramadan Home': [
    {
      titleAr: 'رمضان كريم · ورود روحانية لمكة',
      titleEn: 'Ramadan Kareem · Spiritual Blooms for Makkah',
      subtitleAr: 'تنسيقات نيلي وذهبي لإفطار وزيارات الحرم',
      subtitleEn: 'Indigo & gold arrangements for Iftar and Haram visits',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1600&q=80',
      badge: 'رمضان · Ramadan Premium',
      ctaAr: 'تسوق مجموعة رمضان',
      ctaEn: 'Shop Ramadan Collection',
    },
    {
      titleAr: 'باقات السحور والإفطار الفاخرة',
      titleEn: 'Suhoor & Iftar Luxury Bouquets',
      subtitleAr: 'توصيل مجدول لفنادق المنطقة المركزية',
      subtitleEn: 'Scheduled delivery to central Makkah hotels',
      image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=1600&q=80',
      badge: 'Iftar Ready',
      ctaAr: 'اطلب الآن',
      ctaEn: 'Order Now',
    },
    {
      titleAr: 'هدايا العمرة والضيافة',
      titleEn: 'Umrah Hospitality Gifts',
      subtitleAr: 'ورد + ماء زمزم + بطاقة دعاء',
      subtitleEn: 'Blooms + Zamzam + dua card',
      image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1600&q=80',
      badge: 'Umrah VIP',
      ctaAr: 'هدايا العمرة',
      ctaEn: 'Umrah Gifts',
    },
  ],
  'Valentine Home': [
    {
      titleAr: 'عيد الحب · جوري أحمر ملكي في مكة',
      titleEn: 'Valentine · Royal Red Roses in Makkah',
      subtitleAr: 'بوكسات مخملية ورومانسية مع توصيل فوري',
      subtitleEn: 'Velvet romantic boxes with same-day express',
      image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1600&q=80',
      badge: 'Valentine · حب 2026',
      ctaAr: 'تسوق مجموعة الحب',
      ctaEn: 'Shop Valentine',
    },
    {
      titleAr: 'باقات رومانسية لفنادق الحرم',
      titleEn: 'Romantic Bouquets for Haram Hotels',
      subtitleAr: 'مفاجأة الغرفة مع رسالة حب عربية',
      subtitleEn: 'In-room surprise with Arabic love note',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
      badge: 'Hotel Surprise',
      ctaAr: 'فاجئ من تحب',
      ctaEn: 'Surprise Them',
    },
    {
      titleAr: 'مسكات وقلب من الجوري',
      titleEn: 'Hand Bouquets & Rose Hearts',
      subtitleAr: 'تصاميم حصرية لعشاق مكة',
      subtitleEn: 'Exclusive designs for Makkah couples',
      image: 'https://images.unsplash.com/photo-1455659817273-f9680774153e?auto=format&fit=crop&w=1600&q=80',
      badge: 'Limited',
      ctaAr: 'اختر الباقة',
      ctaEn: 'Choose Bouquet',
    },
  ],
};

export const FLOWERS_OFFER_POPUP = {
  titleAr: 'عرض خاص · خصم 15%',
  titleEn: 'Special Offer · 15% OFF',
  bodyAr: 'استخدم كود MAKKAH15 على أول طلب ورد طبيعي — صالح اليوم فقط',
  bodyEn: 'Use code MAKKAH15 on your first fresh-flower order — today only',
  code: 'MAKKAH15',
  discountPercent: 15,
};

export type FlowersFaq = { qAr: string; qEn: string; aAr: string; aEn: string };
export const FLOWERS_FAQ: FlowersFaq[] = [
  {
    qAr: 'كم يستغرق التوصيل داخل مكة؟',
    qEn: 'How fast is delivery inside Makkah?',
    aAr: 'معظم طلبات المنطقة المركزية وفنادق الحرم تصل خلال ساعتين في أوقات العمل.',
    aEn: 'Most central & Haram hotel orders arrive within 2 hours during business hours.',
  },
  {
    qAr: 'هل يمكن كتابة عبارة على كرت الإهداء؟',
    qEn: 'Can I add a gift card message?',
    aAr: 'نعم — عبارة عربية فاخرة مجاناً مع كل باقة عند إتمام الطلب.',
    aEn: 'Yes — a premium Arabic gift message is free with every bouquet at checkout.',
  },
  {
    qAr: 'ما وسائل الدفع المتاحة؟',
    qEn: 'Which payment methods are available?',
    aAr: 'مدى، Apple Pay، تابي، والدفع عند الاستلام حسب إعدادات المتجر.',
    aEn: 'Mada, Apple Pay, Tabby, and cash on delivery — per store payment settings.',
  },
  {
    qAr: 'هل أحتاج حساباً لمتابعة الطلبات؟',
    qEn: 'Do I need an account to track orders?',
    aAr: 'نعم — ملف العميل وتاريخ الطلبات متاح بعد تسجيل الدخول فقط.',
    aEn: 'Yes — profile and order history require customer login. Browse without login is fine.',
  },
];

export type FlowersReview = {
  nameAr: string;
  nameEn: string;
  cityAr: string;
  cityEn: string;
  rating: number;
  textAr: string;
  textEn: string;
};
export const FLOWERS_REVIEWS: FlowersReview[] = [
  {
    nameAr: 'نورة الحربي',
    nameEn: 'Noura Al-Harbi',
    cityAr: 'فندق أبراج الساعة',
    cityEn: 'Clock Towers Hotel',
    rating: 5,
    textAr: 'باقة العيد وصلت طازجة وفي الموعد — خدمة راقية تليق بمكة.',
    textEn: 'Eid bouquet arrived fresh and on time — service worthy of Makkah.',
  },
  {
    nameAr: 'خالد العتيبي',
    nameEn: 'Khalid Al-Otaibi',
    cityAr: 'العزيزية',
    cityEn: 'Al-Aziziyah',
    rating: 5,
    textAr: 'طلبت عبر واتساب وتم التأكيد فوراً. الورود بقيت أكثر من أسبوع.',
    textEn: 'Ordered via WhatsApp with instant confirm. Blooms lasted over a week.',
  },
  {
    nameAr: 'سارة المالكي',
    nameEn: 'Sara Al-Malki',
    cityAr: 'جبل عمر',
    cityEn: 'Jabal Omar',
    rating: 5,
    textAr: 'تنسيق رمضاني أنيق وكرت الإهداء بخط جميل جداً.',
    textEn: 'Elegant Ramadan arrangement and a beautifully written gift card.',
  },
];

export const FLOWERS_WHATSAPP = {
  phone: '966504428819',
  defaultMessageAr: 'السلام عليكم، أرغب بطلب ورد من زهور مكة الفاخرة',
  defaultMessageEn: 'Hello, I would like to order flowers from Makkah Fresh Flowers',
};

export const FLOWERS_STATIC_PAGES: Record<
  Exclude<FlowersSfPage, 'home' | 'shop' | 'product' | 'cart' | 'checkout' | 'thankyou' | 'profile' | 'track-order' | 'blog' | 'custom-page'>,
  { titleAr: string; titleEn: string; bodyAr: string; bodyEn: string }
> = {
  about: {
    titleAr: 'من نحن',
    titleEn: 'About Us',
    bodyAr:
      'زهور مكة الفاخرة — بوتيك ورد طبيعي في العاصمة المقدسة منذ سنوات. نقدم باقات هولندية وإكوادورية مع توصيل مبرد لفنادق الحرم وأحياء مكة.',
    bodyEn:
      'Makkah Fresh Flowers — a Holy City boutique for Dutch & Ecuadorian fresh blooms with chilled delivery to Haram hotels and Makkah districts.',
  },
  contact: {
    titleAr: 'تواصل معنا',
    titleEn: 'Contact Us',
    bodyAr: 'هاتف: +966 12 555 8920 · واتساب: +966 50 442 8819 · البريد: contact@giftshop-sa.com · مكة المكرمة، العزيزية',
    bodyEn: 'Phone: +966 12 555 8920 · WhatsApp: +966 50 442 8819 · Email: contact@giftshop-sa.com · Al-Aziziyah, Makkah',
  },
  privacy: {
    titleAr: 'سياسة الخصوصية',
    titleEn: 'Privacy Policy',
    bodyAr: 'نحترم خصوصية عملائنا. بيانات الطلب والدفع تُستخدم فقط لتجهيز وتوصيل الورود وفق أنظمة المملكة وهيئة الزكاة.',
    bodyEn: 'We respect customer privacy. Order and payment data is used only to fulfill floral delivery under KSA and ZATCA rules.',
  },
  return: {
    titleAr: 'سياسة الإرجاع والاستبدال',
    titleEn: 'Return Policy',
    bodyAr: 'الورد الطبيعي يُستبدل خلال ساعتين من التسليم إذا لم يطابق الصورة أو تأثر أثناء النقل — تواصل عبر واتساب مع صورة الطلب.',
    bodyEn: 'Fresh flowers may be replaced within 2 hours of delivery if quality differs from listing — contact WhatsApp with order photo.',
  },
  location: {
    titleAr: 'موقع المتجر',
    titleEn: 'Store Location',
    bodyAr: 'مكة المكرمة — حي العزيزية قرب المنطقة المركزية. توصيل لجميع أحياء مكة وفنادق الحرم وجبل عمر وأبراج الساعة.',
    bodyEn: 'Makkah — Al-Aziziyah near the central area. Delivery to all Makkah districts, Haram hotels, Jabal Omar & Clock Towers.',
  },
};

/** Demo variations keyed by product id (size / stem count). */
export const FLOWERS_VARIATIONS: Record<
  string,
  Array<{ id: string; labelAr: string; labelEn: string; priceDelta: number }>
> = {
  'prod-1': [
    { id: 'v-12', labelAr: '١٢ وردة', labelEn: '12 stems', priceDelta: 0 },
    { id: 'v-24', labelAr: '٢٤ وردة', labelEn: '24 stems', priceDelta: 120 },
    { id: 'v-36', labelAr: '٣٦ وردة', labelEn: '36 stems', priceDelta: 220 },
  ],
  'prod-2': [
    { id: 'v-std', labelAr: 'فازة قياسية', labelEn: 'Standard vase', priceDelta: 0 },
    { id: 'v-prem', labelAr: 'فازة كريستال', labelEn: 'Crystal vase', priceDelta: 90 },
  ],
  'prod-5': [
    { id: 'v-s', labelAr: 'صغير', labelEn: 'Small', priceDelta: 0 },
    { id: 'v-m', labelAr: 'وسط', labelEn: 'Medium', priceDelta: 80 },
    { id: 'v-l', labelAr: 'كبير', labelEn: 'Large', priceDelta: 150 },
  ],
  'prod-6': [
    { id: 'v-pink', labelAr: 'وردي', labelEn: 'Pink', priceDelta: 0 },
    { id: 'v-red', labelAr: 'أحمر', labelEn: 'Red', priceDelta: 40 },
    { id: 'v-mix', labelAr: 'مزيج', labelEn: 'Mixed', priceDelta: 60 },
  ],
};

export function isFlowersHomepage(style: string | undefined): style is FlowersHomepage {
  return (FLOWERS_HOMEPAGES as readonly string[]).includes(style || '');
}

export function resolveFlowersHomepage(style: string | undefined): FlowersHomepage {
  return isFlowersHomepage(style) ? style : 'Default Commerce';
}
