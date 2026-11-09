import React, { useCallback, useEffect, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  Coins,
  Plus,
  ArrowLeft,
  Save,
  Trash2,
  Wallet,
  Percent,
  Package,
  ShieldCheck,
  Clock,
  CalendarClock,
} from 'lucide-react';
import {
  createCashbackCampaignApi,
  deleteCashbackCampaignApi,
  fetchCashbackCampaignsApi,
  fetchProducts,
} from '../../api/tenantApi';
import type { CashbackCampaign } from '../../services/cashbackService';

interface StoreCashbackProps {
  onNavigateTab?: (tab: string) => void;
}

type ProductScope = 'all' | 'include' | 'exclude';

export const StoreCashback: React.FC<StoreCashbackProps> = ({ onNavigateTab }) => {
  const { activeStore } = useTenant();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [campaigns, setCampaigns] = useState<CashbackCampaign[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string; nameAr?: string }>>([]);

  const [campaignName, setCampaignName] = useState('');
  const [cashbackType, setCashbackType] = useState<'percentage' | 'fixed'>('percentage');
  const [cashbackValue, setCashbackValue] = useState('10');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [enableMinCart, setEnableMinCart] = useState(true);
  const [minCartValue, setMinCartValue] = useState('200');
  const [enableMaxCashback, setEnableMaxCashback] = useState(true);
  const [maxCashback, setMaxCashback] = useState('50');
  const [productScope, setProductScope] = useState<ProductScope>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [storeWalletOnly] = useState(true);
  const [creditExpiryDays, setCreditExpiryDays] = useState('30');
  const [enableExpiry, setEnableExpiry] = useState(true);
  const [holdDays, setHoldDays] = useState('7');

  const resetForm = () => {
    setCampaignName('');
    setCashbackType('percentage');
    setCashbackValue('10');
    setStartDate('');
    setEndDate('');
    setEnableMinCart(true);
    setMinCartValue('200');
    setEnableMaxCashback(true);
    setMaxCashback('50');
    setProductScope('all');
    setSelectedProductIds([]);
    setEnableExpiry(true);
    setCreditExpiryDays('30');
    setHoldDays('7');
  };

  const loadCampaigns = useCallback(async () => {
    if (!activeStore?.id) return;
    setIsLoading(true);
    try {
      const rows = await fetchCashbackCampaignsApi(activeStore.id);
      setCampaigns(rows);
    } catch {
      setCampaigns([]);
      toast(
        isAr ? 'تعذر تحميل حملات الكاش باك.' : 'Could not load cashback campaigns.',
        'error',
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeStore?.id, isAr, toast]);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    if (!activeStore?.id || viewMode !== 'create') return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchProducts(activeStore.id);
        if (cancelled) return;
        setProducts(
          (rows || []).map((p: any) => ({
            id: String(p.id),
            name: String(p.name || p.name_en || p.title || p.id),
            nameAr: p.name_ar || p.nameAr || undefined,
          })),
        );
      } catch {
        if (!cancelled) setProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeStore?.id, viewMode]);

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSaveCampaign = async (status: 'active' | 'draft' = 'active') => {
    if (!activeStore?.id) return;
    if (!campaignName.trim()) {
      toast(isAr ? 'اسم الحملة مطلوب.' : 'Campaign name is required.', 'error');
      return;
    }
    if (productScope !== 'all' && selectedProductIds.length === 0) {
      toast(
        isAr
          ? 'اختر منتجات مشمولة أو مستثناة، أو طبّق على المتجر كاملاً.'
          : 'Select included/excluded products, or apply to the whole store.',
        'error',
      );
      return;
    }

    setIsSaving(true);
    try {
      await createCashbackCampaignApi(activeStore.id, {
        name: campaignName.trim(),
        type: cashbackType,
        value: parseFloat(cashbackValue) || 0,
        min_cart_value: enableMinCart ? parseFloat(minCartValue) || 0 : 0,
        max_cashback_per_order: enableMaxCashback ? parseFloat(maxCashback) || null : null,
        start_date: startDate || null,
        end_date: endDate || null,
        status,
        product_scope: productScope,
        product_ids: productScope === 'all' ? [] : selectedProductIds,
        store_wallet_only: true,
        credit_expiry_days: enableExpiry ? Math.max(1, parseInt(creditExpiryDays, 10) || 30) : null,
        hold_days: Math.max(0, parseInt(holdDays, 10) || 0),
      });
      toast(
        isAr
          ? `تم حفظ حملة الكاش باك «${campaignName.trim()}»`
          : `Cashback campaign "${campaignName.trim()}" saved`,
        'success',
      );
      resetForm();
      setViewMode('list');
      await loadCampaigns();
    } catch {
      toast(
        isAr ? 'تعذر حفظ الحملة. تأكد من جداول الكاش باك على الخادم.' : 'Could not save campaign. Ensure cashback tables exist on the server.',
        'error',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!activeStore?.id) return;
    try {
      await deleteCashbackCampaignApi(activeStore.id, id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      toast(isAr ? 'تم حذف الحملة.' : 'Campaign deleted.', 'success');
    } catch {
      toast(isAr ? 'تعذر حذف الحملة.' : 'Could not delete campaign.', 'error');
    }
  };

  if (viewMode === 'create') {
    return (
      <div className="u-page p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{isAr ? 'العودة لحملات الكاش باك' : 'Back to Cashback'}</span>
            </button>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'إنشاء حملة كاش باك عصرية' : 'Create Cashback Campaign'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'رصيد الكاش باك يذهب لمحفظة هذا المتجر فقط، مع فترة حجز وصلاحية يحددها التاجر.'
                : 'Cashback credits this store’s wallet only, with configurable hold and expiry.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSaveCampaign('draft')}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold disabled:opacity-50"
            >
              {isAr ? 'حفظ كمسودة' : 'Save as Draft'}
            </button>
            <button
              type="button"
              disabled={isSaving}
              aria-busy={isSaving}
              onClick={() => void handleSaveCampaign('active')}
              className="px-5 py-2 bg-[#0EA5A4] hover:bg-[#0c8f8e] text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isAr ? 'إطلاق الحملة' : 'Create Campaign'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-4 flex">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 w-full h-full flex flex-col">
              <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-pink-500" />
                <span>{isAr ? 'معاينة العرض للعميل' : 'Offer Preview (Customer View)'}</span>
              </span>
              <div className="rounded-2xl p-5 text-slate-900 bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/40 dark:to-rose-950/60 shadow-md border border-pink-200 dark:border-pink-900/40 flex-1">
                <span className="px-2 py-0.5 rounded-full bg-pink-200 dark:bg-pink-900/60 text-pink-800 dark:text-pink-200 text-[10px] font-black uppercase">
                  {isAr ? 'عرض كاش باك' : 'Cashback Offer'}
                </span>
                <div className="mt-4">
                  <div className="text-3xl font-black text-pink-700 dark:text-pink-300">
                    {cashbackType === 'percentage'
                      ? (isAr ? `احصل على ${cashbackValue}%` : `Get ${cashbackValue}%`)
                      : (isAr ? `احصل على ${cashbackValue} ر.س` : `Get ${cashbackValue} SAR`)}
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                    {isAr ? 'إلى محفظة هذا المتجر' : 'back to this store’s wallet'}
                  </div>
                  {enableMinCart && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {isAr
                        ? `عند إنفاق ${minCartValue} ر.س أو أكثر`
                        : `When you spend ${minCartValue} SAR or more`}
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-pink-200 dark:border-pink-900/60 text-[10px] text-pink-800 dark:text-pink-300">
                  {isAr
                    ? `يظهر الرصيد بعد التوصيل + ${holdDays} يوم حجز${enableExpiry ? `، وينتهي بعد ${creditExpiryDays} يوماً` : ''}.`
                    : `Credit appears after delivery + ${holdDays}-day hold${enableExpiry ? `, expires in ${creditExpiryDays} days` : ''}.`}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 flex">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 w-full h-full flex flex-col">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'المعلومات الأساسية' : 'Basic Information'}
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'اسم الحملة *' : 'Campaign Name *'}
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder={isAr ? 'مثال: كاش باك ١٠٪ على الطلب' : 'e.g. 10% Cashback on Order'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCashbackType('percentage')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    cashbackType === 'percentage'
                      ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Percent className="w-4 h-4 mx-auto mb-1 text-teal-600" />
                  <span className="text-xs">{isAr ? 'نسبة مئوية من الطلب' : 'Percentage Cashback'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCashbackType('fixed')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    cashbackType === 'fixed'
                      ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Coins className="w-4 h-4 mx-auto mb-1 text-teal-600" />
                  <span className="text-xs">{isAr ? 'مبلغ ثابت لكل طلب' : 'Fixed Amount Cashback'}</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'قيمة الكاش باك *' : 'Cashback Value *'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={cashbackValue}
                      onChange={(e) => setCashbackValue(e.target.value)}
                      className="w-full px-3.5 py-2.5 pe-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {cashbackType === 'percentage' ? '%' : (isAr ? 'ر.س' : 'SAR')}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'تاريخ ووقت البدء' : 'Start Date & Time'}
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'تاريخ ووقت الانتهاء' : 'End Date & Time'}
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-teal-600" />
            <span>{isAr ? 'المنتجات المشمولة / المستثناة' : 'Included / Excluded Products'}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {([
              { id: 'all' as const, ar: 'المتجر كاملاً', en: 'Whole store' },
              { id: 'include' as const, ar: 'منتجات مشمولة فقط', en: 'Included products only' },
              { id: 'exclude' as const, ar: 'استثناء منتجات', en: 'Exclude products' },
            ]).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setProductScope(opt.id)}
                className={`p-2.5 rounded-xl border text-xs font-semibold ${
                  productScope === opt.id
                    ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {isAr ? opt.ar : opt.en}
              </button>
            ))}
          </div>
          {productScope !== 'all' && (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
              {products.length === 0 ? (
                <div className="p-3 text-xs text-slate-400">
                  {isAr ? 'لا توجد منتجات في هذا المتجر.' : 'No products found for this store.'}
                </div>
              ) : (
                products.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(p.id)}
                      onChange={() => toggleProduct(p.id)}
                      className="rounded text-teal-600"
                    />
                    <span className="font-semibold">
                      {isAr ? (p.nameAr || p.name) : p.name}
                    </span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* How It Works + Conditions — equal height row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs h-full flex flex-col">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              {isAr ? 'كيف يعمل الكاش باك؟' : 'How It Works'}
            </h3>
            <div className="space-y-3 flex-1">
              {[
                {
                  n: 1,
                  textAr: 'أضف منتجات مؤهلة لسلة الشراء.',
                  textEn: 'Add qualifying products to your cart.',
                },
                {
                  n: 2,
                  textAr: 'أكمل عملية الشراء والدفع بنجاح.',
                  textEn: 'Complete your purchase.',
                },
                {
                  n: 3,
                  textAr: 'استلم رصيد الكاش باك في محفظة هذا المتجر بعد اكتمال الطلب.',
                  textEn: 'Receive cashback in your wallet after completion.',
                },
                {
                  n: 4,
                  textAr: 'استخدم رصيد المحفظة لخصم طلباتك القادمة في نفس المتجر.',
                  textEn: 'Use your wallet balance on future orders.',
                },
              ].map((s) => (
                <div key={s.n} className="flex items-start gap-2.5 text-xs">
                  <span className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {s.n}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {isAr ? s.textAr : s.textEn}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs h-full flex flex-col">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              {isAr ? 'شروط الاستحقاق والمحفظة' : 'Conditions'}
            </h3>
            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={enableMinCart}
                    onChange={(e) => setEnableMinCart(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>{isAr ? 'الحد الأدنى لقيمة السلة' : 'Minimum cart value'}</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    disabled={!enableMinCart}
                    value={minCartValue}
                    onChange={(e) => setMinCartValue(e.target.value)}
                    className="w-24 px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border rounded-lg font-bold disabled:opacity-40"
                  />
                  <span className="text-xs text-slate-400">{isAr ? 'ر.س' : 'SAR'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={enableMaxCashback}
                    onChange={(e) => setEnableMaxCashback(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>{isAr ? 'أقصى رصيد كاش باك لكل طلب' : 'Maximum cashback amount per order'}</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    disabled={!enableMaxCashback}
                    value={maxCashback}
                    onChange={(e) => setMaxCashback(e.target.value)}
                    className="w-24 px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border rounded-lg font-bold disabled:opacity-40"
                  />
                  <span className="text-xs text-slate-400">{isAr ? 'ر.س' : 'SAR'}</span>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                <div className="flex items-start gap-2 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold text-emerald-800 dark:text-emerald-200">
                      {isAr ? 'محفظة المتجر الحصرية' : 'Store Wallet Only'}
                    </div>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                      {isAr
                        ? 'الكاش باك يُضاف فقط لمحفظة العميل في هذا المتجر، ولا يمكن استخدامه في متاجر أخرى بالمنصة.'
                        : 'Cashback credits only this store’s customer wallet and cannot be spent at other platform stores.'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 shrink-0">
                  {storeWalletOnly ? (isAr ? 'مفعّل' : 'On') : (isAr ? 'متوقف' : 'Off')}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isAr ? 'وقت تفعيل الرصيد (أيام الحجز بعد التوصيل)' : 'Hold / maturation days after delivery'}</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={holdDays}
                  onChange={(e) => setHoldDays(e.target.value)}
                  className="w-24 px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border rounded-lg font-bold"
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={enableExpiry}
                    onChange={(e) => setEnableExpiry(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isAr ? 'مدة صلاحية الرصيد (أيام)' : 'Cashback credit expiry (days)'}</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  disabled={!enableExpiry}
                  value={creditExpiryDays}
                  onChange={(e) => setCreditExpiryDays(e.target.value)}
                  className="w-24 px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border rounded-lg font-bold disabled:opacity-40"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="u-page p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>{isAr ? 'حملات الكاش باك' : 'Cashback Campaigns'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? 'إدارة استرداد الأموال لمحفظة عملاء هذا المتجر فقط'
              : 'Manage wallet cashback for this store only'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setViewMode('create');
          }}
          className="px-4 py-2 bg-[#0EA5A4] hover:bg-[#0c8f8e] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إنشاء حملة كاش باك' : 'Create Cashback Campaign'}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            {isAr ? 'جارٍ التحميل...' : 'Loading...'}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-16 text-center text-slate-400 p-6">
            <Coins className="w-12 h-12 mx-auto mb-3 opacity-30 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isAr ? 'لا توجد حملات كاش باك' : 'No records found'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {isAr
                ? 'أنشئ حملة لصرف كاش باك إلى محفظة هذا المتجر بعد التوصيل وفترة الحجز.'
                : 'Create a campaign to credit this store’s wallet after delivery and hold period.'}
            </p>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setViewMode('create');
              }}
              className="mt-4 px-4 py-2 bg-[#0EA5A4] hover:bg-[#0c8f8e] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              {isAr ? 'إنشاء أول حملة كاش باك' : 'Create First Campaign'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-[11px] bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="py-3 px-4 text-start">{isAr ? 'اسم الحملة' : 'Campaign Name'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'قيمة الكاش باك' : 'Cashback'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'المنتجات' : 'Products'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'الحجز / الصلاحية' : 'Hold / Expiry'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4 text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-start font-bold">{c.name}</td>
                    <td className="py-3 px-3 text-start font-bold text-teal-600">
                      {c.type === 'fixed'
                        ? money(Number(c.value))
                        : `${c.value}%`}
                    </td>
                    <td className="py-3 px-3 text-start">
                      {(c.productScope || 'all') === 'all'
                        ? (isAr ? 'الكل' : 'All')
                        : c.productScope === 'include'
                          ? (isAr ? `مشمول (${(c.productIds || []).length})` : `Include (${(c.productIds || []).length})`)
                          : (isAr ? `مستثنى (${(c.productIds || []).length})` : `Exclude (${(c.productIds || []).length})`)}
                    </td>
                    <td className="py-3 px-3 text-start">
                      {c.holdDays ?? 7}d
                      {c.creditExpiryDays != null ? ` / ${c.creditExpiryDays}d` : (isAr ? ' / بدون انتهاء' : ' / none')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <button
                        type="button"
                        onClick={() => void handleDelete(c.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
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
