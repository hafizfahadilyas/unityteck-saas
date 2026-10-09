import { Product, Category, OccasionCategory, HeroSlide, Testimonial, Article, AddonOption, Order, OccasionReminder, SavedAddress } from '../types';

export const HERO_BANNER_IMAGE = '/src/assets/images/hadaya_luxury_master_hero_1791217937117.jpg';
export const PROMO_BANNER_IMAGE = '/src/assets/images/hadaya_promo_banner_1791216140411.jpg';
export const PINK_PEONIES_IMAGE = '/src/assets/images/hadaya_pink_peonies_1791216156090.jpg';
export const LUXURY_GIFT_SET_IMAGE = '/src/assets/images/hadaya_luxury_gift_set_1791216170853.jpg';
export const SLIDER_3D_IMAGE = '/src/assets/images/mecca_gifts_luxury_3d_slider_1791217013014.jpg';
export const REEL_COVER_IMAGE = '/src/assets/images/hadaya_social_reels_cover_1791217960147.jpg';

export const MECCA_LOGO = 'https://cdn.salla.sa/cdn-cgi/image/fit=scale-down,width=400,height=400,onerror=redirect,format=auto/NKOjvD/2Cnfzx8q23nZJ0tRXo8cUjOa6GP3vTWdrOePAhRl.png';
export const MECCA_VIDEO = 'https://ik.imagekit.io/053spzomk/video_2025-04-08_16-37-38.mp4?updatedAt=1744119535375';
export const MECCA_WHATSAPP = '+966581617712';

// 3D Motion Hero Slides with Parallax and Real Salla Mecca Gifts Banners
export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    title: 'دلّل أحبائك بباقة ورد تُعبّر عن أرقى مشاعرك',
    titleEn: 'Pamper Your Loved Ones with Blooms That Speak Your Heart',
    subtitle: 'استكشف معنا أنواعًا رائعة من باقات الورود الطبيعية المُنسقة بعناية لتكون هديتك المثالية في مكة المكرمة اليوم!',
    subtitleEn: 'Explore exquisite fresh bouquets hand-arranged with utmost care for your memorable celebrations in Mecca.',
    ctaText: 'استكشف الآن',
    ctaTextEn: 'Explore Now',
    image: HERO_BANNER_IMAGE,
    mobileImage: 'https://cdn.salla.sa/form-builder/TmE2G7VR7gIsy6Dp97xT2dKGNAGJN0t2JmxENWVT.png',
    categoryLink: 'باقات الورود الطبيعية'
  },
  {
    id: 'slide-2',
    title: 'هدايا تليق بلحظاتك الاستثنائية',
    titleEn: 'Gifts Worthy of Your Exceptional Moments',
    subtitle: 'زهور وهدايا فاخرة مختارة بعناية لتصنع لحظة لا تُنسى في أرقى الأجواء',
    subtitleEn: 'Luxury imported floral arrangements and signature keepsakes creating unforgettable memories.',
    ctaText: 'تسوق الآن',
    ctaTextEn: 'Shop Now',
    image: SLIDER_3D_IMAGE,
    mobileImage: SLIDER_3D_IMAGE,
    categoryLink: 'ورد وشوكولاتة بلجيكية فاخرة'
  },
  {
    id: 'slide-3',
    title: 'عندما يعجز الكلام، تتحدث الموسيقى. مع كل باقة ورد',
    titleEn: 'When Words Fall Short, Music Speaks with Every Bouquet',
    subtitle: 'باركود يحمل أغنية مُهداة باسم من تحب محفورة على كرت الإهداء الملكي. هدية تتجاوز التوقعات!',
    subtitleEn: 'Personalized QR musical barcode playing a dedicated melody alongside royal fresh blooms.',
    ctaText: 'اصنع مفاجأتك الآن',
    ctaTextEn: 'Create Your Surprise',
    image: 'https://cdn.files.salla.network/homepage/246985580/8243ba37-c5e7-4110-b953-b173492b97ff.webp',
    mobileImage: 'https://cdn.files.salla.network/homepage/246985580/6b1f28ea-f22e-4158-9816-95090a37ef52.webp',
    categoryLink: 'ورد و قهوة و حلا'
  },
  {
    id: 'slide-4',
    title: 'لأن لكل امرأة قصة، ولكل قصة هدية تُكمل جمالها!',
    titleEn: 'Every Woman Has a Story, and Every Story Deserves a Gift',
    subtitle: 'استكشف تشكيلاتنا الرائعة من الهدايا النسائية والزهور المُصممة بدقة لتجعل كل لحظة ذكرى لا تُنسى',
    subtitleEn: 'Curated royal feminine floral gifts and luxury perfume edits designed to honor her beauty.',
    ctaText: 'اكتشف التشكيلة',
    ctaTextEn: 'Discover Edits',
    image: 'https://cdn.files.salla.network/homepage/246985580/67a93505-20fe-4f5e-ad46-0e0b1d2c4390.webp',
    mobileImage: 'https://cdn.files.salla.network/homepage/246985580/8aef4393-f516-4551-a5c1-96be9db3ab66.webp',
    categoryLink: 'فازات ورود طبيعية'
  }
];

// Exact 8 Category Cards matching Mecca Gifts categories
export const EIGHT_FEATURED_CATEGORIES = [
  {
    id: 'cat-card-1',
    name: 'باقات فاخرة',
    nameEn: 'Luxury Bouquets',
    image: 'https://cdn.salla.sa/form-builder/tWCbNfZyZC271qgyhdROpC6ZdS6rCXbqmtvPD8hx.png',
    count: 24
  },
  {
    id: 'cat-card-2',
    name: 'ورد أحمر',
    nameEn: 'Red Roses',
    image: '/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg',
    count: 18
  },
  {
    id: 'cat-card-3',
    name: 'ورد أبيض',
    nameEn: 'White Roses',
    image: '/src/assets/images/hadaya_white_roses_bouquet_1791276726730.jpg',
    count: 15
  },
  {
    id: 'cat-card-4',
    name: 'هدايا رومانسية',
    nameEn: 'Romantic Gifts',
    image: 'https://cdn.salla.sa/form-builder/Y0Yt8LLfhRt46ljjaZjTaANumrZvYodYnv5CGQ7o.png',
    count: 20
  },
  {
    id: 'cat-card-5',
    name: 'عيد ميلاد',
    nameEn: 'Birthday',
    image: 'https://cdn.salla.sa/form-builder/nm5BDgkXRslZvqTetu5wTrCTTTTLTrsBhWwjHMyI.png',
    count: 22
  },
  {
    id: 'cat-card-6',
    name: 'ذكرى زواج',
    nameEn: 'Wedding & Anniversary',
    image: 'https://cdn.salla.sa/form-builder/Z8aMbQ8cDkf9OnQakCZwnH4GvpnqLlXsCqBk70ik.png',
    count: 16
  },
  {
    id: 'cat-card-7',
    name: 'هدايا وخطوبة',
    nameEn: 'Engagement & Bride',
    image: 'https://cdn.salla.sa/form-builder/unEMJIoOHLnWigTn0DpvQZbQMxNjU4QgVOT2BdUM.png',
    count: 14
  },
  {
    id: 'cat-card-8',
    name: 'هدايا رجالية',
    nameEn: 'Men Gifts',
    image: '/src/assets/images/hadaya_men_luxury_gift_1791219799100.jpg',
    count: 12
  }
];

