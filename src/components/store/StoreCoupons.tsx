import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  Tag,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Percent,
  Sparkles,
  TrendingUp,
  Download,
  Trash2,
  ArrowLeft,
  Save,
  Shuffle,
  Info,
  Upload,
  Image as ImageIcon,
  Calendar,
  Clock,
  Sliders,
  Check,
  Eye,
  Layers,
  ShoppingBag,
  ExternalLink,
  Coins,
  FileText,
  Pencil,
  Copy,
} from 'lucide-react';
import { StoreOfferPromo } from './StoreOfferPromo';
import * as tenantApi from '../../api/tenantApi';
import type { StoreCategory } from '../../types';

interface StoreCouponsProps {
  onViewStorefront?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const StoreCoupons: React.FC<StoreCouponsProps> = ({ onViewStorefront, onNavigateTab }) => {
  const {
    activeStore,
    currentCoupons,
    addCoupon,
    toggleCouponStatus,
    deleteCoupon,
    currentProducts,
  } = useTenant();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  // Mode: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);

  // Form state matching reference design
  const [couponName, setCouponName] = useState(isAr ? 'عرض خاص 50%' : 'Special Offer 50%');
  const [couponCode, setCouponCode] = useState('SALE50');
  const [status, setStatus] = useState<'active' | 'expired' | 'scheduled'>('active');
  const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('50');
  const [description, setDescription] = useState(
    isAr
      ? `خصم 50% على جميع المنتجات المؤهلة في ${activeStore.name}`
      : `Get 50% off on eligible products at ${activeStore.name}.`
  );

  // Image & Design
  const [couponColor, setCouponColor] = useState('#0EA5A4');
  const [customColor, setCustomColor] = useState('#0EA5A4');
  const [backgroundStyle, setBackgroundStyle] = useState<'solid' | 'gradient' | 'image' | 'transparent'>('solid');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validity Period
  const [startDate, setStartDate] = useState('2026-10-18');
  const [endDate, setEndDate] = useState('2026-11-18');
  const [expiryTime, setExpiryTime] = useState('');
  const [noExpiryDate, setNoExpiryDate] = useState(false);

  // Usage Options
  const [minOrderAmount, setMinOrderAmount] = useState('100');
  const [usageLimit, setUsageLimit] = useState('500');
  const [usageLimitType, setUsageLimitType] = useState<'total' | 'per_day' | 'per_week'>('total');
  const [usageLimitPerCustomer, setUsageLimitPerCustomer] = useState('1');
  const [allowWithOtherDiscounts, setAllowWithOtherDiscounts] = useState(false);
  const [applyToSelectedProductsOnly, setApplyToSelectedProductsOnly] = useState(true);
  const [applyToSelectedCategoriesOnly, setApplyToSelectedCategoriesOnly] = useState(false);

  // Conditions
  const [applicableTo, setApplicableTo] = useState<'all' | 'categories' | 'products'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [storeCategoriesList, setStoreCategoriesList] = useState<StoreCategory[]>([]);

  // Additional Settings
  const [showCouponOnStore, setShowCouponOnStore] = useState(true);
  const [showInSpecialOffers, setShowInSpecialOffers] = useState(true);
  const [highlightAsFeatured, setHighlightAsFeatured] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);

  // Preview Mode Tab
  const [previewTab, setPreviewTab] = useState<'standard' | 'dark' | 'transparent'>('standard');

