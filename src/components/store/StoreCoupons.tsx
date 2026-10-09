import React, { useEffect, useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { Tag, Plus, X, ChevronLeft, ChevronRight, Percent, Sparkles, TrendingUp, Download, Trash2 } from 'lucide-react';
import { StoreOfferPromo } from './StoreOfferPromo';

interface StoreCouponsProps {
  onViewStorefront?: () => void;
}

export const StoreCoupons: React.FC<StoreCouponsProps> = ({ onViewStorefront }) => {
  const { activeStore, currentCoupons, addCoupon, toggleCouponStatus, deleteCoupon } = useTenant();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [showAddModal, setShowAddModal] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('15');
  const [minOrder, setMinOrder] = useState('300');
  const [maxUsage, setMaxUsage] = useState('500');
  const [validUntil, setValidUntil] = useState('2026-12-31');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize, activeStore.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return currentCoupons.filter((c) => {
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchSearch = !q || c.code.toLowerCase().includes(q);
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

  const statusLabel = (s: string) =>
    s === 'active' ? (isAr ? 'نشط' : 'active') : s === 'expired' ? (isAr ? 'منتهي' : 'expired') : s;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const finalCode = code.toUpperCase().replace(/\s+/g, '');
    addCoupon({
      code: finalCode,
      discountType,
      discountValue: parseFloat(discountValue) || 10,
      minOrderValue: parseFloat(minOrder) || 100,
      maxUsage: parseInt(maxUsage, 10) || 100,
      status: 'active',
      validUntil,
    });

    toast(isAr ? `تم إنشاء الكوبون ${finalCode}` : `Coupon ${finalCode} created`, 'success');
    setShowAddModal(false);
    setCode('');
  };

  /** Export the currently filtered coupons as a CSV file. */
  const exportCsv = () => {
    if (filtered.length === 0) {
      toast(isAr ? 'لا توجد كوبونات للتصدير' : 'No coupons to export', 'info');
      return;
    }
    const header = ['Code', 'Type', 'Value', 'Min Order', 'Usage', 'Max Usage', 'Status', 'Valid Until'];
    const rows = filtered.map((c) => [
      c.code,
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

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isAr ? 'الكوبونات والخصومات' : 'Coupons & Discounts'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAr
              ? `إدارة أكواد الخصم الترويجية لمتجر ${activeStore.name}`
              : `Manage promotional discount codes for ${activeStore.name}`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={exportCsv}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إنشاء كود خصم' : 'Create Coupon Code'}</span>
          </button>
        </div>
      </div>

      {/* 4 Soft Pastel KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-blue-50/70 hover:bg-blue-50/90 dark:bg-blue-950/30 dark:hover:bg-blue-950/40 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 shadow-2xs space-y-1.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-700 dark:text-blue-200 font-bold">{isAr ? 'الكوبونات النشطة' : 'Active Coupons'}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {currentCoupons.filter(c => c.status === 'active').length} {isAr ? 'نشط' : 'Active'}
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
              ? (currentCoupons.reduce((sum, c) => sum + (c.discountType === 'percentage' ? c.discountValue : 15), 0) / currentCoupons.length).toFixed(1) + '%'
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
            {money(currentCoupons.reduce((sum, c) => sum + ((c.usageCount || 0) * (c.minOrderValue || 150)), 0))}
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            {isAr ? 'إيرادات مباشرة من الطلبات بالكوبونات' : 'Direct coupon checkout revenue'}
          </span>
        </div>
      </div>

      <StoreOfferPromo
        onEdit={() => setShowAddModal(true)}
        onViewStorefront={() => onViewStorefront?.()}
      />

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="font-bold text-xs text-slate-800">{isAr ? 'عروض المتجر النشطة' : 'Active Store Promotions'}</span>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isAr ? 'ابحث عن كود…' : 'Search code…'}
              aria-label={isAr ? 'ابحث عن كود' : 'Search code'}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              aria-label={isAr ? 'تصفية حسب الحالة' : 'Filter by status'}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
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
              <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px] bg-slate-50/50">
                <th className="py-3 px-4 text-start">{isAr ? 'كود الكوبون' : 'Coupon Code'}</th>
                <th className="py-3 px-3 text-start">{isAr ? 'الخصم' : 'Discount'}</th>
                <th className="py-3 px-3 text-end">{isAr ? 'الحد الأدنى للطلب (ر.س)' : 'Min Order (SAR)'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'الاستخدام' : 'Usage'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="py-3 px-3 text-end">{isAr ? 'صالح حتى' : 'Valid Until'}</th>
                <th className="py-3 px-4 text-end">{isAr ? 'الإجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {isAr ? 'لا توجد كوبونات مطابقة لهذه الفلاتر.' : 'No coupons match these filters.'}
                  </td>
                </tr>
              ) : (
                pageRows.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/60">
                        {c.code}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {c.discountType === 'percentage'
                        ? isAr ? `خصم ${c.discountValue}%` : `${c.discountValue}% OFF`
                        : isAr ? `خصم ثابت ${money(c.discountValue)}` : `${money(c.discountValue)} FLAT`}
                    </td>
                    <td className="py-3 px-3 text-end tabular-nums">
                      {money(c.minOrderValue)}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums">
                      {c.usageCount || 0} / {c.maxUsage}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        c.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {statusLabel(c.status)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-end text-slate-500 font-mono text-[11px]">
                      {c.validUntil}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            toggleCouponStatus(c.id);
                            toast(
                              c.status === 'active'
                                ? isAr ? `تم إنهاء الكوبون ${c.code}` : `Coupon ${c.code} expired`
                                : isAr ? `تمت إعادة تفعيل الكوبون ${c.code}` : `Coupon ${c.code} reactivated`,
                              'success',
                            );
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                        >
                          {c.status === 'active' ? (isAr ? 'إنهاء' : 'Expire') : (isAr ? 'إعادة تفعيل' : 'Reactivate')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteCoupon(c.id);
                            toast(isAr ? `تم حذف الكوبون ${c.code}` : `Coupon ${c.code} deleted`, 'info');
                          }}
                          aria-label={isAr ? `حذف الكوبون ${c.code}` : `Delete coupon ${c.code}`}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
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

        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <label className="flex items-center gap-1.5">
            <span>{isAr ? 'عرض' : 'Show'}</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg"
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
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <span className="px-2 font-bold text-slate-700">
              {page} / {lastPage}
            </span>
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              aria-label={isAr ? 'الصفحة التالية' : 'Next page'}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-[#0b1b36] px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">{isAr ? 'إنشاء كوبون خصم' : 'Create Discount Coupon'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label={isAr ? 'إغلاق' : 'Close'}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-3.5 text-xs text-slate-700">
              <div>
                <label className="block font-semibold mb-1">{isAr ? 'كود الكوبون *' : 'Coupon Code *'}</label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: NATIONALDAY94' : 'e.g. NATIONALDAY94'}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{isAr ? 'نوع الخصم' : 'Discount Type'}</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                  >
                    <option value="percentage">{isAr ? 'نسبة مئوية (%)' : 'Percentage (%)'}</option>
                    <option value="fixed">{isAr ? 'مبلغ ثابت بالريال' : 'Fixed SAR Amount'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">{isAr ? 'القيمة' : 'Value'}</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{isAr ? 'الحد الأدنى للطلب (ر.س)' : 'Min Order Value (SAR)'}</label>
                  <input
                    type="number"
                    required
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">{isAr ? 'صالح حتى' : 'Valid Until'}</label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">{isAr ? 'الحد الأقصى للاستخدام' : 'Max Usage'}</label>
                <input
                  type="number"
                  min={1}
                  value={maxUsage}
                  onChange={(e) => setMaxUsage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  {isAr ? 'حفظ الكوبون' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
