import { Product, HonorBannerEvent, HonorTechnology, HeroSlide } from '../types';

import coffeePeopleLounge from '../assets/images/coffee_people_luxury_lounge_1791221150246.jpg';
import coffeeCremaFlow from '../assets/images/coffee_making_crema_flow_1791221127339.jpg';
import coffeeGrinderBanner from '../assets/images/coffee_grinder_mill_banner_1791218928342.jpg';
import coffeeMachineParts from '../assets/images/coffee_machine_parts_reveal_1791221110232.jpg';
import coffeeCraftStory from '../assets/images/coffee_machine_story_craft_1791221163767.jpg';

export const CATEGORIES = [
  { id: 'all', name: 'Latest Product', nameAr: 'أحدث المنتجات' },
  { id: 'machines', name: 'Coffee Machines', nameAr: 'مكائن القهوة' },
  { id: 'mills', name: 'Coffee Mills', nameAr: 'مطاحن القهوة' },
  { id: 'cabinets', name: 'Coffee Cabinets', nameAr: 'دواليب وأركان القهوة' },
  { id: 'accessories', name: 'Barista Accessories', nameAr: 'المستلزمات والأكواب' },
  { id: 'offers', name: 'Special Offers', nameAr: 'العروض الخاصة' },
];

export const PRODUCTS: Product[] = [
  // 1. Dual-Boiler 20-Bar Barista Pro Espresso Machine (HiBrew Barista Pro H7A)
  {
    id: 'hb-h10a-dualboiler',
    name: 'HiBrew Barista Pro H7A Dual-Boiler 20-Bar',
    nameAr: 'ماكينة قهوة بارستا برو هايبرو H7A دبل بويلر 20 بار',
    tagline: 'Dual Independent PID Thermoblock · 20-Bar Italian ULKA · 58mm Commercial Group · Microfoam Steam',
    taglineAr: 'نظام دبل بويلر بتحكم حراري رقمي · مضخة إيطالية 20 بار · مقياس ضغط عالي الدقة · بورتافلتر تجاري 58مم',
    category: 'machines',
    basePrice: 1899,
    originalPrice: 2299,
    badge: 'Flagship Barista Pro',
    specComparisonImage: '/src/assets/images/hibrew_specs_comparison_infographic.png',
    reviewCount: 384,
    rating: 4.96,
    heroBanner: {
      headlineEn: 'HiBrew Barista Pro H7A 20-Bar',
      headlineAr: 'ماكينة قهوة بارستا برو هايبرو H7A دبل بويلر 20 بار',
      sloganEn: 'PID DUAL BOILER | Commercial Extraction In One Touch',
      sloganAr: 'دبل بويلر ذكي | استخلاص تجاري بلمسة واحدة',
      badgeEn: 'OFFICIAL KSA FLAGSHIP',
      badgeAr: 'الإصدار الرائد الرسمي بالمملكة',
      bgGradient: 'from-[#061838] via-[#092558] to-[#030d22]',
      heroImage: './src/assets/images/hibrew_h7a_flagship_machine.png',
      featuresEn: [
        '20-Bar Italian ULKA Dual Pump',
        'Dual PID Independent Thermoblocks',
        '58.4mm Commercial Brass Group',
        '2-Year Official Agency Warranty'
      ],
      featuresAr: [
        'مضخة إيطالية مزدوجة 20 بار',
        'دبل بويلر PID مستقل تماماً',
        'مقبس تجاري 58.4 ملم',
        'ضمان سنتين شامل الوكيل المعتمد'
      ]
    },
    colors: [
      {
        name: 'Brushed Steel',
        nameAr: 'ستانلس ستيل مصقول',
        hex: '#D1D5DB',
        image: './src/assets/images/hibrew_h7a_flagship_machine.png',
        priceDelta: 0
      },
      {
        name: 'Matte Obsidian',
        nameAr: 'أسود مطفي ملوكي',
        hex: '#18181B',
        image: './src/assets/images/product_machine_compact_black.png',
        priceDelta: 100
      },
      {
        name: 'Silver Chrome Pro',
        nameAr: 'فضي كروم احترافي',
        hex: '#9CA3AF',
        image: './src/assets/images/flagship_coffee_machine_5th.png',
        priceDelta: 200
      },
      {
        name: 'Classic Vintage',
        nameAr: 'كلاسيك فينتج فضي',
        hex: '#4B5563',
        image: './src/assets/images/product_machine_silver_pro.png',
        priceDelta: 50
      },
      {
        name: 'Royal Heritage Bronze',
        nameAr: 'إصدار التراث الفاخر',
        hex: '#8C6239',
        image: './src/assets/images/product_machine_delonghi_black.png',
        priceDelta: 250
      }
    ],
    storageOptions: [
      {
        capacity: 'Standard 58mm Kit',
        capacityAr: 'طقم بورتفلتر 58 مم القياسي',
        ram: 'Single & Double Baskets',
        ramAr: 'باسكت مفرد ومزدوج احترافي',
        priceDelta: 0
      },
      {
        capacity: 'Master Barista Edition',
        capacityAr: 'إصدار ماستر باريستا الشامل',
        ram: 'Includes Naked Boltfilter + Mill',
        ramAr: 'يشمل بورتافلتر مكشوف + مطحنة بن',
        priceDelta: 599
      }
    ],
    warranties: [
      { id: 'agency-2y', name: 'Official 2-Year KSA Agency Warranty & Pump Coverage', nameAr: 'ضمان سنتين شامل المضخة وصيانة الوكيل المعتمد بالسعودية', price: 0 },
      { id: 'vip-care-3y', name: 'HiBrew Care+ 3-Year Extended Replacement Guarantee', nameAr: 'رعاية هاي برو كير+ 3 سنوات استبدال فوري وضمان شامل', price: 199 }
    ],
    bundles: [
      {
        id: 'bundle-mill-g5',
        name: 'HiBrew G5 Conical Burr Coffee Mill',
        nameAr: 'مطحنة بن هاي برو G5 بتروس مخروطية',
        price: 389,
        originalPrice: 599,
        image: './src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg'
      },
      {
        id: 'bundle-boltfilter',
        name: '58mm Naked Walnut Boltfilter',
        nameAr: 'بورتافلتر مكشوف 58مم خشب الجوز',
        price: 119,
        originalPrice: 189,
        image: './src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg'
      }
    ],
    specs: [
      { label: 'Pump Pressure', value: '20-Bar Italian ULKA Dual Pump', labelAr: 'قوة الضغط', valueAr: 'مضخة إيطالية مزدوجة بقوة 20 بار ULKA' },
      { label: 'Boiler System', value: 'Dual Thermoblock PID Heating (Brew & Steam simultaneously)', labelAr: 'نظام التسخين', valueAr: 'دبل بويلر PID مستقل للاستخلاص والتبخير في نفس الوقت' },
      { label: 'Portafilter', value: '58mm Commercial Stainless Steel Grouphead', labelAr: 'البورتافلتر', valueAr: 'مقبس تجاري 58 ملم متوافق مع كافة مكائن المقاهي المختصة' },
      { label: 'Water Reservoir', value: '2.5L Removable BPA-Free Reservoir', labelAr: 'خزان المياه', valueAr: 'سعة 2.5 لتر كبير قابل للإزالة' },
      { label: 'Steam Wand', value: 'Cool-Touch Commercial 3-Hole Microfoam Wand', labelAr: 'عصا التبخير', valueAr: 'ستانلس تجاري 3 فتحات لتبخير حليب مخملي للاتيه آرت' },
      { label: 'Pre-Infusion', value: 'Adjustable Low-Pressure Pre-Infusion (1-10s)', labelAr: 'الترطيب المسبق', valueAr: 'نظام ترطيب مسبق قابل للضبط لمنع قنوات التدفق' }
    ],
    images: [
      './src/assets/images/hibrew_h7a_flagship_machine.png',
      './src/assets/images/flagship_coffee_machine_5th.png',
      './src/assets/images/product_machine_silver_pro.png',
      './src/assets/images/product_machine_compact_black.png'
    ],
    overview: 'Engineered for dedicated coffee connoisseurs: the HiBrew Barista Pro H7A delivers commercial café performance directly to your home. Features dual independent PID thermoblocks that extract thick golden espresso at calibrated 92-94°C while generating continuous dry microfoam steam simultaneously with authentic 20-bar Italian pressure.',
    overviewAr: 'ماكينة القهوة الأكثر طلباً في السعودية بارستا برو H7A من هاي برو. تجمع بين قوة الاستخلاص التجاري بنظام دبل بويلر مستقل يتيح تحضير الإسبريسو بالحرارة المضبوطة وتبخير الحليب المخملي في نفس اللحظة بضغط 20 بار إيطالي حقيقي ومقياس ضغط عقارب وبورتافلتر مقاس 58 ملم مطابق لمكائن المقاهي المختصة.',
    partsShowcase: [
      {
        id: 'part-dual-boiler-pid',
        tagEn: 'DUAL THERMOBLOCK PID',
        tagAr: 'نظام دبل بويلر المستقل',
        titleEn: 'Dual PID Independent Thermoblocks & 20-Bar ULKA Pump',
        titleAr: 'هندسة الدبل بويلر المستقل واستخلاص متزامن 20 بار',
        descriptionEn: 'Two independent electronic thermoblocks controlled by smart PID chips. Extract rich golden espresso and steam silky milk microfoam at the same time without temperature drops or wait time.',
        descriptionAr: 'وحدتا تسخين إلكترونيتان مستقلتان تعملان بتقنية PID الذكية؛ وحدة للاستخلاص عند حرارة 92°-94° مئوية، ووحدة مستقلة للتبخير الفوري عند 130° مئوية في آن واحد دون انخفاض في الضغط.',
        image: './src/assets/images/hibrew_barista_pro_exploded_parts_1791364960592.jpg',
        stats: [
          { labelEn: 'Pump Pressure', labelAr: 'قوة الضغط', value: '20-Bar ULKA' },
          { labelEn: 'Heating Units', labelAr: 'وحدات التسخين', value: 'Dual PID' },
          { labelEn: 'Temp Stability', labelAr: 'ثبات الحرارة', value: '±0.5°C' }
        ]
      },
      {
        id: 'part-commercial-grouphead',
        tagEn: 'MACHINE IN-USE · GOLDEN EXTRACTION',
        tagAr: 'الماكينة أثناء الاستخدام · تدفق الكريمة الذهبية',
        titleEn: 'Commercial 58.4mm Brass Grouphead & Velvet Crema Flow',
        titleAr: 'استخلاص حقيقي بمقبس تجاري 58 ملم وتدفق الكريمة المخملية',
        descriptionEn: 'Watch the thick golden espresso flow steadily at the 9-bar sweet spot. Low-pressure pre-infusion saturates the coffee puck uniformly, delivering zero channeling and café-grade body.',
        descriptionAr: 'شاهد تدفق الإسبريسو الذهبي الثخين عند ضغط 9-12 بار المثالي. يقوم نظام الترطيب المسبق بتشبيع البن تدريجياً لضمان استخلاص متجانس بدون أي قنوات مائية.',
        image: './src/assets/images/coffee_making_crema_flow_1791221127339.jpg',
        stats: [
          { labelEn: 'Portafilter Size', labelAr: 'مقاس البورتافلتر', value: '58.4mm' },
          { labelEn: 'Pre-Infusion', labelAr: 'الترطيب المسبق', value: '1-10s' },
          { labelEn: 'Crema Texture', labelAr: 'قوام الكريمة', value: 'Dense Microfoam' }
        ]
      },
      {
        id: 'part-pressure-gauge',
        tagEn: 'ANALOG BARISTA GAUGE',
        tagAr: 'مقياس ضغط الباريستا التناظري',
        titleEn: 'Real-Time Visual Barista Pressure Gauge Dial',
        titleAr: 'مقياس ضغط استخلاص حقيقي لمراقبة تدفق القهوة لحظياً',
        descriptionEn: 'Vintage analog pressure meter monitoring real extraction resistance between 9 and 15 bar in real-time, helping you dial in your grind size with laboratory precision.',
        descriptionAr: 'مؤشر عقارب كلاسيكي أنيق يعرض ضغط الاستخلاص الفعلي لحظة بلحظة؛ يمنحك رؤية فورية لمنطقة الاستخلاص الذهبي بين 9 و 12 بار للتأكد من تناسق طحنة البن وثبات النكهة في كل فنجان.',
        image: './src/assets/images/hibrew_barista_pro_details_showcase_1791364980884.jpg',
        stats: [
          { labelEn: 'Optimal Zone', labelAr: 'المنطقة الذهبية', value: '9 – 12 Bar' },
          { labelEn: 'Max Pressure', labelAr: 'الضغط الأقصى', value: '20 Bar' },
          { labelEn: 'Gauge Material', labelAr: 'خامة المؤشر', value: 'Polished Brass' }
        ]
      },
      {
        id: 'part-microfoam-steam',
        tagEn: 'MACHINE IN-USE · MILK STEAMING',
        tagAr: 'الماكينة أثناء الاستخدام · تبخير الحليب المخملي',
        titleEn: '3-Hole Commercial Cool-Touch Microfoam Steam Wand',
        titleAr: 'عصا تبخير تجارية 3 فتحات لتبخير حليب ميكروفوم ورسم اللاتيه آرت',
        descriptionEn: 'Dry 135°C steam injected through 3 laser-calibrated holes creates dense, silky microfoam in under 20 seconds. Perfect vortex swirl enables effortless latte art rosettas and swans.',
        descriptionAr: 'بخار جاف قوي عند 135° مئوية عبر 3 فتحات ليزرية دقيقة يحول الحليب إلى رغوة ميكروفوم حريرية لامعة خلال أقل من 20 ثانية، مما يمكنك من رسم أبدع تصاميم اللاتيه آرت بسهولة.',
        image: './src/assets/images/barista_milk_steaming_1791363367164.jpg',
        stats: [
          { labelEn: 'Steam Nozzle', labelAr: 'فتحات التبخير', value: '3-Hole Precision' },
          { labelEn: 'Steam Temp', labelAr: 'حرارة البخار', value: '135°C Dry' },
          { labelEn: 'Handle Grip', labelAr: 'مقبض الأمان', value: 'Cool-Touch Silicon' }
        ]
      },
      {
        id: 'part-craftsmanship-warranty',
        tagEn: '2-YEAR KSA AGENCY WARRANTY',
        tagAr: 'ضمان الوكيل المعتمد سنتين بالسعودية',
        titleEn: 'Hand-Polished 304 Stainless Chassis & Authorized KSA Warranty',
        titleAr: 'هيكل ستانلس ستيل 304 فاخر وضمان شامل سنتين بالمملكة',
        descriptionEn: 'Constructed from heavy gauge 304 food-grade stainless steel with luxury walnut hardwood accents, backed by 2-year authorized agency warranty and immediate spare parts in KSA.',
        descriptionAr: 'هيكل معدني متين من الفولاذ المقاوم للصدأ 304 مع لمسات خشب الجوز الطبيعي وخزان مياه 2.5 لتر كبير، مدعوم بضمان الوكيل المعتمد في المملكة لمدة سنتين مع توفر كامل قطع الغيار والصيانة.',
        image: './src/assets/images/coffee_machine_story_craft_1791221163767.jpg',
        stats: [
          { labelEn: 'Agency Warranty', labelAr: 'ضمان الوكيل', value: '2 Years Full' },
          { labelEn: 'Water Tank', labelAr: 'سعة الخزان', value: '2.5L BPA-Free' },
          { labelEn: 'Chassis Material', labelAr: 'خامة الهيكل', value: '304 Solid Steel' }
        ]
      }
    ]
  },

  // 1.1 HiBrew Barista Classic Pro 20-Bar (Silver PNG)
  {
    id: 'hb-barista-silver-pro',
    name: 'HiBrew Barista Classic Pro 20-Bar',
    nameAr: 'ماكينة هايبرو بارستا كلاسيك 20 بار',
    tagline: 'Dual Thermoblock · 58mm Portafilter · Italian ULKA Dual Pump',
    taglineAr: 'استخلاص احترافي بضغط 20 بار وبورتافلتر 58مم مع مقياس ضغط عقارب',
    category: 'machines',
    basePrice: 1499,
    originalPrice: 1899,
    badge: 'Bestseller Pro',
    specComparisonImage: '/src/assets/images/hibrew_specs_comparison_infographic.png',
    reviewCount: 248,
    rating: 4.95,
    colors: [
      {
        name: 'Brushed Silver',
        nameAr: 'ستانلس ستيل مصقول',
        hex: '#E5E7EB',
        image: './src/assets/images/product_machine_silver_pro.png'
      }
    ],
    storageOptions: [
      { capacity: 'Standard 58mm Kit', ram: 'Includes Double Filter Basket', priceDelta: 0 },
      { capacity: 'Pro Barista Edition', ram: 'Includes Precision Tamper & Pitcher', priceDelta: 199 }
    ],
    warranties: [
      { id: 'agency-2y', name: 'Official 2-Year KSA Agency Warranty', nameAr: 'ضمان سنتين شامل الوكيل المعتمد بالسعودية', price: 0 }
    ],
    specs: [
      { label: 'Pump Pressure', value: '20-Bar Italian ULKA Pump', labelAr: 'قوة الضغط', valueAr: 'مضخة إيطالية 20 بار' },
      { label: 'Grouphead', value: '58mm Commercial Stainless', labelAr: 'البورتافلتر', valueAr: 'مقبس تجاري 58 ملم' },
      { label: 'Heating', value: 'Rapid Thermoblock PID', labelAr: 'نظام التسخين', valueAr: 'ثيرموبلوك سريع مع تحكم PID' }
    ],
    images: ['./src/assets/images/product_machine_silver_pro.png'],
    overview: 'HiBrew Barista Classic Pro brings cafe quality to your home with 20-bar Italian pump pressure and commercial 58mm grouphead.',
    overviewAr: 'ماكينة هايبرو بارستا كلاسيك برو تجمع بين فخامة الستانلس ستيل وضغط 20 بار فائق الدقة مع مقبض تجاري 58 ملم.'
  },

  // 1.2 HiBrew Compact Smart Capsule & Espresso (Compact Black PNG)
  {
    id: 'hb-smart-capsule-compact',
    name: 'HiBrew Compact Smart Capsule & Espresso',
    nameAr: 'ماكينة هايبرو سمارت المدمجة للكبسولات والإسبريسو',
    tagline: '19-Bar Pressure · Rapid 25s Heating · Multi-Capsule Adapter',
    taglineAr: 'ضغط 19 بار وتسخين سريع في 25 ثانية مع محولات متعددة لكافة الكبسولات',
    category: 'machines',
    basePrice: 399,
    originalPrice: 549,
    badge: 'Compact Smart',
    specComparisonImage: '/src/assets/images/hibrew_specs_comparison_infographic.png',
    reviewCount: 312,
    rating: 4.91,
    colors: [
      {
        name: 'Matte Obsidian',
        nameAr: 'أسود مطفي ملوكي',
        hex: '#18181B',
        image: './src/assets/images/product_machine_compact_black.png'
      }
    ],
    storageOptions: [
      { capacity: 'Standard Trio Adapter', ram: 'Nespresso, Dolce Gusto & Ground Coffee', priceDelta: 0 }
    ],
    warranties: [
      { id: 'agency-2y', name: 'Official 2-Year KSA Agency Warranty', nameAr: 'ضمان سنتين شامل الوكيل المعتمد بالسعودية', price: 0 }
    ],
    specs: [
      { label: 'Pressure', value: '19-Bar High Pressure Extraction', labelAr: 'الضغط', valueAr: 'استخلاص فائق بقوة 19 بار' },
      { label: 'Warmup', value: 'Instant 25-Second Rapid Thermoblock', labelAr: 'سرعة التسخين', valueAr: 'جاهزة للتحضير خلال 25 ثانية' },
      { label: 'Reservoir', value: '0.8L Removable Transparent Tank', labelAr: 'سعة الخزان', valueAr: 'خزان شفاف سعة 800 مل' }
    ],
    images: ['./src/assets/images/product_machine_compact_black.png'],
    overview: 'Compact, versatile and fast. The HiBrew Compact Smart machine handles multiple capsule formats as well as fresh ground espresso.',
    overviewAr: 'تصميم أنيق ومدمج يناسب أي مساحة، يدعم كبسولات نسبريسو ودولتشي غوستو والبن المطحون بضغطة زر واحدة.'
  },

  // 1.3 HiBrew Digital Thermal Drip Brewer (Drip Carafe PNG)
  {
    id: 'hb-thermal-drip-brewer',
    name: 'HiBrew Digital Thermal Drip Brewer',
    nameAr: 'ماكينة هايبرو الرقمية لتقطير القهوة مع إبريق زجاجي',
    tagline: 'Touch LED Display · 1.5L Carafe · Smart Keep-Warm Plate',
    taglineAr: 'شاشة لمس رقمية مع إبريق زجاجي 1.5 لتر وقاعدة تسخين ذكية',
    category: 'machines',
    basePrice: 299,
    originalPrice: 420,
    badge: 'Touch Drip Maker',
    reviewCount: 198,
    rating: 4.89,
    colors: [
      {
        name: 'Piano Gloss Black',
        nameAr: 'أسود بيانو فاخر',
        hex: '#111827',
        image: './src/assets/images/product_machine_drip_carafe.png'
      }
    ],
    storageOptions: [
      { capacity: '1.5L Glass Carafe Edition', ram: 'Up to 12 Cups per Brew', priceDelta: 0 }
    ],
    warranties: [
      { id: 'agency-2y', name: 'Official 2-Year KSA Agency Warranty', nameAr: 'ضمان سنتين شامل الوكيل المعتمد بالسعودية', price: 0 }
    ],
    specs: [
      { label: 'Carafe Capacity', value: '1.5 Liters (10-12 Cups)', labelAr: 'سعة الإبريق', valueAr: '1.5 لتر تكفي 10-12 كوب' },
      { label: 'Controls', value: 'Digital Touch LED Interface', labelAr: 'التحكم', valueAr: 'شاشة رقمية تعمل باللمس' },
      { label: 'Keep Warm', value: '2-Hour Auto Warming Plate', labelAr: 'حفظ الحرارة', valueAr: 'قاعدة تسخين تلقائية لمدة ساعتين' }
    ],
    images: ['./src/assets/images/product_machine_drip_carafe.png'],
    overview: 'Brew rich, aromatic drip coffee effortlessly for family and gatherings with precision temperature control and intuitive digital touch timer.',
    overviewAr: 'ماكينة التقطير الرقمية الذكية من هايبرو، تحضر القهوة المقطرة بأعلى معايير التوازن الحراري وتحافظ عليها دافئة وطازجة.'
  },

  // 1.4 HiBrew Classic Duo 15-Bar Espresso Maker (DeLonghi Style PNG)
  {
    id: 'hb-classic-duo-espresso',
    name: 'HiBrew Classic Duo 15-Bar Espresso Maker',
    nameAr: 'ماكينة هايبرو كلاسيك ديو 15 بار بمخرجين',
    tagline: 'Dual-Cup Extraction · Stainless Steel Boiler · High-Steam Wand',
    taglineAr: 'استخلاص متزامن لكوبين مع عصا تبخير للحليب المخملي وضمان سنتين',
    category: 'machines',
    basePrice: 649,
    originalPrice: 850,
    badge: 'Classic Dual Cup',
    reviewCount: 275,
    rating: 4.93,
    colors: [
      {
        name: 'Charcoal Black',
        nameAr: 'أسود كربوني مع ستيل',
        hex: '#27272A',
        image: './src/assets/images/product_machine_delonghi_black.png'
      }
    ],
    storageOptions: [
      {
        capacity: 'Dual Cup Barista Kit',
        capacityAr: 'طقم باريستا بمخرجين للكوبين',
        ram: 'Includes 2 Stainless Steel Cups',
        ramAr: 'يشمل كوبين ستانلس ستيل فاخرين',
        priceDelta: 0
      }
    ],
    warranties: [
      { id: 'agency-2y', name: 'Official 2-Year KSA Agency Warranty', nameAr: 'ضمان سنتين شامل الوكيل المعتمد بالسعودية', price: 0 }
    ],
    specs: [
      { label: 'Boiler', value: 'Heavy Duty Stainless Steel Boiler', labelAr: 'الغلاية', valueAr: 'غلاية متينة من الستانلس ستيل' },
      { label: 'Dual Spout', value: 'Simultaneous 2-Cup Portafilter Spout', labelAr: 'مخرج مزدوج', valueAr: 'مخرج مزدوج لصب كوبين معاً' },
      { label: 'Steam Wand', value: 'Swivel Frothing Wand for Cappuccino', labelAr: 'التبخير', valueAr: 'عصا متحركة لتبخير الكابتشينو واللاتيه' }
    ],
    images: ['./src/assets/images/product_machine_delonghi_black.png'],
    overview: 'Classic retro espresso machine built for everyday reliability with dual cup extraction, stainless steel cup warmer, and high-performance steam wand.',
    overviewAr: 'الماكينة الكلاسيكية المحبوبة لتحضير الإسبريسو الإيطالي الأصيل مع مخرجين للصب وتبخير ممتاز للحليب ورغوة الكابتشينو.'
  },

];