  // List View Filter & Pagination
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch real categories for conditions picker
  useEffect(() => {
    let isMounted = true;
    tenantApi.fetchCategories(activeStore.id, { all: true }).then((cats) => {
      if (isMounted && Array.isArray(cats)) {
        setStoreCategoriesList(cats);
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [activeStore.id]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize, activeStore.id]);

  // Filtered coupons list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return currentCoupons.filter((c) => {
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchSearch =
        !q ||
        c.code.toLowerCase().includes(q) ||
        (c.name && c.name.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [currentCoupons, search, statusFilter]);

  const lastPage = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);
  const fromRow = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, filtered.length);

  // Reset form for new coupon
  const handleOpenCreate = () => {
    setViewMode('create');
    setEditingCouponId(null);
    setCouponName(isAr ? 'عرض خاص 50%' : 'Special Offer 50%');
    setCouponCode('SALE50');
    setStatus('active');
    setCouponType('percentage');
    setDiscountValue('50');
    setDescription(isAr ? 'احصل على خصم 50% على جميع الباقات والهدايا.' : 'Get 50% off on all bouquets and gifts.');
    setCouponColor('#0EA5A4');
    setCustomColor('#0EA5A4');
    setBackgroundStyle('solid');
    setUploadedImage(null);
    setStartDate('2026-10-18');
    setEndDate('2026-11-18');
    setExpiryTime('');
    setNoExpiryDate(false);
    setMinOrderAmount('100');
    setUsageLimit('500');
    setUsageLimitPerCustomer('1');
    setApplicableTo('all');
    setSelectedCategories([]);
    setSelectedProductIds([]);
    setShowCouponOnStore(true);
    setShowInSpecialOffers(true);
    setHighlightAsFeatured(false);
    setSendNotification(true);
  };

  // Open edit mode
  const handleOpenEdit = (coupon: typeof currentCoupons[0]) => {
    setViewMode('edit');
    setEditingCouponId(coupon.id);
    setCouponName(coupon.name || coupon.code);
    setCouponCode(coupon.code);
    setStatus(coupon.status);
    setCouponType(coupon.discountType);
    setDiscountValue(String(coupon.discountValue));
    setDescription(coupon.description || '');
    setCouponColor(coupon.couponColor || '#0EA5A4');
    setCustomColor(coupon.couponColor || '#0EA5A4');
    setBackgroundStyle(coupon.backgroundStyle || 'solid');
    setUploadedImage(coupon.imageUrl || null);
    setStartDate(coupon.startDate || '2026-10-18');
    setEndDate(coupon.validUntil || '2026-12-31');
    setNoExpiryDate(Boolean(coupon.noExpiry));
    setMinOrderAmount(String(coupon.minOrderValue || 0));
    setUsageLimit(String(coupon.maxUsage || 100));
    setUsageLimitPerCustomer(String(coupon.usageLimitPerCustomer || 1));
    setApplicableTo(coupon.applicableTo || 'all');
    setSelectedCategories(coupon.selectedCategoryIds || []);
    setSelectedProductIds(coupon.selectedProductIds || []);
    setShowCouponOnStore(coupon.showOnStore ?? true);
    setShowInSpecialOffers(coupon.showInSpecialOffers ?? true);
    setHighlightAsFeatured(coupon.highlightAsFeatured ?? false);
    setSendNotification(coupon.sendNotification ?? true);
  };

  // Generate random promo code
  const generateRandomCode = () => {
    const prefixes = ['SAVE', 'OFFER', 'SUPER', 'DEAL', 'VIP', 'GIFT'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 89);
    setCouponCode(`${prefix}${num}`);
  };

  // Handle image upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast(isAr ? 'حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)' : 'Image is too large (max 5MB)', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        toast(isAr ? 'تم تحميل صورة الكوبون بنجاح' : 'Coupon image uploaded successfully', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Coupon
  const handleSaveCoupon = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!couponCode.trim()) {
      toast(isAr ? 'يرجى إدخال كود الكوبون' : 'Please enter coupon code', 'error');
      return;
    }

    const cleanCode = couponCode.toUpperCase().replace(/\s+/g, '');
    const numDiscount = parseFloat(discountValue) || 10;
    const numMinOrder = parseFloat(minOrderAmount) || 0;
    const numMaxUsage = parseInt(usageLimit, 10) || 100;
    const numPerCustomer = parseInt(usageLimitPerCustomer, 10) || 1;

    addCoupon({
      code: cleanCode,
      name: couponName,
      description,
      discountType: couponType,
      discountValue: numDiscount,
      minOrderValue: numMinOrder,
      maxUsage: numMaxUsage,
      usageLimitPerCustomer: numPerCustomer,
      status,
      startDate,
      validUntil: noExpiryDate ? '2099-12-31' : endDate,
      expiryTime,
      noExpiry: noExpiryDate,
      couponColor,
      backgroundStyle,
      imageUrl: uploadedImage || undefined,
      applicableTo,
      selectedCategoryIds: selectedCategories,
      selectedProductIds,
      allowWithOtherDiscounts,
      showOnStore: showCouponOnStore,
      showInSpecialOffers,
      highlightAsFeatured,
      sendNotification,
    });

