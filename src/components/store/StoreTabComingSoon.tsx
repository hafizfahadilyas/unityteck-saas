import React from 'react';
import { Sparkles, ArrowLeft, Lock, Bell, MessageCircle } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { labelForNav, STORE_NAV_KEYS } from '../../i18n/nav';

interface StoreTabComingSoonProps {
  tabId: string;
  onNavigateTab?: (tab: string) => void;
}

export const StoreTabComingSoon: React.FC<StoreTabComingSoonProps> = ({
  tabId,
  onNavigateTab,
}) => {
  const { t, locale } = usePrefs();
  const isAr = locale === 'ar';
  const title = labelForNav(t, STORE_NAV_KEYS, tabId);

  const Icon = tabId === 'whatsapp' ? MessageCircle : tabId === 'notifications' ? Bell : Sparkles;

  return (
    <div
      className="u-page w-full min-h-[60vh] flex items-center justify-center p-4 sm:p-8"
      style={{ fontFamily: 'var(--font-ui)', color: 'var(--text)' }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        className="w-full max-w-lg rounded-3xl border shadow-xl overflow-hidden text-center"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-amber-500 to-indigo-500" />
        <div className="p-8 sm:p-10 space-y-5">
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center border bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400">
            <Icon className="w-8 h-8" aria-hidden />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'قريباً' : 'Coming Soon'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{title}</h1>

          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'هذه الصفحة قيد التجهيز وستتوفر قريباً في لوحة التحكم. القائمة الجانبية تبقيها ظاهرة حتى الإطلاق.'
              : 'This page is being prepared and will be available soon in your dashboard. It stays visible in the sidebar until launch.'}
          </p>

          <div
            className="flex items-start gap-2.5 text-start text-xs p-3.5 rounded-2xl border bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800/40 text-teal-800 dark:text-teal-300"
          >
            <Lock className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            <p className="leading-snug">
              {isAr
                ? 'عند الجاهزية ستفتح الصفحة الكاملة تلقائياً من نفس عنصر القائمة.'
                : 'When ready, the full page will open from the same sidebar item.'}
            </p>
          </div>

          {onNavigateTab ? (
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{isAr ? 'العودة إلى لوحة التحكم' : 'Back to dashboard'}</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
