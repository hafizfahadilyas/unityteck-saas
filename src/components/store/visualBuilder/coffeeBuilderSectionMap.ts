/**
 * Map HiBrew page-builder block types → coffee Theme Customizer section ids.
 * Same Coffee*Form panels as docs/34 + Word customizer (ref UI parity).
 */

export const COFFEE_BUILDER_SECTION_BY_TYPE: Record<string, string> = {
  announcement: 'C-ANN',
  announcement_bar: 'C-ANN',
  marquee_banner: 'C-ANN',
  header: '00_header_builder',
  navbar: '00_header_builder',
  hero_banners: 'C-HERO',
  hero_slider: 'C-HERO',
  hero: 'C-HERO',
  featured_section_banners: 'C-FSB',
  featured_products: 'C-FP',
  product_tabs: 'C-FP',
  image_banners: 'C-IMG',
  footer: 'C-FOOT',
  store_features_bar: 'C-ICON',
  product_carousel: 'C-PC',
  product_carousel_banner: 'C-PCB',
  featured_categories_products: 'C-FCP',
  exclusive_benefits: 'C-BEN',
  events_masterclasses: 'C-EVT',
  features: 'C-FEAT',
  featuresSection: 'C-FEAT',
  model_comparison: 'C-CMP',
  modelComparison: 'C-CMP',
  reviews: 'C-REV',
  customerReviews: 'C-REV',
  faq: 'C-FAQ',
  commercial_hero: 'C-COMM',
  commercialHero: 'C-COMM',
  product_slider: 'C-PSL',
  productSlider: 'C-PSL',
  product_catalog: 'C-SHOP',
  product_collection: 'C-COLL',
  productCollection: 'C-COLL',
  newsletter: 'C-NEWS',
  custom_order: 'C-CPB',
};

/** Every coffee homepage / widget type that must open a Coffee*Form (docs/34). */
export const COFFEE_REF_REQUIRED_BLOCK_TYPES = [
  'announcement_bar',
  'header',
  'hero_banners',
  'featured_section_banners',
  'featured_products',
  'image_banners',
  'footer',
  'store_features_bar',
  'product_carousel',
  'featured_categories_products',
  'exclusive_benefits',
  'events_masterclasses',
  'features',
  'model_comparison',
  'reviews',
  'faq',
  'commercial_hero',
  'product_slider',
  'product_catalog',
  'product_collection',
  'product_carousel_banner',
  'newsletter',
  'custom_order',
] as const;

/** Doc #3–6, 8–20 widget labels (EN/AR) — match merchant coffee theme doc. */
export const COFFEE_DOC_WIDGET_TITLES: Record<string, { titleEn: string; titleAr: string }> = {
  w_hero_slider: { titleEn: 'Hero Banners', titleAr: 'لافتات الواجهة' },
  w_featured_section_banners: {
    titleEn: 'Featured Section Banners',
    titleAr: 'بانرات القسم المميز',
  },
  w_image_banners: { titleEn: 'Image Banner Section', titleAr: 'قسم بانر الصور' },
  w_product_grid: { titleEn: 'Featured Products', titleAr: 'المنتجات المميزة' },
  w_features: { titleEn: 'Feature Icons', titleAr: 'أيقونات المميزات' },
  w_product_carousel: { titleEn: 'Product Carousel', titleAr: 'عرض المنتجات المتحرك' },
  w_featured_categories: { titleEn: 'Category Showcase', titleAr: 'عرض التصنيفات' },
  w_exclusive_benefits: { titleEn: 'Benefits', titleAr: 'المزايا' },
  w_events_masterclasses: {
    titleEn: 'Events & Masterclasses',
    titleAr: 'الفعاليات وورش العمل',
  },
  w_features_section: { titleEn: 'Features Section', titleAr: 'قسم المميزات' },
  w_model_comparison: { titleEn: 'Model Comparison', titleAr: 'مقارنة الموديلات' },
  w_testimonials: { titleEn: 'Customer Reviews', titleAr: 'تقييمات العملاء' },
  w_faq: { titleEn: 'FAQ', titleAr: 'الأسئلة الشائعة' },
  w_commercial_hero: { titleEn: 'Commercial Hero', titleAr: 'البطل التجاري' },
  w_product_slider: { titleEn: 'Product Slider', titleAr: 'شريط المنتجات' },
  w_product_catalog: { titleEn: 'Product Catalog', titleAr: 'كتالوج المنتجات' },
  w_product_collection: { titleEn: 'Product Collection', titleAr: 'مجموعة المنتجات' },
  w_inner_section: { titleEn: 'Columns / Inner Section', titleAr: 'أعمدة / قسم داخلي' },
};

