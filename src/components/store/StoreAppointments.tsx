import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  Clock,
  Car,
  Filter,
  Loader2,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  User,
  Wrench,
  X,
  PlusCircle,
  FileText,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../common/ToastProvider';
import {
  fetchStoreAppointmentsApi,
  updateStoreAppointmentApi,
  type StoreAppointmentRow,
} from '../../api/tenantApi';
import { apiFetch, invalidateApiGetCache } from '../../api/client';

const STATUSES = ['pending', 'approved', 'rejected', 'completed', 'cancelled'] as const;

function statusLabel(isAr: boolean, status: string): string {
  const map: Record<string, [string, string]> = {
    pending: ['قيد المراجعة', 'Pending'],
    approved: ['مقبول', 'Approved'],
    rejected: ['مرفوض', 'Rejected'],
    completed: ['مكتمل', 'Completed'],
    cancelled: ['ملغي', 'Cancelled'],
  };
  const row = map[status] || [status, status];
  return isAr ? row[0] : row[1];
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'approved':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'completed':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'rejected':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    case 'cancelled':
      return 'bg-slate-100 text-slate-600 border border-slate-200';
    default:
      return 'bg-slate-50 text-slate-600 border border-slate-200';
  }
}

export const StoreAppointments: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { activeStore } = useTenant();
  const { toast } = useToast();
  const storeId = activeStore?.id || '';
  const [rows, setRows] = useState<StoreAppointmentRow[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [testSubmitting, setTestSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!storeId) return;
    setBusy(true);
    try {
      invalidateApiGetCache(storeId);
      const data = await fetchStoreAppointmentsApi(storeId, filter || undefined);
      setRows(data);
    } catch (e) {
      toast(e instanceof Error ? e.message : isAr ? 'تعذر التحميل' : 'Load failed', 'error');
      setRows([]);
    } finally {
      setBusy(false);
    }
  }, [storeId, filter, toast, isAr]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (id: string, status: string) => {
    if (!storeId) return;
    setActingId(id);
    try {
      await updateStoreAppointmentApi(storeId, id, { status });
      toast(isAr ? 'تم تحديث حالة الموعد' : 'Appointment updated', 'success');
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : isAr ? 'تعذر التحديث' : 'Update failed', 'error');
    } finally {
      setActingId(null);
    }
  };

  const handleCreateTestLead = async () => {
    if (!storeId || testSubmitting) return;
    setTestSubmitting(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().slice(0, 10);

      const testPayload = {
        customer_name: isAr ? 'سعد العتيبي (طلب تجريبي)' : 'Saad Al-Otaibi (Test Lead)',
        customer_phone: '0501234567',
        customer_email: 'test.customer@mieraf-ksa.com',
        service_key: 'interior_upholstery',
        additional_services: ['window_tinting'],
        vehicle_make: 'toyota',
        vehicle_model: 'Land Cruiser',
        vehicle_year: '2025',
        appointment_date: dateStr,
        appointment_time: '11:00',
        notes: isAr
          ? 'استفسار تجريبي: تنجيد مقاعد كامل جلد ألماني نخب أول + عازل نانو سيراميك'
          : 'Test inquiry: VIP German leather cabin upholstery + nano-ceramic shield',
      };

      await apiFetch('/storefront/appointments', {
        method: 'POST',
        storeId,
        skipAuth: true,
        body: testPayload,
      });

      toast(
        isAr ? 'تم تسجيل الحجز التجريبي ووصل للوحة التحكم بنجاح!' : 'Test booking created & received in dashboard!',
        'success'
      );
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : isAr ? 'تعذر إرسال الطلب التجريبي' : 'Failed to send test lead', 'error');
    } finally {
      setTestSubmitting(false);
    }
  };

  const openWhatsAppCustomer = (row: StoreAppointmentRow) => {
    const rawDigits = row.customer_phone.replace(/\D/g, '');
    const cleanPhone = rawDigits.startsWith('966')
      ? rawDigits
      : rawDigits.startsWith('05')
      ? '966' + rawDigits.slice(1)
      : rawDigits.startsWith('5')
      ? '966' + rawDigits
      : rawDigits;

    const svc = isAr ? (row.service_name_ar || row.service_key) : (row.service_name_en || row.service_key);
    const vehicle = [row.vehicle_make, row.vehicle_model, row.vehicle_year].filter(Boolean).join(' ');
    const msg = isAr
      ? `السلام عليكم ${row.customer_name}، نرحب بك في متجر السعيدي بخصوص طلبك لخدمة ${svc}${vehicle ? ` لسيارتك (${vehicle})` : ''}، موعدك المحدد: ${row.appointment_date} الساعة ${row.appointment_time}.`
      : `Hello ${row.customer_name}, welcome to Al-Saeedi Store regarding your booking for ${svc}${vehicle ? ` for (${vehicle})` : ''}, scheduled on ${row.appointment_date} at ${row.appointment_time}.`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase().trim();
    return rows.filter((r) => {
      const name = (r.customer_name || '').toLowerCase();
      const phone = (r.customer_phone || '').toLowerCase();
      const service = (r.service_name_ar || r.service_name_en || r.service_key || '').toLowerCase();
      const vehicle = `${r.vehicle_make || ''} ${r.vehicle_model || ''} ${r.vehicle_year || ''}`.toLowerCase();
      const notes = (r.notes || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || service.includes(q) || vehicle.includes(q) || notes.includes(q);
    });
  }, [rows, searchQuery]);

  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.status === 'pending').length;
    const approved = rows.filter((r) => r.status === 'approved').length;
    const completed = rows.filter((r) => r.status === 'completed').length;
    return { total, pending, approved, completed };
  }, [rows]);

  return (
    <div className="p-4 sm:p-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-[#915f3c] text-white flex items-center justify-center shadow-sm">
              <CalendarDays className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-[var(--text)] tracking-tight">
              {isAr ? 'الحجوزات والاستفسارات الفاخرة' : 'Bookings & Inquiries Center'}
            </h1>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">
            {isAr
              ? 'إدارة حجوزات ورشة التنجيد، طلبات التفصيل الخاص، ومتابعة العملاء الفورية عبر واتساب'
              : 'Manage automotive upholstery appointments, bespoke vehicle inquiries & instant WhatsApp leads'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCreateTestLead}
            disabled={testSubmitting || busy}
            className="h-9 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title={isAr ? 'إرسال حجز تجريبي للتحقق من الاتصال' : 'Create a sample lead to test connection'}
          >
            {testSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isAr ? 'تجربة إرسال طلب جديد' : 'Test Submit Lead'}</span>
          </button>

          <button
            type="button"
            onClick={() => void load()}
            disabled={busy}
            className="unity-btn-primary h-9 px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'تحديث' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[var(--muted)] text-xs font-bold">
            <span>{isAr ? 'إجمالي الحجوزات' : 'Total Inquiries'}</span>
            <FileText className="w-4 h-4 text-[#915f3c]" />
          </div>
          <div className="text-2xl font-black text-[var(--text)]">{stats.total}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[var(--muted)] text-xs font-bold">
            <span>{isAr ? 'قيد المراجعة' : 'Pending Review'}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats.pending}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[var(--muted)] text-xs font-bold">
            <span>{isAr ? 'المقبولة والمؤكدة' : 'Confirmed'}</span>
            <Check className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.approved}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[var(--muted)] text-xs font-bold">
            <span>{isAr ? 'المكتملة' : 'Completed'}</span>
            <Wrench className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600">{stats.completed}</div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['', ...STATUSES] as const).map((s) => (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black cursor-pointer transition-all ${
                filter === s
                  ? 'bg-[#915f3c] text-white shadow-xs'
                  : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[#faede4] hover:text-[#915f3c]'
              }`}
            >
              {s ? statusLabel(isAr, s) : isAr ? 'الكل' : 'All'}
            </button>
          ))}
        </div>

        {/* Live Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'ابحث باسم، هاتف، سيارة…' : 'Search name, phone, car…'}
            className="w-full h-9 ps-9 pe-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[#915f3c]"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs">
        {busy && rows.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-[var(--muted)] gap-2 text-sm">
            <Loader2 className="w-6 h-6 animate-spin text-[#915f3c]" />
            <span className="font-semibold">{isAr ? 'جاري تحميل الحجوزات…' : 'Loading appointments…'}</span>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#faede4] text-[#915f3c] flex items-center justify-center mx-auto">
              <CalendarDays className="w-6 h-6" />
            </div>
            <p className="text-sm text-[var(--muted)] font-bold">
              {isAr ? 'لا توجد حجوزات مطابقة للبحث' : 'No matching inquiries found'}
            </p>
            <button
              type="button"
              onClick={handleCreateTestLead}
              className="text-xs font-bold text-[#915f3c] hover:underline cursor-pointer"
            >
              {isAr ? '+ إنشاء حجز تجريبي الآن' : '+ Create a test booking now'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50/75 border-b border-[var(--border)] text-[var(--muted)]">
                <tr>
                  <th className="px-3.5 py-3 font-bold text-start">{isAr ? 'العميل' : 'Customer'}</th>
                  <th className="px-3.5 py-3 font-bold text-start">{isAr ? 'الخدمة' : 'Service'}</th>
                  <th className="px-3.5 py-3 font-bold text-start">{isAr ? 'السيارة' : 'Vehicle'}</th>
                  <th className="px-3.5 py-3 font-bold text-start">{isAr ? 'الموعد' : 'Slot'}</th>
                  <th className="px-3.5 py-3 font-bold text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="px-3.5 py-3 font-bold text-start">{isAr ? 'واتساب' : 'WhatsApp'}</th>
                  <th className="px-3.5 py-3 font-bold text-start">{isAr ? 'إجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Customer */}
                    <td className="px-3.5 py-3">
                      <div className="font-black text-[var(--text)] flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#915f3c]" />
                        <span>{row.customer_name}</span>
                      </div>
                      <div className="text-[11px] text-[var(--muted)] font-mono mt-0.5" dir="ltr">
                        {row.customer_phone}
                      </div>
                      {row.customer_email && (
                        <div className="text-[10px] text-[var(--muted)] font-mono truncate max-w-[150px]">
                          {row.customer_email}
                        </div>
                      )}
                      {row.notes && (
                        <div className="mt-1 text-[11px] text-slate-600 bg-amber-50/60 p-1.5 rounded-lg border border-amber-200/50 line-clamp-2 max-w-xs">
                          {row.notes}
                        </div>
                      )}
                    </td>

                    {/* Service */}
                    <td className="px-3.5 py-3">
                      <div className="font-bold text-[var(--text)]">
                        {isAr ? row.service_name_ar || row.service_key : row.service_name_en || row.service_key}
                      </div>
                      {row.additional_services && row.additional_services.length > 0 && (
                        <div className="text-[10px] text-[#915f3c] mt-0.5">
                          +{row.additional_services.length} {isAr ? 'خدمات إضافية' : 'extras'}
                        </div>
                      )}
                    </td>

                    {/* Vehicle */}
                    <td className="px-3.5 py-3 text-[var(--muted)]">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <Car className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {[row.vehicle_make, row.vehicle_model, row.vehicle_year].filter(Boolean).join(' ') || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Slot */}
                    <td className="px-3.5 py-3">
                      <div className="font-bold text-slate-900 font-mono text-[11px]">
                        {row.appointment_date}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {row.appointment_time}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-3.5 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black ${statusBadgeClass(row.status)}`}>
                        {statusLabel(isAr, row.status)}
                      </span>
                    </td>

                    {/* Direct WhatsApp Action */}
                    <td className="px-3.5 py-3">
                      <button
                        type="button"
                        onClick={() => openWhatsAppCustomer(row)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-black border border-emerald-200 cursor-pointer transition-colors shadow-2xs"
                        title={isAr ? 'مراسلة العميل عبر واتساب' : 'Contact customer on WhatsApp'}
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isAr ? 'محادثة' : 'Chat'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-3.5 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {row.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              disabled={actingId === row.id}
                              onClick={() => void patch(row.id, 'approved')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Check className="w-3 h-3" />
                              <span>{isAr ? 'قبول' : 'Approve'}</span>
                            </button>
                            <button
                              type="button"
                              disabled={actingId === row.id}
                              onClick={() => void patch(row.id, 'rejected')}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <X className="w-3 h-3" />
                              <span>{isAr ? 'رفض' : 'Reject'}</span>
                            </button>
                          </>
                        )}
                        {row.status === 'approved' && (
                          <button
                            type="button"
                            disabled={actingId === row.id}
                            onClick={() => void patch(row.id, 'completed')}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Check className="w-3 h-3" />
                            <span>{isAr ? 'إكمال' : 'Complete'}</span>
                          </button>
                        )}
                        {(row.status === 'completed' || row.status === 'rejected') && (
                          <button
                            type="button"
                            disabled={actingId === row.id}
                            onClick={() => void patch(row.id, 'pending')}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold cursor-pointer"
                          >
                            {isAr ? 'إعادة فتح' : 'Reopen'}
                          </button>
                        )}
                      </div>
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

export default StoreAppointments;
