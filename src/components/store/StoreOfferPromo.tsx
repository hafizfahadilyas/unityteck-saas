import React, { useCallback, useEffect, useState } from 'react';
import { Gift, Eye, Pencil, Power, Check } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  defaultOfferConfig,
  flagOfferPreviewOnce,
  readOfferConfig,
  writeOfferConfig,
  type StoreOfferConfig,
} from '../../themes/flowersPremium/offerConfig';
import { OFFER_TEMPLATES, offerTemplateById } from '../../themes/flowersPremium/offerTemplates';
import { OfferPopup } from '../../themes/flowersPremium/OfferPopup';

type Props = {
  /** Open coupons / full offer editor */
  onEdit: () => void;
  /** Jump to live storefront after flagging preview */
  onViewStorefront: () => void;
  compact?: boolean;
};

export const StoreOfferPromo: React.FC<Props> = ({ onEdit, onViewStorefront, compact = false }) => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [config, setConfig] = useState<StoreOfferConfig>(() =>
    readOfferConfig(activeStore.id),
  );
  const [editing, setEditing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setConfig(readOfferConfig(activeStore.id));
    setEditing(false);
  }, [activeStore.id]);

  const persist = useCallback(
    (next: StoreOfferConfig) => {
      setConfig(next);
      writeOfferConfig(activeStore.id, next);
    },
    [activeStore.id],
  );

  const applyTemplate = (templateId: StoreOfferConfig['templateId']) => {
    const tpl = offerTemplateById(templateId);
    persist({
      ...config,
      templateId,
      titleEn: tpl.titleEn,
      titleAr: tpl.titleAr,
      bodyEn: tpl.bodyEn,
      bodyAr: tpl.bodyAr,
      code: tpl.code,
      discountPercent: tpl.discountPercent,
    });
  };

  const toggleEnabled = () => {
    const next = { ...config, enabled: !config.enabled };
    persist(next);
    toast(
      next.enabled
        ? isAr
          ? 'تم تفعيل العرض على الواجهة'
          : 'Offer popup enabled on storefront'
        : isAr
          ? 'العرض متوقف — لن يظهر افتراضياً'
          : 'Offer off — will not show by default',
      'success',
    );
  };

  const saveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    persist(config);
    setEditing(false);
    toast(isAr ? 'تم حفظ العرض' : 'Offer saved', 'success');
  };

  const handleView = () => {
    flagOfferPreviewOnce();
    onViewStorefront();
  };

  if (compact) {
    return (
      <div
        className="u-chart-panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ color: 'var(--text)' }}
      >
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white"
            style={{ background: 'var(--portal-cta)' }}
          >
            <Gift className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm">{isAr ? 'عرض خاص منبثق' : 'Special offer popup'}</h3>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                style={{
                  color: config.enabled ? 'var(--tone-success)' : 'var(--muted)',
                  background: config.enabled
                    ? 'color-mix(in srgb, var(--tone-success) 12%, var(--surface))'
                    : 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                {config.enabled ? (isAr ? 'مفعّل' : 'ON') : isAr ? 'متوقف' : 'OFF'}
              </span>
            </div>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
              {isAr ? config.titleAr : config.titleEn} · {config.code}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={toggleEnabled}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer inline-flex items-center gap-1.5 transition-opacity hover:opacity-90"
            style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
          >
            <Power className="w-3.5 h-3.5" />
            {config.enabled ? (isAr ? 'إيقاف' : 'Turn off') : isAr ? 'تشغيل' : 'Turn on'}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer inline-flex items-center gap-1.5"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <Pencil className="w-3.5 h-3.5" />
            {isAr ? 'تعديل' : 'Edit'}
          </button>
          <button
            type="button"
            onClick={handleView}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white cursor-pointer inline-flex items-center gap-1.5 transition-opacity hover:opacity-90"
            style={{ background: 'var(--portal-cta)' }}
          >
            <Eye className="w-3.5 h-3.5" />
            {isAr ? 'معاينة' : 'View'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>
      <div
        className="p-5 rounded-2xl border shadow-2xs space-y-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              <h2 className="font-bold text-sm">
                {isAr ? 'نافذة العرض الخاص' : 'Special offer popup'}
              </h2>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'افتراضياً متوقف — فعّله ليظهر على واجهة المتجر. يدعم العربي والإنجليزي والوضع الداكن/الفاتح.'
                : 'Off by default — turn on to show on the storefront. Arabic + English, dark & light ready.'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={toggleEnabled}
              className="px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer border transition-colors"
              style={{
                borderColor: config.enabled
                  ? 'color-mix(in srgb, var(--tone-success) 40%, var(--border))'
                  : 'var(--border)',
                background: config.enabled
                  ? 'color-mix(in srgb, var(--tone-success) 14%, var(--surface))'
                  : 'var(--surface)',
                color: 'var(--text)',
              }}
            >
              <Power className="w-3.5 h-3.5" />
              {config.enabled ? (isAr ? 'مفعّل · إيقاف' : 'ON · Turn off') : isAr ? 'متوقف · تشغيل' : 'OFF · Turn on'}
            </button>
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer inline-flex items-center gap-1.5"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <Pencil className="w-3.5 h-3.5" />
              {isAr ? 'تعديل' : 'Edit'}
            </button>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer inline-flex items-center gap-1.5"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <Eye className="w-3.5 h-3.5" />
              {isAr ? 'معاينة سريعة' : 'Quick preview'}
            </button>
            <button
              type="button"
              onClick={handleView}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white cursor-pointer inline-flex items-center gap-1.5"
              style={{ background: 'var(--portal-cta)' }}
            >
              <Eye className="w-3.5 h-3.5" />
              {isAr ? 'عرض على الواجهة' : 'View on storefront'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {OFFER_TEMPLATES.map((tpl) => {
            const active = config.templateId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyTemplate(tpl.id)}
                className="text-start rounded-2xl border overflow-hidden cursor-pointer transition-all hover:opacity-95"
                style={{
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  boxShadow: active ? '0 0 0 1px var(--accent)' : undefined,
                  background: 'var(--surface)',
                }}
              >
                <div
                  className="h-16 p-3 text-white text-[11px] font-bold flex items-end"
                  style={{ background: `linear-gradient(135deg, ${tpl.accentFrom}, ${tpl.accentTo})` }}
                >
                  {isAr ? tpl.nameAr : tpl.nameEn}
                </div>
                <div className="p-3 space-y-1">
                  <div className="text-xs font-bold truncate">{isAr ? tpl.titleAr : tpl.titleEn}</div>
                  <div className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>
                    {tpl.code} · {tpl.discountPercent}%
                  </div>
                  {active ? (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold"
                      style={{ color: 'var(--tone-success)' }}
                    >
                      <Check className="w-3 h-3" /> {isAr ? 'مختار' : 'Selected'}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {editing ? (
          <form onSubmit={saveEdits} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <div>
              <label className="text-[11px] font-bold block mb-1">{isAr ? 'العنوان (EN)' : 'Title (EN)'}</label>
              <input
                value={config.titleEn}
                onChange={(e) => setConfig({ ...config, titleEn: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold block mb-1">{isAr ? 'العنوان (AR)' : 'Title (AR)'}</label>
              <input
                dir="rtl"
                value={config.titleAr}
                onChange={(e) => setConfig({ ...config, titleAr: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold block mb-1">{isAr ? 'النص (EN)' : 'Body (EN)'}</label>
              <textarea
                rows={2}
                value={config.bodyEn}
                onChange={(e) => setConfig({ ...config, bodyEn: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border resize-none"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold block mb-1">{isAr ? 'النص (AR)' : 'Body (AR)'}</label>
              <textarea
                dir="rtl"
                rows={2}
                value={config.bodyAr}
                onChange={(e) => setConfig({ ...config, bodyAr: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border resize-none"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold block mb-1">{isAr ? 'الكود' : 'Code'}</label>
              <input
                value={config.code}
                onChange={(e) => setConfig({ ...config, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs rounded-xl border font-mono font-bold"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold block mb-1">{isAr ? 'نسبة الخصم' : 'Discount %'}</label>
              <input
                type="number"
                min={1}
                max={90}
                value={config.discountPercent}
                onChange={(e) =>
                  setConfig({ ...config, discountPercent: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full px-3 py-2 text-xs rounded-xl border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfig(readOfferConfig(activeStore.id));
                  setEditing(false);
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
                style={{ background: 'var(--portal-cta)' }}
              >
                {isAr ? 'حفظ' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => persist(defaultOfferConfig())}
                className="ms-auto px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ color: 'var(--muted)' }}
              >
                {isAr ? 'إعادة للافتراضي (متوقف)' : 'Reset to default (OFF)'}
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <OfferPopup
        open={previewOpen}
        lang={locale}
        config={config}
        onClose={() => setPreviewOpen(false)}
        onApplyCode={() => setPreviewOpen(false)}
      />
    </div>
  );
};