// Main Categories with exact Mecca Gifts images
export const MAIN_CATEGORIES: Category[] = [
  {
    id: 'c-1',
    name: 'باقات الورود الطبيعية',
    nameEn: 'Natural Flower Bouquets',
    slug: 'natural-bouquets',
    image: 'https://cdn.salla.sa/form-builder/tWCbNfZyZC271qgyhdROpC6ZdS6rCXbqmtvPD8hx.png',
    count: 24
  },
  {
    id: 'c-2',
    name: 'ورد و شوكليت باتشي',
    nameEn: 'Roses & Patchi Chocolate',
    slug: 'roses-patchi',
    image: 'https://cdn.salla.sa/form-builder/vXd8gFVPfRavCrvqEUF68BHdHHn8pqj3mMglFTIt.png',
    count: 18
  },
  {
    id: 'c-3',
    name: 'ورد وشوكوليت بستاني',
    nameEn: 'Roses & Bostani Chocolate',
    slug: 'roses-bostani',
    image: 'https://cdn.salla.sa/form-builder/JEDxluyY7LbYdo5So7sLrPqqupntM3LUhIxV3gXD.png',
    count: 16
  },
  {
    id: 'c-4',
    name: 'فازات ورد طبيعي',
    nameEn: 'Natural Flower Vases',
    slug: 'flower-vases',
    image: 'https://cdn.salla.sa/form-builder/vMIFvv8ErCIt8W4npNMOB0Oj6Secf5lLWWByluvd.png',
    count: 20
  },
  {
    id: 'c-5',
    name: 'فازات الورود مع شوكليت',
    nameEn: 'Flower Vases with Chocolate',
    slug: 'vases-chocolate',
    image: 'https://cdn.salla.sa/form-builder/qk6gpVW76xoVeFb6kZrmFFGOFOXQ4q8JalQmKw0R.png',
    count: 15
  },
  {
    id: 'c-6',
    name: 'ورود مع أسماك زينة',
    nameEn: 'Roses with Aquarium Fish',
    slug: 'roses-fish',
    image: 'https://cdn.salla.sa/form-builder/ykMusuoNPFuZdMPHsJcYHJb6fejLSpaoSZxKGAwh.png',
    count: 12
  },
  {
    id: 'c-7',
    name: 'ورود مع عصافير الحب',
    nameEn: 'Roses with Lovebirds',
    slug: 'roses-lovebirds',
    image: 'https://cdn.salla.sa/form-builder/dZpSzihLrTks3koUrmlpfNV0AcHVSx3bE1KNFQTQ.png',
    count: 10
  },
  {
    id: 'c-8',
    name: 'تقديمة ورد وقهوة',
    nameEn: 'Roses & Coffee Presentation',
    slug: 'roses-coffee',
    image: 'https://cdn.salla.sa/form-builder/2fomvXwpTYOOx8h3JMZGP3r5dnXelUxxIUDuzepj.png',
    count: 14
  },
  {
    id: 'c-9',
    name: 'تقديمة ورد مع قهوة وحلا',
    nameEn: 'Roses with Coffee & Sweets',
    slug: 'roses-coffee-sweets',
    image: 'https://cdn.salla.sa/form-builder/zf3HeZ6jT4wON2ZEbeJfdMTc4bMLWQLkFvCndepr.png',
    count: 22
  },
  {
    id: 'c-10',
    name: 'ورد مع كيك',
    nameEn: 'Roses with Gourmet Cake',
    slug: 'roses-cake',
    image: 'https://cdn.salla.sa/form-builder/JnIWUYX47T9XyXPQlFx76ihWwhqD2N3xXKcYBMbh.png',
    count: 19
  },
  {
    id: 'c-11',
    name: 'تقديمة كيك الكوري',
    nameEn: 'Korean Lunchbox Bento Cake',
    slug: 'korean-cake',
    image: 'https://cdn.salla.sa/form-builder/iN2hGSe4EYU7Jl2Jt6U5uk9swZaHsPbJnnqpNpac.png',
    count: 16
  }
];

export const CATEGORIES: Category[] = MAIN_CATEGORIES;

// Occasions Categories
export const OCCASIONS_CATEGORIES: OccasionCategory[] = [
  {
    id: 'occ-1',
    name: 'لوحات مواجيب',
    nameEn: 'Mawajeeb Wooden Plaques',
    image: 'https://cdn.files.salla.network/products/246985580/539625c7-703f-4c13-aa4c-24d982e20865-original.webp'
  },
  {
    id: 'occ-2',
    name: 'هدايا المواليد',
    nameEn: 'Newborn Welcome Gifts',
    image: 'https://cdn.salla.sa/form-builder/h7hTylc4cMiriSfxe2sGsX0mL5Sc7akjxHAAUqHp.png'
  },
  {
    id: 'occ-3',
    name: 'هدايا التخرج',
    nameEn: 'Graduation Milestones',
    image: 'https://cdn.salla.sa/form-builder/unEMJIoOHLnWigTn0DpvQZbQMxNjU4QgVOT2BdUM.png'
  },
  {
    id: 'occ-4',
    name: 'هدايا عيد الحب',
    nameEn: 'Valentine & Love Blooms',
    image: 'https://cdn.salla.sa/form-builder/Y0Yt8LLfhRt46ljjaZjTaANumrZvYodYnv5CGQ7o.png'
  },
  {
    id: 'occ-5',
    name: 'هدايا الزواج',
    nameEn: 'Wedding & Bridal Keepsakes',
    image: 'https://cdn.salla.sa/form-builder/Z8aMbQ8cDkf9OnQakCZwnH4GvpnqLlXsCqBk70ik.png'
  },
  {
    id: 'occ-6',
    name: 'هدايا عيد ميلاد',
    nameEn: 'Birthday Celebrations',
    image: 'https://cdn.salla.sa/form-builder/nm5BDgkXRslZvqTetu5wTrCTTTTLTrsBhWwjHMyI.png'
  },
  {
    id: 'occ-7',
    name: 'هدايا الأطفال',
    nameEn: 'Kids Floral Treats',
    image: 'https://cdn.salla.sa/form-builder/R2HAE9ohx5xQ8jxsJANF6TQn9IUhL3iAS2rVR6W7.png'
  },
  {
    id: 'occ-8',
    name: 'هدايا الحجاج',
    nameEn: 'Pilgrim & Hajj Welcomes',
    image: 'https://cdn.salla.sa/form-builder/MNjdQ7uA2CdCPkq3zGfoOnTfi3Z9x3jDHDvPA1GQ.png'
  },
  {
    id: 'occ-9',
    name: 'تمنيات الشفاء',
    nameEn: 'Get Well Soon Blooms',
    image: 'https://cdn.salla.sa/form-builder/WnIswy3NAtj1b5CuPg0ESG1ONPIomfuzmnRfzPUD.png'
  },
  {
    id: 'occ-10',
    name: 'منزل جديد',
    nameEn: 'New Home Housewarming',
    image: 'https://cdn.salla.sa/form-builder/ZZtl1iGMQQN0Ja2ILLSl5G3TjtPGNrhS94x2QEqn.png'
  },
  {
    id: 'occ-11',
    name: 'هدايا عيد الأم',
    nameEn: 'Mother Day Honors',
    image: 'https://cdn.salla.sa/form-builder/Bo8UFylFRw1QqtVNpuWtfV5pMglIXsPulrPvHSSv.png'
  },
  {
    id: 'occ-12',
    name: 'هدايا العيدين',
    nameEn: 'Eid Celebrations',
    image: 'https://cdn.salla.sa/form-builder/dcmZbIHhsc0LDA9HU5qeAwUFuqRAB0Q4p9Iv1HzZ.png'
  },
  {
    id: 'occ-13',
    name: 'هدايا رمضانية',
    nameEn: 'Ramadan Mubarak Keepsakes',
    image: 'https://cdn.salla.sa/form-builder/UfWHmpajblMk5zqbh0vFskYciVVTQ4WIiuC3eNf7.png'
  }
];

// TikTok & Snapchat Viral Social Reels
export const SOCIAL_REELS = [
  {
    id: 'reel-1',
    title: 'تنسيق باقة العروس الملكية باللؤلؤ والورد الأبيض في مكة 👰‍♀️💍',
    titleEn: 'Royal Bridal Bouquet with Natural Pearls in Mecca',
    views: '248K',
    likes: '18.4K',
    tag: '#عروس_مكة #ورد_طبيعي',
    author: '@hadaya.mecca',
    videoUrl: MECCA_VIDEO,
    cover: REEL_COVER_IMAGE,
    productName: 'باقة النقاء العاجي',
    price: 340
  },
  {
    id: 'reel-2',
    title: 'مفاجأة غير متوقعة! باقة جوري أحمر مع بوكس باتشي وعصافير الحب 🕊️🌹',
    titleEn: 'Red Roses & Lovebirds surprise delivery in Mecca',
    views: '315K',
    likes: '26.9K',
    tag: '#هدايا_مكة #مفاجآت #اكسبلور',
    author: '@hadaya.mecca',
    videoUrl: MECCA_VIDEO,
    cover: 'https://cdn.salla.sa/form-builder/dZpSzihLrTks3koUrmlpfNV0AcHVSx3bE1KNFQTQ.png',
    productName: 'صندوق ورد وشوكولاتة باتشي الملكية',
    price: 450
  },
  {
    id: 'reel-3',
    title: 'تقديمة الكيك الكوري مع القهوة المختصة وتوصيل فوري خلال 45 دقيقة ☕🎂',
    titleEn: 'Korean Lunchbox Cake & Specialty Coffee presentation',
    views: '192K',
    likes: '14.2K',
    tag: '#كيك_كوري #كافيهات_مكة #ترند',
    author: '@hadaya.mecca',
    videoUrl: MECCA_VIDEO,
    cover: 'https://cdn.salla.sa/form-builder/iN2hGSe4EYU7Jl2Jt6U5uk9swZaHsPbJnnqpNpac.png',
    productName: 'تقديمة الكيك الكوري مع باقة الجوري',
    price: 280
  },
  {
    id: 'reel-4',
    title: 'فازة الهايدرنجا الزرقاء لمجلس فيلا العوالي الفاخرة 💙🏺',
    titleEn: 'Blue Hydrangea Luxury Vase styling for VIP majlis',
    views: '178K',
    likes: '12.8K',
    tag: '#ديكور_فلل #ورد_مكة #فخامة',
    author: '@hadaya.mecca',
    videoUrl: MECCA_VIDEO,
    cover: 'https://cdn.salla.sa/form-builder/vMIFvv8ErCIt8W4npNMOB0Oj6Secf5lLWWByluvd.png',
    productName: 'فازة كريستال أوركيد وجوري ملكي',
    price: 490
  }
];

