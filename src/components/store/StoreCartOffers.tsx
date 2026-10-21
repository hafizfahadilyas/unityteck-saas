import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  ShoppingCart,
  Plus,
  ArrowLeft,
  Calendar,
  Globe,
  Smartphone,
  Check,
  CheckCircle2,
  HelpCircle,
  Percent,
  Clock,
  Layers,
  Save,
  Trash2,
  Pencil,
  Info,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { StoreCartInterceptTab } from './StoreCartInterceptTab';

interface StoreCartOffersProps {
  onNavigateTab?: (tab: string) => void;
}

interface CartOfferItem {
  id: string;
  storeId: string;
  titleAr: string;
  titleEn: string;
  calculationMethod: 'total_amount' | 'item_quantity' | 'tiered';
  discountMethod: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount: number;
  startDate: string;
  endDate: string;
  allowWithCoupon: boolean;
  channels: string[];
  status: 'active' | 'inactive';
}

export const StoreCartOffers: React.FC<StoreCartOffersProps> = ({ onNavigateTab }) => {
  const { activeStore } = useTenant();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [mainSection, setMainSection] = useState<'intercept' | 'rules'>('intercept');
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [activeStep, setActiveStep] = useState<number>(1);
  const [titleLang, setTitleLang] = useState<'ar' | 'en'>('en');

  // Form states matching reference screenshot
  const [titleEn, setTitleEn] = useState('20% Off Your Order');
  const [titleAr, setTitleAr] = useState('خصم 20% على طلبك');
  const [startDate, setStartDate] = useState('2026-10-18T10:00');
  const [endDate, setEndDate] = useState('2026-11-18T23:59');
  const [calculationMethod, setCalculationMethod] = useState<'total_amount' | 'item_quantity'>('total_amount');
  const [discountMethod, setDiscountMethod] = useState<'percentage' | 'fixed' | 'free_shipping'>('percentage');
  const [discountPercentage, setDiscountPercentage] = useState('20');
  const [maxDiscount, setMaxDiscount] = useState('100');
  const [minOrderAmount, setMinOrderAmount] = useState('200');
  const [allowWithCoupon, setAllowWithCoupon] = useState(true);

  // Channels
  const [channels, setChannels] = useState<string[]>(['browser']);
  const [offerStatus, setOfferStatus] = useState<boolean>(true);

  // Additional settings
  const [applyToAllCustomers, setApplyToAllCustomers] = useState(true);
  const [combineWithOtherOffers, setCombineWithOtherOffers] = useState(false);
  const [excludeCertainProducts, setExcludeCertainProducts] = useState(false);

  // Store cart offers state isolated by activeStore.id
  const [cartOffersList, setCartOffersList] = useState<CartOfferItem[]>([]);

  const handleToggleChannel = (ch: string) => {
    if (channels.includes(ch)) {
      setChannels(channels.filter((c) => c !== ch));
    } else {
      setChannels([...channels, ch]);
    }
  };

  const handleSaveOffer = () => {
    const newOffer: CartOfferItem = {
      id: `co-${Date.now()}`,
      storeId: activeStore.id,
      titleAr,
      titleEn,
      calculationMethod,
      discountMethod,
      discountValue: parseFloat(discountPercentage) || 0,
      maxDiscount: parseFloat(maxDiscount) || undefined,
      minOrderAmount: parseFloat(minOrderAmount) || 0,
      startDate,
      endDate,
      allowWithCoupon,
      channels,
      status: offerStatus ? 'active' : 'inactive',
    };

    setCartOffersList([newOffer, ...cartOffersList]);
    toast(
      isAr
        ? `تم حفظ وتفعيل عرض السلة "${isAr ? titleAr : titleEn}" بنجاح`
        : `Cart offer "${titleEn}" saved successfully`,
      'success'
    );
    setViewMode('list');
  };

  // ─────────────────────────────────────────────────────────────
  // 1ST-CLICK SMART CART INTERCEPT POPUPS & TRACKING TAB
  // ─────────────────────────────────────────────────────────────
  if (mainSection === 'intercept') {
    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100">
        {/* Top Section Nav Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setMainSection('intercept')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-blue-600 text-white shadow-xs shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isAr ? 'نوافذ التقاط السلة الذكية (الأولى بالنقرة)' : 'Smart Cart Intercept (1st-Click)'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMainSection('rules');
              setViewMode('list');
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isAr ? 'قواعد عروض السلة التلقائية' : 'Cart Offer Rules'}</span>
          </button>
        </div>

        <StoreCartInterceptTab />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CREATE CART OFFER VIEW (100% Matching Reference Screenshot)
  // ─────────────────────────────────────────────────────────────
  if (viewMode === 'create') {
    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{isAr ? 'العودة لعروض السلة' : 'Back to Cart Offers'}</span>
            </button>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'إنشاء عرض السلة' : 'Create Cart Offer'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'إعداد عرض تلقائي يعتمد على قيمة السلة أو كمية المنتجات، وتحديد شروط الكوبونات وقنوات النشر.'
                : 'Set up an offer based on cart subtotal or item quantity, configure benefits, validity period and channels.'}
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
              onClick={handleSaveOffer}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isAr ? 'حفظ العرض' : 'Save Offer'}</span>
            </button>
          </div>
        </div>

        {/* Stepper matching mockup */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-2xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-bold text-center">
            {[
              { num: 1, title: isAr ? 'تفاصيل العرض' : 'Offer Details' },
              { num: 2, title: isAr ? 'الشروط والكوبونات' : 'Conditions & Coupon' },
              { num: 3, title: isAr ? 'إعدادات النشر' : 'Publishing Settings' },
              { num: 4, title: isAr ? 'المراجعة' : 'Review' },
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

        {/* Form & Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Side: Offer Details, Publishing Channels, Additional Settings */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Offer Details */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'تفاصيل العرض' : 'Offer Details'}
              </h3>

              <div className="space-y-4">
                {/* Offer Title with Arabic/English tabs */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isAr ? 'عنوان العرض *' : 'Offer Title *'}
                    </label>
                    <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setTitleLang('ar')}
                        className={`px-2.5 py-0.5 text-[10px] font-bold ${
                          titleLang === 'ar' ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        Arabic
                      </button>
                      <button
                        type="button"
                        onClick={() => setTitleLang('en')}
                        className={`px-2.5 py-0.5 text-[10px] font-bold ${
                          titleLang === 'en' ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={titleLang === 'ar' ? titleAr : titleEn}
                    onChange={(e) => {
                      if (titleLang === 'ar') setTitleAr(e.target.value);
                      else setTitleEn(e.target.value);
                    }}
                    placeholder={titleLang === 'ar' ? 'خصم 20% على طلبك' : '20% Off Your Order'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                    <span>
                      {isAr
                        ? 'سيظهر هذا العنوان للعميل في واجهة المتجر حسب لغته المختارة.'
                        : 'The title will be displayed in the store in the selected language.'}
                    </span>
                    <span>{(titleLang === 'ar' ? titleAr : titleEn).length}/100</span>
                  </div>
                </div>

                {/* Dates & Times */}
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
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {isAr ? 'سيبدأ العرض تلقائياً في هذا الوقت.' : 'The offer will start at this date and time.'}
                    </span>
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
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {isAr ? 'سينتهي العرض في هذا الوقت.' : 'The offer will end at this date and time.'}
                    </span>
                  </div>
                </div>

                {/* Calculation Method & Discount Percentage */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'طريقة الاحتساب *' : 'Calculation Method *'}
                    </label>
                    <select
                      value={calculationMethod}
                      onChange={(e) => setCalculationMethod(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="total_amount">
                        {isAr ? 'إجمالي قيمة المشتريات' : 'Total Purchase Amount'}
                      </option>
                      <option value="item_quantity">
                        {isAr ? 'عدد المنتجات في السلة' : 'Item Quantity in Cart'}
                      </option>
                    </select>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {isAr ? 'اختر معيار أهلية السلة للاستفادة من العرض.' : 'Choose how to calculate offer eligibility.'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'طريقة الخصم *' : 'Discount Method *'}
                    </label>
                    <select
                      value={discountMethod}
                      onChange={(e) => setDiscountMethod(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="percentage">{isAr ? 'نسبة مئوية' : 'Percentage Discount'}</option>
                      <option value="fixed">{isAr ? 'مبلغ ثابت' : 'Fixed Amount'}</option>
                      <option value="free_shipping">{isAr ? 'شحن مجاني' : 'Free Shipping'}</option>
                    </select>
                  </div>
                </div>

                {/* Discount Percentage input & Max Discount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {isAr ? 'أدخل قيمة بين 1% و 100%.' : 'Enter a value between 1% and 100%.'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'الحد الأقصى للخصم (اختياري)' : 'Maximum Discount (Optional)'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={maxDiscount}
                        onChange={(e) => setMaxDiscount(e.target.value)}
                        placeholder="100"
                        className="w-full px-3.5 py-2.5 pe-12 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                      <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {isAr ? 'ر.س' : 'SAR'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Allow with Coupon Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isAr ? 'السماح بالدمج مع الكوبونات' : 'Allow with Coupon'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isAr ? 'السماح للعملاء باستخدام كود خصم إضافي مع هذا العرض.' : 'Let customers apply this offer with a coupon code.'}
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={allowWithCoupon}
                      onChange={(e) => setAllowWithCoupon(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Card 2: Publishing Channels */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'قنوات النشر' : 'Publishing Channels'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'حدد القنوات التي سيكون هذا العرض فعالاً عليها.' : 'Choose where this offer will be active.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'browser', icon: Globe, nameAr: 'متصفح المتجر', nameEn: 'Storefront Browser' },
                  { id: 'app', icon: Smartphone, nameAr: 'تطبيق المتجر', nameEn: 'Store Application' },
                  { id: 'both', icon: Layers, nameAr: 'المتصفح والتطبيق', nameEn: 'Both (Browser + App)' },
                  { id: 'cart_point', icon: ShoppingCart, nameAr: 'نقطة السلة', nameEn: 'Cart Point' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = channels.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleChannel(item.id)}
                      className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-semibold">{isAr ? item.nameAr : item.nameEn}</span>
                    </button>
                  );
                })}
              </div>

              {/* Offer Status Switch */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {isAr ? 'حالة العرض' : 'Offer Status'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {offerStatus
                      ? (isAr ? 'العرض نشط ومتاح للعملاء عند الحفظ.' : 'The offer will be available to customers after saving.')
                      : (isAr ? 'العرض معطل حالياً.' : 'The offer is currently disabled.')}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={offerStatus}
                    onChange={(e) => setOfferStatus(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

            {/* Card 3: Additional Settings */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                {isAr ? 'إعدادات إضافية' : 'Additional Settings'}
              </h3>

              <div className="space-y-2.5">
                {[
                  {
                    id: 'apply-all',
                    titleAr: 'تطبيق على جميع العملاء',
                    titleEn: 'Apply to all customers',
                    val: applyToAllCustomers,
                    set: setApplyToAllCustomers,
                  },
                  {
                    id: 'combine',
                    titleAr: 'الدمج مع عروض أخرى نشطة',
                    titleEn: 'Combine with other offers',
                    val: combineWithOtherOffers,
                    set: setCombineWithOtherOffers,
                  },
                  {
                    id: 'exclude-products',
                    titleAr: 'استثناء منتجات معينة من العرض',
                    titleEn: 'Exclude certain products',
                    val: excludeCertainProducts,
                    set: setExcludeCertainProducts,
                  },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {isAr ? item.titleAr : item.titleEn}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.val}
                        onChange={(e) => item.set(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Live Cart Offer Ticket Preview & Quick Help */}
          <div className="lg:col-span-4 space-y-6">
            {/* Live Offer Preview Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'معاينة عرض السلة' : 'Offer Preview'}</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  Live
                </span>
              </div>

              {/* Styled Voucher Card matching mockup */}
              <div className="rounded-2xl p-5 text-white bg-gradient-to-br from-[#0a5240] to-[#043327] shadow-lg relative overflow-hidden border border-emerald-700/50">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black uppercase">
                    Cart Offer
                  </span>
                </div>

                <div className="mt-4">
                  <div className="text-2xl font-black tracking-tight">
                    {discountPercentage}% OFF
                  </div>
                  <div className="text-xs text-emerald-100 font-medium">
                    {titleLang === 'ar' ? titleAr : titleEn}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-600/40 text-[10px] text-emerald-200">
                  {isAr ? 'يطبق تلقائياً على المنتجات المؤهلة في السلة' : 'Applies to eligible items in your cart'}
                </div>
              </div>

              {/* Summary Rows */}
              <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500">{isAr ? 'الحد الأدنى للطلب:' : 'Min. order amount:'}</span>
                  <span className="font-bold">{money(parseFloat(minOrderAmount) || 200)}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">{isAr ? 'نوع الخصم:' : 'Discount type:'}</span>
                  <span className="font-bold">{discountPercentage}% off</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">{isAr ? 'صالح من:' : 'Valid from:'}</span>
                  <span className="font-medium text-slate-600 dark:text-slate-400">{startDate.replace('T', ' ')}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">{isAr ? 'ينتهي في:' : 'Valid to:'}</span>
                  <span className="font-medium text-slate-600 dark:text-slate-400">{endDate.replace('T', ' ')}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">{isAr ? 'التوافق مع الكوبونات:' : 'Coupon compatibility:'}</span>
                  <span className="font-bold text-emerald-600">{allowWithCoupon ? (isAr ? 'مسموح' : 'Allowed') : (isAr ? 'غير مسموح' : 'Disabled')}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {isAr
                    ? 'سيتم تطبيق هذا العرض تلقائياً في صفحة السلة والدفع عند استيفاء العميل للشروط.'
                    : 'Offer will be applied automatically at checkout when conditions are met.'}
                </span>
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
                  ? 'تأكد من تكوين جميع الحقول المطلوبة، وتعيين التواريخ بدقة واختيار القنوات المناسبة لعرضك لضمان تحقيق أعلى نسبة تحويل.'
                  : 'Make sure to configure all required fields, set the correct dates and choose the appropriate channels for your offer.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // LIST VIEW: Cart Offers Overview
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100">
      {/* Top Section Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setMainSection('intercept')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{isAr ? 'نوافذ التقاط السلة الذكية (الأولى بالنقرة)' : 'Smart Cart Intercept (1st-Click)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setMainSection('rules')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-blue-600 text-white shadow-xs shrink-0"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{isAr ? 'قواعد عروض السلة التلقائية' : 'Cart Offer Rules'}</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>{isAr ? 'عروض السلة التلقائية' : 'Cart Offers'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? `إنشاء وإدارة عروض البيع التلقائي والخصم في السلة لمتجر ${activeStore.name}`
              : `Create and manage automated cart-level upsell rules for ${activeStore.name}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setViewMode('create')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إنشاء عرض سلة جديد' : 'Create Cart Offer'}</span>
        </button>
      </div>

      {/* Cart Offers Table or Real Empty State */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {cartOffersList.length === 0 ? (
          <div className="py-16 text-center text-slate-400 p-6">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isAr ? 'لا توجد عروض سلة نشطة حالياً' : 'No Cart Offers Configured Yet'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {isAr
                ? 'عروض السلة تزيد من متوسط قيمة الطلب (AOV) عن طريق تطبيق خصومات تلقائية عندما يصل العميل لحد معين.'
                : 'Cart offers boost average order value (AOV) by providing automated discounts when customer carts reach specific amounts.'}
            </p>
            <button
              type="button"
              onClick={() => setViewMode('create')}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              {isAr ? 'إنشاء أول عرض سلة' : 'Create First Cart Offer'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-[11px] bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="py-3 px-4 text-start">{isAr ? 'العنوان' : 'Title'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'الخصم' : 'Discount'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'الحد الأدنى' : 'Min Order'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-3 text-end">{isAr ? 'صالح حتى' : 'Valid Until'}</th>
                  <th className="py-3 px-4 text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cartOffersList.map((offer) => (
                  <tr key={offer.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-start font-bold">
                      {isAr ? offer.titleAr : offer.titleEn}
                    </td>
                    <td className="py-3 px-3 text-start font-bold text-emerald-600">
                      {offer.discountValue}%
                    </td>
                    <td className="py-3 px-3 text-start">
                      {money(offer.minOrderAmount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        {offer.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-end text-slate-500">
                      {offer.endDate.slice(0, 10)}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <button
                        type="button"
                        onClick={() => setCartOffersList(cartOffersList.filter((o) => o.id !== offer.id))}
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
