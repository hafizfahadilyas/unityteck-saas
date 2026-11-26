import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, MessageSquare, Save, Shield } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { MasterLuxePanel, masterGhostBtnClass } from './MasterUiKit';
import { GlobalModal } from '../common/GlobalModal';
import { SkeletonForm } from '../common/skeleton';
import {
  askOpenAiAutomation,
  fetchOpenAiAutomation,
  saveOpenAiAutomation,
  unlockOpenAiAutomationPayment,
  type OpenAiAutomationConfig,
} from '../../services/masterOpenAiApi';

type Props = { storeId: string; storeOptions: Array<{ store_id: string; store_name: string }> };

export const MasterOpenAiAutomationPanel: React.FC<Props> = ({ storeId, storeOptions }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const [id, setId] = useState(storeId);
  const [cfg, setCfg] = useState<OpenAiAutomationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState('');
  const [payOpen, setPayOpen] = useState(false);

  const load = useCallback(async (sid: string) => {
    setLoading(true);
    try {
      const res = await fetchOpenAiAutomation(sid);
      setId(sid);
      setCfg(res.config);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load(storeId);
  }, [storeId, load]);

  if (!storeId) {
    return (
      <MasterLuxePanel>
        <p style={{ color: 'var(--muted)' }}>
          {isAr ? 'اختر متجراً أولاً.' : 'Select a store first.'}
        </p>
      </MasterLuxePanel>
    );
  }

  if (loading && !cfg) {
    return <SkeletonForm fieldsCount={4} columns={2} />;
  }
  if (!cfg) return null;

  const day = cfg.usage?.day as { questions_used?: number; questions_limit?: number } | undefined;
  const month = cfg.usage?.month as { questions_used?: number; questions_limit?: number } | undefined;

  return (
    <div className="space-y-4">
      <MasterLuxePanel>
        <div className="flex items-center gap-2 mb-2 font-semibold">
          <MessageSquare className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          {isAr ? 'أتمتة الأسئلة (متجر واحد فقط)' : 'AI Automation Q&A (own store only)'}
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          {isAr
            ? 'مثل نظام المنظمات: الماستر يضبط الحدود والدفع لكل متجر. الأسئلة فقط عن بيانات هذا المتجر — بدون متاجر أخرى أو أسرار.'
            : 'Org-style: Master sets per-store limits & payment. Questions only about this store — no other tenants or secrets.'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm space-y-1">
            <span>{isAr ? 'المتجر' : 'Store'}</span>
            <select
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              value={id}
              onChange={(e) => void load(e.target.value)}
            >
              {storeOptions.map((s) => (
                <option key={s.store_id} value={s.store_id}>
                  {s.store_name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={cfg.enabled}
              onChange={(e) => {
                if (e.target.checked && !cfg.pro_eligible) {
                  setPayOpen(true);
                  return;
                }
                setCfg({ ...cfg, enabled: e.target.checked });
              }}
            />
            {isAr ? 'تفعيل الأتمتة' : 'Enable automation'}
          </label>
          <label className="text-sm space-y-1">
            <span>{isAr ? 'مستوى الذكاء' : 'Intelligence level'}</span>
            <select
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              value={cfg.intelligence_level}
              onChange={(e) => setCfg({ ...cfg, intelligence_level: e.target.value })}
            >
              <option value="low">{isAr ? 'منخفض' : 'low'}</option>
              <option value="medium">{isAr ? 'متوسط' : 'medium'}</option>
              <option value="high">{isAr ? 'مرتفع' : 'high'}</option>
            </select>
          </label>
          <label className="text-sm space-y-1">
            <span>{isAr ? 'حد الأسئلة اليومي' : 'Daily question quota'}</span>
            <input
              type="number"
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              value={cfg.daily_question_quota}
              onChange={(e) => setCfg({ ...cfg, daily_question_quota: Number(e.target.value) })}
            />
          </label>
          <label className="text-sm space-y-1">
            <span>{isAr ? 'حد الأسئلة الشهري' : 'Monthly question quota'}</span>
            <input
              type="number"
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              value={cfg.monthly_question_quota}
              onChange={(e) => setCfg({ ...cfg, monthly_question_quota: Number(e.target.value) })}
            />
          </label>
          <div className="text-sm flex items-center gap-2" style={{ color: 'var(--muted)' }}>
            <Shield className="w-4 h-4" />
            {isAr
              ? 'عزل إجباري: متجر واحد · منع SQL والأسرار'
              : 'Forced isolation: own store · block SQL & secrets'}
          </div>
          <div className="text-sm md:col-span-2" style={{ color: 'var(--muted)' }}>
            {isAr ? 'اليوم' : 'Today'}: {day?.questions_used ?? 0}/{day?.questions_limit ?? 0} ·{' '}
            {isAr ? 'الشهر' : 'Month'}: {month?.questions_used ?? 0}/{month?.questions_limit ?? 0} ·{' '}
            {cfg.payment_status}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            className="unity-btn-primary"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                const res = await saveOpenAiAutomation(cfg.store_id, {
                  enabled: cfg.enabled,
                  intelligence_level: cfg.intelligence_level,
                  text_model: cfg.text_model,
                  daily_question_quota: cfg.daily_question_quota,
                  monthly_question_quota: cfg.monthly_question_quota,
                  max_output_tokens: cfg.max_output_tokens,
                  payment_required_for_usage: cfg.payment_required_for_usage,
                  config_status: cfg.config_status,
                });
                setCfg(res.config);
                toast(isAr ? 'تم الحفظ' : 'Saved', 'success');
              } catch (e) {
                toast(e instanceof Error ? e.message : String(e), 'error');
              } finally {
                setSaving(false);
              }
            }}
          >
            <Save className="w-4 h-4 inline me-1" />
            {isAr ? 'حفظ' : 'Save'}
          </button>
          <button type="button" className={masterGhostBtnClass} onClick={() => setPayOpen(true)}>
            <CreditCard className="w-4 h-4 inline me-1" />
            {isAr ? 'دفع / فتح' : 'Payment / unlock'}
          </button>
        </div>
      </MasterLuxePanel>

      <MasterLuxePanel>
        <textarea
          className="w-full rounded-lg border px-3 py-2 text-sm min-h-[80px]"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          placeholder={
            isAr
              ? 'سؤال عن هذا المتجر فقط (مبيعات، طلبات، منتجات…)…'
              : 'Question about THIS store only (sales, orders, products…)…'
          }
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          type="button"
          className="unity-btn-primary mt-3 text-sm"
          disabled={saving}
          onClick={async () => {
            if (!cfg.pro_eligible || (cfg.payment_required_for_usage && !cfg.usage_unlocked)) {
              setPayOpen(true);
              return;
            }
            setSaving(true);
            try {
              const res = await askOpenAiAutomation(cfg.store_id, q);
              if (!res.ok) {
                if (res.payment_required) setPayOpen(true);
                toast(res.message || 'Failed', 'error');
                return;
              }
              setAnswer(String(res.data?.content || ''));
              await load(cfg.store_id);
            } catch (e) {
              toast(e instanceof Error ? e.message : String(e), 'error');
            } finally {
              setSaving(false);
            }
          }}
        >
          {isAr ? 'اسأل' : 'Ask'}
        </button>
        {answer ? (
          <pre
            className="mt-3 text-xs p-3 rounded-lg overflow-auto"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {answer}
          </pre>
        ) : null}
      </MasterLuxePanel>

      <GlobalModal isOpen={payOpen} onClose={() => setPayOpen(false)} aria-label="payment">
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
          <div className="px-5 py-4" style={{ background: 'var(--portal-cta)', color: '#fff' }}>
            {isAr ? 'فتح استخدام الأتمتة' : 'Unlock automation usage'}
          </div>
          <div className="p-5 flex flex-col gap-2">
            {(
              [
                ['mark_paid', isAr ? 'تسجيل كمدفوع (30 يوماً)' : 'Mark paid (30 days)'],
                ['comp', isAr ? 'منح مجاني من الماستر' : 'Master comp'],
                ['services_points', isAr ? 'خصم نقاط الخدمات' : 'Redeem services points'],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                className="unity-btn-primary"
                onClick={async () => {
                  try {
                    const res = await unlockOpenAiAutomationPayment(cfg.store_id, m);
                    setCfg(res.config);
                    setPayOpen(false);
                    toast(isAr ? 'تم الفتح' : 'Unlocked', 'success');
                  } catch (e) {
                    toast(e instanceof Error ? e.message : String(e), 'error');
                  }
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </GlobalModal>
    </div>
  );
};
