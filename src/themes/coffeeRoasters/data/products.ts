import { Product, HonorBannerEvent, HonorTechnology, HeroSlide } from '../types';

import coffeePeopleLounge from '../assets/images/coffee_people_luxury_lounge_1791221150246.jpg';
import coffeeCremaFlow from '../assets/images/coffee_making_crema_flow_1791221127339.jpg';
import coffeeGrinderBanner from '../assets/images/coffee_grinder_mill_banner_1791218928342.jpg';
import coffeeMachineParts from '../assets/images/coffee_machine_parts_reveal_1791221110232.jpg';
import coffeeCraftStory from '../assets/images/coffee_machine_story_craft_1791221163767.jpg';

/**
 * Pack chrome for store-coffee only — IDs must match live Hostinger catalog.
 * Storefront rows always come from API; this pack never invents extra SKUs.
 */
export const CATEGORIES = [
  { id: 'all', name: 'Latest Product', nameAr: 'أحدث المنتجات' },
  { id: 'cabinets', name: 'Coffee Cabinets', nameAr: 'دواليب وأركان القهوة' },
];

const oakImg = '/images/ksa_almari_fluted_oak.png';
const marbleImg = '/images/hb_jeddah_blackgold_cut_1125.png';
const makkahImg = '/images/ksa_almari_makkah_corner.png';
const najdiImg = '/images/ksa_almari_najdi_heritage.png';
const villaImg = '/images/ksa_almari_dual_door_villa.png';