export function coffeeCustomizerSectionForBlock(block: {
  type?: string;
  id?: string;
} | null | undefined): string | null {
  if (!block) return null;
  const type = String(block.type || '').trim();
  const id = String(block.id || '').trim();
  if (type && COFFEE_BUILDER_SECTION_BY_TYPE[type]) {
    return COFFEE_BUILDER_SECTION_BY_TYPE[type];
  }
  if (id && COFFEE_BUILDER_SECTION_BY_TYPE[id]) {
    return COFFEE_BUILDER_SECTION_BY_TYPE[id];
  }
  // Chrome aliases used in live coffee drafts
  if (id === 'announcement' || id.startsWith('announcement')) return 'C-ANN';
  if (id === 'header' || id.startsWith('header')) return '00_header_builder';
  if (id === 'footer' || id.startsWith('footer')) return 'C-FOOT';
  return null;
}

/** Doc-facing layer labels when draft titles are stale / flower leftovers. */
const COFFEE_LAYER_TITLE_BY_TYPE: Record<string, { titleEn: string; titleAr: string }> = {
  announcement_bar: { titleEn: 'Promotional Announcements', titleAr: 'الإعلانات الترويجية' },
  announcement: { titleEn: 'Promotional Announcements', titleAr: 'الإعلانات الترويجية' },
  header: { titleEn: 'Main Menu', titleAr: 'القائمة الرئيسية' },
  hero_banners: { titleEn: 'Hero Banners', titleAr: 'لافتات الواجهة' },
  hero_slider: { titleEn: 'Hero Banners', titleAr: 'لافتات الواجهة' },
  featured_section_banners: { titleEn: 'Featured Section Banners', titleAr: 'بانرات القسم المميز' },
  featured_products: { titleEn: 'Featured Products', titleAr: 'المنتجات المميزة' },
  image_banners: { titleEn: 'Image Banner Section', titleAr: 'قسم بانر الصور' },
  footer: { titleEn: 'Footer', titleAr: 'التذييل' },
  store_features_bar: { titleEn: 'Feature Icons', titleAr: 'أيقونات المميزات' },
  product_carousel: { titleEn: 'Product Carousel', titleAr: 'عرض المنتجات المتحرك' },
  featured_categories_products: { titleEn: 'Category Showcase', titleAr: 'عرض التصنيفات' },
  exclusive_benefits: { titleEn: 'Benefits', titleAr: 'المزايا' },
  events_masterclasses: { titleEn: 'Events & Masterclasses', titleAr: 'الفعاليات وورش العمل' },
  features: { titleEn: 'Features Section', titleAr: 'قسم المميزات' },
  model_comparison: { titleEn: 'Model Comparison', titleAr: 'مقارنة الموديلات' },
  reviews: { titleEn: 'Customer Reviews', titleAr: 'تقييمات العملاء' },
  faq: { titleEn: 'FAQ', titleAr: 'الأسئلة الشائعة' },
  commercial_hero: { titleEn: 'Commercial Hero', titleAr: 'البطل التجاري' },
  product_slider: { titleEn: 'Product Slider', titleAr: 'شريط المنتجات' },
  product_catalog: { titleEn: 'Product Catalog', titleAr: 'كتالوج المنتجات' },
  product_collection: { titleEn: 'Product Collection', titleAr: 'مجموعة المنتجات' },
  product_carousel_banner: { titleEn: 'Product Carousel Banner', titleAr: 'بانر عرض المنتجات' },
  newsletter: { titleEn: 'Newsletter & Subscribe', titleAr: 'النشرة البريدية والاشتراك' },
  custom_order: { titleEn: 'Custom Product Order', titleAr: 'طلب منتج مخصص' },
};

export function coffeeLayerTitle(
  block: { type?: string; titleEn?: string; titleAr?: string } | null | undefined,
  isAr: boolean,
): string {
  const type = String(block?.type || '');
  const mapped = COFFEE_LAYER_TITLE_BY_TYPE[type];
  if (mapped) return isAr ? mapped.titleAr : mapped.titleEn;
  return (isAr ? block?.titleAr : block?.titleEn) || block?.titleEn || block?.titleAr || type || '—';
}