// Product Collections (4 Products each as requested)
export const DISCOUNTED_BOUQUETS: Product[] = [
  {
    id: 'disc-1',
    name: 'باقة الورد المخملي الأنيقة',
    nameEn: 'Velvet Rose Elegance Bouquet',
    price: 199,
    originalPrice: 280,
    rating: 4.9,
    reviewsCount: 168,
    image: '/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg',
    category: 'باقات فاخرة',
    categoryEn: 'Luxury Bouquets',
    badge: 'خصم 30%',
    badgeEn: '30% Off',
    description: 'باقة مميزة من الورود الطبيعية الهولندية ذات اللون الوردي الرقيق مغلفة بأناقة استثنائية وبسعر مخفض لفترة محدودة.',
    descriptionEn: 'Charming fresh Dutch pink roses in artisan velvet wrap at an exclusive promotional price.',
    flowerTypes: ['جوري وردي هولندي', 'بيبي روز', 'يوكاليبتوس'],
    inStock: true
  },
  {
    id: 'disc-2',
    name: 'سحر الأبيض النقي',
    nameEn: 'Pure White Charm Bouquet',
    price: 220,
    originalPrice: 290,
    rating: 5.0,
    reviewsCount: 94,
    image: '/src/assets/images/hadaya_white_roses_bouquet_1791276726730.jpg',
    category: 'ورد أبيض',
    categoryEn: 'White Roses',
    badge: 'الأكثر توفيراً',
    badgeEn: 'Best Value',
    description: 'ورود جورى بيضاء نقية مع لمسات خضراء هادئة في تغليف كوري راقٍ تعبر عن الصفاء والمودة.',
    descriptionEn: 'Pure white garden roses with botanical eucalyptus greens in chic Korean florist wrap.',
    flowerTypes: ['جوري إكوادوري أبيض', 'جيبسوفيلا'],
    inStock: true
  },
  {
    id: 'disc-3',
    name: 'تناغم التوليب والورد',
    nameEn: 'Tulips & Roses Harmony',
    price: 245,
    originalPrice: 320,
    rating: 4.8,
    reviewsCount: 82,
    image: PINK_PEONIES_IMAGE,
    category: 'باقات فاخرة',
    categoryEn: 'Luxury Bouquets',
    badge: 'عرض خاص',
    badgeEn: 'Special Offer',
    description: 'مزيج فاخر من التوليب الهولندي والجوري الخوخي مع شريطة حريرية ذهبية.',
    descriptionEn: 'A delicate combination of peach roses and Dutch tulips with gold satin ribbon.',
    flowerTypes: ['توليب هولندي', 'جوري دراقي'],
    inStock: true
  },
  {
    id: 'disc-4',
    name: 'باقة الفرح الصباحية',
    nameEn: 'Morning Joy Bright Bouquet',
    price: 185,
    originalPrice: 250,
    rating: 4.9,
    reviewsCount: 110,
    image: 'https://cdn.salla.sa/form-builder/tWCbNfZyZC271qgyhdROpC6ZdS6rCXbqmtvPD8hx.png',
    category: 'ورد أحمر',
    categoryEn: 'Red Roses',
    badge: 'سعر مخفض',
    badgeEn: 'Sale',
    description: 'ألوان مشرقة تبعث السعادة والبهجة في النفس لتكون أحلى بداية ليوم من تحب.',
    descriptionEn: 'Radiant vibrant Ecuadorian blooms spreading morning positivity and warmth.',
    flowerTypes: ['جوري أحمر', 'بيبي روز مشمشي'],
    inStock: true
  },
  {
    id: 'disc-5',
    name: 'باقة جوري وشوكولاتة باتشي المخفضة',
    nameEn: 'Discounted Patchi & Red Roses Special',
    price: 210,
    originalPrice: 295,
    rating: 5.0,
    reviewsCount: 142,
    image: '/src/assets/images/hadaya_luxury_gift_noir_1791218956267.jpg',
    category: 'باقات فاخرة',
    categoryEn: 'Luxury Bouquets',
    badge: 'وفر 85 ر.س',
    badgeEn: 'Save 85 SAR',
    description: 'باقة جوري مخملية مع علبة شوكولاتة باتشي فاخرة بتخفيض استثنائي لتكتمل فرحة الإهداء.',
    descriptionEn: 'Velvet Ecuadorian red roses paired with an artisan Patchi chocolate gift box at a special discount.',
    flowerTypes: ['جوري إكوادوري أحمر', 'شوكولاتة باتشي'],
    inStock: true
  }
];

export const NATURAL_BOUQUETS: Product[] = [
  {
    id: 'nat-1',
    name: 'باقة الملكية الفاخرة (50 وردة جوري)',
    nameEn: 'The Royal Grandeur (50 Stems)',
    price: 499,
    originalPrice: 580,
    rating: 5.0,
    reviewsCount: 230,
    image: '/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg',
    category: 'ورد أحمر',
    categoryEn: 'Red Roses',
    badge: 'الأكثر مبيعاً',
    badgeEn: 'Best Seller',
    description: '50 وردة جوري أحمر إكوادوري مخملي طويل الساق مع تغليف أسود ملكي مطرز بالذهب.',
    descriptionEn: '50 premium long-stem Ecuadorian velvety red roses wrapped in black and gold silk packaging.',
    flowerTypes: ['جوري أحمر إكوادوري'],
    inStock: true
  },
  {
    id: 'nat-2',
    name: 'بستان الفاوانيا والبيبي روز',
    nameEn: 'Peonies & Spray Roses Garden',
    price: 380,
    originalPrice: 440,
    rating: 4.9,
    reviewsCount: 145,
    image: PINK_PEONIES_IMAGE,
    category: 'باقات فاخرة',
    categoryEn: 'Luxury Bouquets',
    badge: 'حصري',
    badgeEn: 'Exclusive',
    description: 'زهور الفاوانيا الوردية المستوردة مع باقة بيبي روز ناعمة بتنسيق أرستقراطي.',
    descriptionEn: 'Imported fresh peony stems harmonized with tender baby spray roses.',
    flowerTypes: ['بيوني وردي', 'بيبي روز هولندي'],
    inStock: true
  },
  {
    id: 'nat-3',
    name: 'باقة النقاء العاجي',
    nameEn: 'Ivory Purity Arrangement',
    price: 340,
    originalPrice: 395,
    rating: 4.8,
    reviewsCount: 78,
    image: '/src/assets/images/hadaya_white_roses_bouquet_1791276726730.jpg',
    category: 'ورد أبيض',
    categoryEn: 'White Roses',
    badge: 'جديد',
    badgeEn: 'New',
    description: 'ورود عاجية نقية مع أزهار الليليانثوس الخالص واليوكاليبتوس الفواح.',
    descriptionEn: 'Ivory roses paired with ethereal lisianthus and fragrance eucalyptus foliage.',
    flowerTypes: ['جوري عاجي', 'ليليانثوس'],
    inStock: true
  },
  {
    id: 'nat-4',
    name: 'باقة لافندر الروح الحجازية',
    nameEn: 'Hijazi Soul Lavender Edit',
    price: 310,
    originalPrice: 360,
    rating: 4.9,
    reviewsCount: 92,
    image: 'https://cdn.salla.sa/form-builder/Y0Yt8LLfhRt46ljjaZjTaANumrZvYodYnv5CGQ7o.png',
    category: 'هدايا وخطوبة',
    categoryEn: 'Engagement',
    badge: 'طبيعي 100%',
    badgeEn: '100% Fresh',
    description: 'مزيج ساحر من اللافندر الطبيعي والورود البنفسجية التي تدوم نضارتها لأيام طويلة.',
    descriptionEn: 'French natural lavender mingled with royal purple roses and fresh herbal greens.',
    flowerTypes: ['لافندر طبيعي', 'جوري بنفسجي'],
    inStock: true
  }
];

