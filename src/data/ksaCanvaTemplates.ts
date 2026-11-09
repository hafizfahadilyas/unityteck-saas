/**
 * KSA Canva design template catalog (Step 1).
 * Per-store niche packs (coffee / flowers / general) + Blank.
 * Free plan unlocks first N per category (default 5). Rest = Pro / Master grant.
 * Layouts are editable layer JSON — no fake metrics / brand / prices.
 * Dynamic binds: store | product | price | category fill from live tenant data.
 */

export type CanvaTemplateCategory = 'banner' | 'social' | 'ads' | 'logo' | 'product' | 'category';
export type CanvaTemplateTier = 'free' | 'pro';
/** Store vertical for premade packs. blank = start empty. */
export type CanvaTemplateNiche = 'blank' | 'coffee' | 'flowers' | 'general';

/** Live tenant field this layer should fill when the template is applied. */
export type CanvaLayerBind = 'store' | 'product' | 'price' | 'category';

export interface CanvaTemplateElement {
  type: 'headline' | 'subtitle' | 'price' | 'badge' | 'custom_text' | 'sticker' | 'watermark' | 'shape' | 'icon' | 'image';
  textEn?: string;
  textAr?: string;
  /** When set, studio replaces text from the active store / product (never fake SAR / brand). */
  bind?: CanvaLayerBind;
  /** Normalized 0–1 against template width/height (center of layer, or left edge when textAlign left) */
  xPct: number;
  yPct: number;
  widthPct?: number;
  heightPct?: number;
  fontSize?: number;
  fontColor?: string;
  bgColor?: string;
  bgPadding?: number;
  borderRadius?: number;
  isBold?: boolean;
  isItalic?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  badgeStyle?: 'pill' | 'solid' | 'gold_glow' | 'emerald_glow' | 'outline';
  fontFamily?: string;
  shapeType?: 'circle' | 'rectangle' | 'triangle' | 'star' | 'badge' | 'dot_grid' | 'wave_curve' | 'line';
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  icon?: string;
  imageUrl?: string;
}

export interface CanvaDesignTemplate {
  id: string;
  category: CanvaTemplateCategory;
  /** Sort order within category; free unlock uses first N by this order */
  sort: number;
  tier: CanvaTemplateTier;
  niche: CanvaTemplateNiche;
  nameEn: string;
  nameAr: string;
  width: number;
  height: number;
  backdropId: string;
  customSolidColor?: string;
  /** Product photo zone — keep clear of headline/badge bands */
  productPosPct: { x: number; y: number; scale: number };
  previewGradient: string;
  /** Optional preview-only image — never used as cross-tenant product identity */
  sampleImageUrl?: string;
  elements: CanvaTemplateElement[];
}

export const CANVA_FONT_FAMILIES = [
  { id: 'Tajawal', labelEn: 'Tajawal (Arabic)', labelAr: 'تجوال (عربي)' },
  { id: 'Cairo', labelEn: 'Cairo (Arabic)', labelAr: 'القاهرة (عربي)' },
  { id: 'Almarai', labelEn: 'Almarai (Arabic)', labelAr: 'المراعي (عربي عصري)' },
  { id: 'Amiri', labelEn: 'Amiri (Arabic Calligraphy)', labelAr: 'أميري (خط ملكي)' },
  { id: 'Readex Pro', labelEn: 'Readex Pro', labelAr: 'ريدكس برو' },
  { id: 'Alexandria', labelEn: 'Alexandria', labelAr: 'الإسكندرية' },
  { id: 'Outfit', labelEn: 'Outfit Clean', labelAr: 'أوتفت حديث' },
  { id: 'Poppins', labelEn: 'Poppins', labelAr: 'بوبينز' },
  { id: 'Plus Jakarta Sans', labelEn: 'Plus Jakarta Sans', labelAr: 'جاكرتا فاخر' },
  { id: 'Montserrat', labelEn: 'Montserrat Modern', labelAr: 'مونتسيرات' },
  { id: 'Staatliches', labelEn: 'Staatliches Display', labelAr: 'ستاتليش عريض' },
] as const;

export const CANVA_TEMPLATE_CATEGORIES: Array<{
  id: CanvaTemplateCategory;
  labelEn: string;
  labelAr: string;
  iconName?: string;
}> = [
  { id: 'banner', labelEn: 'Store Banner', labelAr: 'بنرات المتاجر' },
  { id: 'social', labelEn: 'Social Media', labelAr: 'منشورات التواصل' },
  { id: 'ads', labelEn: 'Ads Banner', labelAr: 'إعلانات تجارية' },
  { id: 'logo', labelEn: 'Logo & Brand', labelAr: 'شعارات وهوية' },
  { id: 'product', labelEn: 'Product', labelAr: 'المنتجات' },
  { id: 'category', labelEn: 'Category', labelAr: 'التصنيفات' },
];

/** Default Free unlocks per category; Master may raise via store column / Pro = all. */
export const CANVA_FREE_TEMPLATES_PER_CATEGORY = 5;

function el(
  partial: Partial<CanvaTemplateElement> & { xPct: number; yPct: number },
): CanvaTemplateElement {
  return {
    type: 'custom_text',
    bgPadding: 14,
    borderRadius: 18,
    isBold: true,
    textAlign: 'center',
    fontFamily: 'Tajawal',
    ...partial,
  };
}

/**
 * Detect store vertical for premade packs.
 * coffee ≠ flowers ≠ cars — never borrow another niche identity.
 */
export function resolveStoreCanvaNiche(store: {
  id?: string;
  slug?: string;
  name?: string;
  category?: string;
}): CanvaTemplateNiche {
  const blob = `${store.id || ''} ${store.slug || ''} ${store.name || ''} ${store.category || ''}`.toLowerCase();
  if (
    store.id === 'store-coffee' ||
    /coffee|hibrew|roaster|قهوة|هايبرو|محمصة/.test(blob)
  ) {
    return 'coffee';
  }
  if (
    store.id === 'store-1' ||
    store.id === 'store-mecca' ||
    /flower|flora|gift|bouquet|ورد|زهور|هدايا|مك[اة]ة|hadaya|mecca/.test(blob)
  ) {
    return 'flowers';
  }
  return 'general';
}

/**
 * Layout rules (Canva-like safe zones):
 * - Square: badge top · product mid · text bottom band
 * - Banner/Ads landscape: left text column (x≈0.08 left-align) · product right
 * - No hardcoded store brands or SAR prices — use bind
 */