export const PRODUCTS: Product[] = [
  {
    id: 'hb-almari-fluted-oak',
    name: 'Riyadh Fluted Oak Coffee Almari',
    nameAr: 'دولاب قهوة بلوط محزّز للرياض',
    tagline: 'American oak · sintered stone top · concealed power track',
    taglineAr: 'بلوط أمريكي · سطح حجر مقاوم للحرارة · مسار كهرباء مخفي',
    category: 'cabinets',
    basePrice: 2890,
    originalPrice: 3290,
    badge: 'Riyadh Villa',
    reviewCount: 0,
    rating: 0,
    heroBanner: {
      headlineEn: 'Riyadh Fluted Oak Coffee Almari',
      headlineAr: 'دولاب قهوة بلوط محزّز للرياض',
      sloganEn: 'Villa-ready oak with stone top and hidden power',
      sloganAr: 'بلوط جاهز للفلل مع سطح حجري وكهرباء مخفية',
      badgeEn: 'RIYADH VILLA',
      badgeAr: 'فللا الرياض',
      bgGradient: 'from-[#1c1410] via-[#3b2a1a] to-[#0f0a06]',
      heroImage: oakImg,
      featuresEn: [
        'Fluted American oak carcass',
        'Sintered stone heat-safe top',
        'Concealed power track',
        'KSA delivery & assembly',
      ],
      featuresAr: [
        'هيكل بلوط أمريكي محزّز',
        'سطح حجر مقاوم للحرارة',
        'مسار كهرباء مخفي',
        'توصيل وتركيب داخل المملكة',
      ],
    },
    colors: [{ name: 'Fluted Oak', nameAr: 'بلوط محزّز', hex: '#8B6914', image: oakImg, priceDelta: 0 }],
    storageOptions: [],
    warranties: [
      { id: 'agency-2y', name: '2-Year KSA Furniture Warranty', nameAr: 'ضمان سنتين على الأثاث داخل المملكة', price: 0 },
    ],
    specs: [
      { label: 'Material', value: 'Fluted American oak + sintered stone', labelAr: 'الخامة', valueAr: 'بلوط أمريكي محزّز مع حجر مقاوم للحرارة' },
      { label: 'Fit', value: 'Riyadh villa coffee corner', labelAr: 'الملاءمة', valueAr: 'ركن قهوة لفلل الرياض' },
    ],
    images: [oakImg],
    overview:
      'Handcrafted fluted American oak coffee almari sized for Riyadh villas. Includes sintered stone worktop, soft-close drawers, espresso niche, and a concealed power track for machines and grinders.',
    overviewAr:
      'دولاب قهوة فاخر من خشب البلوط الأمريكي المحزّز مناسب لفلل الرياض. يشمل سطح حجر مقاوم للحرارة، أدراج إغلاق ناعم، ركن للإسبريسو، ومسار كهرباء مخفي للمكائن والمطاحن.',
  },
  {
    id: 'hb-almari-white-marble',
    name: 'Jeddah Black Gold Coffee Almari',
    nameAr: 'دولاب قهوة أسود وذهبي لجدة',
    tagline: 'Matte black · brushed-gold trim · dual storage doors',
    taglineAr: 'أسود مطفي · إطار ذهبي مصقول · بابان للتخزين',
    category: 'cabinets',
    basePrice: 2490,
    originalPrice: 2790,
    badge: 'Jeddah Modern',
    reviewCount: 0,
    rating: 0,
    heroBanner: {
      headlineEn: 'Jeddah Black Gold Coffee Almari',
      headlineAr: 'دولاب قهوة أسود وذهبي لجدة',
      sloganEn: 'Luxury black-and-gold almari for Jeddah apartments',
      sloganAr: 'دولاب فاخر أسود وذهبي لشقق جدة',
      badgeEn: 'JEDDAH MODERN',
      badgeAr: 'جدة الحديثة',
      bgGradient: 'from-[#1a1a1a] via-[#2c2418] to-[#0f0f0f]',
      heroImage: marbleImg,
      featuresEn: ['Matte black carcass', 'Brushed-gold trim', 'Soft-gold handles', 'Dual lower doors'],
      featuresAr: ['هيكل أسود مطفي', 'إطار ذهبي مصقول', 'مقابض ذهبية ناعمة', 'بابان سفليان'],
    },
    colors: [{ name: 'Black Gold', nameAr: 'أسود وذهبي', hex: '#1A1A1A', image: marbleImg, priceDelta: 0 }],
    storageOptions: [],
    warranties: [
      { id: 'agency-2y', name: '2-Year KSA Furniture Warranty', nameAr: 'ضمان سنتين على الأثاث داخل المملكة', price: 0 },
    ],
    specs: [
      { label: 'Finish', value: 'Matte black + brushed-gold trim', labelAr: 'التشطيب', valueAr: 'أسود مطفي مع إطار ذهبي مصقول' },
      { label: 'Fit', value: 'Jeddah apartment kitchens', labelAr: 'الملاءمة', valueAr: 'مطابخ شقق جدة' },
    ],
    images: [marbleImg],
    overview:
      'Luxury coffee almari for Jeddah apartments: matte black carcass, brushed-gold trim and handles, open machine niche, and dual lower doors for cups and accessories.',
    overviewAr:
      'دولاب قهوة فاخر يناسب شقق جدة: هيكل أسود مطفي، إطار ومقابض ذهبية مصقولة، ركن مفتوح للماكينة، وبابان سفليان للأكواب والمستلزمات.',
  },
  {
    id: 'hb-almari-makkah-corner',
    name: 'Makkah Compact Corner Coffee Almari',
    nameAr: 'ركن قهوة مدمج لمكة المكرمة',
    tagline: 'L-shaped · light walnut · cup hooks · cable tray',
    taglineAr: 'شكل حرف L · جوز فاتح · علاقات أكواب · مسار أسلاك',
    category: 'cabinets',
    basePrice: 1990,
    originalPrice: 2290,
    badge: 'Space Saver',
    reviewCount: 0,
    rating: 0,
    heroBanner: {
      headlineEn: 'Makkah Compact Corner Coffee Almari',
      headlineAr: 'ركن قهوة مدمج لمكة المكرمة',
      sloganEn: 'L-shaped space saver for Makkah homes',
      sloganAr: 'ركن بشكل حرف L لتوفير المساحة في منازل مكة',
      badgeEn: 'SPACE SAVER',
      badgeAr: 'موفر للمساحة',
      bgGradient: 'from-[#2a1f14] via-[#5c4030] to-[#1a120c]',
      heroImage: makkahImg,
      featuresEn: ['L-shaped footprint', 'Light walnut finish', 'Cup hooks', 'Hidden cable tray'],
      featuresAr: ['مساحة على شكل L', 'تشطيب جوز فاتح', 'علاقات أكواب', 'مسار أسلاك مخفي'],
    },
    colors: [{ name: 'Light Walnut', nameAr: 'جوز فاتح', hex: '#A67B5B', image: makkahImg, priceDelta: 0 }],
    storageOptions: [],
    warranties: [
      { id: 'agency-2y', name: '2-Year KSA Furniture Warranty', nameAr: 'ضمان سنتين على الأثاث داخل المملكة', price: 0 },
    ],
    specs: [
      { label: 'Shape', value: 'Compact L-corner', labelAr: 'الشكل', valueAr: 'ركن مدمج على شكل L' },
      { label: 'Fit', value: 'Makkah small homes', labelAr: 'الملاءمة', valueAr: 'منازل مكة ذات المساحات المحدودة' },
    ],
    images: [makkahImg],
    overview:
      'Space-saving L-shaped corner almari designed for Makkah homes. Light walnut finish, cup hooks, hidden cable tray, and a prep shelf sized for home espresso kits.',
    overviewAr:
      'ركن قهوة بشكل حرف L لتوفير المساحة في منازل مكة. تشطيب جوز فاتح، علاقات للأكواب، مسار أسلاك مخفي، ورف تحضير يناسب أطقم الإسبريسو المنزلية.',
  },
  {
    id: 'hb-almari-najdi-heritage',
    name: 'Najdi Heritage Walnut Coffee Station',
    nameAr: 'محطة قهوة تراثية نجدية من الجوز',
    tagline: 'Carved geometry · brass accents · camel-tone walnut',
    taglineAr: 'نقوش هندسية · لمسات نحاسية · جوز بدرجات ترابية',
    category: 'cabinets',
    basePrice: 3190,
    originalPrice: 3590,
    badge: 'Heritage',
    reviewCount: 0,
    rating: 0,
    heroBanner: {
      headlineEn: 'Najdi Heritage Walnut Coffee Station',
      headlineAr: 'محطة قهوة تراثية نجدية من الجوز',
      sloganEn: 'Carved geometry for the Saudi majlis',
      sloganAr: 'نقوش هندسية لمجالس المملكة',
      badgeEn: 'HERITAGE',
      badgeAr: 'تراث',
      bgGradient: 'from-[#3b2414] via-[#7a4a28] to-[#1f120a]',
      heroImage: najdiImg,
      featuresEn: ['Najdi carved panels', 'Brass accents', 'Camel-tone walnut', 'Majlis-ready layout'],
      featuresAr: ['ألواح نجدية منحوتة', 'لمسات نحاسية', 'جوز بدرجات ترابية', 'توزيع مناسب للمجالس'],
    },
    colors: [{ name: 'Camel Walnut', nameAr: 'جوز ترابي', hex: '#8B5A2B', image: najdiImg, priceDelta: 0 }],
    storageOptions: [],
    warranties: [
      { id: 'agency-2y', name: '2-Year KSA Furniture Warranty', nameAr: 'ضمان سنتين على الأثاث داخل المملكة', price: 0 },
    ],
    specs: [
      { label: 'Style', value: 'Najdi heritage modernized', labelAr: 'الطراز', valueAr: 'تراث نجدي بطابع معاصر' },
      { label: 'Fit', value: 'Saudi majlis corners', labelAr: 'الملاءمة', valueAr: 'أركان المجالس السعودية' },
    ],
    images: [najdiImg],
    overview:
      'Heritage-inspired Najdi coffee station in camel-tone walnut with carved geometric panels and brass accents. Open prep shelf and closed lower storage for beans and cups.',
    overviewAr:
      'محطة قهوة بطابع نجدي تراثي من خشب الجوز بدرجات ترابية مع ألواح هندسية منحوتة ولمسات نحاسية. رف مفتوح للتحضير ووحدة تخزين سفلية للبن والأكواب.',
  },
  {
    id: 'hb-almari-dual-door-villa',
    name: 'KSA Dual-Door Villa Coffee Almari',
    nameAr: 'دولاب قهوة فاخر ببابين للفلل',
    tagline: 'Smoked oak · black steel · glass upper doors',
    taglineAr: 'بلوط مدخّن · فولاذ أسود · أبواب علوية زجاجية',
    category: 'cabinets',
    basePrice: 3490,
    originalPrice: 3990,
    badge: 'Villa Flagship',
    reviewCount: 0,
    rating: 0,
    heroBanner: {
      headlineEn: 'KSA Dual-Door Villa Coffee Almari',
      headlineAr: 'دولاب قهوة فاخر ببابين للفلل',
      sloganEn: 'Smoked oak statement for open living kitchens',
      sloganAr: 'قطعة بلوط مدخّن للمطابخ المفتوحة',
      badgeEn: 'VILLA FLAGSHIP',
      badgeAr: 'إصدار الفلل',
      bgGradient: 'from-[#111111] via-[#2a2a2a] to-[#0a0a0a]',
      heroImage: villaImg,
      featuresEn: ['Smoked oak + black steel', 'Glass upper doors', 'Espresso niche', 'Soft-close cabinets'],
      featuresAr: ['بلوط مدخّن وفولاذ أسود', 'أبواب علوية زجاجية', 'ركن إسبريسو', 'خزائن بإغلاق ناعم'],
    },
    colors: [{ name: 'Smoked Oak', nameAr: 'بلوط مدخّن', hex: '#3F2A1C', image: villaImg, priceDelta: 0 }],
    storageOptions: [],
    warranties: [
      { id: 'agency-2y', name: '2-Year KSA Furniture Warranty', nameAr: 'ضمان سنتين على الأثاث داخل المملكة', price: 0 },
    ],
    specs: [
      { label: 'Doors', value: 'Dual glass upper + soft-close lower', labelAr: 'الأبواب', valueAr: 'علوية زجاجية مزدوجة وسفلية بإغلاق ناعم' },
      { label: 'Fit', value: 'KSA villa open kitchens', labelAr: 'الملاءمة', valueAr: 'مطابخ فلل المملكة المفتوحة' },
    ],
    images: [villaImg],
    overview:
      'Tall dual-door coffee almari for KSA villas: smoked oak with black steel frame, glass upper doors for cup display, espresso niche, and soft-close lower cabinets.',
    overviewAr:
      'دولاب قهوة طويل ببابين لفلل المملكة: بلوط مدخّن بإطار فولاذي أسود، أبواب علوية زجاجية لعرض الأكواب، ركن للإسبريسو، وخزائن سفلية بإغلاق ناعم.',
  },
];

