import type { Product, StoreCategory } from '../types';
import type { MediaAsset } from '../types/media';

/**
 * HiBrew Coffee Store Local Connected Workspace Path
 * Connected to: E:\\GOGLE\\hibrew-ksa-_-official-coffee-store-متجر-مكائن-ومستلزمات-القهوة
 */
export const COFFEE_STORE_WORKSPACE_PATH = 'E:\\GOGLE\\hibrew-ksa-_-official-coffee-store-متجر-مكائن-ومستلزمات-القهوة';

export const COFFEE_STORE_IDENTITY = {
  storeId: 'store-coffee',
  name: 'متجر مكائن ومستلزمات القهوة (HiBrew KSA)',
  nameAr: 'متجر مكائن ومستلزمات القهوة (HiBrew KSA)',
  nameEn: 'HiBrew KSA Official Coffee Store',
  slug: 'coffee-store',
  workspacePath: COFFEE_STORE_WORKSPACE_PATH,
  logo: '/src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg',
  accentColor: '#7c2d12',
  category: 'مكائن ومطاحن قهوة وأدوات باريستا وأركان فاخرة',
  categoryAr: 'مكائن ومطاحن قهوة وأدوات باريستا وأركان فاخرة',
  categoryEn: 'Coffee Machines, Precision Mills, Barista Tools & Luxury Stations',
  domain: 'specialtycoffee.sa',
  demo_domain: 'hibrew-ksa.saasdomain.com',
  custom_domain: 'specialtycoffee.sa',
  owner: 'ريان السليمان - وكيل هاي برو المعتمد',
  ownerAr: 'ريان السليمان - وكيل هاي برو المعتمد',
  ownerEn: 'Rayan Al-Sulaiman - HiBrew Official Agent',
  ownerEmail: 'rayan@specialtycoffee.sa',
  status: 'active' as const,
  ssl_status: 'active' as const,
  deployment_status: 'live' as const,
  subscription_status: 'active' as const,
  hostinger_status: 'connected' as const,
  dns_status: 'verified' as const,
};

export const COFFEE_CATEGORIES_SEED: StoreCategory[] = [
  {
    id: 'cat-hb-machines',
    storeId: 'store-coffee',
    parentId: null,
    name: 'Coffee Machines & Espresso',
    nameAr: 'مكائن القهوة والإسبريسو',
    slug: 'machines',
    imageUrl: '/src/assets/images/hibrew_h7a_flagship_machine.png',
    sortOrder: 10,
    metaTitle: 'مكائن القهوة والإسبريسو | هاي برو السعودية',
    metaDescription: 'مكائن قهوة دبل بويلر 20 بار ومكائن كبسولات ومحمولة بضمان الوكيل سنتين.',
    isActive: true,
  },
  {
    id: 'cat-hb-mills',
    storeId: 'store-coffee',
    parentId: null,
    name: 'Precision Coffee Mills',
    nameAr: 'مطاحن القهوة الاحترافية',
    slug: 'mills',
    imageUrl: '/src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg',
    sortOrder: 20,
    metaTitle: 'مطاحن القهوة الاحترافية | هاي برو السعودية',
    metaDescription: 'مطاحن بن مخروطية ومسطحة بدرجات طحن ميكرونية متقدمة.',
    isActive: true,
  },
  {
    id: 'cat-hb-cabinets',
    storeId: 'store-coffee',
    parentId: null,
    name: 'Luxury Coffee Cabinets & Stations',
    nameAr: 'دواليب وأركان القهوة الفاخرة',
    slug: 'cabinets',
    imageUrl: '/src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg',
    sortOrder: 30,
    metaTitle: 'دواليب وأركان القهوة الفاخرة | هاي برو السعودية',
    metaDescription: 'دواليب خشب البلوط المضلع وأركان قهوة منزلية مخصصة مع إضاءة ليد مخفية.',
    isActive: true,
  },
  {
    id: 'cat-hb-accessories',
    storeId: 'store-coffee',
    parentId: null,
    name: 'Barista Accessories & Ceramic Cups',
    nameAr: 'مستلزمات الباريستا والأكواب',
    slug: 'accessories',
    imageUrl: '/src/assets/images/coffee_barista_accessories_set_1791219198302.jpg',
    sortOrder: 40,
    metaTitle: 'مستلزمات الباريستا والأكواب | هاي برو السعودية',
    metaDescription: 'بورتافلتر مكشوف 58مم، مكابس، بتشرات تبخير وأطقم سيراميك فاخرة.',
    isActive: true,
  },
  {
    id: 'cat-hb-offers',
    storeId: 'store-coffee',
    parentId: null,
    name: 'Exclusive Offers & Bundles',
    nameAr: 'العروض والبكجات الحصرية',
    slug: 'offers',
    imageUrl: '/src/assets/images/saudi_national_day_coffee_hero_1791364192381.jpg',
    sortOrder: 50,
    metaTitle: 'عروض اليوم الوطني ويوم التأسيس | هاي برو السعودية',
    metaDescription: 'بكجات متكاملة توفيرية تشمل ماكينة ومطحنة ومستلزمات تقطير بخصومات استثنائية.',
    isActive: true,
  },
];