    toast(
      isAr
        ? `تم حفظ الكوبون ${cleanCode} بنجاح`
        : `Coupon ${cleanCode} saved successfully`,
      'success'
    );
    setViewMode('list');
  };

  // Export CSV
  const exportCsv = () => {
    if (filtered.length === 0) {
      toast(isAr ? 'لا توجد كوبونات للتصدير' : 'No coupons to export', 'info');
      return;
    }
    const header = ['Code', 'Name', 'Type', 'Value', 'Min Order', 'Usage', 'Max Usage', 'Status', 'Valid Until'];
    const rows = filtered.map((c) => [
      c.code,
      c.name || '',
      c.discountType,
      c.discountValue,
      c.minOrderValue,
      c.usageCount ?? 0,
      c.maxUsage,
      c.status,
      c.validUntil,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coupons-${activeStore.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(isAr ? `تم تصدير ${filtered.length} كوبون` : `Exported ${filtered.length} coupons`, 'success');
  };

  // Color Swatches
  const colorSwatches = [
    { hex: '#0EA5A4', name: 'Teal' },
    { hex: '#3B82F6', name: 'Blue' },
    { hex: '#8B5CF6', name: 'Purple' },
    { hex: '#EC4899', name: 'Pink' },
    { hex: '#EF4444', name: 'Coral' },
    { hex: '#F59E0B', name: 'Orange' },
    { hex: '#FBBF24', name: 'Amber' },
    { hex: '#E2E8F0', name: 'Slate' },
  ];

  // ─────────────────────────────────────────────────────────────
  // RENDER: CREATE / EDIT VIEW (100% Matching Reference Screenshot)
  // ─────────────────────────────────────────────────────────────
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100">
        {/* Top Header & Breadcrumbs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                {isAr ? 'الكوبونات' : 'Discounts'}
              </button>
              <span>›</span>
              <span className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer">
                {isAr ? 'أكواد الخصم' : 'Coupon Codes'}
              </span>
              <span>›</span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">
                {viewMode === 'edit'
                  ? (isAr ? 'تعديل الكوبون' : 'Edit Coupon')
                  : (isAr ? 'إنشاء جديد' : 'Create New')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={isAr ? 'رجوع' : 'Back'}
              >
                <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
              </button>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {viewMode === 'edit'
                  ? (isAr ? 'تعديل كود الخصم' : 'Edit Coupon Code')
                  : (isAr ? 'إنشاء كود الخصم' : 'Create Coupon Code')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{isAr ? 'العودة للكوبونات' : 'Back to Coupons'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveCoupon()}
              className="px-5 py-2 bg-[#0EA5A4] hover:bg-[#0c8f8e] text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isAr ? 'حفظ الكوبون' : 'Save Coupon'}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Form Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Configuration Cards (approx 65%) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Card 1: Basic Information */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {isAr ? 'المعلومات الأساسية' : 'Basic Information'}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={status === 'active'}
                      onChange={(e) => setStatus(e.target.checked ? 'active' : 'expired')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-[#0EA5A4]"></div>
                  </label>
                  <span title={isAr ? 'تفعيل أو إيقاف الكوبون' : 'Enable or disable coupon'} className="cursor-help text-slate-400 hover:text-slate-600">
                    <Info className="w-4 h-4" />
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Coupon Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'اسم الكوبون *' : 'Coupon Name *'}
                    </label>
                    <input
                      type="text"
                      value={couponName}
                      onChange={(e) => setCouponName(e.target.value)}
                      placeholder={isAr ? 'عرض خاص 50%' : 'Special Offer 50%'}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                  </div>

                  {/* Status Indicator */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>{isAr ? 'الحالة' : 'Status'}</span>
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                    </label>
                    <div className="flex items-center gap-2 py-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={status === 'active'}
                          onChange={(e) => setStatus(e.target.checked ? 'active' : 'expired')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-[#0EA5A4]"></div>
                      </label>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {status === 'active' ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معطل' : 'Disabled')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Coupon Code with Shuffle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'كود الكوبون *' : 'Coupon Code *'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                        placeholder="SALE50"
                        className="w-full px-3.5 py-2.5 pe-10 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={generateRandomCode}
                        title={isAr ? 'توليد كود عشوائي' : 'Generate random code'}
                        className="absolute end-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Shuffle className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {isAr ? 'استخدم أحرفاً وأرقاماً إنجليزية كبيرة.' : 'Use uppercase letters and numbers.'}
                    </span>
                  </div>

                  {/* Coupon Type & Discount Value */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'نوع الخصم' : 'Coupon Type'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCouponType('percentage')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                          couponType === 'percentage'
                            ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <Percent className="w-3.5 h-3.5" />
                        <span>{isAr ? 'نسبة مئوية' : 'Percentage'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCouponType('fixed')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                          couponType === 'fixed'
                            ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>{isAr ? 'مبلغ ثابت' : 'Fixed Amount'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'قيمة الخصم *' : 'Discount Value *'}
                  </label>
                  <div className="relative max-w-md">
                    <input
                      type="number"
                      min={1}
                      max={couponType === 'percentage' ? 100 : 10000}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder="50"
                      className="w-full px-3.5 py-2.5 pe-12 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                    <span className="absolute end-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {couponType === 'percentage' ? '%' : (isAr ? 'ر.س' : 'SAR')}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isAr ? 'الوصف' : 'Description'}
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {description.length}/200
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={200}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={isAr ? 'احصل على خصم 50% على جميع المنتجات...' : 'Get 50% off on all bouquets and gifts.'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Coupon Image & Design */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {isAr ? 'تصميم وهوية الكوبون' : 'Coupon Image & Design'}
                </h3>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Upload Coupon Image */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-teal-300 dark:border-teal-800/60 hover:border-teal-500 rounded-2xl p-6 text-center cursor-pointer bg-teal-50/20 dark:bg-teal-950/10 hover:bg-teal-50/40 transition-all group"
                  >
                    <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isAr ? 'تحميل صورة الكوبون' : 'Upload Coupon Image'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isAr ? 'اسحب وأفلت أو اضغط للاختيار' : 'Drag & drop or click to upload'}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                      {isAr ? 'يدعم PNG (خلفية شفافة)، JPG، WEBP' : 'Supports PNG (transparent), JPG, WEBP'}
                      <br />
                      {isAr ? 'الحجم الموصى به: 1200 × 628 بكسل' : 'Recommended size: 1200 × 628 px'}
                    </div>
                  </div>
                  {uploadedImage && (
                    <div className="mt-2 flex items-center justify-between text-xs px-2 text-teal-600 dark:text-teal-400">
                      <span>{isAr ? 'تم تحميل صورة مخصصة' : 'Custom image active'}</span>
                      <button
                        type="button"
                        onClick={() => setUploadedImage(null)}
                        className="text-red-500 hover:underline"
                      >
                        {isAr ? 'إزالة' : 'Remove'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Choose Color & Background Style */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      {isAr ? 'اختر اللون الأساسي' : 'Choose a Color'}
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {colorSwatches.map((swatch) => (
                        <button
                          key={swatch.hex}
                          type="button"
                          onClick={() => {
                            setCouponColor(swatch.hex);
                            setCustomColor(swatch.hex);
                          }}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                            couponColor.toLowerCase() === swatch.hex.toLowerCase()
                              ? 'ring-2 ring-offset-2 ring-teal-500 scale-110 shadow-sm'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                          title={swatch.name}
                        >
                          {couponColor.toLowerCase() === swatch.hex.toLowerCase() && (
                            <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'أو لون مخصص' : 'or Custom Color'}
                    </label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-xl border border-slate-300 dark:border-slate-600 shrink-0 shadow-2xs"
                        style={{ backgroundColor: couponColor }}
                      />
                      <input
                        type="text"
                        value={customColor}
                        onChange={(e) => {
                          setCustomColor(e.target.value);
                          if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                            setCouponColor(e.target.value);
                          }
                        }}
                        placeholder="#0EA5A4"
                        className="w-28 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase"
                      />
                      <input
                        type="color"
                        value={couponColor}
                        onChange={(e) => {
                          setCouponColor(e.target.value);
                          setCustomColor(e.target.value);
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                        title={isAr ? 'لوحة الألوان' : 'Color picker'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'نمط الخلفية' : 'Background Style'}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'solid', labelAr: 'لون مصمت', labelEn: 'Solid Color' },
                        { id: 'gradient', labelAr: 'تدرج لوني', labelEn: 'Gradient' },
                        { id: 'image', labelAr: 'صورة خلفية', labelEn: 'Image' },
                        { id: 'transparent', labelAr: 'شفاف (PNG)', labelEn: 'Transparent (PNG)' },
                      ].map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setBackgroundStyle(style.id as any)}
                          className={`py-1.5 px-2.5 rounded-lg text-[11px] font-semibold border transition-all ${
                            backgroundStyle === style.id
                              ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-700 dark:text-teal-300 shadow-2xs'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {isAr ? style.labelAr : style.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Validity Period */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {isAr ? 'فترة الصلاحية' : 'Validity Period'}
                </h3>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Start Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'تاريخ البدء *' : 'Start Date *'}
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'تاريخ الانتهاء *' : 'End Date *'}
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        disabled={noExpiryDate}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all disabled:opacity-40"
                      />
                    </div>
                  </div>

                  {/* Expiry Time (Optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'وقت الانتهاء (اختياري)' : 'Set Expiry Time (Optional)'}
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        disabled={noExpiryDate}
                        value={expiryTime}
                        onChange={(e) => setExpiryTime(e.target.value)}
                        placeholder="Select time"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all disabled:opacity-40"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="no-expiry"
                    checked={noExpiryDate}
                    onChange={(e) => setNoExpiryDate(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                  />
                  <label htmlFor="no-expiry" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    {isAr ? 'بدون تاريخ انتهاء (صالح دائماً)' : 'No Expiry Date'}
                  </label>
                </div>
              </div>
            </div>

            {/* Card 4: Usage Options */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {isAr ? 'خيارات الاستخدام والحدود' : 'Usage Options'}
                </h3>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Min Order Amount */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'الحد الأدنى للطلب (ر.س)' : 'Minimum Order Amount (SAR)'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(e.target.value)}
                      placeholder="100"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-semibold"
                    />
                  </div>

                  {/* Usage Limit + Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'حد الاستخدام' : 'Usage Limit'}
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min={1}
                        value={usageLimit}
                        onChange={(e) => setUsageLimit(e.target.value)}
                        placeholder="500"
                        className="w-2/3 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none font-semibold"
                      />
                      <select
                        value={usageLimitType}
                        onChange={(e) => setUsageLimitType(e.target.value as any)}
                        className="w-1/3 px-2 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none"
                      >
                        <option value="total">{isAr ? 'إجمالي' : 'Total'}</option>
                        <option value="per_day">{isAr ? 'يومياً' : 'Day'}</option>
                        <option value="per_week">{isAr ? 'أسبوعياً' : 'Week'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Usage Limit Per Customer */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>{isAr ? 'الحد الأقصى لكل عميل' : 'Usage Limit Per Customer'}</span>
                      <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={usageLimitPerCustomer}
                      onChange={(e) => setUsageLimitPerCustomer(e.target.value)}
                      placeholder="1"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none font-semibold"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowWithOtherDiscounts}
                      onChange={(e) => setAllowWithOtherDiscounts(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {isAr ? 'السماح بالدمج مع خصومات وعروض أخرى' : 'Allow with other discounts'}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyToSelectedProductsOnly}
                      onChange={(e) => setApplyToSelectedProductsOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {isAr ? 'تطبيق على منتجات مختارة فقط' : 'Apply to selected products only'}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyToSelectedCategoriesOnly}
                      onChange={(e) => setApplyToSelectedCategoriesOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {isAr ? 'تطبيق على تصنيفات محددة فقط' : 'Apply to selected categories only'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Ticket Preview & Conditions & Settings (approx 35%) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* Card 1: Coupon Preview (Pixel-Perfect Ticket Card) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                    {isAr ? 'معاينة الكوبون' : 'Coupon Preview'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onViewStorefront?.()}
                  className="px-2.5 py-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{isAr ? 'معاينة في المتجر' : 'Preview on Store'}</span>
                </button>
              </div>

              {/* Preview Tabs: Standard | Dark Mode | Transparent */}
              <div className="px-4 pt-3 border-b border-slate-100 dark:border-slate-800 flex gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPreviewTab('standard')}
                  className={`pb-2 border-b-2 transition-colors ${
                    previewTab === 'standard'
                      ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {isAr ? 'معاينة قياسية' : 'Standard Preview'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('dark')}
                  className={`pb-2 border-b-2 transition-colors ${
                    previewTab === 'dark'
                      ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {isAr ? 'الوضع الليلي' : 'Dark Mode'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('transparent')}
                  className={`pb-2 border-b-2 transition-colors ${
                    previewTab === 'transparent'
                      ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {isAr ? 'شفاف (PNG)' : 'Transparent (PNG)'}
                </button>
              </div>

              <div
                className={`p-5 flex items-center justify-center transition-colors ${
                  previewTab === 'dark'
                    ? 'bg-slate-950'
                    : previewTab === 'transparent'
                    ? 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px] bg-slate-100'
                    : 'bg-slate-50 dark:bg-slate-950'
                }`}
              >
                {/* Visual Ticket Voucher */}
                <div
                  className="w-full relative rounded-2xl overflow-hidden shadow-lg p-5 text-white flex flex-col justify-between min-h-[190px] border border-white/20"
                  style={{
                    backgroundColor: couponColor,
                    backgroundImage:
                      backgroundStyle === 'gradient'
                        ? `linear-gradient(135deg, ${couponColor} 0%, #064E3B 100%)`
                        : undefined,
                  }}
                >
                  {/* Decorative Ticket Perforated Cutouts */}
                  <div className="absolute -start-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-950" />
                  <div className="absolute -end-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-950" />

                  {/* Watermark/Image Background */}
                  {uploadedImage ? (
                    <img
                      src={uploadedImage}
                      alt="Coupon visual"
                      className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 pointer-events-none"
                    />
                  ) : (
                    <div className="absolute end-2 top-2 opacity-15 pointer-events-none">
                      <Sparkles className="w-32 h-32" />
                    </div>
                  )}

                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/25 backdrop-blur-xs text-[10px] font-black uppercase tracking-wider text-white">
                        {isAr ? 'عرض خاص' : 'SPECIAL OFFER'}
                      </span>
                      <h4 className="text-xs font-medium text-white/90 mt-1 line-clamp-1">
                        {couponName || (isAr ? 'كوبون الخصم' : 'Discount Coupon')}
                      </h4>
                    </div>

                    <div className="text-end">
                      <div className="text-3xl font-black tracking-tight leading-none text-white drop-shadow-sm tabular-nums">
                        {discountValue || '50'}
                        {couponType === 'percentage' ? '%' : (isAr ? ' ر.س' : ' SAR')}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                        {isAr ? 'خصم فوري' : 'OFF'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Ticket Code Pill */}
                  <div className="relative z-10 pt-4 mt-4 border-t border-dashed border-white/30 flex items-center justify-between">
                    <div className="bg-white text-slate-900 font-mono font-black text-xs px-3.5 py-1.5 rounded-lg shadow-sm tracking-wider uppercase">
                      {couponCode || 'SALE50'}
                    </div>
                    <span className="text-[10px] text-white/80 font-medium">
                      {noExpiryDate
                        ? (isAr ? 'صالح دائماً' : 'Valid Always')
                        : `${isAr ? 'ينتهي:' : 'Ends:'} ${endDate}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview Variations Selector */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">
                  {isAr ? 'أنماط جاهزة' : 'Preview Variations'}
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { color: '#0EA5A4', name: 'Teal' },
                    { color: '#EC4899', name: 'Pink' },
                    { color: '#8B5CF6', name: 'Purple' },
                  ].map((v) => (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => {
                        setCouponColor(v.color);
                        setCustomColor(v.color);
                      }}
                      className="h-10 rounded-xl overflow-hidden shadow-2xs border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-white relative transition-transform hover:scale-105"
                      style={{ backgroundColor: v.color }}
                    >
                      50% OFF
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setCouponColor('#F59E0B');
                      setCustomColor('#F59E0B');
                    }}
                    className="h-10 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 hover:border-teal-500 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold transition-colors"
                  >
                    + {isAr ? 'مخصص' : 'Custom'}
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Conditions */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                <Tag className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                  {isAr ? 'الشروط والتطبيق' : 'Conditions'}
                </h3>
              </div>

              <div className="p-4 space-y-3">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  {isAr ? 'يطبق الكوبون على:' : 'Applicable To'}
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="applicable"
                      checked={applicableTo === 'all'}
                      onChange={() => setApplicableTo('all')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                      {isAr ? 'جميع المنتجات' : 'All Products'}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="applicable"
                      checked={applicableTo === 'categories'}
                      onChange={() => setApplicableTo('categories')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                      {isAr ? 'تصنيفات محددة' : 'Specific Categories'}
                    </span>
                  </label>

                  {applicableTo === 'categories' && (
                    <div className="ps-5 pt-1 space-y-1.5 max-h-36 overflow-y-auto custom-sidebar-scroll">
                      {storeCategoriesList.length > 0 ? (
                        storeCategoriesList.map((cat) => (
                          <label key={cat.id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(cat.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCategories([...selectedCategories, cat.id]);
                                } else {
                                  setSelectedCategories(selectedCategories.filter((id) => id !== cat.id));
                                }
                              }}
                              className="rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                            />
                            <span>{cat.name}</span>
                          </label>
                        ))
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">
                          {isAr ? 'لا توجد تصنيفات مسجلة' : 'No categories found'}
                        </div>
                      )}
                    </div>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="applicable"
                      checked={applicableTo === 'products'}
                      onChange={() => setApplicableTo('products')}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                      {isAr ? 'منتجات محددة' : 'Specific Products'}
                    </span>
                  </label>

                  {applicableTo === 'products' && (
                    <div className="ps-5 pt-1 space-y-1.5 max-h-36 overflow-y-auto custom-sidebar-scroll">
                      {currentProducts.length > 0 ? (
                        currentProducts.slice(0, 15).map((p) => (
                          <label key={p.id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                            <input
                              type="checkbox"
                              checked={selectedProductIds.includes(p.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProductIds([...selectedProductIds, p.id]);
                                } else {
                                  setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                                }
                              }}
                              className="rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                            />
                            <span className="truncate">{p.name}</span>
                          </label>
                        ))
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">
                          {isAr ? 'لا توجد منتجات مسجلة' : 'No products found'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: Additional Settings */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                  {isAr ? 'إعدادات إضافية' : 'Additional Settings'}
                </h3>
              </div>

              <div className="p-4 space-y-3.5">
                {[
                  {
                    id: 'show-store',
                    labelAr: 'إظهار الكوبون في واجهة المتجر',
                    labelEn: 'Show coupon on store',
                    val: showCouponOnStore,
                    set: setShowCouponOnStore,
                  },
                  {
                    id: 'show-special',
                    labelAr: 'إظهار في قسم العروض الخاصة',
                    labelEn: 'Show in special offers section',
                    val: showInSpecialOffers,
                    set: setShowInSpecialOffers,
                  },
                  {
                    id: 'highlight',
                    labelAr: 'تمييز كعرض رئيسي مميز',
                    labelEn: 'Highlight as featured offer',
                    val: highlightAsFeatured,
                    set: setHighlightAsFeatured,
                  },
                  {
                    id: 'send-notif',
                    labelAr: 'إرسال إشعار فوري للعملاء',
                    labelEn: 'Send notification to customers',
                    val: sendNotification,
                    set: setSendNotification,
                  },
                ].map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {isAr ? s.labelAr : s.labelEn}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={s.val}
                        onChange={(e) => s.set(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-[#0EA5A4]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: LIST VIEW (Coupons Management Table + Statistics)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {isAr ? 'الكوبونات والخصومات' : 'Coupons & Discounts'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? `إدارة أكواد الخصم الترويجية لمتجر ${activeStore.name}`
              : `Manage promotional discount codes for ${activeStore.name}`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={exportCsv}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-[#0EA5A4] hover:bg-[#0c8f8e] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إنشاء كود خصم' : 'Create Coupon Code'}</span>
          </button>
        </div>
      </div>

      {/* 4 Soft Pastel KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-teal-50/70 hover:bg-teal-50/90 dark:bg-teal-950/30 dark:hover:bg-teal-950/40 rounded-2xl border border-teal-200/80 dark:border-teal-900/40 shadow-2xs space-y-1.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-700 dark:text-teal-200 font-bold">{isAr ? 'الكوبونات النشطة' : 'Active Coupons'}</span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {currentCoupons.filter((c) => c.status === 'active').length} {isAr ? 'نشط' : 'Active'}
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            {isAr ? 'أكواد تُطبَّق تلقائيًا وأكواد السلة' : 'Auto-applied & cart promo codes'}
          </span>
        </div>

        <div className="p-5 bg-emerald-50/70 hover:bg-emerald-50/90 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs space-y-1.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-700 dark:text-emerald-200 font-bold">{isAr ? 'متوسط الخصم' : 'Average Discount'}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {currentCoupons.length > 0
              ? (
                  currentCoupons.reduce(
                    (sum, c) => sum + (c.discountType === 'percentage' ? c.discountValue : 15),
                    0
                  ) / currentCoupons.length
                ).toFixed(1) + '%'
              : '0%'}
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            {isAr ? 'عرض العملاء الفعلي' : 'Current active promotions'}
          </span>
        </div>

        <div className="p-5 bg-purple-50/70 hover:bg-purple-50/90 dark:bg-purple-950/30 dark:hover:bg-purple-950/40 rounded-2xl border border-purple-200/80 dark:border-purple-900/40 shadow-2xs space-y-1.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-700 dark:text-purple-200 font-bold">{isAr ? 'إجمالي الاستخدامات' : 'Total Redemptions'}</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {currentCoupons.reduce((sum, c) => sum + (c.usageCount || 0), 0)} {isAr ? 'طلب' : 'Orders'}
          </div>
          <span className="text-[11px] text-purple-800 dark:text-purple-300 font-bold">
            {isAr ? 'طلبات تم استخدام الكوبون فيها' : 'Completed promo orders'}
          </span>
        </div>

        <div className="p-5 bg-amber-50/70 hover:bg-amber-50/90 dark:bg-amber-950/30 dark:hover:bg-amber-950/40 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-2xs space-y-1.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-700 dark:text-amber-200 font-bold">{isAr ? 'المبيعات المتأثرة' : 'Influenced GMV'}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {money(
              currentCoupons.reduce(
                (sum, c) => sum + (c.usageCount || 0) * (c.minOrderValue || 150),
                0
              )
            )}
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            {isAr ? 'إيرادات مباشرة من الطلبات بالكوبونات' : 'Direct coupon checkout revenue'}
          </span>
        </div>
      </div>

      <StoreOfferPromo
        onEdit={handleOpenCreate}
        onViewStorefront={() => onViewStorefront?.()}
      />

      {/* Coupons Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
            {isAr ? 'عروض المتجر النشطة' : 'Active Store Promotions'}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? 'ابحث عن كود أو اسم…' : 'Search code or name…'}
              aria-label={isAr ? 'ابحث عن كود' : 'Search code'}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              aria-label={isAr ? 'تصفية حسب الحالة' : 'Filter by status'}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="all">{isAr ? 'جميع الحالات' : 'All statuses'}</option>
              <option value="active">{isAr ? 'نشط' : 'Active'}</option>
              <option value="expired">{isAr ? 'منتهي' : 'Expired'}</option>
            </select>
            <span className="text-xs text-slate-400">
              {filtered.length} {isAr ? 'كوبون' : 'coupons'}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-[11px] bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-4 text-start">{isAr ? 'كود الكوبون' : 'Coupon Code'}</th>
                <th className="py-3 px-3 text-start">{isAr ? 'الخصم' : 'Discount'}</th>
                <th className="py-3 px-3 text-end">{isAr ? 'الحد الأدنى للطلب (ر.س)' : 'Min Order (SAR)'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'الاستخدام' : 'Usage'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="py-3 px-3 text-end">{isAr ? 'صالح حتى' : 'Valid Until'}</th>
                <th className="py-3 px-4 text-end">{isAr ? 'الإجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Tag className="w-8 h-8 mx-auto mb-2 opacity-30 text-teal-600" />
                    <p className="font-semibold text-xs">
                      {isAr ? 'لا توجد كوبونات مطابقة' : 'No coupons found'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {isAr ? 'اضغط على "إنشاء كود خصم" لإضافة كوبون جديد لمتجرك.' : 'Click "Create Coupon Code" to add a new discount.'}
                    </p>
                  </td>
                </tr>
              ) : (
                pageRows.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 text-start">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tracking-wider">
                          {c.code}
                        </span>
                        {c.name && (
                          <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                            {c.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-start font-bold text-slate-900 dark:text-white">
                      {c.discountType === 'percentage'
                        ? `${c.discountValue}%`
                        : money(c.discountValue)}
                    </td>
                    <td className="py-3 px-3 text-end tabular-nums text-slate-600 dark:text-slate-400">
                      {money(c.minOrderValue)}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {c.usageCount ?? 0}
                      </span>
                      <span className="text-slate-400"> / {c.maxUsage}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {c.status === 'active' ? (isAr ? 'نشط' : 'Active') : (isAr ? 'منتهي' : 'Expired')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-end tabular-nums text-slate-500 text-[11px]">
                      {c.validUntil}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          title={isAr ? 'تعديل' : 'Edit'}
                          className="p-1.5 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            toggleCouponStatus(c.id);
                            toast(
                              isAr
                                ? `تم تحديث حالة الكوبون ${c.code}`
                                : `Coupon ${c.code} status updated`,
                              'info'
                            );
                          }}
                          className="px-2 py-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition-colors"
                        >
                          {c.status === 'active' ? (isAr ? 'إنهاء' : 'Expire') : (isAr ? 'تفعيل' : 'Activate')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteCoupon(c.id);
                            toast(isAr ? `تم حذف الكوبون ${c.code}` : `Coupon ${c.code} deleted`, 'info');
                          }}
                          title={isAr ? `حذف الكوبون ${c.code}` : `Delete coupon ${c.code}`}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <label className="flex items-center gap-1.5">
            <span>{isAr ? 'عرض' : 'Show'}</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-1">
            <span className="me-3">
              {isAr
                ? `عرض ${fromRow} – ${toRow} من ${filtered.length}`
                : `Showing ${fromRow} – ${toRow} of ${filtered.length}`}
            </span>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label={isAr ? 'الصفحة السابقة' : 'Previous page'}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <span className="px-2 font-bold text-slate-700 dark:text-slate-200">
              {page} / {lastPage}
            </span>
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              aria-label={isAr ? 'الصفحة التالية' : 'Next page'}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