export const HONOR_EVENTS: HonorBannerEvent[] = [
  {
    id: 'event-coffee-lounge-experience',
    title: 'The Arabian Coffee Ritual & Luxury Tasting',
    titleAr: 'طقوس وتذوق القهوة في المجالس الفاخرة',
    subtitle: 'Savor artisanal single-origin brews crafted by master baristas',
    subtitleAr: 'تجربة حية لتذوق أندر محاصيل البن المختص واستخلاص الإسبريسو الفاخر',
    image: coffeePeopleLounge,
  },
  {
    id: 'event-golden-crema-extraction',
    title: 'Velvety Golden Crema Flow & 58mm Dynamics',
    titleAr: 'استخلاص الإسبريسو وتدفق الكريمة الذهبية 58 مم',
    subtitle: 'Naked bottomless portafilter micro-laser extraction at 20-Bar pressure',
    subtitleAr: 'تدفق سلس ومتوازن للكريمة الذهبية عبر بورتافلتر مكشوف معزول حرارياً',
    image: coffeeCremaFlow,
  },
  {
    id: 'event-artisan-roastery',
    title: 'Artisan Single-Origin Roastery Partners',
    titleAr: 'شراكات المحامص السعودية الفاخرة للقهوة المختصة',
    subtitle: 'Curated Ethiopian, Colombian, and Saudi Khawlani Special Reserves',
    subtitleAr: 'أندر محاصيل القهوة المختصة الإثيوبية والكولومبية والخولانية الفاخرة',
    image: coffeeGrinderBanner,
  },
];

