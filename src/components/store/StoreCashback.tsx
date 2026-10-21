import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  Coins,
  Plus,
  ArrowLeft,
  Calendar,
  Save,
  CheckCircle2,
  Trash2,
  Wallet,
  Sparkles,
  Info,
  Check,
  Percent,
  Layers,
} from 'lucide-react';

interface StoreCashbackProps {
  onNavigateTab?: (tab: string) => void;
}

interface CashbackCampaign {
  id: string;
  storeId: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  minCartValue: number;
  maxCashbackPerOrder?: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'draft' | 'completed';
}

export const StoreCashback: React.FC<StoreCashbackProps> = ({ onNavigateTab }) => {
  const { activeStore } = useTenant();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');

  // Form states matching mockup
  const [campaignName, setCampaignName] = useState('10% Cashback on Bouquets');
  const [cashbackType, setCashbackType] = useState<'percentage' | 'fixed'>('percentage');
  const [cashbackValue, setCashbackValue] = useState('10');
  const [startDate, setStartDate] = useState('2026-10-18T10:00');
  const [endDate, setEndDate] = useState('2026-11-18T23:59');

  // Conditions
  const [enableMinCart, setEnableMinCart] = useState(true);
  const [minCartValue, setMinCartValue] = useState('200');
  const [enableMaxCashback, setEnableMaxCashback] = useState(true);
  const [maxCashback, setMaxCashback] = useState('50');

  // Campaigns list
  const [campaigns, setCampaigns] = useState<CashbackCampaign[]>([]);

  const handleSaveCampaign = (status: 'active' | 'draft' = 'active') => {
    const newCamp: CashbackCampaign = {
      id: `cb-${Date.now()}`,
      storeId: activeStore.id,
      name: campaignName,
      type: cashbackType,
      value: parseFloat(cashbackValue) || 10,
      minCartValue: enableMinCart ? parseFloat(minCartValue) || 0 : 0,
      maxCashbackPerOrder: enableMaxCashback ? parseFloat(maxCashback) || undefined : undefined,
      startDate,
      endDate,
      status,
    };

    setCampaigns([newCamp, ...campaigns]);
    toast(
      isAr
        ? `تم إنشاء حملة الكاش باك "${campaignName}" بنجاح`
        : `Cashback campaign "${campaignName}" created successfully`,
      'success'
    );
    setViewMode('list');
  };

  if (viewMode === 'create') {
    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100">
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
                ? 'استرداد نقدي فوري لمحفظة العميل عند إتمام الشراء لتشجيع الطلبات المتكررة.'
                : 'Reward customers with instant wallet credit upon purchase to boost retention.'}
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
              onClick={() => handleSaveCampaign('draft')}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
            >
              {isAr ? 'حفظ كمسودة' : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={() => handleSaveCampaign('active')}
              className="px-5 py-2 bg-[#0EA5A4] hover:bg-[#0c8f8e] text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isAr ? 'إطلاق الحملة' : 'Create Campaign'}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout matching mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Offer Preview & How It Works (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Live Voucher Preview */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-pink-500" />
                <span>{isAr ? 'معاينة العرض للعميل' : 'Offer Preview (Customer View)'}</span>
              </span>

              {/* Pink Voucher Card */}
              <div className="rounded-2xl p-5 text-slate-900 bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/40 dark:to-rose-950/60 shadow-md border border-pink-200 dark:border-pink-900/40 relative overflow-hidden">
                <span className="px-2 py-0.5 rounded-full bg-pink-200 dark:bg-pink-900/60 text-pink-800 dark:text-pink-200 text-[10px] font-black uppercase">
                  Cashback Offer
                </span>
                <div className="mt-4">
                  <div className="text-3xl font-black text-pink-700 dark:text-pink-300">
                    Get {cashbackValue}%
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                    back to your wallet
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    When you spend {minCartValue} SAR or more
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-pink-200 dark:border-pink-900/60 text-[10px] text-pink-800 dark:text-pink-300">
                  {isAr
                    ? 'سيتم إضافة الكاش باك إلى محفظتك تلقائياً بعد اكتمال الطلب.'
                    : 'The cashback will be added to your wallet after the order is completed.'}
                </div>
              </div>

              {/* How It Works Steps */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {isAr ? 'كيف يعمل الكاش باك؟' : 'How It Works'}
                </span>
                {[
                  { n: 1, textAr: 'أضف منتجات مؤهلة لسلة الشراء.', textEn: 'Add qualifying products to your cart.' },
                  { n: 2, textAr: 'أكمل عملية الشراء والدفع بنجاح.', textEn: 'Complete your purchase.' },
                  { n: 3, textAr: 'استلم رصيد الكاش باك فوراً في محفظتك.', textEn: 'Receive cashback in your wallet after completion.' },
                  { n: 4, textAr: 'استخدم رصيد المحفظة لخصم طلباتك القادمة.', textEn: 'Use your wallet balance on future orders.' },
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
          </div>

          {/* Right Column: Configuration Cards (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Basic Information */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
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
                  placeholder="e.g. 10% Cashback on Bouquets"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* Cashback Type Group */}
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
                    {isAr ? 'تاريخ ووقت البدء *' : 'Start Date & Time *'}
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
                    {isAr ? 'تاريخ ووقت الانتهاء *' : 'End Date & Time *'}
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

            {/* Card 2: Conditions */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'شروط استحقاق الكاش باك' : 'Conditions'}
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={enableMinCart}
                      onChange={(e) => setEnableMinCart(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
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
                      className="rounded text-teal-600 focus:ring-teal-500"
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
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>{isAr ? 'حملات الكاش باك' : 'Cashback Campaigns'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? `إدارة استرداد الأموال لمحفظة العملاء لمتجر ${activeStore.name}`
              : `Manage instant wallet cashback promotions for ${activeStore.name}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setViewMode('create')}
          className="px-4 py-2 bg-[#0EA5A4] hover:bg-[#0c8f8e] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إنشاء حملة كاش باك' : 'Create Cashback Campaign'}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="py-16 text-center text-slate-400 p-6">
            <Coins className="w-12 h-12 mx-auto mb-3 opacity-30 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isAr ? 'لا توجد حملات كاش باك نشطة حالياً' : 'No Cashback Campaigns Configured Yet'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {isAr
                ? 'كافئ عملاءك برصيد مباشر في محفظتهم لكل عملية شراء لتشجيعهم على تكرار التسوق.'
                : 'Reward repeat buyers with instant wallet credit for future store orders.'}
            </p>
            <button
              type="button"
              onClick={() => setViewMode('create')}
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
                  <th className="py-3 px-3 text-start">{isAr ? 'الحد الأدنى' : 'Min Spend'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4 text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-start font-bold">{c.name}</td>
                    <td className="py-3 px-3 text-start font-bold text-teal-600">{c.value}%</td>
                    <td className="py-3 px-3 text-start">{money(c.minCartValue)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <button
                        type="button"
                        onClick={() => setCampaigns(campaigns.filter((item) => item.id !== c.id))}
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
