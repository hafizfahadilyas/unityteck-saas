import React, { useState } from 'react';
import {
  ShoppingBag,
  Sliders,
  Type,
  Layout,
  Palette,
  Sparkles,
  Plus,
  Trash2,
  Image as ImageIcon,
  Tag,
  Star,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
  Flame,
  Award,
  Gift,
  Clock,
  ShieldCheck,
  MessageSquare,
  HelpCircle,
  FolderTree,
  Boxes,
  Zap,
  Play,
  RotateCcw,
} from 'lucide-react';
import { MECCA_CATEGORIES_SEED } from '../../StoreCategories';
import { INITIAL_BRANDS, getStoreBrands, type BrandItem } from '../../StoreBrandsView';
import { EIGHT_FEATURED_CATEGORIES } from '../../../../themes/meccaGifts/data/mockData';
import {
  COFFEE_CIRCULAR_CATEGORIES,
} from '../../../../themes/meccaGifts/components/TopCircularCategories';
import {
  DEFAULT_FLOWER_SLIDES,
  DEFAULT_COFFEE_SLIDES,
  type HeroSlideItem,
} from '../../../../themes/meccaGifts/components/MotionHeroSlider';
import { useTenant } from '../../../../context/TenantContext';
import { InspectorImageUpload } from './InspectorImageUpload';

export interface UniversalSectionInspectorProps {
  block: {
    id: string;
    type: string;
    titleEn: string;
    titleAr: string;
    templateStyle: string;
    settings: Record<string, any>;
  };
  onUpdateSetting: (key: string, value: any) => void;
  onUpdateBulkSettings?: (settings: Record<string, any>) => void;
  activeTab: 'content' | 'templates' | 'styling' | 'layout' | 'code' | 'ai';
  setActiveTab: (tab: any) => void;
  isAr: boolean;
  selectedSubIndex?: number | null;
  selectedSubKey?: string | null;
  onSelectSubIndex?: (index: number | null) => void;
  onSelectSubKey?: (key: string | null) => void;
}

