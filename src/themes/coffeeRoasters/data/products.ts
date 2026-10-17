import { Product, HonorBannerEvent, HonorTechnology, HeroSlide } from '../types';

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
      heroImage: './src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg',
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
        image: './src/assets/images/hibrew_espresso_isolated.jpg',
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
        image: './src/assets/images/hibrew_flagship_honor_banner.jpg',
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
      './src/assets/images/hibrew_espresso_isolated.jpg',
      './src/assets/images/hibrew_flagship_honor_banner.jpg',
      './src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg'
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

  // 2. High-Precision Conical Burr Coffee Mill / Grinder
  {
    id: 'hb-mill-g5-pro',
    name: 'HiBrew Conical Burr Coffee Mill G5',
    nameAr: 'مطحنة القهوة الكهربائية بتروس مخروطية هايبرو G5',
    tagline: '40 Micro-Steps · 40mm CNC Titanium Burrs · Zero Retention Bellows',
    taglineAr: '40 درجة طحن دقيقة بتروس تيتانيوم مخروطية ومضخة تفريغ احتباس صفري',
    category: 'mills',
    basePrice: 489,
    originalPrice: 650,
    badge: 'Zero-Retention Mill',
    reviewCount: 295,
    rating: 4.92,
    heroBanner: {
      headlineEn: 'HiBrew Conical Burr Mill G5',
      headlineAr: 'مطحنة القهوة الكهربائية هايبرو G5 تيتانيوم',
      sloganEn: 'TITANIUM CONICAL BURRS | Zero-Retention Precision In One Touch',
      sloganAr: 'تروس تيتانيوم مخروطية | طحن دقيق باحتباس صفري بلمسة واحدة',
      badgeEn: 'ZERO-RETENTION MILL',
      badgeAr: 'طحن دقيق باحتباس صفري',
      bgGradient: 'from-[#141210] via-[#241c16] to-[#0c0a09]',
      heroImage: './src/assets/images/hibrew_grinder_isolated.jpg',
      featuresEn: [
        '40mm CNC Titanium Conical Burrs',
        '40 Stepped Micro Settings',
        '<0.1g Zero Retention Air Bellows',
        'Low-RPM Quiet DC Motor'
      ],
      featuresAr: [
        'تروس تيتانيوم مخروطية 40 ملم',
        '40 درجة طحن ميكرو دقيقة',
        'مضخة تفريغ احتباس صفري <0.1g',
        'محرك بطيء هادئ يحمي الزيوت'
      ]
    },
    colors: [
      {
        name: 'Matte Black',
        nameAr: 'أسود مطفي فاخر',
        hex: '#141416',
        image: './src/assets/images/hibrew_grinder_isolated.jpg',
        priceDelta: 0
      },
      {
        name: 'Brushed Silver',
        nameAr: 'فضي معدني',
        hex: '#D4D4D8',
        image: './src/assets/images/hibrew_grinder_silver.jpg',
        priceDelta: 50
      }
    ],
    storageOptions: [
      {
        capacity: 'Single Dose (50g)',
        capacityAr: 'جرعة فردية (50 جم)',
        ram: 'Anti-Static Bellows',
        ramAr: 'مضخة سيليكون تفريغ هوائي',
        priceDelta: 0
      },
      {
        capacity: 'Commercial Hopper (250g)',
        capacityAr: 'قمع تجاري كبير (250 جم)',
        ram: 'With Portafilter Cradle',
        ramAr: 'مع حامل بورتافلتر مدمج',
        priceDelta: 80
      }
    ],
    specs: [
      { label: 'Burr Geometry', value: '40mm High-Hardness CNC Titanium Conical Burrs', labelAr: 'نوع التروس', valueAr: 'تروس مخروطية من الفولاذ المطلي بالتيتانيوم مقاس 40 ملم' },
      { label: 'Grind Settings', value: '40 Stepped Micro Settings (Turkish, Espresso, V60, Cold Brew)', labelAr: 'درجات الطحن', valueAr: '40 درجة من النعومة القصوى للإسبريسو والتركي حتى الخشن' },
      { label: 'Retention', value: '< 0.1g Near Zero Retention with Silicone Bellows', labelAr: 'الاحتباس', valueAr: 'أقل من 0.1 جرام بفضل مضخة تفريغ الهواء' },
      { label: 'Motor Speed', value: 'Low RPM DC Motor (Prevents Bean Heat Friction)', labelAr: 'سرعة الدوران', valueAr: 'دوران هادئ وبطيء لحماية الزيوت العطرية من الاحتراق' }
    ],
    images: [
      './src/assets/images/hibrew_grinder_isolated.jpg',
      './src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg'
    ],
    overview: 'The HiBrew Mill G5 combines laboratory precision with single-dose workflow. Zero retention ensures that the exact weight of fresh roasted coffee beans you put in is the exact weight you get out.',
    overviewAr: 'مطحنة القهوة المثالية لمحبي الإسبريسو والتقطير. تمتاز باحتباس صفري وتروس تيتانيوم مخروطية تطحن بحرارة منخفضة للحفاظ على أعمق نكهات البن والإيحاءات العطرية.',
    partsShowcase: [
      {
        id: 'part-g5-titanium-burrs',
        tagEn: 'TITANIUM BURR ARCHITECTURE',
        tagAr: 'هندسة تروس التيتانيوم المخروطية',
        titleEn: '40mm CNC High-Hardness Titanium Conical Burrs',
        titleAr: 'تروس مخروطية 40 ملم من الفولاذ المطلي بالتيتانيوم',
        descriptionEn: 'Ultra-hard CNC machined 40mm conical burrs coated in titanium carbon nitride. Maintains pinpoint cutting sharpness across 500kg+ of roasted beans with near-zero heat transfer.',
        descriptionAr: 'تروس مخروطية فائقة الصلابة مصنعة بتقنية CNC ومطلية بطبقة التيتانيوم كربون نايتريد، تطحن بنعومة وثبات لأكثر من 500 كجم بن دون تأثر حواف القطع أو ارتفاع حرارة الحبوب.',
        image: './src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg',
        stats: [
          { labelEn: 'Burr Size', labelAr: 'قطر التروس', value: '40mm Conical' },
          { labelEn: 'Coating', labelAr: 'نوع الطلاء', value: 'Titanium TiN' },
          { labelEn: 'Hardness', labelAr: 'مستوى الصلابة', value: 'HRC 64' }
        ]
      },
      {
        id: 'part-g5-machine-usage',
        tagEn: 'MACHINE IN-USE · ZERO RETENTION WORKFLOW',
        tagAr: 'المطحنة أثناء الاستخدام · طحن وتفريغ احتباس صفري',
        titleEn: 'Single-Dose Operation & Air Bellows Exhaust',
        titleAr: 'طحن جرعة بجرعة ونفخ احتباس صفري لمسحوق البن',
        descriptionEn: 'Weigh your coffee beans, pour into the single-dose hopper, and grind smoothly at low RPM. A single tap on the silicone bellows expels 100% of residual grounds, guaranteeing absolute freshness in every cup.',
        descriptionAr: 'ضع حبوب القهوة الموزونة في القمع واطحن بهدوء. ضغطة واحدة على مضخة السيليكون تطرد كافة ذرات البن العالقة داخل ممر الخروج ليصبح الاحتباس أقل من 0.1 جرام، مما يضمن طزاجة كل شوت.',
        image: './src/assets/images/barista_tamping_shot_1791363346824.jpg',
        stats: [
          { labelEn: 'Retention', labelAr: 'نسبة الاحتباس', value: '< 0.1g Zero' },
          { labelEn: 'Workflow', labelAr: 'نظام الجرعات', value: 'Single Dose' },
          { labelEn: 'RPM Rate', labelAr: 'سرعة الدوران', value: '450 RPM Cool' }
        ]
      },
      {
        id: 'part-g5-stepped-dial',
        tagEn: '40 MICRO-STEP ADJUSTMENT',
        tagAr: '40 درجة ضبط ميكرومترية',
        titleEn: '40-Step Micro Adjustment from Turkish to Cold Brew',
        titleAr: 'قرص معايرة دقيق 40 درجة من التركي الناعم حتى التقطير والكولد برو',
        descriptionEn: 'Stepped precision collar enables effortless dialing. Transition smoothly between micro-powder for Turkish coffee, dialed-in 9-bar espresso, delicate V60 pour-overs, and coarse French press.',
        descriptionAr: 'حلقة ضبط خارجية مرقمة بـ 40 درجة دقيقة للغاية. يمكنك الانتقال بسلاسة بين نعومة القهوة التركية، ونعومة الإسبريسو المضبوطة بدقة، وتقطير V60، وحتى الطحن الخشن للكولد برو.',
        image: './src/assets/images/fiorenzato_sunset_riyadh_hero_1791364213969.jpg',
        stats: [
          { labelEn: 'Steps', labelAr: 'عدد الدرجات', value: '40 Micro Steps' },
          { labelEn: 'Grind Range', labelAr: 'مجال الطحن', value: '100μm - 1200μm' },
          { labelEn: 'Dial Click', labelAr: 'ملمس القرص', value: 'Tactile Click' }
        ]
      },
      {
        id: 'part-g5-dosing-cup',
        tagEn: 'MAGNETIC PORTAFILTER CUP',
        tagAr: 'كوب استقبال مغناطيسي مضاد للشحنات',
        titleEn: 'Anti-Static Ion Chute & Magnetic Dosing Cup',
        titleAr: 'ممر خروج مضاد للشحنات الساكنة وكوب استقبال من الألمنيوم',
        descriptionEn: 'Crafted with anti-static discharge channels that eliminate flyaway chaff and clumping. Magnetic guide centers the CNC aluminum dosing cup directly under the chute for clean transfer.',
        descriptionAr: 'قناة خروج مصممة بتقنية تفريغ الشحنات الكهربائية الساكنة لمنع تطاير مسحوق القهوة وتكتله. قاعدة مغناطيسية تثبت كوب الألمنيوم المرفق في المنتصف تماماً دون أي فوضى على طاولة القهوة.',
        image: './src/assets/images/espresso_wood_pitcher_1791363392554.jpg',
        stats: [
          { labelEn: 'Cup Fit', labelAr: 'مقاس الكوب', value: '58mm Standard' },
          { labelEn: 'Anti-Static', labelAr: 'مكافحة الشحنات', value: 'Zero Flyaway' },
          { labelEn: 'Base Mount', labelAr: 'تثبيت القاعدة', value: 'Magnetic Lock' }
        ]
      },
      {
        id: 'part-g5-agency-warranty',
        tagEn: '2-YEAR KSA AGENCY WARRANTY',
        tagAr: 'ضمان الوكيل سنتين بالسعودية',
        titleEn: 'Heavy Die-Cast Aluminum Body & Official KSA Warranty',
        titleAr: 'هيكل معدني صلب ممتص للاهتزازات مع ضمان الوكيل سنتين بالمملكة',
        descriptionEn: 'Full solid aluminum body provides exceptional stability and minimal vibration during grinding. Backed by 2-year authorized agency warranty with certified maintenance centers across KSA.',
        descriptionAr: 'هيكل معدني ثقيل من الألمنيوم المصبوب يمتص الاهتزازات ويضمن هدوء المحرك أثناء الطحن. مدعوم بضمان الوكيل المعتمد سنتين في المملكة مع توفر التروس والقطع الأصلية.',
        image: './src/assets/images/coffee_machine_story_craft_1791221163767.jpg',
        stats: [
          { labelEn: 'Agency Warranty', labelAr: 'ضمان الوكيل', value: '2 Years Full' },
          { labelEn: 'Chassis', labelAr: 'خامة الهيكل', value: 'Die-Cast Alloy' },
          { labelEn: 'Noise Level', labelAr: 'مستوى الصوت', value: '< 65 dB Quiet' }
        ]
      }
    ]
  },

  // 3. Precision 58mm Bottomless Boltfilter (Portafilter)
  {
    id: 'hb-boltfilter-58-naked',
    name: '58mm Naked Walnut Boltfilter',
    nameAr: 'بورتافلتر مكشوف مقاس 58 ملم مع مقبض خشب الجوز',
    tagline: 'Solid Food-Grade 304 Steel · Walnut Hardwood · Micro-Laser Basket',
    taglineAr: 'ستانلس 304 صحي مع مقبض خشب جوز طبيعي وباسكت دقيق الفتحات 18 جرام',
    category: 'accessories',
    basePrice: 159,
    originalPrice: 220,
    badge: 'Barista Boltfilter',
    reviewCount: 310,
    rating: 4.94,
    heroBanner: {
      headlineEn: 'HiBrew 58mm Naked Walnut Boltfilter',
      headlineAr: 'بورتافلتر مكشوف مقاس 58 ملم مع مقبض خشب الجوز',
      sloganEn: 'NAKED EXTRACTION | Visual Crema Perfection In Every Shot',
      sloganAr: 'استخلاص مكشوف | تدفق الكريمة الذهبية المثالي في كل شوت',
      badgeEn: 'BARISTA BOLTFILTER 58MM',
      badgeAr: 'بورتافلتر باريستا مكشوف',
      bgGradient: 'from-[#18100c] via-[#2a1711] to-[#0c0806]',
      heroImage: './src/assets/images/hibrew_portafilter_isolated.jpg',
      featuresEn: [
        'Solid Food-Grade 304 Steel Head',
        'Handcrafted Natural Walnut Grip',
        'Micro-Laser 18g Precision Basket',
        'Visual Channeling Diagnostic'
      ],
      featuresAr: [
        'رأس ستانلس ستيل 304 صحي مصمت',
        'مقبض خشب جوز أمريكي طبيعي',
        'باسكت ليزري دقيق الفتحات 18 جرام',
        'كشف قنوات التدفق وتحسين النكهة'
      ]
    },
    colors: [
      {
        name: 'Natural Walnut',
        nameAr: 'خشب الجوز الملكي',
        hex: '#5A3825',
        image: './src/assets/images/hibrew_portafilter_isolated.jpg',
        priceDelta: 0
      },
      {
        name: 'Dark Ebony',
        nameAr: 'خشب الأبنوس الداكن',
        hex: '#27201D',
        image: './src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg',
        priceDelta: 30
      }
    ],
    storageOptions: [
      {
        capacity: '58mm Standard E61/HiBrew',
        capacityAr: 'مقاس 58 مم متوافق مع هايبرو و E61',
        ram: 'Includes 18g Precision Basket',
        ramAr: 'يشمل باسكت دقيق سعة 18 جم',
        priceDelta: 0
      },
      {
        capacity: '58mm Triple Basket Kit',
        capacityAr: 'طقم باسكت ثلاثي 58 مم',
        ram: 'Includes 22g Basket + Puck Screen',
        ramAr: 'يشمل باسكت 22 جم + شبكة باك سكرين',
        priceDelta: 45
      }
    ],
    specs: [
      { label: 'Basket Diameter', value: '58.4mm Precision Fit', labelAr: 'القطر القياسي', valueAr: '58.4 ملم مطابق لمكائن هاي برو والمكائن التجارية E61' },
      { label: 'Handle Material', value: 'Hand-carved Natural Walnut with Ergonomic Balance', labelAr: 'خامة المقبض', valueAr: 'خشب جوز طبيعي معالج ضد الماء والرطوبة' },
      { label: 'Head Material', value: 'Food-Safe Heavyweight 304 Stainless Steel', labelAr: 'رأس البورتافلتر', valueAr: 'ستانلس ستيل 304 مصمت عالي التحمل' }
    ],
    images: [
      './src/assets/images/hibrew_portafilter_isolated.jpg',
      './src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg'
    ],
    overview: 'Inspect extraction flow, eliminate channeling, and capture mesmerizing crema streams. The 58mm Naked Boltfilter is the standard tool for every serious home barista.',
    overviewAr: 'شاهد تدفق الكريمة الذهبية واكتشف قنوات الاستخلاص مباشرة. بورتافلتر مكشوف فاخر بمقبض خشبي يمنحك استخلاصاً سلساً وطعماً متوازناً.',
    partsShowcase: [
      {
        id: 'part-bf-head-craft',
        tagEn: 'CRAFTSMANSHIP & SOLID STEEL',
        tagAr: 'حرفية التصنيع والصلابة العالية',
        titleEn: 'Hand-Carved Natural Walnut & Solid 304 Stainless Steel Head',
        titleAr: 'مقبض خشب الجوز الأمريكي الطبيعي ورأس ستانلس ستيل 304 مصمت',
        descriptionEn: 'Forged from heavyweight 304 food-grade stainless steel with precision ear angles. Fitted with hand-shaped American walnut hardwood balanced for ergonomic barista comfort.',
        descriptionAr: 'مصنوع من قطعة صلبة من الستانلس ستيل 304 الآمن غذائياً مع زوايا تثبيت دقيقة ومقبض متوازن من خشب الجوز المعالج طبيعياً ضد الرطوبة وحرارة الاستخلاص.',
        image: './src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg',
        stats: [
          { labelEn: 'Head Steel', labelAr: 'خامة الرأس', value: '304 Solid Stainless' },
          { labelEn: 'Wood Grip', labelAr: 'خامة المقبض', value: 'Natural Walnut' },
          { labelEn: 'Weight', labelAr: 'الوزن الإجمالي', value: '540g Balanced' }
        ]
      },
      {
        id: 'part-bf-usage-stream',
        tagEn: 'TOOL IN-USE · BOTTOMLESS EXTRACTION',
        tagAr: 'الأداة أثناء الاستخدام · استخلاص مكشوف وتدفق كريمة',
        titleEn: 'Unobstructed Golden Crema Stream Convergence',
        titleAr: 'تدفق الكريمة الذهبية السلس وتجمع قطرات الإسبريسو في المنتصف',
        descriptionEn: 'Witness the cone of golden crema form directly under the basket. Observe extraction symmetry in real-time to immediately diagnose tamping level and channeling issues.',
        descriptionAr: 'استمتع بمشاهدة مخروط الكريمة الذهبية وهو يتجمع في المنتصف بتناغم ساحر. يمنحك البورتافلتر المكشوف كشفاً بصرياً فورياً لجودة كبس البن وغياب أي قنوات مائية.',
        image: './src/assets/images/coffee_making_crema_flow_1791221127339.jpg',
        stats: [
          { labelEn: 'Extraction Type', labelAr: 'طريقة الاستخلاص', value: 'Bottomless Naked' },
          { labelEn: 'Diagnosis', labelAr: 'التشخيص البصري', value: 'Zero Channeling' },
          { labelEn: 'Flavor Profile', labelAr: 'إيحاءات النكهة', value: 'Maximum Body' }
        ]
      },
      {
        id: 'part-bf-puck-prep',
        tagEn: 'BARISTA PUCK PREPARATION',
        tagAr: 'تحضير قرص البن وكبس متساوي',
        titleEn: 'Flat 58.4mm Compaction & Puck Screen Compatibility',
        titleAr: 'كبس مستوي مقاس 58.4 ملم وتوافق كامل مع شاشات البك سكرين',
        descriptionEn: 'The vertical straight sidewall design supports full depth tamping down to 18-20g. Accommodates standard 58.5mm precision tampers and ultra-thin mesh puck screens.',
        descriptionAr: 'تصميم الحواف الداخلية المستقيمة يسمح بنزول التامبر حتى قاع الباسكت لكبس 18-20 جرام باحترافية، ويتوافق تماماً مع شاشات توزيع الماء البك سكرين.',
        image: './src/assets/images/barista_tamping_shot_1791363346824.jpg',
        stats: [
          { labelEn: 'Tamper Fit', labelAr: 'مقاس التامبر', value: '58.4 - 58.5mm' },
          { labelEn: 'Basket Depth', labelAr: 'عمق الباسكت', value: '26mm Precision' },
          { labelEn: 'Screen Fit', labelAr: 'توافق البك سكرين', value: '100% Compatible' }
        ]
      },
      {
        id: 'part-bf-basket-perforation',
        tagEn: 'MICRO-LASER PERFORATION',
        tagAr: 'باسكت ليزري دقيق الفتحات',
        titleEn: 'Micro-Laser Precision Perforated Filter Basket (18g)',
        titleAr: 'باسكت استخلاص ليزري عالي الدقة سعة 18 جرام',
        descriptionEn: 'Laser-perforated holes distributed with microscopic symmetry ensure consistent water hydraulic resistance across every square millimeter of the espresso bed.',
        descriptionAr: 'فتحات ليزرية متناهية الصغر وموزعة بنسب رياضية دقيقة تضمن توازن مقاومة الماء عبر كافة مساحة قرص القهوة لمنع خروج القهوة غير المتجانس.',
        image: './src/assets/images/barista_crema_macro_1791363328316.jpg',
        stats: [
          { labelEn: 'Hole Count', labelAr: 'عدد الفتحات', value: '648 Precision' },
          { labelEn: 'Basket Dose', labelAr: 'جرعة الباسكت', value: '18g Standard' },
          { labelEn: 'Polishing', labelAr: 'المعالجة', value: 'Mirror Electro-polish' }
        ]
      },
      {
        id: 'part-bf-compatibility',
        tagEn: 'E61 & HIBREW COMPATIBILITY',
        tagAr: 'توافق شامل مع كبرى المكائن',
        titleEn: 'Universal Dual-Ear 58.4mm Commercial Grouphead Fit',
        titleAr: 'توافق كامل مع مقابس مكائن هاي برو ومكائن المقاهي E61 التجارية',
        descriptionEn: 'Precision-angled dual ears lock securely into HiBrew Barista Pro machines, as well as universal E61 groupheads, Rocket, ECM, Sanremo, and commercial café equipment.',
        descriptionAr: 'زعانف تثبيت مزدوجة بسماكة 4 ملم تقفل بإحكام تام على مكائن هاي برو بارستا برو، ومكائن المقاهي العالمية بنظام E61 دون أي تسريب لضغط الـ 20 بار.',
        image: './src/assets/images/hibrew_barista_pro_details_showcase_1791364980884.jpg',
        stats: [
          { labelEn: 'Group Standard', labelAr: 'معيار المقبس', value: '58mm E61 Standard' },
          { labelEn: 'Ear Thickness', labelAr: 'سماكة الأذن', value: '4.0mm Dual' },
          { labelEn: 'Gasket Seal', labelAr: 'إحكام الإغلاق', value: 'Leak-Proof Lock' }
        ]
      }
    ]
  },

  // 4. Artisan Nordic Coffee Corner Cabinet Credenza
  {
    id: 'hb-nordic-cabinet',
    name: 'Artisan Fluted Oak Coffee Corner Station',
    nameAr: 'دولاب وركن القهوة الفاخر من خشب البلوط المضلع مع إضاءة ليد مخفية',
    tagline: 'Solid Natural Oak · Integrated Warm LED · Concealed Cable Ports',
    taglineAr: 'خشب بلوط طبيعي صلب مع إضاءة شريطية دافئة وتمديدات كهربائية مخفية',
    category: 'cabinets',
    basePrice: 1490,
    originalPrice: 1890,
    badge: 'Artisan Furniture',
    reviewCount: 168,
    rating: 4.97,
    heroBanner: {
      headlineEn: 'Artisan Fluted Oak Coffee Station',
      headlineAr: 'دولاب وركن القهوة الفاخر من خشب البلوط المضلع مع إضاءة ليد مخفية',
      sloganEn: 'SCANDINAVIAN LUXURY | The Ultimate Home Coffee Sanctuary',
      sloganAr: 'فخامة اسكندنافية | ركن القهوة المتكامل لمنزلك العصري',
      badgeEn: 'ARTISAN FURNITURE',
      badgeAr: 'أثاث خشبي حرفي فاخر',
      bgGradient: 'from-[#191512] via-[#2c2219] to-[#0e0c0a]',
      heroImage: './src/assets/images/hibrew_cabinet_isolated.jpg',
      featuresEn: [
        'Solid Kiln-Dried Natural White Oak',
        'Integrated 3000K Ambient LED Rail',
        '3 Concealed Rear Cable Ports',
        'Sintered Scratch-Resistant Top'
      ],
      featuresAr: [
        'خشب بلوط طبيعي مجفف ومعالج',
        'إضاءة LED دافئة مدمجة 3000K',
        '3 منافذ مخفية لتمديدات الأسلاك',
        'سطح بورسلان مقاوم للحرارة والخدش'
      ]
    },
    colors: [
      {
        name: 'Nordic Oak',
        nameAr: 'بلوط طبيعي فاتح',
        hex: '#C29B62',
        image: './src/assets/images/hibrew_cabinet_isolated.jpg',
        priceDelta: 0
      },
      {
        name: 'Dark Walnut',
        nameAr: 'جوزي داكن',
        hex: '#4A3525',
        image: './src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg',
        priceDelta: 150
      }
    ],
    storageOptions: [
      {
        capacity: 'Width 120cm Station',
        capacityAr: 'ركن قهوة عرض 120 سم',
        ram: '2 Doors + 3 Drawers + LED',
        ramAr: 'بابين + 3 أدراج تنظيم + إضاءة LED',
        priceDelta: 0
      },
      {
        capacity: 'Width 150cm Grand Station',
        capacityAr: 'ركن قهوة ملكي عرض 150 سم',
        ram: 'Includes Glass Cup Racks + LED',
        ramAr: 'يشمل أرفف زجاجية للأكواب + إضاءة LED',
        priceDelta: 400
      }
    ],
    specs: [
      { label: 'Dimensions', value: 'W 120cm × H 95cm × D 45cm', labelAr: 'المقاسات والأبعاد', valueAr: 'العرض 120 سم × الارتفاع 95 سم × العمق 45 سم' },
      { label: 'Wood Grade', value: 'Kiln-Dried Solid White Oak with Moisture Seal', labelAr: 'نوع الخشب', valueAr: 'خشب بلوط طبيعي مجفف ومعالج ضد انسكاب القهوة والحرارة' },
      { label: 'Cable Routing', value: '3 Concealed Rear Grommets + Internal Power Hub', labelAr: 'إدارة الأسلاك', valueAr: '3 فتحات مخفية لتمديد كهرباء الماكينة والمطحنة دون فوضى أسلاك' },
      { label: 'Lighting', value: '3000K Warm Ambient LED with Concealed Touch Switch', labelAr: 'الإضاءة المدمجة', valueAr: 'شريط LED دافئ 3000K بمستشعر لمس أنيق' }
    ],
    images: [
      './src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg',
      './src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg'
    ],
    overview: 'The centerpiece of your home coffee sanctuary. Handcrafted with fluted architectural lines, heat-resistant stone-feel countertop, soft-close drawers, and dedicated barista compartments.',
    overviewAr: 'التحفة الفنية في مجلسك أو صالتك. دولاب ركن القهوة المودرن الفاخر المجهز بفتحات مخفية لتوصيل الكهرباء وإضاءة ليد دافئة تبرز جمال أجهزتك وأكوابك.',
    partsShowcase: [
      {
        id: 'part-cab-fluted-joinery',
        tagEn: 'SOLID ARCHITECTURAL JOINERY',
        tagAr: 'خشب بلوط صلب بتصميم مضلع راقي',
        titleEn: 'Kiln-Dried Natural White Oak with Fluted Front Facade',
        titleAr: 'واجهة مضلعة من خشب البلوط الطبيعي الصلب المجفف بالفرن',
        descriptionEn: 'Precision-carved vertical fluting creates dynamic light and shadow interplay. Solid kiln-dried oak construction sealed against spills, moisture, and Saudi climate fluctuations.',
        descriptionAr: 'واجهة خشبية مضلعة رأسياً بحرفية اسكندنافية تضفي لمسة ديكورية آسرة. الخشب معالج حرارياً ومطلي بمادة شفافة واقية تمنع تغلغل بقع القهوة والماء.',
        image: './src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg',
        stats: [
          { labelEn: 'Wood Grade', labelAr: 'نوع الخشب', value: 'Solid White Oak' },
          { labelEn: 'Joinery Type', labelAr: 'نوع التوصيل', value: 'Fluted Precision' },
          { labelEn: 'Protection', labelAr: 'طبقة الحماية', value: 'Nano Stain-Seal' }
        ]
      },
      {
        id: 'part-cab-in-use-bar',
        tagEn: 'STATION IN-USE · COFFEE BAR WORKFLOW',
        tagAr: 'الركن أثناء الاستخدام · ترتيب الأجهزة والأكواب',
        titleEn: 'Organized Barista Workflow: Machine, Mill & Cups In Harmony',
        titleAr: 'مساحة عمل متكاملة تتسع للماكينة والمطحنة والأكواب وسيروب القهوة',
        descriptionEn: 'Sized to comfortably house dual-boiler espresso machines, grinders, knock boxes, and glassware simultaneously with generous arm room for tamping and pouring latte art.',
        descriptionAr: 'مصمم بمقاسات هندسية مثالية تتيح وضع ماكينة القهوة الكبيرة والمطحنة والنوك بوكس جنباً إلى جنب مع مساحة مريحة لحركة اليدين أثناء إعداد كوب القهوة الصباحي.',
        image: './src/assets/images/coffee_corner_luxury_station_1791219182840.jpg',
        stats: [
          { labelEn: 'Surface Width', labelAr: 'عرض السطح', value: '120 - 150 cm' },
          { labelEn: 'Weight Load', labelAr: 'حمولة السطح', value: '180 kg Max' },
          { labelEn: 'Ergonomics', labelAr: 'ارتفاع السطح', value: '95 cm Barista' }
        ]
      },
      {
        id: 'part-cab-cable-routing',
        tagEn: 'CONCEALED CABLE MANAGEMENT',
        tagAr: 'تمديدات كهرباء ومنافذ مخفية تماماً',
        titleEn: '3 Rear Grommets & Internal 6-Socket Power Station',
        titleAr: 'فتحات خلفية لتمرير الأسلاك ووحدة توزيع كهرباء داخلية مخفية',
        descriptionEn: 'Say goodbye to unsightly cord clutter. Dedicated rear pass-through grommets direct electrical cables down into a concealed internal power rail inside the cabinet.',
        descriptionAr: 'تخلص نهائياً من فوضى الأسلاك على طاولة القهوة. فتحات خلفية مخصصة تنزل أسلاك الماكينة والمطحنة والميزان مباشرة إلى داخل الدولاب لتتصل بوحدة كهرباء مدمجة.',
        image: './src/assets/images/coffee_machine_story_craft_1791221163767.jpg',
        stats: [
          { labelEn: 'Cable Ports', labelAr: 'منافذ الأسلاك', value: '3 Rear Grommets' },
          { labelEn: 'Internal Power', labelAr: 'الطاقة الداخلية', value: 'Multi-Socket Ready' },
          { labelEn: 'Aesthetics', labelAr: 'المظهر الخارجي', value: 'Zero Cord Clutter' }
        ]
      },
      {
        id: 'part-cab-warm-led',
        tagEn: 'INTEGRATED 3000K AMBIENT LED',
        tagAr: 'إضاءة محيطية شريطية دافئة 3000K',
        titleEn: 'Concealed Touch-Controlled 3000K Warm Glow Rail',
        titleAr: 'شريط إضاءة LED مدمج خفي مع مستشعر لمس أنيق بدون مفاتيح ظاهرة',
        descriptionEn: 'Soft 3000K warm diffused light casts a cozy golden glow across your espresso machines, cups, and hardwood textures, turning your morning ritual into pure relaxation.',
        descriptionAr: 'إضاءة محيطية صفراء دافئة 3000K مدمجة أسفل الحواف العلوية تبرز لمعان الستانلس ستيل وجمال الأكواب الخزفية، وتعمل بحساس لمس مخفي فائق الاستجابة.',
        image: './src/assets/images/ramadan_coffee_corner_hero_1791364235712.jpg',
        stats: [
          { labelEn: 'Color Temp', labelAr: 'حرارة اللون', value: '3000K Warm Gold' },
          { labelEn: 'Switch Mode', labelAr: 'طريقة التشغيل', value: 'Touch Sensor' },
          { labelEn: 'Lifespan', labelAr: 'عمر الإضاءة', value: '50,000 Hours' }
        ]
      },
      {
        id: 'part-cab-sintered-counter',
        tagEn: 'HEAT & STAIN RESISTANT SLAB',
        tagAr: 'سطح بورسلان صخري فائق التحمل',
        titleEn: 'Sintered Stone Spill, Heat & Scratch-Proof Countertop',
        titleAr: 'سطح من الحجر البورسلاني الملبد المقاوم للحرارة والخدوش وانسكاب القهوة',
        descriptionEn: 'Non-porous stone-feel surface allows placing steaming portafilters and hot kettles directly without marks. Wipes completely clean in seconds with a damp microfiber cloth.',
        descriptionAr: 'سطح صخري غير مسامي لا يمتص السوائل إطلاقاً؛ يمكنك وضع البورتافلتر الساخن والغلاية عليه مباشرة دون قلق من أي تصبغات، وينظف بسهولة بمسحة واحدة.',
        image: './src/assets/images/coffee_people_luxury_lounge_1791221150246.jpg',
        stats: [
          { labelEn: 'Heat Limit', labelAr: 'مقاومة الحرارة', value: 'Up to 300°C' },
          { labelEn: 'Absorption', labelAr: 'امتصاص السوائل', value: '0% Non-Porous' },
          { labelEn: 'Scratch Proof', labelAr: 'مقاومة الخدش', value: 'Mohs Scale 7' }
        ]
      }
    ]
  },

  // 5. Handcrafted Ceramic Latte & Flat White Cup Set
  {
    id: 'hb-ceramic-artisan-cups',
    name: 'Artisan Stoneware Ceramic Cup Set (4 Pcs)',
    nameAr: 'طقم أكواب فلات وايت ولاتيه سيراميك حجري مع صحون (4 قطع)',
    tagline: 'Hand-Thrown Ceramic · Thermal Mass Retention · Curved Latte Art Base',
    taglineAr: 'سيراميك ستونوير مصنوع يدوياً باحتفاظ حراري عالي وقاعدة مقعرة لرسم اللاتيه',
    category: 'accessories',
    basePrice: 169,
    originalPrice: 210,
    badge: 'Artisan Cups',
    reviewCount: 220,
    rating: 4.91,
    heroBanner: {
      headlineEn: 'Artisan Stoneware Ceramic Cup Set',
      headlineAr: 'طقم أكواب فلات وايت ولاتيه سيراميك حجري مع صحون (4 قطع)',
      sloganEn: 'HAND-THROWN STONEWARE | Thermal Mass & Parabolic Latte Art Base',
      sloganAr: 'سيراميك ستونوير يدوي | احتفاظ حراري وقاعدة مقعرة لرسم اللاتيه',
      badgeEn: 'ARTISAN STONEWARE',
      badgeAr: 'سيراميك يدوي فاخر',
      bgGradient: 'from-[#19130f] via-[#2a1d15] to-[#0d0907]',
      heroImage: './src/assets/images/product_ceramic_cups_set_1791217230149.jpg',
      featuresEn: [
        'Double-Fired 1280°C Stoneware',
        'Parabolic Curved Latte Art Bowl',
        'Thick Heat-Insulating Walls',
        'Microwave & Dishwasher Safe'
      ],
      featuresAr: [
        'حرق مزدوج عند 1280° مئوية',
        'قاعدة داخلية مقعرة لصب اللاتيه',
        'جدران سميكة تحفظ حرارة المشروب',
        'آمن لغسالة الصحون والمايكروويف'
      ]
    },
    colors: [
      {
        name: 'Desert Matte Sand',
        nameAr: 'رملي مطفي كلاسيكي',
        hex: '#D7C4A8',
        image: './src/assets/images/hibrew_ceramic_cup_isolated.jpg',
        priceDelta: 0
      },
      {
        name: 'Terracotta Rust',
        nameAr: 'طيني دافئ',
        hex: '#A0522D',
        image: './src/assets/images/product_ceramic_cups_set_1791217230149.jpg',
        priceDelta: 25
      }
    ],
    storageOptions: [
      {
        capacity: '200ml (Flat White/Cortado)',
        capacityAr: '200 مل (فلات وايت / كورتادو)',
        ram: 'Set of 4 Cups + 4 Saucers',
        ramAr: 'طقم 4 أكواب + 4 صحون سيراميك',
        priceDelta: 0
      },
      {
        capacity: '300ml (Latte/Cappuccino)',
        capacityAr: '300 مل (لاتيه / كابتشينو)',
        ram: 'Set of 4 Large Cups + Saucers',
        ramAr: 'طقم 4 أكواب كبيرة + 4 صحون سيراميك',
        priceDelta: 30
      }
    ],
    specs: [
      { label: 'Capacity', value: '200ml / 6.8oz Barista Standard', labelAr: 'السعة', valueAr: '200 مل النسبة الذهبية للفلات وايت والكورتادو' },
      { label: 'Kiln Firing', value: 'Double-fired High-Density Stoneware (1280°C)', labelAr: 'طريقة التصنيع', valueAr: 'حرق مزدوج عند 1280 درجة مئوية لمقاومة الصدمات' },
      { label: 'Care', value: '100% Dishwasher, Microwave & Food Safe', labelAr: 'العناية', valueAr: 'آمن للغسالة والمايكروويف وصحي 100%' }
    ],
    images: [
      './src/assets/images/hibrew_ceramic_cup_isolated.jpg',
      './src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg'
    ],
    overview: 'Thick-walled stoneware mugs designed specifically for latte art. The curved interior bowl promotes smooth milk incorporation and prolonged heat retention.',
    overviewAr: 'أكواب سيراميك مصنوعة يدوياً للمقاهي المختصة والمنازل الراقية، تحافظ على حرارة مشروبك وتمنحك تحكماً ممتعاً في صب الحليب ورسم اللاتيه.',
    partsShowcase: [
      {
        id: 'part-cup-craft',
        tagEn: 'HANDMADE STONEWARE GLAZE',
        tagAr: 'طلاء فخاري يدوي وملمس مطفي ناعم',
        titleEn: '1280°C Kiln-Fired High-Density Artisan Ceramic',
        titleAr: 'سيراميك ستونوير حجري عالي الكثافة محروق عند 1280 درجة مئوية',
        descriptionEn: 'Double-fired stoneware clay with tactile matte outer finish and silky smooth interior glaze. Extremely resistant to thermal shock, chips, and metal spoon scratches.',
        descriptionAr: 'فخار حجري عالي الكثافة خضع لحرقين متتاليين في أفران خزفية متطورة، يمنحك ملمساً ترابياً فاخراً ومقاوماً للصدمات الحرارية وخدوش ملاعق التحريك.',
        image: './src/assets/images/product_ceramic_cups_set_1791217230149.jpg',
        stats: [
          { labelEn: 'Kiln Temp', labelAr: 'حرارة الفرن', value: '1280°C Fired' },
          { labelEn: 'Material', labelAr: 'الخامة الأساسية', value: 'Dense Stoneware' },
          { labelEn: 'Safety', labelAr: 'معايير الأمان', value: '100% Food Safe' }
        ]
      },
      {
        id: 'part-cup-usage-latte',
        tagEn: 'CUPS IN-USE · LATTE ART FLOW',
        tagAr: 'الأكواب أثناء الاستخدام · صب الحليب ورسم اللاتيه',
        titleEn: 'Parabolic Inner Basin for Seamless Milk Incorporation',
        titleAr: 'قاعدة داخلية مقعرة انسيابية تمنحك تحكماً كاملاً برسم اللاتيه آرت',
        descriptionEn: 'Designed with a rounded interior base that lets steamed microfoam slide under the espresso crema without breaking its surface tension, yielding crisp contrast in rosettas.',
        descriptionAr: 'قاع داخلي دائري انسيابي يسمح لتدفق الحليب المخفوق بالانزلاق بسلاسة أسفل طبقة الكريمة دون تفتيتها، مما يمنحك تبايناً ناصعاً ورسوماً متقنة للاتيه آرت.',
        image: './src/assets/images/barista_milk_steaming_1791363367164.jpg',
        stats: [
          { labelEn: 'Bowl Geometry', labelAr: 'انحناء القاعدة', value: 'Parabolic Curve' },
          { labelEn: 'Crema Blend', labelAr: 'انسجام الكريمة', value: 'Zero Disruption' },
          { labelEn: 'Art Pour', labelAr: 'رسم اللاتيه', value: 'Competition Ready' }
        ]
      },
      {
        id: 'part-cup-interior-curve',
        tagEn: 'ERGONOMIC COMFORT GRIP',
        tagAr: 'مقبض مريح وتوازن مثالي في اليد',
        titleEn: 'Weighted Bottom Balance with Ergonomic Single-Finger Loop',
        titleAr: 'توزيع وزن متوازن ومقبض إصبع مريح يمنحك ثباتاً أثناء التقديم',
        descriptionEn: 'Center of gravity is engineered toward the base, preventing accidental tipping on trays or coffee corners while offering a pleasant, warm tactile hold in winter.',
        descriptionAr: 'تمت هندسة مركز الثقل نحو الأسفل لمنع أي انسكاب عرضي على الصواني أو طاولات القهوة، مع مقبض متزن يتيح حمل الفنجان براحة تامة.',
        image: './src/assets/images/espresso_wood_pitcher_1791363392554.jpg',
        stats: [
          { labelEn: 'Base Weight', labelAr: 'وزن القاعدة', value: 'Weighted Low CG' },
          { labelEn: 'Handle Fit', labelAr: 'تصميم المقبض', value: 'Ergonomic Loop' },
          { labelEn: 'Comfort', labelAr: 'إحساس اليد', value: 'Thermal Touch' }
        ]
      },
      {
        id: 'part-cup-thermal-mass',
        tagEn: 'THERMAL RETENTION SHIELD',
        tagAr: 'احتفاظ حراري فائق للقهوة المختصة',
        titleEn: 'Thick Ceramic Walls Preserving 65°C Specialty Roast Temperature',
        titleAr: 'جدران سيراميكية سميكة تحفظ حرارة القهوة عند 65° مئوية المثالية',
        descriptionEn: 'Substantial thermal mass prevents rapid cool-down of specialty flat whites and cortados, allowing delicate citrus and floral aroma notes to shine until the last sip.',
        descriptionAr: 'جدار سميك بكتلة حرارية عالية يمنع برودة القهوة السريعة في الأجواء المكيفة، لتحافظ على نكهات وإيحاءات البن الفاكهية والزهرية حتى آخر رشفة.',
        image: './src/assets/images/barista_crema_macro_1791363328316.jpg',
        stats: [
          { labelEn: 'Wall Thickness', labelAr: 'سمك الجدار', value: '6.5mm Thermal' },
          { labelEn: 'Heat Hold', labelAr: 'حفظ الحرارة', value: '25+ Minutes' },
          { labelEn: 'Target Temp', labelAr: 'الحرارة المثالية', value: '65°C Sweet Spot' }
        ]
      },
      {
        id: 'part-cup-saucers-set',
        tagEn: 'SET OF 4 WITH MATCHING SAUCERS',
        tagAr: 'طقم 4 أكواب مع صحون مطابقة وعلبة فاخرة',
        titleEn: 'Set of 4 Artisan Cups with Textured Saucers & Gift Packaging',
        titleAr: 'طقم متكامل مكون من 4 أكواب و 4 صحون في علبة إهداء مبطنة فاخرة',
        descriptionEn: 'Includes four matching textured ceramic saucers with indented cup recesses to eliminate sliding. Packaged in a cushioned presentation box ready for gifting.',
        descriptionAr: 'يحتوي الطقم على 4 أكواب و 4 صحون سيراميك مطابقة بحفرة تثبيت تمنع انزلاق الكوب، مغلفة في صندوق إهداء فاخر ومبطن مناسب للمناسبات والهدايا.',
        image: './src/assets/images/saudi_coffee_collage_1791363410810.jpg',
        stats: [
          { labelEn: 'Set Quantity', labelAr: 'محتويات الطقم', value: '4 Cups + 4 Saucers' },
          { labelEn: 'Capacity', labelAr: 'السعة القياسية', value: '200ml / 6.8oz' },
          { labelEn: 'Packaging', labelAr: 'نوع التغليف', value: 'Gift Box Padded' }
        ]
      }
    ]
  },

  // 6. Double-Wall Insulated Kraft Paper Coffee Cups
  {
    id: 'hb-doublewall-paper-cups',
    name: 'Double-Wall Kraft Paper Coffee Cups (500 Pcs)',
    nameAr: 'كرتون أكواب ورقية دبل جدار عازلة مع أغطية محكمة (500 كوب)',
    tagline: 'Double-Wall Ripple Insulation · No Cup Sleeve Needed · Leak-Proof Lids',
    taglineAr: 'طبقتان عازلتان لحماية اليدين من الحرارة مع أغطية كبس مانعة للتسريب تماماً',
    category: 'accessories',
    basePrice: 185,
    originalPrice: 240,
    badge: 'Bulk Paper Cups',
    reviewCount: 142,
    rating: 4.88,
    heroBanner: {
      headlineEn: 'Double-Wall Kraft Coffee Cups (500 Pcs)',
      headlineAr: 'كرتون أكواب ورقية دبل جدار عازلة مع أغطية محكمة (500 كوب)',
      sloganEn: 'RIPPLE THERMAL SHIELD | Spill-Proof Commute & Commercial Grade',
      sloganAr: 'عزل حراري دبل جدار | أغطية محكمة مانعة للتسريب ومناسبة للسيارة',
      badgeEn: 'COMMERCIAL BULK 500',
      badgeAr: 'توريد المقاهي والمكاتب 500 كوب',
      bgGradient: 'from-[#1a140f] via-[#291e15] to-[#0e0a07]',
      heroImage: './src/assets/images/coffee_paper_cups_bulk_1791218958527.jpg',
      featuresEn: [
        'Double-Wall Insulated Ripple Paper',
        'Zero Sleeve Required Insulation',
        'Click-Tight Leak-Proof Sip Lids',
        '100% Biodegradable PLA Lined'
      ],
      featuresAr: [
        'طبقتان ورق مقوى عازل للحرارة',
        'لا حاجة للسليدج أو الواقي الورقي',
        'أغطية كبس محكمة مانعة للتسريب',
        'بطانة نباتية PLA صديقة للبيئة'
      ]
    },
    colors: [
      {
        name: 'Natural Kraft',
        nameAr: 'كرافت طبيعي أصيل',
        hex: '#A67B5B',
        image: './src/assets/images/coffee_paper_cups_bulk_1791218958527.jpg',
        priceDelta: 0
      },
      {
        name: 'Matte Charcoal Black',
        nameAr: 'أسود فاحم مطفي',
        hex: '#1F1E1D',
        image: './src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg',
        priceDelta: 25
      }
    ],
    storageOptions: [
      {
        capacity: '8oz / 240ml Bulk Pack',
        capacityAr: 'حجم 8 أونصة / 240 مل',
        ram: '500 Cups + 500 Tight Sip Lids',
        ramAr: 'كرتون 500 كوب + 500 غطاء محكم',
        priceDelta: 0
      },
      {
        capacity: '12oz / 350ml Bulk Pack',
        capacityAr: 'حجم 12 أونصة / 350 مل',
        ram: '500 Cups + 500 Tight Sip Lids',
        ramAr: 'كرتون 500 كوب + 500 غطاء محكم',
        priceDelta: 35
      }
    ],
    specs: [
      { label: 'Pack Quantity', value: '500 Heavy-Duty Cups + 500 Snug Lids', labelAr: 'الكمية الإجمالية', valueAr: '500 كوب دبل جدار + 500 غطاء شرب أسود' },
      { label: 'Thermal Shield', value: 'Double-Wall corrugated insulation (No cardboard sleeve required)', labelAr: 'العزل الحراري', valueAr: 'جدار مزدوج يعزل حرارة المشروب عن اليدين تماماً' },
      { label: 'Eco Certified', value: 'PLA Plant-Lined Biodegradable Virgin Fiber', labelAr: 'صديق للبيئة', valueAr: 'ورق طبيعي ببطانة نباتية خالية من البلاستيك الضار' }
    ],
    images: [
      './src/assets/images/coffee_paper_cups_bulk_1791218958527.jpg',
      './src/assets/images/product_ceramic_cups_set_1791217230149.jpg'
    ],
    overview: 'Premium double-wall ripple paper cups designed for offices, specialty coffee shops, catering events, and car commutes. Features click-tight sip lids that prevent road spills.',
    overviewAr: 'الخيار المفضل للمكاتب الفاخرة والمقاهي والمناسبات، جدار مزدوج عازل وأغطية محكمة تضمن عدم تسريب أي قطرة أثناء القيادة والحركة.',
    partsShowcase: [
      {
        id: 'part-pc-double-wall',
        tagEn: 'CORRUGATED THERMAL SHIELD',
        tagAr: 'طبقتان عازلتان تحميان اليدين',
        titleEn: 'Double-Wall Thermal Barrier: Zero Heat Transfer to Hands',
        titleAr: 'جدار مزدوج سميك يعزل حرارة القهوة المغلية تماماً دون الحاجة لكرتون واقٍ',
        descriptionEn: 'The corrugated air pocket trapped between the inner and outer paper layers provides superior thermal insulation. Hold steaming hot 90°C coffee comfortably without scalding your fingers.',
        descriptionAr: 'طبقة هواء عازلة محصورة بين الجدارين الداخلي والخارجي تعزل حرارة القهوة الساخنة حتى 90 درجة مئوية، مما يتيح حمل الكوب بأمان دون الحاجة إلى وضع سليف إضافي.',
        image: './src/assets/images/coffee_paper_cups_bulk_1791218958527.jpg',
        stats: [
          { labelEn: 'Layers', labelAr: 'عدد الطبقات', value: 'Double-Wall Core' },
          { labelEn: 'Sleeve Needed', labelAr: 'الحاجة لواقي', value: '0% None Required' },
          { labelEn: 'Paper Weight', labelAr: 'وزن الورق', value: '320g + 280g Kraft' }
        ]
      },
      {
        id: 'part-pc-in-use-drive',
        tagEn: 'CUPS IN-USE · COMMUTE & CAR FIT',
        tagAr: 'الأكواب أثناء الاستخدام · القيادة والتنقل اليومي',
        titleEn: 'Road-Tested Car Cup Holder Fit with Leak-Proof Drinking Flow',
        titleAr: 'مقاس متوافق مع كافة حاملات أكواب السيارات وتدفق سلس بدون تناثر',
        descriptionEn: 'Calibrated base diameter slots snugly into all automotive cup holders. Firm structural rim ensures the cup never crumples or leaks when lifted with one hand while driving.',
        descriptionAr: 'قاعدة مدببة متوافقة بدقة مع كافة حاملات الأكواب في السيارات السعودية، مع حافة علوية ملفوفة بقوة تمنع انطباق الكوب أو انسكاب القهوة أثناء المطبات والحركة.',
        image: './src/assets/images/saudi_cafe_machine_1791363309148.jpg',
        stats: [
          { labelEn: 'Car Fit', labelAr: 'حامل السيارة', value: 'Universal Fit' },
          { labelEn: 'Rim Rigidity', labelAr: 'صلابة الحافة', value: 'High Crush Proof' },
          { labelEn: 'Grip', labelAr: 'ثبات اليد', value: 'Non-Slip Texture' }
        ]
      },
      {
        id: 'part-pc-leakproof-lid',
        tagEn: 'CLICK-TIGHT SNAP LIDS',
        tagAr: 'أغطية كبس محكمة مانعة للتسريب',
        titleEn: 'Ergonomic Raised Sip Opening with Positive Click Seal',
        titleAr: 'غطاء شرب مرتفع بحافة كبس محكمة تمنع التسريب حتى عند الإمالة',
        descriptionEn: 'Features an audible snap click seal that forms an airtight bond with the cup rim. Raised sip spout and tiny air vent promote a smooth, splash-free liquid flow with thick crema.',
        descriptionAr: 'يتميز بصوت كبس واضح يؤكد إحكام الإغلاق مع حافة الكوب، مع فتحة شرب مرتفعة ومريح للشفاه وثقب تهوية دقيق يضمن نزول القهوة بانسيابية دون فوران.',
        image: './src/assets/images/coffee_barista_accessories_set_1791219198302.jpg',
        stats: [
          { labelEn: 'Seal Mechanism', labelAr: 'نوع القفل', value: 'Audible Click Snap' },
          { labelEn: 'Leak Proof', labelAr: 'منع التسريب', value: '100% Guaranteed' },
          { labelEn: 'Spout Height', labelAr: 'ارتفاع الفتحة', value: '14mm Ergonomic' }
        ]
      },
      {
        id: 'part-pc-eco-lining',
        tagEn: 'PLANT-BASED PLA LINING',
        tagAr: 'بطانة نباتية صحية قابلة للتحلل',
        titleEn: '100% Virgin Kraft Paper with Plant-Derived PLA Moisture Barrier',
        titleAr: 'ورق كرافت طبيعي بكر مع بطانة نباتية خالية من المواد الكيميائية الضارة',
        descriptionEn: 'Replaces conventional petroleum wax with renewable cornstarch PLA lining. Certified odorless, BPA-free, and leaves zero chemical aftertaste in delicate specialty coffee.',
        descriptionAr: 'يستبدل الطلاء البلاستيكي التقليدي ببطانة نباتية متطورة مصنوعة من نشا الذرة قابلة للتحلل، وخالية تماماً من الروائح أو المواد الضارة لحماية نكهة البن النقية.',
        image: './src/assets/images/saudi_coffee_collage_1791363410810.jpg',
        stats: [
          { labelEn: 'Lining Material', labelAr: 'مادة البطانة', value: 'Plant PLA Resin' },
          { labelEn: 'Chemicals', labelAr: 'المواد الضارة', value: '0% BPA Free' },
          { labelEn: 'Biodegradable', labelAr: 'قابلية التحلل', value: 'Eco Certified' }
        ]
      },
      {
        id: 'part-pc-bulk-supply',
        tagEn: 'BULK VALUE 500-PIECE CARTON',
        tagAr: 'كرتون تجاري اقتصادي 500 كوب',
        titleEn: 'Cost-Effective 500 Pack for Cafés, Corporate Offices & Events',
        titleAr: 'كرتون جملة اقتصادي يحتوي على 500 كوب + 500 غطاء محكم للمكاتب والمناسبات',
        descriptionEn: 'Packed in hygienic sealed sleeves of 50 cups each inside a heavy corrugated carton. Ideal for busy specialty coffee businesses, company breakrooms, and royal gatherings.',
        descriptionAr: 'مغلف في أكياس صحية محكمة يحتوي كل كيس على 50 كوباً داخل كرتون قوي، مثالي لشركات القهوة، ومكاتب العمل الفاخرة، ومناسبات الضيافة الكبرى بالمملكة.',
        image: './src/assets/images/coffee_people_luxury_lounge_1791221150246.jpg',
        stats: [
          { labelEn: 'Carton Count', labelAr: 'إجمالي الكرتون', value: '500 Cups + Lids' },
          { labelEn: 'Sleeve Bundles', labelAr: 'التغليف الداخلي', value: '10 × 50 Cups' },
          { labelEn: 'Shipping', labelAr: 'الشحن والتوصيل', value: 'Fast Express KSA' }
        ]
      }
    ]
  },

  // 7. Complete Luxury Espresso Corner Bar Station (Coffee Corners)
  {
    id: 'hb-luxury-corner-station',
    name: 'Master Barista Home Coffee Corner Station',
    nameAr: 'ركن القهوة المتكامل الفاخر مع رفوف زجاجية وإضاءة محيطية',
    tagline: 'Custom Fluted Bar Credenza · Integrated LED Rails · Concealed Water Line',
    taglineAr: 'ركن قهوة متكامل بتصميم مضلع وإضاءة ليد ذكية وتجهيز لتوصيل شبكة المياه والكهرباء',
    category: 'cabinets',
    basePrice: 2890,
    originalPrice: 3490,
    badge: 'Master Corner Station',
    reviewCount: 98,
    rating: 4.98,
    heroBanner: {
      headlineEn: 'Royal Arabesque Coffee Station',
      headlineAr: 'ركن القهوة المتكامل الفاخر مع رفوف زجاجية وإضاءة محيطية',
      sloganEn: 'ROYAL COFFEE BAR | The Ultimate Specialty Café Sanctuary',
      sloganAr: 'ركن القهوة الملكي | حول مجلسك إلى مقهى مختص متكامل',
      badgeEn: 'MASTER CORNER STATION',
      badgeAr: 'ركن القهوة المتكامل الفاخر',
      bgGradient: 'from-[#140e0c] via-[#241712] to-[#0a0706]',
      heroImage: './src/assets/images/coffee_corner_luxury_station_1791219182840.jpg',
      featuresEn: [
        'Sintered Stone Heat-Proof Worktop',
        'Built-in Waste Knock Drawer',
        'Warm Multi-Tier Ambient LED',
        '6 Concealed Power Sockets'
      ],
      featuresAr: [
        'سطح رخام بورسلان مقاوم للحرارة',
        'درج تخلص من البن مدمج وفتحة تنقيط',
        'إضاءة محيطية LED متعددة المستويات',
        '6 منافذ طاقة مخفية للأجهزة'
      ]
    },
    colors: [
      {
        name: 'Smoked Walnut & Brass',
        nameAr: 'جوز مدخن مع نحاس',
        hex: '#3E2723',
        image: './src/assets/images/coffee_corner_luxury_station_1791219182840.jpg',
        priceDelta: 0
      },
      {
        name: 'Natural Scandinavian Oak',
        nameAr: 'بلوط اسكندنافي طبيعي',
        hex: '#C29B62',
        image: './src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg',
        priceDelta: 200
      }
    ],
    storageOptions: [
      {
        capacity: 'Standard 140cm Setup',
        capacityAr: 'تصميم قياسي عرض 140 سم',
        ram: 'Base Cabinet + Dual Floating Shelves',
        ramAr: 'خزانة سفلية + رفين جداريين عائمين',
        priceDelta: 0
      },
      {
        capacity: 'Grand 180cm Executive',
        capacityAr: 'إصدار تنفيذي فاخر عرض 180 سم',
        ram: 'Includes Cup Rail + Knock Chute + LED',
        ramAr: 'يشمل سكة تعليق أكواب + درج بن مدمج + إضاءة LED',
        priceDelta: 650
      }
    ],
    specs: [
      { label: 'Total Dimensions', value: 'W 140cm × H 195cm × D 50cm', labelAr: 'الأبعاد الإجمالية', valueAr: 'العرض 140 سم × الارتفاع 195 سم × العمق 50 سم' },
      { label: 'Countertop', value: 'Sintered Stone Thermal Slab (Scratch & Heat Resistant)', labelAr: 'سطح العمل', valueAr: 'رخام صناعي بورسلان مقاوم للحرارة والخدش وسوائل القهوة' },
      { label: 'Built-in Features', value: 'Integrated Knock Box Drawer + Cup Drain Tray + 6 Power Sockets', labelAr: 'المزايا المدمجة', valueAr: 'درج تخلص من البن مدمج، صينية تصريف أكواب، و 6 منافذ طاقة مخفية' }
    ],
    images: [
      './src/assets/images/coffee_corner_luxury_station_1791219182840.jpg',
      './src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg'
    ],
    overview: 'The pinnacle of home barista luxury. Designed specifically for coffee lovers who want an all-in-one showpiece that organizes espresso machines, precision mills, syrups, and cups in pure harmony.',
    overviewAr: 'ركن القهوة المتكامل الفاخر الذي يحول منزلك إلى مقهى مختص. يتضمن سطوح بورسلان مقاومة للحرارة وأرفف إضاءة ليد مدمجة وأدراج لتنظيم كافة أدوات الباريستا.',
    partsShowcase: [
      {
        id: 'part-lcs-teak-credenza',
        tagEn: 'SOLID TEAK & SINTERED STONE',
        tagAr: 'خشب طبيعي فاخر مع رخام بورسلان صلب',
        titleEn: 'Royal Fluted Architectural Credenza & Sintered Slab',
        titleAr: 'دولاب خشبي مضلع فاخر مع سطح بورسلان حجري غير قابل للخدش',
        descriptionEn: 'Constructed from premium kiln-dried hardwoods with fluted side profiles and brushed brass handles. The sintered stone worktop withstands hot equipment and coffee spills effortlessly.',
        descriptionAr: 'مصنوع من أجود أنواع الأخشاب الصلبة المعالجة مع تفاصيل نحاسية مصقولة وسطح بورسلان حجري صلب يتحمل الأجهزة الثقيلة وسوائل القهوة الساخنة دون أي أثر.',
        image: './src/assets/images/coffee_corner_luxury_station_1791219182840.jpg',
        stats: [
          { labelEn: 'Wood Framework', labelAr: 'نوع الخشب', value: 'Solid Hardwood' },
          { labelEn: 'Counter Material', labelAr: 'خامة السطح', value: 'Sintered Stone' },
          { labelEn: 'Hardware Accent', labelAr: 'المقابض', value: 'Brushed Brass' }
        ]
      },
      {
        id: 'part-lcs-in-use-bar',
        tagEn: 'STATION IN-USE · COMPLETE HOME CAFÉ',
        tagAr: 'الركن أثناء الاستخدام · مقهى مختص متكامل في المنزل',
        titleEn: 'Accommodates Flagship Machines, Commercial Grinder & Pitchers',
        titleAr: 'مساحة فسيحة تستوعب مكائن الدبل بويلر والمطاحن وأطقم الأكواب وسيروب القهوة',
        descriptionEn: 'Deep 50cm workspace leaves ample clearance behind espresso machines for water reservoir refilling and portafilter rotation. Dual floating shelves keep cups within arms reach.',
        descriptionAr: 'عمق 50 سم يوفر مساحة خلفية واسعة لتعبئة خزان الماء وحرية حركة البورتافلتر، مع رفين جداريين زجاجيين فاخرين لعرض الأكواب وسيروبات القهوة بأناقة.',
        image: './src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg',
        stats: [
          { labelEn: 'Workspace Depth', labelAr: 'عمق السطح', value: '50cm Commercial' },
          { labelEn: 'Shelf Capacity', labelAr: 'سعة الأرفف', value: '24 Artisan Mugs' },
          { labelEn: 'Drain Pre-fit', labelAr: 'تصريف المياه', value: 'Ready for Plumbing' }
        ]
      },
      {
        id: 'part-lcs-knock-chute',
        tagEn: 'INTEGRATED KNOCK CHUTE',
        tagAr: 'درج تخلص من البن مدمج وصينية تصريف',
        titleEn: 'Integrated Soft-Damped Knock Box Drawer & Drip Drain',
        titleAr: 'درج نوك بوكس مدمج مبطن بالسيليكون لتفريغ كعكات القهوة دون فوضى',
        descriptionEn: 'Knock your spent coffee pucks silently into the heavy-duty stainless steel chute drawer. Removable container lifts out effortlessly for quick emptying into garden compost or trash.',
        descriptionAr: 'تخلص من كعكات القهوة المستخلصة فوراً بضربة واحدة في الدرج المدمج المبطن بربل مانع للصوت، مع وعاء داخلي قابل للرفع والغسيل السريع.',
        image: './src/assets/images/coffee_machine_story_craft_1791221163767.jpg',
        stats: [
          { labelEn: 'Knock Capacity', labelAr: 'سعة الدرج', value: '50 Coffee Pucks' },
          { labelEn: 'Damper', labelAr: 'امتصاص الصوت', value: 'Silicon Damped' },
          { labelEn: 'Drawer Action', labelAr: 'حركة الدرج', value: 'Soft-Close Glide' }
        ]
      },
      {
        id: 'part-lcs-ambient-light',
        tagEn: 'MULTI-TIER WARM AMBIENT LED',
        tagAr: 'إضاءة محيطية متعددة المستويات',
        titleEn: 'Multi-Tier Recessed 3000K LED Illuminating Glassware',
        titleAr: 'إضاءة محيطية مدمجة داخل الأرفف تبرز جمال الأواني الزجاجية والأكواب',
        descriptionEn: 'Independent LED light strips concealed inside each shelf layer create an exquisite twilight café ambiance in your living room or reception majlis during evening gatherings.',
        descriptionAr: 'أشرطة إضاءة LED خفية مدمجة أسفل كل رف تمنح ركن القهوة إشعاعاً ساحراً يماثل أفخم مقاهي الرياض وجدة أثناء استقبال الضيوف والمساءات الهادئة.',
        image: './src/assets/images/ramadan_coffee_corner_hero_1791364235712.jpg',
        stats: [
          { labelEn: 'LED Strips', labelAr: 'مستويات الإضاءة', value: '3-Tier Synchronized' },
          { labelEn: 'Color Temp', labelAr: 'درجة الدفء', value: '3000K Ambient' },
          { labelEn: 'Dimmer', labelAr: 'التحكم بالسطوع', value: 'Touch Dimmable' }
        ]
      },
      {
        id: 'part-lcs-white-glove',
        tagEn: 'WHITE-GLOVE KSA INSTALLATION',
        tagAr: 'توصيل وتركيب شامل بالمملكة',
        titleEn: 'Handcrafted Joinery with White-Glove Installation Across KSA',
        titleAr: 'تصنيع يدوي عالي الدقة مع خدمة توصيل وتركيب داخل منزلك في كافة مدن المملكة',
        descriptionEn: 'Delivered in custom shockproof packaging with specialized carpenters providing seamless white-glove setup and electrical check in Riyadh, Jeddah, Dammam, and across Saudi Arabia.',
        descriptionAr: 'يصلك الركن في صناديق خشبية محمية مع فريق فنيين مختصين يتولون التركيب وتوصيل الكهرباء والتثبيت الجداري داخل منزلك في كافة مدن المملكة.',
        image: './src/assets/images/coffee_people_luxury_lounge_1791221150246.jpg',
        stats: [
          { labelEn: 'Delivery Scope', labelAr: 'نطاق التوصيل', value: 'All KSA Cities' },
          { labelEn: 'Installation', labelAr: 'التركيب', value: 'White-Glove Included' },
          { labelEn: 'Warranty', labelAr: 'الضمان', value: '3 Years Structural' }
        ]
      }
    ]
  },

  // 8. Master Barista Precision Accessories Tool Set (Coffee Accessories)
  {
    id: 'hb-barista-accessories-kit',
    name: 'Master Barista 58mm Precision Tool Kit',
    nameAr: 'طقم إكسسوارات ومستلزمات الباريستا الاحترافي مقاس 58 ملم',
    tagline: 'Calibrated Spring Tamper · Needle WDT · Gravity Distributor · Knock Box',
    taglineAr: 'تامبر ضغط معاير بنابض + أداة تفكيك التكتلات الإبرية + موزع جاذبية + بتشر حليب وميزاب',
    category: 'accessories',
    basePrice: 299,
    originalPrice: 420,
    badge: 'Pro Barista Kit',
    reviewCount: 312,
    rating: 4.95,
    heroBanner: {
      headlineEn: 'Master Barista 58mm Precision Kit',
      headlineAr: 'طقم إكسسوارات ومستلزمات الباريستا الاحترافي مقاس 58 ملم',
      sloganEn: 'SCIENTIFIC PUCK PREP | Eliminate Channeling & Elevate Extraction',
      sloganAr: 'تحضير البن العلمي | تخلص من القنوات المائية واستمتع باستخلاص مثالي',
      badgeEn: 'PRO BARISTA KIT 58MM',
      badgeAr: 'عدة الباريستا الاحترافية',
      bgGradient: 'from-[#131317] via-[#202028] to-[#0c0c0e]',
      heroImage: './src/assets/images/hibrew_barista_kit_isolated.jpg',
      featuresEn: [
        '30lb Calibrated Self-Leveling Tamper',
        '8-Needle 0.35mm Magnetic WDT Tool',
        'Gravity Stepped Coffee Distributor',
        '304 Teflon Sharp-Spout Milk Pitcher'
      ],
      featuresAr: [
        'تامبر معاير ذاتي التسوية 30 باوند',
        'مفكك تكتلات WDT مغناطيسي 8 إبر',
        'موزع جاذبية متدرج لمساواة البن',
        'بتشر تبخير تيفلون بفتحة صب مدببة'
      ]
    },
    colors: [
      {
        name: 'Matte Black & Walnut',
        nameAr: 'أسود مطفي وخشب الجوز',
        hex: '#1B1B1E',
        image: './src/assets/images/hibrew_barista_kit_isolated.jpg'
      }
    ],
    storageOptions: [
      {
        capacity: '58mm Standard Kit (5 Tools)',
        capacityAr: 'طقم 58 مم القياسي (5 أدوات)',
        ram: 'Tamper + WDT + Distributor + Funnel + Mat',
        ramAr: 'تامبر + مفكك تكتلات + موزع + قمع + ربلة',
        priceDelta: 0
      },
      {
        capacity: 'Complete Pro Kit (8 Tools)',
        capacityAr: 'طقم المحترفين المتكامل (8 أدوات)',
        ram: 'Adds Walnut Knock Box + 450ml Pitcher + Brush',
        ramAr: 'إضافة صندوق تخلص بن جوز + بتشر 450 مل + فرشاة',
        priceDelta: 99
      }
    ],
    specs: [
      { label: 'Tamper Type', value: '30lb Constant Pressure Self-Leveling Spring Tamper', labelAr: 'نوع التامبر', valueAr: 'تامبر تسوية أوتوماتيكي بضغط ثابت 30 باوند' },
      { label: 'WDT Tool', value: '8 Stainless Steel 0.35mm Needles with Stand', labelAr: 'مفكك التكتلات', valueAr: '8 إبر ستانلس رفيعة جداً 0.35 ملم مع قاعدة مغناطيسية' },
      { label: 'Pitcher', value: '304 Stainless Steel Non-Stick Teflon with Sharp Pour Spout', labelAr: 'بتشر التبخير', valueAr: 'بتشر تيفلون بفتحة صب مدببة للتحكم باللاتيه آرت' }
    ],
    images: [
      './src/assets/images/coffee_barista_accessories_set_1791219198302.jpg',
      './src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg'
    ],
    overview: 'Everything needed to master coffee puck preparation and latte art. Prevents channeling, ensures flat compaction, and elevates the extraction of every coffee bean.',
    overviewAr: 'كل ما تحتاجه للتحضير الاحترافي لبودرة القهوة ورسم اللاتيه آرت. يمنحك ضغطاً متساوياً ويقضي على قنوات التدفق للحصول على قوام إسبريسو كريمي مثالي.',
    partsShowcase: [
      {
        id: 'part-bak-7piece-kit',
        tagEn: 'COMPLETE 7-PIECE BARISTA SUITE',
        tagAr: 'طقم باريستا احترافي متكامل من 7 قطع',
        titleEn: 'Precision Espresso Tooling Engineered for 58mm Standards',
        titleAr: 'مجموعة أدوات تحضير القهوة المختصة المصممة لمعايير 58 ملم التجارية',
        descriptionEn: 'Includes constant-force spring tamper, magnetic 8-needle WDT tool, gravity leveling distributor, magnetic dosing funnel, sharp spout milk pitcher, silicone station mat, and cleaning brush.',
        descriptionAr: 'يضم تامبر الضغط الثابت، وأداة تفكيك التكتلات WDT، وموزع الجاذبية، وحلقة الدوزينج فانل المغناطيسية، وبتشر التبخير التيفلون، وفرشاة التنظيف وقاعدة الكبس.',
        image: './src/assets/images/coffee_barista_accessories_set_1791219198302.jpg',
        stats: [
          { labelEn: 'Kit Pieces', labelAr: 'عدد القطع', value: '7 Pro Tools' },
          { labelEn: 'Compatibility', labelAr: 'المقاس المعتمد', value: '58.4 - 58.5mm' },
          { labelEn: 'Material', labelAr: 'الخامات', value: '304 Steel & Walnut' }
        ]
      },
      {
        id: 'part-bak-in-use-tamp',
        tagEn: 'TOOLS IN-USE · SPRING TAMPING',
        tagAr: 'الأدوات أثناء الاستخدام · كبس معاير بضغط 30 باوند',
        titleEn: '30lb Calibrated Self-Leveling Constant Force Compaction',
        titleAr: 'تامبر أوتوماتيكي بنابض معاير يضمن كبساً مستوياً 100% في كل مرة',
        descriptionEn: 'Dual internal calibrated springs deliver an exact 30-pound compression force with an integrated lip collar that rests squarely on the basket rim, eliminating tilted tamp errors entirely.',
        descriptionAr: 'نابض مزدوج يولد قوة ضغط ثابتة 30 باوند مع حافة تسوية ترتكز على حواف الباسكت لمنع أي ميلان في الكبس، مما يضمن تدفق الماء بالتساوي عبر قرص القهوة.',
        image: './src/assets/images/barista_tamping_shot_1791363346824.jpg',
        stats: [
          { labelEn: 'Spring Rating', labelAr: 'قوة النابض', value: '30 lbs Constant' },
          { labelEn: 'Leveling Guide', labelAr: 'حافة التسوية', value: 'Rim Rested Flange' },
          { labelEn: 'Base Finish', labelAr: 'قاعدة التامبر', value: 'Flat Mirror Steel' }
        ]
      },
      {
        id: 'part-bak-wdt-needle',
        tagEn: 'MAGNETIC WDT DE-CLUMPING',
        tagAr: 'أداة تفكيك التكتلات WDT فائقة النعومة',
        titleEn: '8 Surgical 0.35mm Needles Distributing Grounds Evenly',
        titleAr: '8 إبر جراحية رفيعة 0.35 ملم تكسر تكتلات البن وتوزع الحبيبات بانتظام',
        descriptionEn: 'Fine flexible 0.35mm medical-grade stainless steel needles sweep through the coffee basket, breaking up static lumps to create a uniform, fluffy coffee bed before tamping.',
        descriptionAr: 'إبر جراحية دقيقة للغاية بقطر 0.35 ملم تتغلغل في عمق الباسكت لتفكيك تكتلات الطحن الساكنة وتحويل البن إلى طبقة هشة ناعمة تمنع تشكل القنوات المائية السريعة.',
        image: './src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg',
        stats: [
          { labelEn: 'Needle Gauge', labelAr: 'سمك الإبر', value: '0.35mm Ultra-thin' },
          { labelEn: 'Needle Count', labelAr: 'عدد الإبر', value: '8 Flexible Needles' },
          { labelEn: 'Stand Dock', labelAr: 'قاعدة الحفظ', value: 'Magnetic Stand' }
        ]
      },
      {
        id: 'part-bak-milk-pitcher',
        tagEn: 'TEFLON SHARP POUR SPITTER',
        tagAr: 'بتشر تبخير تيفلون بفتحة صب مدببة',
        titleEn: 'Sharp V-Spout 450ml Teflon Pitcher for Fine Latte Art Control',
        titleAr: 'بتشر تبخير مطلي بالتيفلون غير اللاصق بفتحة صب حادة للتحكم بالرسم',
        descriptionEn: 'Non-stick matte black Teflon exterior with interior measuring markings. Precision sharp pouring beak grants micro-control when pouring intricate swan necks and tulip stacks.',
        descriptionAr: 'بتشر تبخير ستانلس 304 مطلي بالتيفلون الأسود المانع لالتصاق الحليب، مزود بفتحة صب مدببة تمنحك تحكماً ميكروسكوبياً في رسم أشكال اللاتيه المعقدة.',
        image: './src/assets/images/barista_milk_steaming_1791363367164.jpg',
        stats: [
          { labelEn: 'Pitcher Vol', labelAr: 'سعة البتشر', value: '450ml / 15oz' },
          { labelEn: 'Pour Spout', labelAr: 'فتحة الصب', value: 'Precision Sharp V' },
          { labelEn: 'Interior Scale', labelAr: 'التدريج الداخلي', value: 'Laser Etched ml/oz' }
        ]
      },
      {
        id: 'part-bak-silicone-station',
        tagEn: 'HEAVY SILICONE TAMPING MAT',
        tagAr: 'قاعدة كبس سيليكونية وموزع الجاذبية',
        titleEn: 'Corner Counter Silicone Tamping Station & Gravity Leveler',
        titleAr: 'قاعدة كبس زاوية لحماية أسطح الرخام وموزع جاذبية ثلاثي الشفرات',
        descriptionEn: 'Thick food-grade silicone mat hugs the counter edge securely to protect stone surfaces from portafilter dents. Paired with 3-blade distributor for effortless leveling.',
        descriptionAr: 'قاعدة سيليكون مرنة تثبت على حافة الطاولة لحماية أسطح الرخام من الخدش، مصحوبة بموزع قهوة ثلاثي الشفرات قابل لتعديل الارتفاع لمساواة السطح بلفة واحدة.',
        image: './src/assets/images/espresso_wood_pitcher_1791363392554.jpg',
        stats: [
          { labelEn: 'Mat Thickness', labelAr: 'سماكة القاعدة', value: '12mm Food Silicone' },
          { labelEn: 'Distributor', labelAr: 'الموزع', value: '3-Blade Stepped' },
          { labelEn: 'Cleaning', labelAr: 'التنظيف', value: 'Dishwasher Safe' }
        ]
      }
    ]
  },

  // 9. HiBrew H4A Portable 4-in-1 Travel Espresso Machine (Special Offer)
  {
    id: 'hb-h4a-portable-travel',
    name: 'HiBrew H4A 4-in-1 Portable Espresso Maker',
    nameAr: 'ماكينة القهوة المحمولة 4 في 1 هاي برو H4A (عرض خاص)',
    tagline: 'Self-Heating · 12V Car / USB / AC · Nespresso, Dolce Gusto & Ground',
    taglineAr: 'تسخين ذاتي ذكي تعمل في السيارة 12V والمنزل والرحلات لكافة الكبسولات والبن',
    category: 'offers',
    basePrice: 329,
    originalPrice: 450,
    badge: 'Special Offer -27%',
    reviewCount: 462,
    rating: 4.89,
    heroBanner: {
      headlineEn: 'HiBrew H4A 4-in-1 Portable Maker',
      headlineAr: 'ماكينة القهوة المحمولة 4 في 1 هاي برو H4A (عرض خاص)',
      sloganEn: '15-BAR ON-THE-GO | Fresh Hot Espresso Everywhere In One Touch',
      sloganAr: 'ضغط 15 بار وتسخين ذاتي | قهوتك الساخنة أينما كنت بلمسة واحدة',
      badgeEn: 'TRAVEL ESPRESSO 4-IN-1',
      badgeAr: 'ماكينة السفر والسيارة الذكية',
      bgGradient: 'from-[#071d38] via-[#0c2f5d] to-[#041121]',
      heroImage: './src/assets/images/hibrew_h4a_portable_isolated.jpg',
      featuresEn: [
        '15-Bar High Pressure Self-Heating',
        '12V Car, 220V Home & USB Power',
        'Nespresso, Dolce Gusto & Ground Fit',
        '5-Minute Rapid Cold Water Heating'
      ],
      featuresAr: [
        'ضغط 15 بار مع تسخين ذاتي ذكي',
        'تعمل في ولاعة السيارة والمنزل وبنك الطاقة',
        'متوافقة مع نسبريسو ودولتشي والبن المطحون',
        'تسخين فوري للماء البارد في 5 دقائق'
      ]
    },
    colors: [
      {
        name: 'Matte Black Travel',
        nameAr: 'أسود مطفي مدمج',
        hex: '#1E1E22',
        image: './src/assets/images/hibrew_h4a_portable_isolated.jpg'
      }
    ],
    storageOptions: [
      {
        capacity: 'Full Travel Bundle Kit',
        capacityAr: 'حقيبة السفر والتنقل المتكاملة',
        ram: 'Includes 12V Cable, USB & Case',
        ramAr: 'تشمل سلك سيارة 12V ووصلة USB وحقيبة صلبة',
        priceDelta: 0
      }
    ],
    specs: [
      { label: 'Pressure', value: '15-Bar High Pressure Self-Heating Extraction', labelAr: 'الضغط والتسخين', valueAr: 'ضغط 15 بار مع تسخين ذاتي سريع للماء البارد في 5 دقائق' },
      { label: 'Compatibility', value: 'Nespresso, Dolce Gusto Pods & Ground Coffee', labelAr: 'التوافقية', valueAr: 'متوافقة مع كبسولات نسبريسو ودولتشي والبن المطحون' },
      { label: 'Power', value: '12V Car Port / 220V Wall Adapter / 5V USB', labelAr: 'مصادر الطاقة', valueAr: 'ولاعة السيارة 12 فولت أو شاحن المنزل أو بنك الطاقة' }
    ],
    images: [
      './src/assets/images/hibrew_h4a_portable_isolated.jpg',
      './src/assets/images/hero_multicapsule_portable_1791217213863.jpg'
    ],
    overview: 'Make genuine rich-crema espresso anywhere: in your car during morning traffic, at the campsite, or in the office with simple one-button brewing.',
    overviewAr: 'استمتع بإسبريسو غني بالكريمة أينما كنت. ماكينة هاي برو المحمولة الأكثر مبيعاً في السعودية تعمل في سيارتك وتسخن الماء ذاتياً بلمسة زر.',
    partsShowcase: [
      {
        id: 'part-h4a-modular-chambers',
        tagEn: 'MODULAR 4-IN-1 POD SYSTEM',
        tagAr: 'نظام الحجرات المتعددة 4 في 1',
        titleEn: 'Interchangeable Adapters for Nespresso, Dolce Gusto & Ground Coffee',
        titleAr: 'حجرات قابلة للتبديل لكبسولات نسبريسو ودولتشي غوستو والبن المطحون',
        descriptionEn: 'Includes three precision food-safe modular pods. Swap in seconds to brew your favorite specialty Nespresso capsule, big Dolce Gusto drink, or freshly ground single-origin espresso.',
        descriptionAr: 'تتضمن 3 محولات ذكية سريعة الفك؛ يمكنك التبديل بين كبسولات نسبريسو، وكبسولات دولتشي غوستو الكبيرة، والبن المطحون الطازج بضغطة واحدة دون الحاجة لأدوات إضافية.',
        image: './src/assets/images/hero_multicapsule_portable_1791217213863.jpg',
        stats: [
          { labelEn: 'Pod Types', labelAr: 'أنواع الكبسولات', value: 'Nespresso & Dolce Gusto' },
          { labelEn: 'Ground Coffee', labelAr: 'البن المطحون', value: '10g Precision Pod' },
          { labelEn: 'Chamber Material', labelAr: 'خامة الحجرة', value: 'BPA-Free Tritan' }
        ]
      },
      {
        id: 'part-h4a-in-use-car',
        tagEn: 'MACHINE IN-USE · IN-CAR SELF-HEATING',
        tagAr: 'الماكينة أثناء الاستخدام · التسخين الذكي داخل السيارة',
        titleEn: '12V Cigarette Lighter Plug: Cold Water to Hot Espresso in 5 Min',
        titleAr: 'تعمل عبر ولاعة السيارة 12V لتسخين الماء البارد وتحضير الإسبريسو في 5 دقائق',
        descriptionEn: 'Plug directly into your car 12V port. The internal thermal coil heats cold bottled water to 92°C and automatically triggers high-pressure extraction directly into the drinking cup.',
        descriptionAr: 'وصل الماكينة بمنفذ ولاعة السيارة 12 فولت وضع ماء الشرب البارد؛ يقوم السخان الذكي برفع الحرارة إلى 92 درجة مئوية وضخ الإسبريسو الساخن بالكريمة مباشرة في كوبك أثناء زحام الصباح.',
        image: './src/assets/images/saudi_cafe_machine_1791363309148.jpg',
        stats: [
          { labelEn: 'Heating Time', labelAr: 'وقت التسخين', value: '5 Minutes Rapid' },
          { labelEn: 'Car Power', labelAr: 'كهرباء السيارة', value: '12V DC 80W' },
          { labelEn: 'Cup Volume', labelAr: 'سعة الكوب', value: '60ml Double Shot' }
        ]
      },
      {
        id: 'part-h4a-15bar-crema',
        tagEn: '15-BAR REAL ESPRESSO PUMP',
        tagAr: 'مضخة 15 بار إيطالية لاستخلاص الكريمة',
        titleEn: 'High-Pressure Micro Pump Delivering Thick Golden Crema',
        titleAr: 'مضخة ضغط ميكرو 15 بار تستخلص كريمة كثيفة ونكهة غنية أينما كنت',
        descriptionEn: 'Unlike weak battery hand drippers, the H4A features an authentic high-pressure piston pump that forces boiling water through dense coffee grinds at 15-bar commercial strength.',
        descriptionAr: 'على عكس الأجهزة اليدوية الضعيفة، تحتوي ماكينة H4A على مضخة مكبسية حقيقية بقوة 15 بار تدفع الماء الساخن عبر مسحوق البن لتنتج كريمة ذهبية كثيفة تماماً كالمكائن المنزلية الكبيرة.',
        image: './src/assets/images/barista_crema_macro_1791363328316.jpg',
        stats: [
          { labelEn: 'Pump Pressure', labelAr: 'قوة الضغط', value: '15-Bar High Pressure' },
          { labelEn: 'Crema Layer', labelAr: 'طبقة الكريمة', value: 'Authentic Dense' },
          { labelEn: 'Extraction Temp', labelAr: 'حرارة الاستخلاص', value: '92°C Calibrated' }
        ]
      },
      {
        id: 'part-h4a-triple-power',
        tagEn: 'TRIPLE POWER FLEXIBILITY',
        tagAr: 'مرونة ثلاثية لمصادر الطاقة',
        titleEn: 'Car 12V, Home 220V Wall Adapter, and USB Power Bank Mode',
        titleAr: 'محول منزلي 220 فولت، ولاعة سيارة 12 فولت، وسلك USB للاستخدام المكتبي',
        descriptionEn: 'Complete flexibility for work and travel. Use 12V in vehicles for self-heating, the included 220V home adapter for instant power, or standard 5V USB for pre-boiled hot water extraction.',
        descriptionAr: 'تنوع استثنائي للطاقة؛ استخدم منفذ السيارة 12V للتسخين الذاتي، أو فيش المنزل 220V للتحضير السريع، أو بنك الطاقة وسلك USB للاستخلاص الفوري عند استخدام ماء ساخن.',
        image: './src/assets/images/coffee_machine_parts_reveal_1791221110232.jpg',
        stats: [
          { labelEn: 'Power Sources', labelAr: 'خيارات الطاقة', value: '12V / 220V / 5V USB' },
          { labelEn: 'Adapters', labelAr: 'المحولات المرفقة', value: 'All Included' },
          { labelEn: 'Auto-Shutoff', labelAr: 'الأمان الذكي', value: 'Overheat Protection' }
        ]
      },
      {
        id: 'part-h4a-case-warranty',
        tagEn: 'TRAVEL CASE & 2-YEAR KSA WARRANTY',
        tagAr: 'حقيبة تنقل فاخرة وضمان سنتين بالمملكة',
        titleEn: 'Hard Shockproof Carrying Case & Authorized KSA Agency Warranty',
        titleAr: 'حقيبة سفر صلبة مبطنة ضد الصدمات مع ضمان الوكيل سنتين بالسعودية',
        descriptionEn: 'Includes a rugged molded travel case that neatly organizes the machine, all 3 capsule adapters, power cables, and folding stand. Backed by 2-year KSA agency warranty.',
        descriptionAr: 'تأتي داخل حقيبة سفر صلبة ومبطنة تحفظ الماكينة وكافة محولات الكبسولات والأسلاك في مكان واحد للرحلات والتخييم، مع ضمان الوكيل المعتمد سنتين في السعودية.',
        image: './src/assets/images/coffee_machine_story_craft_1791221163767.jpg',
        stats: [
          { labelEn: 'Agency Warranty', labelAr: 'ضمان الوكيل', value: '2 Years Full' },
          { labelEn: 'Carry Case', labelAr: 'حقيبة الحفظ', value: 'EVA Shockproof' },
          { labelEn: 'Net Weight', labelAr: 'الوزن الصافي', value: '575g Ultra-Light' }
        ]
      }
    ]
  },

  // 10. Barista Smart Scale with Auto-Timer & Flow Rate
  {
    id: 'hb-smart-scale-timer',
    name: 'Precision Barista Smart Scale with Flow Timer',
    nameAr: 'ميزان القهوة الذكي مع مؤقت تلقائي وحساس دقة 0.1 جرام',
    tagline: '0.1g Precision · Auto-Tare & Auto-Timer · Type-C Fast Charging',
    taglineAr: 'حساس فائق الدقة 0.1 جرام مع مؤقت تلقائي لحساب وقت التدفق وشحن تايب سي',
    category: 'accessories',
    basePrice: 145,
    originalPrice: 195,
    badge: 'Smart Barista',
    reviewCount: 388,
    rating: 4.93,
    heroBanner: {
      headlineEn: 'Precision Barista Smart Scale',
      headlineAr: 'ميزان القهوة الذكي مع مؤقت تلقائي وحساس دقة 0.1 جرام',
      sloganEn: '0.1G FLOW SENSING | Master Every Second & Gram Of Your Extraction',
      sloganAr: 'حساس دقة 0.1 جرام | تحكم بأدق ثانية وجرام في استخلاص القهوة',
      badgeEn: 'SMART FLOW SCALE',
      badgeAr: 'ميزان ذكي بمؤقت تدفق تلقائي',
      bgGradient: 'from-[#111317] via-[#1b2028] to-[#0a0c0e]',
      heroImage: './src/assets/images/hibrew_scale_isolated.jpg',
      featuresEn: [
        '0.1g High Precision Sensor',
        'Auto-Tare & Auto-Flow Detection',
        'Hidden LED Touch Screen Interface',
        '1600mAh USB-C Lithium Cell'
      ],
      featuresAr: [
        'حساس معملي دقيق 0.1 جرام',
        'تصفير ومؤقت تلقائي فور نزول القهوة',
        'شاشة لمس LED خفية عالية السطوع',
        'بطارية ليثيوم تدوم 3 أشهر مع شحن تايب سي'
      ]
    },
    colors: [
      {
        name: 'Matte Stealth Black',
        nameAr: 'أسود مطفي خفي',
        hex: '#121214',
        image: './src/assets/images/hibrew_scale_isolated.jpg'
      }
    ],
    storageOptions: [
      {
        capacity: 'Standard Barista Scale',
        capacityAr: 'ميزان الباريستا الذكي القياسي',
        ram: 'Includes Silicone Heat Pad',
        ramAr: 'يشمل ربلة حماية سيليكون مقاومة للحرارة',
        priceDelta: 0
      }
    ],
    specs: [
      { label: 'Resolution', value: '0.1g (Range 0.5g – 2000g)', labelAr: 'دقة الحساس', valueAr: 'دقة 0.1 جرام من نصف جرام حتى 2000 جرام' },
      { label: 'Auto Extraction', value: 'Detects First Drop & Auto-Starts Timer', labelAr: 'المؤقت الذكي', valueAr: 'يبدأ العداد فور نزول أول قطرة إسبريسو تلقائياً' },
      { label: 'Battery', value: '1600mAh USB-C Lithium Cell (3 Months Battery Life)', labelAr: 'البطارية', valueAr: 'بطارية ليثيوم 1600mAh تدوم حتى 3 أشهر بشحنة واحدة' }
    ],
    images: [
      './src/assets/images/hibrew_scale_isolated.jpg',
      './src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg'
    ],
    overview: 'Precision dialing tool for consistent espresso shots and pour-overs. Hidden LED touch screen lights up instantly upon weighing.',
    overviewAr: 'الأداة الأساسية لوزن حبوب القهوة وجرعات الإسبريسو بدقة بالغة لضمان ثبات النكهة في كل كوب.',
    partsShowcase: [
      {
        id: 'part-scale-sensor',
        tagEn: '0.1G LABORATORY STRAIN SENSOR',
        tagAr: 'حساس معملي دقيق 0.1 جرام',
        titleEn: 'High-Speed Microprocessor with Instantaneous 0.1g Response',
        titleAr: 'معالج إلكتروني فائق السرعة بحساسية قياس لحظية بدقة 0.1 جرام',
        descriptionEn: 'Equipped with medical-grade strain gauge sensors that react within milliseconds. Weigh roasted coffee beans, espresso yield, or V60 water ratio with absolute scientific accuracy.',
        descriptionAr: 'مزود بحساسات إلكترونية عالية التردد تستجيب لأقل من عُشر الجرام خلال أجزاء من الثانية، لوزن حبوب البن وجرعة الإسبريسو ومعدل تدفق التقطير بمنتهى الدقة.',
        image: './src/assets/images/product_ceramic_cups_set_1791217230149.jpg',
        stats: [
          { labelEn: 'Resolution', labelAr: 'دقة الحساس', value: '0.1g Precise' },
          { labelEn: 'Weight Range', labelAr: 'مجال الوزن', value: '0.5g - 2000g' },
          { labelEn: 'Response Time', labelAr: 'سرعة الاستجابة', value: '< 20ms Instant' }
        ]
      },
      {
        id: 'part-scale-in-use-flow',
        tagEn: 'SCALE IN-USE · SMART FLOW DETECTION',
        tagAr: 'الميزان أثناء الاستخدام · مؤقت التدفق الذكي',
        titleEn: 'Auto-Tare & First-Drop Espresso Extraction Timing',
        titleAr: 'تصفير تلقائي وبدء المؤقت فور سقوط أول قطرة إسبريسو في الكوب',
        descriptionEn: 'Place your cup under the portafilter; the scale zeroes out tare weight automatically. As soon as the first golden droplet touches the cup, the stopwatch triggers without touching a button.',
        descriptionAr: 'ضع فنجانك أسفل البورتافلتر ليقوم الميزان بتصفير الوزن ذاتياً. وفور نزول أول قطرة إسبريسو، ينطلق المؤقت الرقمي تلقائياً دون الحاجة للمس أي زر بيديك.',
        image: './src/assets/images/coffee_making_crema_flow_1791221127339.jpg',
        stats: [
          { labelEn: 'Smart Mode', labelAr: 'الوضع الذكي', value: 'Auto-Tare & Timer' },
          { labelEn: 'Drop Sensing', labelAr: 'حساس القطرات', value: 'First Drop Detect' },
          { labelEn: 'Stopwatch', labelAr: 'العداد الزمني', value: '0 - 9:59 Mins' }
        ]
      },
      {
        id: 'part-scale-compact-tray',
        tagEn: 'SLIM DRIP TRAY PROFILE',
        tagAr: 'سمك نحيف يتسع لجميع صواني المكائن',
        titleEn: 'Ultra-Slim 20mm Profile Fitting Commercial Drip Trays',
        titleAr: 'سماكة نحيفة 20 ملم تتسع بسلاسة تحت مقبس أي ماكينة قهوة منزلية وتجارية',
        descriptionEn: 'Engineered with a low-profile 130mm x 150mm silhouette that slips neatly onto the drip tray beneath commercial bottomless portafilters and cups without crowding.',
        descriptionAr: 'تصميم فائق النحافة بمقاس 130 × 150 ملم وسماكة 2 سم فقط، يدخل بسهولة فوق صينية التنقيط تحت البورتافلتر مباشرة دون أن يضيق على ارتفاع الأكواب.',
        image: './src/assets/images/hibrew_barista_pro_details_showcase_1791364980884.jpg',
        stats: [
          { labelEn: 'Thickness', labelAr: 'سماكة الميزان', value: '20mm Ultra-Slim' },
          { labelEn: 'Dimensions', labelAr: 'الأبعاد', value: '130 × 150 mm' },
          { labelEn: 'Tray Fit', labelAr: 'توافق المكائن', value: 'All Espresso Trays' }
        ]
      },
      {
        id: 'part-scale-typec-battery',
        tagEn: '1600MAH USB-C LITHIUM CELL',
        tagAr: 'بطارية ليثيوم 1600mAh مع شحن سريع',
        titleEn: 'Type-C Fast Charging with 3 Months Daily Barista Standby',
        titleAr: 'منفذ شحن تايب سي مع بطارية ليثيوم تدوم حتى 90 يوماً من الاستخدام اليومي',
        descriptionEn: 'No need for disposable alkaline batteries. The integrated high-density lithium polymer battery charges in 1 hour via standard USB-C and features smart auto-power sleep.',
        descriptionAr: 'وداعاً للبطاريات الجافة المستهلكة؛ بطارية ليثيوم بوليمر مدمجة تشحن خلال ساعة واحدة عبر كابل Type-C وتدوم حتى 3 أشهر مع نظام إيقاف التشغيل التلقائي لحفظ الطاقة.',
        image: './src/assets/images/coffee_machine_parts_reveal_1791221110232.jpg',
        stats: [
          { labelEn: 'Battery Cell', labelAr: 'سعة البطارية', value: '1600mAh Li-Po' },
          { labelEn: 'Charging Port', labelAr: 'منفذ الشحن', value: 'USB-C Fast' },
          { labelEn: 'Standby Time', labelAr: 'مدة الصمود', value: 'Up to 90 Days' }
        ]
      },
      {
        id: 'part-scale-silicone-pad',
        tagEn: 'WATERPROOF SILICONE HEAT PAD',
        tagAr: 'واقي سيليكوني عازل للحرارة والماء',
        titleEn: 'Removable Silicone Thermal Mat & Sealed Splash Protection',
        titleAr: 'غطاء سيليكوني مانع للانزلاق والحرارة ومقاوم لانسكاب السوائل المغلية',
        descriptionEn: 'Includes a grooved, heat-insulated silicone pad that prevents thermal drift on the sensor from scalding cups while protecting the hidden LED display against liquid spills.',
        descriptionAr: 'يأتي مع وسادة سيليكونية مضلعة عازلة تمنع انتقال حرارة الكوب الساخن إلى الحساس الداخلي، وتحمي شاشة الـ LED الخفية من أي قطرات ماء أو قهوة.',
        image: './src/assets/images/espresso_wood_pitcher_1791363392554.jpg',
        stats: [
          { labelEn: 'Thermal Shield', labelAr: 'عزل الحرارة', value: 'Up to 100°C' },
          { labelEn: 'Spill Resistance', labelAr: 'مقاومة الماء', value: 'Splash Sealed' },
          { labelEn: 'Pad Material', labelAr: 'خامة الواقي', value: 'Food-Grade Silicon' }
        ]
      }
    ]
  },

  // 11. Saudi National Day 96 Special V60 Pour-Over Luxury Kit
  {
    id: 'hb-v60-complete-kit',
    name: 'Royal Saudi 96 V60 Pour-Over & Kettle Master Set',
    nameAr: 'بكج التقطير الملكي V60 وغلاية التحكم الرقمي (إصدار اليوم الوطني 96)',
    tagline: 'Precision Gooseneck Kettle · Spiral Crystal Dripper · Hand Grinder · Smart Scale',
    taglineAr: 'غلاية عنق الإوزة الكهربائية مع قمع زجاجي حلزوني V60 ومطحنة يدوية وميزان ذكي في حقيبة جلدية',
    category: 'offers',
    basePrice: 599,
    originalPrice: 890,
    badge: 'National Day 96 Special',
    reviewCount: 421,
    rating: 4.98,
    heroBanner: {
      headlineEn: 'Royal Saudi 96 V60 Master Set',
      headlineAr: 'بكج التقطير الملكي V60 وغلاية التحكم الرقمي (إصدار اليوم الوطني 96)',
      sloganEn: 'ROYAL SAUDI 96 | The Master Artisan Pour-Over Collection',
      sloganAr: 'إصدار اليوم الوطني 96 | بكج التقطير الملكي الفاخر لعشاق القهوة المختصة',
      badgeEn: 'NATIONAL DAY 96 SPECIAL',
      badgeAr: 'إصدار خاص باليوم الوطني 96',
      bgGradient: 'from-[#032a15] via-[#054322] to-[#011409]',
      heroImage: './src/assets/images/hibrew_v60_isolated.jpg',
      featuresEn: [
        '1000W PID Gooseneck Electric Kettle',
        'High Borosilicate Spiral Glass V60',
        'CNC 420 Stainless Steel Hand Grinder',
        'Reinforced Traveling Leatherette Case'
      ],
      featuresAr: [
        'غلاية عنق الإوزة الذكية 1000 واط',
        'قمع زجاجي حلزوني V60 مع قاعدة خشبية',
        'مطحنة يدوية بتروس ستانلس ستيل 420',
        'حقيبة جلدية فاخرة مبطنة ضد الصدمات'
      ]
    },
    colors: [
      {
        name: 'Saudi Emerald & Gold',
        nameAr: 'أخضر زمردي وذهبي ملكي',
        hex: '#006C35',
        image: './src/assets/images/hibrew_v60_isolated.jpg',
        priceDelta: 0
      },
      {
        name: 'Matte Obsidian Black',
        nameAr: 'أسود مطفي ملوكي',
        hex: '#18181B',
        image: './src/assets/images/saudi_national_day_coffee_hero_1791364192381.jpg',
        priceDelta: 60
      }
    ],
    storageOptions: [
      {
        capacity: 'Complete 8-Piece Set',
        capacityAr: 'طقم V60 متكامل (8 قطع)',
        ram: 'Includes Dripper, Server, Kettle, Grinder, Scale & Case',
        ramAr: 'يشمل قمع تقطير، سيرفر، غلاية ترشيح، مطحنة يدوية، ميزان وحقيبة',
        priceDelta: 0
      },
      {
        capacity: 'Pro Specialty Edition',
        capacityAr: 'الإصدار المختص الممتاز',
        ram: 'Includes 100 Japanese Paper Filters + 250g Khawlani Beans',
        ramAr: 'يشمل 100 فلتر ورقي ياباني + 250 جم بن خولاني فاخر',
        priceDelta: 69
      }
    ],
    warranties: [
      { id: 'agency-2y', name: '2-Year Agency Warranty on Electric Kettle & Scale', nameAr: 'ضمان الوكيل سنتين للغلاية والميزان الإلكتروني', price: 0 }
    ],
    bundles: [
      {
        id: 'bundle-khawlani',
        name: 'Saudi Khawlani Specialty Coffee Beans (250g)',
        nameAr: 'محصول بن خولاني سعودي فاخر 250 جرام',
        price: 75,
        originalPrice: 95,
        image: './src/assets/images/saudi_national_day_coffee_hero_1791364192381.jpg'
      }
    ],
    specs: [
      { label: 'Electric Kettle', value: '1000W PID Gooseneck Kettle (1°C Temperature Accuracy)', labelAr: 'الغلاية الذكية', valueAr: 'غلاية عنق الإوزة 1000 واط مع تحكم رقمي بدرجة الحرارة بالدرجة المئوية' },
      { label: 'Dripper', value: 'High Borosilicate Spiral Glass V60 with Walnut Base', labelAr: 'قمع التقطير', valueAr: 'زجاج بوروسيليكات حراري حلزوني V60 مع قاعدة خشبية فاخرة' },
      { label: 'Hand Grinder', value: 'CNC 420 Stainless Steel Pentagonal Burrs with Dual Bearing', labelAr: 'المطحنة اليدوية', valueAr: 'تروس ستانلس ستيل خماسية دقيقة مع محاور مزدوجة لطحن متجانس' },
      { label: 'Carry Case', value: 'Shockproof Reinforced Leatherette Traveling Case', labelAr: 'حقيبة التنقل', valueAr: 'حقيبة مبطنة فاخرة ضد الصدمات لحمل كامل أدوات التقطير' }
    ],
    images: [
      './src/assets/images/saudi_national_day_coffee_hero_1791364192381.jpg',
      './src/assets/images/saudi_coffee_collage_1791363410810.jpg',
      './src/assets/images/coffee_barista_accessories_set_1791219198302.jpg'
    ],
    overview: 'Celebrate Saudi National Day 96 with the quintessential artisan pour-over master collection. Features commercial-grade precision tools to extract exquisite aroma notes from your favorite single-origin beans.',
    overviewAr: 'احتفل باليوم الوطني 96 مع بكج التقطير المتكامل الفاخر. يجمع بين غلاية عنق الإوزة الدقيقة، وقمع زجاجي عالي الجودة، ومطحنة تروس ستانلس، وميزان دقيق لتحضير ألذ كوب قهوة مختصة أينما كنت.',
    partsShowcase: [
      {
        id: 'part-v60-complete-station',
        tagEn: 'ROYAL SAUDI 96 MASTER SUITE',
        tagAr: 'بكج التقطير الملكي المتكامل 8 قطع',
        titleEn: 'Complete 8-Piece Artisan Pour-Over Set with Saudi Khawlani Beans',
        titleAr: 'طقم متكامل يضم غلاية رقمية وقمع حلزوني ومطحنة يدوية وميزان وبن خولاني',
        descriptionEn: 'The quintessential specialty coffee collection. Features precision 1000W temperature-controlled gooseneck kettle, glass V60 server, hand grinder, smart scale, filters, and a gift bag of authentic Khawlani beans.',
        descriptionAr: 'طقم التقطير الملكي المتكامل لعشاق القهوة المقطرة؛ غلاية عنق الإوزة بالتحكم الرقمي، وسيرفر وقمع V60 زجاجي، ومطحنة ستانلس يدوية، وميزان ذكي، ومحصول بن خولاني فاخر.',
        image: './src/assets/images/saudi_national_day_coffee_hero_1791364192381.jpg',
        stats: [
          { labelEn: 'Piece Count', labelAr: 'عدد القطع', value: '8 Master Pieces' },
          { labelEn: 'Kettle Power', labelAr: 'قوة الغلاية', value: '1000W PID Temp' },
          { labelEn: 'Edition', labelAr: 'نوع الإصدار', value: 'National Day 96' }
        ]
      },
      {
        id: 'part-v60-in-use-kettle',
        tagEn: 'SET IN-USE · GOOSENECK 90° WATER FLOW',
        tagAr: 'الأدوات أثناء الاستخدام · صب عمودي وانبعاث الروائح الزكية',
        titleEn: 'Precision Gooseneck Spout Controlling 90° Spiral Blooming Flow',
        titleAr: 'عنق إوزة منحني يمنحك تدفق ماء عمودي 90 درجة للترطيب والتقطير الحلزوني',
        descriptionEn: 'Ergonomic counterbalance handle and gooseneck spout deliver a steady, non-turbulent vertical water stream. Control extraction saturation with millimeter precision for floral and fruity notes.',
        descriptionAr: 'عنق منحني مصمم بدقة هيدروليكية يصب الماء عمودياً بزاوية 90 درجة بدون أي اندفاع عنيف، مما يتيح لك صباً حلزونياً هادئاً يبرز إيحاءات البن الزهرية والفواحة.',
        image: './src/assets/images/saudi_coffee_collage_1791363410810.jpg',
        stats: [
          { labelEn: 'Spout Angle', labelAr: 'زاوية الصب', value: '90° Vertical Steady' },
          { labelEn: 'PID Precision', labelAr: 'دقة الحرارة', value: '±1°C Digital' },
          { labelEn: 'Water Volume', labelAr: 'سعة الغلاية', value: '800ml Precision' }
        ]
      },
      {
        id: 'part-v60-cnc-grinder',
        tagEn: 'CNC 420 STAINLESS HAND BURRS',
        tagAr: 'مطحنة يدوية بتروس ستانلس ستيل 420',
        titleEn: 'Dual-Bearing CNC Pentagonal Burrs with Smooth Rotation',
        titleAr: 'محاور دوران مزدوجة وتروس خماسية تقطع البن دون توليد ذرات غبارية ناعمة',
        descriptionEn: 'Machined from hardened 420 stainless steel with dual ball-bearings that eliminate shaft wobble. Produces exceptionally uniform particle size distributions for clear, clean pour-over cups.',
        descriptionAr: 'مطحنة يدوية فاخرة بهيكل ألمنيوم مخرط وتروس خماسية من الفولاذ المقاوم للصدأ 420 مع رمان بلي مزدوج يمنع اهتزاز المحور، لطحن متجانس يمنحك كوباً نقياً خالياً من المرارة.',
        image: './src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg',
        stats: [
          { labelEn: 'Burr Steel', labelAr: 'معدن التروس', value: 'CNC 420 Stainless' },
          { labelEn: 'Bearings', labelAr: 'المحامل', value: 'Dual Ball Bearings' },
          { labelEn: 'Hopper Load', labelAr: 'سعة المطحنة', value: '25g Coffee Dose' }
        ]
      },
      {
        id: 'part-v60-spiral-dripper',
        tagEn: 'BOROSILICATE SPIRAL GLASS V60',
        tagAr: 'قمع زجاجي حلزوني بوروسيليكات وقاعدة خشبية',
        titleEn: 'Thermal Spiral Ribs Enhancing Aerodynamic Air Circulation',
        titleAr: 'أضلاع حلزونية بارزة تعزز دوران الهواء وتدفق الاستخلاص المنتظم',
        descriptionEn: 'Hand-blown high borosilicate crystal glass with internal spiral vortex ribs that guide water downward without stalling against the paper filter. Sits on a solid natural walnut ring collar.',
        descriptionAr: 'قمع زجاجي سميك يتحمل الصدمات الحرارية بأضلاع حلزونية داخلية تمنع التصاق الفلتر الورقي وتضمن تدفقاً انسيابياً للهواء، يرتكز على حلقة خشبية فاخرة.',
        image: './src/assets/images/product_ceramic_cups_set_1791217230149.jpg',
        stats: [
          { labelEn: 'Glass Grade', labelAr: 'نوع الزجاج', value: 'High Borosilicate' },
          { labelEn: 'Rib Pattern', labelAr: 'الأضلاع', value: 'Spiral Vortex 60°' },
          { labelEn: 'Collar Base', labelAr: 'القاعدة', value: 'Solid Natural Walnut' }
        ]
      },
      {
        id: 'part-v60-leather-case',
        tagEn: 'SHOCKPROOF LEATHERETTE TRAVEL CASE',
        tagAr: 'حقيبة جلدية فاخرة وضمان سنتين بالمملكة',
        titleEn: 'Reinforced Travel Case & 2-Year KSA Agency Warranty on Electric Tools',
        titleAr: 'حقيبة جلدية مبطنة ضد الصدمات مع ضمان الوكيل سنتين للغلاية والميزان',
        descriptionEn: 'Custom molded compartments secure the kettle, glass server, grinder, scale, dripper, and cups safely during camping trips and desert getaways. Backed by full 2-year KSA agency warranty.',
        descriptionAr: 'حقيبة جلدية فخمة بأقسام داخلية مبطنة بإسفنج كثيف تحمي كافة الأدوات الزجاجية والكهربائية أثناء رحلات البر والسفر، مع ضمان سنتين معتمد للغلاية والميزان.',
        image: './src/assets/images/coffee_barista_accessories_set_1791219198302.jpg',
        stats: [
          { labelEn: 'Agency Warranty', labelAr: 'ضمان الوكيل', value: '2 Years Electric' },
          { labelEn: 'Case Build', labelAr: 'خامة الحقيبة', value: 'Reinforced Leatherette' },
          { labelEn: 'Portability', labelAr: 'التنقل', value: 'Travel & Outdoor Ready' }
        ]
      }
    ]
  }
];

