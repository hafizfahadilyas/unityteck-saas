import React from 'react';
import { Palette, Loader2 } from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';

export const ThemeBuilderLoadingShell: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/70 backdrop-blur-md text-white select-none transition-opacity duration-150"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'var(--font-ui)' }}
      aria-live="polite"
      aria-busy="true"
    >
      {/* Topbar skeleton mimicking visual builder topbar to prevent layout jump */}
      <div className="h-14 sm:h-16 px-4 bg-white/5 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 animate-pulse" />
          <div className="w-32 h-6 rounded-lg bg-white/10 animate-pulse" />
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-24 h-8 rounded-xl bg-white/10 animate-pulse" />
          <div className="w-24 h-8 rounded-xl bg-white/10 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-8 rounded-xl bg-emerald-500/20 animate-pulse" />
        </div>
      </div>

      {/* Center content loader */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="relative p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-emerald-500/30 shadow-2xl shadow-emerald-950/50 flex flex-col items-center text-center max-w-sm w-full mx-4">
          {/* Glowing pulse ring */}
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/40 animate-pulse">
              <Palette className="w-8 h-8 transition-transform" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-emerald-500/20 blur-md -z-10 animate-ping opacity-75" />
          </div>

          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{isAr ? 'استجابة فورية' : 'Instant Loading'}</span>
          </div>

          <h3 className="text-base font-extrabold text-white mt-1">
            {isAr ? 'جاري فتح محرر الثيم...' : 'Opening Theme Builder...'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-[240px] leading-relaxed">
            {isAr ? 'تجهيز المحرر البصري التفاعلي وكافة المكونات' : 'Preparing visual page builder & live preview'}
          </p>

          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-5 relative">
            <div className="absolute inset-y-0 start-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full w-2/3 animate-[pulse_1s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );
};