export const HONOR_TECHNOLOGY: HonorTechnology[] = [
  {
    id: 'tech-parts-reveal-engineering',
    title: 'Exploded Technical Architecture & Dual Brass Boilers',
    titleAr: 'الهندسة الداخلية وتفكيك دبل بويلر النحاسي',
    subtitle: 'Independent electronic heating blocks guarantee consistent brew & steam temperature',
    subtitleAr: 'نظام دبل بويلر نحاسي منفصل مع مضخة 20 بار إيطالية وشريحة PID ذكية',
    image: coffeeMachineParts,
  },
  {
    id: 'tech-master-craftsmanship-story',
    title: 'Master Artisan Calibration & Hand-Polished Finishing',
    titleAr: 'حرفية التصنيع وقصة الماكينة المتوارثة',
    subtitle: 'Hand-assembled stainless steel chassis with natural walnut hardwood controls',
    subtitleAr: 'معايرة يدوية دقيقة لكل صمام وضغط مع لمسات خشب الجوز الطبيعي الفاخر',
    image: coffeeCraftStory,
  },
  {
    id: 'tech-golden-crema-flow',
    title: 'Commercial 58mm Naked Boltfilter Flow Dynamics',
    titleAr: 'ديناميكية تدفق الكريمة بالبورتافلتر المكشوف مقاس 58 ملم',
    subtitle: 'Precision micro-laser perforated baskets ensure uniform resistance & no channeling',
    subtitleAr: 'باسكت ليزري دقيق الفتحات يوزع ضغط الماء بالتساوي لمنع القنوات المائية',
    image: coffeeCremaFlow,
  },
];

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-almari-oak',
    title: 'Riyadh Fluted Oak Coffee Almari',
    titleAr: 'دولاب قهوة بلوط محزّز للرياض',
    subtitle: 'American oak · sintered stone · concealed power',
    subtitleAr: 'بلوط أمريكي · حجر مقاوم للحرارة · كهرباء مخفية',
    image: oakImg,
    productId: 'hb-almari-fluted-oak',
  },
  {
    id: 'slide-almari-najdi',
    title: 'Najdi Heritage Walnut Coffee Station',
    titleAr: 'محطة قهوة تراثية نجدية من الجوز',
    subtitle: 'Carved geometry · brass · majlis ready',
    subtitleAr: 'نقوش هندسية · نحاس · جاهز للمجالس',
    image: najdiImg,
    productId: 'hb-almari-najdi-heritage',
  },
  {
    id: 'slide-almari-villa',
    title: 'KSA Dual-Door Villa Coffee Almari',
    titleAr: 'دولاب قهوة فاخر ببابين للفلل',
    subtitle: 'Smoked oak · glass doors · espresso niche',
    subtitleAr: 'بلوط مدخّن · أبواب زجاجية · ركن إسبريسو',
    image: villaImg,
    productId: 'hb-almari-dual-door-villa',
  },
];