export const HONOR_EVENTS: HonorBannerEvent[] = [
  {
    id: 'event-coffee-lounge-experience',
    title: 'The Arabian Coffee Ritual & Luxury Tasting',
    titleAr: 'طقوس وتذوق القهوة في المجالس الفاخرة',
    subtitle: 'Savor artisanal single-origin brews crafted by master baristas',
    subtitleAr: 'تجربة حية لتذوق أندر محاصيل البن المختص واستخلاص الإسبريسو الفاخر',
    image: coffeePeopleLounge
  },
  {
    id: 'event-golden-crema-extraction',
    title: 'Velvety Golden Crema Flow & 58mm Dynamics',
    titleAr: 'استخلاص الإسبريسو وتدفق الكريمة الذهبية 58 مم',
    subtitle: 'Naked bottomless portafilter micro-laser extraction at 20-Bar pressure',
    subtitleAr: 'تدفق سلس ومتوازن للكريمة الذهبية عبر بورتافلتر مكشوف معزول حرارياً',
    image: coffeeCremaFlow
  },
  {
    id: 'event-artisan-roastery',
    title: 'Artisan Single-Origin Roastery Partners',
    titleAr: 'شراكات المحامص السعودية الفاخرة للقهوة المختصة',
    subtitle: 'Curated Ethiopian, Colombian, and Saudi Khawlani Special Reserves',
    subtitleAr: 'أندر محاصيل القهوة المختصة الإثيوبية والكولومبية والخولانية الفاخرة',
    image: coffeeGrinderBanner
  }
];

