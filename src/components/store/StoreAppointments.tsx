import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Check, Loader2, RefreshCw, X } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../common/ToastProvider';
import {
  fetchStoreAppointmentsApi,
  updateStoreAppointmentApi,
  type StoreAppointmentRow,
} from '../../api/tenantApi';
import { invalidateApiGetCache } from '../../api/client';

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

export const StoreAppointments: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { activeStore } = useTenant();
  const { toast } = useToast();
  const storeId = activeStore?.id || '';
  const [rows, setRows] = useState<StoreAppointmentRow[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

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
      toast(isAr ? 'تم تحديث الموعد' : 'Appointment updated', 'success');
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : isAr ? 'تعذر التحديث' : 'Update failed', 'error');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black text-[var(--text)] flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[var(--accent)]" />
            {isAr ? 'مواعيد الورشة' : 'Workshop Appointments'}
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            {isAr
              ? 'حجوزات خدمات السيارات — معزولة حسب المتجر'
              : 'Automotive service bookings — store isolated'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="unity-btn-primary h-9 px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
          {isAr ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['', ...STATUSES] as const).map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer ${
              filter === s
                ? 'bg-[var(--portal-cta)] text-white border-transparent'
                : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)]'
            }`}
          >
            {s ? statusLabel(isAr, s) : isAr ? 'الكل' : 'All'}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {busy && rows.length === 0 ? (
          <div className="p-8 flex items-center justify-center text-[var(--muted)] gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            {isAr ? 'جاري التحميل…' : 'Loading…'}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--muted)] font-semibold">
            {isAr ? 'لا توجد مواعيد' : 'No appointments found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-[var(--surface)] border-b border-[var(--border)] text-[var(--muted)]">
                <tr>
                  <th className="px-3 py-2 font-bold">{isAr ? 'العميل' : 'Customer'}</th>
                  <th className="px-3 py-2 font-bold">{isAr ? 'الخدمة' : 'Service'}</th>
                  <th className="px-3 py-2 font-bold">{isAr ? 'السيارة' : 'Vehicle'}</th>
                  <th className="px-3 py-2 font-bold">{isAr ? 'الموعد' : 'Slot'}</th>
                  <th className="px-3 py-2 font-bold">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="px-3 py-2 font-bold">{isAr ? 'إجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-[var(--text)]">{row.customer_name}</div>
                      <div className="text-[var(--muted)]" dir="ltr">
                        {row.customer_phone}
                      </div>
                      {row.customer_email ? (
                        <div className="text-[10px] text-[var(--muted)]" dir="ltr">
                          {row.customer_email}
                        </div>
                      ) : null}
                      {row.notes ? (
                        <div className="mt-1 text-[10px] text-[var(--muted)] line-clamp-2">
                          {row.notes}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-[var(--text)]">
                      {isAr ? row.service_name_ar || row.service_key : row.service_name_en || row.service_key}
                    </td>
                    <td className="px-3 py-2.5 text-[var(--muted)]">
                      {[row.vehicle_make, row.vehicle_model, row.vehicle_year].filter(Boolean).join(' ') ||
                        '—'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[var(--text)]">
                      {row.appointment_date} {row.appointment_time}
                    </td>
                    <td className="px-3 py-2.5 font-bold">{statusLabel(isAr, row.status)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {row.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              disabled={actingId === row.id}
                              onClick={() => void patch(row.id, 'approved')}
                              className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              {isAr ? 'قبول' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              disabled={actingId === row.id}
                              onClick={() => void patch(row.id, 'rejected')}
                              className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                              {isAr ? 'رفض' : 'Reject'}
                            </button>
                          </>
                        )}
                        {row.status === 'approved' && (
                          <button
                            type="button"
                            disabled={actingId === row.id}
                            onClick={() => void patch(row.id, 'completed')}
                            className="px-2 py-1 rounded-lg bg-slate-800 text-white text-[10px] font-bold cursor-pointer"
                          >
                            {isAr ? 'إكمال' : 'Complete'}
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