export const COFFEE_STORE_PRODUCTS: Product[] = [
  {
    "id": "hb-h10a-dualboiler",
    "storeId": "store-coffee",
    "name": "HiBrew Barista Pro H7A Dual-Boiler 20-Bar",
    "nameAr": "ماكينة قهوة بارستا برو هايبرو H7A دبل بويلر 20 بار",
    "nameEn": "HiBrew Barista Pro H7A Dual-Boiler 20-Bar",
    "sku": "HB-HB-H10A-DUALBOIL",
    "category": "مكائن القهوة والإسبريسو",
    "categoryAr": "مكائن القهوة والإسبريسو",
    "categoryEn": "Espresso & Coffee Machines",
    "price": 1899,
    "originalPrice": 2299,
    "discountedPrice": 1899,
    "costPrice": 1177,
    "taxRate": 15,
    "weightKg": 9.5,
    "stock": 35,
    "status": "published",
    "isActive": true,
    "isStale": false,
    "publishedAt": "2025-01-15",
    "image": "/src/assets/images/hibrew_h7a_flagship_machine.png",
    "galleryUrls": [
      "/src/assets/images/hibrew_h7a_flagship_machine.png",
      "/src/assets/images/hibrew_espresso_isolated.jpg",
      "/src/assets/images/hibrew_flagship_honor_banner.jpg",
      "/src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg"
    ],
    "images": [
      "/src/assets/images/hibrew_h7a_flagship_machine.png",
      "/src/assets/images/hibrew_espresso_isolated.jpg",
      "/src/assets/images/hibrew_flagship_honor_banner.jpg",
      "/src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg"
    ],
    "tags": [
      "hibrew",
      "coffee",
      "machines",
      "barista",
      "ksa",
      "official",
      "20bar"
    ],
    "description": "Engineered for dedicated coffee connoisseurs: the HiBrew Barista Pro H7A delivers commercial café performance directly to your home. Features dual independent PID thermoblocks that extract thick golden espresso at calibrated 92-94°C while generating continuous dry microfoam steam simultaneously with authentic 20-bar Italian pressure.",
    "descriptionAr": "ماكينة القهوة الأكثر طلباً في السعودية بارستا برو H7A من هاي برو. تجمع بين قوة الاستخلاص التجاري بنظام دبل بويلر مستقل يتيح تحضير الإسبريسو بالحرارة المضبوطة وتبخير الحليب المخملي في نفس اللحظة بضغط 20 بار إيطالي حقيقي ومقياس ضغط عقارب وبورتافلتر مقاس 58 ملم مطابق لمكائن المقاهي المختصة.",
    "descriptionEn": "Engineered for dedicated coffee connoisseurs: the HiBrew Barista Pro H7A delivers commercial café performance directly to your home. Features dual independent PID thermoblocks that extract thick golden espresso at calibrated 92-94°C while generating continuous dry microfoam steam simultaneously with authentic 20-bar Italian pressure.",
    "subtitle": "Dual Independent PID Thermoblock · 20-Bar Italian ULKA · 58mm Commercial Group · Microfoam Steam",
    "subtitleAr": "نظام دبل بويلر بتحكم حراري رقمي · مضخة إيطالية 20 بار · مقياس ضغط عالي الدقة · بورتافلتر تجاري 58مم",
    "productType": "Physical Product",
    "rating": 4.96,
    "reviewsCount": 384,
    "brand": "HiBrew (هاي برو)",
    "countryOfOrigin": "Saudi Arabia Official Agent / الضمان المعتمد بالسعودية",
    "requiresShipping": true,
    "trackInventory": true,
    "salesCount": 1229,
    "specs": [
      {
        "label": "Pump Pressure",
        "value": "20-Bar Italian ULKA Dual Pump",
        "labelAr": "قوة الضغط",
        "valueAr": "مضخة إيطالية مزدوجة بقوة 20 بار ULKA"
      },
      {
        "label": "Boiler System",
        "value": "Dual Thermoblock PID Heating (Brew & Steam simultaneously)",
        "labelAr": "نظام التسخين",
        "valueAr": "دبل بويلر PID مستقل للاستخلاص والتبخير في نفس الوقت"
      },
      {
        "label": "Portafilter",
        "value": "58mm Commercial Stainless Steel Grouphead",
        "labelAr": "البورتافلتر",
        "valueAr": "مقبس تجاري 58 ملم متوافق مع كافة مكائن المقاهي المختصة"
      },
      {
        "label": "Water Reservoir",
        "value": "2.5L Removable BPA-Free Reservoir",
        "labelAr": "خزان المياه",
        "valueAr": "سعة 2.5 لتر كبير قابل للإزالة"
      },
      {
        "label": "Steam Wand",
        "value": "Cool-Touch Commercial 3-Hole Microfoam Wand",
        "labelAr": "عصا التبخير",
        "valueAr": "ستانلس تجاري 3 فتحات لتبخير حليب مخملي للاتيه آرت"
      },
      {
        "label": "Pre-Infusion",
        "value": "Adjustable Low-Pressure Pre-Infusion (1-10s)",
        "labelAr": "الترطيب المسبق",
        "valueAr": "نظام ترطيب مسبق قابل للضبط لمنع قنوات التدفق"
      }
    ],
    "colors": [
      {
        "id": "col-hb-h10a-dualboiler-0",
        "nameAr": "ستانلس ستيل مصقول",
        "nameEn": "Brushed Steel",
        "hex": "#D1D5DB",
        "image": "/src/assets/images/hibrew_h7a_flagship_machine.png"
      },
      {
        "id": "col-hb-h10a-dualboiler-1",
        "nameAr": "أسود مطفي ملوكي",
        "nameEn": "Matte Obsidian",
        "hex": "#18181B",
        "image": "/src/assets/images/hibrew_espresso_isolated.jpg"
      },
      {
        "id": "col-hb-h10a-dualboiler-2",
        "nameAr": "فضي كروم احترافي",
        "nameEn": "Silver Chrome Pro",
        "hex": "#9CA3AF",
        "image": "/src/assets/images/flagship_coffee_machine_5th.png"
      },
      {
        "id": "col-hb-h10a-dualboiler-3",
        "nameAr": "كلاسيك فينتج فضي",
        "nameEn": "Classic Vintage",
        "hex": "#4B5563",
        "image": "/src/assets/images/product_machine_silver_pro.png"
      },
      {
        "id": "col-hb-h10a-dualboiler-4",
        "nameAr": "إصدار التراث الفاخر",
        "nameEn": "Royal Heritage Bronze",
        "hex": "#8C6239",
        "image": "/src/assets/images/hibrew_flagship_honor_banner.jpg"
      }
    ],
    "storageOptions": [
      {
        "capacity": "Standard 58mm Kit",
        "ram": "Single & Double Baskets",
        "priceDelta": 0
      },
      {
        "capacity": "Master Barista Edition",
        "ram": "Includes Naked Boltfilter + Mill",
        "priceDelta": 599
      }
    ],
    "warranties": [
      {
        "id": "agency-2y",
        "name": "Official 2-Year KSA Agency Warranty & Pump Coverage",
        "nameAr": "ضمان سنتين شامل المضخة وصيانة الوكيل المعتمد بالسعودية",
        "price": 0
      },
      {
        "id": "vip-care-3y",
        "name": "HiBrew Care+ 3-Year Extended Replacement Guarantee",
        "nameAr": "رعاية هاي برو كير+ 3 سنوات استبدال فوري وضمان شامل",
        "price": 199
      }
    ],
    "bundles": [
      {
        "id": "bundle-mill-g5",
        "name": "HiBrew G5 Conical Burr Coffee Mill",
        "nameAr": "مطحنة بن هاي برو G5 بتروس مخروطية",
        "price": 389,
        "originalPrice": 599,
        "image": "/src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg"
      },
      {
        "id": "bundle-boltfilter",
        "name": "58mm Naked Walnut Boltfilter",
        "nameAr": "بورتافلتر مكشوف 58مم خشب الجوز",
        "price": 119,
        "originalPrice": 189,
        "image": "/src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg"
      }
    ],
    "partsShowcase": [
      {
        "id": "part-dual-boiler-pid",
        "tagEn": "DUAL THERMOBLOCK PID",
        "tagAr": "نظام دبل بويلر المستقل",
        "titleEn": "Dual PID Independent Thermoblocks & 20-Bar ULKA Pump",
        "titleAr": "هندسة الدبل بويلر المستقل واستخلاص متزامن 20 بار",
        "descriptionEn": "Two independent electronic thermoblocks controlled by smart PID chips. Extract rich golden espresso and steam silky milk microfoam at the same time without temperature drops or wait time.",
        "descriptionAr": "وحدتا تسخين إلكترونيتان مستقلتان تعملان بتقنية PID الذكية؛ وحدة للاستخلاص عند حرارة 92°-94° مئوية، ووحدة مستقلة للتبخير الفوري عند 130° مئوية في آن واحد دون انخفاض في الضغط.",
        "image": "/src/assets/images/hibrew_barista_pro_exploded_parts_1791364960592.jpg",
        "stats": [
          {
            "labelEn": "Pump Pressure",
            "labelAr": "قوة الضغط",
            "value": "20-Bar ULKA"
          },
          {
            "labelEn": "Heating Units",
            "labelAr": "وحدات التسخين",
            "value": "Dual PID"
          },
          {
            "labelEn": "Temp Stability",
            "labelAr": "ثبات الحرارة",
            "value": "±0.5°C"
          }
        ]
      },
      {
        "id": "part-commercial-grouphead",
        "tagEn": "MACHINE IN-USE · GOLDEN EXTRACTION",
        "tagAr": "الماكينة أثناء الاستخدام · تدفق الكريمة الذهبية",
        "titleEn": "Commercial 58.4mm Brass Grouphead & Velvet Crema Flow",
        "titleAr": "استخلاص حقيقي بمقبس تجاري 58 ملم وتدفق الكريمة المخملية",
        "descriptionEn": "Watch the thick golden espresso flow steadily at the 9-bar sweet spot. Low-pressure pre-infusion saturates the coffee puck uniformly, delivering zero channeling and café-grade body.",
        "descriptionAr": "شاهد تدفق الإسبريسو الذهبي الثخين عند ضغط 9-12 بار المثالي. يقوم نظام الترطيب المسبق بتشبيع البن تدريجياً لضمان استخلاص متجانس بدون أي قنوات مائية.",
        "image": "/src/assets/images/coffee_making_crema_flow_1791221127339.jpg",
        "stats": [
          {
            "labelEn": "Portafilter Size",
            "labelAr": "مقاس البورتافلتر",
            "value": "58.4mm"
          },
          {
            "labelEn": "Pre-Infusion",
            "labelAr": "الترطيب المسبق",
            "value": "1-10s"
          },
          {
            "labelEn": "Crema Texture",
            "labelAr": "قوام الكريمة",
            "value": "Dense Microfoam"
          }
        ]
      },
      {
        "id": "part-pressure-gauge",
        "tagEn": "ANALOG BARISTA GAUGE",
        "tagAr": "مقياس ضغط الباريستا التناظري",
        "titleEn": "Real-Time Visual Barista Pressure Gauge Dial",
        "titleAr": "مقياس ضغط استخلاص حقيقي لمراقبة تدفق القهوة لحظياً",
        "descriptionEn": "Vintage analog pressure meter monitoring real extraction resistance between 9 and 15 bar in real-time, helping you dial in your grind size with laboratory precision.",
        "descriptionAr": "مؤشر عقارب كلاسيكي أنيق يعرض ضغط الاستخلاص الفعلي لحظة بلحظة؛ يمنحك رؤية فورية لمنطقة الاستخلاص الذهبي بين 9 و 12 بار للتأكد من تناسق طحنة البن وثبات النكهة في كل فنجان.",
        "image": "/src/assets/images/hibrew_barista_pro_details_showcase_1791364980884.jpg",
        "stats": [
          {
            "labelEn": "Optimal Zone",
            "labelAr": "المنطقة الذهبية",
            "value": "9 – 12 Bar"
          },
          {
            "labelEn": "Max Pressure",
            "labelAr": "الضغط الأقصى",
            "value": "20 Bar"
          },
          {
            "labelEn": "Gauge Material",
            "labelAr": "خامة المؤشر",
            "value": "Polished Brass"
          }
        ]
      },
      {
        "id": "part-microfoam-steam",
        "tagEn": "MACHINE IN-USE · MILK STEAMING",
        "tagAr": "الماكينة أثناء الاستخدام · تبخير الحليب المخملي",
        "titleEn": "3-Hole Commercial Cool-Touch Microfoam Steam Wand",
        "titleAr": "عصا تبخير تجارية 3 فتحات لتبخير حليب ميكروفوم ورسم اللاتيه آرت",
        "descriptionEn": "Dry 135°C steam injected through 3 laser-calibrated holes creates dense, silky microfoam in under 20 seconds. Perfect vortex swirl enables effortless latte art rosettas and swans.",
        "descriptionAr": "بخار جاف قوي عند 135° مئوية عبر 3 فتحات ليزرية دقيقة يحول الحليب إلى رغوة ميكروفوم حريرية لامعة خلال أقل من 20 ثانية، مما يمكنك من رسم أبدع تصاميم اللاتيه آرت بسهولة.",
        "image": "/src/assets/images/barista_milk_steaming_1791363367164.jpg",
        "stats": [
          {
            "labelEn": "Steam Nozzle",
            "labelAr": "فتحات التبخير",
            "value": "3-Hole Precision"
          },
          {
            "labelEn": "Steam Temp",
            "labelAr": "حرارة البخار",
            "value": "135°C Dry"
          },
          {
            "labelEn": "Handle Grip",
            "labelAr": "مقبض الأمان",
            "value": "Cool-Touch Silicon"
          }
        ]
      },
      {
        "id": "part-craftsmanship-warranty",
        "tagEn": "2-YEAR KSA AGENCY WARRANTY",
        "tagAr": "ضمان الوكيل المعتمد سنتين بالسعودية",
        "titleEn": "Hand-Polished 304 Stainless Chassis & Authorized KSA Warranty",
        "titleAr": "هيكل ستانلس ستيل 304 فاخر وضمان شامل سنتين بالمملكة",
        "descriptionEn": "Constructed from heavy gauge 304 food-grade stainless steel with luxury walnut hardwood accents, backed by 2-year authorized agency warranty and immediate spare parts in KSA.",
        "descriptionAr": "هيكل معدني متين من الفولاذ المقاوم للصدأ 304 مع لمسات خشب الجوز الطبيعي وخزان مياه 2.5 لتر كبير، مدعوم بضمان الوكيل المعتمد في المملكة لمدة سنتين مع توفر كامل قطع الغيار والصيانة.",
        "image": "/src/assets/images/coffee_machine_story_craft_1791221163767.jpg",
        "stats": [
          {
            "labelEn": "Agency Warranty",
            "labelAr": "ضمان الوكيل",
            "value": "2 Years Full"
          },
          {
            "labelEn": "Water Tank",
            "labelAr": "سعة الخزان",
            "value": "2.5L BPA-Free"
          },
          {
            "labelEn": "Chassis Material",
            "labelAr": "خامة الهيكل",
            "value": "304 Solid Steel"
          }
        ]
      }
    ],
    "heroBanner": {
      "headlineEn": "HiBrew Barista Pro H7A 20-Bar",
      "headlineAr": "ماكينة قهوة بارستا برو هايبرو H7A دبل بويلر 20 بار",
      "sloganEn": "PID DUAL BOILER | Commercial Extraction In One Touch",
      "sloganAr": "دبل بويلر ذكي | استخلاص تجاري بلمسة واحدة",
      "badgeEn": "OFFICIAL KSA FLAGSHIP",
      "badgeAr": "الإصدار الرائد الرسمي بالمملكة",
      "bgGradient": "from-[#061838] via-[#092558] to-[#030d22]",
      "heroImage": "/src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg",
      "featuresEn": [
        "20-Bar Italian ULKA Dual Pump",
        "Dual PID Independent Thermoblocks",
        "58.4mm Commercial Brass Group",
        "2-Year Official Agency Warranty"
      ],
      "featuresAr": [
        "مضخة إيطالية مزدوجة 20 بار",
        "دبل بويلر PID مستقل تماماً",
        "مقبس تجاري 58.4 ملم",
        "ضمان سنتين شامل الوكيل المعتمد"
      ]
    }
  },
  {
    "id": "hb-barista-silver-pro",
    "storeId": "store-coffee",
    "name": "HiBrew Barista Classic Pro 20-Bar",
    "nameAr": "ماكينة هايبرو بارستا كلاسيك 20 بار",
    "nameEn": "HiBrew Barista Classic Pro 20-Bar",
    "sku": "HB-HB-BARISTA-SILVE",
    "category": "مكائن القهوة والإسبريسو",
    "categoryAr": "مكائن القهوة والإسبريسو",
    "categoryEn": "Espresso & Coffee Machines",
    "price": 1499,
    "originalPrice": 1899,
    "discountedPrice": 1499,
    "costPrice": 929,
    "taxRate": 15,
    "weightKg": 9.5,
    "stock": 35,
    "status": "published",
    "isActive": true,
    "isStale": false,
    "publishedAt": "2025-01-15",
    "image": "/src/assets/images/product_machine_silver_pro.png",
    "galleryUrls": [
      "/src/assets/images/product_machine_silver_pro.png"
    ],
    "images": [
      "/src/assets/images/product_machine_silver_pro.png"
    ],
    "tags": [
      "hibrew",
      "coffee",
      "machines",
      "barista",
      "ksa",
      "official",
      "20bar"
    ],
    "description": "HiBrew Barista Classic Pro brings cafe quality to your home with 20-bar Italian pump pressure and commercial 58mm grouphead.",
    "descriptionAr": "ماكينة هايبرو بارستا كلاسيك برو تجمع بين فخامة الستانلس ستيل وضغط 20 بار فائق الدقة مع مقبض تجاري 58 ملم.",
    "descriptionEn": "HiBrew Barista Classic Pro brings cafe quality to your home with 20-bar Italian pump pressure and commercial 58mm grouphead.",
    "subtitle": "Dual Thermoblock · 58mm Portafilter · Italian ULKA Dual Pump",
    "subtitleAr": "استخلاص احترافي بضغط 20 بار وبورتافلتر 58مم مع مقياس ضغط عقارب",
    "productType": "Physical Product",
    "rating": 4.95,
    "reviewsCount": 248,
    "brand": "HiBrew (هاي برو)",
    "countryOfOrigin": "Saudi Arabia Official Agent / الضمان المعتمد بالسعودية",
    "requiresShipping": true,
    "trackInventory": true,
    "salesCount": 794,
    "specs": [
      {
        "label": "Pump Pressure",
        "value": "20-Bar Italian ULKA Pump",
        "labelAr": "قوة الضغط",
        "valueAr": "مضخة إيطالية 20 بار"
      },
      {
        "label": "Grouphead",
        "value": "58mm Commercial Stainless",
        "labelAr": "البورتافلتر",
        "valueAr": "مقبس تجاري 58 ملم"
      },
      {
        "label": "Heating",
        "value": "Rapid Thermoblock PID",
        "labelAr": "نظام التسخين",
        "valueAr": "ثيرموبلوك سريع مع تحكم PID"
      }
    ],
    "colors": [
      {
        "id": "col-hb-barista-silver-pro-0",
        "nameAr": "ستانلس ستيل مصقول",
        "nameEn": "Brushed Silver",
        "hex": "#E5E7EB",
        "image": "/src/assets/images/product_machine_silver_pro.png"
      }
    ],
    "storageOptions": [
      {
        "capacity": "Standard 58mm Kit",
        "ram": "Includes Double Filter Basket",
        "priceDelta": 0
      },
      {
        "capacity": "Pro Barista Edition",
        "ram": "Includes Precision Tamper & Pitcher",
        "priceDelta": 199
      }
    ],
    "warranties": [
      {
        "id": "agency-2y",
        "name": "Official 2-Year KSA Agency Warranty",
        "nameAr": "ضمان سنتين شامل الوكيل المعتمد بالسعودية",
        "price": 0
      }
    ],
    "bundles": [],
    "partsShowcase": []
  },
  {
    "id": "hb-smart-capsule-compact",
    "storeId": "store-coffee",
    "name": "HiBrew Compact Smart Capsule & Espresso",
    "nameAr": "ماكينة هايبرو سمارت المدمجة للكبسولات والإسبريسو",
    "nameEn": "HiBrew Compact Smart Capsule & Espresso",
    "sku": "HB-HB-SMART-CAPSULE",
    "category": "مكائن القهوة والإسبريسو",
    "categoryAr": "مكائن القهوة والإسبريسو",
    "categoryEn": "Espresso & Coffee Machines",
    "price": 399,
    "originalPrice": 549,
    "discountedPrice": 399,
    "costPrice": 247,
    "taxRate": 15,
    "weightKg": 9.5,
    "stock": 35,
    "status": "published",
    "isActive": true,
    "isStale": false,
    "publishedAt": "2025-01-15",
    "image": "/src/assets/images/product_machine_compact_black.png",
    "galleryUrls": [
      "/src/assets/images/product_machine_compact_black.png"
    ],
    "images": [
      "/src/assets/images/product_machine_compact_black.png"
    ],
    "tags": [
      "hibrew",
      "coffee",
      "machines",
      "barista",
      "ksa",
      "official",
      "20bar"
    ],
    "description": "Compact, versatile and fast. The HiBrew Compact Smart machine handles multiple capsule formats as well as fresh ground espresso.",
    "descriptionAr": "تصميم أنيق ومدمج يناسب أي مساحة، يدعم كبسولات نسبريسو ودولتشي غوستو والبن المطحون بضغطة زر واحدة.",
    "descriptionEn": "Compact, versatile and fast. The HiBrew Compact Smart machine handles multiple capsule formats as well as fresh ground espresso.",
    "subtitle": "19-Bar Pressure · Rapid 25s Heating · Multi-Capsule Adapter",
    "subtitleAr": "ضغط 19 بار وتسخين سريع في 25 ثانية مع محولات متعددة لكافة الكبسولات",
    "productType": "Physical Product",
    "rating": 4.91,
    "reviewsCount": 312,
    "brand": "HiBrew (هاي برو)",
    "countryOfOrigin": "Saudi Arabia Official Agent / الضمان المعتمد بالسعودية",
    "requiresShipping": true,
    "trackInventory": true,
    "salesCount": 998,
    "specs": [
      {
        "label": "Pressure",
        "value": "19-Bar High Pressure Extraction",
        "labelAr": "الضغط",
        "valueAr": "استخلاص فائق بقوة 19 بار"
      },
      {
        "label": "Warmup",
        "value": "Instant 25-Second Rapid Thermoblock",
        "labelAr": "سرعة التسخين",
        "valueAr": "جاهزة للتحضير خلال 25 ثانية"
      },
      {
        "label": "Reservoir",
        "value": "0.8L Removable Transparent Tank",
        "labelAr": "سعة الخزان",
        "valueAr": "خزان شفاف سعة 800 مل"
      }
    ],
    "colors": [
      {
        "id": "col-hb-smart-capsule-compact-0",
        "nameAr": "أسود مطفي ملوكي",
        "nameEn": "Matte Obsidian",
        "hex": "#18181B",
        "image": "/src/assets/images/product_machine_compact_black.png"
      }
    ],
    "storageOptions": [
      {
        "capacity": "Standard Trio Adapter",
        "ram": "Nespresso, Dolce Gusto & Ground Coffee",
        "priceDelta": 0
      }
    ],
    "warranties": [
      {
        "id": "agency-2y",
        "name": "Official 2-Year KSA Agency Warranty",
        "nameAr": "ضمان سنتين شامل الوكيل المعتمد بالسعودية",
        "price": 0
      }
    ],
    "bundles": [],
    "partsShowcase": []
  },
  {
    "id": "hb-thermal-drip-brewer",
    "storeId": "store-coffee",
    "name": "HiBrew Digital Thermal Drip Brewer",
    "nameAr": "ماكينة هايبرو الرقمية لتقطير القهوة مع إبريق زجاجي",
    "nameEn": "HiBrew Digital Thermal Drip Brewer",
    "sku": "HB-HB-THERMAL-DRIP-",
    "category": "مكائن القهوة والإسبريسو",
    "categoryAr": "مكائن القهوة والإسبريسو",
    "categoryEn": "Espresso & Coffee Machines",
    "price": 299,
    "originalPrice": 420,
    "discountedPrice": 299,
    "costPrice": 185,
    "taxRate": 15,
    "weightKg": 9.5,
    "stock": 35,
    "status": "published",
    "isActive": true,
    "isStale": false,
    "publishedAt": "2025-01-15",
    "image": "/src/assets/images/product_machine_drip_carafe.png",
    "galleryUrls": [
      "/src/assets/images/product_machine_drip_carafe.png"
    ],
    "images": [
      "/src/assets/images/product_machine_drip_carafe.png"
    ],
    "tags": [
      "hibrew",
      "coffee",
      "machines",
      "barista",
      "ksa",
      "official",
      "20bar"
    ],
    "description": "Brew rich, aromatic drip coffee effortlessly for family and gatherings with precision temperature control and intuitive digital touch timer.",
    "descriptionAr": "ماكينة التقطير الرقمية الذكية من هايبرو، تحضر القهوة المقطرة بأعلى معايير التوازن الحراري وتحافظ عليها دافئة وطازجة.",
    "descriptionEn": "Brew rich, aromatic drip coffee effortlessly for family and gatherings with precision temperature control and intuitive digital touch timer.",
    "subtitle": "Touch LED Display · 1.5L Carafe · Smart Keep-Warm Plate",
    "subtitleAr": "شاشة لمس رقمية مع إبريق زجاجي 1.5 لتر وقاعدة تسخين ذكية",
    "productType": "Physical Product",
    "rating": 4.89,
    "reviewsCount": 198,
    "brand": "HiBrew (هاي برو)",
    "countryOfOrigin": "Saudi Arabia Official Agent / الضمان المعتمد بالسعودية",
    "requiresShipping": true,
    "trackInventory": true,
    "salesCount": 634,
    "specs": [
      {
        "label": "Carafe Capacity",
        "value": "1.5 Liters (10-12 Cups)",
        "labelAr": "سعة الإبريق",
        "valueAr": "1.5 لتر تكفي 10-12 كوب"
      },
      {
        "label": "Controls",
        "value": "Digital Touch LED Interface",
        "labelAr": "التحكم",
        "valueAr": "شاشة رقمية تعمل باللمس"
      },
      {
        "label": "Keep Warm",
        "value": "2-Hour Auto Warming Plate",
        "labelAr": "حفظ الحرارة",
        "valueAr": "قاعدة تسخين تلقائية لمدة ساعتين"
      }
    ],
    "colors": [
      {
        "id": "col-hb-thermal-drip-brewer-0",
        "nameAr": "أسود بيانو فاخر",
        "nameEn": "Piano Gloss Black",
        "hex": "#111827",
        "image": "/src/assets/images/product_machine_drip_carafe.png"
      }
    ],
    "storageOptions": [
      {
        "capacity": "1.5L Glass Carafe Edition",
        "ram": "Up to 12 Cups per Brew",
        "priceDelta": 0
      }
    ],
    "warranties": [
      {
        "id": "agency-2y",
        "name": "Official 2-Year KSA Agency Warranty",
        "nameAr": "ضمان سنتين شامل الوكيل المعتمد بالسعودية",
        "price": 0
      }
    ],
    "bundles": [],
    "partsShowcase": []
  },
  {
    "id": "hb-classic-duo-espresso",
    "storeId": "store-coffee",
    "name": "HiBrew Classic Duo 15-Bar Espresso Maker",
    "nameAr": "ماكينة هايبرو كلاسيك ديو 15 بار بمخرجين",
    "nameEn": "HiBrew Classic Duo 15-Bar Espresso Maker",
    "sku": "HB-HB-CLASSIC-DUO-E",
    "category": "مكائن القهوة والإسبريسو",
    "categoryAr": "مكائن القهوة والإسبريسو",
    "categoryEn": "Espresso & Coffee Machines",
    "price": 649,
    "originalPrice": 850,
    "discountedPrice": 649,
    "costPrice": 402,
    "taxRate": 15,
    "weightKg": 9.5,
    "stock": 35,
    "status": "published",
    "isActive": true,
    "isStale": false,
    "publishedAt": "2025-01-15",
    "image": "/src/assets/images/product_machine_delonghi_black.png",
    "galleryUrls": [
      "/src/assets/images/product_machine_delonghi_black.png"
    ],
    "images": [
      "/src/assets/images/product_machine_delonghi_black.png"
    ],
    "tags": [
      "hibrew",
      "coffee",
      "machines",
      "barista",
      "ksa",
      "official",
      "20bar"
    ],
    "description": "Classic retro espresso machine built for everyday reliability with dual cup extraction, stainless steel cup warmer, and high-performance steam wand.",
    "descriptionAr": "الماكينة الكلاسيكية المحبوبة لتحضير الإسبريسو الإيطالي الأصيل مع مخرجين للصب وتبخير ممتاز للحليب ورغوة الكابتشينو.",
    "descriptionEn": "Classic retro espresso machine built for everyday reliability with dual cup extraction, stainless steel cup warmer, and high-performance steam wand.",
    "subtitle": "Dual-Cup Extraction · Stainless Steel Boiler · High-Steam Wand",
    "subtitleAr": "استخلاص متزامن لكوبين مع عصا تبخير للحليب المخملي وضمان سنتين",
    "productType": "Physical Product",
    "rating": 4.93,
    "reviewsCount": 275,
    "brand": "HiBrew (هاي برو)",
    "countryOfOrigin": "Saudi Arabia Official Agent / الضمان المعتمد بالسعودية",
    "requiresShipping": true,
    "trackInventory": true,
    "salesCount": 880,
    "specs": [
      {
        "label": "Boiler",
        "value": "Heavy Duty Stainless Steel Boiler",
        "labelAr": "الغلاية",
        "valueAr": "غلاية متينة من الستانلس ستيل"
      },
      {
        "label": "Dual Spout",
        "value": "Simultaneous 2-Cup Portafilter Spout",
        "labelAr": "مخرج مزدوج",
        "valueAr": "مخرج مزدوج لصب كوبين معاً"
      },
      {
        "label": "Steam Wand",
        "value": "Swivel Frothing Wand for Cappuccino",
        "labelAr": "التبخير",
        "valueAr": "عصا متحركة لتبخير الكابتشينو واللاتيه"
      }
    ],
    "colors": [
      {
        "id": "col-hb-classic-duo-espresso-0",
        "nameAr": "أسود كربوني مع ستيل",
        "nameEn": "Charcoal Black",
        "hex": "#27272A",
        "image": "/src/assets/images/product_machine_delonghi_black.png"
      }
    ],
    "storageOptions": [
      {
        "capacity": "Dual Cup Barista Kit",
        "ram": "Includes 2 Stainless Steel Cups",
        "priceDelta": 0
      }
    ],
    "warranties": [
      {
        "id": "agency-2y",
        "name": "Official 2-Year KSA Agency Warranty",
        "nameAr": "ضمان سنتين شامل الوكيل المعتمد بالسعودية",
        "price": 0
      }
    ],
    "bundles": [],
    "partsShowcase": []
  },
  {
    "id": "hb-mill-g5-pro",
    "storeId": "store-coffee",
    "name": "HiBrew Conical Burr Coffee Mill G5",
    "nameAr": "مطحنة القهوة الكهربائية بتروس مخروطية هايبرو G5",
    "nameEn": "HiBrew Conical Burr Coffee Mill G5",
    "sku": "HB-HB-MILL-G5-PRO",
    "category": "مطاحن القهوة الاحترافية",
    "categoryAr": "مطاحن القهوة الاحترافية",
    "categoryEn": "Precision Coffee Mills",
    "price": 489,
    "originalPrice": 650,
    "discountedPrice": 489,
    "costPrice": 303,
    "taxRate": 15,
    "weightKg": 3.4,
    "stock": 60,
    "status": "published",
    "isActive": true,
    "isStale": false,
    "publishedAt": "2025-01-15",
    "image": "/src/assets/images/hibrew_grinder_isolated.jpg",
    "galleryUrls": [
      "/src/assets/images/hibrew_grinder_isolated.jpg",
      "/src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg"
    ],
    "images": [
      "/src/assets/images/hibrew_grinder_isolated.jpg",
      "/src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg"
    ],
    "tags": [
      "hibrew",
      "coffee",
      "mills",
      "barista",
      "ksa",
      "official",
      "20bar"
    ],
    "description": "The HiBrew Mill G5 combines laboratory precision with single-dose workflow. Zero retention ensures that the exact weight of fresh roasted coffee beans you put in is the exact weight you get out.",
    "descriptionAr": "مطحنة القهوة المثالية لمحبي الإسبريسو والتقطير. تمتاز باحتباس صفري وتروس تيتانيوم مخروطية تطحن بحرارة منخفضة للحفاظ على أعمق نكهات البن والإيحاءات العطرية.",
    "descriptionEn": "The HiBrew Mill G5 combines laboratory precision with single-dose workflow. Zero retention ensures that the exact weight of fresh roasted coffee beans you put in is the exact weight you get out.",
    "subtitle": "40 Micro-Steps · 40mm CNC Titanium Burrs · Zero Retention Bellows",
    "subtitleAr": "40 درجة طحن دقيقة بتروس تيتانيوم مخروطية ومضخة تفريغ احتباس صفري",
    "productType": "Physical Product",
    "rating": 4.92,
    "reviewsCount": 295,
    "brand": "HiBrew (هاي برو)",
    "countryOfOrigin": "Saudi Arabia Official Agent / الضمان المعتمد بالسعودية",
    "requiresShipping": true,
    "trackInventory": true,
    "salesCount": 944,
    "specs": [
      {
        "label": "Burr Geometry",
        "value": "40mm High-Hardness CNC Titanium Conical Burrs",
        "labelAr": "نوع التروس",
        "valueAr": "تروس مخروطية من الفولاذ المطلي بالتيتانيوم مقاس 40 ملم"
      },
      {
        "label": "Grind Settings",
        "value": "40 Stepped Micro Settings (Turkish, Espresso, V60, Cold Brew)",
        "labelAr": "درجات الطحن",
        "valueAr": "40 درجة من النعومة القصوى للإسبريسو والتركي حتى الخشن"
      },
      {
        "label": "Retention",
        "value": "< 0.1g Near Zero Retention with Silicone Bellows",
        "labelAr": "الاحتباس",
        "valueAr": "أقل من 0.1 جرام بفضل مضخة تفريغ الهواء"
      },
      {
        "label": "Motor Speed",
        "value": "Low RPM DC Motor (Prevents Bean Heat Friction)",
        "labelAr": "سرعة الدوران",
        "valueAr": "دوران هادئ وبطيء لحماية الزيوت العطرية من الاحتراق"
      }
    ],
    "colors": [
      {
        "id": "col-hb-mill-g5-pro-0",
        "nameAr": "أسود مطفي فاخر",
        "nameEn": "Matte Black",
        "hex": "#141416",
        "image": "/src/assets/images/hibrew_grinder_isolated.jpg"
      },
      {
        "id": "col-hb-mill-g5-pro-1",
        "nameAr": "فضي معدني",
        "nameEn": "Brushed Silver",
        "hex": "#D4D4D8",
        "image": "/src/assets/images/hibrew_grinder_silver.jpg"
      }
    ],
    "storageOptions": [
      {
        "capacity": "Single Dose (50g)",
        "ram": "Anti-Static Bellows",
        "priceDelta": 0
      },
      {
        "capacity": "Commercial Hopper (250g)",
        "ram": "With Portafilter Cradle",
        "priceDelta": 80
      }
    ],
    "warranties": [],
    "bundles": [],
    "partsShowcase": [
      {
        "id": "part-g5-titanium-burrs",
        "tagEn": "TITANIUM BURR ARCHITECTURE",
        "tagAr": "هندسة تروس التيتانيوم المخروطية",
        "titleEn": "40mm CNC High-Hardness Titanium Conical Burrs",
        "titleAr": "تروس مخروطية 40 ملم من الفولاذ المطلي بالتيتانيوم",
        "descriptionEn": "Ultra-hard CNC machined 40mm conical burrs coated in titanium carbon nitride. Maintains pinpoint cutting sharpness across 500kg+ of roasted beans with near-zero heat transfer.",
        "descriptionAr": "تروس مخروطية فائقة الصلابة مصنعة بتقنية CNC ومطلية بطبقة التيتانيوم كربون نايتريد، تطحن بنعومة وثبات لأكثر من 500 كجم بن دون تأثر حواف القطع أو ارتفاع حرارة الحبوب.",
        "image": "/src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg",
        "stats": [
          {
            "labelEn": "Burr Size",
            "labelAr": "قطر التروس",
            "value": "40mm Conical"
          },
          {
            "labelEn": "Coating",
            "labelAr": "نوع الطلاء",
            "value": "Titanium TiN"
          },
          {
            "labelEn": "Hardness",
            "labelAr": "مستوى الصلابة",
            "value": "HRC 64"
          }
        ]
      },
      {
        "id": "part-g5-machine-usage",
        "tagEn": "MACHINE IN-USE · ZERO RETENTION WORKFLOW",
        "tagAr": "المطحنة أثناء الاستخدام · طحن وتفريغ احتباس صفري",
        "titleEn": "Single-Dose Operation & Air Bellows Exhaust",
        "titleAr": "طحن جرعة بجرعة ونفخ احتباس صفري لمسحوق البن",
        "descriptionEn": "Weigh your coffee beans, pour into the single-dose hopper, and grind smoothly at low RPM. A single tap on the silicone bellows expels 100% of residual grounds, guaranteeing absolute freshness in every cup.",
        "descriptionAr": "ضع حبوب القهوة الموزونة في القمع واطحن بهدوء. ضغطة واحدة على مضخة السيليكون تطرد كافة ذرات البن العالقة داخل ممر الخروج ليصبح الاحتباس أقل من 0.1 جرام، مما يضمن طزاجة كل شوت.",
        "image": "/src/assets/images/barista_tamping_shot_1791363346824.jpg",
        "stats": [
          {
            "labelEn": "Retention",
            "labelAr": "نسبة الاحتباس",
            "value": "< 0.1g Zero"
          },
          {
            "labelEn": "Workflow",
            "labelAr": "نظام الجرعات",
            "value": "Single Dose"
          },
          {
            "labelEn": "RPM Rate",
            "labelAr": "سرعة الدوران",
            "value": "450 RPM Cool"
          }
        ]
      },
      {
        "id": "part-g5-stepped-dial",
        "tagEn": "40 MICRO-STEP ADJUSTMENT",
        "tagAr": "40 درجة ضبط ميكرومترية",
        "titleEn": "40-Step Micro Adjustment from Turkish to Cold Brew",
        "titleAr": "قرص معايرة دقيق 40 درجة من التركي الناعم حتى التقطير والكولد برو",
        "descriptionEn": "Stepped precision collar enables effortless dialing. Transition smoothly between micro-powder for Turkish coffee, dialed-in 9-bar espresso, delicate V60 pour-overs, and coarse French press.",
        "descriptionAr": "حلقة ضبط خارجية مرقمة بـ 40 درجة دقيقة للغاية. يمكنك الانتقال بسلاسة بين نعومة القهوة التركية، ونعومة الإسبريسو المضبوطة بدقة، وتقطير V60، وحتى الطحن الخشن للكولد برو.",
        "image": "/src/assets/images/fiorenzato_sunset_riyadh_hero_1791364213969.jpg",
        "stats": [
          {
            "labelEn": "Steps",
            "labelAr": "عدد الدرجات",
            "value": "40 Micro Steps"
          },
          {
            "labelEn": "Grind Range",
            "labelAr": "مجال الطحن",
            "value": "100μm - 1200μm"
          },
          {
            "labelEn": "Dial Click",
            "labelAr": "ملمس القرص",
            "value": "Tactile Click"
          }
        ]
      },
      {
        "id": "part-g5-dosing-cup",
        "tagEn": "MAGNETIC PORTAFILTER CUP",
        "tagAr": "كوب استقبال مغناطيسي مضاد للشحنات",
        "titleEn": "Anti-Static Ion Chute & Magnetic Dosing Cup",
        "titleAr": "ممر خروج مضاد للشحنات الساكنة وكوب استقبال من الألمنيوم",
        "descriptionEn": "Crafted with anti-static discharge channels that eliminate flyaway chaff and clumping. Magnetic guide centers the CNC aluminum dosing cup directly under the chute for clean transfer.",
        "descriptionAr": "قناة خروج مصممة بتقنية تفريغ الشحنات الكهربائية الساكنة لمنع تطاير مسحوق القهوة وتكتله. قاعدة مغناطيسية تثبت كوب الألمنيوم المرفق في المنتصف تماماً دون أي فوضى على طاولة القهوة.",
        "image": "/src/assets/images/espresso_wood_pitcher_1791363392554.jpg",
        "stats": [
          {
            "labelEn": "Cup Fit",
            "labelAr": "مقاس الكوب",
            "value": "58mm Standard"
          },
          {
            "labelEn": "Anti-Static",
            "labelAr": "مكافحة الشحنات",
            "value": "Zero Flyaway"
          },
          {
            "labelEn": "Base Mount",
            "labelAr": "تثبيت القاعدة",
            "value": "Magnetic Lock"
          }
        ]
      },
      {
        "id": "part-g5-agency-warranty",
        "tagEn": "2-YEAR KSA AGENCY WARRANTY",
        "tagAr": "ضمان الوكيل سنتين بالسعودية",
        "titleEn": "Heavy Die-Cast Aluminum Body & Official KSA Warranty",
        "titleAr": "هيكل معدني صلب ممتص للاهتزازات مع ضمان الوكيل سنتين بالمملكة",
        "descriptionEn": "Full solid aluminum body provides exceptional stability and minimal vibration during grinding. Backed by 2-year authorized agency warranty with certified maintenance centers across KSA.",
        "descriptionAr": "هيكل معدني ثقيل من الألمنيوم المصبوب يمتص الاهتزازات ويضمن هدوء المحرك أثناء الطحن. مدعوم بضمان الوكيل المعتمد سنتين في المملكة مع توفر التروس والقطع الأصلية.",
        "image": "/src/assets/images/coffee_machine_story_craft_1791221163767.jpg",
        "stats": [
          {
            "labelEn": "Agency Warranty",
            "labelAr": "ضمان الوكيل",
            "value": "2 Years Full"
          },
          {
            "labelEn": "Chassis",
            "labelAr": "خامة الهيكل",
            "value": "Die-Cast Alloy"
          },
          {
            "labelEn": "Noise Level",
            "labelAr": "مستوى الصوت",
            "value": "< 65 dB Quiet"
          }
        ]
      }
    ],
    "heroBanner": {
      "headlineEn": "HiBrew Conical Burr Mill G5",
      "headlineAr": "مطحنة القهوة الكهربائية هايبرو G5 تيتانيوم",
      "sloganEn": "TITANIUM CONICAL BURRS | Zero-Retention Precision In One Touch",
      "sloganAr": "تروس تيتانيوم مخروطية | طحن دقيق باحتباس صفري بلمسة واحدة",
      "badgeEn": "ZERO-RETENTION MILL",
      "badgeAr": "طحن دقيق باحتباس صفري",
      "bgGradient": "from-[#141210] via-[#241c16] to-[#0c0a09]",
      "heroImage": "/src/assets/images/hibrew_grinder_isolated.jpg",
      "featuresEn": [
        "40mm CNC Titanium Conical Burrs",
        "40 Stepped Micro Settings",
        "<0.1g Zero Retention Air Bellows",
        "Low-RPM Quiet DC Motor"
      ],
      "featuresAr": [
        "تروس تيتانيوم مخروطية 40 ملم",
        "40 درجة طحن ميكرو دقيقة",
        "مضخة تفريغ احتباس صفري <0.1g",
        "محرك بطيء هادئ يحمي الزيوت"
      ]
    }
  },
  {
    "id": "hb-boltfilter-58-naked",
    "storeId": "store-coffee",
    "name": "58mm Naked Walnut Boltfilter",
    "nameAr": "بورتافلتر مكشوف مقاس 58 ملم مع مقبض خشب الجوز",
    "nameEn": "58mm Naked Walnut Boltfilter",
    "sku": "HB-HB-BOLTFILTER-58",
    "category": "مستلزمات الباريستا والأكواب",
    "categoryAr": "مستلزمات الباريستا والأكواب",
    "categoryEn": "Barista Accessories & Ceramic Cups",
    "price": 159,
    "originalPrice": 220,
    "discountedPrice": 159,
    "costPrice": 99,
    "taxRate": 15,
    "weightKg": 0.8,
    "stock": 60,
    "status": "published",
    "isActive": true,
    "isStale": false,
    "publishedAt": "2025-01-15",
    "image": "/src/assets/images/hibrew_portafilter_isolated.jpg",
    "galleryUrls": [
      "/src/assets/images/hibrew_portafilter_isolated.jpg",
      "/src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg"
    ],
    "images": [
      "/src/assets/images/hibrew_portafilter_isolated.jpg",
      "/src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg"
    ],
    "tags": [
      "hibrew",
      "coffee",
      "accessories",
      "barista",
      "ksa",
      "official",
      "20bar"
    ],
    "description": "Inspect extraction flow, eliminate channeling, and capture mesmerizing crema streams. The 58mm Naked Boltfilter is the standard tool for every serious home barista.",
    "descriptionAr": "شاهد تدفق الكريمة الذهبية واكتشف قنوات الاستخلاص مباشرة. بورتافلتر مكشوف فاخر بمقبض خشبي يمنحك استخلاصاً سلساً وطعماً متوازناً.",
    "descriptionEn": "Inspect extraction flow, eliminate channeling, and capture mesmerizing crema streams. The 58mm Naked Boltfilter is the standard tool for every serious home barista.",
    "subtitle": "Solid Food-Grade 304 Steel · Walnut Hardwood · Micro-Laser Basket",
    "subtitleAr": "ستانلس 304 صحي مع مقبض خشب جوز طبيعي وباسكت دقيق الفتحات 18 جرام",
    "productType": "Physical Product",
    "rating": 4.94,
    "reviewsCount": 310,
    "brand": "HiBrew (هاي برو)",
    "countryOfOrigin": "Saudi Arabia Official Agent / الضمان المعتمد بالسعودية",
    "requiresShipping": true,
    "trackInventory": true,
    "salesCount": 992,
    "specs": [
      {
        "label": "Basket Diameter",
        "value": "58.4mm Precision Fit",
        "labelAr": "القطر القياسي",
        "valueAr": "58.4 ملم مطابق لمكائن هاي برو والمكائن التجارية E61"
      },
      {
        "label": "Handle Material",
        "value": "Hand-carved Natural Walnut with Ergonomic Balance",
        "labelAr": "خامة المقبض",
        "valueAr": "خشب جوز طبيعي معالج ضد الماء والرطوبة"
      },
      {
        "label": "Head Material",
        "value": "Food-Safe Heavyweight 304 Stainless Steel",
        "labelAr": "رأس البورتافلتر",
        "valueAr": "ستانلس ستيل 304 مصمت عالي التحمل"
      }
    ],
    "colors": [
      {
        "id": "col-hb-boltfilter-58-naked-0",
        "nameAr": "خشب الجوز الملكي",
        "nameEn": "Natural Walnut",
        "hex": "#5A3825",
        "image": "/src/assets/images/hibrew_portafilter_isolated.jpg"
      },
      {
        "id": "col-hb-boltfilter-58-naked-1",
        "nameAr": "خشب الأبنوس الداكن",
        "nameEn": "Dark Ebony",
        "hex": "#27201D",
        "image": "/src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg"
      }
    ],
    "storageOptions": [
      {
        "capacity": "58mm Standard E61/HiBrew",
        "ram": "Includes 18g Precision Basket",
        "priceDelta": 0
      },
      {
        "capacity": "58mm Triple Basket Kit",
        "ram": "Includes 22g Basket + Puck Screen",
        "priceDelta": 45
      }
    ],
    "warranties": [],
    "bundles": [],
    "partsShowcase": [
      {
        "id": "part-bf-head-craft",
        "tagEn": "CRAFTSMANSHIP & SOLID STEEL",
        "tagAr": "حرفية التصنيع والصلابة العالية",
        "titleEn": "Hand-Carved Natural Walnut & Solid 304 Stainless Steel Head",
        "titleAr": "مقبض خشب الجوز الأمريكي الطبيعي ورأس ستانلس ستيل 304 مصمت",
        "descriptionEn": "Forged from heavyweight 304 food-grade stainless steel with precision ear angles. Fitted with hand-shaped American walnut hardwood balanced for ergonomic barista comfort.",
        "descriptionAr": "مصنوع من قطعة صلبة من الستانلس ستيل 304 الآمن غذائياً مع زوايا تثبيت دقيقة ومقبض متوازن من خشب الجوز المعالج طبيعياً ضد الرطوبة وحرارة الاستخلاص.",
        "image": "/src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg",
        "stats": [
          {
            "labelEn": "Head Steel",
            "labelAr": "خامة الرأس",
            "value": "304 Solid Stainless"
          },
          {
            "labelEn": "Wood Grip",
            "labelAr": "خامة المقبض",
            "value": "Natural Walnut"
          },
          {
            "labelEn": "Weight",
            "labelAr": "الوزن الإجمالي",
            "value": "540g Balanced"
          }
        ]
      },
      {
        "id": "part-bf-usage-stream",
        "tagEn": "TOOL IN-USE · BOTTOMLESS EXTRACTION",
        "tagAr": "الأداة أثناء الاستخدام · استخلاص مكشوف وتدفق كريمة",
        "titleEn": "Unobstructed Golden Crema Stream Convergence",
        "titleAr": "تدفق الكريمة الذهبية السلس وتجمع قطرات الإسبريسو في المنتصف",
        "descriptionEn": "Witness the cone of golden crema form directly under the basket. Observe extraction symmetry in real-time to immediately diagnose tamping level and channeling issues.",
        "descriptionAr": "استمتع بمشاهدة مخروط الكريمة الذهبية وهو يتجمع في المنتصف بتناغم ساحر. يمنحك البورتافلتر المكشوف كشفاً بصرياً فورياً لجودة كبس البن وغياب أي قنوات مائية.",
        "image": "/src/assets/images/coffee_making_crema_flow_1791221127339.jpg",
        "stats": [
          {
            "labelEn": "Extraction Type",
            "labelAr": "طريقة الاستخلاص",
            "value": "Bottomless Naked"
          },
          {
            "labelEn": "Diagnosis",
            "labelAr": "التشخيص البصري",
            "value": "Zero Channeling"
          },
          {
            "labelEn": "Flavor Profile",
            "labelAr": "إيحاءات النكهة",
            "value": "Maximum Body"
          }
        ]
      },
      {
        "id": "part-bf-puck-prep",
        "tagEn": "BARISTA PUCK PREPARATION",
        "tagAr": "تحضير قرص البن وكبس متساوي",
        "titleEn": "Flat 58.4mm Compaction & Puck Screen Compatibility",
        "titleAr": "كبس مستوي مقاس 58.4 ملم وتوافق كامل مع شاشات البك سكرين",
        "descriptionEn": "The vertical straight sidewall design supports full depth tamping down to 18-20g. Accommodates standard 58.5mm precision tampers and ultra-thin mesh puck screens.",
        "descriptionAr": "تصميم الحواف الداخلية المستقيمة يسمح بنزول التامبر حتى قاع الباسكت لكبس 18-20 جرام باحترافية، ويتوافق تماماً مع شاشات توزيع الماء البك سكرين.",
        "image": "/src/assets/images/barista_tamping_shot_1791363346824.jpg",
        "stats": [
          {
            "labelEn": "Tamper Fit",
            "labelAr": "مقاس التامبر",
            "value": "58.4 - 58.5mm"
          },
          {
            "labelEn": "Basket Depth",
            "labelAr": "عمق الباسكت",
            "value": "26mm Precision"
          },
          {
            "labelEn": "Screen Fit",
            "labelAr": "توافق البك سكرين",
            "value": "100% Compatible"
          }
        ]
      },
      {
        "id": "part-bf-basket-perforation",
        "tagEn": "MICRO-LASER PERFORATION",
        "tagAr": "باسكت ليزري دقيق الفتحات",
        "titleEn": "Micro-Laser Precision Perforated Filter Basket (18g)",
        "titleAr": "باسكت استخلاص ليزري عالي الدقة سعة 18 جرام",
        "descriptionEn": "Laser-perforated holes distributed with microscopic symmetry ensure consistent water hydraulic resistance across every square millimeter of the espresso bed.",
        "descriptionAr": "فتحات ليزرية متناهية الصغر وموزعة بنسب رياضية دقيقة تضمن توازن مقاومة الماء عبر كافة مساحة قرص القهوة لمنع خروج القهوة غير المتجانس.",
        "image": "/src/assets/images/barista_crema_macro_1791363328316.jpg",
        "stats": [
          {
            "labelEn": "Hole Count",
            "labelAr": "عدد الفتحات",
            "value": "648 Precision"
          },
          {
            "labelEn": "Basket Dose",
            "labelAr": "جرعة الباسكت",
            "value": "18g Standard"
          },
          {
            "labelEn": "Polishing",
            "labelAr": "المعالجة",
            "value": "Mirror Electro-polish"
          }
        ]
      },
      {
        "id": "part-bf-compatibility",
        "tagEn": "E61 & HIBREW COMPATIBILITY",
        "tagAr": "توافق شامل مع كبرى المكائن",
        "titleEn": "Universal Dual-Ear 58.4mm Commercial Grouphead Fit",
        "titleAr": "توافق كامل مع مقابس مكائن هاي برو ومكائن المقاهي E61 التجارية",
        "descriptionEn": "Precision-angled dual ears lock securely into HiBrew Barista Pro machines, as well as universal E61 groupheads, Rocket, ECM, Sanremo, and commercial café equipment.",
        "descriptionAr": "زعانف تثبيت مزدوجة بسماكة 4 ملم تقفل بإحكام تام على مكائن هاي برو بارستا برو، ومكائن المقاهي العالمية بنظام E61 دون أي تسريب لضغط الـ 20 بار.",
        "image": "/src/assets/images/hibrew_barista_pro_details_showcase_1791364980884.jpg",
        "stats": [
          {
            "labelEn": "Group Standard",
            "labelAr": "معيار المقبس",
            "value": "58mm E61 Standard"
          },
          {
            "labelEn": "Ear Thickness",
            "labelAr": "سماكة الأذن",
            "value": "4.0mm Dual"
          },
          {
            "labelEn": "Gasket Seal",
            "labelAr": "إحكام الإغلاق",
            "value": "Leak-Proof Lock"
          }
        ]
      }
    ],
    "heroBanner": {
      "headlineEn": "HiBrew 58mm Naked Walnut Boltfilter",
      "headlineAr": "بورتافلتر مكشوف مقاس 58 ملم مع مقبض خشب الجوز",
      "sloganEn": "NAKED EXTRACTION | Visual Crema Perfection In Every Shot",
      "sloganAr": "استخلاص مكشوف | تدفق الكريمة الذهبية المثالي في كل شوت",
      "badgeEn": "BARISTA BOLTFILTER 58MM",
      "badgeAr": "بورتافلتر باريستا مكشوف",
      "bgGradient": "from-[#18100c] via-[#2a1711] to-[#0c0806]",
      "heroImage": "/src/assets/images/hibrew_portafilter_isolated.jpg",
      "featuresEn": [
        "Solid Food-Grade 304 Steel Head",
        "Handcrafted Natural Walnut Grip",
        "Micro-Laser 18g Precision Basket",
        "Visual Channeling Diagnostic"
      ],
      "featuresAr": [
        "رأس ستانلس ستيل 304 صحي مصمت",
        "مقبض خشب جوز أمريكي طبيعي",
        "باسكت ليزري دقيق الفتحات 18 جرام",
        "كشف قنوات التدفق وتحسين النكهة"
      ]
    }
  },
  {
    "id": "hb-nordic-cabinet",
    "storeId": "store-coffee",
    "name": "Artisan Fluted Oak Coffee Corner Station",
    "nameAr": "دولاب وركن القهوة الفاخر من خشب البلوط المضلع مع إضاءة ليد مخفية",
    "nameEn": "Artisan Fluted Oak Coffee Corner Station",
    "sku": "HB-HB-NORDIC-CABINE",
    "category": "دواليب وأركان القهوة الفاخرة",
    "categoryAr": "دواليب وأركان القهوة الفاخرة",
    "categoryEn": "Luxury Coffee Cabinets & Stations",
    "price": 1490,
    "originalPrice": 1890,
    "discountedPrice": 1490,
    "costPrice": 924,
    "taxRate": 15,
    "weightKg": 38,
    "stock": 8,
    "status": "published",
    "isActive": true,
    "isStale": false,
    "publishedAt": "2025-01-15",
    "image": "/src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg",
    "galleryUrls": [
      "/src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg",
      "/src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg"
    ],
    "images": [
      "/src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg",
      "/src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg"
    ],
    "tags": [
      "hibrew",
      "coffee",
      "cabinets",
      "barista",
      "ksa",
      "official",
      "20bar"
    ],
    "description": "The centerpiece of your home coffee sanctuary. Handcrafted with fluted architectural lines, heat-resistant stone-feel countertop, soft-close drawers, and dedicated barista compartments.",
    "descriptionAr": "التحفة الفنية في مجلسك أو صالتك. دولاب ركن القهوة المودرن الفاخر المجهز بفتحات مخفية لتوصيل الكهرباء وإضاءة ليد دافئة تبرز جمال أجهزتك وأكوابك.",
    "descriptionEn": "The centerpiece of your home coffee sanctuary. Handcrafted with fluted architectural lines, heat-resistant stone-feel countertop, soft-close drawers, and dedicated barista compartments.",
    "subtitle": "Solid Natural Oak · Integrated Warm LED · Concealed Cable Ports",
    "subtitleAr": "خشب بلوط طبيعي صلب مع إضاءة شريطية دافئة وتمديدات كهربائية مخفية",
    "productType": "Physical Product",
    "rating": 4.97,
    "reviewsCount": 168,
    "brand": "HiBrew (هاي برو)",
    "countryOfOrigin": "Saudi Arabia Official Agent / الضمان المعتمد بالسعودية",
    "requiresShipping": true,
    "trackInventory": true,
    "salesCount": 538,
    "specs": [
      {
        "label": "Dimensions",
        "value": "W 120cm × H 95cm × D 45cm",
        "labelAr": "المقاسات والأبعاد",
        "valueAr": "العرض 120 سم × الارتفاع 95 سم × العمق 45 سم"
      },
      {
        "label": "Wood Grade",
        "value": "Kiln-Dried Solid White Oak with Moisture Seal",
        "labelAr": "نوع الخشب",
        "valueAr": "خشب بلوط طبيعي مجفف ومعالج ضد انسكاب القهوة والحرارة"
      },
      {
        "label": "Cable Routing",
        "value": "3 Concealed Rear Grommets + Internal Power Hub",
        "labelAr": "إدارة الأسلاك",
        "valueAr": "3 فتحات مخفية لتمديد كهرباء الماكينة والمطحنة دون فوضى أسلاك"
      },
      {
        "label": "Lighting",
        "value": "3000K Warm Ambient LED with Concealed Touch Switch",
        "labelAr": "الإضاءة المدمجة",
        "valueAr": "شريط LED دافئ 3000K بمستشعر لمس أنيق"
      }
    ],
    "colors": [
      {
        "id": "col-hb-nordic-cabinet-0",
        "nameAr": "بلوط طبيعي فاتح",
        "nameEn": "Nordic Oak",
        "hex": "#C29B62",
        "image": "/src/assets/images/hibrew_cabinet_isolated.jpg"
      },
      {
        "id": "col-hb-nordic-cabinet-1",
        "nameAr": "جوزي داكن",
        "nameEn": "Dark Walnut",
        "hex": "#4A3525",
        "image": "/src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg"
      }
    ],
    "storageOptions": [
      {
        "capacity": "Width 120cm Station",
        "ram": "2 Doors + 3 Drawers + LED",
        "priceDelta": 0
      },
      {
        "capacity": "Width 150cm Grand Station",
        "ram": "Includes Glass Cup Racks + LED",
        "priceDelta": 400
      }
    ],
    "warranties": [],
    "bundles": [],
    "partsShowcase": [
      {
        "id": "part-cab-fluted-joinery",
        "tagEn": "SOLID ARCHITECTURAL JOINERY",
        "tagAr": "خشب بلوط صلب بتصميم مضلع راقي",
        "titleEn": "Kiln-Dried Natural White Oak with Fluted Front Facade",
        "titleAr": "واجهة مضلعة من خشب البلوط الطبيعي الصلب المجفف بالفرن",
        "descriptionEn": "Precision-carved vertical fluting creates dynamic light and shadow interplay. Solid kiln-dried oak construction sealed against spills, moisture, and Saudi climate fluctuations.",
        "descriptionAr": "واجهة خشبية مضلعة رأسياً بحرفية اسكندنافية تضفي لمسة ديكورية آسرة. الخشب معالج حرارياً ومطلي بمادة شفافة واقية تمنع تغلغل بقع القهوة والماء.",
        "image": "/src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg",
        "stats": [
          {
            "labelEn": "Wood Grade",
            "labelAr": "نوع الخشب",
            "value": "Solid White Oak"
          },
          {
            "labelEn": "Joinery Type",
            "labelAr": "نوع التوصيل",
            "value": "Fluted Precision"
          },
          {
            "labelEn": "Protection",
            "labelAr": "طبقة الحماية",
            "value": "Nano Stain-Seal"
          }
        ]
      },
      {
        "id": "part-cab-in-use-bar",
        "tagEn": "STATION IN-USE · COFFEE BAR WORKFLOW",
        "tagAr": "الركن أثناء الاستخدام · ترتيب الأجهزة والأكواب",
        "titleEn": "Organized Barista Workflow: Machine, Mill & Cups In Harmony",
        "titleAr": "مساحة عمل متكاملة تتسع للماكينة والمطحنة والأكواب وسيروب القهوة",
        "descriptionEn": "Sized to comfortably house dual-boiler espresso machines, grinders, knock boxes, and glassware simultaneously with generous arm room for tamping and pouring latte art.",
        "descriptionAr": "مصمم بمقاسات هندسية مثالية تتيح وضع ماكينة القهوة الكبيرة والمطحنة والنوك بوكس جنباً إلى جنب مع مساحة مريحة لحركة اليدين أثناء إعداد كوب القهوة الصباحي.",
        "image": "/src/assets/images/coffee_corner_luxury_station_1791219182840.jpg",
        "stats": [
          {
            "labelEn": "Surface Width",
            "labelAr": "عرض السطح",
            "value": "120 - 150 cm"
          },
          {
            "labelEn": "Weight Load",
            "labelAr": "حمولة السطح",
            "value": "180 kg Max"
          },
          {
            "labelEn": "Ergonomics",
            "labelAr": "ارتفاع السطح",
            "value": "95 cm Barista"
          }
        ]
      },
      {
        "id": "part-cab-cable-routing",
        "tagEn": "CONCEALED CABLE MANAGEMENT",
        "tagAr": "تمديدات كهرباء ومنافذ مخفية تماماً",
        "titleEn": "3 Rear Grommets & Internal 6-Socket Power Station",
        "titleAr": "فتحات خلفية لتمرير الأسلاك ووحدة توزيع كهرباء داخلية مخفية",
        "descriptionEn": "Say goodbye to unsightly cord clutter. Dedicated rear pass-through grommets direct electrical cables down into a concealed internal power rail inside the cabinet.",
        "descriptionAr": "تخلص نهائياً من فوضى الأسلاك على طاولة القهوة. فتحات خلفية مخصصة تنزل أسلاك الماكينة والمطحنة والميزان مباشرة إلى داخل الدولاب لتتصل بوحدة كهرباء مدمجة.",
        "image": "/src/assets/images/coffee_machine_story_craft_1791221163767.jpg",
        "stats": [
          {
            "labelEn": "Cable Ports",
            "labelAr": "منافذ الأسلاك",
            "value": "3 Rear Grommets"
          },
          {
            "labelEn": "Internal Power",
            "labelAr": "الطاقة الداخلية",
            "value": "Multi-Socket Ready"
          },
          {
            "labelEn": "Aesthetics",
            "labelAr": "المظهر الخارجي",
            "value": "Zero Cord Clutter"
          }
        ]
      },
      {
        "id": "part-cab-warm-led",
        "tagEn": "INTEGRATED 3000K AMBIENT LED",
        "tagAr": "إضاءة محيطية شريطية دافئة 3000K",
        "titleEn": "Concealed Touch-Controlled 3000K Warm Glow Rail",
        "titleAr": "شريط إضاءة LED مدمج خفي مع مستشعر لمس أنيق بدون مفاتيح ظاهرة",
        "descriptionEn": "Soft 3000K warm diffused light casts a cozy golden glow across your espresso machines, cups, and hardwood textures, turning your morning ritual into pure relaxation.",
        "descriptionAr": "إضاءة محيطية صفراء دافئة 3000K مدمجة أسفل الحواف العلوية تبرز لمعان الستانلس ستيل وجمال الأكواب الخزفية، وتعمل بحساس لمس مخفي فائق الاستجابة.",
        "image": "/src/assets/images/ramadan_coffee_corner_hero_1791364235712.jpg",
        "stats": [
          {
            "labelEn": "Color Temp",
            "labelAr": "حرارة اللون",
            "value": "3000K Warm Gold"
          },
          {
            "labelEn": "Switch Mode",
            "labelAr": "طريقة التشغيل",
            "value": "Touch Sensor"
          },
          {
            "labelEn": "Lifespan",
            "labelAr": "عمر الإضاءة",
            "value": "50,000 Hours"
          }
        ]
      },
      {
        "id": "part-cab-sintered-counter",
        "tagEn": "HEAT & STAIN RESISTANT SLAB",
        "tagAr": "سطح بورسلان صخري فائق التحمل",
        "titleEn": "Sintered Stone Spill, Heat & Scratch-Proof Countertop",
        "titleAr": "سطح من الحجر البورسلاني الملبد المقاوم للحرارة والخدوش وانسكاب القهوة",
        "descriptionEn": "Non-porous stone-feel surface allows placing steaming portafilters and hot kettles directly without marks. Wipes completely clean in seconds with a damp microfiber cloth.",
        "descriptionAr": "سطح صخري غير مسامي لا يمتص السوائل إطلاقاً؛ يمكنك وضع البورتافلتر الساخن والغلاية عليه مباشرة دون قلق من أي تصبغات، وينظف بسهولة بمسحة واحدة.",
        "image": "/src/assets/images/coffee_people_luxury_lounge_1791221150246.jpg",
        "stats": [
          {
            "labelEn": "Heat Limit",
            "labelAr": "مقاومة الحرارة",
            "value": "Up to 300°C"
          },
          {
            "labelEn": "Absorption",
            "labelAr": "امتصاص السوائل",
            "value": "0% Non-Porous"
          },
          {
            "labelEn": "Scratch Proof",
            "labelAr": "مقاومة الخدش",
            "value": "Mohs Scale 7"
          }
        ]
      }
    ],
    "heroBanner": {
      "headlineEn": "Artisan Fluted Oak Coffee Station",
      "headlineAr": "دولاب وركن القهوة الفاخر من خشب البلوط المضلع مع إضاءة ليد مخفية",
      "sloganEn": "SCANDINAVIAN LUXURY | The Ultimate Home Coffee Sanctuary",
      "sloganAr": "فخامة اسكندنافية | ركن القهوة المتكامل لمنزلك العصري",
      "badgeEn": "ARTISAN FURNITURE",
      "badgeAr": "أثاث خشبي حرفي فاخر",
      "bgGradient": "from-[#191512] via-[#2c2219] to-[#0e0c0a]",
      "heroImage": "/src/assets/images/hibrew_cabinet_isolated.jpg",
      "featuresEn": [
        "Solid Kiln-Dried Natural White Oak",
        "Integrated 3000K Ambient LED Rail",
        "3 Concealed Rear Cable Ports",
        "Sintered Scratch-Resistant Top"
      ],
      "featuresAr": [
        "خشب بلوط طبيعي مجفف ومعالج",
        "إضاءة LED دافئة مدمجة 3000K",
        "3 منافذ مخفية لتمديدات الأسلاك",
        "سطح بورسلان مقاوم للحرارة والخدش"
      ]
    }
  },
  {
    "id": "hb-ceramic-artisan-cups",
    "storeId": "store-coffee",
    "name": "Artisan Stoneware Ceramic Cup Set (4 Pcs)",
    "nameAr": "طقم أكواب فلات وايت ولاتيه سيراميك حجري مع صحون (4 قطع)",
    "nameEn": "Artisan Stoneware Ceramic Cup Set (4 Pcs)",
    "sku": "HB-HB-CERAMIC-ARTIS",
    "category": "مستلزمات الباريستا والأكواب",
    "categoryAr": "مستلزمات الباريستا والأكواب",
    "categoryEn": "Barista Accessories & Ceramic Cups",
    "price": 169,
    "originalPrice": 210,
    "discountedPrice": 169,
    "costPrice": 105,
    "taxRate": 15,
    "weightKg": 0.8,
    "stock": 60,
    "status": "published",
    "isActive": true,
    "isStale": false,
    "publishedAt": "2025-01-15",
    "image": "/src/assets/images/hibrew_ceramic_cup_isolated.jpg",
    "galleryUrls": [
      "/src/assets/images/hibrew_ceramic_cup_isolated.jpg",
      "/src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg"
    ],
    "images": [
      "/src/assets/images/hibrew_ceramic_cup_isolated.jpg",
      "/src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg"
    ],
    "tags": [
      "hibrew",
      "coffee",
      "accessories",
      "barista",
      "ksa",
      "official",
      "20bar"
    ],
    "description": "Thick-walled stoneware mugs designed specifically for latte art. The curved interior bowl promotes smooth milk incorporation and prolonged heat retention.",
    "descriptionAr": "أكواب سيراميك مصنوعة يدوياً للمقاهي المختصة والمنازل الراقية، تحافظ على حرارة مشروبك وتمنحك تحكماً ممتعاً في صب الحليب ورسم اللاتيه.",
    "descriptionEn": "Thick-walled stoneware mugs designed specifically for latte art. The curved interior bowl promotes smooth milk incorporation and prolonged heat retention.",
    "subtitle": "Hand-Thrown Ceramic · Thermal Mass Retention · Curved Latte Art Base",
    "subtitleAr": "سيراميك ستونوير مصنوع يدوياً باحتفاظ حراري عالي وقاعدة مقعرة لرسم اللاتيه",
    "productType": "Physical Product",
    "rating": 4.91,
    "reviewsCount": 220,
    "brand": "HiBrew (هاي برو)",
    "countryOfOrigin": "Saudi Arabia Official Agent / الضمان المعتمد بالسعودية",
    "requiresShipping": true,
    "trackInventory": true,
    "salesCount": 704,
    "specs": [
      {
        "label": "Capacity",
        "value": "200ml / 6.8oz Barista Standard",
        "labelAr": "السعة",
        "valueAr": "200 مل النسبة الذهبية للفلات وايت والكورتادو"
      },
      {
        "label": "Kiln Firing",
        "value": "Double-fired High-Density Stoneware (1280°C)",
        "labelAr": "طريقة التصنيع",
        "valueAr": "حرق مزدوج عند 1280 درجة مئوية لمقاومة الصدمات"
      },
      {
        "label": "Care",
        "value": "100% Dishwasher, Microwave & Food Safe",
        "labelAr": "العناية",
        "valueAr": "آمن للغسالة والمايكروويف وصحي 100%"
      }
    ],
    "colors": [
      {
        "id": "col-hb-ceramic-artisan-cups-0",
        "nameAr": "رملي مطفي كلاسيكي",
        "nameEn": "Desert Matte Sand",
        "hex": "#D7C4A8",
        "image": "/src/assets/images/hibrew_ceramic_cup_isolated.jpg"
      },
      {
        "id": "col-hb-ceramic-artisan-cups-1",
        "nameAr": "طيني دافئ",
        "nameEn": "Terracotta Rust",
        "hex": "#A0522D",
        "image": "/src/assets/images/product_ceramic_cups_set_1791217230149.jpg"
      }
    ],
    "storageOptions": [
      {
        "capacity": "200ml (Flat White/Cortado)",
        "ram": "Set of 4 Cups + 4 Saucers",
        "priceDelta": 0
      },
      {
        "capacity": "300ml (Latte/Cappuccino)",
        "ram": "Set of 4 Large Cups + Saucers",
        "priceDelta": 30
      }
    ],
    "warranties": [],
    "bundles": [],
    "partsShowcase": [
      {
        "id": "part-cup-craft",
        "tagEn": "HANDMADE STONEWARE GLAZE",
        "tagAr": "طلاء فخاري يدوي وملمس مطفي ناعم",
        "titleEn": "1280°C Kiln-Fired High-Density Artisan Ceramic",
        "titleAr": "سيراميك ستونوير حجري عالي الكثافة محروق عند 1280 درجة مئوية",
        "descriptionEn": "Double-fired stoneware clay with tactile matte outer finish and silky smooth interior glaze. Extremely resistant to thermal shock, chips, and metal spoon scratches.",
        "descriptionAr": "فخار حجري عالي الكثافة خضع لحرقين متتاليين في أفران خزفية متطورة، يمنحك ملمساً ترابياً فاخراً ومقاوماً للصدمات الحرارية وخدوش ملاعق التحريك.",
        "image": "/src/assets/images/product_ceramic_cups_set_1791217230149.jpg",
        "stats": [
          {
            "labelEn": "Kiln Temp",
            "labelAr": "حرارة الفرن",
            "value": "1280°C Fired"
          },
          {
            "labelEn": "Material",
            "labelAr": "الخامة الأساسية",
            "value": "Dense Stoneware"
          },
          {
            "labelEn": "Safety",
            "labelAr": "معايير الأمان",
            "value": "100% Food Safe"
          }
        ]
      },
      {
        "id": "part-cup-usage-latte",
        "tagEn": "CUPS IN-USE · LATTE ART FLOW",
        "tagAr": "الأكواب أثناء الاستخدام · صب الحليب ورسم اللاتيه",
        "titleEn": "Parabolic Inner Basin for Seamless Milk Incorporation",
        "titleAr": "قاعدة داخلية مقعرة انسيابية تمنحك تحكماً كاملاً برسم اللاتيه آرت",
        "descriptionEn": "Designed with a rounded interior base that lets steamed microfoam slide under the espresso crema without breaking its surface tension, yielding crisp contrast in rosettas.",
        "descriptionAr": "قاع داخلي دائري انسيابي يسمح لتدفق الحليب المخفوق بالانزلاق بسلاسة أسفل طبقة الكريمة دون تفتيتها، مما يمنحك تبايناً ناصعاً ورسوماً متقنة للاتيه آرت.",
        "image": "/src/assets/images/barista_milk_steaming_1791363367164.jpg",
        "stats": [
          {
            "labelEn": "Bowl Geometry",
            "labelAr": "انحناء القاعدة",
            "value": "Parabolic Curve"
          },
          {
            "labelEn": "Crema Blend",
            "labelAr": "انسجام الكريمة",
            "value": "Zero Disruption"
          },
          {
            "labelEn": "Art Pour",
            "labelAr": "رسم اللاتيه",
            "value": "Competition Ready"
          }
        ]
      },
      {
        "id": "part-cup-interior-curve",
        "tagEn": "ERGONOMIC COMFORT GRIP",
        "tagAr": "مقبض مريح وتوازن مثالي في اليد",
        "titleEn": "Weighted Bottom Balance with Ergonomic Single-Finger Loop",
        "titleAr": "توزيع وزن متوازن ومقبض إصبع مريح يمنحك ثباتاً أثناء التقديم",
        "descriptionEn": "Center of gravity is engineered toward the base, preventing accidental tipping on trays or coffee corners while offering a pleasant, warm tactile hold in winter.",
        "descriptionAr": "تمت هندسة مركز الثقل نحو الأسفل لمنع أي انسكاب عرضي على الصواني أو طاولات القهوة، مع مقبض متزن يتيح حمل الفنجان براحة تامة.",
        "image": "/src/assets/images/espresso_wood_pitcher_1791363392554.jpg",
        "stats": [
          {
            "labelEn": "Base Weight",
            "labelAr": "وزن القاعدة",
            "value": "Weighted Low CG"
          },
          {
            "labelEn": "Handle Fit",
            "labelAr": "تصميم المقبض",
            "value": "Ergonomic Loop"
          },
          {
            "labelEn": "Comfort",
            "labelAr": "إحساس اليد",
            "value": "Thermal Touch"
          }
        ]
      },
      {
        "id": "part-cup-thermal-mass",
        "tagEn": "THERMAL RETENTION SHIELD",
        "tagAr": "احتفاظ حراري فائق للقهوة المختصة",
        "titleEn": "Thick Ceramic Walls Preserving 65°C Specialty Roast Temperature",
        "titleAr": "جدران سيراميكية سميكة تحفظ حرارة القهوة عند 65° مئوية المثالية",
        "descriptionEn": "Substantial thermal mass prevents rapid cool-down of specialty flat whites and cortados, allowing delicate citrus and floral aroma notes to shine until the last sip.",
        "descriptionAr": "جدار سميك بكتلة حرارية عالية يمنع برودة القهوة السريعة في الأجواء المكيفة، لتحافظ على نكهات وإيحاءات البن الفاكهية والزهرية حتى آخر رشفة.",
        "image": "/src/assets/images/barista_crema_macro_1791363328316.jpg",
        "stats": [
          {
            "labelEn": "Wall Thickness",
            "labelAr": "سمك الجدار",
            "value": "6.5mm Thermal"
          },
          {
            "labelEn": "Heat Hold",
            "labelAr": "حفظ الحرارة",
            "value": "25+ Minutes"
          },
          {
            "labelEn": "Target Temp",
            "labelAr": "الحرارة المثالية",
            "value": "65°C Sweet Spot"
          }
        ]
      },
      {
        "id": "part-cup-saucers-set",
        "tagEn": "SET OF 4 WITH MATCHING SAUCERS",
        "tagAr": "طقم 4 أكواب مع صحون مطابقة وعلبة فاخرة",
        "titleEn": "Set of 4 Artisan Cups with Textured Saucers & Gift Packaging",
        "titleAr": "طقم متكامل مكون من 4 أكواب و 4 صحون في علبة إهداء مبطنة فاخرة",
        "descriptionEn": "Includes four matching textured ceramic saucers with indented cup recesses to eliminate sliding. Packaged in a cushioned presentation box ready for gifting.",
        "descriptionAr": "يحتوي الطقم على 4 أكواب و 4 صحون سيراميك مطابقة بحفرة تثبيت تمنع انزلاق الكوب، مغلفة في صندوق إهداء فاخر ومبطن مناسب للمناسبات والهدايا.",
        "image": "/src/assets/images/saudi_coffee_collage_1791363410810.jpg",
        "stats": [
          {
            "labelEn": "Set Quantity",
            "labelAr": "محتويات الطقم",
            "value": "4 Cups + 4 Saucers"
          },
          {
            "labelEn": "Capacity",
            "labelAr": "السعة القياسية",
            "value": "200ml / 6.8oz"
          },
          {
            "labelEn": "Packaging",
            "labelAr": "نوع التغليف",
            "value": "Gift Box Padded"
          }
        ]
      }
    ],
    "heroBanner": {
      "headlineEn": "Artisan Stoneware Ceramic Cup Set",
      "headlineAr": "طقم أكواب فلات وايت ولاتيه سيراميك حجري مع صحون (4 قطع)",
      "sloganEn": "HAND-THROWN STONEWARE | Thermal Mass & Parabolic Latte Art Base",
      "sloganAr": "سيراميك ستونوير يدوي | احتفاظ حراري وقاعدة مقعرة لرسم اللاتيه",
      "badgeEn": "ARTISAN STONEWARE",
      "badgeAr": "سيراميك يدوي فاخر",
      "bgGradient": "from-[#19130f] via-[#2a1d15] to-[#0d0907]",
      "heroImage": "/src/assets/images/product_ceramic_cups_set_1791217230149.jpg",
      "featuresEn": [
        "Double-Fired 1280°C Stoneware",
        "Parabolic Curved Latte Art Bowl",
        "Thick Heat-Insulating Walls",
        "Microwave & Dishwasher Safe"
      ],
      "featuresAr": [
        "حرق مزدوج عند 1280° مئوية",
        "قاعدة داخلية مقعرة لصب اللاتيه",
        "جدران سميكة تحفظ حرارة المشروب",
        "آمن لغسالة الصحون والمايكروويف"
      ]
    }
  },
  {
    "id": "hb-doublewall-paper-cups",
    "storeId": "store-coffee",
    "name": "Double-Wall Kraft Paper Coffee Cups (500 Pcs)",
    "nameAr": "كرتون أكواب ورقية دبل جدار عازلة مع أغطية محكمة (500 كوب)",
    "nameEn": "Double-Wall Kraft Paper Coffee Cups (500 Pcs)",
    "sku": "HB-HB-DOUBLEWALL-PA",
    "category": "مستلزمات الباريستا والأكواب",
    "categoryAr": "مستلزمات الباريستا والأكواب",
    "categoryEn": "Barista Accessories & Ceramic Cups",
    "price": 185,
    "originalPrice": 240,
    "discountedPrice": 185,
    "costPrice": 115,
    "taxRate": 15,
    "weightKg": 0.8,
    "stock": 60,
    "status": "published",
    "isActive": true,
    "isStale": false,
    "publishedAt": "2025-01-15",
    "image": "/src/assets/images/coffee_paper_cups_bulk_1791218958527.jpg",
    "galleryUrls": [
      "/src/assets/images/coffee_paper_cups_bulk_1791218958527.jpg",
      "/src/assets/images/product_ceramic_cups_set_1791217230149.jpg"
    ],
    "images": [
      "/src/assets/images/coffee_paper_cups_bulk_1791218958527.jpg",
      "/src/assets/images/product_ceramic_cups_set_1791217230149.jpg"
    ],
    "tags": [
      "hibrew",
      "coffee",
      "accessories",
      "barista",
      "ksa",
      "official",
      "20bar"
    ],
    "description": "Premium double-wall ripple paper cups designed for offices, specialty coffee shops, catering events, and car commutes. Features click-tight sip lids that prevent road spills.",
    "descriptionAr": "الخيار المفضل للمكاتب الفاخرة والمقاهي والمناسبات، جدار مزدوج عازل وأغطية محكمة تضمن عدم تسريب أي قطرة أثناء القيادة والحركة.",
    "descriptionEn": "Premium double-wall ripple paper cups designed for offices, specialty coffee shops, catering events, and car commutes. Features click-tight sip lids that prevent road spills.",
    "subtitle": "Double-Wall Ripple Insulation · No Cup Sleeve Needed · Leak-Proof Lids",
    "subtitleAr": "طبقتان عازلتان لحماية اليدين من الحرارة مع أغطية كبس مانعة للتسريب تماماً",
    "productType": "Physical Product",
    "rating": 4.88,
    "reviewsCount": 142,
    "brand": "HiBrew (هاي برو)",
    "countryOfOrigin": "Saudi Arabia Official Agent / الضمان المعتمد بالسعودية",
    "requiresShipping": true,
    "trackInventory": true,
    "salesCount": 454,
    "specs": [
      {
        "label": "Pack Quantity",
        "value": "500 Heavy-Duty Cups + 500 Snug Lids",
        "labelAr": "الكمية الإجمالية",
        "valueAr": "500 كوب دبل جدار + 500 غطاء شرب أسود"
      },
      {
        "label": "Thermal Shield",
        "value": "Double-Wall corrugated insulation (No cardboard sleeve required)",
        "labelAr": "العزل الحراري",
        "valueAr": "جدار مزدوج يعزل حرارة المشروب عن اليدين تماماً"
      },
      {
        "label": "Eco Certified",
        "value": "PLA Plant-Lined Biodegradable Virgin Fiber",
        "labelAr": "صديق للبيئة",
        "valueAr": "ورق طبيعي ببطانة نباتية خالية من البلاستيك الضار"
      }
    ],
    "colors": [
      {
        "id": "col-hb-doublewall-paper-cups-0",
        "nameAr": "كرافت طبيعي أصيل",
        "nameEn": "Natural Kraft",
        "hex": "#A67B5B",
        "image": "/src/assets/images/coffee_paper_cups_bulk_1791218958527.jpg"
      },
      {
        "id": "col-hb-doublewall-paper-cups-1",
        "nameAr": "أسود فاحم مطفي",
        "nameEn": "Matte Charcoal Black",
        "hex": "#1F1E1D",
        "image": "/src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg"
      }
    ],
    "storageOptions": [
      {
        "capacity": "8oz / 240ml Bulk Pack",
        "ram": "500 Cups + 500 Tight Sip Lids",
        "priceDelta": 0
      },
      {
        "capacity": "12oz / 350ml Bulk Pack",
        "ram": "500 Cups + 500 Tight Sip Lids",
        "priceDelta": 35
      }
    ],
    "warranties": [],
    "bundles": [],
    "partsShowcase": [
      {
        "id": "part-pc-double-wall",
        "tagEn": "CORRUGATED THERMAL SHIELD",
        "tagAr": "طبقتان عازلتان تحميان اليدين",
        "titleEn": "Double-Wall Thermal Barrier: Zero Heat Transfer to Hands",
        "titleAr": "جدار مزدوج سميك يعزل حرارة القهوة المغلية تماماً دون الحاجة لكرتون واقٍ",
        "descriptionEn": "The corrugated air pocket trapped between the inner and outer paper layers provides superior thermal insulation. Hold steaming hot 90°C coffee comfortably without scalding your fingers.",
        "descriptionAr": "طبقة هواء عازلة محصورة بين الجدارين الداخلي والخارجي تعزل حرارة القهوة الساخنة حتى 90 درجة مئوية، مما يتيح حمل الكوب بأمان دون الحاجة إلى وضع سليف إضافي.",
        "image": "/src/assets/images/coffee_paper_cups_bulk_1791218958527.jpg",
        "stats": [
          {
            "labelEn": "Layers",
            "labelAr": "عدد الطبقات",
            "value": "Double-Wall Core"
          },
          {
            "labelEn": "Sleeve Needed",
            "labelAr": "الحاجة لواقي",
            "value": "0% None Required"
          },
          {
            "labelEn": "Paper Weight",
            "labelAr": "وزن الورق",
            "value": "320g + 280g Kraft"
          }
        ]
      },
      {
        "id": "part-pc-in-use-drive",
        "tagEn": "CUPS IN-USE · COMMUTE & CAR FIT",
        "tagAr": "الأكواب أثناء الاستخدام · القيادة والتنقل اليومي",
        "titleEn": "Road-Tested Car Cup Holder Fit with Leak-Proof Drinking Flow",
        "titleAr": "مقاس متوافق مع كافة حاملات أكواب السيارات وتدفق سلس بدون تناثر",
        "descriptionEn": "Calibrated base diameter slots snugly into all automotive cup holders. Firm structural rim ensures the cup never crumples or leaks when lifted with one hand while driving.",
        "descriptionAr": "قاعدة مدببة متوافقة بدقة مع كافة حاملات الأكواب في السيارات السعودية، مع حافة علوية ملفوفة بقوة تمنع انطباق الكوب أو انسكاب القهوة أثناء المطبات والحركة.",
        "image": "/src/assets/images/saudi_cafe_machine_1791363309148.jpg",
        "stats": [
          {
            "labelEn": "Car Fit",
            "labelAr": "حامل السيارة",
            "value": "Universal Fit"
          },
          {
            "labelEn": "Rim Rigidity",
            "labelAr": "صلابة الحافة",
            "value": "High Crush Proof"
          },
          {
            "labelEn": "Grip",
            "labelAr": "ثبات اليد",
            "value": "Non-Slip Texture"
          }
        ]
      },
      {
        "id": "part-pc-leakproof-lid",
        "tagEn": "CLICK-TIGHT SNAP LIDS",
        "tagAr": "أغطية كبس محكمة مانعة للتسريب",
        "titleEn": "Ergonomic Raised Sip Opening with Positive Click Seal",
        "titleAr": "غطاء شرب مرتفع بحافة كبس محكمة تمنع التسريب حتى عند الإمالة",
        "descriptionEn": "Features an audible snap click seal that forms an airtight bond with the cup rim. Raised sip spout and tiny air vent promote a smooth, splash-free liquid flow with thick crema.",
        "descriptionAr": "يتميز بصوت كبس واضح يؤكد إحكام الإغلاق مع حافة الكوب، مع فتحة شرب مرتفعة ومريح للشفاه وثقب تهوية دقيق يضمن نزول القهوة بانسيابية دون فوران.",
        "image": "/src/assets/images/coffee_barista_accessories_set_1791219198302.jpg",
        "stats": [
          {
            "labelEn": "Seal Mechanism",
            "labelAr": "نوع القفل",
            "value": "Audible Click Snap"
          },
          {
            "labelEn": "Leak Proof",
            "labelAr": "منع التسريب",
            "value": "100% Guaranteed"
          },
          {
            "labelEn": "Spout Height",
            "labelAr": "ارتفاع الفتحة",
            "value": "14mm Ergonomic"
          }
        ]
      },
      {
        "id": "part-pc-eco-lining",
        "tagEn": "PLANT-BASED PLA LINING",
        "tagAr": "بطانة نباتية صحية قابلة للتحلل",
        "titleEn": "100% Virgin Kraft Paper with Plant-Derived PLA Moisture Barrier",
        "titleAr": "ورق كرافت طبيعي بكر مع بطانة نباتية خالية من المواد الكيميائية الضارة",
        "descriptionEn": "Replaces conventional petroleum wax with renewable cornstarch PLA lining. Certified odorless, BPA-free, and leaves zero chemical aftertaste in delicate specialty coffee.",
        "descriptionAr": "يستبدل الطلاء البلاستيكي التقليدي ببطانة نباتية متطورة مصنوعة من نشا الذرة قابلة للتحلل، وخالية تماماً من الروائح أو المواد الضارة لحماية نكهة البن النقية.",
        "image": "/src/assets/images/saudi_coffee_collage_1791363410810.jpg",
        "stats": [
          {
            "labelEn": "Lining Material",
            "labelAr": "مادة البطانة",
            "value": "Plant PLA Resin"
          },
          {
            "labelEn": "Chemicals",
            "labelAr": "المواد الضارة",
            "value": "0% BPA Free"
          },
          {
            "labelEn": "Biodegradable",
            "labelAr": "قابلية التحلل",
            "value": "Eco Certified"
          }
        ]
      },
      {
        "id": "part-pc-bulk-supply",
        "tagEn": "BULK VALUE 500-PIECE CARTON",
        "tagAr": "كرتون تجاري اقتصادي 500 كوب",
        "titleEn": "Cost-Effective 500 Pack for Cafés, Corporate Offices & Events",
        "titleAr": "كرتون جملة اقتصادي يحتوي على 500 كوب + 500 غطاء محكم للمكاتب والمناسبات",
        "descriptionEn": "Packed in hygienic sealed sleeves of 50 cups each inside a heavy corrugated carton. Ideal for busy specialty coffee businesses, company breakrooms, and royal gatherings.",
        "descriptionAr": "مغلف في أكياس صحية محكمة يحتوي كل كيس على 50 كوباً داخل كرتون قوي، مثالي لشركات القهوة، ومكاتب العمل الفاخرة، ومناسبات الضيافة الكبرى بالمملكة.",
        "image": "/src/assets/images/coffee_people_luxury_lounge_1791221150246.jpg",
        "stats": [
          {
            "labelEn": "Carton Count",
            "labelAr": "إجمالي الكرتون",
            "value": "500 Cups + Lids"
          },
          {
            "labelEn": "Sleeve Bundles",
            "labelAr": "التغليف الداخلي",
            "value": "10 × 50 Cups"
          },
          {
            "labelEn": "Shipping",
            "labelAr": "الشحن والتوصيل",
            "value": "Fast Express KSA"
          }
        ]
      }
    ],
    "heroBanner": {
      "headlineEn": "Double-Wall Kraft Coffee Cups (500 Pcs)",
      "headlineAr": "كرتون أكواب ورقية دبل جدار عازلة مع أغطية محكمة (500 كوب)",
      "sloganEn": "RIPPLE THERMAL SHIELD | Spill-Proof Commute & Commercial Grade",
      "sloganAr": "عزل حراري دبل جدار | أغطية محكمة مانعة للتسريب ومناسبة للسيارة",
      "badgeEn": "COMMERCIAL BULK 500",
      "badgeAr": "توريد المقاهي والمكاتب 500 كوب",
      "bgGradient": "from-[#1a140f] via-[#291e15] to-[#0e0a07]",
      "heroImage": "/src/assets/images/coffee_paper_cups_bulk_1791218958527.jpg",
      "featuresEn": [
        "Double-Wall Insulated Ripple Paper",
        "Zero Sleeve Required Insulation",
        "Click-Tight Leak-Proof Sip Lids",
        "100% Biodegradable PLA Lined"
      ],
      "featuresAr": [
        "طبقتان ورق مقوى عازل للحرارة",
        "لا حاجة للسليدج أو الواقي الورقي",
        "أغطية كبس محكمة مانعة للتسريب",
        "بطانة نباتية PLA صديقة للبيئة"
      ]
    }
  },
  {
    "id": "hb-luxury-corner-station",
    "storeId": "store-coffee",
    "name": "Master Barista Home Coffee Corner Station",
    "nameAr": "ركن القهوة المتكامل الفاخر مع رفوف زجاجية وإضاءة محيطية",
    "nameEn": "Master Barista Home Coffee Corner Station",
    "sku": "HB-HB-LUXURY-CORNER",
    "category": "دواليب وأركان القهوة الفاخرة",
    "categoryAr": "دواليب وأركان القهوة الفاخرة",
    "categoryEn": "Luxury Coffee Cabinets & Stations",
    "price": 2890,
    "originalPrice": 3490,
    "discountedPrice": 2890,
    "costPrice": 1792,
    "taxRate": 15,
    "weightKg": 38,
    "stock": 8,
    "status": "published",
    "isActive": true,
    "isStale": false,
    "publishedAt": "2025-01-15",
    "image": "/src/assets/images/coffee_corner_luxury_station_1791219182840.jpg",
    "galleryUrls": [
      "/src/assets/images/coffee_corner_luxury_station_1791219182840.jpg",
      "/src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg"
    ],
    "images": [
      "/src/assets/images/coffee_corner_luxury_station_1791219182840.jpg",
      "/src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg"
    ],
    "tags": [
      "hibrew",
      "coffee",
      "cabinets",
      "barista",
      "ksa",
      "official",
      "20bar"
    ],
    "description": "The pinnacle of home barista luxury. Designed specifically for coffee lovers who want an all-in-one showpiece that organizes espresso machines, precision mills, syrups, and cups in pure harmony.",
    "descriptionAr": "ركن القهوة المتكامل الفاخر الذي يحول منزلك إلى مقهى مختص. يتضمن سطوح بورسلان مقاومة للحرارة وأرفف إضاءة ليد مدمجة وأدراج لتنظيم كافة أدوات الباريستا.",
    "descriptionEn": "The pinnacle of home barista luxury. Designed specifically for coffee lovers who want an all-in-one showpiece that organizes espresso machines, precision mills, syrups, and cups in pure harmony.",
    "subtitle": "Custom Fluted Bar Credenza · Integrated LED Rails · Concealed Water Line",
    "subtitleAr": "ركن قهوة متكامل بتصميم مضلع وإضاءة ليد ذكية وتجهيز لتوصيل شبكة المياه والكهرباء",
    "productType": "Physical Product",
    "rating": 4.98,
    "reviewsCount": 98,
    "brand": "HiBrew (هاي برو)",
    "countryOfOrigin": "Saudi Arabia Official Agent / الضمان المعتمد بالسعودية",
    "requiresShipping": true,
    "trackInventory": true,
    "salesCount": 314,
    "specs": [
      {
        "label": "Total Dimensions",
        "value": "W 140cm × H 195cm × D 50cm",
        "labelAr": "الأبعاد الإجمالية",
        "valueAr": "العرض 140 سم × الارتفاع 195 سم × العمق 50 سم"
      },
      {
        "label": "Countertop",
        "value": "Sintered Stone Thermal Slab (Scratch & Heat Resistant)",
        "labelAr": "سطح العمل",
        "valueAr": "رخام صناعي بورسلان مقاوم للحرارة والخدش وسوائل القهوة"
      },
      {
        "label": "Built-in Features",
        "value": "Integrated Knock Box Drawer + Cup Drain Tray + 6 Power Sockets",
        "labelAr": "المزايا المدمجة",
        "valueAr": "درج تخلص من البن مدمج، صينية تصريف أكواب، و 6 منافذ طاقة مخفية"
      }
    ],
    "colors": [
      {
        "id": "col-hb-luxury-corner-station-0",
        "nameAr": "جوز مدخن مع نحاس",
        "nameEn": "Smoked Walnut & Brass",
        "hex": "#3E2723",
        "image": "/src/assets/images/coffee_corner_luxury_station_1791219182840.jpg"
      },
      {
        "id": "col-hb-luxury-corner-station-1",
        "nameAr": "بلوط اسكندنافي طبيعي",
        "nameEn": "Natural Scandinavian Oak",
        "hex": "#C29B62",
        "image": "/src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg"
      }
    ],
    "storageOptions": [
      {
        "capacity": "Standard 140cm Setup",
        "ram": "Base Cabinet + Dual Floating Shelves",
        "priceDelta": 0
      },
      {
        "capacity": "Grand 180cm Executive",
        "ram": "Includes Cup Rail + Knock Chute + LED",
        "priceDelta": 650
      }
    ],
    "warranties": [],
    "bundles": [],
    "partsShowcase": [
      {
        "id": "part-lcs-teak-credenza",
        "tagEn": "SOLID TEAK & SINTERED STONE",
        "tagAr": "خشب طبيعي فاخر مع رخام بورسلان صلب",
        "titleEn": "Royal Fluted Architectural Credenza & Sintered Slab",
        "titleAr": "دولاب خشبي مضلع فاخر مع سطح بورسلان حجري غير قابل للخدش",
        "descriptionEn": "Constructed from premium kiln-dried hardwoods with fluted side profiles and brushed brass handles. The sintered stone worktop withstands hot equipment and coffee spills effortlessly.",
        "descriptionAr": "مصنوع من أجود أنواع الأخشاب الصلبة المعالجة مع تفاصيل نحاسية مصقولة وسطح بورسلان حجري صلب يتحمل الأجهزة الثقيلة وسوائل القهوة الساخنة دون أي أثر.",
        "image": "/src/assets/images/coffee_corner_luxury_station_1791219182840.jpg",
        "stats": [
          {
            "labelEn": "Wood Framework",
            "labelAr": "نوع الخشب",
            "value": "Solid Hardwood"
          },
          {
            "labelEn": "Counter Material",
            "labelAr": "خامة السطح",
            "value": "Sintered Stone"
          },
          {
            "labelEn": "Hardware Accent",
            "labelAr": "المقابض",
            "value": "Brushed Brass"
          }
        ]
      },
      {
        "id": "part-lcs-in-use-bar",
        "tagEn": "STATION IN-USE · COMPLETE HOME CAFÉ",
        "tagAr": "الركن أثناء الاستخدام · مقهى مختص متكامل في المنزل",
        "titleEn": "Accommodates Flagship Machines, Commercial Grinder & Pitchers",
        "titleAr": "مساحة فسيحة تستوعب مكائن الدبل بويلر والمطاحن وأطقم الأكواب وسيروب القهوة",
        "descriptionEn": "Deep 50cm workspace leaves ample clearance behind espresso machines for water reservoir refilling and portafilter rotation. Dual floating shelves keep cups within arms reach.",
        "descriptionAr": "عمق 50 سم يوفر مساحة خلفية واسعة لتعبئة خزان الماء وحرية حركة البورتافلتر، مع رفين جداريين زجاجيين فاخرين لعرض الأكواب وسيروبات القهوة بأناقة.",
        "image": "/src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg",
        "stats": [
          {
            "labelEn": "Workspace Depth",
            "labelAr": "عمق السطح",
            "value": "50cm Commercial"
          },
          {
            "labelEn": "Shelf Capacity",
            "labelAr": "سعة الأرفف",
            "value": "24 Artisan Mugs"
          },
          {
            "labelEn": "Drain Pre-fit",
            "labelAr": "تصريف المياه",
            "value": "Ready for Plumbing"
          }
        ]
      },
      {
        "id": "part-lcs-knock-chute",
        "tagEn": "INTEGRATED KNOCK CHUTE",
        "tagAr": "درج تخلص من البن مدمج وصينية تصريف",
        "titleEn": "Integrated Soft-Damped Knock Box Drawer & Drip Drain",
        "titleAr": "درج نوك بوكس مدمج مبطن بالسيليكون لتفريغ كعكات القهوة دون فوضى",
        "descriptionEn": "Knock your spent coffee pucks silently into the heavy-duty stainless steel chute drawer. Removable container lifts out effortlessly for quick emptying into garden compost or trash.",
        "descriptionAr": "تخلص من كعكات القهوة المستخلصة فوراً بضربة واحدة في الدرج المدمج المبطن بربل مانع للصوت، مع وعاء داخلي قابل للرفع والغسيل السريع.",
        "image": "/src/assets/images/coffee_machine_story_craft_1791221163767.jpg",
        "stats": [
          {
            "labelEn": "Knock Capacity",
            "labelAr": "سعة الدرج",
            "value": "50 Coffee Pucks"
          },
          {
            "labelEn": "Damper",
            "labelAr": "امتصاص الصوت",
            "value": "Silicon Damped"
          },
          {
            "labelEn": "Drawer Action",
            "labelAr": "حركة الدرج",
            "value": "Soft-Close Glide"
          }
        ]
      },
      {
        "id": "part-lcs-ambient-light",
        "tagEn": "MULTI-TIER WARM AMBIENT LED",
        "tagAr": "إضاءة محيطية متعددة المستويات",
        "titleEn": "Multi-Tier Recessed 3000K LED Illuminating Glassware",
        "titleAr": "إضاءة محيطية مدمجة داخل الأرفف تبرز جمال الأواني الزجاجية والأكواب",
        "descriptionEn": "Independent LED light strips concealed inside each shelf layer create an exquisite twilight café ambiance in your living room or reception majlis during evening gatherings.",
        "descriptionAr": "أشرطة إضاءة LED خفية مدمجة أسفل كل رف تمنح ركن القهوة إشعاعاً ساحراً يماثل أفخم مقاهي الرياض وجدة أثناء استقبال الضيوف والمساءات الهادئة.",
        "image": "/src/assets/images/ramadan_coffee_corner_hero_1791364235712.jpg",
        "stats": [
          {
            "labelEn": "LED Strips",
            "labelAr": "مستويات الإضاءة",
            "value": "3-Tier Synchronized"
          },
          {
            "labelEn": "Color Temp",
            "labelAr": "درجة الدفء",
            "value": "3000K Ambient"
          },
          {
            "labelEn": "Dimmer",
            "labelAr": "التحكم بالسطوع",
            "value": "Touch Dimmable"
          }
        ]
      },
      {
        "id": "part-lcs-white-glove",
        "tagEn": "WHITE-GLOVE KSA INSTALLATION",
        "tagAr": "توصيل وتركيب شامل بالمملكة",
        "titleEn": "Handcrafted Joinery with White-Glove Installation Across KSA",
        "titleAr": "تصنيع يدوي عالي الدقة مع خدمة توصيل وتركيب داخل منزلك في كافة مدن المملكة",
        "descriptionEn": "Delivered in custom shockproof packaging with specialized carpenters providing seamless white-glove setup and electrical check in Riyadh, Jeddah, Dammam, and across Saudi Arabia.",
        "descriptionAr": "يصلك الركن في صناديق خشبية محمية مع فريق فنيين مختصين يتولون التركيب وتوصيل الكهرباء والتثبيت الجداري داخل منزلك في كافة مدن المملكة.",
        "image": "/src/assets/images/coffee_people_luxury_lounge_1791221150246.jpg",
        "stats": [
          {
            "labelEn": "Delivery Scope",
            "labelAr": "نطاق التوصيل",
            "value": "All KSA Cities"
          },
          {
            "labelEn": "Installation",
            "labelAr": "التركيب",
            "value": "White-Glove Included"
          },
          {
            "labelEn": "Warranty",
            "labelAr": "الضمان",
            "value": "3 Years Structural"
          }
        ]
      }
    ],
    "heroBanner": {
      "headlineEn": "Royal Arabesque Coffee Station",
      "headlineAr": "ركن القهوة المتكامل الفاخر مع رفوف زجاجية وإضاءة محيطية",
      "sloganEn": "ROYAL COFFEE BAR | The Ultimate Specialty Café Sanctuary",
      "sloganAr": "ركن القهوة الملكي | حول مجلسك إلى مقهى مختص متكامل",
      "badgeEn": "MASTER CORNER STATION",
      "badgeAr": "ركن القهوة المتكامل الفاخر",
      "bgGradient": "from-[#140e0c] via-[#241712] to-[#0a0706]",
      "heroImage": "/src/assets/images/coffee_corner_luxury_station_1791219182840.jpg",
      "featuresEn": [
        "Sintered Stone Heat-Proof Worktop",
        "Built-in Waste Knock Drawer",
        "Warm Multi-Tier Ambient LED",
        "6 Concealed Power Sockets"
      ],
      "featuresAr": [
        "سطح رخام بورسلان مقاوم للحرارة",
        "درج تخلص من البن مدمج وفتحة تنقيط",
        "إضاءة محيطية LED متعددة المستويات",
        "6 منافذ طاقة مخفية للأجهزة"
      ]
    }
  },
  {
    "id": "hb-barista-accessories-kit",
    "storeId": "store-coffee",
    "name": "Master Barista 58mm Precision Tool Kit",
    "nameAr": "طقم إكسسوارات ومستلزمات الباريستا الاحترافي مقاس 58 ملم",
    "nameEn": "Master Barista 58mm Precision Tool Kit",
    "sku": "HB-HB-BARISTA-ACCES",
    "category": "مستلزمات الباريستا والأكواب",
    "categoryAr": "مستلزمات الباريستا والأكواب",
    "categoryEn": "Barista Accessories & Ceramic Cups",
    "price": 299,
    "originalPrice": 420,
    "discountedPrice": 299,
    "costPrice": 185,
    "taxRate": 15,
    "weightKg": 0.8,
    "stock": 60,
    "status": "published",
    "isActive": true,
    "isStale": false,
    "publishedAt": "2025-01-15",
    "image": "/src/assets/images/coffee_barista_accessories_set_1791219198302.jpg",
    "galleryUrls": [
      "/src/assets/images/coffee_barista_accessories_set_1791219198302.jpg",
      "/src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg"
    ],
    "images": [
      "/src/assets/images/coffee_barista_accessories_set_1791219198302.jpg",
      "/src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg"
    ],
    "tags": [
      "hibrew",
      "coffee",
      "accessories",
      "barista",
      "ksa",
      "official",
      "20bar"
    ],
    "description": "Everything needed to master coffee puck preparation and latte art. Prevents channeling, ensures flat compaction, and elevates the extraction of every coffee bean.",
    "descriptionAr": "كل ما تحتاجه للتحضير الاحترافي لبودرة القهوة ورسم اللاتيه آرت. يمنحك ضغطاً متساوياً ويقضي على قنوات التدفق للحصول على قوام إسبريسو كريمي مثالي.",
    "descriptionEn": "Everything needed to master coffee puck preparation and latte art. Prevents channeling, ensures flat compaction, and elevates the extraction of every coffee bean.",
    "subtitle": "Calibrated Spring Tamper · Needle WDT · Gravity Distributor · Knock Box",
    "subtitleAr": "تامبر ضغط معاير بنابض + أداة تفكيك التكتلات الإبرية + موزع جاذبية + بتشر حليب وميزاب",
    "productType": "Physical Product",
    "rating": 4.95,
    "reviewsCount": 312,
    "brand": "HiBrew (هاي برو)",
    "countryOfOrigin": "Saudi Arabia Official Agent / الضمان المعتمد بالسعودية",
    "requiresShipping": true,
    "trackInventory": true,
    "salesCount": 998,
    "specs": [
      {
        "label": "Tamper Type",
        "value": "30lb Constant Pressure Self-Leveling Spring Tamper",
        "labelAr": "نوع التامبر",
        "valueAr": "تامبر تسوية أوتوماتيكي بضغط ثابت 30 باوند"
      },
      {
        "label": "WDT Tool",
        "value": "8 Stainless Steel 0.35mm Needles with Stand",
        "labelAr": "مفكك التكتلات",
        "valueAr": "8 إبر ستانلس رفيعة جداً 0.35 ملم مع قاعدة مغناطيسية"
      },
      {
        "label": "Pitcher",
        "value": "304 Stainless Steel Non-Stick Teflon with Sharp Pour Spout",
        "labelAr": "بتشر التبخير",
        "valueAr": "بتشر تيفلون بفتحة صب مدببة للتحكم باللاتيه آرت"
      }
    ],
    "colors": [
      {
        "id": "col-hb-barista-accessories-kit-0",
        "nameAr": "أسود مطفي وخشب الجوز",
        "nameEn": "Matte Black & Walnut",
        "hex": "#1B1B1E",
        "image": "/src/assets/images/hibrew_barista_kit_isolated.jpg"
      }
    ],
    "storageOptions": [
      {
        "capacity": "58mm Standard Kit (5 Tools)",
        "ram": "Tamper + WDT + Distributor + Funnel + Mat",
        "priceDelta": 0
      },
      {
        "capacity": "Complete Pro Kit (8 Tools)",
        "ram": "Adds Walnut Knock Box + 450ml Pitcher + Brush",
        "priceDelta": 99
      }
    ],
    "warranties": [],
    "bundles": [],
    "partsShowcase": [
      {
        "id": "part-bak-7piece-kit",
        "tagEn": "COMPLETE 7-PIECE BARISTA SUITE",
        "tagAr": "طقم باريستا احترافي متكامل من 7 قطع",
        "titleEn": "Precision Espresso Tooling Engineered for 58mm Standards",
        "titleAr": "مجموعة أدوات تحضير القهوة المختصة المصممة لمعايير 58 ملم التجارية",
        "descriptionEn": "Includes constant-force spring tamper, magnetic 8-needle WDT tool, gravity leveling distributor, magnetic dosing funnel, sharp spout milk pitcher, silicone station mat, and cleaning brush.",
        "descriptionAr": "يضم تامبر الضغط الثابت، وأداة تفكيك التكتلات WDT، وموزع الجاذبية، وحلقة الدوزينج فانل المغناطيسية، وبتشر التبخير التيفلون، وفرشاة التنظيف وقاعدة الكبس.",
        "image": "/src/assets/images/coffee_barista_accessories_set_1791219198302.jpg",
        "stats": [
          {
            "labelEn": "Kit Pieces",
            "labelAr": "عدد القطع",
            "value": "7 Pro Tools"
          },
          {
            "labelEn": "Compatibility",
            "labelAr": "المقاس المعتمد",
            "value": "58.4 - 58.5mm"
          },
          {
            "labelEn": "Material",
            "labelAr": "الخامات",
            "value": "304 Steel & Walnut"
          }
        ]
      },
      {
        "id": "part-bak-in-use-tamp",
        "tagEn": "TOOLS IN-USE · SPRING TAMPING",
        "tagAr": "الأدوات أثناء الاستخدام · كبس معاير بضغط 30 باوند",
        "titleEn": "30lb Calibrated Self-Leveling Constant Force Compaction",
        "titleAr": "تامبر أوتوماتيكي بنابض معاير يضمن كبساً مستوياً 100% في كل مرة",
        "descriptionEn": "Dual internal calibrated springs deliver an exact 30-pound compression force with an integrated lip collar that rests squarely on the basket rim, eliminating tilted tamp errors entirely.",
        "descriptionAr": "نابض مزدوج يولد قوة ضغط ثابتة 30 باوند مع حافة تسوية ترتكز على حواف الباسكت لمنع أي ميلان في الكبس، مما يضمن تدفق الماء بالتساوي عبر قرص القهوة.",
        "image": "/src/assets/images/barista_tamping_shot_1791363346824.jpg",
        "stats": [
          {
            "labelEn": "Spring Rating",
            "labelAr": "قوة النابض",
            "value": "30 lbs Constant"
          },
          {
            "labelEn": "Leveling Guide",
            "labelAr": "حافة التسوية",
            "value": "Rim Rested Flange"
          },
          {
            "labelEn": "Base Finish",
            "labelAr": "قاعدة التامبر",
            "value": "Flat Mirror Steel"
          }
        ]
      },
      {
        "id": "part-bak-wdt-needle",
        "tagEn": "MAGNETIC WDT DE-CLUMPING",
        "tagAr": "أداة تفكيك التكتلات WDT فائقة النعومة",
        "titleEn": "8 Surgical 0.35mm Needles Distributing Grounds Evenly",
        "titleAr": "8 إبر جراحية رفيعة 0.35 ملم تكسر تكتلات البن وتوزع الحبيبات بانتظام",
        "descriptionEn": "Fine flexible 0.35mm medical-grade stainless steel needles sweep through the coffee basket, breaking up static lumps to create a uniform, fluffy coffee bed before tamping.",
        "descriptionAr": "إبر جراحية دقيقة للغاية بقطر 0.35 ملم تتغلغل في عمق الباسكت لتفكيك تكتلات الطحن الساكنة وتحويل البن إلى طبقة هشة ناعمة تمنع تشكل القنوات المائية السريعة.",
        "image": "/src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg",
        "stats": [
          {
            "labelEn": "Needle Gauge",
            "labelAr": "سمك الإبر",
            "value": "0.35mm Ultra-thin"
          },
          {
            "labelEn": "Needle Count",
            "labelAr": "عدد الإبر",
            "value": "8 Flexible Needles"
          },
          {
            "labelEn": "Stand Dock",
            "labelAr": "قاعدة الحفظ",
            "value": "Magnetic Stand"
          }
        ]
      },
      {
        "id": "part-bak-milk-pitcher",
        "tagEn": "TEFLON SHARP POUR SPITTER",
        "tagAr": "بتشر تبخير تيفلون بفتحة صب مدببة",
        "titleEn": "Sharp V-Spout 450ml Teflon Pitcher for Fine Latte Art Control",
        "titleAr": "بتشر تبخير مطلي بالتيفلون غير اللاصق بفتحة صب حادة للتحكم بالرسم",
        "descriptionEn": "Non-stick matte black Teflon exterior with interior measuring markings. Precision sharp pouring beak grants micro-control when pouring intricate swan necks and tulip stacks.",
        "descriptionAr": "بتشر تبخير ستانلس 304 مطلي بالتيفلون الأسود المانع لالتصاق الحليب، مزود بفتحة صب مدببة تمنحك تحكماً ميكروسكوبياً في رسم أشكال اللاتيه المعقدة.",
        "image": "/src/assets/images/barista_milk_steaming_1791363367164.jpg",
        "stats": [
          {
            "labelEn": "Pitcher Vol",
            "labelAr": "سعة البتشر",
            "value": "450ml / 15oz"
          },
          {
            "labelEn": "Pour Spout",
            "labelAr": "فتحة الصب",
            "value": "Precision Sharp V"
          },
          {
            "labelEn": "Interior Scale",
            "labelAr": "التدريج الداخلي",
            "value": "Laser Etched ml/oz"
          }
        ]
      },
      {
        "id": "part-bak-silicone-station",
        "tagEn": "HEAVY SILICONE TAMPING MAT",
        "tagAr": "قاعدة كبس سيليكونية وموزع الجاذبية",
        "titleEn": "Corner Counter Silicone Tamping Station & Gravity Leveler",
        "titleAr": "قاعدة كبس زاوية لحماية أسطح الرخام وموزع جاذبية ثلاثي الشفرات",
        "descriptionEn": "Thick food-grade silicone mat hugs the counter edge securely to protect stone surfaces from portafilter dents. Paired with 3-blade distributor for effortless leveling.",
        "descriptionAr": "قاعدة سيليكون مرنة تثبت على حافة الطاولة لحماية أسطح الرخام من الخدش، مصحوبة بموزع قهوة ثلاثي الشفرات قابل لتعديل الارتفاع لمساواة السطح بلفة واحدة.",
        "image": "/src/assets/images/espresso_wood_pitcher_1791363392554.jpg",
        "stats": [
          {
            "labelEn": "Mat Thickness",
            "labelAr": "سماكة القاعدة",
            "value": "12mm Food Silicone"
          },
          {
            "labelEn": "Distributor",
            "labelAr": "الموزع",
            "value": "3-Blade Stepped"
          },
          {
            "labelEn": "Cleaning",
            "labelAr": "التنظيف",
            "value": "Dishwasher Safe"
          }
        ]
      }
    ],
    "heroBanner": {
      "headlineEn": "Master Barista 58mm Precision Kit",
      "headlineAr": "طقم إكسسوارات ومستلزمات الباريستا الاحترافي مقاس 58 ملم",
      "sloganEn": "SCIENTIFIC PUCK PREP | Eliminate Channeling & Elevate Extraction",
      "sloganAr": "تحضير البن العلمي | تخلص من القنوات المائية واستمتع باستخلاص مثالي",
      "badgeEn": "PRO BARISTA KIT 58MM",
      "badgeAr": "عدة الباريستا الاحترافية",
      "bgGradient": "from-[#131317] via-[#202028] to-[#0c0c0e]",
      "heroImage": "/src/assets/images/hibrew_barista_kit_isolated.jpg",
      "featuresEn": [
        "30lb Calibrated Self-Leveling Tamper",
        "8-Needle 0.35mm Magnetic WDT Tool",
        "Gravity Stepped Coffee Distributor",
        "304 Teflon Sharp-Spout Milk Pitcher"
      ],
      "featuresAr": [
        "تامبر معاير ذاتي التسوية 30 باوند",
        "مفكك تكتلات WDT مغناطيسي 8 إبر",
        "موزع جاذبية متدرج لمساواة البن",
        "بتشر تبخير تيفلون بفتحة صب مدببة"
      ]
    }
  },
  {
    "id": "hb-h4a-portable-travel",
    "storeId": "store-coffee",
    "name": "HiBrew H4A 4-in-1 Portable Espresso Maker",
    "nameAr": "ماكينة القهوة المحمولة 4 في 1 هاي برو H4A (عرض خاص)",
    "nameEn": "HiBrew H4A 4-in-1 Portable Espresso Maker",
    "sku": "HB-HB-H4A-PORTABLE-",
    "category": "العروض والبكجات الحصرية",
    "categoryAr": "العروض والبكجات الحصرية",
    "categoryEn": "Exclusive Bundles & Offers",
    "price": 329,
    "originalPrice": 450,
    "discountedPrice": 329,
    "costPrice": 204,
    "taxRate": 15,
    "weightKg": 0.8,
    "stock": 60,
    "status": "published",
    "isActive": true,
    "isStale": false,
    "publishedAt": "2025-01-15",
    "image": "/src/assets/images/hibrew_h4a_portable_isolated.jpg",
    "galleryUrls": [
      "/src/assets/images/hibrew_h4a_portable_isolated.jpg",
      "/src/assets/images/hero_multicapsule_portable_1791217213863.jpg"
    ],
    "images": [
      "/src/assets/images/hibrew_h4a_portable_isolated.jpg",
      "/src/assets/images/hero_multicapsule_portable_1791217213863.jpg"
    ],
    "tags": [
      "hibrew",
      "coffee",
      "offers",
      "barista",
      "ksa",
      "official",
      "20bar"
    ],
    "description": "Make genuine rich-crema espresso anywhere: in your car during morning traffic, at the campsite, or in the office with simple one-button brewing.",
    "descriptionAr": "استمتع بإسبريسو غني بالكريمة أينما كنت. ماكينة هاي برو المحمولة الأكثر مبيعاً في السعودية تعمل في سيارتك وتسخن الماء ذاتياً بلمسة زر.",
    "descriptionEn": "Make genuine rich-crema espresso anywhere: in your car during morning traffic, at the campsite, or in the office with simple one-button brewing.",
    "subtitle": "Self-Heating · 12V Car / USB / AC · Nespresso, Dolce Gusto & Ground",
    "subtitleAr": "تسخين ذاتي ذكي تعمل في السيارة 12V والمنزل والرحلات لكافة الكبسولات والبن",
    "productType": "Physical Product",
    "rating": 4.89,
    "reviewsCount": 462,
    "brand": "HiBrew (هاي برو)",
    "countryOfOrigin": "Saudi Arabia Official Agent / الضمان المعتمد بالسعودية",
    "requiresShipping": true,
    "trackInventory": true,
    "salesCount": 1478,
    "specs": [
      {
        "label": "Pressure",
        "value": "15-Bar High Pressure Self-Heating Extraction",
        "labelAr": "الضغط والتسخين",
        "valueAr": "ضغط 15 بار مع تسخين ذاتي سريع للماء البارد في 5 دقائق"
      },
      {
        "label": "Compatibility",
        "value": "Nespresso, Dolce Gusto Pods & Ground Coffee",
        "labelAr": "التوافقية",
        "valueAr": "متوافقة مع كبسولات نسبريسو ودولتشي والبن المطحون"
      },
      {
        "label": "Power",
        "value": "12V Car Port / 220V Wall Adapter / 5V USB",
        "labelAr": "مصادر الطاقة",
        "valueAr": "ولاعة السيارة 12 فولت أو شاحن المنزل أو بنك الطاقة"
      }
    ],
    "colors": [
      {
        "id": "col-hb-h4a-portable-travel-0",
        "nameAr": "أسود مطفي مدمج",
        "nameEn": "Matte Black Travel",
        "hex": "#1E1E22",
        "image": "/src/assets/images/hibrew_h4a_portable_isolated.jpg"
      }
    ],
    "storageOptions": [
      {
        "capacity": "Full Travel Bundle Kit",
        "ram": "Includes 12V Cable, USB & Case",
        "priceDelta": 0
      }
    ],
    "warranties": [],
    "bundles": [],
    "partsShowcase": [
      {
        "id": "part-h4a-modular-chambers",
        "tagEn": "MODULAR 4-IN-1 POD SYSTEM",
        "tagAr": "نظام الحجرات المتعددة 4 في 1",
        "titleEn": "Interchangeable Adapters for Nespresso, Dolce Gusto & Ground Coffee",
        "titleAr": "حجرات قابلة للتبديل لكبسولات نسبريسو ودولتشي غوستو والبن المطحون",
        "descriptionEn": "Includes three precision food-safe modular pods. Swap in seconds to brew your favorite specialty Nespresso capsule, big Dolce Gusto drink, or freshly ground single-origin espresso.",
        "descriptionAr": "تتضمن 3 محولات ذكية سريعة الفك؛ يمكنك التبديل بين كبسولات نسبريسو، وكبسولات دولتشي غوستو الكبيرة، والبن المطحون الطازج بضغطة واحدة دون الحاجة لأدوات إضافية.",
        "image": "/src/assets/images/hero_multicapsule_portable_1791217213863.jpg",
        "stats": [
          {
            "labelEn": "Pod Types",
            "labelAr": "أنواع الكبسولات",
            "value": "Nespresso & Dolce Gusto"
          },
          {
            "labelEn": "Ground Coffee",
            "labelAr": "البن المطحون",
            "value": "10g Precision Pod"
          },
          {
            "labelEn": "Chamber Material",
            "labelAr": "خامة الحجرة",
            "value": "BPA-Free Tritan"
          }
        ]
      },
      {
        "id": "part-h4a-in-use-car",
        "tagEn": "MACHINE IN-USE · IN-CAR SELF-HEATING",
        "tagAr": "الماكينة أثناء الاستخدام · التسخين الذكي داخل السيارة",
        "titleEn": "12V Cigarette Lighter Plug: Cold Water to Hot Espresso in 5 Min",
        "titleAr": "تعمل عبر ولاعة السيارة 12V لتسخين الماء البارد وتحضير الإسبريسو في 5 دقائق",
        "descriptionEn": "Plug directly into your car 12V port. The internal thermal coil heats cold bottled water to 92°C and automatically triggers high-pressure extraction directly into the drinking cup.",
        "descriptionAr": "وصل الماكينة بمنفذ ولاعة السيارة 12 فولت وضع ماء الشرب البارد؛ يقوم السخان الذكي برفع الحرارة إلى 92 درجة مئوية وضخ الإسبريسو الساخن بالكريمة مباشرة في كوبك أثناء زحام الصباح.",
        "image": "/src/assets/images/saudi_cafe_machine_1791363309148.jpg",
        "stats": [
          {
            "labelEn": "Heating Time",
            "labelAr": "وقت التسخين",
            "value": "5 Minutes Rapid"
          },
          {
            "labelEn": "Car Power",
            "labelAr": "كهرباء السيارة",
            "value": "12V DC 80W"
          },
          {
            "labelEn": "Cup Volume",
            "labelAr": "سعة الكوب",
            "value": "60ml Double Shot"
          }
        ]
      },
      {
        "id": "part-h4a-15bar-crema",
        "tagEn": "15-BAR REAL ESPRESSO PUMP",
        "tagAr": "مضخة 15 بار إيطالية لاستخلاص الكريمة",
        "titleEn": "High-Pressure Micro Pump Delivering Thick Golden Crema",
        "titleAr": "مضخة ضغط ميكرو 15 بار تستخلص كريمة كثيفة ونكهة غنية أينما كنت",
        "descriptionEn": "Unlike weak battery hand drippers, the H4A features an authentic high-pressure piston pump that forces boiling water through dense coffee grinds at 15-bar commercial strength.",
        "descriptionAr": "على عكس الأجهزة اليدوية الضعيفة، تحتوي ماكينة H4A على مضخة مكبسية حقيقية بقوة 15 بار تدفع الماء الساخن عبر مسحوق البن لتنتج كريمة ذهبية كثيفة تماماً كالمكائن المنزلية الكبيرة.",
        "image": "/src/assets/images/barista_crema_macro_1791363328316.jpg",
        "stats": [
          {
            "labelEn": "Pump Pressure",
            "labelAr": "قوة الضغط",
            "value": "15-Bar High Pressure"
          },
          {
            "labelEn": "Crema Layer",
            "labelAr": "طبقة الكريمة",
            "value": "Authentic Dense"
          },
          {
            "labelEn": "Extraction Temp",
            "labelAr": "حرارة الاستخلاص",
            "value": "92°C Calibrated"
          }
        ]
      },
      {
        "id": "part-h4a-triple-power",
        "tagEn": "TRIPLE POWER FLEXIBILITY",
        "tagAr": "مرونة ثلاثية لمصادر الطاقة",
        "titleEn": "Car 12V, Home 220V Wall Adapter, and USB Power Bank Mode",
        "titleAr": "محول منزلي 220 فولت، ولاعة سيارة 12 فولت، وسلك USB للاستخدام المكتبي",
        "descriptionEn": "Complete flexibility for work and travel. Use 12V in vehicles for self-heating, the included 220V home adapter for instant power, or standard 5V USB for pre-boiled hot water extraction.",
        "descriptionAr": "تنوع استثنائي للطاقة؛ استخدم منفذ السيارة 12V للتسخين الذاتي، أو فيش المنزل 220V للتحضير السريع، أو بنك الطاقة وسلك USB للاستخلاص الفوري عند استخدام ماء ساخن.",
        "image": "/src/assets/images/coffee_machine_parts_reveal_1791221110232.jpg",
        "stats": [
          {
            "labelEn": "Power Sources",
            "labelAr": "خيارات الطاقة",
            "value": "12V / 220V / 5V USB"
          },
          {
            "labelEn": "Adapters",
            "labelAr": "المحولات المرفقة",
            "value": "All Included"
          },
          {
            "labelEn": "Auto-Shutoff",
            "labelAr": "الأمان الذكي",
            "value": "Overheat Protection"
          }
        ]
      },
      {
        "id": "part-h4a-case-warranty",
        "tagEn": "TRAVEL CASE & 2-YEAR KSA WARRANTY",
        "tagAr": "حقيبة تنقل فاخرة وضمان سنتين بالمملكة",
        "titleEn": "Hard Shockproof Carrying Case & Authorized KSA Agency Warranty",
        "titleAr": "حقيبة سفر صلبة مبطنة ضد الصدمات مع ضمان الوكيل سنتين بالسعودية",
        "descriptionEn": "Includes a rugged molded travel case that neatly organizes the machine, all 3 capsule adapters, power cables, and folding stand. Backed by 2-year KSA agency warranty.",
        "descriptionAr": "تأتي داخل حقيبة سفر صلبة ومبطنة تحفظ الماكينة وكافة محولات الكبسولات والأسلاك في مكان واحد للرحلات والتخييم، مع ضمان الوكيل المعتمد سنتين في السعودية.",
        "image": "/src/assets/images/coffee_machine_story_craft_1791221163767.jpg",
        "stats": [
          {
            "labelEn": "Agency Warranty",
            "labelAr": "ضمان الوكيل",
            "value": "2 Years Full"
          },
          {
            "labelEn": "Carry Case",
            "labelAr": "حقيبة الحفظ",
            "value": "EVA Shockproof"
          },
          {
            "labelEn": "Net Weight",
            "labelAr": "الوزن الصافي",
            "value": "575g Ultra-Light"
          }
        ]
      }
    ],
    "heroBanner": {
      "headlineEn": "HiBrew H4A 4-in-1 Portable Maker",
      "headlineAr": "ماكينة القهوة المحمولة 4 في 1 هاي برو H4A (عرض خاص)",
      "sloganEn": "15-BAR ON-THE-GO | Fresh Hot Espresso Everywhere In One Touch",
      "sloganAr": "ضغط 15 بار وتسخين ذاتي | قهوتك الساخنة أينما كنت بلمسة واحدة",
      "badgeEn": "TRAVEL ESPRESSO 4-IN-1",
      "badgeAr": "ماكينة السفر والسيارة الذكية",
      "bgGradient": "from-[#071d38] via-[#0c2f5d] to-[#041121]",
      "heroImage": "/src/assets/images/hibrew_h4a_portable_isolated.jpg",
      "featuresEn": [
        "15-Bar High Pressure Self-Heating",
        "12V Car, 220V Home & USB Power",
        "Nespresso, Dolce Gusto & Ground Fit",
        "5-Minute Rapid Cold Water Heating"
      ],
      "featuresAr": [
        "ضغط 15 بار مع تسخين ذاتي ذكي",
        "تعمل في ولاعة السيارة والمنزل وبنك الطاقة",
        "متوافقة مع نسبريسو ودولتشي والبن المطحون",
        "تسخين فوري للماء البارد في 5 دقائق"
      ]
    }
  },
  {
    "id": "hb-smart-scale-timer",
    "storeId": "store-coffee",
    "name": "Precision Barista Smart Scale with Flow Timer",
    "nameAr": "ميزان القهوة الذكي مع مؤقت تلقائي وحساس دقة 0.1 جرام",
    "nameEn": "Precision Barista Smart Scale with Flow Timer",
    "sku": "HB-HB-SMART-SCALE-T",
    "category": "مستلزمات الباريستا والأكواب",
    "categoryAr": "مستلزمات الباريستا والأكواب",
    "categoryEn": "Barista Accessories & Ceramic Cups",
    "price": 145,
    "originalPrice": 195,
    "discountedPrice": 145,
    "costPrice": 90,
    "taxRate": 15,
    "weightKg": 0.8,
    "stock": 60,
    "status": "published",
    "isActive": true,
    "isStale": false,
    "publishedAt": "2025-01-15",
    "image": "/src/assets/images/hibrew_scale_isolated.jpg",
    "galleryUrls": [
      "/src/assets/images/hibrew_scale_isolated.jpg",
      "/src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg"
    ],
    "images": [
      "/src/assets/images/hibrew_scale_isolated.jpg",
      "/src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg"
    ],
    "tags": [
      "hibrew",
      "coffee",
      "accessories",
      "barista",
      "ksa",
      "official",
      "20bar"
    ],
    "description": "Precision dialing tool for consistent espresso shots and pour-overs. Hidden LED touch screen lights up instantly upon weighing.",
    "descriptionAr": "الأداة الأساسية لوزن حبوب القهوة وجرعات الإسبريسو بدقة بالغة لضمان ثبات النكهة في كل كوب.",
    "descriptionEn": "Precision dialing tool for consistent espresso shots and pour-overs. Hidden LED touch screen lights up instantly upon weighing.",
    "subtitle": "0.1g Precision · Auto-Tare & Auto-Timer · Type-C Fast Charging",
    "subtitleAr": "حساس فائق الدقة 0.1 جرام مع مؤقت تلقائي لحساب وقت التدفق وشحن تايب سي",
    "productType": "Physical Product",
    "rating": 4.93,
    "reviewsCount": 388,
    "brand": "HiBrew (هاي برو)",
    "countryOfOrigin": "Saudi Arabia Official Agent / الضمان المعتمد بالسعودية",
    "requiresShipping": true,
    "trackInventory": true,
    "salesCount": 1242,
    "specs": [
      {
        "label": "Resolution",
        "value": "0.1g (Range 0.5g – 2000g)",
        "labelAr": "دقة الحساس",
        "valueAr": "دقة 0.1 جرام من نصف جرام حتى 2000 جرام"
      },
      {
        "label": "Auto Extraction",
        "value": "Detects First Drop & Auto-Starts Timer",
        "labelAr": "المؤقت الذكي",
        "valueAr": "يبدأ العداد فور نزول أول قطرة إسبريسو تلقائياً"
      },
      {
        "label": "Battery",
        "value": "1600mAh USB-C Lithium Cell (3 Months Battery Life)",
        "labelAr": "البطارية",
        "valueAr": "بطارية ليثيوم 1600mAh تدوم حتى 3 أشهر بشحنة واحدة"
      }
    ],
    "colors": [
      {
        "id": "col-hb-smart-scale-timer-0",
        "nameAr": "أسود مطفي خفي",
        "nameEn": "Matte Stealth Black",
        "hex": "#121214",
        "image": "/src/assets/images/hibrew_scale_isolated.jpg"
      }
    ],
    "storageOptions": [
      {
        "capacity": "Standard Barista Scale",
        "ram": "Includes Silicone Heat Pad",
        "priceDelta": 0
      }
    ],
    "warranties": [],
    "bundles": [],
    "partsShowcase": [
      {
        "id": "part-scale-sensor",
        "tagEn": "0.1G LABORATORY STRAIN SENSOR",
        "tagAr": "حساس معملي دقيق 0.1 جرام",
        "titleEn": "High-Speed Microprocessor with Instantaneous 0.1g Response",
        "titleAr": "معالج إلكتروني فائق السرعة بحساسية قياس لحظية بدقة 0.1 جرام",
        "descriptionEn": "Equipped with medical-grade strain gauge sensors that react within milliseconds. Weigh roasted coffee beans, espresso yield, or V60 water ratio with absolute scientific accuracy.",
        "descriptionAr": "مزود بحساسات إلكترونية عالية التردد تستجيب لأقل من عُشر الجرام خلال أجزاء من الثانية، لوزن حبوب البن وجرعة الإسبريسو ومعدل تدفق التقطير بمنتهى الدقة.",
        "image": "/src/assets/images/product_ceramic_cups_set_1791217230149.jpg",
        "stats": [
          {
            "labelEn": "Resolution",
            "labelAr": "دقة الحساس",
            "value": "0.1g Precise"
          },
          {
            "labelEn": "Weight Range",
            "labelAr": "مجال الوزن",
            "value": "0.5g - 2000g"
          },
          {
            "labelEn": "Response Time",
            "labelAr": "سرعة الاستجابة",
            "value": "< 20ms Instant"
          }
        ]
      },
      {
        "id": "part-scale-in-use-flow",
        "tagEn": "SCALE IN-USE · SMART FLOW DETECTION",
        "tagAr": "الميزان أثناء الاستخدام · مؤقت التدفق الذكي",
        "titleEn": "Auto-Tare & First-Drop Espresso Extraction Timing",
        "titleAr": "تصفير تلقائي وبدء المؤقت فور سقوط أول قطرة إسبريسو في الكوب",
        "descriptionEn": "Place your cup under the portafilter; the scale zeroes out tare weight automatically. As soon as the first golden droplet touches the cup, the stopwatch triggers without touching a button.",
        "descriptionAr": "ضع فنجانك أسفل البورتافلتر ليقوم الميزان بتصفير الوزن ذاتياً. وفور نزول أول قطرة إسبريسو، ينطلق المؤقت الرقمي تلقائياً دون الحاجة للمس أي زر بيديك.",
        "image": "/src/assets/images/coffee_making_crema_flow_1791221127339.jpg",
        "stats": [
          {
            "labelEn": "Smart Mode",
            "labelAr": "الوضع الذكي",
            "value": "Auto-Tare & Timer"
          },
          {
            "labelEn": "Drop Sensing",
            "labelAr": "حساس القطرات",
            "value": "First Drop Detect"
          },
          {
            "labelEn": "Stopwatch",
            "labelAr": "العداد الزمني",
            "value": "0 - 9:59 Mins"
          }
        ]
      },
      {
        "id": "part-scale-compact-tray",
        "tagEn": "SLIM DRIP TRAY PROFILE",
        "tagAr": "سمك نحيف يتسع لجميع صواني المكائن",
        "titleEn": "Ultra-Slim 20mm Profile Fitting Commercial Drip Trays",
        "titleAr": "سماكة نحيفة 20 ملم تتسع بسلاسة تحت مقبس أي ماكينة قهوة منزلية وتجارية",
        "descriptionEn": "Engineered with a low-profile 130mm x 150mm silhouette that slips neatly onto the drip tray beneath commercial bottomless portafilters and cups without crowding.",
        "descriptionAr": "تصميم فائق النحافة بمقاس 130 × 150 ملم وسماكة 2 سم فقط، يدخل بسهولة فوق صينية التنقيط تحت البورتافلتر مباشرة دون أن يضيق على ارتفاع الأكواب.",
        "image": "/src/assets/images/hibrew_barista_pro_details_showcase_1791364980884.jpg",
        "stats": [
          {
            "labelEn": "Thickness",
            "labelAr": "سماكة الميزان",
            "value": "20mm Ultra-Slim"
          },
          {
            "labelEn": "Dimensions",
            "labelAr": "الأبعاد",
            "value": "130 × 150 mm"
          },
          {
            "labelEn": "Tray Fit",
            "labelAr": "توافق المكائن",
            "value": "All Espresso Trays"
          }
        ]
      },
      {
        "id": "part-scale-typec-battery",
        "tagEn": "1600MAH USB-C LITHIUM CELL",
        "tagAr": "بطارية ليثيوم 1600mAh مع شحن سريع",
        "titleEn": "Type-C Fast Charging with 3 Months Daily Barista Standby",
        "titleAr": "منفذ شحن تايب سي مع بطارية ليثيوم تدوم حتى 90 يوماً من الاستخدام اليومي",
        "descriptionEn": "No need for disposable alkaline batteries. The integrated high-density lithium polymer battery charges in 1 hour via standard USB-C and features smart auto-power sleep.",
        "descriptionAr": "وداعاً للبطاريات الجافة المستهلكة؛ بطارية ليثيوم بوليمر مدمجة تشحن خلال ساعة واحدة عبر كابل Type-C وتدوم حتى 3 أشهر مع نظام إيقاف التشغيل التلقائي لحفظ الطاقة.",
        "image": "/src/assets/images/coffee_machine_parts_reveal_1791221110232.jpg",
        "stats": [
          {
            "labelEn": "Battery Cell",
            "labelAr": "سعة البطارية",
            "value": "1600mAh Li-Po"
          },
          {
            "labelEn": "Charging Port",
            "labelAr": "منفذ الشحن",
            "value": "USB-C Fast"
          },
          {
            "labelEn": "Standby Time",
            "labelAr": "مدة الصمود",
            "value": "Up to 90 Days"
          }
        ]
      },
      {
        "id": "part-scale-silicone-pad",
        "tagEn": "WATERPROOF SILICONE HEAT PAD",
        "tagAr": "واقي سيليكوني عازل للحرارة والماء",
        "titleEn": "Removable Silicone Thermal Mat & Sealed Splash Protection",
        "titleAr": "غطاء سيليكوني مانع للانزلاق والحرارة ومقاوم لانسكاب السوائل المغلية",
        "descriptionEn": "Includes a grooved, heat-insulated silicone pad that prevents thermal drift on the sensor from scalding cups while protecting the hidden LED display against liquid spills.",
        "descriptionAr": "يأتي مع وسادة سيليكونية مضلعة عازلة تمنع انتقال حرارة الكوب الساخن إلى الحساس الداخلي، وتحمي شاشة الـ LED الخفية من أي قطرات ماء أو قهوة.",
        "image": "/src/assets/images/espresso_wood_pitcher_1791363392554.jpg",
        "stats": [
          {
            "labelEn": "Thermal Shield",
            "labelAr": "عزل الحرارة",
            "value": "Up to 100°C"
          },
          {
            "labelEn": "Spill Resistance",
            "labelAr": "مقاومة الماء",
            "value": "Splash Sealed"
          },
          {
            "labelEn": "Pad Material",
            "labelAr": "خامة الواقي",
            "value": "Food-Grade Silicon"
          }
        ]
      }
    ],
    "heroBanner": {
      "headlineEn": "Precision Barista Smart Scale",
      "headlineAr": "ميزان القهوة الذكي مع مؤقت تلقائي وحساس دقة 0.1 جرام",
      "sloganEn": "0.1G FLOW SENSING | Master Every Second & Gram Of Your Extraction",
      "sloganAr": "حساس دقة 0.1 جرام | تحكم بأدق ثانية وجرام في استخلاص القهوة",
      "badgeEn": "SMART FLOW SCALE",
      "badgeAr": "ميزان ذكي بمؤقت تدفق تلقائي",
      "bgGradient": "from-[#111317] via-[#1b2028] to-[#0a0c0e]",
      "heroImage": "/src/assets/images/hibrew_scale_isolated.jpg",
      "featuresEn": [
        "0.1g High Precision Sensor",
        "Auto-Tare & Auto-Flow Detection",
        "Hidden LED Touch Screen Interface",
        "1600mAh USB-C Lithium Cell"
      ],
      "featuresAr": [
        "حساس معملي دقيق 0.1 جرام",
        "تصفير ومؤقت تلقائي فور نزول القهوة",
        "شاشة لمس LED خفية عالية السطوع",
        "بطارية ليثيوم تدوم 3 أشهر مع شحن تايب سي"
      ]
    }
  },
  {
    "id": "hb-v60-complete-kit",
    "storeId": "store-coffee",
    "name": "Royal Saudi 96 V60 Pour-Over & Kettle Master Set",
    "nameAr": "بكج التقطير الملكي V60 وغلاية التحكم الرقمي (إصدار اليوم الوطني 96)",
    "nameEn": "Royal Saudi 96 V60 Pour-Over & Kettle Master Set",
    "sku": "HB-HB-V60-COMPLETE-",
    "category": "العروض والبكجات الحصرية",
    "categoryAr": "العروض والبكجات الحصرية",
    "categoryEn": "Exclusive Bundles & Offers",
    "price": 599,
    "originalPrice": 890,
    "discountedPrice": 599,
    "costPrice": 371,
    "taxRate": 15,
    "weightKg": 0.8,
    "stock": 60,
    "status": "published",
    "isActive": true,
    "isStale": false,
    "publishedAt": "2025-01-15",
    "image": "/src/assets/images/saudi_national_day_coffee_hero_1791364192381.jpg",
    "galleryUrls": [
      "/src/assets/images/saudi_national_day_coffee_hero_1791364192381.jpg",
      "/src/assets/images/saudi_coffee_collage_1791363410810.jpg",
      "/src/assets/images/coffee_barista_accessories_set_1791219198302.jpg"
    ],
    "images": [
      "/src/assets/images/saudi_national_day_coffee_hero_1791364192381.jpg",
      "/src/assets/images/saudi_coffee_collage_1791363410810.jpg",
      "/src/assets/images/coffee_barista_accessories_set_1791219198302.jpg"
    ],
    "tags": [
      "hibrew",
      "coffee",
      "offers",
      "barista",
      "ksa",
      "official",
      "20bar"
    ],
    "description": "Celebrate Saudi National Day 96 with the quintessential artisan pour-over master collection. Features commercial-grade precision tools to extract exquisite aroma notes from your favorite single-origin beans.",
    "descriptionAr": "احتفل باليوم الوطني 96 مع بكج التقطير المتكامل الفاخر. يجمع بين غلاية عنق الإوزة الدقيقة، وقمع زجاجي عالي الجودة، ومطحنة تروس ستانلس، وميزان دقيق لتحضير ألذ كوب قهوة مختصة أينما كنت.",
    "descriptionEn": "Celebrate Saudi National Day 96 with the quintessential artisan pour-over master collection. Features commercial-grade precision tools to extract exquisite aroma notes from your favorite single-origin beans.",
    "subtitle": "Precision Gooseneck Kettle · Spiral Crystal Dripper · Hand Grinder · Smart Scale",
    "subtitleAr": "غلاية عنق الإوزة الكهربائية مع قمع زجاجي حلزوني V60 ومطحنة يدوية وميزان ذكي في حقيبة جلدية",
    "productType": "Physical Product",
    "rating": 4.98,
    "reviewsCount": 421,
    "brand": "HiBrew (هاي برو)",
    "countryOfOrigin": "Saudi Arabia Official Agent / الضمان المعتمد بالسعودية",
    "requiresShipping": true,
    "trackInventory": true,
    "salesCount": 1347,
    "specs": [
      {
        "label": "Electric Kettle",
        "value": "1000W PID Gooseneck Kettle (1°C Temperature Accuracy)",
        "labelAr": "الغلاية الذكية",
        "valueAr": "غلاية عنق الإوزة 1000 واط مع تحكم رقمي بدرجة الحرارة بالدرجة المئوية"
      },
      {
        "label": "Dripper",
        "value": "High Borosilicate Spiral Glass V60 with Walnut Base",
        "labelAr": "قمع التقطير",
        "valueAr": "زجاج بوروسيليكات حراري حلزوني V60 مع قاعدة خشبية فاخرة"
      },
      {
        "label": "Hand Grinder",
        "value": "CNC 420 Stainless Steel Pentagonal Burrs with Dual Bearing",
        "labelAr": "المطحنة اليدوية",
        "valueAr": "تروس ستانلس ستيل خماسية دقيقة مع محاور مزدوجة لطحن متجانس"
      },
      {
        "label": "Carry Case",
        "value": "Shockproof Reinforced Leatherette Traveling Case",
        "labelAr": "حقيبة التنقل",
        "valueAr": "حقيبة مبطنة فاخرة ضد الصدمات لحمل كامل أدوات التقطير"
      }
    ],
    "colors": [
      {
        "id": "col-hb-v60-complete-kit-0",
        "nameAr": "أخضر زمردي وذهبي ملكي",
        "nameEn": "Saudi Emerald & Gold",
        "hex": "#006C35",
        "image": "/src/assets/images/hibrew_v60_isolated.jpg"
      },
      {
        "id": "col-hb-v60-complete-kit-1",
        "nameAr": "أسود مطفي ملوكي",
        "nameEn": "Matte Obsidian Black",
        "hex": "#18181B",
        "image": "/src/assets/images/saudi_national_day_coffee_hero_1791364192381.jpg"
      }
    ],
    "storageOptions": [
      {
        "capacity": "Complete 8-Piece Set",
        "ram": "Includes Dripper, Server, Kettle, Grinder, Scale & Case",
        "priceDelta": 0
      },
      {
        "capacity": "Pro Specialty Edition",
        "ram": "Includes 100 Japanese Paper Filters + 250g Khawlani Beans",
        "priceDelta": 69
      }
    ],
    "warranties": [
      {
        "id": "agency-2y",
        "name": "2-Year Agency Warranty on Electric Kettle & Scale",
        "nameAr": "ضمان الوكيل سنتين للغلاية والميزان الإلكتروني",
        "price": 0
      }
    ],
    "bundles": [
      {
        "id": "bundle-khawlani",
        "name": "Saudi Khawlani Specialty Coffee Beans (250g)",
        "nameAr": "محصول بن خولاني سعودي فاخر 250 جرام",
        "price": 75,
        "originalPrice": 95,
        "image": "/src/assets/images/saudi_national_day_coffee_hero_1791364192381.jpg"
      }
    ],
    "partsShowcase": [
      {
        "id": "part-v60-complete-station",
        "tagEn": "ROYAL SAUDI 96 MASTER SUITE",
        "tagAr": "بكج التقطير الملكي المتكامل 8 قطع",
        "titleEn": "Complete 8-Piece Artisan Pour-Over Set with Saudi Khawlani Beans",
        "titleAr": "طقم متكامل يضم غلاية رقمية وقمع حلزوني ومطحنة يدوية وميزان وبن خولاني",
        "descriptionEn": "The quintessential specialty coffee collection. Features precision 1000W temperature-controlled gooseneck kettle, glass V60 server, hand grinder, smart scale, filters, and a gift bag of authentic Khawlani beans.",
        "descriptionAr": "طقم التقطير الملكي المتكامل لعشاق القهوة المقطرة؛ غلاية عنق الإوزة بالتحكم الرقمي، وسيرفر وقمع V60 زجاجي، ومطحنة ستانلس يدوية، وميزان ذكي، ومحصول بن خولاني فاخر.",
        "image": "/src/assets/images/saudi_national_day_coffee_hero_1791364192381.jpg",
        "stats": [
          {
            "labelEn": "Piece Count",
            "labelAr": "عدد القطع",
            "value": "8 Master Pieces"
          },
          {
            "labelEn": "Kettle Power",
            "labelAr": "قوة الغلاية",
            "value": "1000W PID Temp"
          },
          {
            "labelEn": "Edition",
            "labelAr": "نوع الإصدار",
            "value": "National Day 96"
          }
        ]
      },
      {
        "id": "part-v60-in-use-kettle",
        "tagEn": "SET IN-USE · GOOSENECK 90° WATER FLOW",
        "tagAr": "الأدوات أثناء الاستخدام · صب عمودي وانبعاث الروائح الزكية",
        "titleEn": "Precision Gooseneck Spout Controlling 90° Spiral Blooming Flow",
        "titleAr": "عنق إوزة منحني يمنحك تدفق ماء عمودي 90 درجة للترطيب والتقطير الحلزوني",
        "descriptionEn": "Ergonomic counterbalance handle and gooseneck spout deliver a steady, non-turbulent vertical water stream. Control extraction saturation with millimeter precision for floral and fruity notes.",
        "descriptionAr": "عنق منحني مصمم بدقة هيدروليكية يصب الماء عمودياً بزاوية 90 درجة بدون أي اندفاع عنيف، مما يتيح لك صباً حلزونياً هادئاً يبرز إيحاءات البن الزهرية والفواحة.",
        "image": "/src/assets/images/saudi_coffee_collage_1791363410810.jpg",
        "stats": [
          {
            "labelEn": "Spout Angle",
            "labelAr": "زاوية الصب",
            "value": "90° Vertical Steady"
          },
          {
            "labelEn": "PID Precision",
            "labelAr": "دقة الحرارة",
            "value": "±1°C Digital"
          },
          {
            "labelEn": "Water Volume",
            "labelAr": "سعة الغلاية",
            "value": "800ml Precision"
          }
        ]
      },
      {
        "id": "part-v60-cnc-grinder",
        "tagEn": "CNC 420 STAINLESS HAND BURRS",
        "tagAr": "مطحنة يدوية بتروس ستانلس ستيل 420",
        "titleEn": "Dual-Bearing CNC Pentagonal Burrs with Smooth Rotation",
        "titleAr": "محاور دوران مزدوجة وتروس خماسية تقطع البن دون توليد ذرات غبارية ناعمة",
        "descriptionEn": "Machined from hardened 420 stainless steel with dual ball-bearings that eliminate shaft wobble. Produces exceptionally uniform particle size distributions for clear, clean pour-over cups.",
        "descriptionAr": "مطحنة يدوية فاخرة بهيكل ألمنيوم مخرط وتروس خماسية من الفولاذ المقاوم للصدأ 420 مع رمان بلي مزدوج يمنع اهتزاز المحور، لطحن متجانس يمنحك كوباً نقياً خالياً من المرارة.",
        "image": "/src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg",
        "stats": [
          {
            "labelEn": "Burr Steel",
            "labelAr": "معدن التروس",
            "value": "CNC 420 Stainless"
          },
          {
            "labelEn": "Bearings",
            "labelAr": "المحامل",
            "value": "Dual Ball Bearings"
          },
          {
            "labelEn": "Hopper Load",
            "labelAr": "سعة المطحنة",
            "value": "25g Coffee Dose"
          }
        ]
      },
      {
        "id": "part-v60-spiral-dripper",
        "tagEn": "BOROSILICATE SPIRAL GLASS V60",
        "tagAr": "قمع زجاجي حلزوني بوروسيليكات وقاعدة خشبية",
        "titleEn": "Thermal Spiral Ribs Enhancing Aerodynamic Air Circulation",
        "titleAr": "أضلاع حلزونية بارزة تعزز دوران الهواء وتدفق الاستخلاص المنتظم",
        "descriptionEn": "Hand-blown high borosilicate crystal glass with internal spiral vortex ribs that guide water downward without stalling against the paper filter. Sits on a solid natural walnut ring collar.",
        "descriptionAr": "قمع زجاجي سميك يتحمل الصدمات الحرارية بأضلاع حلزونية داخلية تمنع التصاق الفلتر الورقي وتضمن تدفقاً انسيابياً للهواء، يرتكز على حلقة خشبية فاخرة.",
        "image": "/src/assets/images/product_ceramic_cups_set_1791217230149.jpg",
        "stats": [
          {
            "labelEn": "Glass Grade",
            "labelAr": "نوع الزجاج",
            "value": "High Borosilicate"
          },
          {
            "labelEn": "Rib Pattern",
            "labelAr": "الأضلاع",
            "value": "Spiral Vortex 60°"
          },
          {
            "labelEn": "Collar Base",
            "labelAr": "القاعدة",
            "value": "Solid Natural Walnut"
          }
        ]
      },
      {
        "id": "part-v60-leather-case",
        "tagEn": "SHOCKPROOF LEATHERETTE TRAVEL CASE",
        "tagAr": "حقيبة جلدية فاخرة وضمان سنتين بالمملكة",
        "titleEn": "Reinforced Travel Case & 2-Year KSA Agency Warranty on Electric Tools",
        "titleAr": "حقيبة جلدية مبطنة ضد الصدمات مع ضمان الوكيل سنتين للغلاية والميزان",
        "descriptionEn": "Custom molded compartments secure the kettle, glass server, grinder, scale, dripper, and cups safely during camping trips and desert getaways. Backed by full 2-year KSA agency warranty.",
        "descriptionAr": "حقيبة جلدية فخمة بأقسام داخلية مبطنة بإسفنج كثيف تحمي كافة الأدوات الزجاجية والكهربائية أثناء رحلات البر والسفر، مع ضمان سنتين معتمد للغلاية والميزان.",
        "image": "/src/assets/images/coffee_barista_accessories_set_1791219198302.jpg",
        "stats": [
          {
            "labelEn": "Agency Warranty",
            "labelAr": "ضمان الوكيل",
            "value": "2 Years Electric"
          },
          {
            "labelEn": "Case Build",
            "labelAr": "خامة الحقيبة",
            "value": "Reinforced Leatherette"
          },
          {
            "labelEn": "Portability",
            "labelAr": "التنقل",
            "value": "Travel & Outdoor Ready"
          }
        ]
      }
    ],
    "heroBanner": {
      "headlineEn": "Royal Saudi 96 V60 Master Set",
      "headlineAr": "بكج التقطير الملكي V60 وغلاية التحكم الرقمي (إصدار اليوم الوطني 96)",
      "sloganEn": "ROYAL SAUDI 96 | The Master Artisan Pour-Over Collection",
      "sloganAr": "إصدار اليوم الوطني 96 | بكج التقطير الملكي الفاخر لعشاق القهوة المختصة",
      "badgeEn": "NATIONAL DAY 96 SPECIAL",
      "badgeAr": "إصدار خاص باليوم الوطني 96",
      "bgGradient": "from-[#032a15] via-[#054322] to-[#011409]",
      "heroImage": "/src/assets/images/hibrew_v60_isolated.jpg",
      "featuresEn": [
        "1000W PID Gooseneck Electric Kettle",
        "High Borosilicate Spiral Glass V60",
        "CNC 420 Stainless Steel Hand Grinder",
        "Reinforced Traveling Leatherette Case"
      ],
      "featuresAr": [
        "غلاية عنق الإوزة الذكية 1000 واط",
        "قمع زجاجي حلزوني V60 مع قاعدة خشبية",
        "مطحنة يدوية بتروس ستانلس ستيل 420",
        "حقيبة جلدية فاخرة مبطنة ضد الصدمات"
      ]
    }
  }
] as unknown as Product[];

