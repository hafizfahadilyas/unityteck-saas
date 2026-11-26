import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Play, Search, ShieldAlert, Activity } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  fetchMasterIntegrationHealth,
  runMasterIntegrationHealthAudit,
  runMasterIntegrationHealthTest,
  type IntegrationHealthRow,
} from '../../api/tenantApi';
import { MasterLuxePanel, MasterMetaLine, masterGhostBtnClass } from './MasterUiKit';

const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  not_configured: { en: 'Not Configured', ar: 'غير مهيأ' },
  credentials_missing: { en: 'Credentials Missing', ar: 'بيانات الاعتماد ناقصة' },
  connection_failed: { en: 'Connection Failed', ar: 'فشل الاتصال' },
  authentication_failed: { en: 'Authentication Failed', ar: 'فشل المصادقة' },
  connected: { en: 'Connected', ar: 'متصل' },
  sandbox_verified: { en: 'Sandbox Verified', ar: 'تم التحقق في بيئة الاختبار' },
  production_verified: { en: 'Production Verified', ar: 'تم التحقق في الإنتاج' },
  partially_working: { en: 'Partially Working', ar: 'يعمل جزئياً' },
  requires_attention: { en: 'Requires Attention', ar: 'يتطلب انتباهاً' },
  incomplete_backend: { en: 'Incomplete Backend', ar: 'تكامل خلفي غير مكتمل' },
  not_tested: { en: 'NOT TESTED', ar: 'لم يُختبر' },
  not_applicable: { en: 'Not Applicable', ar: 'غير منطبق' },
  configured: { en: 'Configured', ar: 'مهيأ' },
  endpoint_ready: { en: 'Endpoint Ready', ar: 'نقطة النهاية جاهزة' },
};

function statusLabel(code: string | undefined, isAr: boolean): string {
  if (!code) return isAr ? 'غير معروف' : 'Unknown';
  const row = STATUS_LABELS[code];
  if (!row) return code;
  return isAr ? row.ar : row.en;
}

function statusTone(code: string | undefined): { color: string; bg: string } {
  switch (code) {
    case 'connected':
    case 'sandbox_verified':
    case 'production_verified':
    case 'configured':
    case 'endpoint_ready':
      return { color: '#059669', bg: 'color-mix(in srgb, #10b981 12%, transparent)' };
    case 'partially_working':
    case 'requires_attention':
    case 'not_tested':
      return { color: '#d97706', bg: 'color-mix(in srgb, #f59e0b 14%, transparent)' };
    case 'connection_failed':
    case 'authentication_failed':
    case 'incomplete_backend':
    case 'credentials_missing':
      return { color: '#e11d48', bg: 'color-mix(in srgb, #e11d48 10%, transparent)' };
    default:
      return { color: 'var(--muted)', bg: 'color-mix(in srgb, var(--muted) 10%, transparent)' };
  }
}

const TEST_ACTIONS: Array<{ id: string; en: string; ar: string; categories: Array<'payment' | 'shipping'> }> = [
  { id: 'connection', en: 'Test API Connection', ar: 'اختبار اتصال الواجهة', categories: ['payment', 'shipping'] },
  { id: 'authentication', en: 'Test Authentication', ar: 'اختبار المصادقة', categories: ['payment', 'shipping'] },
  { id: 'payment_session', en: 'Test Payment Session', ar: 'اختبار جلسة الدفع', categories: ['payment'] },
  { id: 'webhook', en: 'Test Webhook', ar: 'اختبار الويب هوك', categories: ['payment', 'shipping'] },
  { id: 'rates', en: 'Test Shipping Rates', ar: 'اختبار أسعار الشحن', categories: ['shipping'] },
  { id: 'tracking', en: 'Test Tracking', ar: 'اختبار التتبع', categories: ['shipping'] },
  { id: 'label', en: 'Test Label Generation', ar: 'اختبار إنشاء الملصق', categories: ['shipping'] },
];

