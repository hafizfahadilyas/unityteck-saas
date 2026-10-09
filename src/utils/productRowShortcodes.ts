import type { Product } from '../types';

export interface ProductRowConfig {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr?: string;
  subtitleEn?: string;
  filterType: 'category' | 'brand' | 'specific_products' | 'collection' | 'shortcode';
  categorySlug?: string;
  categoryName?: string;
  brandName?: string;
  selectedProductIds?: string[];
  collectionType?: 'all' | 'on_sale' | 'featured' | 'bestsellers' | 'new_arrivals';
  limit: number;
  columns: number;
  layout: 'slider' | 'grid' | '3d_gallery' | 'masonry';
  showBadges?: boolean;
  showRating?: boolean;
  showAddToCart?: boolean;
  viewAllLink?: string;
  badgeTextAr?: string;
  badgeTextEn?: string;
  isActive?: boolean;
}

/** Standard Default Product Rows for Hadaya Mecca Theme & Page Builder */
export const DEFAULT_PRODUCT_ROWS: ProductRowConfig[] = [
  {
    id: 'row-nat-bouquets',
    titleAr: 'باقات الورود الطبيعية',
    titleEn: 'Natural Fresh Flower Bouquets',
    subtitleAr: 'أجود أنواع الجوري الهولندي والإكوادوري المنسق بأيدي أمهر الخبراء بمكة',
    subtitleEn: 'Finest Dutch and Ecuadorian long-stem roses tailored by master florists',
    filterType: 'category',
    categorySlug: 'natural-bouquets',
    categoryName: 'باقات الورود الطبيعية',
    limit: 6,
    columns: 4,
    layout: 'slider',
    showBadges: true,
    showRating: true,
    showAddToCart: true,
    viewAllLink: '#catalog',
    badgeTextAr: 'طازج يومياً',
    badgeTextEn: 'Fresh Daily',
    isActive: true,
  },
  {
    id: 'row-patchi-choc',
    titleAr: 'ورد وشوكولاتة باتشي وبستاني الملكية',
    titleEn: 'Roses & Patchi / Bostani Luxury Chocolates',
    subtitleAr: 'تناغم شوكولاتة باتشي وبستاني الفاخرة وباقات الجوري لإهداءات تليق بأحبابك',
    subtitleEn: 'Signature Patchi and Bostani chocolate boxes paired with fresh roses',
    filterType: 'category',
    categorySlug: 'roses-patchi',
    categoryName: 'ورد و شوكليت باتشي',
    limit: 6,
    columns: 4,
    layout: 'slider',
    showBadges: true,
    showRating: true,
    showAddToCart: true,
    viewAllLink: '#catalog',
    badgeTextAr: 'الأكثر طلباً',
    badgeTextEn: 'Best Seller',
    isActive: true,
  },
  {
    id: 'row-cakes-bento',
    titleAr: 'ورد وكيك المناسبات وأعياد الميلاد',
    titleEn: 'Roses & Gourmet Birthday / Bento Cakes',
    subtitleAr: 'كيك كوري خاص وكعكات الريد فيلفيت الطازجة لمناسبات أعياد الميلاد والتخرج',
    subtitleEn: 'Korean lunchbox cakes and artisan bakery paired with celebratory bouquets',
    filterType: 'category',
    categorySlug: 'roses-cake',
    categoryName: 'ورد مع كيك',
    limit: 6,
    columns: 4,
    layout: 'slider',
    showBadges: true,
    showRating: true,
    showAddToCart: true,
    viewAllLink: '#catalog',
    badgeTextAr: 'ترند مكة',
    badgeTextEn: 'Trending',
    isActive: true,
  },
  {
    id: 'row-coffee-sweets',
    titleAr: 'ورد وقهوة وضيافة حجازية',
    titleEn: 'Roses, Arabic Coffee & Sweets',
    subtitleAr: 'أصالة الضيافة الحجازية مع القهوة العربية والتمور المحشوة والحلويات الفاخرة',
    subtitleEn: 'Authentic Hijazi hospitality blending Arabic cardamom coffee with blooms',
    filterType: 'category',
    categorySlug: 'roses-coffee-sweets',
    categoryName: 'تقديمة ورد مع قهوة وحلا',
    limit: 6,
    columns: 4,
    layout: 'slider',
    showBadges: true,
    showRating: true,
    showAddToCart: true,
    viewAllLink: '#catalog',
    badgeTextAr: 'كرم الحجاز',
    badgeTextEn: 'Hijazi Heritage',
    isActive: true,
  },
  {
    id: 'row-vases-crystal',
    titleAr: 'فازات ورود طبيعية وكريستال',
    titleEn: 'Natural Flower Vases & Crystal Masterpieces',
    subtitleAr: 'فازات كريستالية وسيراميك راقية تدوم طويلاً لتزيين المجالس والمكاتب والأجنحة',
    subtitleEn: 'Hand-cut crystal and fluted ceramic vases elevating homes and luxury suites',
    filterType: 'category',
    categorySlug: 'flower-vases',
    categoryName: 'فازات ورد طبيعي',
    limit: 6,
    columns: 4,
    layout: 'slider',
    showBadges: true,
    showRating: true,
    showAddToCart: true,
    viewAllLink: '#catalog',
    badgeTextAr: 'VIP فاخر',
    badgeTextEn: 'VIP Luxury',
    isActive: true,
  },
  {
    id: 'row-luxury-sets',
    titleAr: 'أطقم هدايا ملكية فاخرة (رجالية ونسائية)',
    titleEn: 'Royal Luxury Gift Sets (Men & Women)',
    subtitleAr: 'أطقم هدايا استثنائية تضم عطوراً فاخرة، ساعات، مجوهرات وباقات زهور نضرة',
    subtitleEn: 'Signature executive and feminine luxury gift sets with blooms and fine accessories',
    filterType: 'category',
    categorySlug: 'men-gifts',
    categoryName: 'هدايا رجالية ملكية',
    limit: 4,
    columns: 4,
    layout: 'grid',
    showBadges: true,
    showRating: true,
    showAddToCart: true,
    viewAllLink: '#catalog',
    badgeTextAr: 'ملكي',
    badgeTextEn: 'Royal Choice',
    isActive: true,
  },
  {
    id: 'row-mawajeeb-heritage',
    titleAr: 'لوحات مواجيب وتراث حجازي',
    titleEn: 'Mawajeeb Wooden Plaques & Heritage Keepsakes',
    subtitleAr: 'لوحات خشبية تذكارية محفورة بأبيات ترحيبية مع بخور مروكي وورود طبيعية',
    subtitleEn: 'Hand-carved wooden heritage plaques with authentic Maroki oud and roses',
    filterType: 'category',
    categorySlug: 'mawajeeb',
    categoryName: 'لوحات مواجيب وتراث حجازي',
    limit: 4,
    columns: 4,
    layout: 'grid',
    showBadges: true,
    showRating: true,
    showAddToCart: true,
    viewAllLink: '#catalog',
    badgeTextAr: 'تراث أصيل',
    badgeTextEn: 'Authentic Heritage',
    isActive: true,
  },
];