export const COFFEE_STORE_MEDIA: MediaAsset[] = [
  {
    "id": "med-cof-101",
    "storeId": "store-coffee",
    "fileName": "barista_crema_macro_1791363328316.jpg",
    "title": "هاي برو - barista crema macro 1791363328316",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 101563,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/barista_crema_macro_1791363328316.jpg",
    "optimizedUrl": "/src/assets/images/barista_crema_macro_1791363328316.jpg",
    "thumbnailUrl": "/src/assets/images/barista_crema_macro_1791363328316.jpg",
    "webpUrl": "/src/assets/images/barista_crema_macro_1791363328316.jpg",
    "altText": "HiBrew KSA - barista crema macro 1791363328316",
    "caption": "HiBrew Official Asset - barista crema macro 1791363328316",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-102",
    "storeId": "store-coffee",
    "fileName": "barista_milk_steaming_1791363367164.jpg",
    "title": "هاي برو - barista milk steaming 1791363367164",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 129397,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/barista_milk_steaming_1791363367164.jpg",
    "optimizedUrl": "/src/assets/images/barista_milk_steaming_1791363367164.jpg",
    "thumbnailUrl": "/src/assets/images/barista_milk_steaming_1791363367164.jpg",
    "webpUrl": "/src/assets/images/barista_milk_steaming_1791363367164.jpg",
    "altText": "HiBrew KSA - barista milk steaming 1791363367164",
    "caption": "HiBrew Official Asset - barista milk steaming 1791363367164",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-103",
    "storeId": "store-coffee",
    "fileName": "barista_tamping_shot_1791363346824.jpg",
    "title": "هاي برو - barista tamping shot 1791363346824",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 127648,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/barista_tamping_shot_1791363346824.jpg",
    "optimizedUrl": "/src/assets/images/barista_tamping_shot_1791363346824.jpg",
    "thumbnailUrl": "/src/assets/images/barista_tamping_shot_1791363346824.jpg",
    "webpUrl": "/src/assets/images/barista_tamping_shot_1791363346824.jpg",
    "altText": "HiBrew KSA - barista tamping shot 1791363346824",
    "caption": "HiBrew Official Asset - barista tamping shot 1791363346824",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-104",
    "storeId": "store-coffee",
    "fileName": "coffee_banner_white_gray_1.jpg",
    "title": "هاي برو - coffee banner white gray 1",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 451086,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/coffee_banner_white_gray_1.jpg",
    "optimizedUrl": "/src/assets/images/coffee_banner_white_gray_1.jpg",
    "thumbnailUrl": "/src/assets/images/coffee_banner_white_gray_1.jpg",
    "webpUrl": "/src/assets/images/coffee_banner_white_gray_1.jpg",
    "altText": "HiBrew KSA - coffee banner white gray 1",
    "caption": "HiBrew Official Asset - coffee banner white gray 1",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-105",
    "storeId": "store-coffee",
    "fileName": "coffee_banner_white_gray_2.jpg",
    "title": "هاي برو - coffee banner white gray 2",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 433348,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/coffee_banner_white_gray_2.jpg",
    "optimizedUrl": "/src/assets/images/coffee_banner_white_gray_2.jpg",
    "thumbnailUrl": "/src/assets/images/coffee_banner_white_gray_2.jpg",
    "webpUrl": "/src/assets/images/coffee_banner_white_gray_2.jpg",
    "altText": "HiBrew KSA - coffee banner white gray 2",
    "caption": "HiBrew Official Asset - coffee banner white gray 2",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-106",
    "storeId": "store-coffee",
    "fileName": "coffee_banner_white_gray_3.jpg",
    "title": "هاي برو - coffee banner white gray 3",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 420973,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/coffee_banner_white_gray_3.jpg",
    "optimizedUrl": "/src/assets/images/coffee_banner_white_gray_3.jpg",
    "thumbnailUrl": "/src/assets/images/coffee_banner_white_gray_3.jpg",
    "webpUrl": "/src/assets/images/coffee_banner_white_gray_3.jpg",
    "altText": "HiBrew KSA - coffee banner white gray 3",
    "caption": "HiBrew Official Asset - coffee banner white gray 3",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-107",
    "storeId": "store-coffee",
    "fileName": "coffee_barista_accessories_set_1791219198302.jpg",
    "title": "هاي برو - coffee barista accessories set 1791219198302",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 113342,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/coffee_barista_accessories_set_1791219198302.jpg",
    "optimizedUrl": "/src/assets/images/coffee_barista_accessories_set_1791219198302.jpg",
    "thumbnailUrl": "/src/assets/images/coffee_barista_accessories_set_1791219198302.jpg",
    "webpUrl": "/src/assets/images/coffee_barista_accessories_set_1791219198302.jpg",
    "altText": "HiBrew KSA - coffee barista accessories set 1791219198302",
    "caption": "HiBrew Official Asset - coffee barista accessories set 1791219198302",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-108",
    "storeId": "store-coffee",
    "fileName": "coffee_corner_luxury_station_1791219182840.jpg",
    "title": "هاي برو - coffee corner luxury station 1791219182840",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 145016,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/coffee_corner_luxury_station_1791219182840.jpg",
    "optimizedUrl": "/src/assets/images/coffee_corner_luxury_station_1791219182840.jpg",
    "thumbnailUrl": "/src/assets/images/coffee_corner_luxury_station_1791219182840.jpg",
    "webpUrl": "/src/assets/images/coffee_corner_luxury_station_1791219182840.jpg",
    "altText": "HiBrew KSA - coffee corner luxury station 1791219182840",
    "caption": "HiBrew Official Asset - coffee corner luxury station 1791219182840",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-109",
    "storeId": "store-coffee",
    "fileName": "coffee_grinder_mill_banner_1791218928342.jpg",
    "title": "هاي برو - coffee grinder mill banner 1791218928342",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 101092,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg",
    "optimizedUrl": "/src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg",
    "thumbnailUrl": "/src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg",
    "webpUrl": "/src/assets/images/coffee_grinder_mill_banner_1791218928342.jpg",
    "altText": "HiBrew KSA - coffee grinder mill banner 1791218928342",
    "caption": "HiBrew Official Asset - coffee grinder mill banner 1791218928342",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-110",
    "storeId": "store-coffee",
    "fileName": "coffee_hero_flagship_machine_1791218907782.jpg",
    "title": "هاي برو - coffee hero flagship machine 1791218907782",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 120952,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg",
    "optimizedUrl": "/src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg",
    "thumbnailUrl": "/src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg",
    "webpUrl": "/src/assets/images/coffee_hero_flagship_machine_1791218907782.jpg",
    "altText": "HiBrew KSA - coffee hero flagship machine 1791218907782",
    "caption": "HiBrew Official Asset - coffee hero flagship machine 1791218907782",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-111",
    "storeId": "store-coffee",
    "fileName": "coffee_machine_parts_reveal_1791221110232.jpg",
    "title": "هاي برو - coffee machine parts reveal 1791221110232",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 97222,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/coffee_machine_parts_reveal_1791221110232.jpg",
    "optimizedUrl": "/src/assets/images/coffee_machine_parts_reveal_1791221110232.jpg",
    "thumbnailUrl": "/src/assets/images/coffee_machine_parts_reveal_1791221110232.jpg",
    "webpUrl": "/src/assets/images/coffee_machine_parts_reveal_1791221110232.jpg",
    "altText": "HiBrew KSA - coffee machine parts reveal 1791221110232",
    "caption": "HiBrew Official Asset - coffee machine parts reveal 1791221110232",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-112",
    "storeId": "store-coffee",
    "fileName": "coffee_machine_story_craft_1791221163767.jpg",
    "title": "هاي برو - coffee machine story craft 1791221163767",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 137161,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/coffee_machine_story_craft_1791221163767.jpg",
    "optimizedUrl": "/src/assets/images/coffee_machine_story_craft_1791221163767.jpg",
    "thumbnailUrl": "/src/assets/images/coffee_machine_story_craft_1791221163767.jpg",
    "webpUrl": "/src/assets/images/coffee_machine_story_craft_1791221163767.jpg",
    "altText": "HiBrew KSA - coffee machine story craft 1791221163767",
    "caption": "HiBrew Official Asset - coffee machine story craft 1791221163767",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-113",
    "storeId": "store-coffee",
    "fileName": "coffee_making_crema_flow_1791221127339.jpg",
    "title": "هاي برو - coffee making crema flow 1791221127339",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 116356,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/coffee_making_crema_flow_1791221127339.jpg",
    "optimizedUrl": "/src/assets/images/coffee_making_crema_flow_1791221127339.jpg",
    "thumbnailUrl": "/src/assets/images/coffee_making_crema_flow_1791221127339.jpg",
    "webpUrl": "/src/assets/images/coffee_making_crema_flow_1791221127339.jpg",
    "altText": "HiBrew KSA - coffee making crema flow 1791221127339",
    "caption": "HiBrew Official Asset - coffee making crema flow 1791221127339",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-114",
    "storeId": "store-coffee",
    "fileName": "coffee_paper_cups_bulk_1791218958527.jpg",
    "title": "هاي برو - coffee paper cups bulk 1791218958527",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 121188,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/coffee_paper_cups_bulk_1791218958527.jpg",
    "optimizedUrl": "/src/assets/images/coffee_paper_cups_bulk_1791218958527.jpg",
    "thumbnailUrl": "/src/assets/images/coffee_paper_cups_bulk_1791218958527.jpg",
    "webpUrl": "/src/assets/images/coffee_paper_cups_bulk_1791218958527.jpg",
    "altText": "HiBrew KSA - coffee paper cups bulk 1791218958527",
    "caption": "HiBrew Official Asset - coffee paper cups bulk 1791218958527",
    "folder": "accessories",
    "tags": [
      "hibrew",
      "coffee",
      "accessories",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-115",
    "storeId": "store-coffee",
    "fileName": "coffee_people_luxury_lounge_1791221150246.jpg",
    "title": "هاي برو - coffee people luxury lounge 1791221150246",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 125246,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/coffee_people_luxury_lounge_1791221150246.jpg",
    "optimizedUrl": "/src/assets/images/coffee_people_luxury_lounge_1791221150246.jpg",
    "thumbnailUrl": "/src/assets/images/coffee_people_luxury_lounge_1791221150246.jpg",
    "webpUrl": "/src/assets/images/coffee_people_luxury_lounge_1791221150246.jpg",
    "altText": "HiBrew KSA - coffee people luxury lounge 1791221150246",
    "caption": "HiBrew Official Asset - coffee people luxury lounge 1791221150246",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-116",
    "storeId": "store-coffee",
    "fileName": "coffee_portafilter_boltfilter_1791218943846.jpg",
    "title": "هاي برو - coffee portafilter boltfilter 1791218943846",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 100838,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg",
    "optimizedUrl": "/src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg",
    "thumbnailUrl": "/src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg",
    "webpUrl": "/src/assets/images/coffee_portafilter_boltfilter_1791218943846.jpg",
    "altText": "HiBrew KSA - coffee portafilter boltfilter 1791218943846",
    "caption": "HiBrew Official Asset - coffee portafilter boltfilter 1791218943846",
    "folder": "accessories",
    "tags": [
      "hibrew",
      "coffee",
      "accessories",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-117",
    "storeId": "store-coffee",
    "fileName": "espresso_wood_pitcher_1791363392554.jpg",
    "title": "هاي برو - espresso wood pitcher 1791363392554",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 165775,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/espresso_wood_pitcher_1791363392554.jpg",
    "optimizedUrl": "/src/assets/images/espresso_wood_pitcher_1791363392554.jpg",
    "thumbnailUrl": "/src/assets/images/espresso_wood_pitcher_1791363392554.jpg",
    "webpUrl": "/src/assets/images/espresso_wood_pitcher_1791363392554.jpg",
    "altText": "HiBrew KSA - espresso wood pitcher 1791363392554",
    "caption": "HiBrew Official Asset - espresso wood pitcher 1791363392554",
    "folder": "accessories",
    "tags": [
      "hibrew",
      "coffee",
      "accessories",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-118",
    "storeId": "store-coffee",
    "fileName": "fiorenzato_sunset_riyadh_hero_1791364213969.jpg",
    "title": "هاي برو - fiorenzato sunset riyadh hero 1791364213969",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 122962,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/fiorenzato_sunset_riyadh_hero_1791364213969.jpg",
    "optimizedUrl": "/src/assets/images/fiorenzato_sunset_riyadh_hero_1791364213969.jpg",
    "thumbnailUrl": "/src/assets/images/fiorenzato_sunset_riyadh_hero_1791364213969.jpg",
    "webpUrl": "/src/assets/images/fiorenzato_sunset_riyadh_hero_1791364213969.jpg",
    "altText": "HiBrew KSA - fiorenzato sunset riyadh hero 1791364213969",
    "caption": "HiBrew Official Asset - fiorenzato sunset riyadh hero 1791364213969",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-119",
    "storeId": "store-coffee",
    "fileName": "flagship_coffee_machine_5th.png",
    "title": "هاي برو - flagship coffee machine 5th",
    "fileType": "image",
    "mimeType": "image/png",
    "fileSize": 255774,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/flagship_coffee_machine_5th.png",
    "optimizedUrl": "/src/assets/images/flagship_coffee_machine_5th.png",
    "thumbnailUrl": "/src/assets/images/flagship_coffee_machine_5th.png",
    "webpUrl": "/src/assets/images/flagship_coffee_machine_5th.png",
    "altText": "HiBrew KSA - flagship coffee machine 5th",
    "caption": "HiBrew Official Asset - flagship coffee machine 5th",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-120",
    "storeId": "store-coffee",
    "fileName": "hero_coffee_banner_white_1.jpg",
    "title": "هاي برو - hero coffee banner white 1",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 451086,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/hero_coffee_banner_white_1.jpg",
    "optimizedUrl": "/src/assets/images/hero_coffee_banner_white_1.jpg",
    "thumbnailUrl": "/src/assets/images/hero_coffee_banner_white_1.jpg",
    "webpUrl": "/src/assets/images/hero_coffee_banner_white_1.jpg",
    "altText": "HiBrew KSA - hero coffee banner white 1",
    "caption": "HiBrew Official Asset - hero coffee banner white 1",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-121",
    "storeId": "store-coffee",
    "fileName": "hero_coffee_banner_white_2.jpg",
    "title": "هاي برو - hero coffee banner white 2",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 433348,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/hero_coffee_banner_white_2.jpg",
    "optimizedUrl": "/src/assets/images/hero_coffee_banner_white_2.jpg",
    "thumbnailUrl": "/src/assets/images/hero_coffee_banner_white_2.jpg",
    "webpUrl": "/src/assets/images/hero_coffee_banner_white_2.jpg",
    "altText": "HiBrew KSA - hero coffee banner white 2",
    "caption": "HiBrew Official Asset - hero coffee banner white 2",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-122",
    "storeId": "store-coffee",
    "fileName": "hero_coffee_banner_white_3.jpg",
    "title": "هاي برو - hero coffee banner white 3",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 420973,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/hero_coffee_banner_white_3.jpg",
    "optimizedUrl": "/src/assets/images/hero_coffee_banner_white_3.jpg",
    "thumbnailUrl": "/src/assets/images/hero_coffee_banner_white_3.jpg",
    "webpUrl": "/src/assets/images/hero_coffee_banner_white_3.jpg",
    "altText": "HiBrew KSA - hero coffee banner white 3",
    "caption": "HiBrew Official Asset - hero coffee banner white 3",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-123",
    "storeId": "store-coffee",
    "fileName": "hero_coffee_corner_cabinet_1791217199146.jpg",
    "title": "هاي برو - hero coffee corner cabinet 1791217199146",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 136659,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg",
    "optimizedUrl": "/src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg",
    "thumbnailUrl": "/src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg",
    "webpUrl": "/src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg",
    "altText": "HiBrew KSA - hero coffee corner cabinet 1791217199146",
    "caption": "HiBrew Official Asset - hero coffee corner cabinet 1791217199146",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-124",
    "storeId": "store-coffee",
    "fileName": "hibrew_barista_kit_isolated.jpg",
    "title": "هاي برو - hibrew barista kit isolated",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 56886,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/hibrew_barista_kit_isolated.jpg",
    "optimizedUrl": "/src/assets/images/hibrew_barista_kit_isolated.jpg",
    "thumbnailUrl": "/src/assets/images/hibrew_barista_kit_isolated.jpg",
    "webpUrl": "/src/assets/images/hibrew_barista_kit_isolated.jpg",
    "altText": "HiBrew KSA - hibrew barista kit isolated",
    "caption": "HiBrew Official Asset - hibrew barista kit isolated",
    "folder": "accessories",
    "tags": [
      "hibrew",
      "coffee",
      "accessories",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-125",
    "storeId": "store-coffee",
    "fileName": "hibrew_barista_pro_details_showcase_1791364980884.jpg",
    "title": "هاي برو - hibrew barista pro details showcase 1791364980884",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 111716,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/hibrew_barista_pro_details_showcase_1791364980884.jpg",
    "optimizedUrl": "/src/assets/images/hibrew_barista_pro_details_showcase_1791364980884.jpg",
    "thumbnailUrl": "/src/assets/images/hibrew_barista_pro_details_showcase_1791364980884.jpg",
    "webpUrl": "/src/assets/images/hibrew_barista_pro_details_showcase_1791364980884.jpg",
    "altText": "HiBrew KSA - hibrew barista pro details showcase 1791364980884",
    "caption": "HiBrew Official Asset - hibrew barista pro details showcase 1791364980884",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-126",
    "storeId": "store-coffee",
    "fileName": "hibrew_barista_pro_exploded_parts_1791364960592.jpg",
    "title": "هاي برو - hibrew barista pro exploded parts 1791364960592",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 113739,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/hibrew_barista_pro_exploded_parts_1791364960592.jpg",
    "optimizedUrl": "/src/assets/images/hibrew_barista_pro_exploded_parts_1791364960592.jpg",
    "thumbnailUrl": "/src/assets/images/hibrew_barista_pro_exploded_parts_1791364960592.jpg",
    "webpUrl": "/src/assets/images/hibrew_barista_pro_exploded_parts_1791364960592.jpg",
    "altText": "HiBrew KSA - hibrew barista pro exploded parts 1791364960592",
    "caption": "HiBrew Official Asset - hibrew barista pro exploded parts 1791364960592",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-127",
    "storeId": "store-coffee",
    "fileName": "hibrew_cabinet_isolated.jpg",
    "title": "هاي برو - hibrew cabinet isolated",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 75617,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/hibrew_cabinet_isolated.jpg",
    "optimizedUrl": "/src/assets/images/hibrew_cabinet_isolated.jpg",
    "thumbnailUrl": "/src/assets/images/hibrew_cabinet_isolated.jpg",
    "webpUrl": "/src/assets/images/hibrew_cabinet_isolated.jpg",
    "altText": "HiBrew KSA - hibrew cabinet isolated",
    "caption": "HiBrew Official Asset - hibrew cabinet isolated",
    "folder": "cabinets",
    "tags": [
      "hibrew",
      "coffee",
      "cabinets",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-128",
    "storeId": "store-coffee",
    "fileName": "hibrew_ceramic_cup_isolated.jpg",
    "title": "هاي برو - hibrew ceramic cup isolated",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 46225,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/hibrew_ceramic_cup_isolated.jpg",
    "optimizedUrl": "/src/assets/images/hibrew_ceramic_cup_isolated.jpg",
    "thumbnailUrl": "/src/assets/images/hibrew_ceramic_cup_isolated.jpg",
    "webpUrl": "/src/assets/images/hibrew_ceramic_cup_isolated.jpg",
    "altText": "HiBrew KSA - hibrew ceramic cup isolated",
    "caption": "HiBrew Official Asset - hibrew ceramic cup isolated",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-129",
    "storeId": "store-coffee",
    "fileName": "hibrew_espresso_isolated.jpg",
    "title": "هاي برو - hibrew espresso isolated",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 72841,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/hibrew_espresso_isolated.jpg",
    "optimizedUrl": "/src/assets/images/hibrew_espresso_isolated.jpg",
    "thumbnailUrl": "/src/assets/images/hibrew_espresso_isolated.jpg",
    "webpUrl": "/src/assets/images/hibrew_espresso_isolated.jpg",
    "altText": "HiBrew KSA - hibrew espresso isolated",
    "caption": "HiBrew Official Asset - hibrew espresso isolated",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-130",
    "storeId": "store-coffee",
    "fileName": "hibrew_flagship_full_machine.jpg",
    "title": "هاي برو - hibrew flagship full machine",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 99070,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/hibrew_flagship_full_machine.jpg",
    "optimizedUrl": "/src/assets/images/hibrew_flagship_full_machine.jpg",
    "thumbnailUrl": "/src/assets/images/hibrew_flagship_full_machine.jpg",
    "webpUrl": "/src/assets/images/hibrew_flagship_full_machine.jpg",
    "altText": "HiBrew KSA - hibrew flagship full machine",
    "caption": "HiBrew Official Asset - hibrew flagship full machine",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-131",
    "storeId": "store-coffee",
    "fileName": "hibrew_flagship_honor_banner.jpg",
    "title": "هاي برو - hibrew flagship honor banner",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 85058,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/hibrew_flagship_honor_banner.jpg",
    "optimizedUrl": "/src/assets/images/hibrew_flagship_honor_banner.jpg",
    "thumbnailUrl": "/src/assets/images/hibrew_flagship_honor_banner.jpg",
    "webpUrl": "/src/assets/images/hibrew_flagship_honor_banner.jpg",
    "altText": "HiBrew KSA - hibrew flagship honor banner",
    "caption": "HiBrew Official Asset - hibrew flagship honor banner",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-132",
    "storeId": "store-coffee",
    "fileName": "hibrew_grinder_isolated.jpg",
    "title": "هاي برو - hibrew grinder isolated",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 36469,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/hibrew_grinder_isolated.jpg",
    "optimizedUrl": "/src/assets/images/hibrew_grinder_isolated.jpg",
    "thumbnailUrl": "/src/assets/images/hibrew_grinder_isolated.jpg",
    "webpUrl": "/src/assets/images/hibrew_grinder_isolated.jpg",
    "altText": "HiBrew KSA - hibrew grinder isolated",
    "caption": "HiBrew Official Asset - hibrew grinder isolated",
    "folder": "mills",
    "tags": [
      "hibrew",
      "coffee",
      "mills",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-133",
    "storeId": "store-coffee",
    "fileName": "hibrew_grinder_silver.jpg",
    "title": "هاي برو - hibrew grinder silver",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 44796,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/hibrew_grinder_silver.jpg",
    "optimizedUrl": "/src/assets/images/hibrew_grinder_silver.jpg",
    "thumbnailUrl": "/src/assets/images/hibrew_grinder_silver.jpg",
    "webpUrl": "/src/assets/images/hibrew_grinder_silver.jpg",
    "altText": "HiBrew KSA - hibrew grinder silver",
    "caption": "HiBrew Official Asset - hibrew grinder silver",
    "folder": "mills",
    "tags": [
      "hibrew",
      "coffee",
      "mills",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-134",
    "storeId": "store-coffee",
    "fileName": "hibrew_h4a_portable_isolated.jpg",
    "title": "هاي برو - hibrew h4a portable isolated",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 30037,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/hibrew_h4a_portable_isolated.jpg",
    "optimizedUrl": "/src/assets/images/hibrew_h4a_portable_isolated.jpg",
    "thumbnailUrl": "/src/assets/images/hibrew_h4a_portable_isolated.jpg",
    "webpUrl": "/src/assets/images/hibrew_h4a_portable_isolated.jpg",
    "altText": "HiBrew KSA - hibrew h4a portable isolated",
    "caption": "HiBrew Official Asset - hibrew h4a portable isolated",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-135",
    "storeId": "store-coffee",
    "fileName": "hibrew_h7a_flagship_machine.png",
    "title": "هاي برو - hibrew h7a flagship machine",
    "fileType": "image",
    "mimeType": "image/png",
    "fileSize": 275922,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/hibrew_h7a_flagship_machine.png",
    "optimizedUrl": "/src/assets/images/hibrew_h7a_flagship_machine.png",
    "thumbnailUrl": "/src/assets/images/hibrew_h7a_flagship_machine.png",
    "webpUrl": "/src/assets/images/hibrew_h7a_flagship_machine.png",
    "altText": "HiBrew KSA - hibrew h7a flagship machine",
    "caption": "HiBrew Official Asset - hibrew h7a flagship machine",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-136",
    "storeId": "store-coffee",
    "fileName": "hibrew_portafilter_isolated.jpg",
    "title": "هاي برو - hibrew portafilter isolated",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 36402,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/hibrew_portafilter_isolated.jpg",
    "optimizedUrl": "/src/assets/images/hibrew_portafilter_isolated.jpg",
    "thumbnailUrl": "/src/assets/images/hibrew_portafilter_isolated.jpg",
    "webpUrl": "/src/assets/images/hibrew_portafilter_isolated.jpg",
    "altText": "HiBrew KSA - hibrew portafilter isolated",
    "caption": "HiBrew Official Asset - hibrew portafilter isolated",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-137",
    "storeId": "store-coffee",
    "fileName": "hibrew_scale_isolated.jpg",
    "title": "هاي برو - hibrew scale isolated",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 26913,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/hibrew_scale_isolated.jpg",
    "optimizedUrl": "/src/assets/images/hibrew_scale_isolated.jpg",
    "thumbnailUrl": "/src/assets/images/hibrew_scale_isolated.jpg",
    "webpUrl": "/src/assets/images/hibrew_scale_isolated.jpg",
    "altText": "HiBrew KSA - hibrew scale isolated",
    "caption": "HiBrew Official Asset - hibrew scale isolated",
    "folder": "accessories",
    "tags": [
      "hibrew",
      "coffee",
      "accessories",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-138",
    "storeId": "store-coffee",
    "fileName": "hibrew_v60_isolated.jpg",
    "title": "هاي برو - hibrew v60 isolated",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 51615,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/hibrew_v60_isolated.jpg",
    "optimizedUrl": "/src/assets/images/hibrew_v60_isolated.jpg",
    "thumbnailUrl": "/src/assets/images/hibrew_v60_isolated.jpg",
    "webpUrl": "/src/assets/images/hibrew_v60_isolated.jpg",
    "altText": "HiBrew KSA - hibrew v60 isolated",
    "caption": "HiBrew Official Asset - hibrew v60 isolated",
    "folder": "accessories",
    "tags": [
      "hibrew",
      "coffee",
      "accessories",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-139",
    "storeId": "store-coffee",
    "fileName": "honor_event_mwc_1791218214588.jpg",
    "title": "هاي برو - honor event mwc 1791218214588",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 194008,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/honor_event_mwc_1791218214588.jpg",
    "optimizedUrl": "/src/assets/images/honor_event_mwc_1791218214588.jpg",
    "thumbnailUrl": "/src/assets/images/honor_event_mwc_1791218214588.jpg",
    "webpUrl": "/src/assets/images/honor_event_mwc_1791218214588.jpg",
    "altText": "HiBrew KSA - honor event mwc 1791218214588",
    "caption": "HiBrew Official Asset - honor event mwc 1791218214588",
    "folder": "marketing",
    "tags": [
      "hibrew",
      "coffee",
      "marketing",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-140",
    "storeId": "store-coffee",
    "fileName": "honor_hero_600pro_camera_1791218176058.jpg",
    "title": "هاي برو - honor hero 600pro camera 1791218176058",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 71954,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/honor_hero_600pro_camera_1791218176058.jpg",
    "optimizedUrl": "/src/assets/images/honor_hero_600pro_camera_1791218176058.jpg",
    "thumbnailUrl": "/src/assets/images/honor_hero_600pro_camera_1791218176058.jpg",
    "webpUrl": "/src/assets/images/honor_hero_600pro_camera_1791218176058.jpg",
    "altText": "HiBrew KSA - honor hero 600pro camera 1791218176058",
    "caption": "HiBrew Official Asset - honor hero 600pro camera 1791218176058",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-141",
    "storeId": "store-coffee",
    "fileName": "honor_hero_magicbook_pro_1791218192433.jpg",
    "title": "هاي برو - honor hero magicbook pro 1791218192433",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 102387,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/honor_hero_magicbook_pro_1791218192433.jpg",
    "optimizedUrl": "/src/assets/images/honor_hero_magicbook_pro_1791218192433.jpg",
    "thumbnailUrl": "/src/assets/images/honor_hero_magicbook_pro_1791218192433.jpg",
    "webpUrl": "/src/assets/images/honor_hero_magicbook_pro_1791218192433.jpg",
    "altText": "HiBrew KSA - honor hero magicbook pro 1791218192433",
    "caption": "HiBrew Official Asset - honor hero magicbook pro 1791218192433",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-142",
    "storeId": "store-coffee",
    "fileName": "honor_hero_magic_v6_banner_1791218162748.jpg",
    "title": "هاي برو - honor hero magic v6 banner 1791218162748",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 62902,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/honor_hero_magic_v6_banner_1791218162748.jpg",
    "optimizedUrl": "/src/assets/images/honor_hero_magic_v6_banner_1791218162748.jpg",
    "thumbnailUrl": "/src/assets/images/honor_hero_magic_v6_banner_1791218162748.jpg",
    "webpUrl": "/src/assets/images/honor_hero_magic_v6_banner_1791218162748.jpg",
    "altText": "HiBrew KSA - honor hero magic v6 banner 1791218162748",
    "caption": "HiBrew Official Asset - honor hero magic v6 banner 1791218162748",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-143",
    "storeId": "store-coffee",
    "fileName": "product_ceramic_cups_set_1791217230149.jpg",
    "title": "هاي برو - product ceramic cups set 1791217230149",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 108786,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/product_ceramic_cups_set_1791217230149.jpg",
    "optimizedUrl": "/src/assets/images/product_ceramic_cups_set_1791217230149.jpg",
    "thumbnailUrl": "/src/assets/images/product_ceramic_cups_set_1791217230149.jpg",
    "webpUrl": "/src/assets/images/product_ceramic_cups_set_1791217230149.jpg",
    "altText": "HiBrew KSA - product ceramic cups set 1791217230149",
    "caption": "HiBrew Official Asset - product ceramic cups set 1791217230149",
    "folder": "accessories",
    "tags": [
      "hibrew",
      "coffee",
      "accessories",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-144",
    "storeId": "store-coffee",
    "fileName": "product_machine_compact_black.png",
    "title": "هاي برو - product machine compact black",
    "fileType": "image",
    "mimeType": "image/png",
    "fileSize": 24446,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/product_machine_compact_black.png",
    "optimizedUrl": "/src/assets/images/product_machine_compact_black.png",
    "thumbnailUrl": "/src/assets/images/product_machine_compact_black.png",
    "webpUrl": "/src/assets/images/product_machine_compact_black.png",
    "altText": "HiBrew KSA - product machine compact black",
    "caption": "HiBrew Official Asset - product machine compact black",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-145",
    "storeId": "store-coffee",
    "fileName": "product_machine_delonghi_black.png",
    "title": "هاي برو - product machine delonghi black",
    "fileType": "image",
    "mimeType": "image/png",
    "fileSize": 196589,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/product_machine_delonghi_black.png",
    "optimizedUrl": "/src/assets/images/product_machine_delonghi_black.png",
    "thumbnailUrl": "/src/assets/images/product_machine_delonghi_black.png",
    "webpUrl": "/src/assets/images/product_machine_delonghi_black.png",
    "altText": "HiBrew KSA - product machine delonghi black",
    "caption": "HiBrew Official Asset - product machine delonghi black",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-146",
    "storeId": "store-coffee",
    "fileName": "product_machine_drip_carafe.jpg",
    "title": "هاي برو - product machine drip carafe",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 74299,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/product_machine_drip_carafe.jpg",
    "optimizedUrl": "/src/assets/images/product_machine_drip_carafe.jpg",
    "thumbnailUrl": "/src/assets/images/product_machine_drip_carafe.jpg",
    "webpUrl": "/src/assets/images/product_machine_drip_carafe.jpg",
    "altText": "HiBrew KSA - product machine drip carafe",
    "caption": "HiBrew Official Asset - product machine drip carafe",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-147",
    "storeId": "store-coffee",
    "fileName": "product_machine_drip_carafe.png",
    "title": "هاي برو - product machine drip carafe",
    "fileType": "image",
    "mimeType": "image/png",
    "fileSize": 178970,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/product_machine_drip_carafe.png",
    "optimizedUrl": "/src/assets/images/product_machine_drip_carafe.png",
    "thumbnailUrl": "/src/assets/images/product_machine_drip_carafe.png",
    "webpUrl": "/src/assets/images/product_machine_drip_carafe.png",
    "altText": "HiBrew KSA - product machine drip carafe",
    "caption": "HiBrew Official Asset - product machine drip carafe",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-148",
    "storeId": "store-coffee",
    "fileName": "product_machine_silver_pro.png",
    "title": "هاي برو - product machine silver pro",
    "fileType": "image",
    "mimeType": "image/png",
    "fileSize": 217395,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/product_machine_silver_pro.png",
    "optimizedUrl": "/src/assets/images/product_machine_silver_pro.png",
    "thumbnailUrl": "/src/assets/images/product_machine_silver_pro.png",
    "webpUrl": "/src/assets/images/product_machine_silver_pro.png",
    "altText": "HiBrew KSA - product machine silver pro",
    "caption": "HiBrew Official Asset - product machine silver pro",
    "folder": "products",
    "tags": [
      "hibrew",
      "coffee",
      "products",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-149",
    "storeId": "store-coffee",
    "fileName": "ramadan_coffee_corner_hero_1791364235712.jpg",
    "title": "هاي برو - ramadan coffee corner hero 1791364235712",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 136659,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/ramadan_coffee_corner_hero_1791364235712.jpg",
    "optimizedUrl": "/src/assets/images/ramadan_coffee_corner_hero_1791364235712.jpg",
    "thumbnailUrl": "/src/assets/images/ramadan_coffee_corner_hero_1791364235712.jpg",
    "webpUrl": "/src/assets/images/ramadan_coffee_corner_hero_1791364235712.jpg",
    "altText": "HiBrew KSA - ramadan coffee corner hero 1791364235712",
    "caption": "HiBrew Official Asset - ramadan coffee corner hero 1791364235712",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-150",
    "storeId": "store-coffee",
    "fileName": "saudi_cafe_machine_1791363309148.jpg",
    "title": "هاي برو - saudi cafe machine 1791363309148",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 122663,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/saudi_cafe_machine_1791363309148.jpg",
    "optimizedUrl": "/src/assets/images/saudi_cafe_machine_1791363309148.jpg",
    "thumbnailUrl": "/src/assets/images/saudi_cafe_machine_1791363309148.jpg",
    "webpUrl": "/src/assets/images/saudi_cafe_machine_1791363309148.jpg",
    "altText": "HiBrew KSA - saudi cafe machine 1791363309148",
    "caption": "HiBrew Official Asset - saudi cafe machine 1791363309148",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-151",
    "storeId": "store-coffee",
    "fileName": "saudi_coffee_collage_1791363410810.jpg",
    "title": "هاي برو - saudi coffee collage 1791363410810",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 164623,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/saudi_coffee_collage_1791363410810.jpg",
    "optimizedUrl": "/src/assets/images/saudi_coffee_collage_1791363410810.jpg",
    "thumbnailUrl": "/src/assets/images/saudi_coffee_collage_1791363410810.jpg",
    "webpUrl": "/src/assets/images/saudi_coffee_collage_1791363410810.jpg",
    "altText": "HiBrew KSA - saudi coffee collage 1791363410810",
    "caption": "HiBrew Official Asset - saudi coffee collage 1791363410810",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-152",
    "storeId": "store-coffee",
    "fileName": "saudi_hero_banner_1.jpg",
    "title": "هاي برو - saudi hero banner 1",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 108652,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/saudi_hero_banner_1.jpg",
    "optimizedUrl": "/src/assets/images/saudi_hero_banner_1.jpg",
    "thumbnailUrl": "/src/assets/images/saudi_hero_banner_1.jpg",
    "webpUrl": "/src/assets/images/saudi_hero_banner_1.jpg",
    "altText": "HiBrew KSA - saudi hero banner 1",
    "caption": "HiBrew Official Asset - saudi hero banner 1",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-153",
    "storeId": "store-coffee",
    "fileName": "saudi_hero_banner_2.jpg",
    "title": "هاي برو - saudi hero banner 2",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 107482,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/saudi_hero_banner_2.jpg",
    "optimizedUrl": "/src/assets/images/saudi_hero_banner_2.jpg",
    "thumbnailUrl": "/src/assets/images/saudi_hero_banner_2.jpg",
    "webpUrl": "/src/assets/images/saudi_hero_banner_2.jpg",
    "altText": "HiBrew KSA - saudi hero banner 2",
    "caption": "HiBrew Official Asset - saudi hero banner 2",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-154",
    "storeId": "store-coffee",
    "fileName": "saudi_hero_banner_3.jpg",
    "title": "هاي برو - saudi hero banner 3",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 135540,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/saudi_hero_banner_3.jpg",
    "optimizedUrl": "/src/assets/images/saudi_hero_banner_3.jpg",
    "thumbnailUrl": "/src/assets/images/saudi_hero_banner_3.jpg",
    "webpUrl": "/src/assets/images/saudi_hero_banner_3.jpg",
    "altText": "HiBrew KSA - saudi hero banner 3",
    "caption": "HiBrew Official Asset - saudi hero banner 3",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  },
  {
    "id": "med-cof-155",
    "storeId": "store-coffee",
    "fileName": "saudi_national_day_coffee_hero_1791364192381.jpg",
    "title": "هاي برو - saudi national day coffee hero 1791364192381",
    "fileType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 133413,
    "width": 1200,
    "height": 1200,
    "originalUrl": "/src/assets/images/saudi_national_day_coffee_hero_1791364192381.jpg",
    "optimizedUrl": "/src/assets/images/saudi_national_day_coffee_hero_1791364192381.jpg",
    "thumbnailUrl": "/src/assets/images/saudi_national_day_coffee_hero_1791364192381.jpg",
    "webpUrl": "/src/assets/images/saudi_national_day_coffee_hero_1791364192381.jpg",
    "altText": "HiBrew KSA - saudi national day coffee hero 1791364192381",
    "caption": "HiBrew Official Asset - saudi national day coffee hero 1791364192381",
    "folder": "banners",
    "tags": [
      "hibrew",
      "coffee",
      "banners",
      "official-ksa"
    ],
    "uploadDate": "2026-09-25T12:00:00Z",
    "updatedAt": "2026-10-14T03:00:00Z",
    "version": 1,
    "processingStatus": "ready",
    "optimizationStatus": "optimized",
    "source": "upload"
  }
] as unknown as MediaAsset[];
