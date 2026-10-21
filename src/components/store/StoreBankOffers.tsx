import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  CreditCard,
  Plus,
  ArrowLeft,
  Calendar,
  Save,
  CheckCircle2,
  Trash2,
  Info,
  Layers,
  Sparkles,
  Building,
  Percent,
  Coins,
  ChevronRight,
  Eye,
} from 'lucide-react';

interface StoreBankOffersProps {
  onNavigateTab?: (tab: string) => void;
}

interface BankOfferItem {
  id: string;
  storeId: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  triggerType: 'cart_value' | 'item_count';
  triggerValue: number;
  bankName: string;
  paymentMethod: string;
  status: 'active' | 'draft' | 'expired';
  startDate: string;
  endDate: string;
}

export const StoreBankOffers: React.FC<StoreBankOffersProps> = ({ onNavigateTab }) => {
  const { activeStore } = useTenant();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [activeStep, setActiveStep] = useState(1);

  // Form states matching reference mockup
  const [offerName, setOfferName] = useState('50% Off with Al Rajhi Bank');
  const [offerDescription, setOfferDescription] = useState(
    'Get 50% off when you pay using Al Rajhi Bank cards. The discount is applied automatically at checkout.'
  );
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('50');
  const [triggerType, setTriggerType] = useState<'cart_value' | 'item_count'>('cart_value');
  const [minCartValue, setMinCartValue] = useState('200');
  const [selectedBank, setSelectedBank] = useState('Al Rajhi Bank');
  const [paymentMethod, setPaymentMethod] = useState('Credit Cards');
  const [previewTab, setPreviewTab] = useState<'checkout' | 'banner' | 'dark' | 'transparent'>('checkout');

  // Multi-tenant isolated bank offers list
  const [bankOffers, setBankOffers] = useState<BankOfferItem[]>([]);

  const handleSaveOffer = (status: 'active' | 'draft' = 'active') => {
    const newOffer: BankOfferItem = {
      id: `bo-${Date.now()}`,
      storeId: activeStore.id,
      name: offerName,
      description: offerDescription,
      discountType,
      discountValue: parseFloat(discountValue) || 10,
      triggerType,
      triggerValue: parseFloat(minCartValue) || 100,
      bankName: selectedBank,
      paymentMethod,
      status,
      startDate: '2026-10-18',
      endDate: '2026-11-18',
    };

    setBankOffers([newOffer, ...bankOffers]);
    toast(
      isAr
        ? `تم حفظ وتفعيل العرض البنكي "${offerName}" بنجاح`
        : `Bank offer "${offerName}" saved successfully`,
      'success'
    );
    setViewMode('list');
  };

  if (viewMode === 'create') {
    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <button type="button" onClick={() => setViewMode('list')} className="hover:text-teal-600">
                {isAr ? 'العروض' : 'Offers'}
              </button>
              <span>›</span>
              <span>{isAr ? 'العروض البنكية التلقائية' : 'Automatic Cart Offers'}</span>
              <span>›</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {isAr ? 'إنشاء جديد' : 'Create New'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'إنشاء عرض بنكي تلقائي' : 'Create New Automatic Offer'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'امنح عملاءك خصماً تلقائياً عند الدفع ببطاقات بنوك محددة دون الحاجة لإدخال كود.'
                : 'Give your customers a discount automatically at checkout (no code required).'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSaveOffer('draft')}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              {isAr ? 'حفظ كمسودة' : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={() => handleSaveOffer('active')}
              className="px-5 py-2 bg-[#0EA5A4] hover:bg-[#0c8f8e] text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isAr ? 'تفعيل العرض' : 'Create Offer'}</span>
            </button>
          </div>
        </div>

        {/* 3-Column Layout: Left Steps, Middle Form, Right Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Vertical Stepper List (3 cols) */}
          <div className="lg:col-span-3 space-y-2 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            {[
              { num: 1, titleAr: 'تفاصيل العرض', titleEn: 'Offer Details', descAr: 'المعلومات الأساسية', descEn: 'Set the basic information' },
              { num: 2, titleAr: 'نوع الخصم', titleEn: 'Discount Type', descAr: 'تحديد قيمة الخصم', descEn: 'Choose the discount value' },
              { num: 3, titleAr: 'شروط التفعيل', titleEn: 'Trigger Condition', descAr: 'متى يطبق العرض', descEn: 'Set when the offer applies' },
              { num: 4, titleAr: 'البنك والدفع', titleEn: 'Bank & Payment', descAr: 'البنك وطريقة الدفع', descEn: 'Select bank and card types' },
              { num: 5, titleAr: 'فترة الصلاحية', titleEn: 'Validity Period', descAr: 'البدء والانتهاء', descEn: 'Set start and end date' },
            ].map((step) => (
              <button
                key={step.num}
                type="button"
                onClick={() => setActiveStep(step.num)}
                className={`w-full text-start p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
                  activeStep === step.num
                    ? 'bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 shadow-2xs'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    activeStep === step.num ? 'bg-[#0EA5A4] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {step.num}
                </span>
                <div>
                  <div className="text-xs font-bold">{isAr ? step.titleAr : step.titleEn}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">{isAr ? step.descAr : step.descEn}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Center Form Section (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Card 1: Offer Details */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-teal-600" />
                <span>{isAr ? 'تفاصيل العرض' : 'Offer Details'}</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'اسم العرض *' : 'Offer Name *'}
                </label>
                <input
                  type="text"
                  value={offerName}
                  onChange={(e) => setOfferName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'وصف العرض (اختياري)' : 'Offer Description (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={offerDescription}
                  onChange={(e) => setOfferDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Card 2: Discount Type */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Percent className="w-4 h-4 text-teal-600" />
                <span>{isAr ? 'نوع وقيمة الخصم' : 'Discount Type'}</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    discountType === 'percentage'
                      ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Percent className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs">{isAr ? 'نسبة مئوية' : 'Percentage'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    discountType === 'fixed'
                      ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Coins className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs">{isAr ? 'مبلغ ثابت' : 'Fixed Amount'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'قيمة الخصم *' : 'Discount Percentage *'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 pe-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {discountType === 'percentage' ? '%' : (isAr ? 'ر.س' : 'SAR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Trigger Condition */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-teal-600" />
                <span>{isAr ? 'شرط التفعيل التلقائي' : 'Trigger Condition'}</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'الحد الأدنى لقيمة السلة (ر.س) *' : 'Minimum Cart Value (SAR) *'}
                </label>
                <input
                  type="number"
                  value={minCartValue}
                  onChange={(e) => setMinCartValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'البنك المشارك *' : 'Participating Bank *'}
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="Al Rajhi Bank">Al Rajhi Bank (مصرف الراجحي)</option>
                    <option value="SNB">SNB (البنك الأهلي السعودي)</option>
                    <option value="Riyad Bank">Riyad Bank (بنك الرياض)</option>
                    <option value="Alinma Bank">Alinma Bank (مصرف الإنماء)</option>
                    <option value="Banque Saudi Fransi">Banque Saudi Fransi (البنك السعودي الفرنسي)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'طرق الدفع المدعومة *' : 'Supported Payment Methods *'}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="Credit Cards">Credit Cards (البطاقات الائتمانية)</option>
                    <option value="Mada">Mada (مدى)</option>
                    <option value="Apple Pay">Apple Pay</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Visual Offer Preview & Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-teal-600" />
                <span>{isAr ? 'معاينة العرض البنكي' : 'Offer Preview'}</span>
              </span>

              {/* Visual Card Banner matching reference image */}
              <div className="rounded-2xl p-5 text-white bg-gradient-to-br from-[#0EA5A4] to-[#043327] shadow-lg relative overflow-hidden border border-teal-500/40">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase">
                  Special Offer
                </span>
                <div className="mt-3">
                  <div className="text-3xl font-black">{discountValue}% OFF</div>
                  <div className="text-xs text-teal-100 font-medium mt-0.5">
                    When you pay using {selectedBank} cards
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/20 text-[10px] text-teal-200 flex items-center justify-between">
                  <span>{isAr ? 'يطبق تلقائياً عند الدفع' : 'Automatically applied at checkout'}</span>
                  <span className="font-bold">Min: {minCartValue} SAR</span>
                </div>
              </div>

              {/* Offer Summary */}
              <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500">{isAr ? 'البنك:' : 'Bank:'}</span>
                  <span className="font-bold">{selectedBank}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">{isAr ? 'طريقة الدفع:' : 'Payment:'}</span>
                  <span className="font-bold">{paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">{isAr ? 'الحد الأدنى:' : 'Trigger:'}</span>
                  <span className="font-bold">{minCartValue} SAR</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">{isAr ? 'الحالة:' : 'Status:'}</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{isAr ? 'نشط' : 'Active'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // LIST VIEW: Bank Offers Overview
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <span>{isAr ? 'عروض البنوك والشراكات' : 'Bank Offers'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? `إدارة عروض الخصم التلقائي مع البنوك السعودية لمتجر ${activeStore.name}`
              : `Manage automated bank partnership discounts for ${activeStore.name}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setViewMode('create')}
          className="px-4 py-2 bg-[#0EA5A4] hover:bg-[#0c8f8e] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إنشاء عرض بنكي جديد' : 'Create Bank Offer'}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {bankOffers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 p-6">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isAr ? 'لا توجد عروض بنكية نشطة حالياً' : 'No Bank Offers Configured Yet'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {isAr
                ? 'أنشئ عروضاً تلقائية بالتعاون مع البنوك (مثل مصرف الراجحي أو الأهلي) لجذب عملاء إضافيين بخصومات تلقائية عند الدفع ببطاقاتهم.'
                : 'Create automatic discounts for customers paying with partner banks like Al Rajhi or SNB.'}
            </p>
            <button
              type="button"
              onClick={() => setViewMode('create')}
              className="mt-4 px-4 py-2 bg-[#0EA5A4] hover:bg-[#0c8f8e] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              {isAr ? 'إنشاء أول عرض بنكي' : 'Create First Bank Offer'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-[11px] bg-slate-50/50 dark:bg-slate-800/40">
                  <th className="py-3 px-4 text-start">{isAr ? 'اسم العرض' : 'Offer Name'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'البنك' : 'Bank'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'الخصم' : 'Discount'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4 text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bankOffers.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-start font-bold">{o.name}</td>
                    <td className="py-3 px-3 text-start">{o.bankName}</td>
                    <td className="py-3 px-3 text-start font-bold text-teal-600">{o.discountValue}%</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <button
                        type="button"
                        onClick={() => setBankOffers(bankOffers.filter((b) => b.id !== o.id))}
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