export const HONOR_EVENTS: HonorBannerEvent[] = [
  {
    id: 'event-coffee-lounge-experience',
    title: 'The Arabian Coffee Ritual & Luxury Tasting',
    titleAr: 'طقوس وتذوق القهوة في المجالس الفاخرة',
    subtitle: 'Savor artisanal single-origin brews crafted by master baristas',
    subtitleAr: 'تجربة حية لتذوق أندر محاصيل البن المختص واستخلاص الإسبريسو الفاخر',
    image: './src/assets/images/coffee_people_luxury_lounge_1791221150246.jpg'
  },
  {
    id: 'event-golden-crema-extraction',
    title: 'Velvety Golden Crema Flow & 58mm Dynamics',
    titleAr: 'استخلاص الإسبريسو وتدفق الكريمة الذهبية 58 مم',
    subtitle: 'Naked bottomless portafilter micro-laser extraction at 20-Bar pressure',
    subtitleAr: 'تدفق سلس ومتوازن للكريمة الذهبية عبر بورتافلتر مكشوف معزول حرارياً',
    image: './src/assets/images/coffee_making_crema_flow_1791221127339.jpg'
  },
  {
    id: 'event-artisan-roastery',
    title: 'Artisan Single-Origin Roastery Partners',
    titleAr: 'شراكات المحامص السعودية الفاخرة للقهوة المختصة',
    subtitle: 'Curated Ethiopian, Colombian, and Saudi Khawlani Special Reserves',
    subtitleAr: 'أندر محاصيل القهوة المختصة الإثيوبية والكولومبية والخولانية الفاخرة',
    image: './src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg'
  }
];

