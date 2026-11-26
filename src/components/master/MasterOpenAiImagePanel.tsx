import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, Image as ImageIcon, Save } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { MasterLuxePanel, masterGhostBtnClass } from './MasterUiKit';
import { GlobalModal } from '../common/GlobalModal';
import { SkeletonForm } from '../common/skeleton';
import {
  fetchOpenAiImage,
  generateOpenAiImage,
  saveOpenAiImage,
  unlockOpenAiImagePayment,
  type OpenAiImageConfig,
} from '../../services/masterOpenAiApi';

type Props = { storeId: string; storeOptions: Array<{ store_id: string; store_name: string }> };

export const MasterOpenAiImagePanel: React.FC<Props> = ({ storeId, storeOptions }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const [id, setId] = useState(storeId);
  const [cfg, setCfg] = useState<OpenAiImageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [preview, setPreview] = useState('');
  const [payOpen, setPayOpen] = useState(false);

  const load = useCallback(async (sid: string) => {
    setLoading(true);
    try {
      const res = await fetchOpenAiImage(sid);
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

  return (
    <div className="space-y-4">
      <MasterLuxePanel>
        <div className="flex items-center gap-2 mb-3 font-semibold" style={{ color: 'var(--text)' }}>
          <ImageIcon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          {isAr ? 'صور أوبن إي آي (منفصل عن جيميني)' : 'OpenAI Images (separate from Gemini)'}
        </div>
        <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
          {isAr
            ? 'الحد الشهري الافتراضي 50 صورة ناجحة — بدون حد يومي. الحدود والدفع من الماستر فقط.'
            : 'Default monthly quota 50 successful images — no daily cap. Limits & payment are Master-owned.'}
        </p>
        <p className="text-xs mb-4 font-semibold" style={{ color: 'var(--accent)' }}>
          {isAr
            ? 'التوليد عبر واجهة الماستر للصور — مفتاح أوبن إي آي يُضبط على الخادم فقط.'
            : 'Runs via Master OpenAI image API — OPENAI_API_KEY stays on the server only.'}
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
          <label className="text-sm space-y-1">
            <span>{isAr ? 'معرّف المتجر' : 'Store ID'}</span>
            <input
              readOnly
              value={cfg.store_id}
              className="w-full rounded-lg border px-3 py-2 opacity-80"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            />
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
            {isAr ? 'تفعيل الصور لهذا المتجر' : 'Enable images for this store'}
          </label>
          <label className="text-sm space-y-1">
            <span>{isAr ? 'النموذج' : 'Model'}</span>
            <input
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              value={cfg.default_model}
              onChange={(e) => setCfg({ ...cfg, default_model: e.target.value })}
            />
          </label>
          <label className="text-sm space-y-1">
            <span>{isAr ? 'الجودة' : 'Quality'}</span>
            <select
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              value={cfg.default_quality}
              onChange={(e) => setCfg({ ...cfg, default_quality: e.target.value })}
            >
              <option value="low">{isAr ? 'منخفضة' : 'low'}</option>
              <option value="medium">{isAr ? 'متوسطة' : 'medium'}</option>
              <option value="high">{isAr ? 'عالية' : 'high'}</option>
            </select>
          </label>
          <label className="text-sm space-y-1">
            <span>{isAr ? 'الحصة الشهرية (صور ناجحة)' : 'Monthly quota (successful)'}</span>
            <input
              type="number"
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              value={cfg.monthly_image_quota}
              onChange={(e) => setCfg({ ...cfg, monthly_image_quota: Number(e.target.value) })}
            />
          </label>
          <div className="text-sm md:col-span-2" style={{ color: 'var(--muted)' }}>
            {isAr ? 'الاستخدام هذا الشهر:' : 'This month:'} {cfg.usage.images_success} /{' '}
            {cfg.monthly_image_quota} · {isAr ? 'متبقي' : 'left'} {cfg.usage.images_remaining} · $
            {cfg.usage.cost_usd.toFixed(4)} · {cfg.payment_status}
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
                const res = await saveOpenAiImage(cfg.store_id, {
                  enabled: cfg.enabled,
                  default_model: cfg.default_model,
                  default_quality: cfg.default_quality,
                  monthly_image_quota: cfg.monthly_image_quota,
                  monthly_budget_usd: cfg.monthly_budget_usd,
                  max_cost_per_image_usd: cfg.max_cost_per_image_usd,
                  warning_threshold_pct: cfg.warning_threshold_pct,
                  auto_stop_at_quota: cfg.auto_stop_at_quota,
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
            {isAr ? 'دفع / فتح الاستخدام' : 'Payment / unlock'}
          </button>
        </div>
      </MasterLuxePanel>

      <MasterLuxePanel>
        <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
          {isAr ? 'تجربة التوليد' : 'Generate test'}
        </div>
        <div
          className="rounded-xl border border-dashed mb-3 min-h-[160px] flex items-center justify-center overflow-hidden"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        >
          {preview ? (
            <img src={preview} alt="" className="max-h-64 max-w-full object-contain" />
          ) : (
            <p className="text-xs font-semibold px-4 text-center" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'النتيجة تظهر هنا بعد التوليد — بلا صور وهمية.'
                : 'Result appears here after generate — no fake images.'}
            </p>
          )}
        </div>
        <textarea
          className="w-full rounded-lg border px-3 py-2 text-sm min-h-[80px]"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          placeholder={isAr ? 'وصف الصورة…' : 'Image prompt…'}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          type="button"
          className="unity-btn-primary mt-3 text-sm"
          disabled={saving || prompt.trim().length < 4}
          aria-busy={saving}
          onClick={async () => {
            if (!cfg.pro_eligible || (cfg.payment_required_for_usage && !cfg.usage_unlocked)) {
              setPayOpen(true);
              return;
            }
            setSaving(true);
            try {
              const res = await generateOpenAiImage(cfg.store_id, prompt);
              if (!res.ok) {
                if (res.payment_required) setPayOpen(true);
                toast(res.message || (isAr ? 'فشل التوليد' : 'Failed'), 'error');
                return;
              }
              setPreview(String(res.data?.url || ''));
              await load(cfg.store_id);
              toast(isAr ? 'تم التوليد' : 'Generated', 'success');
            } catch (e) {
              toast(e instanceof Error ? e.message : String(e), 'error');
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving
            ? isAr
              ? 'جارٍ التوليد…'
              : 'Generating…'
            : isAr
              ? 'توليد صورة'
              : 'Generate image'}
        </button>
      </MasterLuxePanel>

      <GlobalModal isOpen={payOpen} onClose={() => setPayOpen(false)} aria-label="payment">
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
          <div className="px-5 py-4" style={{ background: 'var(--portal-cta)', color: '#fff' }}>
            {isAr ? 'فتح استخدام الصور' : 'Unlock image usage'}
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
                    const res = await unlockOpenAiImagePayment(cfg.store_id, m);
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
