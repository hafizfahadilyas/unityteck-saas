import React, { useCallback, useEffect, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { MediaUploadField } from '../common/MediaUploadField';
import { SpecialOfferPreviewCard } from './SpecialOfferPreviewCard';
import {
  createSpecialOfferApi,
  deleteSpecialOfferApi,
  fetchSpecialOffersApi,
} from '../../api/tenantApi';
import type { SpecialOffer } from '../../services/specialOfferService';
import { resolveProductThumb } from '../../services/specialOfferService';
import {
  Tag,
  Plus,
  ArrowLeft,
  Gift,
  Coins,
  Percent,
  Layers,
  X,
  CheckCircle2,
  HelpCircle,
  Eye,
  Save,
  Trash2,
  Sparkles,
  ShoppingBag,
  Image as ImageIcon,
  Palette,
  Search,
} from 'lucide-react';

interface StorePromotionalOffersProps {
  onNavigateTab?: (tab: string) => void;
}

const DEFAULT_BANNER_BG = '#0c5c46';

export const StorePromotionalOffers: React.FC<StorePromotionalOffersProps> = ({ onNavigateTab }) => {
  const { activeStore, currentProducts } = useTenant();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Form states matching mockup
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [offerType, setOfferType] = useState<'percentage' | 'fixed' | 'bogo' | 'table' | 'fixed_price' | 'category'>('percentage');
  const [offerMessage, setOfferMessage] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Discount settings (form defaults for new offer — merchant can change)
  const [discountPercentage, setDiscountPercentage] = useState('15');
  const [minOrderValue, setMinOrderValue] = useState('200');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('100');
  const [applyScope, setApplyScope] = useState<'all' | 'specific'>('specific');

  // Selected qualifying products
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Customer banner (preview + storefront)
  const [bannerBgColor, setBannerBgColor] = useState(DEFAULT_BANNER_BG);
  const [bannerImage, setBannerImage] = useState('');

  // List of saved offers isolated by activeStore.id (API)
  const [offersList, setOffersList] = useState<SpecialOffer[]>([]);

  const loadOffers = useCallback(async () => {
    if (!activeStore?.id) {
      setOffersList([]);
      return;
    }
    setIsLoadingList(true);
    try {
      const rows = await fetchSpecialOffersApi(activeStore.id);
      setOffersList(rows.filter((o) => o.storeId === activeStore.id));
    } catch {
      // Empty when API/table not ready — genuine empty, no fake rows
      setOffersList([]);
    } finally {
      setIsLoadingList(false);
    }
  }, [activeStore?.id]);

  useEffect(() => {
    void loadOffers();
  }, [loadOffers]);

  const resetCreateForm = () => {
    setTitleAr('');
    setTitleEn('');
    setStartDate('');
    setEndDate('');
    setOfferType('percentage');
    setOfferMessage('');
    setIsActive(true);
    setDiscountPercentage('15');
    setMinOrderValue('200');
    setMaxDiscountAmount('100');
    setApplyScope('specific');
    setSelectedProductIds([]);
    setProductSearch('');
    setShowProductPicker(false);
    setBannerBgColor(DEFAULT_BANNER_BG);
    setBannerImage('');
    setActiveStep(1);
  };

  const productLabel = (p: { name: string; nameAr?: string; nameEn?: string }) => {
    if (isAr) return p.nameAr || p.name || p.nameEn || '';
    return p.nameEn || p.name || p.nameAr || '';
  };

  const filteredProducts = currentProducts.filter((p) => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return true;
    const hay = `${p.name || ''} ${p.nameAr || ''} ${p.nameEn || ''} ${p.sku || ''}`.toLowerCase();
    return hay.includes(q);
  });

  const handleSaveOffer = async () => {
    if (!activeStore?.id) return;
    if (!titleEn.trim() && !titleAr.trim()) {
      toast(
        isAr ? 'أدخل عنوان العرض بالعربية أو الإنجليزية' : 'Enter an offer title in Arabic or English',
        'error',
      );
      return;
    }
    if (applyScope === 'specific' && selectedProductIds.length === 0) {
      toast(
        isAr ? 'اختر منتجاً واحداً على الأقل لهذا العرض' : 'Select at least one qualifying product',
        'error',
      );
      return;
    }
    setIsSaving(true);
    try {
      const created = await createSpecialOfferApi(activeStore.id, {
        title_ar: titleAr.trim() || null,
        title_en: titleEn.trim() || null,
        offer_type: offerType,
        discount_value: parseFloat(discountPercentage) || 0,
        min_order_value: minOrderValue ? parseFloat(minOrderValue) : null,
        max_discount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        message: offerMessage.trim() || null,
        status: isActive ? 'active' : 'inactive',
        product_scope: applyScope,
        product_ids: applyScope === 'specific' ? selectedProductIds : [],
        banner_bg_color: bannerBgColor.trim() || DEFAULT_BANNER_BG,
        banner_image_url: bannerImage.trim() || null,
      });
      setOffersList((prev) => [created, ...prev.filter((o) => o.id !== created.id)]);
      toast(
        isAr
          ? `تم حفظ وتفعيل العرض الخاص "${titleAr || titleEn}" بنجاح`
          : `Special offer "${titleEn || titleAr}" saved successfully`,
        'success',
      );
      resetCreateForm();
      setViewMode('list');
    } catch {
      toast(
        isAr ? 'تعذر حفظ العرض الخاص' : 'Could not save special offer',
        'error',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!activeStore?.id) return;
    try {
      await deleteSpecialOfferApi(activeStore.id, id);
      setOffersList((prev) => prev.filter((o) => o.id !== id));
      toast(isAr ? 'تم حذف العرض' : 'Offer deleted', 'success');
    } catch {
      toast(isAr ? 'تعذر حذف العرض' : 'Could not delete offer', 'error');
    }
  };

  const selectedProducts = currentProducts.filter((p) => selectedProductIds.includes(p.id));
  const previewTitle = isAr ? (titleAr || titleEn) : (titleEn || titleAr);
  const discountLabel =
    offerType === 'fixed'
      ? (isAr ? `${discountPercentage} ر.س خصم` : `${discountPercentage} SAR OFF`)
      : `${discountPercentage}% OFF`;

  // ─────────────────────────────────────────────────────────────
  // CREATE SPECIAL OFFER VIEW (100% Matching Reference Screenshot)
  // ─────────────────────────────────────────────────────────────
  if (viewMode === 'create') {
    return (
      <div className="u-page p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100 w-full min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{isAr ? 'العودة للعروض الخاصة' : 'Back to Special Offers'}</span>
            </button>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'إنشاء العرض الخاص' : 'Create Special Offer'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'إنشاء وإدارة عروض ترويجية لزيادة مبيعاتك. حدد نوع العرض والمنتجات المؤهلة والمزايا وفترة الصلاحية.'
                : 'Create and manage special offers to boost your sales. Configure the offer type, qualifying products, benefits, and validity.'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={isSaving}
              aria-busy={isSaving}
              onClick={() => void handleSaveOffer()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isAr ? 'حفظ العرض' : 'Save Offer'}</span>
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-2xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-bold text-center">
            {[
              { num: 1, title: isAr ? 'تفاصيل العرض' : 'Offer Details' },
              { num: 2, title: isAr ? 'المنتجات المؤهلة' : 'Qualifying Products' },
              { num: 3, title: isAr ? 'المزايا والإعدادات' : 'Benefits & Settings' },
              { num: 4, title: isAr ? 'المعاينة' : 'Preview' },
            ].map((step) => (
              <button
                key={step.num}
                type="button"
                onClick={() => setActiveStep(step.num)}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeStep === step.num
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    activeStep === step.num ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  {step.num}
                </span>
                <span>{step.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Details */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Offer Details */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'تفاصيل العرض' : 'Offer Details'}
              </h3>

              {/* Dual Language Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'عنوان العرض (عربي) *' : 'Offer Title (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'عنوان العرض (إنجليزي) *' : 'Offer Title (English) *'}
                  </label>
                  <input
                    type="text"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'تاريخ ووقت البدء *' : 'Start Date & Time *'}
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'تاريخ ووقت الانتهاء *' : 'End Date & Time *'}
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Offer Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isAr ? 'رسالة العرض للعميل *' : 'Offer Message *'}
                  </label>
                  <span className="text-[10px] text-slate-400">{offerMessage.length}/200</span>
                </div>
                <textarea
                  rows={2}
                  maxLength={200}
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none resize-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {isAr ? 'حالة التفعيل' : 'Active Status'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

            {/* Card: Customer Banner (BG color + image → live preview / storefront) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'بانر العميل' : 'Customer Banner'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr
                    ? 'اختر لون الخلفية وصورة اختيارية. تظهر فوراً في المعاينة وعلى واجهة المتجر.'
                    : 'Pick a background color and optional image. Shown live in preview and on the storefront.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  <span>{isAr ? 'لون خلفية البانر' : 'Banner Background Color'}</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bannerBgColor || DEFAULT_BANNER_BG}
                    onChange={(e) => setBannerBgColor(e.target.value)}
                    className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer bg-transparent p-0.5"
                    aria-label={isAr ? 'لون خلفية البانر' : 'Banner background color'}
                  />
                  <input
                    type="text"
                    value={bannerBgColor}
                    onChange={(e) => setBannerBgColor(e.target.value)}
                    placeholder="#0c5c46"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <MediaUploadField
                label={isAr ? 'صورة بانر العميل (اختياري)' : 'Customer Banner Image (optional)'}
                value={bannerImage}
                onChange={(url) => setBannerImage(url)}
                aspectRatio="banner"
                recommendedSize={isAr ? '١٢٠٠×٤٠٠ تقريباً' : '≈1200×400'}
                initialFolder="marketing"
              />
            </div>

            {/* Card 2: Select Offer Type (6 Cards matching mockup) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {isAr ? 'نوع العرض الخاص' : 'Select Offer Type'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr ? 'حدد هيكلية ونوع العرض الخاص الذي تود إطلاقه.' : 'Choose the type of special offer you want to create.'}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { id: 'bogo', titleAr: 'اشتر واحصل', titleEn: 'Buy X Get Y', descAr: 'مكافأة عند شراء كمية محددة', descEn: 'Get reward when buying specific quantity', icon: Gift },
                  { id: 'fixed', titleAr: 'خصم بمبلغ ثابت', titleEn: 'Fixed Amount Off', descAr: 'مبلغ مالي مخصوم من القيمة', descEn: 'Fixed amount discount on purchase value', icon: Tag },
                  { id: 'percentage', titleAr: 'خصم نسبة مئوية', titleEn: 'Percentage Off', descAr: 'نسبة خصم مئوية على المشتريات', descEn: 'A percentage discount on purchase value', icon: Percent },
                  { id: 'table', titleAr: 'جدول الخصومات', titleEn: 'Discount Table', descAr: 'خصومات تصاعدية حسب الكمية', descEn: 'Tiered discounts based on quantity or spend', icon: Coins },
                  { id: 'fixed_price', titleAr: 'سعر خاص محدد', titleEn: 'Fixed Price', descAr: 'سعر ترويجي لمنتجات مختارة', descEn: 'Special price for selected products', icon: Tag },
                  { id: 'category', titleAr: 'عرض على تصنيف', titleEn: 'Category Offer', descAr: 'عرض خاص على تصنيف كامل', descEn: 'Offer on selected product categories', icon: Layers },
                ].map((type) => {
                  const Icon = type.icon;
                  const isSelected = offerType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setOfferType(type.id as any)}
                      className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-blue-600 mb-1" />
                      <span className="text-xs font-bold">{isAr ? type.titleAr : type.titleEn}</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{isAr ? type.descAr : type.descEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card 3: Discount Settings */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'إعدادات الخصم والشروط' : 'Discount Settings'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'نسبة الخصم *' : 'Discount Percentage *'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(e.target.value)}
                      className="w-full px-3.5 py-2.5 pe-8 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'الحد الأدنى للطلب (اختياري)' : 'Minimum Order Value'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={minOrderValue}
                      onChange={(e) => setMinOrderValue(e.target.value)}
                      placeholder="200"
                      className="w-full px-3.5 py-2.5 pe-12 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {isAr ? 'ر.س' : 'SAR'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'أقصى مبلغ للخصم (اختياري)' : 'Maximum Discount Amount'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={maxDiscountAmount}
                      onChange={(e) => setMaxDiscountAmount(e.target.value)}
                      placeholder="100"
                      className="w-full px-3.5 py-2.5 pe-12 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {isAr ? 'ر.س' : 'SAR'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Apply Scope */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'نطاق التطبيق' : 'Apply To'}
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      checked={applyScope === 'all'}
                      onChange={() => setApplyScope('all')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {isAr ? 'جميع المنتجات المؤهلة' : 'All eligible products'}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scope"
                      checked={applyScope === 'specific'}
                      onChange={() => setApplyScope('specific')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {isAr ? 'منتجات محددة فقط' : 'Specific products only'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Card 4: Qualifying Products — only when specific scope */}
            {applyScope === 'specific' && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {isAr ? 'المنتجات المؤهلة للعرض' : 'Qualifying Products'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isAr
                        ? 'اختر المنتجات التي سينطبق عليها هذا العرض.'
                        : 'Select products that will be eligible for this offer.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowProductPicker(!showProductPicker)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                  >
                    + {isAr ? 'إضافة منتجات' : 'Add Products'}
                  </button>
                </div>

                {showProductPicker && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder={isAr ? 'بحث بالاسم أو رمز المنتج…' : 'Search by name or SKU…'}
                        className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">
                          {isAr ? 'لا توجد منتجات مطابقة' : 'No matching products'}
                        </p>
                      ) : (
                        filteredProducts.map((p) => {
                          const thumb = resolveProductThumb(p);
                          return (
                            <label
                              key={p.id}
                              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0">
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
                                  className="rounded text-blue-600 focus:ring-blue-500 shrink-0"
                                />
                                <span className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                                  {thumb ? (
                                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                                  )}
                                </span>
                                <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                                  {productLabel(p)}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-slate-600 shrink-0">{money(p.price)}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedProducts.length === 0 ? (
                    <div className="col-span-3 text-center py-6 text-slate-400 text-xs">
                      {isAr ? 'لم يتم اختيار أي منتجات بعد.' : 'No products selected yet.'}
                    </div>
                  ) : (
                    selectedProducts.map((p) => {
                      const thumb = resolveProductThumb(p);
                      return (
                        <div
                          key={p.id}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 relative flex items-center gap-3"
                        >
                          <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                            {thumb ? (
                              <img src={thumb} alt={productLabel(p)} className="w-full h-full object-cover" />
                            ) : (
                              <ShoppingBag className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {productLabel(p)}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500">{money(p.price)}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id))
                            }
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Offer Preview & Summary */}
          <div className="lg:col-span-4 space-y-6">
            {/* Offer Preview Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'معاينة العرض الخاص' : 'Offer Preview'}</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  {isAr ? 'مباشر' : 'Live'}
                </span>
              </div>

              <SpecialOfferPreviewCard
                isAr={isAr}
                title={previewTitle || (isAr ? 'عنوان العرض' : 'Offer title')}
                discountLabel={discountLabel}
                bannerBgColor={bannerBgColor || DEFAULT_BANNER_BG}
                bannerImage={bannerImage}
                productThumbs={selectedProducts.map((p) => ({
                  id: p.id,
                  name: productLabel(p),
                  image: resolveProductThumb(p) || null,
                }))}
              />

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{isAr ? 'يتم التطبيق تلقائياً عند الدفع' : 'Applied automatically at checkout'}</span>
              </div>
            </div>

            {/* Offer Summary Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <span className="font-bold text-xs text-slate-900 dark:text-white block">
                {isAr ? 'ملخص العرض' : 'Offer Summary'}
              </span>
              <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500">{isAr ? 'النوع:' : 'Type:'}</span>
                  <span className="font-bold">
                    {offerType === 'percentage'
                      ? (isAr ? 'خصم نسبة مئوية' : 'Percentage Discount')
                      : offerType === 'fixed'
                        ? (isAr ? 'خصم بمبلغ ثابت' : 'Fixed Amount')
                        : offerType === 'bogo'
                          ? (isAr ? 'اشترِ واحصل' : 'Buy X Get Y')
                          : (isAr ? 'عرض خاص' : 'Special Offer')}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">{isAr ? 'البانر:' : 'Banner:'}</span>
                  <span className="font-medium text-slate-600 flex items-center gap-1.5">
                    <span
                      className="inline-block w-3 h-3 rounded-full border border-slate-200"
                      style={{ backgroundColor: bannerBgColor || DEFAULT_BANNER_BG }}
                    />
                    {bannerImage
                      ? (isAr ? 'لون + صورة' : 'Color + Image')
                      : (isAr ? 'لون فقط' : 'Color only')}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">{isAr ? 'قيمة الخصم:' : 'Discount:'}</span>
                  <span className="font-bold text-emerald-600">{discountPercentage}%</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">{isAr ? 'تاريخ البدء:' : 'Valid From:'}</span>
                  <span className="font-medium text-slate-600">{startDate.replace('T', ' ')}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">{isAr ? 'تاريخ الانتهاء:' : 'Valid To:'}</span>
                  <span className="font-medium text-slate-600">{endDate.replace('T', ' ')}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">{isAr ? 'الحالة:' : 'Status:'}</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معطل' : 'Inactive')}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Help Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                <HelpCircle className="w-4 h-4 text-blue-500" />
                <span>{isAr ? 'مساعدة سريعة' : 'Quick Help'}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isAr
                  ? 'العروض الخاصة تمنح متجرك مرونة كبيرة لتقديم عروض Buy X Get Y أو خصومات على منتجات مختارة لزيادة التفاعل.'
                  : 'Special offers allow targeted Buy X Get Y promotions or discounts on qualifying products to boost sales.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // LIST VIEW: Special Offers Table
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="u-page p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>{isAr ? 'العروض الترويجية والخاصة' : 'Special Promotional Offers'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? 'إدارة العروض الترويجية والخصومات الموجهة'
              : 'Manage promotional campaigns and targeted discounts'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetCreateForm();
            setViewMode('create');
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إنشاء عرض خاص جديد' : 'Create Special Offer'}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoadingList ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            {isAr ? 'جاري التحميل…' : 'Loading…'}
          </div>
        ) : offersList.length === 0 ? (
          <div className="py-16 text-center text-slate-400 p-6">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isAr ? 'لا توجد عروض ترويجية نشطة حالياً' : 'No Special Offers Configured Yet'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {isAr
                ? 'أنشئ عروضاً ترويجية مثل Buy 1 Get 1 أو خصومات المنتجات المحددة لزيادة المبيعات والتحويلات.'
                : 'Create promotional campaigns like Buy 1 Get 1 or product discounts to increase conversions.'}
            </p>
            <button
              type="button"
              onClick={() => {
                resetCreateForm();
                setViewMode('create');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              {isAr ? 'إنشاء أول عرض خاص' : 'Create First Special Offer'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-[11px] bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="py-3 px-4 text-start">{isAr ? 'العنوان' : 'Title'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'النوع' : 'Type'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'الخصم' : 'Discount'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-3 text-end">{isAr ? 'صالح حتى' : 'Valid Until'}</th>
                  <th className="py-3 px-4 text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {offersList.map((offer) => (
                  <tr key={offer.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-start font-bold">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden"
                          style={{ backgroundColor: offer.bannerBgColor || DEFAULT_BANNER_BG }}
                        >
                          {offer.bannerImage ? (
                            <img src={offer.bannerImage} alt="" className="w-full h-full object-cover" />
                          ) : null}
                        </span>
                        <span>{isAr ? (offer.titleAr || offer.titleEn) : (offer.titleEn || offer.titleAr)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-start">
                      {offer.offerType === 'percentage'
                        ? (isAr ? 'نسبة' : 'Percent')
                        : offer.offerType === 'fixed'
                          ? (isAr ? 'ثابت' : 'Fixed')
                          : offer.offerType}
                    </td>
                    <td className="py-3 px-3 text-start font-bold text-emerald-600">
                      {offer.discountValue}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        {offer.status === 'active'
                          ? (isAr ? 'نشط' : 'Active')
                          : offer.status === 'draft'
                            ? (isAr ? 'مسودة' : 'Draft')
                            : (isAr ? 'معطل' : 'Inactive')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-end text-slate-500">
                      {(offer.endDate || '').slice(0, 10) || '—'}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <button
                        type="button"
                        onClick={() => void handleDeleteOffer(offer.id)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
