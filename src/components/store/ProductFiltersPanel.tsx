import React, { useState, useEffect } from 'react';
import {
  Filter,
  Plus,
  RotateCcw,
  Search,
  Bookmark,
  ChevronDown,
  X,
  Check,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';

export interface ProductFilterCriteria {
  channel: string;
  brand: string;
  search: string;
  productType: string;
  category: string;
  status: string;
}

export interface SavedFilterPreset {
  id: string;
  name: string;
  nameAr?: string;
  criteria: ProductFilterCriteria;
  badgeColor?: 'emerald' | 'purple' | 'rose' | 'sky' | 'indigo' | 'amber';
  isDefault?: boolean;
}

export interface ProductFiltersPanelProps {
  storeId: string;
  criteria: ProductFilterCriteria;
  onCriteriaChange: (updater: (prev: ProductFilterCriteria) => ProductFilterCriteria) => void;
  onApply: () => void;
  onClear: () => void;
  availableBrands: { id: string; name: string }[];
  availableCategories: string[];
  showHeader?: boolean;
  onNavigateBack?: () => void;
}

const DEFAULT_PRESETS: SavedFilterPreset[] = [
  {
    id: 'preset-active',
    name: 'Active Products',
    nameAr: 'المنتجات النشطة',
    criteria: {
      channel: 'All',
      brand: 'All',
      search: '',
      productType: 'All',
      category: 'All',
      status: 'Active',
    },
    badgeColor: 'emerald',
    isDefault: true,
  },
  {
    id: 'preset-luxury',
    name: 'Luxury Flowers',
    nameAr: 'زهور فاخرة',
    criteria: {
      channel: 'All',
      brand: 'All',
      search: '',
      productType: 'All',
      category: 'Luxury Flowers',
      status: 'All',
    },
    badgeColor: 'purple',
    isDefault: true,
  },
  {
    id: 'preset-out-stock',
    name: 'Out of Stock',
    nameAr: 'نفدت الكمية',
    criteria: {
      channel: 'All',
      brand: 'All',
      search: '',
      productType: 'All',
      category: 'All',
      status: 'Out of Stock',
    },
    badgeColor: 'rose',
    isDefault: true,
  },
  {
    id: 'preset-low-stock',
    name: 'Low Stock',
    nameAr: 'مخزون منخفض',
    criteria: {
      channel: 'All',
      brand: 'All',
      search: '',
      productType: 'All',
      category: 'All',
      status: 'Low Stock',
    },
    badgeColor: 'sky',
    isDefault: true,
  },
];

export const ProductFiltersPanel: React.FC<ProductFiltersPanelProps> = ({
  storeId,
  criteria,
  onCriteriaChange,
  onApply,
  onClear,
  availableBrands,
  availableCategories,
  showHeader = true,
  onNavigateBack,
}) => {
  const { locale, dir } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [savedPresets, setSavedPresets] = useState<SavedFilterPreset[]>(() => {
    try {
      const saved = localStorage.getItem(`unityteck_product_filters_${storeId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // ignore error
    }
    return [];
  });

  // Modals state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [isSavedFiltersListOpen, setIsSavedFiltersListOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterColor, setNewFilterColor] = useState<'indigo' | 'emerald' | 'purple' | 'amber'>('indigo');
  const [newCriteria, setNewCriteria] = useState<ProductFilterCriteria>({
    channel: 'All',
    brand: 'All',
    search: '',
    productType: 'All',
    category: 'All',
    status: 'All',
  });

  // Sync saved presets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`unityteck_product_filters_${storeId}`, JSON.stringify(savedPresets));
    } catch {
      // ignore
    }
  }, [savedPresets, storeId]);

  const handleApplyPreset = (preset: SavedFilterPreset) => {
    setActivePresetId(preset.id);
    onCriteriaChange(() => ({ ...preset.criteria }));
    onApply();
    toast(isAr ? `تم تطبيق فلتر "${preset.nameAr || preset.name}"` : `Applied "${preset.name}" filter`, 'success');
  };

  const handleClearAll = () => {
    setActivePresetId(null);
    onClear();
    toast(isAr ? 'تم إعادة ضبط جميع الفلاتر' : 'All filters cleared', 'info');
  };

  const handleSaveCurrentFilter = () => {
    if (!saveFilterName.trim()) {
      toast(isAr ? 'يرجى إدخال اسم للفلتر' : 'Please enter a filter name', 'warning');
      return;
    }
    const newPreset: SavedFilterPreset = {
      id: `custom-${Date.now()}`,
      name: saveFilterName.trim(),
      criteria: { ...criteria },
      badgeColor: 'indigo',
    };
    setSavedPresets((prev) => [...prev, newPreset]);
    setActivePresetId(newPreset.id);
    setSaveFilterName('');
    setIsSaveModalOpen(false);
    toast(isAr ? 'تم حفظ الفلتر في المفضلة' : 'Filter preset saved successfully', 'success');
  };

  const handleCreateNewFilter = () => {
    if (!newFilterName.trim()) {
      toast(isAr ? 'يرجى إدخال اسم للفلتر' : 'Please enter a filter name', 'warning');
      return;
    }
    const created: SavedFilterPreset = {
      id: `custom-${Date.now()}`,
      name: newFilterName.trim(),
      criteria: { ...newCriteria },
      badgeColor: newFilterColor,
    };
    setSavedPresets((prev) => [...prev, created]);
    setActivePresetId(created.id);
    onCriteriaChange(() => ({ ...newCriteria }));
    onApply();
    setIsCreateModalOpen(false);
    setNewFilterName('');
    toast(isAr ? 'تم إنشاء الفلتر وتطبيقه بنجاح' : 'New filter created and applied', 'success');
  };

  const handleDeleteSavedFilter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedPresets((prev) => prev.filter((p) => p.id !== id));
    if (activePresetId === id) setActivePresetId(null);
    toast(isAr ? 'تم حذف الفلتر المحفوظ' : 'Saved filter removed', 'info');
  };

  return (
    <div className="space-y-5" dir={dir}>
      {/* ── 1. Page Header (Breadcrumbs, Title & Top Action Buttons) ── */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Action Buttons (Left side in English, right in RTL) */}
          <div className="flex items-center gap-2.5 order-2 sm:order-1">
            <button
              type="button"
              onClick={() => {
                setNewCriteria({ ...criteria });
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span>{isAr ? 'إنشاء فلتر جديد' : 'Create New Filter'}</span>
              <Plus className="w-4 h-4 shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => setIsSavedFiltersListOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <span>{isAr ? 'الفلاتر المحفوظة' : 'Saved Filters'}</span>
              <Bookmark className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

          {/* Breadcrumb & Title (Right side in English, start in RTL) */}
          <div className="order-1 sm:order-2 text-start sm:text-end rtl:text-start">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1 justify-start sm:justify-end rtl:justify-start">
              {onNavigateBack ? (
                <button
                  type="button"
                  onClick={onNavigateBack}
                  className="hover:underline text-blue-600 dark:text-blue-400 font-bold cursor-pointer"
                >
                  {isAr ? 'المنتجات' : 'Products'}
                </button>
              ) : (
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {isAr ? 'المنتجات' : 'Products'}
                </span>
              )}
              <span>&gt;</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'الفلاتر' : 'Filters'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'الفلاتر' : 'Filters'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'قم بفلترة منتجاتك وحفظ الفلاتر للوصول السريع إليها.'
                : 'Filter your products and save filters for quick access.'}
            </p>
          </div>
        </div>
      )}

      {/* ── 2. The Main Filter Products Card ── */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-5">
        {/* Card Header */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          {/* Left Buttons: Apply Filters & Clear All */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onApply}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <span>{isAr ? 'تطبيق الفلاتر' : 'Apply Filters'}</span>
              <Filter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>{isAr ? 'مسح الكل' : 'Clear All'}</span>
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Right Info: Title, Subtitle & Funnel Circle Icon */}
          <div className="flex items-center gap-3 justify-between sm:justify-end">
            <div className="text-start sm:text-end rtl:text-start">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {isAr ? 'فلترة المنتجات' : 'Filter Products'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'استخدم الفلاتر أدناه للعثور على منتجات محددة في متجرك.'
                  : 'Use the filters below to find specific products in your store.'}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
              <Filter className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Filter Inputs Grid: 2 rows of 3 columns each (100% Matching Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {/* Row 1, Column 1: Product Channels */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 text-right">
              {isAr ? 'قنوات المنتج' : 'Product Channels'}
            </label>
            <div className="relative">
              <select
                value={criteria.channel}
                onChange={(e) => {
                  setActivePresetId(null);
                  onCriteriaChange((prev) => ({ ...prev, channel: e.target.value }));
                }}
                className="w-full appearance-none pl-9 pr-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer text-right rtl:text-right"
              >
                <option value="All">{isAr ? 'جميع القنوات' : 'All Channels'}</option>
                <option value="Online Store">{isAr ? 'المتجر الإلكتروني' : 'Online Store'}</option>
                <option value="POS">{isAr ? 'نقاط البيع (POS)' : 'Point of Sale (POS)'}</option>
                <option value="Instagram">{isAr ? 'إنستغرام' : 'Instagram Shopping'}</option>
                <option value="TikTok">{isAr ? 'تيك توك' : 'TikTok Shop'}</option>
                <option value="WhatsApp">{isAr ? 'واتساب' : 'WhatsApp Commerce'}</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Row 1, Column 2: Brand */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 text-right">
              {isAr ? 'العلامة التجارية' : 'Brand'}
            </label>
            <div className="relative">
              <select
                value={criteria.brand}
                onChange={(e) => {
                  setActivePresetId(null);
                  onCriteriaChange((prev) => ({ ...prev, brand: e.target.value }));
                }}
                className="w-full appearance-none pl-9 pr-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer text-right rtl:text-right"
              >
                <option value="All">{isAr ? 'جميع العلامات التجارية' : 'All Brands'}</option>
                {availableBrands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Row 1, Column 3: Search Products */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 text-right">
              {isAr ? 'البحث عن منتجات' : 'Search Products'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={criteria.search}
                onChange={(e) => {
                  setActivePresetId(null);
                  onCriteriaChange((prev) => ({ ...prev, search: e.target.value }));
                }}
                placeholder={isAr ? '...ابحث بالاسم، SKU أو الكلمات المفتاحية' : 'Search by product name, SKU, or keywords...'}
                className="w-full pl-3.5 pr-9 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors text-right rtl:text-right"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Row 2, Column 1: Product Type */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 text-right">
              {isAr ? 'نوع المنتج' : 'Product Type'}
            </label>
            <div className="relative">
              <select
                value={criteria.productType}
                onChange={(e) => {
                  setActivePresetId(null);
                  onCriteriaChange((prev) => ({ ...prev, productType: e.target.value }));
                }}
                className="w-full appearance-none pl-9 pr-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer text-right rtl:text-right"
              >
                <option value="All">{isAr ? 'جميع أنواع المنتجات' : 'All Product Types'}</option>
                <option value="Physical Product">{isAr ? 'منتج جاهز (مادي)' : 'Physical Product'}</option>
                <option value="Custom Service">{isAr ? 'خدمة مخصصة (تنسيق)' : 'Custom Service'}</option>
                <option value="Digital Product">{isAr ? 'منتج رقمي (قسيمة)' : 'Digital Product'}</option>
                <option value="Product Bundle">{isAr ? 'باقة مجمعة' : 'Product Bundle'}</option>
                <option value="Variable Product">{isAr ? 'منتج متعدد الخيارات' : 'Variable Product'}</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Row 2, Column 2: Category */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 text-right">
              {isAr ? 'القسم / الفئة' : 'Category'}
            </label>
            <div className="relative">
              <select
                value={criteria.category}
                onChange={(e) => {
                  setActivePresetId(null);
                  onCriteriaChange((prev) => ({ ...prev, category: e.target.value }));
                }}
                className="w-full appearance-none pl-9 pr-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer text-right rtl:text-right"
              >
                <option value="All">{isAr ? 'جميع الأقسام' : 'All Categories'}</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Row 2, Column 3: Product Status */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 text-right">
              {isAr ? 'حالة المنتج' : 'Product Status'}
            </label>
            <div className="relative">
              <select
                value={criteria.status}
                onChange={(e) => {
                  setActivePresetId(null);
                  onCriteriaChange((prev) => ({ ...prev, status: e.target.value }));
                }}
                className="w-full appearance-none pl-9 pr-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer text-right rtl:text-right"
              >
                <option value="All">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="Active">{isAr ? 'نشط' : 'Active'}</option>
                <option value="Out of Stock">{isAr ? 'نفدت الكمية' : 'Out of Stock'}</option>
                <option value="Low Stock">{isAr ? 'مخزون منخفض' : 'Low Stock'}</option>
                <option value="Draft">{isAr ? 'مسودة' : 'Draft'}</option>
                <option value="Archived">{isAr ? 'مؤرشف' : 'Archived'}</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Card Bottom: Save Current Filter + Preset Filter Chips + Saved Filters Bookmark */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Save Current Filter button + Filter Preset Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSaveModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-100/70 text-blue-700 dark:bg-blue-950/30 dark:border-blue-700 dark:text-blue-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>{isAr ? 'حفظ الفلتر الحالي +' : 'Save Current Filter +'}</span>
            </button>

            {/* Default Preset: Active Products */}
            <button
              type="button"
              onClick={() => handleApplyPreset(DEFAULT_PRESETS[0])}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activePresetId === DEFAULT_PRESETS[0].id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200/90 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              }`}
            >
              {isAr ? DEFAULT_PRESETS[0].nameAr : DEFAULT_PRESETS[0].name}
            </button>

            {/* Default Preset: Luxury Flowers */}
            <button
              type="button"
              onClick={() => handleApplyPreset(DEFAULT_PRESETS[1])}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activePresetId === DEFAULT_PRESETS[1].id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-700 border border-purple-200/90 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
              }`}
            >
              {isAr ? DEFAULT_PRESETS[1].nameAr : DEFAULT_PRESETS[1].name}
            </button>

            {/* Default Preset: Out of Stock */}
            <button
              type="button"
              onClick={() => handleApplyPreset(DEFAULT_PRESETS[2])}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activePresetId === DEFAULT_PRESETS[2].id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/90 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
              }`}
            >
              {isAr ? DEFAULT_PRESETS[2].nameAr : DEFAULT_PRESETS[2].name}
            </button>

            {/* Default Preset: Low Stock */}
            <button
              type="button"
              onClick={() => handleApplyPreset(DEFAULT_PRESETS[3])}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activePresetId === DEFAULT_PRESETS[3].id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50 text-sky-700 border border-sky-200/90 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800'
              }`}
            >
              {isAr ? DEFAULT_PRESETS[3].nameAr : DEFAULT_PRESETS[3].name}
            </button>

            {/* User Custom Saved Presets */}
            {savedPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activePresetId === preset.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200/90 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Right: Saved Filters with Bookmark Icon */}
          <button
            type="button"
            onClick={() => setIsSavedFiltersListOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            <span>{isAr ? 'الفلاتر المحفوظة' : 'Saved Filters'}</span>
            <Bookmark className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* ── 3. Modal: Save Current Filter ── */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {isAr ? 'حفظ الفلتر الحالي' : 'Save Current Filter'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'أدخل اسماً لهذا الفلتر لحفظ إعدادات البحث الحالية واستخدامها لاحقاً بنقرة واحدة.'
                : 'Enter a name for this filter to save your current search configuration and re-use it anytime.'}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'اسم الفلتر' : 'Filter Name'}
              </label>
              <input
                type="text"
                value={saveFilterName}
                onChange={(e) => setSaveFilterName(e.target.value)}
                placeholder={isAr ? 'مثال: منتجات الورود منخفضة المخزون' : 'e.g. VIP Bouquets Low Stock'}
                autoFocus
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-750 text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
              <span className="font-bold block text-slate-700 dark:text-slate-200">
                {isAr ? 'الإعدادات المحفوظة:' : 'Included Criteria:'}
              </span>
              <div>{isAr ? 'القناة:' : 'Channel:'} <span className="font-semibold text-slate-900 dark:text-white">{criteria.channel}</span></div>
              <div>{isAr ? 'العلامة التجارية:' : 'Brand:'} <span className="font-semibold text-slate-900 dark:text-white">{criteria.brand}</span></div>
              <div>{isAr ? 'القسم:' : 'Category:'} <span className="font-semibold text-slate-900 dark:text-white">{criteria.category}</span></div>
              <div>{isAr ? 'الحالة:' : 'Status:'} <span className="font-semibold text-slate-900 dark:text-white">{criteria.status}</span></div>
              {criteria.search && <div>{isAr ? 'البحث:' : 'Search:'} <span className="font-semibold text-slate-900 dark:text-white">"{criteria.search}"</span></div>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveCurrentFilter}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                {isAr ? 'حفظ الفلتر' : 'Save Filter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Modal: Saved Filters List ── */}
      {isSavedFiltersListOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {isAr ? 'إدارة الفلاتر المحفوظة' : 'Manage Saved Filters'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSavedFiltersListOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'انقر على أي فلتر لتطبيقه مباشرة على قائمة المنتجات، أو قم بإزالة الفلاتر التي لم تعد بحاجة إليها.'
                : 'Click any filter to apply it instantly to your catalog, or remove filters you no longer need.'}
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto custom-scroll">
              {/* Default Presets */}
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                {isAr ? 'الفلاتر الافتراضية' : 'Default Presets'}
              </div>
              {DEFAULT_PRESETS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    handleApplyPreset(p);
                    setIsSavedFiltersListOpen(false);
                  }}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {isAr ? p.nameAr : p.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Status: {p.criteria.status} • Category: {p.criteria.category}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    {isAr ? 'تطبيق' : 'Apply'}
                  </span>
                </div>
              ))}

              {/* Custom User Presets */}
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 pt-2">
                {isAr ? 'فلاتري المخصصة' : 'My Custom Filters'}
              </div>
              {savedPresets.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                  {isAr ? 'لا توجد فلاتر مخصصة محفوظة بعد' : 'No custom saved filters yet'}
                </div>
              ) : (
                savedPresets.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      handleApplyPreset(p);
                      setIsSavedFiltersListOpen(false);
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Channel: {p.criteria.channel} • Brand: {p.criteria.brand} • Status: {p.criteria.status}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                        {isAr ? 'تطبيق' : 'Apply'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSavedFilter(p.id, e)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsSavedFiltersListOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Modal: Create New Filter ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {isAr ? 'إنشاء فلتر جديد' : 'Create New Filter'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'اسم الفلتر الجديد' : 'New Filter Name'}
              </label>
              <input
                type="text"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                placeholder={isAr ? 'مثال: منتجات الهدايا الترويجية' : 'e.g. Promotional Gifts Campaign'}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'القناة' : 'Channel'}
                </label>
                <select
                  value={newCriteria.channel}
                  onChange={(e) => setNewCriteria({ ...newCriteria, channel: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  <option value="All">All Channels</option>
                  <option value="Online Store">Online Store</option>
                  <option value="POS">POS</option>
                  <option value="Instagram">Instagram</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'العلامة التجارية' : 'Brand'}
                </label>
                <select
                  value={newCriteria.brand}
                  onChange={(e) => setNewCriteria({ ...newCriteria, brand: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  <option value="All">All Brands</option>
                  {availableBrands.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'القسم' : 'Category'}
                </label>
                <select
                  value={newCriteria.category}
                  onChange={(e) => setNewCriteria({ ...newCriteria, category: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  <option value="All">All Categories</option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الحالة' : 'Status'}
                </label>
                <select
                  value={newCriteria.status}
                  onChange={(e) => setNewCriteria({ ...newCriteria, status: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleCreateNewFilter}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                {isAr ? 'إنشاء وتطبيق' : 'Create & Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