export const HONOR_TECHNOLOGY: HonorTechnology[] = [
  {
    id: 'tech-parts-reveal-engineering',
    title: 'Exploded Technical Architecture & Dual Brass Boilers',
    titleAr: 'الهندسة الداخلية وتفكيك دبل بويلر النحاسي',
    subtitle: 'Independent electronic heating blocks guarantee consistent brew & steam temperature',
    subtitleAr: 'نظام دبل بويلر نحاسي منفصل مع مضخة 20 بار إيطالية وشريحة PID ذكية',
    image: coffeeMachineParts
  },
  {
    id: 'tech-master-craftsmanship-story',
    title: 'Master Artisan Calibration & Hand-Polished Finishing',
    titleAr: 'حرفية التصنيع وقصة الماكينة المتوارثة',
    subtitle: 'Hand-assembled stainless steel chassis with natural walnut hardwood controls',
    subtitleAr: 'معايرة يدوية دقيقة لكل صمام وضغط مع لمسات خشب الجوز الطبيعي الفاخر',
    image: coffeeCraftStory
  },
  {
    id: 'tech-golden-crema-flow',
    title: 'Commercial 58mm Naked Boltfilter Flow Dynamics',
    titleAr: 'ديناميكية تدفق الكريمة بالبورتافلتر المكشوف مقاس 58 ملم',
    subtitle: 'Precision micro-laser perforated baskets ensure uniform resistance & no channeling',
    subtitleAr: 'باسكت ليزري دقيق الفتحات يوزع ضغط الماء بالتساوي لمنع القنوات المائية',
    image: coffeeCremaFlow
  }
];

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-coffee-dual-boiler',
    title: 'HiBrew Dual-Boiler 20-Bar Barista Pro',
    titleAr: 'هاي برو دبل بويلر 20 بار الاحترافية',
    subtitle: 'Dual PID Thermoblock · 58mm Commercial Group · Golden Crema',
    subtitleAr: 'دبل بويلر واستخلاص إيطالي فاخر وبورتافلتر 58مم',
    image: './src/assets/images/hibrew_h7a_flagship_machine.png',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-being-poured-into-a-cup-from-a-coffee-machine-42861-large.mp4',
    productId: 'hb-h10a-dualboiler'
  },
  {
    id: 'slide-coffee-silver-pro',
    title: 'HiBrew Barista Classic Pro 20-Bar',
    titleAr: 'ماكينة هايبرو بارستا كلاسيك 20 بار',
    subtitle: 'Dual Thermoblock · 58mm Portafilter · Italian ULKA Dual Pump',
    subtitleAr: 'استخلاص احترافي بضغط 20 بار وبورتافلتر 58مم مع مقياس ضغط عقارب',
    image: './src/assets/images/product_machine_silver_pro.png',
    productId: 'hb-barista-silver-pro'
  },
  {
    id: 'slide-coffee-compact-smart',
    title: 'HiBrew Compact Smart Capsule & Espresso',
    titleAr: 'ماكينة هايبرو سمارت المدمجة للكبسولات والإسبريسو',
    subtitle: '19-Bar Pressure · Rapid 25s Heating · Multi-Capsule Adapter',
    subtitleAr: 'ضغط 19 بار وتسخين سريع في 25 ثانية مع محولات متعددة لكافة الكبسولات',
    image: './src/assets/images/product_machine_compact_black.png',
    productId: 'hb-smart-capsule-compact'
  }
];
