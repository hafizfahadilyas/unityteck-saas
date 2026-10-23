import React from 'react';
import {
  Calendar,
  CreditCard,
  Truck,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  Globe,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';

export type DateRangePreset =
  | 'all'
  | 'today'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'custom';

export type FilterPaymentStatus =
  | 'all'
  | 'Paid'
  | 'Pending Payment'
  | 'Payment Failed'
  | 'Refunded'
  | 'Partially Refunded';

export type FilterShippingStatus =
  | 'all'
  | 'Not Shipped'
  | 'Ready to Ship'
  | 'Handed to Carrier'
  | 'In Transit'
  | 'Delivered'
  | 'Delivery Failed'
  | 'Delayed';

export interface OrderFilterState {
  datePreset: DateRangePreset;
  startDate: string;
  endDate: string;
  paymentStatus: FilterPaymentStatus;
  shippingStatus: FilterShippingStatus;
  paymentMethod?: string;
  orderSource?: string;
  status?: string;
}

export interface OrderFiltersProps {
  filters: OrderFilterState;
  onChange: (filters: OrderFilterState) => void;
  onReset: () => void;
  isOpen?: boolean;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  filters,
  onChange,
  onReset,
  isOpen = true,
}) => {
  const { locale, dir } = usePrefs();
  const isAr = locale === 'ar';

  if (!isOpen) return null;

  const datePresetOptions: { value: DateRangePreset; label: string }[] = [
    { value: 'all', label: isAr ? 'جميع التواريخ' : 'All Dates' },
    { value: 'today', label: isAr ? 'اليوم' : 'Today' },
    { value: 'last_7_days', label: isAr ? 'آخر 7 أيام' : 'Last 7 Days' },
    { value: 'last_30_days', label: isAr ? 'آخر 30 يوماً' : 'Last 30 Days' },
    { value: 'this_month', label: isAr ? 'هذا الشهر' : 'This Month' },
    { value: 'custom', label: isAr ? 'فترة مخصصة' : 'Custom Date Range' },
  ];

  const paymentStatusOptions: { value: FilterPaymentStatus; label: string }[] = [
    { value: 'all', label: isAr ? 'جميع حالات الدفع' : 'All Payment Statuses' },
    { value: 'Paid', label: isAr ? 'مدفوع' : 'Paid' },
    { value: 'Pending Payment', label: isAr ? 'بانتظار الدفع' : 'Pending Payment' },
    { value: 'Payment Failed', label: isAr ? 'فشلت عملية الدفع' : 'Payment Failed' },
    { value: 'Refunded', label: isAr ? 'مسترجع' : 'Refunded' },
    { value: 'Partially Refunded', label: isAr ? 'مسترجع جزئياً' : 'Partially Refunded' },
  ];

  const shippingStatusOptions: { value: FilterShippingStatus; label: string }[] = [
    { value: 'all', label: isAr ? 'جميع حالات الشحن والتوصيل' : 'All Shipping Statuses' },
    { value: 'Not Shipped', label: isAr ? 'لم يتم الشحن' : 'Not Shipped' },
    { value: 'Ready to Ship', label: isAr ? 'جاهز للشحن' : 'Ready to Ship' },
    { value: 'Handed to Carrier', label: isAr ? 'تم التسليم لشركة الشحن' : 'Handed to Carrier' },
    { value: 'In Transit', label: isAr ? 'قيد النقل والتوصيل' : 'In Transit' },
    { value: 'Delivered', label: isAr ? 'تم التوصيل بنجاح' : 'Delivered' },
    { value: 'Delivery Failed', label: isAr ? 'تعذر التوصيل' : 'Delivery Failed' },
    { value: 'Delayed', label: isAr ? 'متأخر' : 'Delayed' },
  ];

  const handleUpdate = <K extends keyof OrderFilterState>(
    key: K,
    value: OrderFilterState[K]
  ) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const activeFiltersCount = [
    filters.datePreset !== 'all',
    filters.paymentStatus !== 'all',
    filters.shippingStatus !== 'all',
    filters.paymentMethod && filters.paymentMethod !== 'all',
    filters.orderSource && filters.orderSource !== 'all',
  ].filter(Boolean).length;

  return (
    <div
      dir={dir}
      className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shadow-xs space-y-4 animate-in fade-in duration-150"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {isAr ? 'فلاتر الطلبات المتقدمة' : 'Additional Order Filters'}
          </span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
              {activeFiltersCount} {isAr ? 'نشط' : 'active'}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* ── 1. ORDER DATE FILTER ── */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{isAr ? 'تاريخ الطلب' : 'Order Date'}</span>
          </label>
          <div className="relative">
            <select
              value={filters.datePreset}
              onChange={(e) =>
                handleUpdate('datePreset', e.target.value as DateRangePreset)
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none cursor-pointer pe-8 font-medium"
            >
              {datePresetOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Conditional Date Pickers for Custom Range */}
          {filters.datePreset === 'custom' && (
            <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in duration-100">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                  {isAr ? 'من تاريخ' : 'From Date'}
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleUpdate('startDate', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                  {isAr ? 'إلى تاريخ' : 'To Date'}
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleUpdate('endDate', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── 2. PAYMENT STATUS FILTER ── */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
            <span>{isAr ? 'حالة الدفع' : 'Payment Status'}</span>
          </label>
          <div className="relative">
            <select
              value={filters.paymentStatus}
              onChange={(e) =>
                handleUpdate('paymentStatus', e.target.value as FilterPaymentStatus)
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none cursor-pointer pe-8 font-medium"
            >
              {paymentStatusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* ── 3. SHIPPING STATUS FILTER ── */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            <span>{isAr ? 'حالة الشحن والتوصيل' : 'Shipping Status'}</span>
          </label>
          <div className="relative">
            <select
              value={filters.shippingStatus}
              onChange={(e) =>
                handleUpdate('shippingStatus', e.target.value as FilterShippingStatus)
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none cursor-pointer pe-8 font-medium"
            >
              {shippingStatusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* ── 4. PAYMENT METHOD ── */}
        {filters.paymentMethod !== undefined && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAr ? 'طريقة الدفع' : 'Payment Method'}</span>
            </label>
            <div className="relative">
              <select
                value={filters.paymentMethod}
                onChange={(e) => handleUpdate('paymentMethod', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none cursor-pointer pe-8 font-medium"
              >
                <option value="all">{isAr ? 'كافة طرق الدفع' : 'All Payment Methods'}</option>
                <optgroup label={isAr ? 'البطاقات البنكية والدفع الإلكتروني' : 'Bank Cards & Electronic Payments'}>
                  <option value="mada">{isAr ? 'مدى' : 'Mada'}</option>
                  <option value="visa">{isAr ? 'فيزا' : 'Visa'}</option>
                  <option value="mastercard">{isAr ? 'ماستركارد' : 'Mastercard'}</option>
                  <option value="apple">{isAr ? 'أبل باي' : 'Apple Pay'}</option>
                </optgroup>
                <optgroup label={isAr ? 'المحافظ الرقمية' : 'Digital Wallets'}>
                  <option value="stc">{isAr ? 'اس تي سي باي' : 'STC Pay'}</option>
                  <option value="paypal">{isAr ? 'باي بال' : 'PayPal'}</option>
                  <option value="googlepay">{isAr ? 'جوجل باي' : 'Google Pay'}</option>
                </optgroup>
                <optgroup label={isAr ? 'اشتري الآن وادفع لاحقاً والتقسيط' : 'BNPL & Installments'}>
                  <option value="tabby">{isAr ? 'تابي' : 'Tabby'}</option>
                  <option value="tamara">{isAr ? 'تمارا' : 'Tamara'}</option>
                  <option value="mispay">{isAr ? 'مسباي' : 'Mispay'}</option>
                  <option value="madfooat">{isAr ? 'مدفوعات' : 'Madfooat'}</option>
                  <option value="emkan">{isAr ? 'إمكان' : 'Emkan'}</option>
                </optgroup>
                <optgroup label={isAr ? 'طرق دفع أخرى' : 'Other Payment Methods'}>
                  <option value="bank">{isAr ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                  <option value="cash">{isAr ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</option>
                </optgroup>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* ── 5. ORDER SOURCE / SALES CHANNEL ── */}
        {filters.orderSource !== undefined && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAr ? 'قناة البيع / المصدر' : 'Sales Channel / Source'}</span>
            </label>
            <div className="relative">
              <select
                value={filters.orderSource}
                onChange={(e) => handleUpdate('orderSource', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none cursor-pointer pe-8 font-medium"
              >
                <option value="all">{isAr ? 'كافة القنوات' : 'All Channels'}</option>
                <option value="Instagram">Instagram</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Direct Visits">{isAr ? 'زيارات مباشرة' : 'Direct Visits'}</option>
                <option value="TikTok">TikTok</option>
                <option value="Snapchat">Snapchat</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Facebook">Facebook</option>
                <option value="X">{isAr ? 'إكس (تويتر سابقاً)' : 'X (formerly Twitter)'}</option>
                <option value="YouTube">YouTube</option>
                <option value="Email Marketing">{isAr ? 'البريد الإلكتروني' : 'Email Marketing'}</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default OrderFilters;