const PACK: CanvaDesignTemplate[] = [
  // ═══════════════════════════════════════════
  // BLANK
  // ═══════════════════════════════════════════
  {
    id: 'blank-square',
    category: 'social',
    sort: 0,
    tier: 'free',
    niche: 'blank',
    nameEn: 'Blank Square',
    nameAr: 'لوحة فارغة مربعة',
    width: 1080,
    height: 1080,
    backdropId: 'pure-white',
    productPosPct: { x: 0.5, y: 0.5, scale: 0 },
    previewGradient: 'linear-gradient(135deg,#ffffff,#f1f5f9)',
    elements: [],
  },
  {
    id: 'blank-story',
    category: 'social',
    sort: 0,
    tier: 'free',
    niche: 'blank',
    nameEn: 'Blank Story 9:16',
    nameAr: 'لوحة فارغة ستوري',
    width: 1080,
    height: 1920,
    backdropId: 'pure-white',
    productPosPct: { x: 0.5, y: 0.5, scale: 0 },
    previewGradient: 'linear-gradient(180deg,#ffffff,#f8fafc)',
    elements: [],
  },
  {
    id: 'blank-banner',
    category: 'banner',
    sort: 0,
    tier: 'free',
    niche: 'blank',
    nameEn: 'Blank Store Banner',
    nameAr: 'بنر فارغ للمتجر',
    width: 1600,
    height: 600,
    backdropId: 'pure-white',
    productPosPct: { x: 0.5, y: 0.5, scale: 0 },
    previewGradient: 'linear-gradient(90deg,#ffffff,#f1f5f9)',
    elements: [],
  },
  {
    id: 'blank-product',
    category: 'product',
    sort: 0,
    tier: 'free',
    niche: 'blank',
    nameEn: 'Blank Product Canvas',
    nameAr: 'لوحة منتج فارغة',
    width: 1080,
    height: 1080,
    backdropId: 'soft-ivory',
    productPosPct: { x: 0.5, y: 0.48, scale: 70 },
    previewGradient: 'linear-gradient(135deg,#faf7f2,#f3eee6)',
    elements: [],
  },
  {
    id: 'blank-ads',
    category: 'ads',
    sort: 0,
    tier: 'free',
    niche: 'blank',
    nameEn: 'Blank Ads Landscape',
    nameAr: 'إعلان فارغ أفقي',
    width: 1200,
    height: 628,
    backdropId: 'pure-white',
    productPosPct: { x: 0.5, y: 0.5, scale: 0 },
    previewGradient: 'linear-gradient(90deg,#ffffff,#e2e8f0)',
    elements: [],
  },
  {
    id: 'blank-logo',
    category: 'logo',
    sort: 0,
    tier: 'free',
    niche: 'blank',
    nameEn: 'Blank Logo Mark',
    nameAr: 'شعار فارغ',
    width: 800,
    height: 800,
    backdropId: 'pure-white',
    productPosPct: { x: 0.5, y: 0.5, scale: 0 },
    previewGradient: 'linear-gradient(135deg,#ffffff,#f8fafc)',
    elements: [],
  },
  {
    id: 'blank-category',
    category: 'category',
    sort: 0,
    tier: 'free',
    niche: 'blank',
    nameEn: 'Blank Category Cover',
    nameAr: 'غلاف تصنيف فارغ',
    width: 1200,
    height: 800,
    backdropId: 'pure-white',
    productPosPct: { x: 0.5, y: 0.5, scale: 0 },
    previewGradient: 'linear-gradient(135deg,#ffffff,#f1f5f9)',
    elements: [],
  },

  // ═══════════════════════════════════════════
  // COFFEE
  // ═══════════════════════════════════════════
  {
    id: 'cof-soc-roast-lux',
    category: 'social',
    sort: 1,
    tier: 'free',
    niche: 'coffee',
    nameEn: 'Coffee Roast Luxury Post',
    nameAr: 'منشور قهوة محمصة فاخر',
    width: 1080,
    height: 1080,
    backdropId: 'coffee-cream',
    productPosPct: { x: 0.5, y: 0.4, scale: 56 },
    previewGradient: 'linear-gradient(160deg,#f7f1e8,#e8d5b7 55%,#3d2314)',
    elements: [
      el({ type: 'badge', bind: 'store', textEn: 'Store', textAr: 'المتجر', xPct: 0.5, yPct: 0.08, fontSize: 16, fontColor: '#faf6f0', bgColor: '#3d2314', borderRadius: 22 }),
      el({ type: 'headline', bind: 'product', textEn: 'Freshly Roasted in KSA', textAr: 'محمّص طازج في المملكة', xPct: 0.5, yPct: 0.76, fontSize: 34, fontColor: '#2a170e', bgColor: 'transparent', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'Order today · Ship nationwide', textAr: 'اطلب اليوم · شحن لجميع المدن', xPct: 0.5, yPct: 0.86, fontSize: 18, fontColor: '#5c3a22', bgColor: 'transparent', isBold: false }),
      el({ type: 'price', bind: 'price', textEn: '', textAr: '', xPct: 0.5, yPct: 0.94, fontSize: 22, fontColor: '#faf6f0', bgColor: '#3d2314', borderRadius: 14 }),
    ],
  },
  {
    id: 'cof-soc-espresso-story',
    category: 'social',
    sort: 2,
    tier: 'free',
    niche: 'coffee',
    nameEn: 'Espresso Story Soft Luxury',
    nameAr: 'ستوري إسبريسو فاخرة',
    width: 1080,
    height: 1920,
    backdropId: 'espresso-lux',
    productPosPct: { x: 0.5, y: 0.38, scale: 52 },
    previewGradient: 'linear-gradient(180deg,#2a170e,#5c3a22 40%,#f3e6d4)',
    elements: [
      el({ type: 'badge', textEn: 'BARISTA PICK', textAr: 'اختيار الباريستا', xPct: 0.5, yPct: 0.1, fontSize: 18, fontColor: '#2a170e', bgColor: '#e8c9a0', badgeStyle: 'gold_glow' }),
      el({ type: 'headline', bind: 'product', textEn: 'Your Morning Ritual', textAr: 'طقوس صباحك المثالية', xPct: 0.5, yPct: 0.72, fontSize: 40, fontColor: '#faf6f0', bgColor: 'transparent', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'Machines · Beans · Accessories', textAr: 'مكائن · بن · مستلزمات', xPct: 0.5, yPct: 0.8, fontSize: 20, fontColor: '#f5e6d3', bgColor: 'transparent', isBold: false }),
      el({ type: 'badge', textEn: 'SHOP NOW', textAr: 'تسوق الآن', xPct: 0.5, yPct: 0.9, fontSize: 20, fontColor: '#2a170e', bgColor: '#f5e6d3', borderRadius: 28 }),
    ],
  },
  {
    id: 'cof-soc-machine-clean',
    category: 'social',
    sort: 3,
    tier: 'free',
    niche: 'coffee',
    nameEn: 'Coffee Machine Clean Showcase',
    nameAr: 'عرض ماكينة قهوة نظيف',
    width: 1080,
    height: 1080,
    backdropId: 'soft-ivory',
    productPosPct: { x: 0.5, y: 0.4, scale: 60 },
    previewGradient: 'linear-gradient(145deg,#faf8f5,#ebe4da)',
    elements: [
      el({ type: 'badge', textEn: 'NEW ARRIVAL', textAr: 'وصل حديثاً', xPct: 0.12, yPct: 0.08, fontSize: 15, fontColor: '#fff', bgColor: '#b45309', textAlign: 'left' }),
      el({ type: 'headline', bind: 'product', textEn: 'Home Barista Machine', textAr: 'ماكينة باريستا منزلية', xPct: 0.5, yPct: 0.78, fontSize: 32, fontColor: '#1c1410', bgColor: 'transparent', fontFamily: 'Plus Jakarta Sans' }),
      el({ type: 'price', bind: 'price', textEn: '', textAr: '', xPct: 0.5, yPct: 0.9, fontSize: 28, fontColor: '#3d2314', bgColor: 'transparent', fontFamily: 'Outfit' }),
    ],
  },
  {
    id: 'cof-ban-hero',
    category: 'banner',
    sort: 1,
    tier: 'free',
    niche: 'coffee',
    nameEn: 'Coffee Store Hero Banner',
    nameAr: 'بنر بطولي لمتجر القهوة',
    width: 1600,
    height: 600,
    backdropId: 'coffee-cream',
    productPosPct: { x: 0.78, y: 0.5, scale: 50 },
    previewGradient: 'linear-gradient(90deg,#f7f1e8,#d4b896)',
    elements: [
      el({ type: 'badge', bind: 'store', textEn: 'Store', textAr: 'المتجر', xPct: 0.08, yPct: 0.22, fontSize: 16, fontColor: '#faf6f0', bgColor: '#3d2314', textAlign: 'left' }),
      el({ type: 'headline', bind: 'product', textEn: 'Craft Coffee at Home', textAr: 'قهوة حرفية في منزلك', xPct: 0.08, yPct: 0.46, fontSize: 42, fontColor: '#2a170e', bgColor: 'transparent', textAlign: 'left', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'Machines & beans · Fast KSA delivery', textAr: 'مكائن وبن · توصيل سريع بالمملكة', xPct: 0.08, yPct: 0.64, fontSize: 20, fontColor: '#5c3a22', bgColor: 'transparent', textAlign: 'left', isBold: false }),
      el({ type: 'badge', textEn: 'EXPLORE', textAr: 'استكشف', xPct: 0.08, yPct: 0.82, fontSize: 17, fontColor: '#faf6f0', bgColor: '#3d2314', textAlign: 'left', borderRadius: 24 }),
    ],
  },
  {
    id: 'cof-ban-sale',
    category: 'banner',
    sort: 2,
    tier: 'free',
    niche: 'coffee',
    nameEn: 'Coffee Weekend Sale Banner',
    nameAr: 'بنر تخفيضات قهوة نهاية الأسبوع',
    width: 1600,
    height: 500,
    backdropId: 'espresso-lux',
    productPosPct: { x: 0.8, y: 0.5, scale: 48 },
    previewGradient: 'linear-gradient(90deg,#2a170e,#8b5a2b)',
    elements: [
      el({ type: 'badge', textEn: 'WEEKEND OFFER', textAr: 'عرض نهاية الأسبوع', xPct: 0.08, yPct: 0.24, fontSize: 17, fontColor: '#2a170e', bgColor: '#e8c9a0', textAlign: 'left' }),
      el({ type: 'headline', bind: 'product', textEn: 'Upgrade Your Brew Setup', textAr: 'طوّر تجهيزات التحضير', xPct: 0.08, yPct: 0.48, fontSize: 38, fontColor: '#faf6f0', bgColor: 'transparent', textAlign: 'left', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'Selected machines & grinders', textAr: 'مكائن ومطاحن مختارة', xPct: 0.08, yPct: 0.7, fontSize: 18, fontColor: '#f5e6d3', bgColor: 'transparent', textAlign: 'left', isBold: false }),
    ],
  },
  {
    id: 'cof-prod-flagship',
    category: 'product',
    sort: 1,
    tier: 'free',
    niche: 'coffee',
    nameEn: 'Coffee Flagship Product Card',
    nameAr: 'بطاقة منتج قهوة رائد',
    width: 1080,
    height: 1080,
    backdropId: 'soft-ivory',
    productPosPct: { x: 0.5, y: 0.4, scale: 62 },
    previewGradient: 'linear-gradient(150deg,#faf8f5,#e8dcc8)',
    elements: [
      el({ type: 'badge', textEn: 'BEST SELLER', textAr: 'الأكثر مبيعاً', xPct: 0.5, yPct: 0.07, fontSize: 16, fontColor: '#2a170e', bgColor: '#e8c9a0', badgeStyle: 'gold_glow' }),
      el({ type: 'headline', bind: 'product', textEn: 'Featured Product', textAr: 'المنتج المميز', xPct: 0.5, yPct: 0.78, fontSize: 30, fontColor: '#1c1410', bgColor: 'transparent', fontFamily: 'Outfit' }),
      el({ type: 'price', bind: 'price', textEn: '', textAr: '', xPct: 0.5, yPct: 0.9, fontSize: 28, fontColor: '#faf6f0', bgColor: '#3d2314' }),
    ],
  },
  {
    id: 'cof-prod-beans',
    category: 'product',
    sort: 2,
    tier: 'free',
    niche: 'coffee',
    nameEn: 'Specialty Beans Product',
    nameAr: 'منتج بن مختص',
    width: 1080,
    height: 1080,
    backdropId: 'coffee-cream',
    productPosPct: { x: 0.5, y: 0.4, scale: 58 },
    previewGradient: 'linear-gradient(150deg,#f3e6d4,#c4a574)',
    elements: [
      el({ type: 'badge', bind: 'category', textEn: 'Category', textAr: 'التصنيف', xPct: 0.12, yPct: 0.08, fontSize: 15, fontColor: '#fff', bgColor: '#059669', textAlign: 'left' }),
      el({ type: 'headline', bind: 'product', textEn: 'Specialty Roast', textAr: 'تحميص مختص', xPct: 0.5, yPct: 0.78, fontSize: 30, fontColor: '#2a170e', bgColor: 'transparent' }),
      el({ type: 'price', bind: 'price', textEn: '', textAr: '', xPct: 0.5, yPct: 0.9, fontSize: 24, fontColor: '#5c3a22', bgColor: 'transparent', isBold: true }),
    ],
  },
  {
    id: 'cof-ads-meta',
    category: 'ads',
    sort: 1,
    tier: 'free',
    niche: 'coffee',
    nameEn: 'Coffee Meta Conversion Ad',
    nameAr: 'إعلان قهوة ميتا للتحويل',
    width: 1200,
    height: 628,
    backdropId: 'espresso-lux',
    productPosPct: { x: 0.78, y: 0.5, scale: 52 },
    previewGradient: 'linear-gradient(100deg,#2a170e,#8b5a2b)',
    elements: [
      el({ type: 'badge', textEn: 'LIMITED STOCK', textAr: 'كمية محدودة', xPct: 0.08, yPct: 0.2, fontSize: 15, fontColor: '#2a170e', bgColor: '#e8c9a0', textAlign: 'left' }),
      el({ type: 'headline', bind: 'product', textEn: 'Cafe Quality at Home', textAr: 'جودة المقهى في منزلك', xPct: 0.08, yPct: 0.44, fontSize: 34, fontColor: '#faf6f0', bgColor: 'transparent', textAlign: 'left', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'Fast delivery across KSA', textAr: 'توصيل سريع في أنحاء المملكة', xPct: 0.08, yPct: 0.62, fontSize: 17, fontColor: '#f5e6d3', bgColor: 'transparent', textAlign: 'left', isBold: false }),
      el({ type: 'badge', textEn: 'ORDER NOW', textAr: 'اطلب الآن', xPct: 0.08, yPct: 0.8, fontSize: 17, fontColor: '#2a170e', bgColor: '#f5e6d3', textAlign: 'left' }),
    ],
  },
  {
    id: 'cof-logo-roastery',
    category: 'logo',
    sort: 1,
    tier: 'free',
    niche: 'coffee',
    nameEn: 'Artisan Roastery Seal',
    nameAr: 'ختم محمصة حرفية',
    width: 800,
    height: 800,
    backdropId: 'coffee-cream',
    productPosPct: { x: 0.5, y: 0.5, scale: 0 },
    previewGradient: 'radial-gradient(circle,#f7f1e8,#d4b896)',
    elements: [
      el({ type: 'shape', shapeType: 'circle', xPct: 0.5, yPct: 0.5, widthPct: 0.72, heightPct: 0.72, bgColor: 'transparent', strokeColor: '#3d2314', strokeWidth: 3 }),
      el({ type: 'icon', icon: 'coffee', xPct: 0.5, yPct: 0.34, fontSize: 42, fontColor: '#3d2314' }),
      el({ type: 'headline', bind: 'store', textEn: 'ROASTERY', textAr: 'المحمصة', xPct: 0.5, yPct: 0.52, fontSize: 32, fontColor: '#2a170e', bgColor: 'transparent', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'SPECIALTY · KSA', textAr: 'مختصة · المملكة', xPct: 0.5, yPct: 0.64, fontSize: 15, fontColor: '#5c3a22', bgColor: 'transparent', isBold: false }),
    ],
  },
  {
    id: 'cof-cat-beans',
    category: 'category',
    sort: 1,
    tier: 'free',
    niche: 'coffee',
    nameEn: 'Coffee Beans Category Cover',
    nameAr: 'غلاف تصنيف بن القهوة',
    width: 1200,
    height: 800,
    backdropId: 'coffee-cream',
    productPosPct: { x: 0.76, y: 0.52, scale: 46 },
    previewGradient: 'linear-gradient(120deg,#f7f1e8,#c4a574)',
    elements: [
      el({ type: 'headline', bind: 'category', textEn: 'Specialty Beans', textAr: 'بن مختص', xPct: 0.08, yPct: 0.4, fontSize: 44, fontColor: '#2a170e', bgColor: 'transparent', textAlign: 'left', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'Single origin · Fresh roast', textAr: 'أصل واحد · تحميص طازج', xPct: 0.08, yPct: 0.58, fontSize: 20, fontColor: '#5c3a22', bgColor: 'transparent', textAlign: 'left', isBold: false }),
    ],
  },
  {
    id: 'cof-soc-gold-pro',
    category: 'social',
    sort: 6,
    tier: 'pro',
    niche: 'coffee',
    nameEn: 'Coffee Gold Vault Pro',
    nameAr: 'خزنة ذهب القهوة برو',
    width: 1080,
    height: 1080,
    backdropId: 'royal-gold',
    productPosPct: { x: 0.5, y: 0.4, scale: 54 },
    previewGradient: 'linear-gradient(150deg,#1c1917,#b45309)',
    elements: [
      el({ type: 'badge', textEn: 'LIMITED EDITION', textAr: 'إصدار محدود', xPct: 0.5, yPct: 0.08, fontSize: 16, fontColor: '#1c1917', bgColor: '#fbbf24', badgeStyle: 'gold_glow' }),
      el({ type: 'headline', bind: 'product', textEn: 'Collector Roast Box', textAr: 'صندوق تحميص للهواة', xPct: 0.5, yPct: 0.78, fontSize: 32, fontColor: '#fef3c7', bgColor: 'transparent', fontFamily: 'Outfit' }),
      el({ type: 'price', bind: 'price', textEn: '', textAr: '', xPct: 0.5, yPct: 0.9, fontSize: 26, fontColor: '#1c1917', bgColor: '#fbbf24' }),
    ],
  },
  {
    id: 'cof-ads-story-pro',
    category: 'ads',
    sort: 6,
    tier: 'pro',
    niche: 'coffee',
    nameEn: 'Coffee Story Ad Pro',
    nameAr: 'إعلان ستوري قهوة برو',
    width: 1080,
    height: 1920,
    backdropId: 'espresso-lux',
    productPosPct: { x: 0.5, y: 0.38, scale: 50 },
    previewGradient: 'linear-gradient(180deg,#2a170e,#8b5a2b)',
    elements: [
      el({ type: 'badge', textEn: 'TODAY ONLY', textAr: 'اليوم فقط', xPct: 0.5, yPct: 0.1, fontSize: 18, fontColor: '#2a170e', bgColor: '#e8c9a0' }),
      el({ type: 'headline', bind: 'product', textEn: 'Flash Brew Deal', textAr: 'عرض تحضير خاطف', xPct: 0.5, yPct: 0.74, fontSize: 40, fontColor: '#faf6f0', bgColor: 'transparent', fontFamily: 'Outfit' }),
      el({ type: 'price', bind: 'price', textEn: '', textAr: '', xPct: 0.5, yPct: 0.86, fontSize: 26, fontColor: '#f5e6d3', bgColor: 'transparent' }),
    ],
  },

  // ═══════════════════════════════════════════
  // FLOWERS
  // ═══════════════════════════════════════════
  {
    id: 'flo-soc-blush-lux',
    category: 'social',
    sort: 1,
    tier: 'free',
    niche: 'flowers',
    nameEn: 'Blush Bouquet Luxury Post',
    nameAr: 'منشور باقة ورد فاخرة',
    width: 1080,
    height: 1080,
    backdropId: 'floral-blush',
    productPosPct: { x: 0.5, y: 0.4, scale: 56 },
    previewGradient: 'linear-gradient(160deg,#fff5f7,#f9d5e0 50%,#9f1239)',
    elements: [
      el({ type: 'badge', bind: 'store', textEn: 'Store', textAr: 'المتجر', xPct: 0.5, yPct: 0.08, fontSize: 15, fontColor: '#fff', bgColor: '#9f1239', borderRadius: 22 }),
      el({ type: 'headline', bind: 'product', textEn: 'Fresh Luxury Bouquets', textAr: 'باقات فاخرة طازجة', xPct: 0.5, yPct: 0.76, fontSize: 34, fontColor: '#4c0519', bgColor: 'transparent', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'Hand-tied · Gift ready', textAr: 'تنسيق يدوي · جاهز للإهداء', xPct: 0.5, yPct: 0.86, fontSize: 18, fontColor: '#9f1239', bgColor: 'transparent', isBold: false }),
      el({ type: 'price', bind: 'price', textEn: '', textAr: '', xPct: 0.5, yPct: 0.94, fontSize: 22, fontColor: '#fff', bgColor: '#9f1239' }),
    ],
  },
  {
    id: 'flo-soc-story-rose',
    category: 'social',
    sort: 2,
    tier: 'free',
    niche: 'flowers',
    nameEn: 'Rose Story Soft Romance',
    nameAr: 'ستوري ورد رومانسية ناعمة',
    width: 1080,
    height: 1920,
    backdropId: 'petal-ivory',
    productPosPct: { x: 0.5, y: 0.38, scale: 52 },
    previewGradient: 'linear-gradient(180deg,#fffaf8,#fce7f3 45%,#be185d)',
    elements: [
      el({ type: 'badge', textEn: 'GIFT READY', textAr: 'جاهز للإهداء', xPct: 0.5, yPct: 0.1, fontSize: 17, fontColor: '#fff', bgColor: '#be185d' }),
      el({ type: 'headline', bind: 'product', textEn: 'Say It With Flowers', textAr: 'عبّر بالورد', xPct: 0.5, yPct: 0.72, fontSize: 40, fontColor: '#4c0519', bgColor: 'transparent', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'Roses · Orchids · Mixed luxury', textAr: 'ورود · أوركيد · تنسيقات فاخرة', xPct: 0.5, yPct: 0.8, fontSize: 19, fontColor: '#9f1239', bgColor: 'transparent', isBold: false }),
      el({ type: 'badge', textEn: 'ORDER VIA WHATSAPP', textAr: 'اطلب عبر واتساب', xPct: 0.5, yPct: 0.9, fontSize: 18, fontColor: '#fff', bgColor: '#059669', borderRadius: 28 }),
    ],
  },
  {
    id: 'flo-soc-sage-clean',
    category: 'social',
    sort: 3,
    tier: 'free',
    niche: 'flowers',
    nameEn: 'Sage Clean Floral Post',
    nameAr: 'منشور ورد أخضر هادئ',
    width: 1080,
    height: 1080,
    backdropId: 'sage-mist',
    productPosPct: { x: 0.5, y: 0.4, scale: 58 },
    previewGradient: 'linear-gradient(145deg,#f4f7f4,#c5d5c8)',
    elements: [
      el({ type: 'badge', textEn: 'NEW SEASON', textAr: 'موسم جديد', xPct: 0.12, yPct: 0.08, fontSize: 15, fontColor: '#fff', bgColor: '#3f6212', textAlign: 'left' }),
      el({ type: 'headline', bind: 'product', textEn: 'Garden Fresh Arrivals', textAr: 'وصلات الحديقة الطازجة', xPct: 0.5, yPct: 0.78, fontSize: 32, fontColor: '#1a2e1a', bgColor: 'transparent', fontFamily: 'Plus Jakarta Sans' }),
      el({ type: 'price', bind: 'price', textEn: '', textAr: '', xPct: 0.5, yPct: 0.9, fontSize: 26, fontColor: '#3f6212', bgColor: 'transparent' }),
    ],
  },
  {
    id: 'flo-ban-hero',
    category: 'banner',
    sort: 1,
    tier: 'free',
    niche: 'flowers',
    nameEn: 'Floral Store Hero Banner',
    nameAr: 'بنر بطولي لمتجر الزهور',
    width: 1600,
    height: 600,
    backdropId: 'floral-blush',
    productPosPct: { x: 0.78, y: 0.5, scale: 48 },
    previewGradient: 'linear-gradient(90deg,#fff5f7,#f9a8d4)',
    elements: [
      el({ type: 'badge', bind: 'store', textEn: 'Store', textAr: 'المتجر', xPct: 0.08, yPct: 0.22, fontSize: 16, fontColor: '#fff', bgColor: '#9f1239', textAlign: 'left' }),
      el({ type: 'headline', bind: 'product', textEn: 'Luxury Blooms Delivered', textAr: 'زهور فاخرة تصلك بسرعة', xPct: 0.08, yPct: 0.46, fontSize: 40, fontColor: '#4c0519', bgColor: 'transparent', textAlign: 'left', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'Same-day delivery · COD available', textAr: 'توصيل نفس اليوم · الدفع عند الاستلام', xPct: 0.08, yPct: 0.64, fontSize: 19, fontColor: '#9f1239', bgColor: 'transparent', textAlign: 'left', isBold: false }),
      el({ type: 'badge', textEn: 'SHOP BOUQUETS', textAr: 'تسوق الباقات', xPct: 0.08, yPct: 0.82, fontSize: 17, fontColor: '#fff', bgColor: '#be185d', textAlign: 'left', borderRadius: 24 }),
    ],
  },
  {
    id: 'flo-ban-eid',
    category: 'banner',
    sort: 2,
    tier: 'free',
    niche: 'flowers',
    nameEn: 'Occasion Gift Banner',
    nameAr: 'بنر هدايا المناسبات',
    width: 1600,
    height: 500,
    backdropId: 'petal-ivory',
    productPosPct: { x: 0.8, y: 0.5, scale: 46 },
    previewGradient: 'linear-gradient(90deg,#fffaf8,#fbcfe8)',
    elements: [
      el({ type: 'badge', textEn: 'WEDDING · BIRTHDAY · LOVE', textAr: 'زفاف · ميلاد · حب', xPct: 0.08, yPct: 0.24, fontSize: 15, fontColor: '#9f1239', bgColor: '#fce7f3', textAlign: 'left' }),
      el({ type: 'headline', bind: 'product', textEn: 'Perfect Gift Moments', textAr: 'لحظات إهداء مثالية', xPct: 0.08, yPct: 0.48, fontSize: 38, fontColor: '#4c0519', bgColor: 'transparent', textAlign: 'left', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'Chocolate & flower boxes available', textAr: 'صناديق ورد وشوكولاتة متوفرة', xPct: 0.08, yPct: 0.7, fontSize: 18, fontColor: '#9f1239', bgColor: 'transparent', textAlign: 'left', isBold: false }),
    ],
  },
  {
    id: 'flo-prod-bouquet',
    category: 'product',
    sort: 1,
    tier: 'free',
    niche: 'flowers',
    nameEn: 'Signature Bouquet Card',
    nameAr: 'بطاقة باقة التوقيع',
    width: 1080,
    height: 1080,
    backdropId: 'petal-ivory',
    productPosPct: { x: 0.5, y: 0.4, scale: 60 },
    previewGradient: 'linear-gradient(150deg,#fffaf8,#fce7f3)',
    elements: [
      el({ type: 'badge', textEn: 'SIGNATURE', textAr: 'التوقيع', xPct: 0.5, yPct: 0.07, fontSize: 16, fontColor: '#fff', bgColor: '#be185d' }),
      el({ type: 'headline', bind: 'product', textEn: 'Premium Rose Arrangement', textAr: 'تنسيق ورود فاخر', xPct: 0.5, yPct: 0.78, fontSize: 30, fontColor: '#4c0519', bgColor: 'transparent', fontFamily: 'Outfit' }),
      el({ type: 'price', bind: 'price', textEn: '', textAr: '', xPct: 0.5, yPct: 0.9, fontSize: 28, fontColor: '#fff', bgColor: '#9f1239' }),
    ],
  },
  {
    id: 'flo-prod-giftbox',
    category: 'product',
    sort: 2,
    tier: 'free',
    niche: 'flowers',
    nameEn: 'Gift Box Product Card',
    nameAr: 'بطاقة صندوق هدية',
    width: 1080,
    height: 1080,
    backdropId: 'sage-mist',
    productPosPct: { x: 0.5, y: 0.4, scale: 58 },
    previewGradient: 'linear-gradient(150deg,#f4f7f4,#d1e0d4)',
    elements: [
      el({ type: 'badge', bind: 'category', textEn: 'Category', textAr: 'التصنيف', xPct: 0.12, yPct: 0.08, fontSize: 15, fontColor: '#fff', bgColor: '#3f6212', textAlign: 'left' }),
      el({ type: 'headline', bind: 'product', textEn: 'Flowers + Chocolate Duo', textAr: 'ثنائي ورد وشوكولاتة', xPct: 0.5, yPct: 0.78, fontSize: 30, fontColor: '#1a2e1a', bgColor: 'transparent' }),
      el({ type: 'price', bind: 'price', textEn: '', textAr: '', xPct: 0.5, yPct: 0.9, fontSize: 26, fontColor: '#3f6212', bgColor: 'transparent' }),
    ],
  },
  {
    id: 'flo-ads-meta',
    category: 'ads',
    sort: 1,
    tier: 'free',
    niche: 'flowers',
    nameEn: 'Floral Meta Conversion Ad',
    nameAr: 'إعلان زهور ميتا للتحويل',
    width: 1200,
    height: 628,
    backdropId: 'floral-blush',
    productPosPct: { x: 0.78, y: 0.5, scale: 50 },
    previewGradient: 'linear-gradient(100deg,#fff5f7,#f472b6)',
    elements: [
      el({ type: 'badge', textEn: 'SAME DAY', textAr: 'نفس اليوم', xPct: 0.08, yPct: 0.2, fontSize: 15, fontColor: '#fff', bgColor: '#9f1239', textAlign: 'left' }),
      el({ type: 'headline', bind: 'product', textEn: 'Surprise Someone Today', textAr: 'فاجئ من تحب اليوم', xPct: 0.08, yPct: 0.44, fontSize: 34, fontColor: '#4c0519', bgColor: 'transparent', textAlign: 'left', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'Fresh blooms · Gift wrap included', textAr: 'زهور طازجة · تغليف هدية مجاني', xPct: 0.08, yPct: 0.62, fontSize: 17, fontColor: '#9f1239', bgColor: 'transparent', textAlign: 'left', isBold: false }),
      el({ type: 'badge', textEn: 'SEND FLOWERS', textAr: 'أرسل الزهور', xPct: 0.08, yPct: 0.8, fontSize: 17, fontColor: '#fff', bgColor: '#be185d', textAlign: 'left' }),
    ],
  },
  {
    id: 'flo-logo-bloom',
    category: 'logo',
    sort: 1,
    tier: 'free',
    niche: 'flowers',
    nameEn: 'Bloom Seal Logo',
    nameAr: 'شعار ختم الزهرة',
    width: 800,
    height: 800,
    backdropId: 'petal-ivory',
    productPosPct: { x: 0.5, y: 0.5, scale: 0 },
    previewGradient: 'radial-gradient(circle,#fffaf8,#fbcfe8)',
    elements: [
      el({ type: 'shape', shapeType: 'circle', xPct: 0.5, yPct: 0.5, widthPct: 0.72, heightPct: 0.72, bgColor: 'transparent', strokeColor: '#be185d', strokeWidth: 3 }),
      el({ type: 'icon', icon: 'heart', xPct: 0.5, yPct: 0.34, fontSize: 40, fontColor: '#be185d' }),
      el({ type: 'headline', bind: 'store', textEn: 'BLOOMS', textAr: 'زهور', xPct: 0.5, yPct: 0.52, fontSize: 34, fontColor: '#4c0519', bgColor: 'transparent', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'LUXURY GIFTS · KSA', textAr: 'هدايا فاخرة · المملكة', xPct: 0.5, yPct: 0.64, fontSize: 14, fontColor: '#9f1239', bgColor: 'transparent', isBold: false }),
    ],
  },
  {
    id: 'flo-cat-roses',
    category: 'category',
    sort: 1,
    tier: 'free',
    niche: 'flowers',
    nameEn: 'Roses Category Cover',
    nameAr: 'غلاف تصنيف الورود',
    width: 1200,
    height: 800,
    backdropId: 'floral-blush',
    productPosPct: { x: 0.76, y: 0.52, scale: 46 },
    previewGradient: 'linear-gradient(120deg,#fff5f7,#f9a8d4)',
    elements: [
      el({ type: 'headline', bind: 'category', textEn: 'Roses Collection', textAr: 'مجموعة الورود', xPct: 0.08, yPct: 0.4, fontSize: 44, fontColor: '#4c0519', bgColor: 'transparent', textAlign: 'left', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'Red · Pink · White · Mixed', textAr: 'أحمر · وردي · أبيض · مشكل', xPct: 0.08, yPct: 0.58, fontSize: 20, fontColor: '#9f1239', bgColor: 'transparent', textAlign: 'left', isBold: false }),
    ],
  },
  {
    id: 'flo-soc-velvet-pro',
    category: 'social',
    sort: 6,
    tier: 'pro',
    niche: 'flowers',
    nameEn: 'Velvet Rose Pro Post',
    nameAr: 'منشور ورد مخملي برو',
    width: 1080,
    height: 1080,
    backdropId: 'velvet-rose',
    productPosPct: { x: 0.5, y: 0.4, scale: 54 },
    previewGradient: 'linear-gradient(150deg,#4c0519,#e11d48)',
    elements: [
      el({ type: 'badge', textEn: 'VIP ONLY', textAr: 'حصري لكبار العملاء', xPct: 0.5, yPct: 0.08, fontSize: 16, fontColor: '#4c0519', bgColor: '#fecdd3' }),
      el({ type: 'headline', bind: 'product', textEn: 'Velvet Night Bouquet', textAr: 'باقة ليل مخملي', xPct: 0.5, yPct: 0.78, fontSize: 32, fontColor: '#fff', bgColor: 'transparent', fontFamily: 'Outfit' }),
      el({ type: 'price', bind: 'price', textEn: '', textAr: '', xPct: 0.5, yPct: 0.9, fontSize: 26, fontColor: '#4c0519', bgColor: '#fecdd3' }),
    ],
  },
  {
    id: 'flo-ads-story-pro',
    category: 'ads',
    sort: 6,
    tier: 'pro',
    niche: 'flowers',
    nameEn: 'Floral Story Ad Pro',
    nameAr: 'إعلان ستوري زهور برو',
    width: 1080,
    height: 1920,
    backdropId: 'floral-blush',
    productPosPct: { x: 0.5, y: 0.38, scale: 50 },
    previewGradient: 'linear-gradient(180deg,#fff5f7,#be185d)',
    elements: [
      el({ type: 'badge', textEn: 'FLASH GIFT', textAr: 'هدية خاطفة', xPct: 0.5, yPct: 0.1, fontSize: 18, fontColor: '#fff', bgColor: '#9f1239' }),
      el({ type: 'headline', bind: 'product', textEn: 'Deliver Love in Hours', textAr: 'أوصل الحب خلال ساعات', xPct: 0.5, yPct: 0.74, fontSize: 38, fontColor: '#4c0519', bgColor: 'transparent', fontFamily: 'Outfit' }),
      el({ type: 'price', bind: 'price', textEn: '', textAr: '', xPct: 0.5, yPct: 0.86, fontSize: 22, fontColor: '#9f1239', bgColor: 'transparent' }),
    ],
  },

  // ═══════════════════════════════════════════
  // GENERAL
  // ═══════════════════════════════════════════
  {
    id: 'gen-soc-clean-square',
    category: 'social',
    sort: 1,
    tier: 'free',
    niche: 'general',
    nameEn: 'Clean Modern Shop Post',
    nameAr: 'منشور متجر حديث نظيف',
    width: 1080,
    height: 1080,
    backdropId: 'pure-white',
    productPosPct: { x: 0.5, y: 0.4, scale: 58 },
    previewGradient: 'linear-gradient(145deg,#ffffff,#e2e8f0)',
    elements: [
      el({ type: 'badge', textEn: 'NEW', textAr: 'جديد', xPct: 0.1, yPct: 0.08, fontSize: 15, fontColor: '#fff', bgColor: '#0d9488', textAlign: 'left' }),
      el({ type: 'headline', bind: 'product', textEn: 'Shop New Arrivals', textAr: 'تسوق أحدث المنتجات', xPct: 0.5, yPct: 0.78, fontSize: 32, fontColor: '#0f172a', bgColor: 'transparent', fontFamily: 'Plus Jakarta Sans' }),
      el({ type: 'price', bind: 'price', textEn: '', textAr: '', xPct: 0.5, yPct: 0.9, fontSize: 26, fontColor: '#0d9488', bgColor: 'transparent' }),
    ],
  },
  {
    id: 'gen-soc-emerald',
    category: 'social',
    sort: 2,
    tier: 'free',
    niche: 'general',
    nameEn: 'Saudi Emerald Showcase',
    nameAr: 'عرض زمردي سعودي',
    width: 1080,
    height: 1080,
    backdropId: 'ksa-emerald',
    productPosPct: { x: 0.5, y: 0.4, scale: 56 },
    previewGradient: 'linear-gradient(150deg,#022c22,#059669)',
    elements: [
      el({ type: 'badge', bind: 'store', textEn: 'SAUDI MADE', textAr: 'صنع في السعودية', xPct: 0.5, yPct: 0.08, fontSize: 16, fontColor: '#022c22', bgColor: '#a7f3d0', badgeStyle: 'emerald_glow' }),
      el({ type: 'headline', bind: 'product', textEn: 'Proudly Local Quality', textAr: 'جودة محلية نفتخر بها', xPct: 0.5, yPct: 0.78, fontSize: 32, fontColor: '#fff', bgColor: 'transparent', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'Fast delivery · Major KSA cities', textAr: 'توصيل سريع · مدن المملكة الكبرى', xPct: 0.5, yPct: 0.9, fontSize: 17, fontColor: '#bbf7d0', bgColor: 'transparent', isBold: false }),
    ],
  },
  {
    id: 'gen-soc-story-sale',
    category: 'social',
    sort: 3,
    tier: 'free',
    niche: 'general',
    nameEn: 'Flash Sale Story',
    nameAr: 'ستوري تخفيضات خاطفة',
    width: 1080,
    height: 1920,
    backdropId: 'soft-ivory',
    productPosPct: { x: 0.5, y: 0.38, scale: 52 },
    previewGradient: 'linear-gradient(180deg,#faf7f2,#f59e0b)',
    elements: [
      el({ type: 'badge', textEn: 'TODAY ONLY', textAr: 'اليوم فقط', xPct: 0.5, yPct: 0.1, fontSize: 18, fontColor: '#fff', bgColor: '#ea580c' }),
      el({ type: 'headline', bind: 'product', textEn: 'Limited Offer', textAr: 'عرض محدود', xPct: 0.5, yPct: 0.74, fontSize: 42, fontColor: '#1c1917', bgColor: 'transparent', fontFamily: 'Outfit' }),
      el({ type: 'badge', textEn: 'SHOP SALE', textAr: 'تسوق التخفيضات', xPct: 0.5, yPct: 0.88, fontSize: 20, fontColor: '#fff', bgColor: '#0f172a', borderRadius: 28 }),
    ],
  },
  {
    id: 'gen-ban-hero',
    category: 'banner',
    sort: 1,
    tier: 'free',
    niche: 'general',
    nameEn: 'Clean Store Hero Banner',
    nameAr: 'بنر متجر بطولي نظيف',
    width: 1600,
    height: 600,
    backdropId: 'pure-white',
    productPosPct: { x: 0.78, y: 0.5, scale: 50 },
    previewGradient: 'linear-gradient(90deg,#ffffff,#e2e8f0)',
    elements: [
      el({ type: 'badge', textEn: 'FREE DELIVERY', textAr: 'شحن مجاني', xPct: 0.08, yPct: 0.22, fontSize: 15, fontColor: '#fff', bgColor: '#0d9488', textAlign: 'left' }),
      el({ type: 'headline', bind: 'store', textEn: 'Welcome to Our Store', textAr: 'أهلاً بكم في متجرنا', xPct: 0.08, yPct: 0.46, fontSize: 40, fontColor: '#0f172a', bgColor: 'transparent', textAlign: 'left', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'Quality products · Ship across KSA', textAr: 'منتجات عالية الجودة · شحن بالمملكة', xPct: 0.08, yPct: 0.64, fontSize: 19, fontColor: '#475569', bgColor: 'transparent', textAlign: 'left', isBold: false }),
      el({ type: 'badge', textEn: 'SHOP NOW', textAr: 'تسوق الآن', xPct: 0.08, yPct: 0.82, fontSize: 17, fontColor: '#fff', bgColor: '#0f172a', textAlign: 'left', borderRadius: 24 }),
    ],
  },
  {
    id: 'gen-ban-gold',
    category: 'banner',
    sort: 2,
    tier: 'free',
    niche: 'general',
    nameEn: 'Luxury Gold Banner',
    nameAr: 'بنر ذهبي فاخر',
    width: 1600,
    height: 600,
    backdropId: 'royal-gold',
    productPosPct: { x: 0.78, y: 0.5, scale: 48 },
    previewGradient: 'linear-gradient(90deg,#1c1917,#b45309)',
    elements: [
      el({ type: 'badge', textEn: 'LIMITED EDITION', textAr: 'إصدار محدود', xPct: 0.08, yPct: 0.22, fontSize: 15, fontColor: '#1c1917', bgColor: '#fbbf24', textAlign: 'left', badgeStyle: 'gold_glow' }),
      el({ type: 'headline', bind: 'product', textEn: 'Premium Collection', textAr: 'مجموعة فاخرة', xPct: 0.08, yPct: 0.46, fontSize: 42, fontColor: '#fef3c7', bgColor: 'transparent', textAlign: 'left', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'Crafted for Riyadh & beyond', textAr: 'مصمم للرياض وكافة مدن المملكة', xPct: 0.08, yPct: 0.64, fontSize: 19, fontColor: '#fff7ed', bgColor: 'transparent', textAlign: 'left', isBold: false }),
      el({ type: 'price', bind: 'price', textEn: '', textAr: '', xPct: 0.08, yPct: 0.82, fontSize: 22, fontColor: '#1c1917', bgColor: '#fbbf24', textAlign: 'left', borderRadius: 14 }),
    ],
  },
  {
    id: 'gen-prod-white',
    category: 'product',
    sort: 1,
    tier: 'free',
    niche: 'general',
    nameEn: 'Clean White Product',
    nameAr: 'منتج أبيض نظيف',
    width: 1080,
    height: 1080,
    backdropId: 'pure-white',
    productPosPct: { x: 0.5, y: 0.4, scale: 62 },
    previewGradient: 'linear-gradient(145deg,#ffffff,#f1f5f9)',
    elements: [
      el({ type: 'badge', textEn: 'BEST SELLER', textAr: 'الأكثر مبيعاً', xPct: 0.5, yPct: 0.07, fontSize: 15, fontColor: '#fff', bgColor: '#0f172a' }),
      el({ type: 'headline', bind: 'product', textEn: 'Product Title', textAr: 'اسم المنتج', xPct: 0.5, yPct: 0.78, fontSize: 30, fontColor: '#0f172a', bgColor: 'transparent', fontFamily: 'Plus Jakarta Sans' }),
      el({ type: 'price', bind: 'price', textEn: '', textAr: '', xPct: 0.5, yPct: 0.9, fontSize: 28, fontColor: '#059669', bgColor: 'transparent' }),
    ],
  },
  {
    id: 'gen-prod-emerald',
    category: 'product',
    sort: 2,
    tier: 'free',
    niche: 'general',
    nameEn: 'Emerald Product Card',
    nameAr: 'بطاقة منتج زمردي',
    width: 1080,
    height: 1080,
    backdropId: 'ksa-emerald',
    productPosPct: { x: 0.5, y: 0.4, scale: 58 },
    previewGradient: 'linear-gradient(150deg,#022c22,#059669)',
    elements: [
      el({ type: 'badge', textEn: 'TOP PICK', textAr: 'الأفضل', xPct: 0.5, yPct: 0.07, fontSize: 15, fontColor: '#022c22', bgColor: '#a7f3d0' }),
      el({ type: 'headline', bind: 'product', textEn: 'Featured Product', textAr: 'المنتج المميز', xPct: 0.5, yPct: 0.78, fontSize: 32, fontColor: '#fff', bgColor: 'transparent' }),
      el({ type: 'price', bind: 'price', textEn: '', textAr: '', xPct: 0.5, yPct: 0.9, fontSize: 26, fontColor: '#022c22', bgColor: '#a7f3d0' }),
    ],
  },
  {
    id: 'gen-ads-meta',
    category: 'ads',
    sort: 1,
    tier: 'free',
    niche: 'general',
    nameEn: 'Meta Conversion Ad Clean',
    nameAr: 'إعلان ميتا نظيف للتحويل',
    width: 1200,
    height: 628,
    backdropId: 'soft-ivory',
    productPosPct: { x: 0.78, y: 0.5, scale: 52 },
    previewGradient: 'linear-gradient(100deg,#faf7f2,#e2e8f0)',
    elements: [
      el({ type: 'badge', textEn: 'SPECIAL OFFER', textAr: 'عرض خاص', xPct: 0.08, yPct: 0.2, fontSize: 15, fontColor: '#fff', bgColor: '#0d9488', textAlign: 'left' }),
      el({ type: 'headline', bind: 'product', textEn: 'Limited Stock Deal', textAr: 'عرض كمية محدودة', xPct: 0.08, yPct: 0.44, fontSize: 34, fontColor: '#0f172a', bgColor: 'transparent', textAlign: 'left', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'Free return within 14 days', textAr: 'استرجاع مجاني خلال ١٤ يوماً', xPct: 0.08, yPct: 0.62, fontSize: 17, fontColor: '#475569', bgColor: 'transparent', textAlign: 'left', isBold: false }),
      el({ type: 'badge', textEn: 'CLAIM OFFER', textAr: 'احصل على العرض', xPct: 0.08, yPct: 0.8, fontSize: 17, fontColor: '#fff', bgColor: '#0f172a', textAlign: 'left' }),
    ],
  },
  {
    id: 'gen-ads-flash',
    category: 'ads',
    sort: 2,
    tier: 'free',
    niche: 'general',
    nameEn: 'Flash Sale Ad',
    nameAr: 'إعلان تخفيضات خاطفة',
    width: 1200,
    height: 628,
    backdropId: 'velvet-rose',
    productPosPct: { x: 0.78, y: 0.5, scale: 50 },
    previewGradient: 'linear-gradient(90deg,#4c0519,#e11d48)',
    elements: [
      el({ type: 'badge', textEn: 'FLASH SALE', textAr: 'تخفيض خاطف', xPct: 0.08, yPct: 0.22, fontSize: 17, fontColor: '#4c0519', bgColor: '#fecdd3', textAlign: 'left' }),
      el({ type: 'headline', bind: 'product', textEn: 'Weekend Mega Sale', textAr: 'تخفيضات نهاية الأسبوع', xPct: 0.08, yPct: 0.48, fontSize: 34, fontColor: '#fff', bgColor: 'transparent', textAlign: 'left' }),
      el({ type: 'badge', textEn: 'SHOP SALE', textAr: 'تسوق التخفيضات', xPct: 0.08, yPct: 0.78, fontSize: 17, fontColor: '#4c0519', bgColor: '#fde68a', textAlign: 'left' }),
    ],
  },
  {
    id: 'gen-logo-clean',
    category: 'logo',
    sort: 1,
    tier: 'free',
    niche: 'general',
    nameEn: 'Clean Typography Logo',
    nameAr: 'شعار خطي نظيف',
    width: 800,
    height: 800,
    backdropId: 'pure-white',
    productPosPct: { x: 0.5, y: 0.5, scale: 0 },
    previewGradient: 'linear-gradient(135deg,#ffffff,#f8fafc)',
    elements: [
      el({ type: 'headline', bind: 'store', textEn: 'YOUR BRAND', textAr: 'علامتك', xPct: 0.5, yPct: 0.46, fontSize: 40, fontColor: '#0f172a', bgColor: 'transparent', fontFamily: 'Outfit' }),
      el({ type: 'shape', shapeType: 'line', xPct: 0.5, yPct: 0.55, widthPct: 0.35, heightPct: 0.008, strokeColor: '#0d9488', strokeWidth: 3 }),
      el({ type: 'subtitle', textEn: 'SAUDI ARABIA', textAr: 'المملكة العربية السعودية', xPct: 0.5, yPct: 0.64, fontSize: 15, fontColor: '#475569', bgColor: 'transparent', isBold: false }),
    ],
  },
  {
    id: 'gen-logo-seal',
    category: 'logo',
    sort: 2,
    tier: 'free',
    niche: 'general',
    nameEn: 'Gold Seal Logo',
    nameAr: 'شعار ختم ذهبي',
    width: 800,
    height: 800,
    backdropId: 'soft-ivory',
    productPosPct: { x: 0.5, y: 0.5, scale: 0 },
    previewGradient: 'radial-gradient(circle,#faf7f2,#e8d5b7)',
    elements: [
      el({ type: 'shape', shapeType: 'circle', xPct: 0.5, yPct: 0.5, widthPct: 0.7, heightPct: 0.7, bgColor: 'transparent', strokeColor: '#b45309', strokeWidth: 3 }),
      el({ type: 'headline', bind: 'store', textEn: 'PREMIUM', textAr: 'فاخر', xPct: 0.5, yPct: 0.46, fontSize: 34, fontColor: '#1c1917', bgColor: 'transparent', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'EST. KSA', textAr: 'تأسس في المملكة', xPct: 0.5, yPct: 0.6, fontSize: 15, fontColor: '#78716c', bgColor: 'transparent', isBold: false }),
    ],
  },
  {
    id: 'gen-cat-cover',
    category: 'category',
    sort: 1,
    tier: 'free',
    niche: 'general',
    nameEn: 'Category Cover Clean',
    nameAr: 'غلاف تصنيف نظيف',
    width: 1200,
    height: 800,
    backdropId: 'pure-white',
    productPosPct: { x: 0.76, y: 0.52, scale: 46 },
    previewGradient: 'linear-gradient(120deg,#ffffff,#e2e8f0)',
    elements: [
      el({ type: 'headline', bind: 'category', textEn: 'Category Name', textAr: 'اسم التصنيف', xPct: 0.08, yPct: 0.4, fontSize: 42, fontColor: '#0f172a', bgColor: 'transparent', textAlign: 'left', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'Shop the collection', textAr: 'تسوق المجموعة', xPct: 0.08, yPct: 0.58, fontSize: 20, fontColor: '#475569', bgColor: 'transparent', textAlign: 'left', isBold: false }),
    ],
  },
  {
    id: 'gen-cat-emerald',
    category: 'category',
    sort: 2,
    tier: 'free',
    niche: 'general',
    nameEn: 'Emerald Category Cover',
    nameAr: 'غلاف تصنيف زمردي',
    width: 1200,
    height: 800,
    backdropId: 'ksa-emerald',
    productPosPct: { x: 0.76, y: 0.52, scale: 44 },
    previewGradient: 'linear-gradient(120deg,#022c22,#059669)',
    elements: [
      el({ type: 'headline', bind: 'category', textEn: 'Curated Picks', textAr: 'مختارات بعناية', xPct: 0.08, yPct: 0.4, fontSize: 42, fontColor: '#fff', bgColor: 'transparent', textAlign: 'left', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', textEn: 'Made for Saudi homes', textAr: 'مصمم للمنازل السعودية', xPct: 0.08, yPct: 0.58, fontSize: 19, fontColor: '#bbf7d0', bgColor: 'transparent', textAlign: 'left', isBold: false }),
    ],
  },
  {
    id: 'gen-soc-national-pro',
    category: 'social',
    sort: 6,
    tier: 'pro',
    niche: 'general',
    nameEn: 'National Day Post Pro',
    nameAr: 'منشور اليوم الوطني برو',
    width: 1080,
    height: 1080,
    backdropId: 'ksa-emerald',
    productPosPct: { x: 0.5, y: 0.4, scale: 54 },
    previewGradient: 'linear-gradient(150deg,#14532d,#22c55e)',
    elements: [
      el({ type: 'badge', textEn: 'SAUDI NATIONAL DAY', textAr: 'اليوم الوطني السعودي', xPct: 0.5, yPct: 0.08, fontSize: 15, fontColor: '#14532d', bgColor: '#fbbf24' }),
      el({ type: 'headline', bind: 'product', textEn: 'Green Celebrations', textAr: 'احتفالات خضراء', xPct: 0.5, yPct: 0.78, fontSize: 34, fontColor: '#fff', bgColor: 'transparent', fontFamily: 'Outfit' }),
      el({ type: 'subtitle', bind: 'store', textEn: 'Proudly delivered in KSA', textAr: 'بكل فخر نوصل في المملكة', xPct: 0.5, yPct: 0.9, fontSize: 17, fontColor: '#bbf7d0', bgColor: 'transparent', isBold: false }),
    ],
  },
  {
    id: 'gen-ads-retarget-pro',
    category: 'ads',
    sort: 6,
    tier: 'pro',
    niche: 'general',
    nameEn: 'Cart Reminder Ad Pro',
    nameAr: 'إعلان تذكير السلة برو',
    width: 1080,
    height: 1080,
    backdropId: 'soft-ivory',
    productPosPct: { x: 0.5, y: 0.4, scale: 56 },
    previewGradient: 'linear-gradient(145deg,#faf7f2,#e2e8f0)',
    elements: [
      el({ type: 'badge', textEn: 'STILL THINKING?', textAr: 'ما زلت تفكر؟', xPct: 0.5, yPct: 0.08, fontSize: 16, fontColor: '#0f172a', bgColor: '#fbbf24' }),
      el({ type: 'headline', bind: 'product', textEn: 'Complete Your Order', textAr: 'أكمل طلبك الآن', xPct: 0.5, yPct: 0.78, fontSize: 32, fontColor: '#0f172a', bgColor: 'transparent', fontFamily: 'Outfit' }),
      el({ type: 'price', bind: 'price', textEn: '', textAr: '', xPct: 0.5, yPct: 0.9, fontSize: 22, fontColor: '#fff', bgColor: '#059669' }),
    ],
  },
];

export function listCanvaTemplates(): CanvaDesignTemplate[] {
  return PACK.slice().sort((a, b) => {
    if (a.niche === 'blank' && b.niche !== 'blank') return -1;
    if (b.niche === 'blank' && a.niche !== 'blank') return 1;
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.sort - b.sort;
  });
}

export function listCanvaTemplatesByCategory(category: CanvaTemplateCategory): CanvaDesignTemplate[] {
  return listCanvaTemplates().filter((t) => t.category === category);
}

/**
 * Niche-first catalog: Blank + store niche + general.
 * Coffee store never sees flowers-first identity (and vice versa).
 */
export function listCanvaTemplatesForStore(
  store: { id?: string; slug?: string; name?: string; category?: string },
  category?: CanvaTemplateCategory | 'all',
): CanvaDesignTemplate[] {
  const niche = resolveStoreCanvaNiche(store);
  let list = listCanvaTemplates().filter(
    (t) => t.niche === 'blank' || t.niche === niche || t.niche === 'general',
  );
  if (category && category !== 'all') {
    list = list.filter((t) => t.category === category);
  }
  return list.sort((a, b) => {
    const rank = (n: CanvaTemplateNiche) =>
      n === 'blank' ? 0 : n === niche ? 1 : 2;
    const rd = rank(a.niche) - rank(b.niche);
    if (rd !== 0) return rd;
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.sort - b.sort;
  });
}

export function getCanvaTemplate(id: string): CanvaDesignTemplate | undefined {
  return PACK.find((t) => t.id === id);
}

export function getDefaultBlankTemplate(
  format: 'square' | 'story' | 'banner' = 'square',
): CanvaDesignTemplate {
  const id =
    format === 'story' ? 'blank-story' : format === 'banner' ? 'blank-banner' : 'blank-square';
  return getCanvaTemplate(id) || PACK[0];
}

/** First unlocked niche social template (or blank) for studio open. */
export function getDefaultNicheStarterTemplate(store: {
  id?: string;
  slug?: string;
  name?: string;
  category?: string;
}): CanvaDesignTemplate {
  const niche = resolveStoreCanvaNiche(store);
  const nicheSocial = listCanvaTemplates().find(
    (t) => t.niche === niche && t.category === 'social' && t.tier === 'free' && t.sort === 1,
  );
  return nicheSocial || getDefaultBlankTemplate('square');
}

/** Resolve layer label for preview / apply (no invented SAR numbers). */
export function resolveCanvaLayerLabel(
  layer: CanvaTemplateElement,
  opts: {
    isAr: boolean;
    storeName?: string;
    productName?: string;
    priceLabel?: string;
    categoryName?: string;
  },
): string {
  const fallback = (opts.isAr ? layer.textAr || layer.textEn : layer.textEn) || '';
  switch (layer.bind) {
    case 'store':
      return opts.storeName?.trim() || fallback;
    case 'product':
      return opts.productName?.trim() || fallback;
    case 'price':
      return opts.priceLabel?.trim() || '';
    case 'category':
      return opts.categoryName?.trim() || fallback;
    default:
      return fallback;
  }
}
