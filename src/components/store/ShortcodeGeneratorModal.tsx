import React, { useState, useMemo } from 'react';
import {
  Code,
  Copy,
  Check,
  X,
  Sparkles,
  Layers,
  ShoppingBag,
  Sliders,
  CheckCircle2,
  Tag,
  Grid,
  List,
  Flame,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';
import {
  type ProductRowConfig,
  generateShortcode,
  DEFAULT_PRODUCT_ROWS,
} from '../../utils/productRowShortcodes';

interface ShortcodeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertShortcode?: (shortcode: string) => void;
}

export const ShortcodeGeneratorModal: React.FC<ShortcodeGeneratorModalProps> = ({
  isOpen,
  onClose,
  onInsertShortcode,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { currentProducts } = useTenant();
  const { toast } = useToast();

  const [filterType, setFilterType] = useState<ProductRowConfig['filterType']>('category');
  const [selectedCategory, setSelectedCategory] = useState('all-products');
  const [selectedBrand, setSelectedBrand] = useState('Store Brand');
  const [collectionType, setCollectionType] = useState<ProductRowConfig['collectionType']>('on_sale');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [limit, setLimit] = useState(6);
  const [columns, setColumns] = useState(4);
  const [layout, setLayout] = useState<ProductRowConfig['layout']>('slider');
  const [customTitle, setCustomTitle] = useState('');
  const [copied, setCopied] = useState(false);

  // General categories (no niche hardcoding — 100+ stores)
  const categories = useMemo(() => [
    { slug: 'all-products', nameAr: 'جميع المنتجات', nameEn: 'All Products' },
    { slug: 'featured', nameAr: 'منتجات مميزة', nameEn: 'Featured Products' },
    { slug: 'new-arrivals', nameAr: 'وصل حديثاً', nameEn: 'New Arrivals' },
    { slug: 'best-sellers', nameAr: 'الأكثر مبيعاً', nameEn: 'Best Sellers' },
    { slug: 'on-sale', nameAr: 'عروض وتخفيضات', nameEn: 'On Sale' },
  ], []);

  // General brand placeholders — merchant brands come from this store’s catalog
  const brands = useMemo(() => [
    { id: 'b1', name: 'Store Brand', nameAr: 'علامة المتجر' },
  ], []);

  const generatedShortcode = useMemo(() => {
    return generateShortcode({
      filterType,
      categorySlug: selectedCategory,
      categoryName: categories.find((c) => c.slug === selectedCategory)?.nameAr,
      brandName: selectedBrand,
      collectionType,
      selectedProductIds,
      limit,
      columns,
      layout,
      titleAr: customTitle || undefined,
    });
  }, [
    filterType,
    selectedCategory,
    selectedBrand,
    collectionType,
    selectedProductIds,
    limit,
    columns,
    layout,
    customTitle,
    categories,
  ]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedShortcode);
    setCopied(true);
    toast(isAr ? 'تم نسخ الشورت كود بنجاح!' : 'Shortcode copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (onInsertShortcode) {
      onInsertShortcode(generatedShortcode);
      toast(isAr ? 'تم إدراج الشورت كود في القسم' : 'Shortcode inserted successfully', 'success');
      onClose();
    } else {
      handleCopy();
    }
  };

  return (
    <GlobalModal
      isOpen={isOpen}
      onClose={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
      aria-label={isAr ? 'مولّد الأكواد القصيرة لصفوف المنتجات' : 'Product Row Shortcode Generator'}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono font-bold shadow-md">
              <Code className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white">
                {isAr ? 'مولّد الأكواد القصيرة لصفوف المنتجات' : 'Product Row Shortcode Generator'}
              </h3>
              <p className="text-[11px] text-slate-300">
                {isAr
                  ? 'أنشئ كوداً قصيراً لأي تصنيف أو علامة تجارية والصقه في أي قسم بمنشئ الصفحات'
                  : 'Generate shortcodes for any category/brand to paste anywhere in Page Builder'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Output Bar with 1-Click Copy */}
          <div className="p-4 rounded-2xl bg-slate-950 text-emerald-400 border border-slate-800 space-y-2 font-mono">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-bold">{isAr ? 'الكود القصير المولد:' : 'Generated Shortcode:'}</span>
              <span className="text-[10px] text-emerald-500">Live Auto-Generated</span>
            </div>
            <div className="flex items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
              <span className="text-xs sm:text-sm font-bold text-white break-all select-all">
                {generatedShortcode}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isAr ? 'تم النسخ' : 'Copied!') : (isAr ? 'نسخ الكود' : 'Copy')}</span>
              </button>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="space-y-4">
            {/* Filter Type Tabs */}
            <div>
              <label className="block text-xs font-black text-slate-900 mb-1.5">
                {isAr ? 'نوع مصدر المنتجات:' : 'Product Source Filter:'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'category', labelAr: 'حسب التصنيف', labelEn: 'By Category' },
                  { id: 'brand', labelAr: 'حسب البراند', labelEn: 'By Brand' },
                  { id: 'collection', labelAr: 'مجموعة جاهزة', labelEn: 'Collection' },
                  { id: 'specific_products', labelAr: 'منتجات محددة', labelEn: 'Specific Products' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterType(tab.id as any)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      filterType === tab.id
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isAr ? tab.labelAr : tab.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Specific Dropdowns */}
            {filterType === 'category' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-900">
                  {isAr ? 'اختر التصنيف المطلوب:' : 'Select Category:'}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {isAr ? `${cat.nameAr} (${cat.nameEn})` : `${cat.nameEn} (${cat.nameAr})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filterType === 'brand' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-900">
                  {isAr ? 'اختر البراند / العلامة التجارية:' : 'Select Brand:'}
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.name}>
                      {isAr ? `${b.nameAr} - ${b.name}` : `${b.name} (${b.nameAr})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filterType === 'collection' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-900">
                  {isAr ? 'نوع المجموعة:' : 'Collection Type:'}
                </label>
                <select
                  value={collectionType}
                  onChange={(e) => setCollectionType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="on_sale">{isAr ? 'عروض وتخفيضات خاصة' : 'On Sale & Discounts'}</option>
                  <option value="bestsellers">{isAr ? 'الأكثر مبيعاً' : 'Best Sellers'}</option>
                  <option value="new_arrivals">{isAr ? 'وصل حديثاً' : 'New Arrivals'}</option>
                  <option value="all">{isAr ? 'جميع المنتجات' : 'All Products'}</option>
                </select>
              </div>
            )}

            {filterType === 'specific_products' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-900">
                  {isAr ? 'اختر المنتجات المحددة:' : 'Select Specific Products:'}
                </label>
                <div className="max-h-40 overflow-y-auto p-2 rounded-xl border border-slate-200 space-y-1 bg-slate-50">
                  {currentProducts.slice(0, 20).map((p) => {
                    const isSelected = selectedProductIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer ${
                          isSelected ? 'bg-emerald-100 text-emerald-900 font-bold' : 'hover:bg-white text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds((prev) => [...prev, p.id]);
                            } else {
                              setSelectedProductIds((prev) => prev.filter((id) => id !== p.id));
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="truncate">{isAr ? p.nameAr || p.name : p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono ms-auto">{p.price} SAR</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Row Layout, Limit & Columns Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* Limit */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  {isAr ? 'عدد المنتجات:' : 'Products Limit:'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="2"
                    max="18"
                    step="2"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                    className="flex-1 accent-emerald-600"
                  />
                  <span className="w-8 py-1 rounded bg-slate-100 font-mono text-center font-bold text-xs">
                    {limit}
                  </span>
                </div>
              </div>

              {/* Layout Mode */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  {isAr ? 'طريقة العرض:' : 'Layout Mode:'}
                </label>
                <select
                  value={layout}
                  onChange={(e) => setLayout(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                >
                  <option value="slider">{isAr ? 'سلايدر متحرك' : 'Slider Carousel'}</option>
                  <option value="grid">{isAr ? 'شبكة مربعات' : 'Grid Layout'}</option>
                  <option value="3d_gallery">{isAr ? 'معرض ثلاثي الأبعاد' : '3D Gallery'}</option>
                </select>
              </div>

              {/* Columns */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  {isAr ? 'عدد الأعمدة في الصف:' : 'Columns Per Row:'}
                </label>
                <select
                  value={columns}
                  onChange={(e) => setColumns(parseInt(e.target.value, 10))}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                >
                  <option value={2}>2 {isAr ? 'أعمدة' : 'Columns'}</option>
                  <option value={3}>3 {isAr ? 'أعمدة' : 'Columns'}</option>
                  <option value={4}>4 {isAr ? 'أعمدة' : 'Columns'}</option>
                  <option value={6}>6 {isAr ? 'أعمدة' : 'Columns'}</option>
                </select>
              </div>
            </div>

            {/* Custom Title */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">
                {isAr ? 'عنوان الصف الاختياري:' : 'Custom Row Title (Optional):'}
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={isAr ? 'مثال: عروض خاصة لهذا الأسبوع' : 'e.g. This Week Special Offers'}
                className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Pre-made Shortcodes Library */}
          <div className="space-y-2 pt-3 border-t border-slate-200">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'أكواد جاهزة سريعة للتصنيفات الشائعة:' : 'Quick Ready-Made Shortcodes:'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEFAULT_PRODUCT_ROWS.map((row) => {
                const sc = generateShortcode(row);
                return (
                  <div
                    key={row.id}
                    onClick={() => {
                      navigator.clipboard.writeText(sc);
                      toast(isAr ? `تم نسخ كود:${row.titleAr}` : `Copied shortcode for ${row.titleEn}`, 'success');
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-600 bg-slate-50 hover:bg-emerald-50/50 transition-all cursor-pointer flex items-center justify-between gap-2 group"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {isAr ? row.titleAr : row.titleEn}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block truncate">{sc}</span>
                    </div>
                    <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{isAr ? 'نسخ فقط' : 'Copy Only'}</span>
            </button>
            <button
              type="button"
              onClick={handleInsert}
              className="px-5 py-2 rounded-xl text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isAr ? 'إدراج / نسخ الآن' : 'Insert / Copy Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </GlobalModal>
  );
};
