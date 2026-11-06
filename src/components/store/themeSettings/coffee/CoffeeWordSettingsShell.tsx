import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Eye, Monitor, Save, Smartphone, Tablet } from 'lucide-react';
import { useTenant } from '../../../../context/TenantContext';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

export type CoffeeFormChromeProps = {
  onBack?: () => void;
  /** Narrow WordPress customizer sidebar — one preview, not three stacked frames */
  embedded?: boolean;
};

const DEVICES: { id: PreviewDevice; en: string; ar: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'desktop', en: 'Desktop', ar: 'سطح المكتب', Icon: Monitor },
  { id: 'tablet', en: 'Tablet', ar: 'جهاز لوحي', Icon: Tablet },
  { id: 'mobile', en: 'Mobile', ar: 'الجوال', Icon: Smartphone },
];

function DeviceFrame({
  initial,
  isAr,
  render,
  eager = false,
}: {
  initial: PreviewDevice;
  isAr: boolean;
  render: (device: PreviewDevice) => React.ReactNode;
  /** First frame mounts immediately; below-fold wait until visible */
  eager?: boolean;
}) {
  const [device, setDevice] = useState<PreviewDevice>(initial);
  const [visible, setVisible] = useState(eager);
  const rootRef = useRef<HTMLElement | null>(null);
  const meta = DEVICES.find((d) => d.id === device) || DEVICES[0];
  const frameWidth = device === 'mobile' ? 280 : device === 'tablet' ? 460 : '100%';

  useEffect(() => {
    if (eager || visible) return;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '120px 0px', threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eager, visible]);

  return (
    <section ref={rootRef} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <header className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-slate-100">
        <h3 className="text-[13px] font-semibold text-slate-800 truncate">
          {isAr ? `معاينة مباشرة - ${meta.ar}` : `Live Preview - ${meta.en}`}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          {DEVICES.map((d) => {
            const active = d.id === device;
            const Icon = d.Icon;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDevice(d.id)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                  active ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? d.ar : d.en}</span>
              </button>
            );
          })}
        </div>
      </header>
      <div className="bg-[#F3F5F8] p-3 sm:p-4 flex justify-center">
        <div className="w-full" style={{ maxWidth: frameWidth }}>
          <div className="rounded-xl bg-white border border-slate-200/80 shadow-sm overflow-hidden min-h-[120px]">
            {visible ? (
              render(device)
            ) : (
              <div className="h-28 animate-pulse bg-slate-100" aria-hidden />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Word-style theme editor: header actions, left settings, right desktop/tablet/mobile frames.
 * Preview renders the draft. Save is the only publish path.
 */
export const CoffeeWordSettingsShell: React.FC<{
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  isAr: boolean;
  onBack?: () => void;
  onSave: () => void;
  saving?: boolean;
  savedFlash?: boolean;
  settings: React.ReactNode;
  preview: (device: PreviewDevice) => React.ReactNode;
  /** Inside WordPress customizer sidebar — settings only + one compact draft preview */
  embedded?: boolean;
}> = ({
  titleEn,
  titleAr,
  subtitleEn,
  subtitleAr,
  isAr,
  onBack,
  onSave,
  saving,
  savedFlash,
  settings,
  preview,
  embedded = false,
}) => {
  const { activeStore } = useTenant();

  const previewStore = () => {
    const slug = activeStore?.slug || 'coffee';
    window.open(`/?store=${encodeURIComponent(slug)}&fullscreen=1`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`rounded-2xl bg-[#F4F6FB] text-slate-900 space-y-4 ${embedded ? 'p-2 sm:p-3' : 'p-3 sm:p-4'}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <header className={`flex flex-col ${embedded ? 'gap-2' : 'lg:flex-row lg:items-center justify-between gap-3'}`}>
        <div className="flex items-start gap-2 min-w-0">
          {onBack && !embedded ? (
            <button
              type="button"
              onClick={onBack}
              className="mt-0.5 w-8 h-8 rounded-lg border border-slate-200 bg-white inline-flex items-center justify-center text-slate-600 shrink-0"
              aria-label={isAr ? 'رجوع' : 'Back'}
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
          ) : null}
          <div className="min-w-0">
            <h2 className={`${embedded ? 'text-sm' : 'text-base sm:text-lg'} font-bold text-slate-900 leading-tight`}>
              {isAr ? titleAr : titleEn}
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">{isAr ? subtitleAr : subtitleEn}</p>
            <p className="text-[11px] text-amber-700 mt-1">
              {embedded
                ? isAr
                  ? 'المعاينة الحية على اليمين. احفظ لنشر التغييرات في قاعدة البيانات.'
                  : 'Live iframe preview is on the right. Save publishes to the database.'
                : isAr
                  ? 'المعاينة مسودة حتى حفظ التغييرات. «معاينة المتجر» تعرض المنشور فقط.'
                  : 'This preview is a draft until Save Changes. Preview in Store shows the published storefront only.'}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 shrink-0 ${embedded ? 'flex-wrap' : ''}`}>
          {!embedded ? (
            <button
              type="button"
              onClick={previewStore}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Eye className="w-3.5 h-3.5" />
              {isAr ? 'معاينة المتجر' : 'Preview in Store'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            {savedFlash
              ? isAr
                ? 'تم الحفظ'
                : 'Saved'
              : saving
                ? isAr
                  ? 'جارٍ الحفظ…'
                  : 'Saving…'
                : isAr
                  ? 'حفظ التغييرات'
                  : 'Save Changes'}
          </button>
        </div>
      </header>

      {embedded ? (
        <div className="space-y-4 min-w-0">
          <div className="space-y-4 min-w-0">{settings}</div>
          <DeviceFrame initial="mobile" isAr={isAr} render={preview} eager />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] gap-4 items-start">
          <div className="space-y-4 min-w-0">{settings}</div>
          <div className="space-y-4 min-w-0">
            <DeviceFrame initial="desktop" isAr={isAr} render={preview} eager />
            <DeviceFrame initial="tablet" isAr={isAr} render={preview} />
            <DeviceFrame initial="mobile" isAr={isAr} render={preview} />
          </div>
        </div>
      )}
    </div>
  );
};
