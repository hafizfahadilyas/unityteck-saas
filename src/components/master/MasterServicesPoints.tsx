import React, { useCallback, useEffect, useState } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  adjustMasterPoints,
  createMasterService,
  fetchMasterPointTransactions,
  fetchMasterServices,
  patchMasterService,
} from '../../api/tenantApi';
import { Coins, Plus, RefreshCw } from 'lucide-react';

/** SOUQ PLUS Phase 1 §4.5 — platform service units (not cash). */
export const MasterServicesPoints: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const [tab, setTab] = useState<'services' | 'ledger'>('services');
  const [services, setServices] = useState<Array<Record<string, unknown>>>([]);
  const [tx, setTx] = useState<Array<Record<string, unknown>>>([]);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [cost, setCost] = useState(1);
  const [adjStore, setAdjStore] = useState('');
  const [adjPoints, setAdjPoints] = useState(10);
  const [adjType, setAdjType] = useState<'grant' | 'deduction'>('grant');
  const [adjReason, setAdjReason] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [s, t] = await Promise.all([fetchMasterServices(), fetchMasterPointTransactions()]);
      setServices(Array.isArray(s?.data) ? s.data : []);
      setTx(Array.isArray(t?.data) ? t.data : []);
    } catch {
      toast(isAr ? 'تعذر التحميل' : 'Failed to load', 'error');
      setServices([]);
      setTx([]);
    } finally {
      setBusy(false);
    }
  }, [isAr, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const addService = async () => {
    if (!name.trim()) {
      toast(isAr ? 'اسم الخدمة مطلوب' : 'Service name required', 'error');
      return;
    }
    try {
      await createMasterService({
        name: name.trim(),
        name_ar: nameAr.trim() || undefined,
        point_cost: cost,
        status: 'active',
      });
      setName('');
      setNameAr('');
      toast(isAr ? 'تمت إضافة الخدمة' : 'Service added', 'success');
      await load();
    } catch {
      toast(isAr ? 'فشل الحفظ' : 'Save failed', 'error');
    }
  };

  const toggleService = async (id: string, status: string) => {
    try {
      await patchMasterService(id, { status: status === 'active' ? 'inactive' : 'active' });
      await load();
    } catch {
      toast(isAr ? 'فشل التحديث' : 'Update failed', 'error');
    }
  };

  const adjust = async () => {
    if (!adjReason.trim() || !adjPoints) {
      toast(isAr ? 'النقاط والسبب مطلوبان' : 'Points and reason required', 'error');
      return;
    }
    try {
      await adjustMasterPoints({
        type: adjType,
        points: adjPoints,
        reason: adjReason.trim(),
        store_id: adjStore.trim() || undefined,
        reference: `adj-${Date.now()}`,
      });
      setAdjReason('');
      toast(isAr ? 'تم تسجيل الحركة' : 'Transaction recorded', 'success');
      await load();
    } catch {
      toast(isAr ? 'فشل التعديل' : 'Adjust failed', 'error');
    }
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'الخدمات والنقاط' : 'Services & Points'}
        subtitle={
          isAr
            ? 'وحدات استخدام الخدمات — ليست محفظة نقدية'
            : 'Service usage units — not a cash wallet'
        }
        badge={
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ color: 'var(--accent)' }}>
            <Coins className="w-3.5 h-3.5 inline me-1" aria-hidden />
            {services.length} {isAr ? 'خدمات' : 'services'}
          </span>
        }
        actions={
          <button type="button" className="unity-btn-primary text-sm inline-flex items-center gap-1.5" onClick={() => void load()} disabled={busy}>
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        }
      />

      <div className="mt-4 flex gap-2">
        {(['services', 'ledger'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className="text-xs font-bold px-3 py-2 rounded-xl border"
            style={{
              borderColor: tab === k ? 'var(--accent)' : 'var(--border)',
              color: tab === k ? 'var(--accent)' : 'var(--muted)',
              background: tab === k ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--surface)',
            }}
          >
            {k === 'services' ? (isAr ? 'الخدمات' : 'Services') : isAr ? 'سجل النقاط' : 'Point ledger'}
          </button>
        ))}
      </div>

      {tab === 'services' ? (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'إضافة خدمة' : 'Add service'}
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isAr ? 'الاسم (إنجليزي)' : 'Name (EN)'}
              className="w-full rounded-xl border text-sm px-3 py-2 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            <input
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder={isAr ? 'الاسم (عربي)' : 'Name (AR)'}
              className="w-full rounded-xl border text-sm px-3 py-2 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            <label className="text-xs" style={{ color: 'var(--muted)' }}>
              {isAr ? 'تكلفة النقاط لكل استخدام' : 'Point cost per use'}
              <input
                type="number"
                min={0}
                value={cost}
                onChange={(e) => setCost(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-xl border text-sm px-3 py-2 bg-transparent"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </label>
            <button type="button" className="unity-btn-primary text-sm inline-flex items-center gap-1.5" onClick={() => void addService()}>
              <Plus className="w-3.5 h-3.5" aria-hidden />
              {isAr ? 'حفظ' : 'Save'}
            </button>
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            {services.length === 0 ? (
              <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد سجلات' : 'No records found'}
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {services.map((s) => (
                  <li key={String(s.id)} className="p-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                        {isAr && s.name_ar ? String(s.name_ar) : String(s.name)}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                        {String(s.point_cost)} {isAr ? 'نقطة' : 'pts'} · {String(s.status)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-bold"
                      style={{ color: 'var(--accent)' }}
                      onClick={() => void toggleService(String(s.id), String(s.status))}
                    >
                      {String(s.status) === 'active' ? (isAr ? 'إيقاف' : 'Deactivate') : isAr ? 'تفعيل' : 'Activate'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'تعديل نقاط (سبب مطلوب)' : 'Point adjustment (reason required)'}
            </p>
            <select
              value={adjType}
              onChange={(e) => setAdjType(e.target.value as 'grant' | 'deduction')}
              className="w-full rounded-xl border text-sm px-3 py-2 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <option value="grant">{isAr ? 'منح' : 'Grant'}</option>
              <option value="deduction">{isAr ? 'خصم' : 'Deduction'}</option>
            </select>
            <input
              value={adjStore}
              onChange={(e) => setAdjStore(e.target.value)}
              placeholder={isAr ? 'معرّف المتجر (اختياري)' : 'store_id (optional)'}
              className="w-full rounded-xl border text-sm px-3 py-2 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            <input
              type="number"
              value={adjPoints}
              onChange={(e) => setAdjPoints(Number(e.target.value) || 0)}
              className="w-full rounded-xl border text-sm px-3 py-2 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            <textarea
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              rows={2}
              placeholder={isAr ? 'السبب' : 'Reason'}
              className="w-full rounded-xl border text-sm px-3 py-2 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            <button type="button" className="unity-btn-primary text-sm" onClick={() => void adjust()}>
              {isAr ? 'تسجيل' : 'Record'}
            </button>
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            {tx.length === 0 ? (
              <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد سجلات' : 'No records found'}
              </div>
            ) : (
              <ul className="divide-y max-h-[360px] overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
                {tx.map((t) => (
                  <li key={String(t.id)} className="p-3 text-xs">
                    <div className="font-bold" style={{ color: 'var(--text)' }}>
                      {String(t.type)} · {String(t.points)}
                    </div>
                    <div style={{ color: 'var(--muted)' }}>
                      {String(t.store_id || 'platform')} · {String(t.reason)} · {String(t.created_at || '')}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </AdminPageShell>
  );
};