export const CHOCOLATE_ROSES: Product[] = [
  {
    id: 'choc-1',
    name: 'صندوق ورد وشوكولاتة باتشي الملكية',
    nameEn: 'Patchi Royal Chocolates & Roses Box',
    price: 450,
    originalPrice: 520,
    rating: 5.0,
    reviewsCount: 195,
    image: LUXURY_GIFT_SET_IMAGE,
    category: 'هدايا رومانسية',
    categoryEn: 'Romantic Gifts',
    badge: 'الأكثر طلباً',
    badgeEn: 'Top Choice',
    description: 'صندوق فاخر يجمع بين الورد الجوري الأحمر الفاتن ونصف كيلو من شوكولاتة باتشي الفاخرة.',
    descriptionEn: 'Opulent leather keepsake box with crimson roses and half a kilo of Patchi chocolates.',
    flowerTypes: ['جوري أحمر', 'شوكولاتة باتشي'],
    inStock: true
  },
  {
    id: 'choc-2',
    name: 'بوكس ورد وشوكوليت بستاني الفاخر',
    nameEn: 'Bostani Signature Chocolates & Blooms',
    price: 399,
    originalPrice: 470,
    rating: 4.9,
    reviewsCount: 112,
    image: 'https://cdn.salla.sa/form-builder/JEDxluyY7LbYdo5So7sLrPqqupntM3LUhIxV3gXD.png',
    category: 'هدايا رومانسية',
    categoryEn: 'Romantic Gifts',
    badge: 'تغليف راقٍ',
    badgeEn: 'Luxury Wrap',
    description: 'تنسيق أنيق من الورود البيضاء والزهرية مع بوكس شوكولاتة بستاني البلجيكية بحشوات البرالين والكراميل.',
    descriptionEn: 'White and blush roses with Bostani Belgian chocolate assortment.',
    flowerTypes: ['جوري هولندي', 'شوكولاتة بستاني'],
    inStock: true
  },
  {
    id: 'choc-3',
    name: 'صينية إهداء التميز مع شوكولاتة باتشي',
    nameEn: 'Prestige Gift Tray with Patchi',
    price: 520,
    originalPrice: 600,
    rating: 5.0,
    reviewsCount: 88,
    image: 'https://cdn.salla.sa/form-builder/qk6gpVW76xoVeFb6kZrmFFGOFOXQ4q8JalQmKw0R.png',
    category: 'هدايا رجالية',
    categoryEn: 'Men Gifts',
    badge: 'ملكي',
    badgeEn: 'Royal',
    description: 'صينية أكريليك شفافة مذهبة تضم تشكيلة زهور طبيعية وتنسيقاً خاصاً لقطع الشوكولاتة الفاخرة.',
    descriptionEn: 'Gilded acrylic tray featuring artisanal floral arrangement and chocolate assortment.',
    flowerTypes: ['جوري مشمش', 'شوكولاتة فاخرة'],
    inStock: true
  },
  {
    id: 'choc-4',
    name: 'بوكس القلب الوردي مع ترافل بلجيكي',
    nameEn: 'Blush Heart Box with Belgian Truffles',
    price: 360,
    originalPrice: 420,
    rating: 4.8,
    reviewsCount: 74,
    image: '/src/assets/images/hadaya_luxury_gift_set_1791216170853.jpg',
    category: 'هدايا رومانسية',
    categoryEn: 'Romantic Gifts',
    badge: 'رومانسي',
    badgeEn: 'Romantic',
    description: 'صندوق بشكل قلب مبطن بالمخمل مع ورد طبيعي وترافل بلجيكي داكن يذوب في الفم.',
    descriptionEn: 'Velvet heart gift box with Ecuadorian roses and dark Belgian cocoa truffles.',
    flowerTypes: ['جوري وردي', 'ترافل بلجيكي'],
    inStock: true
  }
];

export const CAKE_ROSES: Product[] = [
  {
    id: 'cake-1',
    name: 'تقديمة الكيك الكوري مع باقة الجوري',
    nameEn: 'Korean Bento Lunchbox Cake & Roses',
    price: 280,
    originalPrice: 340,
    rating: 4.9,
    reviewsCount: 154,
    image: 'https://cdn.salla.sa/form-builder/iN2hGSe4EYU7Jl2Jt6U5uk9swZaHsPbJnnqpNpac.png',
    category: 'عيد ميلاد',
    categoryEn: 'Birthday',
    badge: 'ترند هدايا مكة',
    badgeEn: 'Trending',
    description: 'كيك كوري لطيف بنكهة الفانيلا والتوت مع عبارة مخصصة وباقة ورد يد صغيرة أنيقة.',
    descriptionEn: 'Cute Korean lunchbox bento cake with custom lettering and matching hand-tied bouquet.',
    flowerTypes: ['جوري هولندي', 'كيك كوري خاص'],
    inStock: true
  },
  {
    id: 'cake-2',
    name: 'كعكة الريد فيلفيت الملكية مع الورد الأحمر',
    nameEn: 'Royal Red Velvet Cake & Red Roses',
    price: 390,
    originalPrice: 460,
    rating: 5.0,
    reviewsCount: 130,
    image: 'https://cdn.salla.sa/form-builder/JnIWUYX47T9XyXPQlFx76ihWwhqD2N3xXKcYBMbh.png',
    category: 'عيد ميلاد',
    categoryEn: 'Birthday',
    badge: 'الأكثر طلباً',
    badgeEn: 'Best Seller',
    description: 'كعكة رد فيلفت طازجة 6 إنش مع طبقات الجبن الكريمة الفاخرة وباقة 20 وردة حمراء مخملية.',
    descriptionEn: 'Fresh 6-inch Red Velvet cake with cream cheese frosting and 20 velvety red roses.',
    flowerTypes: ['جوري أحمر', 'كيك ريد فيلفت'],
    inStock: true
  },
  {
    id: 'cake-3',
    name: 'بوكس الكب كيك الفاخر مع ورود الباستيل',
    nameEn: 'Pastel Blooms & Cupcakes Box',
    price: 310,
    originalPrice: 370,
    rating: 4.8,
    reviewsCount: 65,
    image: '/src/assets/images/hadaya_luxury_velvet_cake_1791218716453.jpg',
    category: 'عيد ميلاد',
    categoryEn: 'Birthday',
    badge: 'مبهج',
    badgeEn: 'Celebration',
    description: '6 قطع كب كيك مزينة بحرفية عالية مع تشكيلة ورود الباستيل المبهجة وشمعة ذهبية.',
    descriptionEn: '6 artisan gourmet cupcakes arranged beside fresh pastel roses and birthday candle.',
    flowerTypes: ['بيبي روز باستيل', 'كب كيك فاخر'],
    inStock: true
  },
  {
    id: 'cake-4',
    name: 'صندوق احتفال التخرج والميلاد المتكامل',
    nameEn: 'Ultimate Celebration Cake & Blooms Combo',
    price: 450,
    originalPrice: 530,
    rating: 4.9,
    reviewsCount: 98,
    image: 'https://cdn.files.salla.network/other/246985580/526058e5-3543-4d24-b93f-1ced5ca0d974-original.webp',
    category: 'ذكرى زواج',
    categoryEn: 'Wedding & Anniversary',
    badge: 'طقم متكامل',
    badgeEn: 'Complete Set',
    description: 'كيكة احتفال خاصة مع بالون هيليوم ذهبي وباقة زهور منسقة وبطاقة إهداء مطبوعة.',
    descriptionEn: 'Celebration cake, helium metallic balloon, custom floral arrangement and gold card.',
    flowerTypes: ['زهور مشكلة', 'كيكة فانيلا شوكولا'],
    inStock: true
  }
];

