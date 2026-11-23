import React, { useCallback, useEffect, useState } from 'react';
import { LayoutTemplate } from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import { useToast } from '../../common/ToastProvider';
import { GlobalModal } from '../../common/GlobalModal';
import {
  applyDashboardLookPack,
  bindStoreChrome,
  DASHBOARD_LOOK_PACKS,
  readChromeCache,
  rememberPendingChrome,
  resolveDashboardLookId,
  saveStoreChrome,
  type DashboardLookId,
  type StoreChromeBrand,
} from '../../../i18n/storeChrome';

type DashboardLookSwitchProps = {
  /** Compact = overview header; card = settings appearance */
  variant?: 'compact' | 'card';
  /** When parent owns chrome state (Settings), sync after apply */
  onApplied?: (next: StoreChromeBrand) => void;
  /** Controlled active id (optional — defaults to cache) */
  activeLookId?: DashboardLookId;
};

/**
 * Exactly 2 full-dashboard look packs (Glass Soft | Night Luxe).
 * Soft-applies chrome + persists per store_id.
 * Switching look = default pack change → confirm popup first.
 */
export const DashboardLookSwitch: React.FC<DashboardLookSwitchProps> = ({
  variant = 'compact',
  onApplied,
  activeLookId: controlledId,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { activeStore } = useTenant();
  const { toast } = useToast();
  const storeId = activeStore?.id || '';
  const [activeId, setActiveId] = useState<DashboardLookId>(() =>
    resolveDashboardLookId(readChromeCache(storeId)),
  );
  const [busy, setBusy] = useState(false);
  const [pendingLookId, setPendingLookId] = useState<DashboardLookId | null>(null);

  useEffect(() => {
    if (!storeId) return;
    setActiveId(resolveDashboardLookId(readChromeCache(storeId)));
  }, [storeId]);

  useEffect(() => {
    if (controlledId) setActiveId(controlledId);
  }, [controlledId]);

  const applyLook = useCallback(
    async (id: DashboardLookId) => {
      if (!storeId || busy || id === activeId) return;
      setBusy(true);
      setPendingLookId(null);
      const prev = readChromeCache(storeId);
      const next = applyDashboardLookPack(prev, id);
      try {
        // Look packs change colors/presets only — never delete merchant wallpaper/sidebar images
        bindStoreChrome(storeId, next);
        rememberPendingChrome(storeId, next);
        setActiveId(id);
        onApplied?.(next);
        const pack = DASHBOARD_LOOK_PACKS.find((p) => p.id === id);
        toast(isAr ? pack?.toastAr || '' : pack?.toastEn || '', 'success');
        await saveStoreChrome(storeId, next);
      } catch {
        toast(
          isAr ? 'تعذر حفظ مظهر لوحة التحكم' : 'Could not save dashboard look',
          'error',
        );
      } finally {
        setBusy(false);
      }
    },
    [storeId, busy, activeId, onApplied, toast, isAr],
  );

  const pendingPack = pendingLookId
    ? DASHBOARD_LOOK_PACKS.find((p) => p.id === pendingLookId)
    : null;

  const confirmModal = (
    <GlobalModal
      isOpen={pendingLookId != null}
      onClose={() => setPendingLookId(null)}
      role="alertdialog"
      aria-label={isAr ? 'تأكيد تغيير المظهر الافتراضي' : 'Confirm default look change'}
      contentClassName="max-w-md"
    >
      {pendingPack ? (
        <div
          className="w-full rounded-[1.25rem] p-5 sm:p-6 space-y-4 shadow-2xl border"
          style={{
            background: 'var(--glass-fill-strong, var(--surface, #fff))',
            borderColor: 'var(--glass-border, var(--border))',
            color: 'var(--text)',
          }}
        >
          <h3 className="text-base font-black">
            {isAr ? 'تغيير مظهر لوحة التحكم؟' : 'Change dashboard look?'}
          </h3>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {isAr
              ? `سيتم تطبيق «${pendingPack.labelAr}» على هذا المتجر فقط. يمكنك لاحقاً تخصيص الألوان من الإعدادات.`
              : `Apply “${pendingPack.label}” for this store only. You can still customize colors later in Settings.`}
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl text-sm font-bold border cursor-pointer"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              onClick={() => setPendingLookId(null)}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              className="unity-btn-primary px-4 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-55"
              disabled={busy}
              aria-busy={busy || undefined}
              onClick={() => void applyLook(pendingPack.id)}
            >
              {isAr ? 'تأكيد' : 'Confirm'}
            </button>
          </div>
        </div>
      ) : null}
    </GlobalModal>
  );

  const buttons = (
    <div
      className={`inline-flex items-stretch rounded-full border p-0.5 gap-0.5 ${
        variant === 'card' ? 'w-full sm:w-auto' : ''
      }`}
      style={{
        background: 'var(--glass-fill, var(--surface))',
        borderColor: 'var(--glass-border, var(--border))',
      }}
      role="group"
      aria-label={isAr ? 'مظهر لوحة التحكم' : 'Dashboard look'}
    >
      {DASHBOARD_LOOK_PACKS.map((pack) => {
        const pressed = activeId === pack.id;
        return (
          <button
            key={pack.id}
            type="button"
            disabled={busy}
            aria-pressed={pressed}
            aria-busy={busy && pressed ? true : undefined}
            onClick={() => {
              if (busy || pack.id === activeId) return;
              setPendingLookId(pack.id);
            }}
            className="flex-1 sm:flex-none px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer disabled:opacity-55 disabled:cursor-wait"
            style={
              pressed
                ? {
                    background: 'var(--glass-navy, var(--portal-cta, #0f172a))',
                    color: '#ffffff',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.18)',
                  }
                : {
                    background: 'transparent',
                    color: 'var(--text)',
                  }
            }
          >
            {isAr ? pack.labelAr : pack.label}
          </button>
        );
      })}
    </div>
  );

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-2 min-w-0">
        <span className="sr-only">{isAr ? 'مظهر لوحة التحكم' : 'Dashboard look'}</span>
        {buttons}
        {confirmModal}
      </div>
    );
  }

  return (
    <div
      className="u-card p-4 sm:p-5 rounded-[1.25rem] space-y-3"
      style={{ color: 'var(--text)' }}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'color-mix(in srgb, var(--accent) 12%, var(--surface))',
            color: 'var(--accent)',
          }}
        >
          <LayoutTemplate className="w-4 h-4" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold text-sm">
            {isAr ? 'مظهر لوحة التحكم' : 'Dashboard look'}
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'زجاج ناعم أو ليل فاخر — الشريط والخلفية والألوان معاً لهذا المتجر فقط. التغيير يحتاج تأكيداً.'
              : 'Glass Soft or Night Luxe — sidebar, wallpaper, and colors together for this store only. Change asks for confirmation.'}
          </p>
        </div>
      </div>
      {buttons}
      {confirmModal}
    </div>
  );
};
