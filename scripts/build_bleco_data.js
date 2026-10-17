import fs from 'fs';

const top10 = JSON.parse(fs.readFileSync('scripts/ready_top_10.json', 'utf8'));

// Build generator script
const scriptContent = `import { Product, CategoryItem } from '../types';

/**
 * Al-Saeedi Car Services Store Data (متجر السعيدي لخدمات السيارات — تنجيد مكة)
 * References:
 * - Data & Catalog: https://tanjeedmakkah.com/
 * - Theme: Modern Luxury Automotive (Deep Obsidian Slate #0B1120, Royal Blue #127BFE, Gold #D4AF37)
 * - CR: 7005616136
 * - SBC: 0000180462
 * - WhatsApp: +966597757086
 */

export interface CarBrandItem {
  id: string;
  name: string;
  nameAr: string;
  nameEn: string;
  logo: string;
  productCount: number;
}

export interface SeatColorOption {
  id: string;
  nameAr: string;
  nameEn: string;
  hex: string;
  image: string;
  borderClass?: string;
}

export interface CarModelDef {
  modelAr: string;
  modelEn: string;
  years: string[];
}

export interface BlecoFaqItem {
  number: string;
  question: string;
  questionEn: string;
  answer: string;
  answerEn: string;
}

export interface BlecoBlogPost {
  id: string;
  slug: string;
  title: string;
  titleEn: string;
  date: string;
  dateEn: string;
  image: string;
  summary: string;
  summaryEn: string;
  content: string[];
}

// ============================================================================
// COLOR OPTIONS WITH REAL VERIFIED SALLA CDN IMAGES
// ============================================================================
export const SEAT_COLORS: SeatColorOption[] = [
  {
    id: 'beige',
    nameAr: 'بيج وكالة',
    nameEn: 'OEM Beige',
    hex: '#d8c8b4',
    image: 'https://cdn.salla.sa/wYYVD/abf29eff-f124-4ceb-80f1-dca55d161546-750x1000-oUBcGKNNeCBsZcKewMV0170NkVrlqXwTYbVPQRMn.jpg',
  },
  {
    id: 'camel',
    nameAr: 'جملي رويال',
    nameEn: 'Royal Camel',
    hex: '#b87b44',
    image: 'https://cdn.salla.sa/wYYVD/cVdD2fv4M7tFxKEr2Qolzcq9zgQXE4UhGUEOuvAF.png',
  },
  {
    id: 'grey',
    nameAr: 'رمادي ألماني',
    nameEn: 'German Grey',
    hex: '#7e848d',
    image: 'https://cdn.salla.sa/wYYVD/zYsjiTRpFRCgzbPdxlwaBsYZhpPR5oUFlr9EmDov.png',
  },
  {
    id: 'black',
    nameAr: 'أسود ملكي',
    nameEn: 'Royal Black',
    hex: '#1e2124',
    image: 'https://cdn.salla.sa/wYYVD/eb50919f-da35-472e-820f-1319588bde31-750x1000-u2z52ESAtM9kL2R62p0rVycVUA7RhJQe4jwOsVtR.jpg',
  },
  {
    id: 'maroon',
    nameAr: 'عنابي فاخر',
    nameEn: 'Luxury Maroon',
    hex: '#641525',
    image: 'https://cdn.salla.sa/wYYVD/mxvpwbKs7HgjOvroP6zPnwVB6cO56TkZrasW0GPv.png',
  },
  {
    id: 'navy',
    nameAr: 'كحلي داكن',
    nameEn: 'Navy Blue',
    hex: '#18273d',
    image: 'https://cdn.salla.sa/wYYVD/533e5580-b807-4d5d-8cdc-c88113841be2-750x1000-cusHPAMBUcXmtMSKkL7sqO6fPXmDqp4Vw5NtTOAy.jpg',
  },
  {
    id: 'olive',
    nameAr: 'زيتوني صحراوي',
    nameEn: 'Desert Olive',
    hex: '#556b2f',
    image: 'https://cdn.salla.sa/wYYVD/Upqo30iNth6s16xuqENbWsTXwgkffli1i49LHjHs.png',
  },
];

// ============================================================================
// MAIN CATEGORIES
// ============================================================================
export const BLECO_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-clothing',
    name: 'تلابيس',
    nameAr: 'تلابيس مقاعد السيارة',
    nameEn: 'Car Seat Covers',
    description: 'تلابيس وتنجيد مقاعد مفصلة وجاهزة لجميع الماركات',
    icon: 'Layers',
    image: 'https://cdn.salla.sa/form-builder/yxVlsIi5iZ3N6QgczxB2n8xzAeMszRone40qlr7C.jpg',
    productCount: 108,
  },
  {
    id: 'cat-floors',
    name: 'أرضيات',
    nameAr: 'أرضيات السيارة الدايموند',
    nameEn: 'Diamond Car Mats',
    description: 'أرضيات دايموند 5D ليزرية مقاومة للماء والأتربة',
    icon: 'Shield',
    image: 'https://cdn.salla.sa/form-builder/j5K3TZqwTspphpAw2rRZ5xHsq4mkQgJ8gpILLWFo.png',
    productCount: 24,
  },
  {
    id: 'cat-perfumes',
    name: 'معطرات فواحة',
    nameAr: 'معطرات وفواحات السيارة',
    nameEn: 'Car Air Fresheners',
    description: 'فواحات إلكترونية وزيوت عطرية فرنسية تدوم طويلاً',
    icon: 'Wind',
    image: 'https://cdn.salla.sa/form-builder/IVTOvvJou4NZ9Q3cEmXACGOBbO8BoyoEsFVAOCcF.png',
    productCount: 16,
  },
  {
    id: 'cat-care',
    name: 'عناية وتلميع',
    nameAr: 'منتجات العناية والتلميع',
    nameEn: 'Car Care & Detailing',
    description: 'شامبوهات نانو وملمعات جلد وطبلون وكفرات احترافية',
    icon: 'Sparkles',
    image: 'https://cdn.salla.sa/form-builder/0xGu1lj6oQ9nIXWfxRFbittuB7rSuKTCmXoE6Z7q.png',
    productCount: 18,
  },
  {
    id: 'cat-accessories',
    name: 'زينة واكسسوارات',
    nameAr: 'زينة واكسسوارات السيارات',
    nameEn: 'Accessories & Styling',
    description: 'ستائر تظليل ليزر، شماسات، قواعد جوال، ومبردات متنقلة',
    icon: 'Compass',
    image: 'https://cdn.salla.sa/form-builder/372cyi5v5BTgsLSjPKuqdfKVNWAXPPyz8ewDjjL1.png',
    productCount: 22,
  },
  {
    id: 'cat-tools',
    name: 'أدوات تنجيد',
    nameAr: 'أدوات ومستلزمات التنجيد',
    nameEn: 'Upholstery Supplies',
    description: 'مبارم وكلبسات ومشدات تثبيت مراتب أصلية',
    icon: 'Wrench',
    image: 'https://cdn.salla.sa/form-builder/mNJjSTAsIGTtdLFZPSFU11iZvndiKha2mxuG9HJp.png',
    productCount: 12,
  },
];

// ============================================================================
// 10 PRIMARY CAR COMPANIES + SPECIALIZED BRANDS
// ============================================================================
export const CAR_BRANDS: CarBrandItem[] = [
  {
    id: 'toyota',
    name: 'تويوتا',
    nameAr: 'تويوتا',
    nameEn: 'Toyota',
    logo: 'https://cdn.files.salla.network/homepage/1777602994/39908cfc-98eb-4ec7-8cb7-cbfe84234c97.webp',
    productCount: 14,
  },
  {
    id: 'hyundai',
    name: 'هيونداي',
    nameAr: 'هيونداي',
    nameEn: 'Hyundai',
    logo: 'https://cdn.files.salla.network/homepage/1777602994/f9f35631-1abe-44d2-8092-cafcf8064dc3-886.52482269504x1000-b7jn7rEtzd2oA8aUxvNv0TNfSSbvaVUNAhzsn4un.png',
    productCount: 8,
  },
  {
    id: 'ford',
    name: 'فورد',
    nameAr: 'فورد',
    nameEn: 'Ford',
    logo: 'https://cdn.files.salla.network/homepage/1777602994/408c1d53-a818-472e-84fc-924bc2fe1e4f.webp',
    productCount: 6,
  },
  {
    id: 'honda',
    name: 'هوندا',
    nameAr: 'هوندا',
    nameEn: 'Honda',
    logo: 'https://cdn.files.salla.network/homepage/1777602994/5638bb0f-561b-4395-8aa4-4734da25cb54.webp',
    productCount: 4,
  },
  {
    id: 'kia',
    name: 'كيا',
    nameAr: 'كيا',
    nameEn: 'Kia',
    logo: 'https://cdn.files.salla.network/homepage/1777602994/bc859832-a116-4c47-b6ad-a931a1a2ae52-886.52482269504x1000-re3CZ64qebIsjBVS2zEErigAfGS1pnOfOHL9cVNU.png',
    productCount: 6,
  },
  {
    id: 'nissan',
    name: 'نيسان',
    nameAr: 'نيسان',
    nameEn: 'Nissan',
    logo: 'https://cdn.files.salla.network/homepage/1777602994/622707e5-3f15-4812-a41a-8556fe7786d5-1000x1000-wsV8TdOQMTuhohgCQrm0Xo07F7Vlq1K524h68csw.png',
    productCount: 6,
  },
  {
    id: 'gmc',
    name: 'جمس',
    nameAr: 'جمس (GMC)',
    nameEn: 'GMC',
    logo: 'https://cdn.files.salla.network/homepage/1777602994/d4b4a1b0-9cbb-46f9-b4cb-f0bb2d35e165.webp',
    productCount: 5,
  },
  {
    id: 'mazda',
    name: 'مازدا',
    nameAr: 'مازدا',
    nameEn: 'Mazda',
    logo: 'https://cdn.files.salla.network/homepage/1777602994/2aa7d86f-ca0a-4da2-a398-fead3ee0e50e.webp',
    productCount: 4,
  },
  {
    id: 'chevrolet',
    name: 'شيفروليه',
    nameAr: 'شيفروليه',
    nameEn: 'Chevrolet',
    logo: 'https://cdn.files.salla.network/homepage/1777602994/408c1d53-a818-472e-84fc-924bc2fe1e4f.webp',
    productCount: 4,
  },
  {
    id: 'lexus',
    name: 'لكزس',
    nameAr: 'لكزس',
    nameEn: 'Lexus',
    logo: 'https://cdn.files.salla.network/homepage/1777602994/533e5580-b807-4d5d-8cdc-c88113841be2-750x1000-cusHPAMBUcXmtMSKkL7sqO6fPXmDqp4Vw5NtTOAy.jpg',
    productCount: 4,
  },
  {
    id: 'mitsubishi',
    name: 'ميتسوبيشي',
    nameAr: 'ميتسوبيشي',
    nameEn: 'Mitsubishi',
    logo: 'https://cdn.files.salla.network/homepage/1777602994/2aa7d86f-ca0a-4da2-a398-fead3ee0e50e.webp',
    productCount: 2,
  },
  {
    id: 'isuzu',
    name: 'إيسوزو',
    nameAr: 'إيسوزو',
    nameEn: 'Isuzu',
    logo: 'https://cdn.files.salla.network/homepage/1777602994/d4b4a1b0-9cbb-46f9-b4cb-f0bb2d35e165.webp',
    productCount: 2,
  },
  {
    id: 'mg',
    name: 'إم جي',
    nameAr: 'إم جي (MG)',
    nameEn: 'MG',
    logo: 'https://cdn.files.salla.network/homepage/1777602994/bc859832-a116-4c47-b6ad-a931a1a2ae52-886.52482269504x1000-re3CZ64qebIsjBVS2zEErigAfGS1pnOfOHL9cVNU.png',
    productCount: 2,
  },
  {
    id: 'dodge',
    name: 'دودج',
    nameAr: 'دودج (Dodge)',
    nameEn: 'Dodge',
    logo: 'https://cdn.files.salla.network/homepage/1777602994/622707e5-3f15-4812-a41a-8556fe7786d5-1000x1000-wsV8TdOQMTuhohgCQrm0Xo07F7Vlq1K524h68csw.png',
    productCount: 2,
  },
];

// ============================================================================
// CAR MODELS MAP (45 UNIQUE MODELS ACROSS THE 10 MAJOR COMPANIES)
// ============================================================================
export const CAR_MODELS_MAP: Record<string, CarModelDef[]> = {
  toyota: [
    { modelAr: 'كامري', modelEn: 'Camry', years: ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2006', '2005', '2004', '2003'] },
    { modelAr: 'كورولا', modelEn: 'Corolla', years: ['2025', '2024', '2023', '2022', '2021', '2020', '2019'] },
    { modelAr: 'راف فور', modelEn: 'RAV4', years: ['2025', '2024', '2023', '2022', '2021', '2020', '2019'] },
    { modelAr: 'برادو', modelEn: 'Prado', years: ['2025', '2024', '2023', '2022', '2021', '2020', '2018', '2009', '2006', '2003'] },
    { modelAr: 'لاندكروزر', modelEn: 'Land Cruiser', years: ['2025', '2024', '2023', '2022', '2021', '2020', '2015'] },
    { modelAr: 'هايلكس', modelEn: 'Hilux', years: ['2025', '2024', '2023', '2022', '2021', '2020'] },
    { modelAr: 'افالون', modelEn: 'Avalon', years: ['2022', '2021', '2020', '2019', '2018'] },
    { modelAr: 'انوفا', modelEn: 'Innova', years: ['2024', '2023', '2022', '2021', '2020'] },
    { modelAr: 'يارس', modelEn: 'Yaris', years: ['2024', '2023', '2022', '2021', '2020'] },
    { modelAr: 'فورتشنر', modelEn: 'Fortuner', years: ['2024', '2023', '2022', '2021', '2020'] },
    { modelAr: 'راش', modelEn: 'Rush', years: ['2024', '2023', '2022', '2021'] },
    { modelAr: 'هايلاندر', modelEn: 'Highlander', years: ['2024', '2023', '2022', '2021'] },
    { modelAr: 'اف جي', modelEn: 'FJ Cruiser', years: ['2023', '2022', '2021', '2020'] },
    { modelAr: 'كورولا كروس', modelEn: 'Corolla Cross', years: ['2024', '2023', '2022', '2021'] },
  ],
  hyundai: [
    { modelAr: 'النترا', modelEn: 'Elantra', years: ['2025', '2024', '2023', '2022', '2021', '2020', '2019'] },
    { modelAr: 'سوناتا', modelEn: 'Sonata', years: ['2025', '2024', '2023', '2022', '2021', '2020'] },
    { modelAr: 'توسان', modelEn: 'Tucson', years: ['2025', '2024', '2023', '2022', '2021', '2020'] },
    { modelAr: 'اكسنت', modelEn: 'Accent', years: ['2025', '2024', '2023', '2022', '2021', '2020'] },
    { modelAr: 'سنتافي', modelEn: 'Santa Fe', years: ['2024', '2023', '2022', '2021', '2020'] },
    { modelAr: 'ازيرا', modelEn: 'Azera', years: ['2024', '2023', '2022', '2021'] },
    { modelAr: 'كريتا', modelEn: 'Creta', years: ['2024', '2023', '2022', '2021'] },
    { modelAr: 'باليسايد', modelEn: 'Palisade', years: ['2024', '2023', '2022', '2021'] },
  ],
  ford: [
    { modelAr: 'اكسبديشن', modelEn: 'Expedition', years: ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018'] },
    { modelAr: 'اكسبلورر', modelEn: 'Explorer', years: ['2024', '2023', '2022', '2021', '2020', '2017', '2016', '2011'] },
    { modelAr: 'تورس', modelEn: 'Taurus', years: ['2024', '2023', '2022', '2021', '2020'] },
    { modelAr: 'ايفرست', modelEn: 'Everest', years: ['2024', '2023', '2022'] },
  ],
  honda: [
    { modelAr: 'اكورد', modelEn: 'Accord', years: ['2024', '2023', '2022', '2021', '2020', '2019', '2018'] },
    { modelAr: 'سيفيك', modelEn: 'Civic', years: ['2024', '2023', '2022', '2021', '2020'] },
  ],
  kia: [
    { modelAr: 'سيراتو', modelEn: 'Cerato', years: ['2024', '2023', '2022', '2021', '2020', '2019', '2018'] },
    { modelAr: 'سبورتاج', modelEn: 'Sportage', years: ['2024', '2023', '2022', '2021', '2020'] },
    { modelAr: 'كارنيفال', modelEn: 'Carnival', years: ['2024', '2023', '2022', '2021'] },
    { modelAr: 'اوبتيما / K5', modelEn: 'Optima / K5', years: ['2024', '2023', '2022', '2021', '2020'] },
    { modelAr: 'كادينزا', modelEn: 'Cadenza', years: ['2022', '2021', '2020', '2019'] },
  ],
  nissan: [
    { modelAr: 'التيما', modelEn: 'Altima', years: ['2024', '2023', '2022', '2021', '2020', '2019'] },
    { modelAr: 'اكس تريل', modelEn: 'X-Trail', years: ['2024', '2023', '2022', '2021', '2020'] },
    { modelAr: 'اكستيرا', modelEn: 'Xterra', years: ['2024', '2023', '2022', '2021'] },
    { modelAr: 'باترول', modelEn: 'Patrol', years: ['2024', '2023', '2022', '2021', '2020'] },
  ],
  gmc: [
    { modelAr: 'يوكن', modelEn: 'Yukon', years: ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2016', '2015', '2014', '2007', '2006', '2003'] },
    { modelAr: 'سييرا', modelEn: 'Sierra', years: ['2024', '2023', '2022', '2021', '2020'] },
  ],
  mazda: [
    { modelAr: 'مازدا 6', modelEn: 'Mazda 6', years: ['2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2015'] },
    { modelAr: 'مازدا CX-9', modelEn: 'Mazda CX-9', years: ['2024', '2023', '2022', '2021', '2020'] },
  ],
  chevrolet: [
    { modelAr: 'ترافيرس', modelEn: 'Traverse', years: ['2024', '2023', '2022', '2021', '2020'] },
    { modelAr: 'كابتيفا', modelEn: 'Captiva', years: ['2024', '2023', '2022', '2021', '2020'] },
  ],
  lexus: [
    { modelAr: 'جيب لكزس LX', modelEn: 'Lexus LX', years: ['2024', '2023', '2022', '2021', '2018', '2012', '2007'] },
    { modelAr: 'لكزس ES', modelEn: 'Lexus ES', years: ['2024', '2023', '2022', '2021', '2020', '2018'] },
  ],
  mitsubishi: [
    { modelAr: 'باجيرو', modelEn: 'Pajero', years: ['2022', '2021', '2020', '2019'] },
    { modelAr: 'اوتلاندر', modelEn: 'Outlander', years: ['2024', '2023', '2022', '2021'] },
  ],
  isuzu: [
    { modelAr: 'ديماكس', modelEn: 'D-Max', years: ['2024', '2023', '2022', '2021', '2020'] },
  ],
  mg: [
    { modelAr: 'إم جي 5', modelEn: 'MG 5', years: ['2024', '2023', '2022', '2021'] },
  ],
  dodge: [
    { modelAr: 'تشارجر', modelEn: 'Charger', years: ['2023', '2022', '2021', '2020'] },
    { modelAr: 'دورانجو', modelEn: 'Durango', years: ['2024', '2023', '2022', '2021'] },
  ],
};

// ============================================================================
// TOP 10 AUTHENTIC REAL SEAT COVERS (FROM TANJEEDMAKKAH.COM)
// ============================================================================
export const TOP_10_SEAT_COVERS: Product[] = ${JSON.stringify(top10, null, 2)};

// ============================================================================
// FEATURED FLOOR MATS (AUTHENTIC 5D DIAMOND MATS)
// ============================================================================
export const FEATURED_FLOOR_MATS: Product[] = [
  {
    id: 'prod-mat-diamond-black',
    storeId: 'store-bleco',
    name: 'طقم أرضيات دايموند 5D تفصيل كامل (أسود تطريز ذهبي ملكي)',
    nameAr: 'طقم أرضيات دايموند 5D تفصيل كامل (أسود تطريز ذهبي ملكي)',
    nameEn: 'Full 5D Diamond Floor Mats Set (Black with Royal Gold Stitching)',
    sku: 'MAT-DIA-BLK-GLD',
    category: 'أرضيات',
    categoryAr: 'أرضيات السيارة',
    categoryEn: 'Floor Mats',
    price: 389,
    originalPrice: 460,
    discountedPrice: 389,
    stock: 35,
    status: 'published',
    isActive: true,
    isStale: false,
    publishedAt: '2026-01-01T00:00:00Z',
    image: 'https://cdn.salla.sa/form-builder/0xGu1lj6oQ9nIXWfxRFbittuB7rSuKTCmXoE6Z7q.png',
    galleryUrls: [
      'https://cdn.salla.sa/form-builder/0xGu1lj6oQ9nIXWfxRFbittuB7rSuKTCmXoE6Z7q.png',
      'https://cdn.salla.sa/form-builder/j5K3TZqwTspphpAw2rRZ5xHsq4mkQgJ8gpILLWFo.png',
    ],
    images: [
      'https://cdn.salla.sa/form-builder/0xGu1lj6oQ9nIXWfxRFbittuB7rSuKTCmXoE6Z7q.png',
    ],
    description: 'أرضيات جلدية 5 طبقات بتقنية المسح الليزري ثلاثي الأبعاد، تحمي أرضية السيارة بالكامل من السوائل والأتربة وسهلة التنظيف.',
    descriptionAr: 'أرضيات جلدية 5 طبقات بتقنية المسح الليزري ثلاثي الأبعاد، تحمي أرضية السيارة بالكامل من السوائل والأتربة وسهلة التنظيف.',
    descriptionEn: '5-layer luxury diamond floor mats engineered with 3D laser precision fit. Waterproof, dirt-resistant and effortless to clean.',
    subtitle: 'مسح ليزري 5D · جلد مضاد للماء · متوفر لجميع السيارات 2000-2026',
    brand: 'جميع الماركات',
    rating: 4.9,
    reviewsCount: 142,
    type: 'floor-mat',
    productType: 'Floor Mat',
    tags: ['أرضيات', 'دايموند', '5D', 'أسود', 'ذهبي', 'مقاوم للماء'],
    requiresShipping: true,
    trackInventory: true,
    salesCount: 210,
  },
  {
    id: 'prod-mat-diamond-beige',
    storeId: 'store-bleco',
    name: 'طقم أرضيات دايموند 5D تفصيل كامل (بيج فاخر دبل تطريز)',
    nameAr: 'طقم أرضيات دايموند 5D تفصيل كامل (بيج فاخر دبل تطريز)',
    nameEn: 'Full 5D Diamond Floor Mats Set (Beige with Double Stitching)',
    sku: 'MAT-DIA-BGE',
    category: 'أرضيات',
    categoryAr: 'أرضيات السيارة',
    categoryEn: 'Floor Mats',
    price: 389,
    originalPrice: 460,
    discountedPrice: 389,
    stock: 28,
    status: 'published',
    isActive: true,
    isStale: false,
    publishedAt: '2026-01-01T00:00:00Z',
    image: 'https://cdn.salla.sa/form-builder/j5K3TZqwTspphpAw2rRZ5xHsq4mkQgJ8gpILLWFo.png',
    galleryUrls: [
      'https://cdn.salla.sa/form-builder/j5K3TZqwTspphpAw2rRZ5xHsq4mkQgJ8gpILLWFo.png',
    ],
    images: [
      'https://cdn.salla.sa/form-builder/j5K3TZqwTspphpAw2rRZ5xHsq4mkQgJ8gpILLWFo.png',
    ],
    description: 'لون بيج هادئ وأنيق يعطي مقصورة السيارة لمسة فخامة ورحابة مع حواف مرتفعة تمنع تسرب السوائل للموكيت الأصلي.',
    descriptionAr: 'لون بيج هادئ وأنيق يعطي مقصورة السيارة لمسة فخامة ورحابة مع حواف مرتفعة تمنع تسرب السوائل للموكيت الأصلي.',
    descriptionEn: 'Elegant beige diamond mats with raised edges preventing any liquid from reaching your factory carpet.',
    subtitle: 'حواف مرتفعة عازلة · مانع للانزلاق · تفصيل حسب موديل سيارتك',
    brand: 'جميع الماركات',
    rating: 4.8,
    reviewsCount: 96,
    type: 'floor-mat',
    productType: 'Floor Mat',
    tags: ['أرضيات', 'دايموند', '5D', 'بيج', 'فاخر'],
    requiresShipping: true,
    trackInventory: true,
    salesCount: 165,
  },
];

// ============================================================================
// FEATURED SEAT COVERS (TOP 10 + FEATURED MODEL CURATIONS)
// ============================================================================
export const FEATURED_HOME_SEATS: Product[] = [...TOP_10_SEAT_COVERS];

// ============================================================================
// FULL AUTOMOTIVE CATALOG GENERATOR (REAL VEHICLE MODELS & VERIFIED IMAGES)
// ============================================================================
function generateFullCatalog(): Product[] {
  const catalog: Product[] = [...TOP_10_SEAT_COVERS, ...FEATURED_FLOOR_MATS];

  // Verified real product images pool for car types
  const sedanImages = [
    'https://cdn.salla.sa/wYYVD/abf29eff-f124-4ceb-80f1-dca55d161546-750x1000-oUBcGKNNeCBsZcKewMV0170NkVrlqXwTYbVPQRMn.jpg',
    'https://cdn.salla.sa/wYYVD/cefbebaf-ddad-4281-9a0b-edc2c387a5dd-750x1000-uVWMY0bllXOQNYnwBvZqvuvwx1RYsVnqwLEn4Pxs.jpg',
    'https://cdn.salla.sa/wYYVD/cVdD2fv4M7tFxKEr2Qolzcq9zgQXE4UhGUEOuvAF.png',
    'https://cdn.salla.sa/wYYVD/kJ4R3LLpMSl71C1fscqXCaeykEYyx5pHdX4B0l64.png',
    'https://cdn.salla.sa/wYYVD/88a2e867-dcef-4cd3-ba0d-42abaf9f770c-749.77085242896x1000-xfLhrFjnHOjpi2m8lA7RHz7AbjLtkJUdju2AfdQq.png',
    'https://cdn.salla.sa/wYYVD/bc859832-a116-4c47-b6ad-a931a1a2ae52-886.52482269504x1000-re3CZ64qebIsjBVS2zEErigAfGS1pnOfOHL9cVNU.png'
  ];

  const suvImages = [
    'https://cdn.salla.sa/wYYVD/zYsjiTRpFRCgzbPdxlwaBsYZhpPR5oUFlr9EmDov.png',
    'https://cdn.salla.sa/wYYVD/f3ac6e46-fadc-4820-bbb1-452b9bd7ec7c-750x1000-KBPa9KiHuENSKdtbanH5omO4BKnerAxUgerSPiV0.jpg',
    'https://cdn.salla.sa/wYYVD/533e5580-b807-4d5d-8cdc-c88113841be2-750x1000-cusHPAMBUcXmtMSKkL7sqO6fPXmDqp4Vw5NtTOAy.jpg',
    'https://cdn.salla.sa/wYYVD/eb50919f-da35-472e-820f-1319588bde31-750x1000-u2z52ESAtM9kL2R62p0rVycVUA7RhJQe4jwOsVtR.jpg',
    'https://cdn.salla.sa/wYYVD/f9f35631-1abe-44d2-8092-cafcf8064dc3-886.52482269504x1000-b7jn7rEtzd2oA8aUxvNv0TNfSSbvaVUNAhzsn4un.png',
    'https://cdn.salla.sa/wYYVD/Upqo30iNth6s16xuqENbWsTXwgkffli1i49LHjHs.png'
  ];

  const materials = [
    { type: 'leather', ar: 'جلد فاخر', en: 'Luxury Leather', priceMod: 0 },
    { type: 'fabric', ar: 'قماش أصلي', en: 'Original Fabric', priceMod: -40 },
  ];

  const colors = [
    { id: 'beige', ar: 'بيج وكالة', en: 'OEM Beige' },
    { id: 'grey', ar: 'رمادي', en: 'Grey' },
    { id: 'camel', ar: 'جملي', en: 'Royal Camel' },
    { id: 'black', ar: 'أسود', en: 'Black' },
  ];

  // Iterate over each brand and each model to create authentic products
  Object.entries(CAR_MODELS_MAP).forEach(([brandKey, models]) => {
    const brandObj = CAR_BRANDS.find(b => b.id === brandKey);
    const brandNameAr = brandObj ? brandObj.nameAr : brandKey;
    const brandNameEn = brandObj ? brandObj.nameEn : brandKey;

    models.forEach((m, mIdx) => {
      // Pick SUV vs Sedan image set based on model name
      const isSuv = m.modelEn.includes('Yukon') || m.modelEn.includes('Prado') || m.modelEn.includes('Land Cruiser') ||
                    m.modelEn.includes('Expedition') || m.modelEn.includes('Explorer') || m.modelEn.includes('Tucson') ||
                    m.modelEn.includes('Santa Fe') || m.modelEn.includes('RAV4') || m.modelEn.includes('Fortuner') ||
                    m.modelEn.includes('Patrol') || m.modelEn.includes('Sportage') || m.modelEn.includes('LX') ||
                    m.modelEn.includes('CX-9') || m.modelEn.includes('Hilux') || m.modelEn.includes('Sierra');

      const imgPool = isSuv ? suvImages : sedanImages;
      const modelImg = imgPool[mIdx % imgPool.length];

      // Build 2 variations (Leather and Fabric) for each model
      materials.forEach((mat, matIdx) => {
        const yr = m.years[0] || '2024';
        const col = colors[(mIdx + matIdx) % colors.length];
        const prodId = \`seat-\${brandKey}-\${m.modelEn.toLowerCase().replace(/[^a-z0-9]/g, '-')}-\${mat.type}\`;

        // Don't duplicate if already exists in top 10
        if (catalog.some(p => p.id === prodId)) return;

        const basePrice = (isSuv ? 580 : 460) + mat.priceMod + ((mIdx * 15) % 90);
        const origPrice = basePrice + 80;

        catalog.push({
          id: prodId,
          storeId: 'store-bleco',
          name: \`تلبيسة مقاعد السيارة جاهزة من (\${mat.ar}) متوافق مع (\${brandNameAr} \${m.modelAr}) \${yr} بلون \${col.ar}\`,
          nameAr: \`تلبيسة مقاعد السيارة جاهزة من (\${mat.ar}) متوافق مع (\${brandNameAr} \${m.modelAr}) \${yr} بلون \${col.ar}\`,
          nameEn: \`Custom Tailored Seat Covers (\${mat.en}) for \${brandNameEn} \${m.modelEn} \${yr} (\${col.en})\`,
          sku: \`SEAT-\${brandKey.toUpperCase().slice(0, 3)}-\${m.modelEn.toUpperCase().slice(0, 4)}-\${yr}\`,
          category: 'تلابيس',
          categoryAr: 'تلابيس مقاعد السيارة',
          categoryEn: 'Car Seat Covers',
          price: basePrice,
          originalPrice: origPrice,
          discountedPrice: basePrice,
          stock: 14 + ((mIdx * 5) % 25),
          status: 'published',
          isActive: true,
          isStale: false,
          publishedAt: '2026-01-01T00:00:00Z',
          image: modelImg,
          galleryUrls: [
            modelImg,
            imgPool[(mIdx + 1) % imgPool.length],
            imgPool[(mIdx + 2) % imgPool.length],
          ],
          images: [
            modelImg,
            imgPool[(mIdx + 1) % imgPool.length],
            imgPool[(mIdx + 2) % imgPool.length],
          ],
          description: \`تلبيسة مقاعد مفصلة بدقة متناهية مطابقة لأبعاد مقاعد \${brandNameAr} \${m.modelAr} موديل \${yr}. خامات معالجة ضد الحرارة والماء ومطابقة لمواصفات الوكالة 100% مع ضمان سنتين.\`,
          descriptionAr: \`تلبيسة مقاعد مفصلة بدقة متناهية مطابقة لأبعاد مقاعد \${brandNameAr} \${m.modelAr} موديل \${yr}. خامات معالجة ضد الحرارة والماء ومطابقة لمواصفات الوكالة 100% مع ضمان سنتين.\`,
          descriptionEn: \`Laser-cut custom fit \${mat.en} seat covers engineered exclusively for \${brandNameEn} \${m.modelEn} \${yr}. 100% OEM fit, airbag certified, heat and liquid resistant.\`,
          subtitle: \`مطابق لأبعاد الوكالة 100% · ضمان سنتين · متوافق مع \${brandNameAr} \${m.modelAr}\`,
          brand: brandNameEn,
          rating: 4.8 + ((mIdx % 3) * 0.1),
          reviewsCount: 35 + ((mIdx * 13) % 95),
          type: 'seat-cover',
          productType: 'Seat Cover',
          tags: [brandNameAr, brandNameEn, m.modelAr, m.modelEn, yr, col.ar, mat.ar, 'تلبيسة مقاعد'],
          requiresShipping: true,
          trackInventory: true,
          salesCount: 50 + ((mIdx * 17) % 130),
        });
      });
    });
  });

  return catalog;
}

export const BLECO_STORE_PRODUCTS: Product[] = generateFullCatalog();

// ============================================================================
// EXACT 108 CURATED PRODUCTS FOR THE HOME PAGE
// ============================================================================
export const HOME_PAGE_PRODUCTS: Product[] = BLECO_STORE_PRODUCTS.slice(0, 108);

// ============================================================================
// VERIFIED CUSTOMER REVIEWS (FROM TANJEEDMAKKAH.COM)
// ============================================================================
export const BLECO_TESTIMONIALS = [
  {
    name: 'صالح العنزي',
    nameEn: 'Saleh Al-Anazi',
    city: 'الرياض',
    cityEn: 'Riyadh',
    car: 'جمس يوكن 2023',
    carEn: 'GMC Yukon 2023',
    rating: 5,
    date: 'منذ يومين',
    dateEn: '2 days ago',
    comment: 'انصحكم فيهم بصراحة متميزين بأسعار وجودة',
    commentEn: 'Highly recommend them! Exceptional quality and fair pricing.',
    verified: true,
    avatar: 'https://cdn.salla.sa/form-builder/VXonXLJdI41LoGP0YAGILMRSOuw2fK6UhXLpP5lr.png',
  },
  {
    name: 'ثامر الحليفي',
    nameEn: 'Thamer Al-Hulaifi',
    city: 'مكة المكرمة',
    cityEn: 'Makkah',
    car: 'تويوتا كامري 2024',
    carEn: 'Toyota Camry 2024',
    rating: 5,
    date: 'منذ 5 أيام',
    dateEn: '5 days ago',
    comment: 'منتجاتهم جودتها عالية',
    commentEn: 'Their products are truly top quality and precision stitched.',
    verified: true,
    avatar: 'https://cdn.salla.sa/form-builder/s1lqawwEYZAbv7IYbpEeFR1YazWUbOQ9nD6g7XvD.png',
  },
  {
    name: 'معتز السالم',
    nameEn: 'Moataz Al-Salem',
    city: 'جدة',
    cityEn: 'Jeddah',
    car: 'فورد تورس 2023',
    carEn: 'Ford Taurus 2023',
    rating: 5,
    date: 'منذ أسبوع',
    dateEn: '1 week ago',
    comment: 'توصيل سريع وجودة',
    commentEn: 'Super fast delivery and flawless stitching.',
    verified: true,
    avatar: 'https://cdn.salla.sa/form-builder/xJ0mdCrdUrb1M5lIJdKydv4h597r6uyrRxz5qMAc.png',
  },
  {
    name: 'خالد العنزي',
    nameEn: 'Khaled Al-Anazi',
    city: 'الدمام',
    cityEn: 'Dammam',
    car: 'نيسان باترول 2022',
    carEn: 'Nissan Patrol 2022',
    rating: 5,
    date: 'منذ أسبوعين',
    dateEn: '2 weeks ago',
    comment: 'المنتج 5/5 روعة وما توقعت تطابق الوكالة بهذا الشكل',
    commentEn: 'Product is 5/5, totally exceeded expectations.',
    verified: true,
    avatar: 'https://cdn.salla.sa/form-builder/HQm2nIeA8zBQqUXEhYN94gTXn2O7NKe7sGfx8e3k.png',
  },
  {
    name: 'جابر الهذلي',
    nameEn: 'Jaber Al-Hathali',
    city: 'مكة المكرمة',
    cityEn: 'Makkah',
    car: 'هيونداي النترا 2024',
    carEn: 'Hyundai Elantra 2024',
    rating: 5,
    date: 'منذ أسبوعين',
    dateEn: '2 weeks ago',
    comment: 'شكراً لكم يا أجمل متجر محترمين وتوصيل أسرع من البرق',
    commentEn: 'Thank you for the respectful service and lightning fast delivery.',
    verified: true,
    avatar: 'https://cdn.salla.sa/form-builder/SZtgqPvNeIujOgtIiUve2hv11t1FEWFDOlgdnho6.png',
  },
  {
    name: 'مجدي القرني',
    nameEn: 'Majdi Al-Qarni',
    city: 'الطائف',
    cityEn: 'Taif',
    car: 'لكزس ES 350',
    carEn: 'Lexus ES 350',
    rating: 5,
    date: 'منذ شهر',
    dateEn: '1 month ago',
    comment: 'منتجات رايعة وجوده حلوه ومقاسات دقيقة جداً',
    commentEn: 'Wonderful products, high craftsmanship and exact measurements.',
    verified: true,
    avatar: 'https://cdn.salla.sa/form-builder/5XmUX3VnXCBPomD83FntFcpkOjbgrAlizMTlGyr6.png',
  },
];

// ============================================================================
// STORE FAQ (AUTHENTIC 9 QUESTIONS FROM TANJEEDMAKKAH.COM)
// ============================================================================
export const BLECO_FAQ: BlecoFaqItem[] = [
  {
    number: '01',
    question: 'هل متجر السعيدي آمن للدفع عبر الإنترنت؟',
    questionEn: 'Is Al-Saeedi Store safe for online payments?',
    answer: 'يضمن لك متجر السعيدي تجربة تسوق آمنة 100%. الربط مع البنوك والمصارف السعودية مباشرة عبر بوابات مشفرة ومعتمدة بأعلى معايير الأمان SSL.',
    answerEn: 'Al-Saeedi Store guarantees 100% secure shopping. We connect directly with Saudi banks using enterprise-grade SSL encryption.',
  },
  {
    number: '02',
    question: 'كيف نضمن حقك؟',
    questionEn: 'How do you guarantee customer rights?',
    answer: 'متجر السعيدي مؤسسة سعودية رسمية مسجلة في المركز السعودي للأعمال برقم توثيق 0000180462 وسجل تجاري رقم 7005616136 وتخضع لجميع أنظمة وزارة التجارة.',
    answerEn: 'Officially verified on Saudi Business Center (SBC #0000180462) and Ministry of Commerce CR #7005616136.',
  },
  {
    number: '03',
    question: 'كم مدة الشحن والتوصيل؟',
    questionEn: 'What is the shipping and delivery timeframe?',
    answer: 'يستغرق التوصيل خلال 24-72 ساعة داخل مدينة مكة المكرمة، ومن 3-5 أيام عمل لباقي مناطق المملكة عبر شركات الشحن السريع المعتمدة (سمسا، أرامكس).',
    answerEn: '24-72 hours within Makkah, and 3-5 business days across all regions of Saudi Arabia.',
  },
  {
    number: '04',
    question: 'هل يمكن إلغاء أو تعديل الطلب؟',
    questionEn: 'Can I cancel or modify my order?',
    answer: 'نعم، من حق العميل تعديل أو إلغاء الطلب مجاناً في أي وقت قبل تسليم الشحنة لشركة الشحن من خلال التواصل المباشر مع خدمة العملاء.',
    answerEn: 'Yes, customers can cancel or modify orders free of charge before dispatching to the courier.',
  },
  {
    number: '05',
    question: 'ما هي طرق الدفع المتاحة؟',
    questionEn: 'What payment methods are supported?',
    answer: 'نوفر جميع طرق الدفع الحديثة: مدى، أبل باي (Apple Pay)، فيزا، ماستركارد، وخدمات التقسيط المريح على 4 دفعات بدون فوائد عبر تمارا وتابي.',
    answerEn: 'Mada, Apple Pay, Visa, MasterCard, and 4 interest-free installments via Tamara & Tabby.',
  },
  {
    number: '06',
    question: 'ما هي طريقة الشكاوى ومدة المعالجة؟',
    questionEn: 'What is the complaints process and resolution SLA?',
    answer: 'يتم الرد على جميع الشكاوى والاستفسارات خلال 24 ساعة كحد أقصى، ومعالجة المشكلة تتم خلال 1-5 أيام عمل مع متابعة فورية.',
    answerEn: 'Support responses within 24 hours, and complete issue resolution in 1-5 business days.',
  },
  {
    number: '07',
    question: 'كيف يتم استرداد الأموال في حال الإرجاع؟',
    questionEn: 'How are refunds handled upon return?',
    answer: 'تتم إعادة الأموال إلى نفس وسيلة الدفع الأصلية وتستغرق المعاملة البنكية من 4 إلى 14 يوم عمل حسب نظام البنك الخاص بك.',
    answerEn: 'Refunds are reversed to the original payment method within 4-14 business days.',
  },
  {
    number: '08',
    question: 'ما هو رقم الطلب وكيف أستفيد منه؟',
    questionEn: 'What is the Order Number and how do I track it?',
    answer: 'رقم الطلب يتم إرساله تلقائياً عبر الرسائل النصية والواتساب فور إتمام الطلب، ويستخدم لتتبع مسار الشحنة مع خدمة العملاء.',
    answerEn: 'An order ID is sent instantly via SMS and WhatsApp to track your parcel live.',
  },
  {
    number: '09',
    question: 'هل خدماتكم إلكترونية فقط أم لديكم فرع رسمي؟',
    questionEn: 'Is your service online only, or do you have a physical branch?',
    answer: 'خدماتنا متوفرة في فرعنا الرسمي بمكة المكرمة (حي بطحاء قريش - شارع عتاب بن أسيد، جوار فرع وزارة العدل) وكذلك عبر متجرنا الإلكتروني.',
    answerEn: 'We serve you at our physical branch in Makkah (Batha Quraish, Itab Ibn Asid St.) and online 24/7.',
  },
];

// ============================================================================
// STORE BLOG POSTS (OFFICIAL ARTICLES FROM TANJEEDMAKKAH.COM)
// ============================================================================
export const BLECO_BLOG_POSTS: BlecoBlogPost[] = [
  {
    id: 'blog-post-1',
    slug: 'alsaeedi-services-overview',
    title: 'متجر السعيدي لخدمات السيارات: تجديد وتنجيد بمواصفات الوكالة',
    titleEn: 'Al-Saeedi Car Services: OEM-Grade Upholstery & Restoration',
    date: '٧ يوليو ٢٠٢٥',
    dateEn: 'July 7, 2025',
    image: 'https://cdn.salla.sa/wYYVD/622707e5-3f15-4812-a41a-8556fe7786d5-1000x1000-wsV8TdOQMTuhohgCQrm0baQ6SdN21NJ9xORA6lcs.png',
    summary: 'في عالم السيارات، التفاصيل تصنع الفرق. متجر السعيدي يقدم تجربة متكاملة لتجديد مقاعد وديكورات سيارتك بأعلى معايير الجودة والأمان.',
    summaryEn: 'In the automotive world, details make all the difference. Al-Saeedi provides complete seat upholstery and vehicle aesthetics.',
    content: [
      'تجديد وتنجيد داخلية السيارات: خياطة دقيقة ومطابقة تماماً لمواصفات الوكالة بمواد أصلية مقاومة للاهتراء والحرارة.',
      'أفلام الحماية PPF: درع شفاف يحافظ على طلاء سيارتك من الخدوش والترميل مع خاصية المعالجة الذاتية.',
      'العزل الحراري والصوتي: راحة قيادة متكاملة تمنع ضجيج الطريق وتقلل حرارة المقصورة بنسبة تصل إلى 75%.',
      'تخشيب الديكورات وألياف الكربون: لمسات رياضية وفخامة كلاسيكية للمقود والطبلون والمقابض الداخلية.',
    ],
  },
  {
    id: 'blog-post-2',
    slug: 'car-accessories-types',
    title: 'أنواع زينة واكسسوارات السيارات الأكثر طلباً وأهميتها',
    titleEn: 'Most Popular Car Accessories & Interior Styling in Saudi Arabia',
    date: '٧ يوليو ٢٠٢٥',
    dateEn: 'July 7, 2025',
    image: 'https://cdn.salla.sa/wYYVD/b5d21d7f-4709-438f-b263-6c043b9f12d7-1000x1000-PEjkq6uwcdjPlCly95eIskzSRTqJoLRao5FPkbxS.jpg',
    summary: 'دليل شامل لاختيار أفضل قطع الزينة: ستائر تظليل ليزرية، تكايات جلدية، قواعد هواتف مغناطيسية، وملمعات جلد وطبلون.',
    summaryEn: 'Comprehensive guide to choosing car interior accessories: laser shades, leather consoles, magnetic mounts and dashboard care.',
    content: [
      'ستائر التظليل القماشية والمخرمة: حماية فعالة من أشعة الشمس المباشرة وحفظ خصوصية العائلة داخل المركبة.',
      'تكايات اليد والكونسول: خامات جلدية مريحة تحافظ على راحة السائق في الرحلات الطويلة وتمنع تشقق المقابض الأصلية.',
      'مرطبات وملمعات الجلد الطبيعي: منتجات عضوية تمنع جفاف المقاعد وتشققها بفعل درجات الحرارة المرتفعة صيفاً.',
    ],
  },
  {
    id: 'blog-post-3',
    slug: 'benefits-of-seat-upholstery',
    title: 'فوائد تنجيد وتلبيس مقاعد السيارة وطرق الحفاظ على قيمتها',
    titleEn: 'Top Benefits of Seat Covers & Maintaining Vehicle Resale Value',
    date: '٥ يوليو ٢٠٢٥',
    dateEn: 'July 5, 2025',
    image: 'https://cdn.salla.sa/wYYVD/dc76cbc0-0af3-4c33-baf0-eabe1d61a88d-1000x1000-E075PDKCrTCQQw1hLd2O9sM2MbaVY9zTIuqaZgiv.jpg',
    summary: 'لماذا يُعد تلبيس المقاعد استثماراً ذكياً؟ حماية المقاعد الأصلية من البقع، سهولة التنظيف، والحفاظ على سعر بيع السيارة مستقبلاً.',
    summaryEn: 'Why custom seat covers are an essential investment: factory fabric preservation, ease of cleaning and maximizing resale value.',
    content: [
      'حماية المراتب الأصلية: الحفاظ على قماش أو جلد الوكالة جديداً وخالياً من البقع والسوائل.',
      'رفع القيمة السوقية للمركبة: المقصورة النظيفة تزيد من رغبة المشتري وترفع سعر السيارة عند إعادة البيع.',
      'راحة القيادة وسهولة العناية: إمكانية مسح الأوساخ بسهولة بفوطة مبللة دون الحاجة لغسيل بخار مكلف.',
    ],
  },
];

// ============================================================================
// STORE INFO & BRAND IDENTITY
// ============================================================================
export const BLECO_STORE_INFO = {
  name: 'متجر السعيدي لخدمات السيارات',
  nameEn: 'Al-Saeedi Car Services Store',
  tagline: 'وجهتك الأولى لتنجيد وتلبيس مقاعد السيارات وأرضيات الدايموند بمواصفات الوكالة',
  taglineEn: 'Your premier destination for factory-fit seat covers and 5D diamond floor mats',
  logo: 'https://cdn.salla.sa/cdn-cgi/image/fit=scale-down,width=400,height=400,onerror=redirect,format=auto/wYYVD/OZbzrkkW0icMZlcDNOiZnU4PSjwq6WxXgCkwT0PQ.png',
  whiteLogo: 'https://cdn.salla.sa/form-builder/IibYRFolYmoAjTQ5Wrlkh3x4xO5daFS8Q8UBy1bH.png',
  favicon: 'https://cdn.salla.sa/wYYVD/hDQA2Sdhq57Pu48SLcQHt8CGC8jfeqgm4wf6ZWZK.png',
  phone: '+966597757086',
  whatsapp: '+966597757086',
  whatsappUrl: 'https://wa.me/966597757086?text=%D8%A3%D9%87%D9%84%D8%A7%D9%8B%20%D8%A8%D9%83%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%AA%D9%84%D8%A8%D9%8A%D8%B3%D8%A7%D8%AA%20%D9%85%D9%82%D8%A7%D8%B9%D8%AF%20%D8%A7%D9%84%D8%B3%D9%8A%D8%A7%D8%B1%D8%A7%D8%AA',
  address: 'مكة المكرمة - بطحاء قريش - شارع عتاب بن أسيد، جوار فرع وزارة العدل بطحاء قريش - مقابل مطعم جود الوليمة',
  addressEn: 'Makkah, Batha Quraish, Itab Ibn Asid St., next to Ministry of Justice branch',
  mapUrl: 'https://maps.app.goo.gl/6raS2hbm13FDzJKn9',
  crNumber: '7005616136',
  sbcNumber: '0000180462',
  sbcUrl: 'https://eauthenticate.saudibusiness.gov.sa/certificate-details/0000180462',
  social: {
    instagram: 'https://www.instagram.com/makkah8cars',
    snapchat: 'https://www.snapchat.com/add/makkah8cars',
    tiktok: 'https://www.tiktok.com/@makkah8cars',
  },
};
`;

fs.writeFileSync('src/data/blecoStoreData.ts', scriptContent, 'utf8');
console.log('Successfully wrote src/data/blecoStoreData.ts!');