export const MasterIntegrationHealthCenter: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const [rows, setRows] = useState<IntegrationHealthRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'payment' | 'shipping'>('all');
  const [storeFilter, setStoreFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMasterIntegrationHealth();
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setRows([]);
      toast(
        isAr ? 'تعذر تحميل مركز صحة التكاملات' : 'Failed to load Integration Health Center',
        'error',
      );
    } finally {
      setLoading(false);
    }
  }, [isAr, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const stores = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => map.set(r.store_id, r.store_name || r.store_id));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (storeFilter !== 'all' && r.store_id !== storeFilter) return false;
      if (!q) return true;
      return (
        r.provider.toLowerCase().includes(q) ||
        (r.provider_name || '').toLowerCase().includes(q) ||
        r.store_id.toLowerCase().includes(q) ||
        (r.store_name || '').toLowerCase().includes(q) ||
        (r.overall_status || '').toLowerCase().includes(q)
      );
    });
  }, [rows, search, categoryFilter, storeFilter]);

  const payments = filtered.filter((r) => r.category === 'payment');
  const shipping = filtered.filter((r) => r.category === 'shipping');

  const runTest = async (row: IntegrationHealthRow, testType: string) => {
    const key = `${row.store_id}:${row.category}:${row.provider}:${testType}`;
    setBusyKey(key);
    try {
      const res = await runMasterIntegrationHealthTest({
        store_id: row.store_id,
        category: row.category,
        provider: row.provider,
        test_type: testType,
      });
      const ok = Boolean(res.success);
      toast(
        String(res.message || (ok ? (isAr ? 'نجح الاختبار' : 'Test passed') : isAr ? 'فشل الاختبار' : 'Test failed')),
        ok ? 'success' : 'warning',
      );
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : isAr ? 'فشل الاختبار' : 'Test failed', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const runAudit = async (storeId: string) => {
    setBusyKey(`audit:${storeId}`);
    try {
      const res = await runMasterIntegrationHealthAudit(storeId);
      const summary = (res.summary as { passed?: number; failed?: number; total?: number }) || {};
      toast(
        isAr
          ? `تدقيق كامل: نجح ${summary.passed ?? 0} / فشل ${summary.failed ?? 0} من ${summary.total ?? 0}`
          : `Full audit: ${summary.passed ?? 0} passed / ${summary.failed ?? 0} failed of ${summary.total ?? 0}`,
        'info',
      );
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : isAr ? 'فشل التدقيق' : 'Audit failed', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  const SectionTable: React.FC<{ title: string; subtitle: string; data: IntegrationHealthRow[] }> = ({
    title,
    subtitle,
    data,
  }) => (
    <MasterLuxePanel className="space-y-3" padding="lg">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
            {title}
          </h3>
          <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
            {subtitle}
          </p>
        </div>
        <MasterMetaLine>
          {isAr ? `${data.length} صف` : `${data.length} rows`}
        </MasterMetaLine>
      </div>

      {data.length === 0 ? (
        <p className="text-xs py-6 text-center" style={{ color: 'var(--muted)' }}>
          {isAr ? 'لا توجد سجلات' : 'No records found'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
          <table className="min-w-full text-xs">
            <thead>
              <tr style={{ background: 'color-mix(in srgb, var(--surface) 80%, var(--accent) 6%)' }}>
                {[
                  isAr ? 'المتجر' : 'Store',
                  isAr ? 'المزوّد' : 'Provider',
                  isAr ? 'الحالة العامة' : 'Overall',
                  isAr ? 'الاتصال' : 'Connection',
                  isAr ? 'المصادقة' : 'Auth',
                  isAr ? 'صحة الواجهة' : 'API Health',
                  isAr ? 'بيئة الاختبار' : 'Sandbox',
                  isAr ? 'الإنتاج' : 'Production',
                  isAr ? 'الويب هوك' : 'Webhook',
                  isAr ? 'آخر نجاح' : 'Last OK',
                  isAr ? 'آخر فشل' : 'Last Fail',
                  isAr ? 'الزمن (مللي)' : 'Latency ms',
                  isAr ? 'آخر خطأ' : 'Last Error',
                  isAr ? 'الإصدار' : 'Version',
                  isAr ? 'إجراءات' : 'Actions',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-2 py-2 text-start font-bold whitespace-nowrap"
                    style={{ color: 'var(--muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const tone = statusTone(row.overall_status);
                return (
                  <tr
                    key={`${row.store_id}-${row.category}-${row.provider}`}
                    className="border-t"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td className="px-2 py-2 whitespace-nowrap" style={{ color: 'var(--text)' }}>
                      <div className="font-bold">{row.store_name || row.store_id}</div>
                      <div style={{ color: 'var(--muted)' }}>{row.store_id}</div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap font-bold" style={{ color: 'var(--text)' }}>
                      {row.provider_name}
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className="inline-flex px-2 py-0.5 rounded-md font-bold"
                        style={{ color: tone.color, background: tone.bg }}
                      >
                        {statusLabel(row.overall_status, isAr)}
                      </span>
                    </td>
                    <td className="px-2 py-2">{statusLabel(row.connection_status, isAr)}</td>
                    <td className="px-2 py-2">{statusLabel(row.auth_status, isAr)}</td>
                    <td className="px-2 py-2">{statusLabel(row.api_health_status, isAr)}</td>
                    <td className="px-2 py-2">{statusLabel(row.sandbox_status, isAr)}</td>
                    <td className="px-2 py-2">{statusLabel(row.production_verification_status, isAr)}</td>
                    <td className="px-2 py-2">{statusLabel(row.webhook_status, isAr)}</td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {row.last_successful_test
                        ? new Date(row.last_successful_test).toLocaleString(isAr ? 'ar-SA' : 'en-US')
                        : '—'}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {row.last_failed_test
                        ? new Date(row.last_failed_test).toLocaleString(isAr ? 'ar-SA' : 'en-US')
                        : '—'}
                    </td>
                    <td className="px-2 py-2">{row.api_response_time_ms ?? '—'}</td>
                    <td className="px-2 py-2 max-w-[180px] truncate" title={row.last_error_message || ''}>
                      {row.last_error_message || '—'}
                    </td>
                    <td className="px-2 py-2">{row.integration_version || '—'}</td>
                    <td className="px-2 py-2">
                      <div className="flex flex-col gap-1 min-w-[160px]">
                        {TEST_ACTIONS.filter((a) => a.categories.includes(row.category)).map((a) => {
                          const key = `${row.store_id}:${row.category}:${row.provider}:${a.id}`;
                          return (
                            <button
                              key={a.id}
                              type="button"
                              className={masterGhostBtnClass}
                              disabled={busyKey === key || loading}
                              aria-busy={busyKey === key}
                              onClick={() => void runTest(row, a.id)}
                            >
                              <Play className="w-3 h-3" aria-hidden />
                              {isAr ? a.ar : a.en}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          className={masterGhostBtnClass}
                          disabled={busyKey === `audit:${row.store_id}` || loading}
                          onClick={() => void runAudit(row.store_id)}
                        >
                          <ShieldAlert className="w-3 h-3" aria-hidden />
                          {isAr ? 'تدقيق كامل للمتجر' : 'Run Full Audit'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </MasterLuxePanel>
  );

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              color: 'var(--accent)',
            }}
          >
            <Activity className="w-5 h-5" aria-hidden />
          </div>
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>
              {isAr ? 'مركز صحة التكاملات' : 'Integration Health Center'}
            </h2>
            <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'متصل ≠ تم التحقق في الاختبار ≠ تم التحقق في الإنتاج. لا نجاح وهمي بدون دليل.'
                : 'Connected ≠ Sandbox Verified ≠ Production Verified. No invented success without evidence.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="unity-btn-primary inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
          disabled={loading}
          aria-busy={loading}
          onClick={() => void load()}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          {loading ? (isAr ? 'جارٍ التحديث…' : 'Refreshing…') : isAr ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl border min-w-[220px] flex-1"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <Search className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث بالمتجر أو المزوّد أو الحالة…' : 'Search store, provider, status…'}
            className="bg-transparent outline-none text-xs w-full"
            style={{ color: 'var(--text)' }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
          className="text-xs px-3 py-2 rounded-xl border"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
        >
          <option value="all">{isAr ? 'كل الفئات' : 'All categories'}</option>
          <option value="payment">{isAr ? 'بوابات الدفع' : 'Payment Gateways'}</option>
          <option value="shipping">{isAr ? 'مزوّدو الشحن' : 'Shipping Providers'}</option>
        </select>
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl border"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
        >
          <option value="all">{isAr ? 'كل المتاجر' : 'All stores'}</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {(categoryFilter === 'all' || categoryFilter === 'payment') && (
        <SectionTable
          title={isAr ? 'بوابات الدفع' : 'Payment Gateways'}
          subtitle={
            isAr
              ? 'الحالة من فحوصات الواجهة الحقيقية فقط — لا اتصال وهمي'
              : 'Statuses from real API probes only — never fake Connected'
          }
          data={payments}
        />
      )}
      {(categoryFilter === 'all' || categoryFilter === 'shipping') && (
        <SectionTable
          title={isAr ? 'مزوّدو الشحن' : 'Shipping Providers'}
          subtitle={
            isAr
              ? 'لا أرقام بوليصة وهمية. الإلغاء والاستلام غير مدعومين بعد.'
              : 'No invented AWB. Cancel/pickup still unsupported.'
          }
          data={shipping}
        />
      )}
    </div>
  );
};