/**
 * Generate Elementor-style Shortcode from row config
 * Example outputs:
 * [products category="roses-cake" limit="6" layout="slider"]
 * [products brand="patchi" limit="4" layout="grid"]
 * [products ids="wm-peony-05,nat-1,choc-1" limit="4"]
 * [products filter="on_sale" limit="8"]
 */
export function generateShortcode(config: Partial<ProductRowConfig>): string {
  const parts: string[] = ['products'];

  if (config.filterType === 'category' && (config.categorySlug || config.categoryName)) {
    parts.push(`category="${config.categorySlug || config.categoryName}"`);
  } else if (config.filterType === 'brand' && config.brandName) {
    parts.push(`brand="${config.brandName}"`);
  } else if (config.filterType === 'specific_products' && config.selectedProductIds && config.selectedProductIds.length > 0) {
    parts.push(`ids="${config.selectedProductIds.join(',')}"`);
  } else if (config.filterType === 'collection' && config.collectionType) {
    parts.push(`filter="${config.collectionType}"`);
  }

  if (config.limit && config.limit !== 6) {
    parts.push(`limit="${config.limit}"`);
  }

  if (config.columns && config.columns !== 4) {
    parts.push(`columns="${config.columns}"`);
  }

  if (config.layout && config.layout !== 'grid') {
    parts.push(`layout="${config.layout}"`);
  }

  if (config.titleAr) {
    parts.push(`title="${config.titleAr}"`);
  }

  return `[${parts.join(' ')}]`;
}