export const COFFEE_SWEETS_ROSES: Product[] = [
  {
    id: 'cof-1',
    name: 'تقديمة الورد مع القهوة العربية والتمور المحشوة',
    nameEn: 'Arabic Coffee, Stuffed Dates & Roses',
    price: 360,
    originalPrice: 420,
    rating: 5.0,
    reviewsCount: 142,
    image: 'https://cdn.salla.sa/form-builder/2fomvXwpTYOOx8h3JMZGP3r5dnXelUxxIUDuzepj.png',
    category: 'هدايا رجالية',
    categoryEn: 'Men Gifts',
    badge: 'كرم الحجاز',
    badgeEn: 'Hijazi Heritage',
    description: 'دلة قهوة عربية بالهيل والزعفران مع صينية تمر سكري مفتل محشو بالمكسرات والورد الطبيعي.',
    descriptionEn: 'Cardamom Arabic coffee set with premium stuffed Sukari dates and fresh florals.',
    flowerTypes: ['جوري أحمر', 'قهوة عربية وتمر'],
    inStock: true
  },
  {
    id: 'cof-2',
    name: 'بوكس قهوة الصباح والورد المنعش',
    nameEn: 'Morning Coffee Brew & Fresh Bouquet',
    price: 295,
    originalPrice: 350,
    rating: 4.9,
    reviewsCount: 88,
    image: 'https://cdn.salla.sa/form-builder/zf3HeZ6jT4wON2ZEbeJfdMTc4bMLWQLkFvCndepr.png',
    category: 'باقات فاخرة',
    categoryEn: 'Luxury Bouquets',
    badge: 'الأكثر تميزاً',
    badgeEn: 'Popular Choice',
    description: 'كوب سيراميك فاخر مصنوع يدوياً مع قهوة مختصة وباقة ورد مدمجة أنيقة لتشرق بها الصباحات.',
    descriptionEn: 'Handcrafted ceramic tumbler, specialty coffee beans, and vibrant bouquet.',
    flowerTypes: ['توليب وجوري', 'قهوة مختصة'],
    inStock: true
  },
  {
    id: 'cof-3',
    name: 'صندوق السعادة: قهوة لاتيه، دوناتس وزهور',
    nameEn: 'Sweet Moments: Latte, Donuts & Blooms',
    price: 270,
    originalPrice: 320,
    rating: 4.8,
    reviewsCount: 114,
    image: 'https://cdn.files.salla.network/other/246985580/1b671cbc-3ffd-423d-97b8-f51660a118a4-original.webp',
    category: 'هدايا رومانسية',
    categoryEn: 'Romantic Gifts',
    badge: 'مفاجأة لذيذة',
    badgeEn: 'Sweet Surprise',
    description: 'مزيج لذيذ يجمع بين الدوناتس الطازجة ومشروب القهوة المفضل وباقة ورد صفراء مبهجة.',
    descriptionEn: 'Gourmet glazed donuts, iced coffee beverage, and sun-kissed yellow blooms.',
    flowerTypes: ['جوري أصفر', 'حلويات وقهوة'],
    inStock: true
  },
  {
    id: 'cof-4',
    name: 'صينية الضيافة الملكية: قهوة وحلا وفازة ورد',
    nameEn: 'Royal Hospitality: Coffee, Sweets & Vase',
    price: 480,
    originalPrice: 560,
    rating: 5.0,
    reviewsCount: 76,
    image: '/src/assets/images/hadaya_luxury_gift_noir_1791218956267.jpg',
    category: 'هدايا رجالية',
    categoryEn: 'Men Gifts',
    badge: 'فاخر جداً',
    badgeEn: 'Ultra Luxury',
    description: 'صينية رخام أسود وذهبي تضم فازة كريستال ورد طبيعي، ترمس قهوة ذهبي، وبوكس حلا بلجيكي.',
    descriptionEn: 'Black and gold marble tray with crystal floral vase, thermal flask, and Belgian sweets.',
    flowerTypes: ['جوري وأوركيد', 'ضيافة ملكية'],
    inStock: true
  }
];

export const FLOWER_VASES: Product[] = [
  {
    id: 'vase-1',
    name: 'فازة كريستال أوركيد وجوري ملكي',
    nameEn: 'Crystal Orchid & Royal Rose Vase',
    price: 490,
    originalPrice: 580,
    rating: 5.0,
    reviewsCount: 165,
    image: 'https://cdn.salla.sa/form-builder/vMIFvv8ErCIt8W4npNMOB0Oj6Secf5lLWWByluvd.png',
    category: 'ورد أبيض',
    categoryEn: 'White Roses',
    badge: 'الأكثر طلباً',
    badgeEn: 'Best Seller',
    description: 'فازة زجاجية منحوتة يدوياً تضم زهور الأوركيد البيضاء والورود الإكوادورية بأناقة تناسب المجالس.',
    descriptionEn: 'Hand-cut crystal cylinder vase hosting pure white orchids and Ecuadorian roses.',
    flowerTypes: ['أوركيد أبيض', 'جوري عاجي'],
    inStock: true
  },
  {
    id: 'vase-2',
    name: 'فازة السيراميك المضلعة العصرية',
    nameEn: 'Fluted Ceramic Designer Vase',
    price: 360,
    originalPrice: 420,
    rating: 4.9,
    reviewsCount: 90,
    image: '/src/assets/images/hadaya_white_orchid_penthouse_1791218732789.jpg',
    category: 'باقات فاخرة',
    categoryEn: 'Luxury Bouquets',
    badge: 'تصميم مودرن',
    badgeEn: 'Modern Design',
    description: 'فازة سيراميك بلون رملي هادئ بتنسيق ياباني إيكيبانا يمنح المكان لمسة هدوء وجمال.',
    descriptionEn: 'Neutral sandy fluted ceramic vase with Ikebana minimalist floral architecture.',
    flowerTypes: ['هايدرنجا', 'بيبي روز'],
    inStock: true
  },
  {
    id: 'vase-3',
    name: 'فازة الهايدرنجا الزرقاء والجوري الملكي',
    nameEn: 'Blue Hydrangea & White Roses Vase',
    price: 420,
    originalPrice: 490,
    rating: 4.8,
    reviewsCount: 84,
    image: '/src/assets/images/hadaya_white_orchid_penthouse_1791218732789.jpg',
    category: 'ورد أبيض',
    categoryEn: 'White Roses',
    badge: 'فاخر',
    badgeEn: 'Luxury',
    description: 'كتل زرقاء ساحرة من الهايدرنجا الهولندية مع الورد الأبيض في فازة زجاجية ثقيلة.',
    descriptionEn: 'Lush blue Dutch hydrangeas contrasted with pristine white roses in heavy glass vase.',
    flowerTypes: ['هايدرنجا زرقاء', 'جوري أبيض'],
    inStock: true
  },
  {
    id: 'vase-4',
    name: 'فازة بيبي روز متعددة الألوان للمكاتب',
    nameEn: 'Multicolor Spray Rose Desk Vase',
    price: 290,
    originalPrice: 340,
    rating: 4.9,
    reviewsCount: 110,
    image: PINK_PEONIES_IMAGE,
    category: 'هدايا وخطوبة',
    categoryEn: 'Engagement',
    badge: 'مثالي للمكتب',
    badgeEn: 'Office Perfect',
    description: 'حجم مدمج أنيق بفازة زجاجية شفافة مناسبة للمكاتب وطاولات القهوة برائحة عطرة.',
    descriptionEn: 'Compact crystal vase with aromatic spray roses tailored for desk and coffee tables.',
    flowerTypes: ['بيبي روز هولندي مشكل'],
    inStock: true
  }
];

export const MAWAJEEB_PRODUCTS: Product[] = [
  {
    id: 'maw-1',
    name: 'لوحة مواجيب خشبية مذهبة مع جوري أحمر',
    nameEn: 'Mawajeeb Wooden Heritage Plaque & Red Roses',
    price: 390,
    originalPrice: 450,
    rating: 5.0,
    reviewsCount: 74,
    image: 'https://cdn.files.salla.network/products/246985580/539625c7-703f-4c13-aa4c-24d982e20865-original.webp',
    category: 'لوحات مواجيب',
    categoryEn: 'Mawajeeb Plaques',
    categorySlug: 'mawajeeb',
    occasions: ['لوحات مواجيب', 'مناسبات عامة', 'زيارات وضيافة'],
    tags: ['مواجيب', 'تراث', 'خشب', 'ذهب', 'جوري'],
    badge: 'تراث حجازي أصيل',
    badgeEn: 'Hijazi Heritage',
    description: 'لوحة مواجيب خشبية محفورة يدوياً بأبيات ترحيبية حجازية ومطعمة بالورد الطبيعي الإكوادوري.',
    descriptionEn: 'Hand-carved wooden plaque with traditional Hijazi greeting poems and natural roses.',
    flowerTypes: ['جوري أحمر', 'بيبي روز'],
    inStock: true
  },
  {
    id: 'maw-2',
    name: 'صندوق مواجيب الفضي الفاخر مع بخور مروكي وورد',
    nameEn: 'Silver Mawajeeb Box with Maroki Oud & Blooms',
    price: 460,
    originalPrice: 530,
    rating: 4.9,
    reviewsCount: 52,
    image: '/src/assets/images/hadaya_luxury_gift_noir_1791218956267.jpg',
    category: 'لوحات مواجيب',
    categoryEn: 'Mawajeeb Plaques',
    categorySlug: 'mawajeeb',
    occasions: ['لوحات مواجيب', 'هدايا رجالية', 'مجالس فخمة'],
    tags: ['مواجيب', 'بخور', 'عود', 'ورد', 'فضي'],
    badge: 'كرم الضيافة',
    badgeEn: 'Hospitality Choice',
    description: 'صندوق خشبي فاخر بلون فضي يضم أوقية عود مروكي طبيعي وفازة ورد جوري مدمجة.',
    descriptionEn: 'Luxury presentation containing authentic Maroki oud with fresh vibrant blooms.',
    flowerTypes: ['جوري هولندي', 'عود طبيعي'],
    inStock: true
  }
];