export const HONOR_TECHNOLOGY: HonorTechnology[] = [
  {
    id: 'tech-parts-reveal-engineering',
    title: 'Exploded Technical Architecture & Dual Brass Boilers',
    titleAr: 'الهندسة الداخلية وتفكيك دبل بويلر النحاسي',
    subtitle: 'Independent electronic heating blocks guarantee consistent brew & steam temperature',
    subtitleAr: 'نظام دبل بويلر نحاسي منفصل مع مضخة 20 بار إيطالية وشريحة PID ذكية',
    image: './src/assets/images/coffee_machine_parts_reveal_1791221110232.jpg'
  },
  {
    id: 'tech-master-craftsmanship-story',
    title: 'Master Artisan Calibration & Hand-Polished Finishing',
    titleAr: 'حرفية التصنيع وقصة الماكينة المتوارثة',
    subtitle: 'Hand-assembled stainless steel chassis with natural walnut hardwood controls',
    subtitleAr: 'معايرة يدوية دقيقة لكل صمام وضغط مع لمسات خشب الجوز الطبيعي الفاخر',
    image: './src/assets/images/coffee_machine_story_craft_1791221163767.jpg'
  },
  {
    id: 'tech-golden-crema-flow',
    title: 'Commercial 58mm Naked Boltfilter Flow Dynamics',
    titleAr: 'ديناميكية تدفق الكريمة بالبورتافلتر المكشوف مقاس 58 ملم',
    subtitle: 'Precision micro-laser perforated baskets ensure uniform resistance & no channeling',
    subtitleAr: 'باسكت ليزري دقيق الفتحات يوزع ضغط الماء بالتساوي لمنع القنوات المائية',
    image: './src/assets/images/coffee_making_crema_flow_1791221127339.jpg'
  }
];

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-coffee-dual-boiler',
    title: 'HiBrew Dual-Boiler 20-Bar Barista Pro',
    titleAr: 'هاي برو دبل بويلر 20 بار الاحترافية',
    subtitle: 'Dual PID Thermoblock · 58mm Commercial Group · Golden Crema',
    subtitleAr: 'دبل بويلر واستخلاص إيطالي فاخر وبورتافلتر 58مم',
    image: './src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-being-poured-into-a-cup-from-a-coffee-machine-42861-large.mp4',
    productId: 'hb-h10a-dualboiler'
  },
  {
    id: 'slide-coffee-crema-flow',
    title: 'Golden Crema Velvet Flow Extraction',
    titleAr: 'تدفق الكريمة الذهبية المخملية واستخلاص 20 بار',
    subtitle: 'Bottomless Walnut Portafilter · Zero Channeling · Rich Microfoam',
    subtitleAr: 'استخلاص سلس بدون قنوات مائية مع كريمة كثيفة غنية',
    image: './src/assets/images/coffee_making_crema_flow_1791221127339.jpg',
    productId: 'hb-boltfilter-58-naked'
  },
  {
    id: 'slide-coffee-corner-station',
    title: 'Master Barista Home Coffee Corner Station',
    titleAr: 'أركان ودواليب القهوة الفاخرة من خشب البلوط المضلع',
    subtitle: 'Concealed Cable Ports · Integrated Warm LED · Barista Credenza',
    subtitleAr: 'خشب بلوط طبيعي مع إضاءة ليد مدمجة وأدراج باريستا ذكية',
    image: './src/assets/images/coffee_corner_luxury_station_1791219182840.jpg',
    productId: 'hb-luxury-corner-station'
  }
];
