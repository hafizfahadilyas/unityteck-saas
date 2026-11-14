import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { AdvancedFilterBar } from '../common/AdvancedFilterBar';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  fetchMasterOpsErrors,
  fetchMasterOpsJobs,
  fetchMasterPolicies,
  patchMasterPolicy,
} from '../../api/tenantApi';
import { RefreshCw } from 'lucide-react';
import { MasterLuxePanel, MasterMetaLine, MasterTabPills, masterGhostBtnClass } from './MasterUiKit';

type OpsTab = 'jobs' | 'errors' | 'policies';

/** SOUQ PLUS Phase 5 — real job rows / error log / policy CMS (payments stay deferred elsewhere). */
export const MasterOpsMonitor: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const [tab, setTab] = useState<OpsTab>('jobs');
  const [busy, setBusy] = useState(false);
  const [jobs, setJobs] = useState<Array<Record<string, unknown>>>([]);
  const [errors, setErrors] = useState<Array<Record<string, unknown>>>([]);
  const [policies, setPolicies] = useState<Array<Record<string, unknown>>>([]);
  const [editKey, setEditKey] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [bodyAr, setBodyAr] = useState('');
  const [filters, setFilters] = useState({ result: 'all', severity: 'all', status: 'all' });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [j, e, p] = await Promise.all([
        fetchMasterOpsJobs(),
        fetchMasterOpsErrors(),
        fetchMasterPolicies(),
      ]);
      setJobs(Array.isArray(j?.data) ? j.data : []);
      setErrors(Array.isArray(e?.data) ? e.data : []);
      setPolicies(Array.isArray(p?.data) ? p.data : []);
    } catch {
      toast(isAr ? 'تعذر تحميل العمليات' : 'Failed to load ops data', 'error');
    } finally {
      setBusy(false);
    }
  }, [isAr, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const savePolicy = async () => {
    if (!editKey) return;
    try {
      await patchMasterPolicy({
        policy_key: editKey,
        body_en: bodyEn,
        body_ar: bodyAr,
      });
      toast(isAr ? 'تم حفظ السياسة' : 'Policy saved', 'success');
      await load();
    } catch {
      toast(isAr ? 'فشل الحفظ' : 'Save failed', 'error');
    }
  };

  const fromTs = dateFrom ? Date.parse(`${dateFrom}T00:00:00`) : NaN;
  const toTs = dateTo ? Date.parse(`${dateTo}T23:59:59`) : NaN;
  const q = search.trim().toLowerCase();

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (filters.result !== 'all' && String(j.result || '') !== filters.result) return false;
      if (q) {
        const hay = `${j.job_name || ''} ${j.result || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const ts = j.last_run_at ? Date.parse(String(j.last_run_at)) : NaN;
      if (!Number.isNaN(fromTs) && !Number.isNaN(ts) && ts < fromTs) return false;
      if (!Number.isNaN(toTs) && !Number.isNaN(ts) && ts > toTs) return false;
      return true;
    });
  }, [jobs, filters.result, q, fromTs, toTs]);

  const filteredErrors = useMemo(() => {
    return errors.filter((e) => {
      if (filters.severity !== 'all' && String(e.severity || '') !== filters.severity) return false;
      if (filters.status !== 'all' && String(e.status || '') !== filters.status) return false;
      if (q) {
        const hay = `${e.module || ''} ${e.message || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const ts = e.created_at ? Date.parse(String(e.created_at)) : NaN;
      if (!Number.isNaN(fromTs) && !Number.isNaN(ts) && ts < fromTs) return false;
      if (!Number.isNaN(toTs) && !Number.isNaN(ts) && ts > toTs) return false;
      return true;
    });
  }, [errors, filters.severity, filters.status, q, fromTs, toTs]);

  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      if (!q) return true;
      const hay = `${p.policy_key || ''} ${p.title_en || ''} ${p.title_ar || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [policies, q]);

  const activeFilterCount =
    (filters.result !== 'all' ? 1 : 0) +
    (filters.severity !== 'all' ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (search.trim() ? 1 : 0);

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'مراقبة العمليات والسياسات' : 'Ops Monitor & Policies'}
        subtitle={
          isAr
            ? 'المهام المجدولة وسجل الأخطاء وسياسات المنصة — بدون أرقام وهمية'
            : 'Scheduled jobs, error log, and platform policies — no fake metrics'
        }
        actions={
          <button type="button" className={masterGhostBtnClass} onClick={() => void load()} disabled={busy}>
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        }
      />

      <MasterTabPills
        className="mt-4"
        active={tab}
        onChange={(id) => setTab(id as OpsTab)}
        tabs={[
          { id: 'jobs', label: isAr ? 'المهام' : 'Jobs' },
          { id: 'errors', label: isAr ? 'سجل الأخطاء' : 'Error log' },
          { id: 'policies', label: isAr ? 'السياسات' : 'Policies' },
        ]}
      />

      <div className="mt-3 flex flex-col gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isAr ? 'بحث…' : 'Search…'}
          className="w-full sm:w-72 text-xs px-3 py-2 rounded-xl border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
        />
        <AdvancedFilterBar
          fields={
            tab === 'jobs'
              ? [
                  {
                    key: 'result',
                    label: isAr ? 'النتيجة' : 'Result',
                    options: [
                      { value: 'all', label: isAr ? 'كل النتائج' : 'All results' },
                      { value: 'ok', label: isAr ? 'نجاح' : 'OK' },
                      { value: 'unknown', label: isAr ? 'غير معروف' : 'Unknown' },
                      { value: 'failed', label: isAr ? 'فشل' : 'Failed' },
                    ],
                  },
                ]
              : tab === 'errors'
                ? [
                    {
                      key: 'severity',
                      label: isAr ? 'الخطورة' : 'Severity',
                      options: [
                        { value: 'all', label: isAr ? 'الكل' : 'All' },
                        { value: 'error', label: isAr ? 'خطأ' : 'Error' },
                        { value: 'warning', label: isAr ? 'تحذير' : 'Warning' },
                      ],
                    },
                    {
                      key: 'status',
                      label: isAr ? 'الحالة' : 'Status',
                      options: [
                        { value: 'all', label: isAr ? 'كل الحالات' : 'All statuses' },
                        { value: 'open', label: isAr ? 'مفتوح' : 'Open' },
                        { value: 'resolved', label: isAr ? 'محلول' : 'Resolved' },
                      ],
                    },
                  ]
                : []
          }
          filterValues={filters}
          onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          showDates={tab !== 'policies'}
          activeCount={activeFilterCount}
          onReset={() => {
            setFilters({ result: 'all', severity: 'all', status: 'all' });
            setDateFrom('');
            setDateTo('');
            setSearch('');
          }}
        />
      </div>

      {tab === 'jobs' ? (
        <MasterLuxePanel className="mt-4 overflow-x-auto" padding="none">
          {filteredJobs.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
              {isAr ? 'بانتظار البيانات' : 'Waiting for Data'}
            </div>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  <th className="text-start p-3">{isAr ? 'المهمة' : 'Job'}</th>
                  <th className="text-start p-3">{isAr ? 'النتيجة' : 'Result'}</th>
                  <th className="text-start p-3">{isAr ? 'آخر تشغيل' : 'Last run'}</th>
                  <th className="text-start p-3">{isAr ? 'إعادة المحاولة' : 'Retries'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((j) => (
                  <tr key={String(j.id)} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="p-3 font-semibold" style={{ color: 'var(--text)' }}>
                      {String(j.job_name)}
                    </td>
                    <td className="p-3 text-xs">{String(j.result)}</td>
                    <td className="p-3 text-xs" style={{ color: 'var(--muted)' }}>
                      {String(j.last_run_at || '—')}
                    </td>
                    <td className="p-3 text-xs">{String(j.retry_count ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <MasterMetaLine className="p-3">
            {isAr
              ? `المصدر: platform_job_runs · المعروض ${filteredJobs.length}/${jobs.length}`
              : `Source: platform_job_runs · Showing ${filteredJobs.length}/${jobs.length}`}
          </MasterMetaLine>
        </MasterLuxePanel>
      ) : null}

      {tab === 'errors' ? (
        <MasterLuxePanel className="mt-4 overflow-x-auto" padding="none">
          {filteredErrors.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
              {isAr ? 'لا توجد سجلات' : 'No records found'}
            </div>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  <th className="text-start p-3">{isAr ? 'الوقت' : 'When'}</th>
                  <th className="text-start p-3">{isAr ? 'الوحدة' : 'Module'}</th>
                  <th className="text-start p-3">{isAr ? 'الرسالة' : 'Message'}</th>
                  <th className="text-start p-3">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredErrors.map((e) => (
                  <tr key={String(e.id)} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="p-3 text-xs">{String(e.created_at)}</td>
                    <td className="p-3 text-xs">{String(e.module)}</td>
                    <td className="p-3 text-xs" style={{ color: 'var(--muted)' }}>
                      {String(e.message)}
                    </td>
                    <td className="p-3 text-xs">{String(e.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </MasterLuxePanel>
      ) : null}

      {tab === 'policies' ? (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MasterLuxePanel padding="none">
            {filteredPolicies.length === 0 ? (
              <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد سجلات' : 'No records found'}
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {filteredPolicies.map((p) => (
                  <li key={String(p.id)}>
                    <button
                      type="button"
                      className="w-full text-start p-3"
                      onClick={() => {
                        setEditKey(String(p.policy_key));
                        setBodyEn(String(p.body_en || ''));
                        setBodyAr(String(p.body_ar || ''));
                      }}
                    >
                      <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                        {isAr ? String(p.title_ar || p.title_en) : String(p.title_en || p.title_ar)}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                        {String(p.policy_key)} · {String(p.updated_at || '')}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </MasterLuxePanel>
          <MasterLuxePanel className="space-y-3" padding="lg">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {editKey
                ? isAr
                  ? `تعديل: ${editKey}`
                  : `Edit: ${editKey}`
                : isAr
                  ? 'اختر سياسة'
                  : 'Select a policy'}
            </p>
            <div>
              <label className="block text-[10px] font-bold mb-1" style={{ color: 'var(--muted)' }}>
                {isAr ? 'المحتوى (بالعربية)' : 'Body (Arabic)'}
              </label>
              <textarea
                value={bodyAr}
                onChange={(e) => setBodyAr(e.target.value)}
                rows={4}
                dir="rtl"
                disabled={!editKey}
                placeholder={isAr ? 'اكتب نص السياسة بالعربية…' : 'Policy body in Arabic…'}
                className="w-full rounded-xl border text-sm px-3 py-2 bg-transparent disabled:opacity-50"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold mb-1" style={{ color: 'var(--muted)' }}>
                {isAr ? 'المحتوى (بالإنجليزية)' : 'Body (English)'}
              </label>
              <textarea
                value={bodyEn}
                onChange={(e) => setBodyEn(e.target.value)}
                rows={4}
                dir="ltr"
                disabled={!editKey}
                placeholder={isAr ? 'اكتب نص السياسة بالإنجليزية…' : 'Policy body in English…'}
                className="w-full rounded-xl border text-sm px-3 py-2 bg-transparent disabled:opacity-50"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
            <button
              type="button"
              className="unity-btn-primary text-sm"
              disabled={!editKey}
              onClick={() => void savePolicy()}
            >
              {isAr ? 'حفظ' : 'Save'}
            </button>
          </MasterLuxePanel>
        </div>
      ) : null}
    </AdminPageShell>
  );
};
