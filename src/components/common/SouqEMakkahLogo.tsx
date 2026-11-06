import React from 'react';

const ANIM_CSS = `
@keyframes souq-glow {
  0%, 100% { filter: drop-shadow(0 0 2px rgba(212,160,23,0.35)); }
  50% { filter: drop-shadow(0 0 10px rgba(212,160,23,0.85)); }
}
@keyframes souq-spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes souq-pulse {
  0%, 100% { transform: scale(1); opacity: 0.55; }
  50% { transform: scale(1.08); opacity: 1; }
}
@keyframes souq-shimmer {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(120%); }
}
@keyframes souq-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
.souq-logo-root { position: relative; display: inline-flex; align-items: center; gap: 10px; max-width: 100%; min-width: 0; direction: ltr; }
.souq-mark-wrap {
  position: relative;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  animation: souq-glow 2.8s ease-in-out infinite, souq-float 3.2s ease-in-out infinite;
}
.souq-mark-wrap.sm { width: 42px; height: 42px; }
.souq-orbit {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 1.5px dashed rgba(212,160,23,0.45);
  animation: souq-spin-slow 10s linear infinite;
}
.souq-orbit-dot {
  position: absolute;
  top: -2px;
  left: 50%;
  width: 5px;
  height: 5px;
  margin-left: -2.5px;
  border-radius: 50%;
  background: #F5E6B8;
  box-shadow: 0 0 6px #D4A017;
  animation: souq-pulse 1.8s ease-in-out infinite;
}
.souq-word {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  flex: 1;
  line-height: 1.15;
  direction: ltr;
}
.souq-word[lang="ar"] .souq-title,
.souq-word[lang="ar"] .souq-sub {
  direction: rtl;
  unicode-bidi: isolate;
  text-align: left;
  font-family: Tajawal, Cairo, system-ui, sans-serif;
}
.souq-word[lang="en"] .souq-title,
.souq-word[lang="en"] .souq-sub {
  direction: ltr;
  unicode-bidi: isolate;
  text-align: left;
  font-family: var(--font-ui), system-ui, sans-serif;
}
.souq-title {
  font-weight: 900;
  font-size: 16px;
  color: #F8FAFC;
  letter-spacing: 0;
  white-space: nowrap;
}
.souq-sub {
  font-weight: 600;
  font-size: 10.5px;
  color: #98D8D0;
  margin-top: 2px;
  white-space: normal;
  line-height: 1.35;
}
.souq-shimmer-bar {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 14px;
  pointer-events: none;
}
.souq-shimmer-bar::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40%;
  background: linear-gradient(90deg, transparent, rgba(245,230,184,0.35), transparent);
  animation: souq-shimmer 2.6s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .souq-mark-wrap, .souq-orbit, .souq-orbit-dot, .souq-shimmer-bar::after {
    animation: none !important;
  }
}
`;

/** Animated Saudi-modern mark — crescent + Kaaba geometry + gold glow */
function MarkSvg({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="souqGold" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5E6B8" />
          <stop offset="45%" stopColor="#D4A017" />
          <stop offset="100%" stopColor="#A67C00" />
        </linearGradient>
        <linearGradient id="souqDeep" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0B3D4A" />
          <stop offset="100%" stopColor="#04222B" />
        </linearGradient>
        <radialGradient id="souqGlow" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#D4A017" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#D4A017" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#souqGlow)" />
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#souqDeep)" />
      <rect
        x="4.5"
        y="4.5"
        width="55"
        height="55"
        rx="14"
        fill="none"
        stroke="url(#souqGold)"
        strokeWidth="1.4"
        opacity="0.75"
      />
      {/* Crescent */}
      <path
        d="M42 18c-7.2 1.2-12.5 7.5-12.5 15s5.3 13.8 12.5 15c-8.8.2-16-7-16-15.5S33.2 17.8 42 18z"
        fill="url(#souqGold)"
      />
      {/* Kaaba-inspired cube */}
      <path d="M22 34l10-5 10 5v12l-10 5-10-5V34z" fill="#F5E6B8" opacity="0.95" />
      <path d="M22 34l10 5 10-5-10-5-10 5z" fill="#D4A017" />
      <path d="M32 39v12" stroke="#0B3D4A" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M24 42.5h16" stroke="#0B3D4A" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
      <circle cx="46" cy="20" r="2.2" fill="#F5E6B8" />
    </svg>
  );
}

const TITLE_AR = 'منصة سوق';
const TITLE_EN = 'Souq Platform';
const SUB_AR = 'التجارة الإلكترونية الشاملة';
const SUB_EN = 'Complete e-commerce';

/** Collapsed sidebar — larger animated mark only */
export const SouqEMakkahMark: React.FC<{ className?: string; isAr?: boolean }> = ({
  className = '',
  isAr = false,
}) => (
  <span className={`souq-mark-wrap sm ${className}`} aria-label={isAr ? TITLE_AR : TITLE_EN}>
    <style>{ANIM_CSS}</style>
    <span className="souq-orbit" aria-hidden />
    <span className="souq-orbit-dot" aria-hidden />
    <MarkSvg size={42} />
    <span className="souq-shimmer-bar" aria-hidden />
  </span>
);

/** Expanded sidebar — larger Saudi modern animated wordmark (GIF-style loop) */
export const SouqEMakkahLogo: React.FC<{ className?: string; isAr?: boolean }> = ({
  className = '',
  isAr = false,
}) => (
  <span
    className={`souq-logo-root ${className}`}
    role="img"
    aria-label={isAr ? `${TITLE_AR}. ${SUB_AR}` : `${TITLE_EN}. ${SUB_EN}`}
  >
    <style>{ANIM_CSS}</style>
    <span className="souq-mark-wrap">
      <span className="souq-orbit" aria-hidden />
      <span className="souq-orbit-dot" aria-hidden />
      <MarkSvg size={56} />
      <span className="souq-shimmer-bar" aria-hidden />
    </span>
    <span className="souq-word" lang={isAr ? 'ar' : 'en'}>
      <span className="souq-title">{isAr ? TITLE_AR : TITLE_EN}</span>
      <span className="souq-sub">{isAr ? SUB_AR : SUB_EN}</span>
    </span>
  </span>
);