export const NEWBORN_PRODUCTS: Product[] = [
  {
    id: 'new-1',
    name: 'باقة أهلاً بالمولود (ورد وسيراميك ودبدوب ناعم)',
    nameEn: 'Welcome Baby Boy Floral Ceramic & Teddy',
    price: 280,
    originalPrice: 340,
    rating: 4.9,
    reviewsCount: 88,
    image: 'https://cdn.salla.sa/form-builder/h7hTylc4cMiriSfxe2sGsX0mL5Sc7akjxHAAUqHp.png',
    category: 'هدايا المواليد',
    categoryEn: 'Newborn Gifts',
    categorySlug: 'newborn',
    occasions: ['هدايا المواليد', 'استقبال مستشفى'],
    tags: ['مواليد', 'مولود', 'أزرق', 'أبيض', 'دبدوب'],
    badge: 'مبروك المولود',
    badgeEn: 'Baby Boy',
    description: 'تنسيق أنيق من البيبي روز الأبيض والأزرق مع دبدوب قطيفة فاخر وبطاقة تهنئة خاصة.',
    descriptionEn: 'Tender baby spray roses paired with a soft plush teddy bear and congrats card.',
    flowerTypes: ['بيبي روز', 'هايدرنجا زرقاء'],
    inStock: true
  },
  {
    id: 'new-2',
    name: 'ستاند ورد استقبال المولودة الأميرة (بيبي روز وردي)',
    nameEn: 'Royal Baby Girl Reception Floral Stand',
    price: 340,
    originalPrice: 410,
    rating: 5.0,
    reviewsCount: 112,
    image: PINK_PEONIES_IMAGE,
    category: 'هدايا المواليد',
    categoryEn: 'Newborn Gifts',
    categorySlug: 'newborn',
    occasions: ['هدايا المواليد', 'استقبال مستشفى'],
    tags: ['مواليد', 'مولودة', 'وردي', 'بيبي روز'],
    badge: 'أميرة جديدة',
    badgeEn: 'Baby Girl',
    description: 'ستاند معدني ذهبي يحمل كتلة ساحرة من الزهور الوردية الناعمة وبالون تهنئة بقدوم المولودة.',
    descriptionEn: 'Golden metal stand loaded with soft pink roses and celebratory balloon.',
    flowerTypes: ['بيوني وردي', 'بيبي روز'],
    inStock: true
  }
];

export const GRADUATION_PRODUCTS: Product[] = [
  {
    id: 'grad-1',
    name: 'باقة التخرج الملكية مع وشاح وقبعة مذهبة',
    nameEn: 'Royal Graduation Bouquet with Gold Cap',
    price: 320,
    originalPrice: 390,
    rating: 5.0,
    reviewsCount: 145,
    image: 'https://cdn.salla.sa/form-builder/unEMJIoOHLnWigTn0DpvQZbQMxNjU4QgVOT2BdUM.png',
    category: 'هدايا التخرج',
    categoryEn: 'Graduation Gifts',
    categorySlug: 'graduation',
    occasions: ['هدايا التخرج', 'نجاح وتفوق'],
    tags: ['تخرج', 'نجاح', 'قبعة تخرج', 'أصفر', 'أبيض'],
    badge: 'ألف مبروك التخرج',
    badgeEn: 'Congrats Graduate',
    description: 'باقة زهور بيضاء وصفراء منسقة بعناية وتتوجها قبعة تخرج صغيرة وشريطة مطبوعة باسم الخريج.',
    descriptionEn: 'Splendid celebratory bouquet topped with miniature graduation cap and gold ribbons.',
    flowerTypes: ['جوري أصفر', 'ليليوم أبيض'],
    inStock: true
  },
  {
    id: 'grad-2',
    name: 'صندوق مبارك التخرج مع شوكولاتة وورد طبيعي',
    nameEn: 'Congratulations Graduate Chocolate & Blooms Box',
    price: 375,
    originalPrice: 440,
    rating: 4.9,
    reviewsCount: 96,
    image: '/src/assets/images/hadaya_luxury_gift_set_1791216170853.jpg',
    category: 'هدايا التخرج',
    categoryEn: 'Graduation Gifts',
    categorySlug: 'graduation',
    occasions: ['هدايا التخرج', 'نجاح وتفوق'],
    tags: ['تخرج', 'شوكولاتة', 'بوكس', 'ورد'],
    badge: 'هدية متكاملة',
    badgeEn: 'Gift Box',
    description: 'صندوق أنيق يجمع بين حبات شوكولاتة باتشي الفاخرة وباقة ورد نضرة وبطاقة تهنئة بالشهادة.',
    descriptionEn: 'Luxury presentation box with gourmet Patchi chocolates and vibrant florals.',
    flowerTypes: ['جوري أحمر', 'شوكولاتة بلجيكية'],
    inStock: true
  }
];

export const LUXURY_SETS: Product[] = [
  {
    id: 'men-gift-1',
    name: 'طقم هدايا رجالية ملكي: عطر، محفظة وساعة فاخرة وباقة ورد',
    nameEn: 'Royal Men Luxury Gift Box: Perfume, Watch, Wallet & Blooms',
    price: 540,
    originalPrice: 620,
    rating: 5.0,
    reviewsCount: 168,
    image: '/src/assets/images/hadaya_men_luxury_gift_1791219799100.jpg',
    category: 'هدايا رجالية',
    categoryEn: 'Men Gifts',
    categorySlug: 'men-gifts',
    occasions: ['هدايا رجالية', 'ترقية وتخرج', 'يوم الأب'],
    tags: ['رجالي', 'عطر', 'ساعة', 'محفظة', 'ورد'],
    badge: 'الأكثر طلباً للرجال',
    badgeEn: 'Best for Men',
    description: 'صندوق جلدي أنيق يضم عطراً رجالياً فاخراً، محفظة جلد طبيعي، ساعة أنيقة، قلم مذهب، وباقة ورد طبيعي منسقة بعناية.',
    descriptionEn: 'Luxury leatherette box featuring artisan men fragrance, genuine leather wallet, timepiece, and fresh roses.',
    flowerTypes: ['بيبي روز وردي', 'كرزنثيموم أخضر'],
    inStock: true
  },
  {
    id: 'women-gift-1',
    name: 'صندوق هدايا نسائية فاخر: عطر، طقم مجوهرات وباقة بيوني وردي',
    nameEn: 'Royal Women Luxury Gift Box: Perfume, Jewelry Set & Peonies',
    price: 580,
    originalPrice: 690,
    rating: 5.0,
    reviewsCount: 215,
    image: '/src/assets/images/hadaya_women_luxury_gift_1791219815272.jpg',
    category: 'هدايا نسائية',
    categoryEn: 'Women Gifts',
    categorySlug: 'women-gifts',
    occasions: ['هدايا نسائية', 'ذكرى زواج وحب', 'عيد ميلاد'],
    tags: ['نسائي', 'مجوهرات', 'عطر', 'بيوني', 'وردي'],
    badge: 'الأرقى للسيدات',
    badgeEn: 'Royal Choice',
    description: 'صندوق مخملي زهري يضم عطر أنثوي ناعم، طقم أساور وأقراط مرصعة بالزركون اللامع، وباقة زهور بيوني وجوري ساحرة.',
    descriptionEn: 'Pastel pink luxury jewelry box paired with fine perfume and fresh English pink peony roses.',
    flowerTypes: ['بيوني وردي هولندي', 'جوري حديقة'],
    inStock: true
  }
];