/**
 * Parse an Elementor-style shortcode string into a row query configuration
 */
export function parseShortcode(shortcodeStr: string): Partial<ProductRowConfig> | null {
  if (!shortcodeStr || typeof shortcodeStr !== 'string') return null;
  const trimmed = shortcodeStr.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return null;

  const content = trimmed.slice(1, -1).trim();
  if (!content.startsWith('products') && !content.startsWith('product_row')) return null;

  const result: Partial<ProductRowConfig> = {
    filterType: 'category',
    limit: 6,
    columns: 4,
    layout: 'slider',
    showBadges: true,
    showRating: true,
    showAddToCart: true,
    isActive: true,
  };

  const attrRegex = /(\w+)="([^"]*)"/g;
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(content)) !== null) {
    const key = match[1].toLowerCase();
    const val = match[2];

    switch (key) {
      case 'category':
        result.filterType = 'category';
        result.categorySlug = val;
        result.categoryName = val;
        break;
      case 'brand':
        result.filterType = 'brand';
        result.brandName = val;
        break;
      case 'ids':
      case 'products':
        result.filterType = 'specific_products';
        result.selectedProductIds = val.split(',').map((s) => s.trim()).filter(Boolean);
        break;
      case 'filter':
      case 'collection':
        result.filterType = 'collection';
        result.collectionType = val as any;
        break;
      case 'limit':
      case 'count':
        result.limit = Math.max(1, parseInt(val, 10) || 6);
        break;
      case 'columns':
      case 'cols':
        result.columns = Math.min(6, Math.max(1, parseInt(val, 10) || 4));
        break;
      case 'layout':
        if (['slider', 'grid', '3d_gallery', 'masonry'].includes(val)) {
          result.layout = val as any;
        }
        break;
      case 'title':
        result.titleAr = val;
        result.titleEn = val;
        break;
      case 'subtitle':
        result.subtitleAr = val;
        result.subtitleEn = val;
        break;
    }
  }

  return result;
}

/**
 * Filter product catalog dynamically based on a ProductRowConfig
 * Allows automated scaling: any product added in dashboard is immediately returned if it matches rules!
 */