export const UniversalSectionInspector: React.FC<UniversalSectionInspectorProps> = ({
  block,
  onUpdateSetting,
  onUpdateBulkSettings,
  activeTab,
  setActiveTab,
  isAr,
  selectedSubIndex,
  selectedSubKey,
  onSelectSubIndex,
  onSelectSubKey,
}) => {
  const s = block.settings || {};
  const { activeStore, currentProducts } = useTenant();
  const isCoffee =
    activeStore?.id === 'store-coffee' ||
    (activeStore?.category && activeStore.category.includes('قهوة')) ||
    activeStore?.domain?.includes('coffee') ||
    block.titleEn?.toLowerCase().includes('coffee') ||
    Boolean(block.settings?.isCoffee);
  const [expandedItemIdx, setExpandedItemIdx] = useState<number | null>(0);

  // Sync expanded item when clicked from preview canvas
  React.useEffect(() => {
    if (selectedSubIndex !== null && selectedSubIndex !== undefined) {
      setExpandedItemIdx(selectedSubIndex);
    }
  }, [selectedSubIndex]);

  const isProductSection =
    block.type === 'dynamic_product_row' ||
    block.type === 'product_tabs' ||
    block.type === 'discounted_bouquets_3d' ||
    block.type === 'trending_this_week' ||
    block.type === 'best_sellers' ||
    block.type === 'sec_natural_roses' ||
    block.type === 'sec_chocolate_roses' ||
    block.type === 'sec_luxury_gifts' ||
    block.type === 'featured_machines' ||
    block.type === 'barista_tools' ||
    block.type === 'seat_covers' ||
    block.type === 'floor_mats' ||
    block.type.startsWith('product_section_');

  const isCircleCategories =
    block.type === 'circle_categories' ||
    block.type === 'category_grid' ||
    block.type === 'categories_grid' ||
    block.type === 'shop_by_category';

  const isHeroSlider = block.type === 'hero_slider' || block.type === 'hero';
  const isMarquee = block.type === 'marquee_banner' || block.type === 'announcement';
  const isFeatures = block.type === 'store_features_bar' || block.type === 'features';
  const isReviews = block.type === 'reviews';
  const isFaq = block.type === 'faq';
  const isFooter = block.type === 'footer' || block.id === 'footer';

  // Available Store Categories List (Dynamic for Flowers, Coffee, Cars, etc.)
  const availableCategories = React.useMemo(() => {
    const list = currentProducts || [];
    const catMap = new Map<string, { id: string; nameAr: string; nameEn: string; slug: string }>();

    // Seed presets
    MECCA_CATEGORIES_SEED.forEach((c) => {
      catMap.set(c.slug, {
        id: c.id,
        nameAr: c.nameAr || c.name,
        nameEn: c.name,
        slug: c.slug,
      });
    });

    // Real categories from active store's real catalog
    list.forEach((p) => {
      if (p.category) {
        const slug = (p as any).categorySlug || p.category.toLowerCase().replace(/\s+/g, '-');
        catMap.set(slug, {
          id: slug,
          nameAr: p.category,
          nameEn: p.categoryEn || p.category,
          slug,
        });
      }
    });

    return [
      { id: 'all', nameAr: 'كافة الأقسام (All Categories)', nameEn: 'All Categories', slug: 'all' },
      ...Array.from(catMap.values()),
    ];
  }, [currentProducts]);

  // Available Store Brands List (Strictly isolated per active store)
  const storeBrandsList = activeStore ? getStoreBrands(activeStore.id) : INITIAL_BRANDS;
  const availableBrands = [
    { id: 'all', nameAr: 'كافة العلامات التجارية (All Brands)', nameEn: 'All Brands' },
    ...storeBrandsList.map((b: BrandItem) => ({
      id: b.id,
      nameAr: b.name,
      nameEn: b.name,
    })),
  ];

  return (
    <div className="space-y-4">
      {/* ─── TAB 1: CONTENT ─────────────────────────────────── */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          
          {/* 1. PRODUCTS FILTERING & DATA SOURCE (For All Product Sections) */}
          {isProductSection && (
            <div className="border border-emerald-300 rounded-2xl p-3.5 bg-emerald-50/40 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="font-extrabold text-emerald-950 flex items-center gap-1.5 text-xs">
                  <ShoppingBag className="w-4 h-4 text-emerald-700" />
                  <span>{isAr ? 'مصدر وفلترة المنتجات' : 'Products Source & Filters'}</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {s.limit || 6} {isAr ? 'منتجات' : 'items'}
                </span>
              </div>

              {/* Category Filter Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <FolderTree className="w-3 h-3 text-emerald-700" />
                  <span>{isAr ? 'اختر القسم / التصنيف' : 'Filter by Category'}</span>
                </label>
                <select
                  value={s.categoryFilter || s.categorySlug || 'all'}
                  onChange={(e) => {
                    onUpdateSetting('categoryFilter', e.target.value);
                    onUpdateSetting('categorySlug', e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {isAr ? c.nameAr : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand Filter Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Award className="w-3 h-3 text-emerald-700" />
                  <span>{isAr ? 'اختر الماركة / البراند' : 'Filter by Brand'}</span>
                </label>
                <select
                  value={s.brandFilter || 'all'}
                  onChange={(e) => onUpdateSetting('brandFilter', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  {availableBrands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {isAr ? b.nameAr : b.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Special Tag & Collection Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-emerald-700" />
                  <span>{isAr ? 'فلتر المناسبات والوسوم الخاصة' : 'Filter by Tag / Collection'}</span>
                </label>
                <select
                  value={s.tagFilter || 'all'}
                  onChange={(e) => onUpdateSetting('tagFilter', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">{isAr ? 'جميع المنتجات (All Products)' : 'All Products'}</option>
                  <option value="trending">{isAr ? 'الأكثر رواجاً (Top Trending 🔥)' : 'Top Trending 🔥'}</option>
                  <option value="best_sellers">{isAr ? 'الأكثر مبيعاً (Best Sellers ⭐)' : 'Best Sellers ⭐'}</option>
                  <option value="best_products">{isAr ? 'أفضل المنتجات (Best Products 👑)' : 'Best Products 👑'}</option>
                  <option value="featured">{isAr ? 'منتجات مميزة (Featured ✨)' : 'Featured ✨'}</option>
                  <option value="women">{isAr ? 'هدايا نسائية (Women)' : 'Women Collection'}</option>
                  <option value="valentines">{isAr ? 'عيد الحب والرومانسية (Valentine)' : "Valentine's Day"}</option>
                  <option value="eid">{isAr ? 'الأعياد والاحتفالات (Eid)' : 'Eid Celebrations'}</option>
                  <option value="birthday">{isAr ? 'أعياد الميلاد (Birthday)' : 'Birthday Gifts'}</option>
                  <option value="luxury">{isAr ? 'تشكيلة فاخرة (Luxury VIP)' : 'Luxury VIP'}</option>
                </select>
              </div>

              {/* Count Limit, Columns & Sort */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    {isAr ? 'عدد المنتجات' : 'Limit Count'}
                  </label>
                  <select
                    value={s.limit || 6}
                    onChange={(e) => onUpdateSetting('limit', Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-bold"
                  >
                    {[2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 30].map((num) => (
                      <option key={num} value={num}>
                        {num} {isAr ? 'منتجات' : 'items'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    {isAr ? 'الأعمدة' : 'Columns'}
                  </label>
                  <select
                    value={s.columns || 4}
                    onChange={(e) => onUpdateSetting('columns', Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-bold"
                  >
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                    <option value={6}>6</option>
                    <option value={8}>8</option>
                    <option value={10}>10</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    {isAr ? 'الترتيب' : 'Sort By'}
                  </label>
                  <select
                    value={s.sortBy || 'default'}
                    onChange={(e) => onUpdateSetting('sortBy', e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-bold"
                  >
                    <option value="default">{isAr ? 'المميز' : 'Featured'}</option>
                    <option value="newest">{isAr ? 'الأحدث' : 'Newest'}</option>
                    <option value="price_low">{isAr ? 'السعر: أقل' : 'Price: Low'}</option>
                    <option value="price_high">{isAr ? 'السعر: أعلى' : 'Price: High'}</option>
                    <option value="bestsellers">{isAr ? 'الأكثر مبيعاً' : 'Best Sellers'}</option>
                    <option value="rating">{isAr ? 'الأعلى تقييماً' : 'Top Rated'}</option>
                  </select>
                </div>
              </div>

              {/* Layout Mode (Slider vs Grid vs Bento vs 3D) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  {isAr ? 'نمط العرض والتمرير' : 'Display Mode'}
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: 'slider', labelAr: 'سلايدر كاروسيل', labelEn: 'Carousel' },
                    { id: 'grid', labelAr: 'شبكة منتجات', labelEn: 'Grid' },
                    { id: 'bento', labelAr: 'بينتو تفاعلي', labelEn: 'Bento' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => onUpdateSetting('layout', mode.id)}
                      className={`py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        (s.layout || 'slider') === mode.id
                          ? 'bg-white text-emerald-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {isAr ? mode.labelAr : mode.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Image Display Mode (Reference 4:5 Full Image vs Square vs Tall) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center justify-between">
                  <span>{isAr ? 'نسبة عرض صور المنتجات' : 'Product Image Ratio'}</span>
                  <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                    {(s.imageAspectRatio || 'portrait') === 'portrait'
                      ? (isAr ? 'صورة كاملة (Reference 4:5)' : 'Full Image (4:5)')
                      : (s.imageAspectRatio || 'portrait')}
                  </span>
                </label>
                <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: 'portrait', labelAr: 'كاملة (4:5)', labelEn: 'Full 4:5' },
                    { id: 'square', labelAr: 'مربعة (1:1)', labelEn: 'Square' },
                    { id: 'tall', labelAr: 'طولية (3:4)', labelEn: 'Tall 3:4' },
                    { id: 'auto', labelAr: 'طبيعي', labelEn: 'Auto' },
                  ].map((ratio) => (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => onUpdateSetting('imageAspectRatio', ratio.id)}
                      className={`py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        (s.imageAspectRatio || 'portrait') === ratio.id
                          ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-emerald-500'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {isAr ? ratio.labelAr : ratio.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Badges & Elements Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={s.showPrices !== false}
                    onChange={(e) => onUpdateSetting('showPrices', e.target.checked)}
                    className="rounded text-emerald-600 accent-emerald-600"
                  />
                  <span>{isAr ? 'إظهار الأسعار' : 'Show Prices'}</span>
                </label>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={s.showTitle !== false}
                    onChange={(e) => onUpdateSetting('showTitle', e.target.checked)}
                    className="rounded text-emerald-600 accent-emerald-600"
                  />
                  <span>{isAr ? 'إظهار اسم المنتج' : 'Show Product Name'}</span>
                </label>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={s.showDiscountBadge !== false}
                    onChange={(e) => onUpdateSetting('showDiscountBadge', e.target.checked)}
                    className="rounded text-emerald-600 accent-emerald-600"
                  />
                  <span>{isAr ? 'شارة الخصم (%)' : 'Discount Badge'}</span>
                </label>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={s.showRating !== false}
                    onChange={(e) => onUpdateSetting('showRating', e.target.checked)}
                    className="rounded text-emerald-600 accent-emerald-600"
                  />
                  <span>{isAr ? 'النجوم والتقييم' : 'Star Ratings'}</span>
                </label>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={s.showAddToCart !== false}
                    onChange={(e) => onUpdateSetting('showAddToCart', e.target.checked)}
                    className="rounded text-emerald-600 accent-emerald-600"
                  />
                  <span>{isAr ? 'زر أضف للسلة' : 'Add to Cart Button'}</span>
                </label>
              </div>

              {/* Optional Section Banner Image */}
              <div className="pt-2 border-t border-emerald-200">
                <InspectorImageUpload
                  labelAr="بانر / خلفية ترويجية للقسم (اختياري)"
                  labelEn="Section Banner / Promo Image (Optional)"
                  value={s.bannerImage || ''}
                  onChange={(val) => onUpdateSetting('bannerImage', val)}
                  isAr={isAr}
                  aspectRatio="banner"
                  helpTextAr="بانر علوي اختياري يعرض خلفية أو شريط ترويجي أعلى المنتجات"
                  helpTextEn="Optional top banner or promo header above products"
                />
              </div>
            </div>
          )}

          {/* 2. CIRCULAR CATEGORIES / OCCASIONS ITEM-BY-ITEM EDITOR */}
          {isCircleCategories && (() => {
            const currentCategories = s.categories && s.categories.length > 0
              ? s.categories
              : isCoffee
              ? COFFEE_CIRCULAR_CATEGORIES
              : EIGHT_FEATURED_CATEGORIES;

            const handleUpdateCategory = (idx: number, patch: Record<string, any>) => {
              const next = [...currentCategories];
              next[idx] = { ...next[idx], ...patch };
              onUpdateSetting('categories', next);
            };

            const handleAddCategory = () => {
              const newIdx = currentCategories.length + 1;
              const newItem = {
                id: `cat-${Date.now()}`,
                name: isAr ? `تصنيف ${newIdx}` : `Category ${newIdx}`,
                nameEn: `Category ${newIdx}`,
                image: '/images/hadaya_saudi_luxury_bouquet_1791300211553.jpg',
                badge: isAr ? 'جديد' : 'New',
                link: '#catalog',
                count: 10,
              };
              const next = [...currentCategories, newItem];
              onUpdateSetting('categories', next);
              setExpandedItemIdx(next.length - 1);
            };

            const handleDeleteCategory = (idx: number) => {
              if (currentCategories.length <= 1) return;
              const next = currentCategories.filter((_: any, i: number) => i !== idx);
              onUpdateSetting('categories', next);
              if (expandedItemIdx === idx) {
                setExpandedItemIdx(0);
              }
            };

            return (
              <div className="border border-amber-300 rounded-2xl p-3.5 bg-amber-50/40 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <span className="font-extrabold text-amber-950 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                    <span>{isAr ? 'عناصر التصنيفات والتخصيص الفردي' : 'Categories Item-by-Item'}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                      {currentCategories.length} {isAr ? 'تصنيفات' : 'items'}
                    </span>
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-2 py-0.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer shadow-2xs transition-all hover:scale-105"
                      title={isAr ? 'إضافة تصنيف جديد' : 'Add New Category'}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAr ? 'إضافة' : 'Add'}</span>
                    </button>
                  </div>
                </div>

                {/* Grid Columns layout selector (e.g. 5 categories = 5 columns!) */}
                <div className="grid grid-cols-2 gap-2 bg-amber-100/60 p-2 rounded-xl">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-950 mb-1">
                      {isAr ? 'عدد الأعمدة (Columns)' : 'Grid Columns'}
                    </label>
                    <select
                      value={s.columns || (currentCategories.length === 5 ? 5 : 4)}
                      onChange={(e) => onUpdateSetting('columns', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-amber-300 bg-white rounded-lg text-xs font-bold text-slate-800"
                    >
                      <option value={2}>2 {isAr ? 'أعمدة' : 'Columns'}</option>
                      <option value={3}>3 {isAr ? 'أعمدة' : 'Columns'}</option>
                      <option value={4}>4 {isAr ? 'أعمدة' : 'Columns'}</option>
                      <option value={5}>5 {isAr ? 'أعمدة (5 Categories)' : '5 Columns'}</option>
                      <option value={6}>6 {isAr ? 'أعمدة' : 'Columns'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-950 mb-1">
                      {isAr ? 'سرعة الانتقال' : 'Hover Effect'}
                    </label>
                    <span className="text-[10px] font-medium text-amber-900 block pt-1">
                      {isAr ? '⚡ تفاعلي فائق السرعة' : '⚡ High-speed 3D'}
                    </span>
                  </div>
                </div>

                {/* Items Accordion */}
                <div className="space-y-2">
                  {currentCategories.map((item: any, idx: number) => {
                    const isExp = expandedItemIdx === idx;
                    return (
                      <div
                        key={item.id || `cat-item-${idx}`}
                        className={`border rounded-xl bg-white overflow-hidden shadow-2xs transition-all ${
                          isExp ? 'border-amber-400 ring-2 ring-amber-200' : 'border-slate-200'
                        }`}
                      >
                        <div className="w-full p-2.5 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50">
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedItemIdx(isExp ? null : idx);
                              onSelectSubIndex?.(idx);
                            }}
                            className="flex-1 flex items-center gap-2 text-start cursor-pointer"
                          >
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] flex items-center justify-center font-bold shrink-0">
                              {idx + 1}
                            </span>
                            {item.image && (
                              <img
                                src={item.image}
                                alt=""
                                className="w-6 h-6 rounded-md object-cover border border-slate-200 shrink-0"
                              />
                            )}
                            <span className="truncate max-w-[140px]">
                              {isAr ? item.name : item.nameEn || item.name}
                            </span>
                          </button>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {currentCategories.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCategory(idx);
                                }}
                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer transition-colors"
                                title={isAr ? 'حذف هذا التصنيف' : 'Delete Category'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedItemIdx(isExp ? null : idx);
                                onSelectSubIndex?.(idx);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {isExp && (
                          <div className="p-3 border-t border-slate-100 bg-slate-50/60 space-y-2.5 text-xs">
                            {/* Individual Image Upload for this Category */}
                            <InspectorImageUpload
                              labelAr={`صورة التصنيف (${idx + 1}) - تغيير فوري من جهازك`}
                              labelEn={`Category (${idx + 1}) Image - Upload from Computer`}
                              value={item.image || ''}
                              onChange={(val) => handleUpdateCategory(idx, { image: val })}
                              isAr={isAr}
                              aspectRatio="square"
                              helpTextAr="ارفع صورة عالية الدقة من جهازك أو اختر من النماذج الجاهزة أو ضع رابطاً"
                              helpTextEn="Upload image from computer, presets, or paste image URL"
                            />

                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                {isAr ? 'العنوان العربي للتصنيف' : 'Arabic Category Name'}
                              </label>
                              <input
                                type="text"
                                value={item.name || ''}
                                onChange={(e) => handleUpdateCategory(idx, { name: e.target.value })}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                {isAr ? 'العنوان الإنجليزي للتصنيف' : 'English Category Name'}
                              </label>
                              <input
                                type="text"
                                value={item.nameEn || ''}
                                onChange={(e) => handleUpdateCategory(idx, { nameEn: e.target.value })}
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                  {isAr ? 'نص الشارة (Badge)' : 'Badge Label'}
                                </label>
                                <input
                                  type="text"
                                  value={item.badge || ''}
                                  placeholder={isAr ? 'ألف مبروك / جديد' : 'New / Best'}
                                  onChange={(e) => handleUpdateCategory(idx, { badge: e.target.value })}
                                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                  {isAr ? 'رابط التوجيه (Link)' : 'Target Link'}
                                </label>
                                <input
                                  type="text"
                                  value={item.link || '#catalog'}
                                  onChange={(e) => handleUpdateCategory(idx, { link: e.target.value })}
                                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* 3. HERO SLIDER SLIDE-BY-SLIDE & SUB-ELEMENT CONTROLS */}
          {isHeroSlider && (() => {
            const currentHeroSlides: HeroSlideItem[] =
              s.slides && s.slides.length > 0
                ? s.slides
                : isCoffee
                ? DEFAULT_COFFEE_SLIDES
                : DEFAULT_FLOWER_SLIDES;

            const activeSlideIdx =
              selectedSubIndex !== null && selectedSubIndex !== undefined
                ? Math.min(Math.max(0, selectedSubIndex), currentHeroSlides.length - 1)
                : expandedItemIdx !== null && expandedItemIdx !== undefined
                ? Math.min(Math.max(0, expandedItemIdx), currentHeroSlides.length - 1)
                : 0;

            const activeSlide = currentHeroSlides[activeSlideIdx] || currentHeroSlides[0];

            const handleUpdateActiveSlide = (patch: Partial<HeroSlideItem>) => {
              const next = [...currentHeroSlides];
              next[activeSlideIdx] = { ...next[activeSlideIdx], ...patch };
              onUpdateSetting('slides', next);
            };

            const handleAddSlide = () => {
              const newNum = currentHeroSlides.length + 1;
              const newSlide: HeroSlideItem = {
                id: `slide-${Date.now()}`,
                title: isCoffee ? `Specialty Coffee Roast #${newNum}` : `Luxury Floral Collection #${newNum}`,
                titleAr: isCoffee ? `محصول قهوة فاخر #${newNum}` : `تشكيلة ملكية فاخرة #${newNum}`,
                subtitle: isCoffee ? 'Artisan single-origin beans roasted to perfection' : 'Imported fresh roses delivered chilled',
                subtitleAr: isCoffee ? 'محاصيل بن فاخرة طازجة التحميص لخبراء التذوق' : 'زهور طبيعية وهدايا فاخرة لكل مناسبة',
                primaryBtn: isCoffee ? 'Shop Beans' : 'Shop Now',
                primaryBtnAr: isCoffee ? 'تسوق المحاصيل' : 'تسوق الآن',
                primaryLink: '#catalog',
                secondaryBtn: 'Learn More',
                secondaryBtnAr: 'اعرف المزيد',
                secondaryLink: '#about',
                image: activeSlide?.image || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80',
                category: isCoffee ? 'حبوب القهوة المختصة' : 'باقات فاخرة',
              };
              const next = [...currentHeroSlides, newSlide];
              onUpdateSetting('slides', next);
              onSelectSubIndex?.(next.length - 1);
              setExpandedItemIdx(next.length - 1);
            };

            const handleDeleteSlide = (idx: number) => {
              if (currentHeroSlides.length <= 1) return;
              const next = currentHeroSlides.filter((_, i) => i !== idx);
              onUpdateSetting('slides', next);
              onSelectSubIndex?.(0);
              setExpandedItemIdx(0);
            };

            const activeSub = selectedSubKey || 'image';

            return (
              <div className="border border-indigo-300 rounded-2xl p-3.5 bg-indigo-50/40 space-y-3.5 shadow-2xs">
                {/* Header with Slide Counter and Add Button */}
                <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                  <span className="font-extrabold text-indigo-950 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4 text-indigo-700" />
                    <span>{isAr ? 'تخصيص شرائح السلايدر (3D Slides)' : 'Hero 3D Motion Slides'}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-300">
                      {currentHeroSlides.length} {isAr ? 'شرائح' : 'slides'}
                    </span>
                    <button
                      type="button"
                      onClick={handleAddSlide}
                      className="px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer shadow-2xs transition-all hover:scale-105"
                      title={isAr ? 'إضافة شريحة جديدة' : 'Add New Slide'}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAr ? 'إضافة' : 'Add'}</span>
                    </button>
                  </div>
                </div>

                {/* 1. Slide Selection Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {currentHeroSlides.map((slide, sIdx) => {
                    const isSlideActive = activeSlideIdx === sIdx;
                    return (
                      <div key={slide.id || sIdx} className="flex items-center">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSubIndex?.(sIdx);
                            setExpandedItemIdx(sIdx);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                            isSlideActive
                              ? 'bg-indigo-600 text-white shadow-xs font-black scale-105'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>{isAr ? `شريحة ${sIdx + 1}` : `Slide ${sIdx + 1}`}</span>
                          {slide.image && (
                            <img src={slide.image} alt="" className="w-4 h-4 rounded-full object-cover border border-white/50" />
                          )}
                        </button>
                        {currentHeroSlides.length > 1 && isSlideActive && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSlide(sIdx);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer ms-1 transition-colors"
                            title={isAr ? 'حذف الشريحة' : 'Delete Slide'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 2. Sub-element Tabs for the Active Slide */}
                <div className="grid grid-cols-4 gap-1 bg-indigo-100/70 p-1 rounded-xl">
                  {[
                    { id: 'image', labelAr: 'الصورة', labelEn: 'Image', icon: '📸' },
                    { id: 'title', labelAr: 'العنوان', labelEn: 'Title', icon: '✍️' },
                    { id: 'subtitle', labelAr: 'الوصف', labelEn: 'Subtitle', icon: '📝' },
                    { id: 'btn1', labelAr: 'الأزرار', labelEn: 'Buttons', icon: '🔘' },
                  ].map((tab) => {
                    const isTabActive = activeSub === tab.id || (tab.id === 'btn1' && activeSub === 'btn2');
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => onSelectSubKey?.(tab.id)}
                        className={`py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          isTabActive
                            ? 'bg-white text-indigo-900 shadow-2xs font-black'
                            : 'text-indigo-900/70 hover:text-indigo-950'
                        }`}
                      >
                        <span>{tab.icon}</span>
                        <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 3. Detailed Data Fields for Active Slide (With Live Pre-Filled Values) */}
                <div className="bg-white rounded-xl p-3 border border-indigo-100 space-y-3">
                  
                  {/* Photo / Image Editor */}
                  {(activeSub === 'image' || activeSub === 'slide') && (
                    <div className="space-y-2">
                      <InspectorImageUpload
                        labelAr={`صورة الشريحة (${activeSlideIdx + 1}) - رفع وتغيير مباشر`}
                        labelEn={`Slide (${activeSlideIdx + 1}) Image - Direct Upload`}
                        value={activeSlide.image || ''}
                        onChange={(val) => handleUpdateActiveSlide({ image: val })}
                        isAr={isAr}
                        aspectRatio="banner"
                        helpTextAr="ارفع صورة عالية الدقة من جهازك أو اختر من النماذج الجاهزة أو الصق رابطاً"
                        helpTextEn="Upload high-res slide image from computer or pick a preset"
                      />
                    </div>
                  )}

                  {/* Title & Headings Editor */}
                  {activeSub === 'title' && (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">
                          {isAr ? 'العنوان العربي (Arabic Title)' : 'Arabic Title'}
                        </label>
                        <input
                          type="text"
                          value={activeSlide.titleAr || ''}
                          onChange={(e) => handleUpdateActiveSlide({ titleAr: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">
                          {isAr ? 'العنوان الإنجليزي (English Title)' : 'English Title'}
                        </label>
                        <input
                          type="text"
                          value={activeSlide.title || ''}
                          onChange={(e) => handleUpdateActiveSlide({ title: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}

                  {/* Subtitle / Description Editor */}
                  {activeSub === 'subtitle' && (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">
                          {isAr ? 'الوصف التوضيحي (عربي)' : 'Arabic Subtitle'}
                        </label>
                        <textarea
                          rows={2}
                          value={activeSlide.subtitleAr || ''}
                          onChange={(e) => handleUpdateActiveSlide({ subtitleAr: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">
                          {isAr ? 'الوصف التوضيحي (إنجليزي)' : 'English Subtitle'}
                        </label>
                        <textarea
                          rows={2}
                          value={activeSlide.subtitle || ''}
                          onChange={(e) => handleUpdateActiveSlide({ subtitle: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Editor */}
                  {(activeSub === 'btn1' || activeSub === 'btn2') && (
                    <div className="space-y-3">
                      {/* Button 1 */}
                      <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 space-y-2">
                        <span className="text-[11px] font-extrabold text-indigo-900 block">
                          {isAr ? 'الزر الأول (Primary CTA)' : 'Primary Button'}
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">
                              {isAr ? 'النص (عربي)' : 'Label (AR)'}
                            </label>
                            <input
                              type="text"
                              value={activeSlide.primaryBtnAr || ''}
                              onChange={(e) => handleUpdateActiveSlide({ primaryBtnAr: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-300 rounded-lg bg-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">
                              {isAr ? 'النص (إنجليزي)' : 'Label (EN)'}
                            </label>
                            <input
                              type="text"
                              value={activeSlide.primaryBtn || ''}
                              onChange={(e) => handleUpdateActiveSlide({ primaryBtn: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-300 rounded-lg bg-white text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            {isAr ? 'رابط التوجيه' : 'Target Link URL'}
                          </label>
                          <input
                            type="text"
                            value={activeSlide.primaryLink || '#catalog'}
                            onChange={(e) => handleUpdateActiveSlide({ primaryLink: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Button 2 */}
                      <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 space-y-2">
                        <span className="text-[11px] font-extrabold text-slate-800 block">
                          {isAr ? 'الزر الثانوي (Secondary CTA)' : 'Secondary Button'}
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">
                              {isAr ? 'النص (عربي)' : 'Label (AR)'}
                            </label>
                            <input
                              type="text"
                              value={activeSlide.secondaryBtnAr || ''}
                              onChange={(e) => handleUpdateActiveSlide({ secondaryBtnAr: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-300 rounded-lg bg-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">
                              {isAr ? 'النص (إنجليزي)' : 'Label (EN)'}
                            </label>
                            <input
                              type="text"
                              value={activeSlide.secondaryBtn || ''}
                              onChange={(e) => handleUpdateActiveSlide({ secondaryBtn: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-300 rounded-lg bg-white text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            {isAr ? 'رابط التوجيه' : 'Target Link URL'}
                          </label>
                          <input
                            type="text"
                            value={activeSlide.secondaryLink || '#about'}
                            onChange={(e) => handleUpdateActiveSlide({ secondaryLink: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 3.1 FOOTER INSPECTOR: GRANULAR SUB-ELEMENT CONTROLS */}
          {isFooter && (
            <div className="border border-emerald-300 rounded-2xl p-3.5 bg-emerald-50/40 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="font-extrabold text-emerald-950 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>{isAr ? 'تخصيص تذييل المتجر (Footer Elements)' : 'Footer Elements & Legal'}</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  ZATCA & Payments
                </span>
              </div>

              {/* Sub-element selector tabs */}
              <div className="grid grid-cols-4 gap-1 bg-emerald-100/60 p-1 rounded-xl">
                {[
                  { id: 'brand', labelAr: 'الهوية والشعار', labelEn: 'Brand' },
                  { id: 'contacts', labelAr: 'الاتصال والضريبة', labelEn: 'Contacts' },
                  { id: 'social', labelAr: 'حسابات التواصل', labelEn: 'Social' },
                  { id: 'payments', labelAr: 'بوابات الدفع', labelEn: 'Payments' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectSubKey?.(item.id)}
                    className={`py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      (selectedSubKey || 'brand') === item.id
                        ? 'bg-white text-emerald-900 shadow-2xs font-extrabold'
                        : 'text-emerald-900/70 hover:text-emerald-950'
                    }`}
                  >
                    {isAr ? item.labelAr : item.labelEn}
                  </button>
                ))}
              </div>

              {/* Sub-element: Brand & Logo */}
              {(!selectedSubKey || selectedSubKey === 'brand') && (
                <div className="space-y-2.5">
                  <InspectorImageUpload
                    labelAr="شعار تذييل المتجر (Footer Logo)"
                    labelEn="Footer Logo Image"
                    value={s.logoUrl || ''}
                    onChange={(val) => onUpdateSetting('logoUrl', val)}
                    isAr={isAr}
                    aspectRatio="square"
                    helpTextAr="ارفع شعار المتجر من جهازك"
                    helpTextEn="Upload store logo from computer"
                  />
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'اسم المتجر (عربي)' : 'Store Name (AR)'}
                    </label>
                    <input
                      type="text"
                      value={s.storeNameAr || s.brandNameAr || ''}
                      onChange={(e) => onUpdateSetting('storeNameAr', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'اسم المتجر (إنجليزي)' : 'Store Name (EN)'}
                    </label>
                    <input
                      type="text"
                      value={s.storeNameEn || s.brandNameEn || ''}
                      onChange={(e) => onUpdateSetting('storeNameEn', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'وصف المتجر في التذييل (عربي)' : 'Footer Description (AR)'}
                    </label>
                    <textarea
                      rows={2}
                      value={s.storeDescAr || ''}
                      onChange={(e) => onUpdateSetting('storeDescAr', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Sub-element: Contacts & Legal / ZATCA */}
              {selectedSubKey === 'contacts' && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        {isAr ? 'رقم الواتساب' : 'WhatsApp Number'}
                      </label>
                      <input
                        type="text"
                        value={s.whatsappNumber || ''}
                        onChange={(e) => onUpdateSetting('whatsappNumber', e.target.value)}
                        placeholder="+966501234567"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        {isAr ? 'هاتف الدعم المباشر' : 'Support Phone'}
                      </label>
                      <input
                        type="text"
                        value={s.phoneNumber || ''}
                        onChange={(e) => onUpdateSetting('phoneNumber', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'البريد الإلكتروني للدعم' : 'Support Email'}
                    </label>
                    <input
                      type="email"
                      value={s.emailAddress || ''}
                      onChange={(e) => onUpdateSetting('emailAddress', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        {isAr ? 'الرقم الضريبي ZATCA (15 خانة)' : 'VAT Number (15 digits)'}
                      </label>
                      <input
                        type="text"
                        value={s.vatNumber || ''}
                        onChange={(e) => onUpdateSetting('vatNumber', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        {isAr ? 'السجل التجاري (CR)' : 'Commercial Registration'}
                      </label>
                      <input
                        type="text"
                        value={s.crNumber || ''}
                        onChange={(e) => onUpdateSetting('crNumber', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-element: Social Media */}
              {selectedSubKey === 'social' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Instagram URL
                    </label>
                    <input
                      type="text"
                      value={s.instagramUrl || ''}
                      onChange={(e) => onUpdateSetting('instagramUrl', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      X (Twitter) URL
                    </label>
                    <input
                      type="text"
                      value={s.twitterUrl || ''}
                      onChange={(e) => onUpdateSetting('twitterUrl', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      TikTok URL
                    </label>
                    <input
                      type="text"
                      value={s.tiktokUrl || ''}
                      onChange={(e) => onUpdateSetting('tiktokUrl', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Sub-element: Payments & Copyright */}
              {selectedSubKey === 'payments' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'نص حقوق الملكية (عربي)' : 'Copyright Text (AR)'}
                    </label>
                    <input
                      type="text"
                      value={s.copyrightAr || ''}
                      onChange={(e) => onUpdateSetting('copyrightAr', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'نص حقوق الملكية (إنجليزي)' : 'Copyright Text (EN)'}
                    </label>
                    <input
                      type="text"
                      value={s.copyrightEn || ''}
                      onChange={(e) => onUpdateSetting('copyrightEn', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. GENERAL SECTION HEADINGS, BUTTONS & MEDIA (Only for sections that use generic settings) */}
          {!isHeroSlider && !isCircleCategories && !isFooter && (
            <>
              {/* Titles & Headings */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-3">
                <span className="font-bold text-slate-800 block text-xs">
                  {isAr ? 'النصوص والعناوين الرئيسية للقسم' : 'Titles & Headings'}
                </span>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {isAr ? 'العنوان العربي (Arabic Title)' : 'Arabic Title'}
                  </label>
                  <input
                    type="text"
                    value={s.mainTitleAr || s.headingAr || s.titleAr || s.textAr || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateSetting('titleAr', val);
                      onUpdateSetting('mainTitleAr', val);
                      onUpdateSetting('headingAr', val);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {isAr ? 'العنوان الإنجليزي (English Title)' : 'English Title'}
                  </label>
                  <input
                    type="text"
                    value={s.mainTitleEn || s.headingEn || s.titleEn || s.textEn || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateSetting('titleEn', val);
                      onUpdateSetting('mainTitleEn', val);
                      onUpdateSetting('headingEn', val);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {isAr ? 'الوصف التوضيحي (عربي)' : 'Subtitle / Description (Arabic)'}
                  </label>
                  <textarea
                    rows={2}
                    value={s.subtitleAr || s.subheadingAr || ''}
                    onChange={(e) => onUpdateSetting('subtitleAr', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {isAr ? 'الوصف التوضيحي (إنجليزي)' : 'Subtitle / Description (English)'}
                  </label>
                  <textarea
                    rows={2}
                    value={s.subtitleEn || s.subheadingEn || ''}
                    onChange={(e) => onUpdateSetting('subtitleEn', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs resize-none"
                  />
                </div>
              </div>

              {/* 5. BUTTONS & CALL-TO-ACTION */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-3">
                <span className="font-bold text-slate-800 block text-xs">
                  {isAr ? 'الأزرار وروابط التوجيه' : 'Action Buttons & Links'}
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'نص الزر (عربي)' : 'Button Label (AR)'}
                    </label>
                    <input
                      type="text"
                      value={s.buttonTextAr || s.ctaTextAr || ''}
                      onChange={(e) => {
                        onUpdateSetting('buttonTextAr', e.target.value);
                        onUpdateSetting('ctaTextAr', e.target.value);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      {isAr ? 'نص الزر (إنجليزي)' : 'Button Label (EN)'}
                    </label>
                    <input
                      type="text"
                      value={s.buttonTextEn || s.ctaTextEn || ''}
                      onChange={(e) => {
                        onUpdateSetting('buttonTextEn', e.target.value);
                        onUpdateSetting('ctaTextEn', e.target.value);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    {isAr ? 'رابط التوجيه (URL)' : 'Target URL'}
                  </label>
                  <input
                    type="text"
                    value={s.buttonUrl || s.ctaLink || ''}
                    onChange={(e) => {
                      onUpdateSetting('buttonUrl', e.target.value);
                      onUpdateSetting('ctaLink', e.target.value);
                    }}
                    placeholder="#catalog or https://..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* 6. SECTION MEDIA & IMAGE UPLOAD (DIRECT COMPUTER / URL) */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-3">
                <span className="font-bold text-slate-800 block text-xs flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'صور ووسائط القسم المخصصة' : 'Section Media & Custom Images'}</span>
                </span>

                <InspectorImageUpload
                  labelAr="الصورة الرئيسية للقسم"
                  labelEn="Primary Section Image"
                  value={s.imageUrl || s.banner1Image || s.posterUrl || s.customImage || ''}
                  onChange={(val) => {
                    onUpdateSetting('imageUrl', val);
                    onUpdateSetting('banner1Image', val);
                    onUpdateSetting('posterUrl', val);
                    onUpdateSetting('customImage', val);
                  }}
                  isAr={isAr}
                  aspectRatio="banner"
                  helpTextAr="ارفع صورة عالية الدقة مباشرة من جهازك أو اختر من القوالب"
                  helpTextEn="Upload high-res image directly from your computer or pick a preset"
                />

                {(block.type === 'promo_banners_pair' || s.banner2Image !== undefined) && (
                  <InspectorImageUpload
                    labelAr="صورة البانر الثانوي"
                    labelEn="Secondary Banner Image"
                    value={s.banner2Image || ''}
                    onChange={(val) => onUpdateSetting('banner2Image', val)}
                    isAr={isAr}
                    aspectRatio="banner"
                    helpTextAr="ارفع صورة البانر الثاني من جهازك"
                    helpTextEn="Upload secondary banner image from computer"
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── TAB 3: STYLING ─────────────────────────────────── */}
      {activeTab === 'styling' && (
        <div className="space-y-4 text-xs">
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-3">
            <span className="font-bold text-slate-800 block text-xs">
              {isAr ? 'الألوان والخلفيات' : 'Colors & Backgrounds'}
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  {isAr ? 'لون الخلفية' : 'Background Color'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={s.bgColor || '#ffffff'}
                    onChange={(e) => onUpdateSetting('bgColor', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={s.bgColor || '#ffffff'}
                    onChange={(e) => onUpdateSetting('bgColor', e.target.value)}
                    className="flex-1 px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono uppercase bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  {isAr ? 'لون النصوص' : 'Text Color'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={s.textColor || '#102a1c'}
                    onChange={(e) => onUpdateSetting('textColor', e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={s.textColor || '#102a1c'}
                    onChange={(e) => onUpdateSetting('textColor', e.target.value)}
                    className="flex-1 px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono uppercase bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                {isAr ? 'اللون المميز (Accent Color)' : 'Accent Color'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={s.accentColor || '#e6ca98'}
                  onChange={(e) => onUpdateSetting('accentColor', e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={s.accentColor || '#e6ca98'}
                  onChange={(e) => onUpdateSetting('accentColor', e.target.value)}
                  className="flex-1 px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono uppercase bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section Background Image Control */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-3">
            <span className="font-bold text-slate-800 block text-xs flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isAr ? 'صورة خلفية القسم (Section Background Image)' : 'Section Background Image'}</span>
            </span>

            <InspectorImageUpload
              labelAr="خلفية القسم"
              labelEn="Background Image"
              value={s.bgImage || ''}
              onChange={(val) => onUpdateSetting('bgImage', val)}
              isAr={isAr}
              aspectRatio="banner"
              helpTextAr="ارفع صورة خلفية مخصصة للقسم أو اختر من القوالب الجاهزة"
              helpTextEn="Upload custom section background image or choose from presets"
            />

            {s.bgImage && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    {isAr ? 'حجم الخلفية' : 'Background Size'}
                  </label>
                  <select
                    value={s.bgSize || 'cover'}
                    onChange={(e) => onUpdateSetting('bgSize', e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-bold"
                  >
                    <option value="cover">{isAr ? 'تغطية كاملة (Cover)' : 'Cover'}</option>
                    <option value="contain">{isAr ? 'احتواء (Contain)' : 'Contain'}</option>
                    <option value="auto">{isAr ? 'تلقائي (Auto)' : 'Auto'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    {isAr ? 'موضع الخلفية' : 'Background Position'}
                  </label>
                  <select
                    value={s.bgPosition || 'center'}
                    onChange={(e) => onUpdateSetting('bgPosition', e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 bg-white rounded-lg text-xs font-bold"
                  >
                    <option value="center">{isAr ? 'وسط (Center)' : 'Center'}</option>
                    <option value="top">{isAr ? 'أعلى (Top)' : 'Top'}</option>
                    <option value="bottom">{isAr ? 'أسفل (Bottom)' : 'Bottom'}</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Card Style Presets */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-3">
            <span className="font-bold text-slate-800 block text-xs">
              {isAr ? 'أنماط بطاقات المنتجات' : 'Card Design Style'}
            </span>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'luxury_gold', labelAr: 'إطار ذهبي ملكي', labelEn: 'Royal Gold Border' },
                { id: 'emerald_glass', labelAr: 'زجاج زمردي فاخر', labelEn: 'Emerald Glass' },
                { id: 'minimal_white', labelAr: 'أبيض بسيط عصري', labelEn: 'Minimal Clean' },
                { id: 'velvet_shadow', labelAr: 'مخملي مع ظل ناعم', labelEn: 'Velvet Shadow' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onUpdateSetting('cardStyle', style.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-start transition-all cursor-pointer ${
                    (s.cardStyle || 'luxury_gold') === style.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-2xs font-extrabold'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {isAr ? style.labelAr : style.labelEn}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: LAYOUT ──────────────────────────────────── */}
      {activeTab === 'layout' && (
        <div className="space-y-4 text-xs">
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-3">
            <span className="font-bold text-slate-800 block text-xs">
              {isAr ? 'الهوامش والمسافات (Spacing & Padding)' : 'Margins & Padding'}
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  {isAr ? 'الهامش العلوي (Padding Top)' : 'Padding Top (px)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="160"
                  value={s.paddingTop ?? 40}
                  onChange={(e) => onUpdateSetting('paddingTop', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  {isAr ? 'الهامش السفلي (Padding Bottom)' : 'Padding Bottom (px)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="160"
                  value={s.paddingBottom ?? 40}
                  onChange={(e) => onUpdateSetting('paddingBottom', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={s.isFullWidth || s.contentWidth === 'full'}
                  onChange={(e) => {
                    onUpdateSetting('isFullWidth', e.target.checked);
                    onUpdateSetting('contentWidth', e.target.checked ? 'full' : 'boxed');
                  }}
                  className="rounded text-indigo-600 accent-indigo-600"
                />
                <span>{isAr ? 'عرض كامل للشاشة (Full Width 100%)' : 'Full Width Container (100%)'}</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