export const FLAGSHIP_BOUQUETS: Product[] = [
  {
    id: 'wm-peony-05',
    name: 'صندوق بيوني هولندي وردي ناعم',
    nameEn: 'Dutch Peony Soft Blush Box',
    price: 380,
    originalPrice: 450,
    rating: 4.9,
    reviewsCount: 185,
    image: '/src/assets/images/hadaya_pink_peonies_1791216156090.jpg',
    category: 'باقات فاخرة',
    categoryEn: 'Luxury Bouquets',
    badge: 'الأكثر مبيعاً',
    badgeEn: 'Best Seller',
    description: 'زهور البيوني الهولندية باللون الوردي الرقيق منسقة في صندوق هدايا مخملي فاخر مع شريطة حريرية.',
    descriptionEn: 'Charming blush pink Dutch peonies tailored in a handcrafted velvet gift box with silk ribbon.',
    flowerTypes: ['بيوني هولندي', 'جوري حديقة'],
    inStock: true,
    featured: true
  },
  {
    id: 'wm-val-06',
    name: 'تنسيق قلب الورد الرومانسي (فالنتين)',
    nameEn: 'Valentine Rose Heart Arrangement',
    price: 420,
    originalPrice: 520,
    rating: 5.0,
    reviewsCount: 240,
    image: '/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg',
    category: 'هدايا رومانسية',
    categoryEn: 'Romantic Gifts',
    badge: 'رومانسي',
    badgeEn: 'Romantic',
    description: 'تنسيق على شكل قلب يضم أرقى أنواع الجوري الإكوادوري الأحمر الفاخر للمناسبات الرومانسية الاستثنائية.',
    descriptionEn: 'Magnificent heart-shaped red Ecuadorian roses arrangement crafted for unforgettable romantic celebrations.',
    flowerTypes: ['جوري إكوادوري أحمر'],
    inStock: true,
    featured: true
  },
  {
    id: 'wm-rose-01',
    name: 'صندوق مخملي رويال جوري هولندي أحمر',
    nameEn: 'Royal Dutch Red Roses Velvet Box',
    price: 350,
    originalPrice: 420,
    rating: 4.9,
    reviewsCount: 198,
    image: '/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg',
    category: 'ورد أحمر',
    categoryEn: 'Red Roses',
    badge: 'ملكي',
    badgeEn: 'Royal',
    description: 'صندوق مخملي أنيق يحتوي على 30 وردة جوري هولندي أحمر فاقع النضارة مع لمسات من الجيبسوفيلا.',
    descriptionEn: 'Premium velvet circular box holding 30 fresh Dutch red roses embellished with delicate gypsophila.',
    flowerTypes: ['جوري هولندي', 'جبسوفيلا'],
    inStock: true,
    featured: true
  },
  {
    id: 'wm-lily-02',
    name: 'باقة النقاء الليليوم الأبيض والكازابلانكا',
    nameEn: 'Pure White Casablanca Lilies Bouquet',
    price: 290,
    originalPrice: 350,
    rating: 4.8,
    reviewsCount: 142,
    image: '/src/assets/images/hadaya_white_roses_bouquet_1791276726730.jpg',
    category: 'ورد أبيض',
    categoryEn: 'White Roses',
    badge: 'نقاء',
    badgeEn: 'Pure Elegance',
    description: 'باقة فاخرة من زهور الليليوم الأبيض العطرة والكازابلانكا مع أوراق الأوكالبتوس الخضراء في غلاف أنيق.',
    descriptionEn: 'Aromatic Casablanca white lilies paired with silver-dollar eucalyptus in artisanal layered wrapping.',
    flowerTypes: ['ليليوم أبيض', 'كازابلانكا', 'أوكالبتوس'],
    inStock: true,
    featured: true
  },
  {
    id: 'wm-vip-03',
    name: 'فازة كريستال ملكية لكبار الشخصيات VIP',
    nameEn: 'Royal Crystal Grand VIP Floor Vase',
    price: 680,
    originalPrice: 850,
    rating: 5.0,
    reviewsCount: 110,
    image: '/src/assets/images/hadaya_white_orchid_penthouse_1791218732789.jpg',
    category: 'باقات فاخرة',
    categoryEn: 'Luxury Bouquets',
    badge: 'VIP فاخر',
    badgeEn: 'VIP Luxury',
    description: 'تنسيق استثنائي من الورود الهولندية النادرة وأزهار الأوركيد البيضاء في فازة كريستال فاخرة تناسب القصور والمجالس.',
    descriptionEn: 'Showcase statement arrangement featuring imported white orchids, hydrangeas, and roses in heavy crystal vase.',
    flowerTypes: ['أوركيد أبيض', 'هايدرنجا', 'جوري عاجي'],
    inStock: true,
    featured: true
  },
  {
    id: 'wm-bride-04',
    name: 'مسكة عروس اللؤلؤ الطبيعي والبيوني الملكي',
    nameEn: 'Bridal Pearl & Peony Hand-Tied Bouquet',
    price: 490,
    originalPrice: 600,
    rating: 5.0,
    reviewsCount: 165,
    image: '/src/assets/images/hadaya_pink_peonies_1791216156090.jpg',
    category: 'ذكرى زواج',
    categoryEn: 'Wedding & Anniversary',
    badge: 'خاص بالعرائس',
    badgeEn: 'Bridal Couture',
    description: 'مسكة يد مصممة خصيصاً للعروس تجمع بين البيوني والورد الجوري العاجي ومطرزة بحبات اللؤلؤ الطبيعي وشريطة ساتان.',
    descriptionEn: 'Handcrafted couture bridal bouquet mingling fresh peonies and ivory roses bound with satin ribbon and freshwater pearls.',
    flowerTypes: ['بيوني وردي', 'جوري عاجي', 'لؤلؤ طبيعي'],
    inStock: true,
    featured: true
  }
];

// All combined products catalog (39 products matching Store Catalog & Theme)
export const PRODUCTS: Product[] = [
  ...FLAGSHIP_BOUQUETS,
  ...DISCOUNTED_BOUQUETS,
  ...NATURAL_BOUQUETS,
  ...CHOCOLATE_ROSES,
  ...CAKE_ROSES,
  ...COFFEE_SWEETS_ROSES,
  ...FLOWER_VASES,
  ...MAWAJEEB_PRODUCTS,
  ...NEWBORN_PRODUCTS,
  ...GRADUATION_PRODUCTS,
  ...LUXURY_SETS
];

// Addon options
export const ADDON_OPTIONS: AddonOption[] = [
  {
    id: 'addon-chocolate',
    name: 'شوكولاتة بلجيكية فاخرة (16 قطعة)',
    nameEn: 'Luxury Belgian Chocolates (16 pcs)',
    price: 85,
    image: 'https://cdn.salla.sa/form-builder/vXd8gFVPfRavCrvqEUF68BHdHHn8pqj3mMglFTIt.png'
  },
  {
    id: 'addon-vase',
    name: 'فازة زجاجية كريستال مضلعة',
    nameEn: 'Ribbed Crystal Glass Vase',
    price: 65,
    image: 'https://cdn.salla.sa/form-builder/vMIFvv8ErCIt8W4npNMOB0Oj6Secf5lLWWByluvd.png'
  },
  {
    id: 'addon-card-luxury',
    name: 'بطاقة إهداء فاخرة بختم الشمع والذهب',
    nameEn: 'Wax Sealed Gold Foil Greeting Card',
    price: 25,
    image: '/src/assets/images/hadaya_luxury_gift_noir_1791218956267.jpg'
  },
  {
    id: 'addon-balloon',
    name: 'بالون هيليوم ذهبي أنيق للمناسبات',
    nameEn: 'Elegant Golden Helium Celebration Balloon',
    price: 35,
    image: 'https://cdn.salla.sa/form-builder/nm5BDgkXRslZvqTetu5wTrCTTTTLTrsBhWwjHMyI.png'
  }
];