export function filterProductsByRowConfig(
  products: Product[],
  config: Partial<ProductRowConfig>
): Product[] {
  if (!products || products.length === 0) return [];

  const limit = config.limit && config.limit > 0 ? config.limit : 6;
  const normalize = (str?: string | null) => (str || '').toLowerCase().trim();

  let filtered = [...products];

  // 1. Filter by Specific Product IDs
  if (config.filterType === 'specific_products' && config.selectedProductIds && config.selectedProductIds.length > 0) {
    const idSet = new Set(config.selectedProductIds.map((id) => id.trim().toLowerCase()));
    filtered = filtered.filter((p) => idSet.has(p.id.toLowerCase()) || idSet.has((p.sku || '').toLowerCase()));
    return filtered.slice(0, limit);
  }

  // 2. Filter by Brand
  if (config.filterType === 'brand' && config.brandName) {
    const targetBrand = normalize(config.brandName);
    filtered = filtered.filter((p) => {
      const pBrand = normalize(p.brand);
      return pBrand.includes(targetBrand) || targetBrand.includes(pBrand);
    });
    return filtered.slice(0, limit);
  }

  // 3. Filter by Collection Type (All, On Sale, Featured, Bestsellers, New Arrivals)
  if (config.filterType === 'collection') {
    switch (config.collectionType) {
      case 'on_sale':
        filtered = filtered.filter((p) => (p.originalPrice && p.originalPrice > p.price) || (p.discountedPrice && p.discountedPrice < p.price) || p.id.startsWith('disc-'));
        break;
      case 'bestsellers':
        filtered = filtered.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
        break;
      case 'new_arrivals':
        filtered = filtered.sort((a, b) => (new Date(b.publishedAt || 0).getTime()) - (new Date(a.publishedAt || 0).getTime()));
        break;
      case 'featured':
      default:
        // Return top rated/featured
        break;
    }
    return filtered.slice(0, limit);
  }

  // 4. Filter by Category (Default)
  if (config.categorySlug || config.categoryName) {
    const catSlug = normalize(config.categorySlug);
    const catName = normalize(config.categoryName);

    // Map common aliases/keywords for smooth matching
    const catKeywords: Record<string, string[]> = {
      'natural-bouquets': ['طبيعي', 'باقة', 'rose', 'bouquet', 'peony', 'natural', 'زهور طبيعية', 'ورد أحمر', 'ورد أبيض'],
      'roses-patchi': ['باتشي', 'patchi', 'شوكليت باتشي', 'شوكولاتة باتشي'],
      'roses-bostani': ['بستاني', 'bostani', 'شوكليت بستاني', 'شوكولاتة بستاني'],
      'flower-vases': ['فاز', 'فازات', 'vase', 'crystal', 'كريستال', 'سيراميك'],
      'vases-chocolate': ['فازات الورود مع شوكليت', 'فازة شوكولاتة', 'vases chocolate'],
      'roses-fish': ['أسماك', 'سمك', 'fish', 'aquarium'],
      'roses-lovebirds': ['عصافير', 'طيور', 'lovebirds', 'bird'],
      'roses-coffee': ['ورد وقهوة', 'قهوة', 'coffee', 'دلة'],
      'roses-coffee-sweets': ['قهوة وحلا', 'حلا', 'sweets', 'coffee sweets', 'ضيافة'],
      'roses-cake': ['كيك', 'cake', 'ريد فيلفت', 'birthday', 'ميلاد', 'تورته'],
      'korean-cake': ['كيك كوري', 'bento', 'بينتو', 'كوري'],
      'mawajeeb': ['مواجيب', 'mawajeeb', 'تراث', 'لوحة', 'خشب'],
      'newborn': ['مواليد', 'مولود', 'newborn', 'baby', 'ولادة'],
      'graduation': ['تخرج', 'graduation', 'نجاح', 'قبعة'],
      'valentine': ['حب', 'رومانس', 'valentine', 'قلب'],
      'wedding': ['زواج', 'عروس', 'wedding', 'bridal', 'مسكة'],
      'birthday': ['ميلاد', 'birthday', 'عيد ميلاد', 'احتفال'],
      'men-gifts': ['رجال', 'men', 'ساعة', 'محفظة', 'عطر رجالي'],
      'women-gifts': ['نساء', 'women', 'مجوهرات', 'عطر نسائي', 'بيوني'],
    };

    const targetKey = Object.keys(catKeywords).find((k) => catSlug.includes(k) || catName.includes(k));
    const keywords = targetKey ? catKeywords[targetKey] : [catSlug, catName];

    filtered = filtered.filter((p) => {
      const pCat = normalize(p.category);
      const pName = normalize(p.name);
      const pNameAr = normalize(p.nameAr);
      const pDesc = normalize(p.descriptionAr || p.description);
      const pTags = (p.tags || []).map((t) => normalize(t)).join(' ');
      const combined = `${pCat} ${pName} ${pNameAr} ${pDesc} ${pTags}`;

      // Direct category match
      if (pCat.includes(catSlug) || pCat.includes(catName) || catName.includes(pCat)) {
        return true;
      }

      // Keyword match
      return keywords.some((kw) => combined.includes(kw));
    });
  }

  // Fallback: if category filter returned fewer than 2 products, supplement with related products
  if (filtered.length === 0) {
    filtered = products.slice(0, limit);
  }

  return filtered.slice(0, limit);
}
