import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, ShieldAlert, Stethoscope } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  closeMasterAiDevRequest,
  fetchMasterAiDevRequests,
  runMasterAiDiagnose,
  type AiDevRequestRow,
} from '../../services/masterAiDeveloperApi';

/** Phase 3 — Master-only read-only AI developer diagnostics. */
export const MasterAiDeveloperPanel: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const [rows, setRows] = useState<AiDevRequestRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [report, setReport] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetchMasterAiDevRequests(storeId.trim() || undefined);
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error');
      setRows([]);
    } finally {
      setBusy(false);
    }
  }, [storeId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div
        className="rounded-2xl border px-4 py-3 text-xs"
        style={{
          borderColor: 'color-mix(in srgb, #f59e0b 35%, var(--border))',
          background: 'color-mix(in srgb, #f59e0b 8%, var(--surface))',
          color: 'var(--muted)',
        }}
      >
        <div className="flex items-center gap-2 font-black mb-1" style={{ color: 'var(--text)' }}>
          <ShieldAlert className="w-4 h-4" />
          {isAr ? 'أمان المرحلة ٣' : 'Phase 3 security'}
        </div>
        {isAr
          ? 'التشخيص للقراءة فقط. التاجر لا يعدّل المصدر. النشر التلقائي ممنوع دائماً.'
          : 'Read-only diagnostics. Merchants never edit source. Auto-deploy is always forbidden.'}
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <label className="text-[11px] font-bold space-y-1">
          <span style={{ color: 'var(--muted)' }}>{isAr ? 'معرّف المتجر' : 'Store ID'}</span>
          <input
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            placeholder="store-coffee"
            className="block rounded-xl border px-3 py-2 text-sm min-w-[200px]"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
        </label>
        <button
          type="button"
          className="unity-btn-primary text-[11px] px-3 py-2 flex items-center gap-1.5"
          disabled={busy || !storeId.trim()}
          onClick={async () => {
            setBusy(true);
            try {
              const res = await runMasterAiDiagnose(storeId.trim());
              setReport(res.data || null);
              toast(isAr ? 'اكتمل التشخيص' : 'Diagnosis complete', 'success');
              void load();
            } catch (e) {
              toast(e instanceof Error ? e.message : String(e), 'error');
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Stethoscope className="w-3.5 h-3.5" />}
          {isAr ? 'تشغيل التشخيص' : 'Run diagnose'}
        </button>
        <button
          type="button"
          className="px-3 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-1.5"
          style={{ borderColor: 'var(--border)' }}
          onClick={() => void load()}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
          {isAr ? 'تحديث الطلبات' : 'Refresh requests'}
        </button>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="px-3 py-2 text-[11px] font-black border-b" style={{ borderColor: 'var(--border)' }}>
          {isAr ? 'طلبات دعم التشخيص' : 'Diagnostics support requests'}
        </div>
        {rows.length === 0 ? (
          <div className="p-4 text-xs" style={{ color: 'var(--muted)' }}>
            {isAr ? 'لا توجد سجلات.' : 'No records found.'}
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {rows.map((r) => (
              <li key={r.id} className="px-3 py-3 text-xs space-y-1">
                <div className="font-black">{r.title}</div>
                <div style={{ color: 'var(--muted)' }}>
                  {r.store_id} · {r.status} · {r.category} · {r.priority}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    className="unity-btn-primary text-[10px] px-2 py-1"
                    onClick={async () => {
                      try {
                        const res = await runMasterAiDiagnose(r.store_id, r.id);
                        setReport(res.data || null);
                        toast(isAr ? 'اكتمل التشخيص' : 'Diagnosis complete', 'success');
                        void load();
                      } catch (e) {
                        toast(e instanceof Error ? e.message : String(e), 'error');
                      }
                    }}
                  >
                    {isAr ? 'تشخيص' : 'Diagnose'}
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1 rounded-lg border text-[10px] font-bold"
                    style={{ borderColor: 'var(--border)' }}
                    onClick={async () => {
                      try {
                        await closeMasterAiDevRequest(r.id, 'closed');
                        toast(isAr ? 'أُغلق' : 'Closed', 'success');
                        void load();
                      } catch (e) {
                        toast(e instanceof Error ? e.message : String(e), 'error');
                      }
                    }}
                  >
                    {isAr ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {report ? (
        <pre
          className="text-[10px] p-3 rounded-xl overflow-auto max-h-80 whitespace-pre-wrap"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          {JSON.stringify(report, null, 2)}
        </pre>
      ) : null}
    </div>
  );
};

export default MasterAiDeveloperPanel;
