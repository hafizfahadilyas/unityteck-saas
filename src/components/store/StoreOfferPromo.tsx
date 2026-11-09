import React, { useCallback, useEffect, useState } from 'react';
import { Gift, Eye, Pencil, Power } from 'lucide-react';
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
import { OfferPopup } from '../../themes/flowersPremium/OfferPopup';
import { OfferDisplaySettingsPanel } from './OfferDisplaySettingsPanel';

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

  const toggleEnabled = () => {
    const next = { ...config, enabled: !config.enabled };
    persist(next);
    toast(
      next.enabled
        ? isAr
          ? 'تم تفعيل نافذة الكوبون على الواجهة'
          : 'Coupon popup enabled on storefront'
        : isAr
          ? 'نافذة الكوبون متوقفة — لن تظهر افتراضياً'
          : 'Coupon popup off — will not show by default',
      'success',
    );
  };

  const saveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    persist(config);
    setEditing(false);
    toast(isAr ? 'تم حفظ نافذة الكوبون' : 'Coupon popup saved', 'success');
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
              <h3 className="font-bold text-sm">{isAr ? 'نافذة الكوبون المنبثقة' : 'Coupon popup'}</h3>
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
                {isAr ? 'نافذة الكوبون المنبثقة' : 'Coupon popup'}
              </h2>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'افتراضياً متوقف — فعّله ليظهر على واجهة المتجر. يدعم العربية والإنجليزية والوضع الداكن والفاتح.'
                : 'Off by default — turn on to show on the storefront. Supports Arabic and English, dark and light mode.'}
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
              {isAr ? 'معاينة على الواجهة' : 'View on storefront'}
            </button>
          </div>
        </div>

        <OfferDisplaySettingsPanel
          config={config}
          setConfig={setConfig}
          isAr={isAr}
          editing={editing}
          onToggleEditing={() => setEditing((v) => !v)}
          onSave={saveEdits}
          onCancelEdit={() => {
            setConfig(readOfferConfig(activeStore.id));
            setEditing(false);
          }}
          onResetDefault={() => persist(defaultOfferConfig())}
        />
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
