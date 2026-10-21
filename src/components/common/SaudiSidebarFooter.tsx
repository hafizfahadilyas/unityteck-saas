import React from 'react';
import { usePrefs } from '../../i18n/PrefsContext';

/** Shared Master+Store sidebar footer — Overview / Holst (EN+AR always). */
const SaudiSkyline: React.FC = () => (
  <svg
    viewBox="0 0 200 56"
    className="w-full h-12 mb-2 opacity-90"
    aria-hidden
    preserveAspectRatio="xMidYMax meet"
  >
    <defs>
      <linearGradient id="saudiSkyGradShared" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--portal-400)" stopOpacity="0.35" />
        <stop offset="100%" stopColor="var(--portal-600)" stopOpacity="0.15" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="200" height="56" fill="url(#saudiSkyGradShared)" rx="8" />
    <path
      fill="var(--portal-200)"
      fillOpacity="0.55"
      d="M96 52V18l4-10 4 10v34H96z"
    />
    <circle cx="100" cy="6" r="2.5" fill="var(--portal-400)" />
    <rect x="28" y="28" width="14" height="24" rx="1" fill="var(--portal-400)" fillOpacity="0.4" />
    <rect x="48" y="22" width="12" height="30" rx="1" fill="var(--portal-200)" fillOpacity="0.35" />
    <rect x="66" y="30" width="18" height="22" rx="1" fill="var(--portal-400)" fillOpacity="0.45" />
    <rect x="116" y="26" width="16" height="26" rx="1" fill="var(--portal-200)" fillOpacity="0.4" />
    <rect x="138" y="18" width="14" height="34" rx="1" fill="var(--portal-400)" fillOpacity="0.5" />
    <rect x="158" y="32" width="20" height="20" rx="1" fill="var(--portal-200)" fillOpacity="0.35" />
    <path
      fill="none"
      stroke="var(--portal-400)"
      strokeOpacity="0.5"
      strokeWidth="1.2"
      d="M0 52h200"
    />
  </svg>
);

export const SaudiSidebarFooter: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { t, locale } = usePrefs();
  const isEn = locale === 'en';

  return (
    <div
      className={`${compact ? 'm-0 p-2 rounded-xl' : 'm-2.5 p-2.5 rounded-2xl'} border text-center relative overflow-hidden shrink-0`}
      style={{
        background: 'linear-gradient(165deg, var(--portal-900), var(--portal-950))',
        borderColor: 'color-mix(in srgb, var(--portal-400) 28%, transparent)',
        fontFamily: 'var(--font-ui)',
      }}
      data-chrome="saudi-sidebar-footer"
    >
      <SaudiSkyline />
      <p className="text-[10px] font-bold text-white tracking-wide leading-snug px-0.5">
        {isEn ? t('saudiFooterEn') : t('saudiFooterAr')}
      </p>
      <p
        className="text-[9px] font-semibold mt-1 leading-snug px-0.5"
        style={{ color: 'var(--portal-200)', fontFamily: 'var(--font-ui)' }}
      >
        {isEn
          ? 'Enterprise Multi-Store Platform'
          : 'منصة التجارة الإلكترونية متعددة المتاجر'}
      </p>
    </div>
  );
};