// FAQs
export const FAQS = [
  {
    q: 'كم يستغرق التوصيل داخل مكة المكرمة؟',
    qEn: 'How long does delivery take inside Mecca?',
    a: 'نوفر خدمة التوصيل السريع الفوري المبرد خلال ساعة واحدة فقط من إتمام الطلب، أو يمكنك تحديد التاريخ ووقت الاستلام الذي يناسبك مسبقاً بدقة.',
    aEn: 'We provide refrigerated express delivery within 1 hour from order placement, or you can pre-schedule your preferred exact date and time slot.'
  },
  {
    q: 'هل يمكنني إرسال الهدية دون كشف اسم المرسل؟',
    qEn: 'Can I send the gift anonymously without revealing my name?',
    a: 'نعم بكل تأكيد! نوفر خيار "إرسال كهدية مجهولة الهوية" في صفحة إتمام الطلب، حيث يتم إرسال الهدية دون الإفصاح عن بياناتك نهائياً للمستلم.',
    aEn: 'Yes absolutely! You can choose the anonymous sender option during checkout to ensure total sender confidentiality.'
  },
  {
    q: 'هل الزهور طبيعية وطازجة 100%؟',
    qEn: 'Are the flowers 100% natural and freshly picked?',
    a: 'نعم، نستورد زهورنا يومياً من أشهر المزارع العالمية في هولندا والإكوادور، ونحفظها في غرف تبريد متحكم بها حرارياً لضمان نضارتها لأطول فترة.',
    aEn: 'Yes, our flowers are imported daily from prime farms in Holland and Ecuador, preserved in temperature-controlled chambers.'
  },
  {
    q: 'ما هي طرق الدفع المتاحة في المتجر؟',
    qEn: 'What payment methods are available?',
    a: 'نقبل بطاقات مدى (Mada)، أبل باي (Apple Pay)، فيزا وماستركارد، تقسيط تابي وتمارا بدون أي فوائد، بالإضافة إلى الدفع عند الاستلام داخل مكة.',
    aEn: 'We accept Mada, Apple Pay, Visa, Mastercard, Tabby & Tamara interest-free installments, and Cash on Delivery in Mecca.'
  }
];

// Real Testimonials
export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    name: 'شوشو ستايل',
    city: 'مكة المكرمة - العزيزية',
    rating: 5,
    comment: 'عنجد تجربة فوق الرائعة! من أول ما فتت على المتجر، حسّيت بذوق واهتمام بكل تفصيل. تشكيلتهم كتير مميزة، وبتناسب كل المناسبات، التغليف فخم وراقي، والهدية وصلت مرتبة وكأنها طالعة من قصة 💝 والتوصيل كان سريع ودقيق متل الساعة.',
    commentEn: 'Truly a beyond-magnificent experience! Royal packaging, roses arrived pristine like a fairytale, and delivery was punctual like a clock.',
    verified: true,
    date: 'منذ يومين',
    avatar: 'https://cdn.assets.salla.network/prod/stores/themes/default/assets/images/avatar_female.png'
  },
  {
    id: 't-2',
    name: 'فايزة احمد',
    city: 'مكة المكرمة - الشوقية',
    rating: 5,
    comment: 'مرررة التغليف والورد وكل شي حرفيا كان بيرفكت ماشاءالله تبارك الله من جمال التنسيق سألوني عنه عشان اذا عندهم مناسبات فخمه يعتمدون هالمتجر وربي تبيضون وتجملون الله يعطيكم العافيه وبإذن الله بأعتمدكم في كل مناسباتي اللي في مكة 😍❤️',
    commentEn: 'Everything was literally perfect! The arrangement was so gorgeous that all my guests asked for the store link. Highly dependable in Mecca!',
    verified: true,
    date: 'منذ 3 أيام',
    avatar: 'https://cdn.assets.salla.network/prod/stores/themes/default/assets/images/avatar_female.png'
  },
  {
    id: 't-3',
    name: 'فيصل السلمي',
    city: 'مكة المكرمة - العوالي',
    rating: 5,
    comment: 'خدمة أكثر من رائعة وتجاوب سريع جداً عبر الواتساب. الأفضل في مكة بلا منازع وجودة الورد خيالية تبارك الله.',
    commentEn: 'More than wonderful service and prompt WhatsApp concierge assistance. Unmatched quality in Mecca.',
    verified: true,
    date: 'منذ أسبوع',
    avatar: 'https://cdn.assets.salla.network/prod/stores/themes/default/assets/images/avatar_male.png'
  },
  {
    id: 't-4',
    name: 'سعيد الزهراني',
    city: 'مكة المكرمة - النزهة',
    rating: 5,
    comment: 'سرعة الإنجاز وسرعة الرد على العميل وباقة الورد كانت فريش ورائحتها تملأ المكان.',
    commentEn: 'Swift execution, rapid customer service and the flowers were super fresh with captivating fragrance.',
    verified: true,
    date: 'منذ أسبوعين',
    avatar: 'https://cdn.assets.salla.network/prod/stores/themes/default/assets/images/avatar_male.png'
  }
];

// Articles
export const ARTICLES: Article[] = [
  {
    id: 'a-1',
    title: 'كيك مع ورد في مكة: أفكار إهداء تصنع الفرحة',
    titleEn: 'Cake with Flowers in Mecca: Gift Ideas Creating Pure Joy',
    category: 'كيك مع ورد في مكة',
    categoryEn: 'Cake & Flowers',
    readTime: '3 دقائق قراءة',
    image: 'https://cdn.files.salla.network/other/246985580/526058e5-3543-4d24-b93f-1ced5ca0d974-original.webp',
    summary: 'تعتبر هدية الكيك مع الورد في مكة من أجمل الهدايا التي تجمع بين المذاق اللذيذ والمظهر الأنيق للمناسبات وأعياد الميلاد.',
    summaryEn: 'Pairing fresh cakes with bouquets combines taste and aesthetic beauty for birthdays and weddings.'
  },
  {
    id: 'a-2',
    title: 'ورد مع قهوة وحلا في مكة: الضيافة الحجازية الأصيلة',
    titleEn: 'Flowers with Coffee & Sweets in Mecca: Authentic Hijazi Hospitality',
    category: 'ورد مع قهوة وحلا في مكة',
    categoryEn: 'Coffee & Sweets',
    readTime: '4 دقائق قراءة',
    image: 'https://cdn.files.salla.network/other/246985580/1b671cbc-3ffd-423d-97b8-f51660a118a4-original.webp',
    summary: 'عندما تبحث عن هدية تجمع بين الأصالة والذوق الرفيع، فإن الورد مع القهوة والحلا يقدم تجربة إهداء متكاملة تعبر عن التقدير.',
    summaryEn: 'A tasteful tribute blending Arabica coffee, artisan sweets, and fresh blooms.'
  },
  {
    id: 'a-3',
    title: 'ورد مع عصافير الحب في مكة: هدايا استثنائية غير تقليدية',
    titleEn: 'Flowers with Lovebirds in Mecca: Extraordinary Unique Gifts',
    category: 'ورد مع عصافير الحب في مكة',
    categoryEn: 'Lovebirds & Blooms',
    readTime: '4 دقائق قراءة',
    image: 'https://cdn.files.salla.network/other/246985580/a2442680-362e-405c-a209-13b09aa686b0-original.webp',
    summary: 'تجمع هذه الهدية بين جمال الورود الطبيعية وحيوية عصافير الحب لتترك ذكرى تدوم طويلاً لدى الشخص المهدى إليه.',
    summaryEn: 'Combining live lovebirds and natural roses creates an extraordinary emotional impact.'
  },
  {
    id: 'a-4',
    title: 'ورد مع أسماك الزينة في مكة: روح الطبيعة في تصميم فريد',
    titleEn: 'Flowers with Aquarium Fish in Mecca: Nature in Unique Harmony',
    category: 'ورد مع اسماك الزينة في مكة',
    categoryEn: 'Fish & Flowers',
    readTime: '5 دقائق قراءة',
    image: 'https://cdn.files.salla.network/other/246985580/4c4647a0-069b-4113-8525-4117a0ee5521-original.webp',
    summary: 'هدية مبتكرة تجمع بين هدوء الحياة المائية وأناقة باقات الزهور لتزيين المكاتب والبيوت الراقية.',
    summaryEn: 'A breathtaking novelty uniting aquatic tranquility with vivid floristry.'
  }
];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_OCCASIONS: OccasionReminder[] = [
  {
    id: 'occ-1',
    title: 'عيد ميلاد الوالدة الغالية',
    date: '2026-10-18',
    recipient: 'أم محمد',
    relationship: 'الأم'
  },
  {
    id: 'occ-2',
    title: 'ذكرى عقد القران',
    date: '2026-11-05',
    recipient: 'سارة',
    relationship: 'الزوجة'
  }
];

export const INITIAL_ADDRESSES: SavedAddress[] = [
  {
    id: 'addr-1',
    title: 'منزل العائلة - مكة',
    city: 'مكة المكرمة',
    district: 'حي العوالي',
    street: 'شارع إبراهيم الجفالي، بجوار مسجد الإحسان',
    recipientName: 'محمد الشهري',
    recipientPhone: '+966 50 123 4567',
    isDefault: true
  }
];
