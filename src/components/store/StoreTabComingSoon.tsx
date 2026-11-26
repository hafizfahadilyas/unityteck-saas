import React from 'react';
import {
  Sparkles,
  ArrowLeft,
  Lock,
  Bell,
  MessageCircle,
  Smartphone,
  Mail,
  MessageSquareText,
  MessagesSquare,
  Bot,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { labelForNav, STORE_NAV_KEYS } from '../../i18n/nav';

interface StoreTabComingSoonProps {
  tabId: string;
  onNavigateTab?: (tab: string) => void;
}

function iconForTab(tabId: string) {
  switch (tabId) {
    case 'whatsapp':
      return MessageCircle;
    case 'notifications':
      return Bell;
    case 'mobile-app':
      return Smartphone;
    case 'email':
      return Mail;
    case 'sms':
      return MessageSquareText;
    case 'live-chat':
      return MessagesSquare;
    case 'in-app-notifications':
      return Bell;
    case 'ai-conversations':
      return Bot;
    default:
      return Sparkles;
  }
}

export const StoreTabComingSoon: React.FC<StoreTabComingSoonProps> = ({
  tabId,
  onNavigateTab,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const title = labelForNav(locale, STORE_NAV_KEYS, tabId);
  const Icon = iconForTab(tabId);

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
        <div
          className="h-1.5 w-full"
          style={{
            background: 'linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--portal-cta) 80%, #f59e0b), var(--portal-cta))',
          }}
        />
        <div className="p-8 sm:p-10 space-y-5">
          <div
            className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center border"
            style={{
              background: 'color-mix(in srgb, #f59e0b 12%, transparent)',
              borderColor: 'color-mix(in srgb, #f59e0b 28%, transparent)',
              color: '#b45309',
            }}
          >
            <Icon className="w-8 h-8" aria-hidden />
          </div>

          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border"
            style={{
              background: 'color-mix(in srgb, #f59e0b 14%, transparent)',
              color: '#b45309',
              borderColor: 'color-mix(in srgb, #f59e0b 32%, transparent)',
            }}
          >
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
            className="flex items-start gap-2.5 text-start text-xs p-3.5 rounded-2xl border"
            style={{
              background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
              borderColor: 'color-mix(in srgb, var(--accent) 28%, transparent)',
              color: 'var(--accent)',
            }}
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
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer border transition-colors hover:opacity-90"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
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
