import React from 'react';
import { Palette, Loader2 } from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';

/**
 * Suspense fallback while VisualThemeBuilder chunk loads.
 * Holst portal tokens + glass — same global chrome as Master/Store admin.
 */
export const ThemeBuilderLoadingShell: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col select-none transition-opacity duration-150"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        fontFamily: 'var(--font-ui)',
        color: 'var(--text)',
        background: 'color-mix(in srgb, var(--portal-cta, #0f172a) 55%, transparent)',
        backdropFilter: 'blur(18px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
      }}
      aria-live="polite"
      aria-busy="true"
      data-theme-builder-loading="1"
      data-glass-shell="1"
    >
      {/* Topbar skeleton — Holst glass bars */}
      <div
        data-vb-topbar="on"
        className="px-3 sm:px-4 pt-2 pb-2 border-b flex flex-col gap-2 shrink-0"
        style={{
          background: 'color-mix(in srgb, var(--surface) 35%, transparent)',
          borderColor: 'color-mix(in srgb, #ffffff 22%, var(--border))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div data-vb-topbar-row="1" className="flex items-center justify-between gap-2 min-h-9 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl animate-pulse"
              style={{ background: 'color-mix(in srgb, var(--surface) 45%, transparent)' }}
            />
            <div
              className="w-28 sm:w-32 h-6 rounded-lg animate-pulse"
              style={{ background: 'color-mix(in srgb, var(--surface) 40%, transparent)' }}
            />
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-16 sm:w-20 h-8 rounded-xl animate-pulse"
              style={{ background: 'color-mix(in srgb, var(--surface) 40%, transparent)' }}
            />
            <div
              className="w-20 sm:w-24 h-8 rounded-xl animate-pulse"
              style={{
                background: 'color-mix(in srgb, var(--portal-cta) 28%, transparent)',
              }}
            />
          </div>
        </div>
        <div
          data-vb-topbar-row="2"
          className="flex items-center justify-between gap-2 min-h-9 shrink-0 border-t pt-1"
          style={{ borderColor: 'color-mix(in srgb, #ffffff 18%, var(--border))' }}
        >
          <div className="hidden sm:flex items-center gap-2">
            <div
              className="w-36 h-8 rounded-xl animate-pulse"
              style={{ background: 'color-mix(in srgb, var(--surface) 40%, transparent)' }}
            />
            <div
              className="w-24 h-8 rounded-xl animate-pulse"
              style={{ background: 'color-mix(in srgb, var(--surface) 40%, transparent)' }}
            />
          </div>
          <div className="flex items-center gap-2 ms-auto">
            <div
              className="w-20 h-8 rounded-xl animate-pulse"
              style={{ background: 'color-mix(in srgb, var(--surface) 40%, transparent)' }}
            />
            <div
              className="w-16 h-8 rounded-xl animate-pulse"
              style={{ background: 'color-mix(in srgb, var(--surface) 40%, transparent)' }}
            />
          </div>
        </div>
      </div>

      {/* Center glass card */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div
          className="relative p-5 sm:p-7 rounded-2xl sm:rounded-3xl border flex flex-col items-center text-center max-w-[min(92vw,22rem)] w-full"
          style={{
            background:
              'linear-gradient(165deg, color-mix(in srgb, var(--surface) 72%, transparent), color-mix(in srgb, var(--surface) 42%, transparent))',
            borderColor: 'color-mix(in srgb, var(--accent, var(--portal-cta)) 35%, var(--border))',
            boxShadow:
              '0 20px 48px color-mix(in srgb, var(--text) 18%, transparent), inset 0 1px 0 color-mix(in srgb, #ffffff 40%, transparent), 0 0 0 1px color-mix(in srgb, var(--accent) 12%, transparent)',
            backdropFilter: 'blur(22px) saturate(1.35)',
            WebkitBackdropFilter: 'blur(22px) saturate(1.35)',
            color: 'var(--text)',
            fontFamily: 'var(--font-ui)',
          }}
          data-glass-card="theme-builder-loading"
        >
          <div className="relative mb-3.5">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{
                background: 'var(--portal-cta)',
                boxShadow: '0 10px 28px color-mix(in srgb, var(--portal-cta) 45%, transparent)',
              }}
            >
              <Palette className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div
              className="absolute -inset-1 rounded-2xl blur-md -z-10 opacity-60 animate-pulse"
              style={{ background: 'color-mix(in srgb, var(--accent) 35%, transparent)' }}
            />
          </div>

          <div
            className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-1"
            style={{ color: 'var(--accent)' }}
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span>{isAr ? 'تحميل فوري' : 'Instant Loading'}</span>
          </div>

          <h3
            className="text-sm sm:text-base font-extrabold mt-1 tracking-tight"
            style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}
          >
            {isAr ? 'جاري فتح محرر الثيم…' : 'Opening Theme Builder…'}
          </h3>
          <p
            className="text-[11px] mt-1.5 max-w-[240px] leading-relaxed"
            style={{ color: 'var(--muted)', fontFamily: 'var(--font-ui)' }}
          >
            {isAr
              ? 'تجهيز المحرر البصري والمعاينة المباشرة'
              : 'Preparing visual page builder & live preview'}
          </p>

          <div
            className="w-full h-1.5 rounded-full overflow-hidden mt-5 relative"
            style={{ background: 'color-mix(in srgb, var(--text) 12%, transparent)' }}
          >
            <div
              className="absolute inset-y-0 start-0 rounded-full w-2/3 animate-pulse"
              style={{
                background:
                  'linear-gradient(90deg, var(--portal-cta), var(--accent), var(--portal-cta))',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
