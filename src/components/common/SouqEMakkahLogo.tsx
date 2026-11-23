import React from 'react';

const ANIM_CSS = `
@keyframes souq-glow {
  0%, 100% { filter: drop-shadow(0 0 2px rgba(212,160,23,0.35)); }
  50% { filter: drop-shadow(0 0 12px rgba(212,160,23,0.9)); }
}
@keyframes souq-spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes souq-spin-rev {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}
@keyframes souq-pulse {
  0%, 100% { transform: scale(1); opacity: 0.55; }
  50% { transform: scale(1.12); opacity: 1; }
}
@keyframes souq-shimmer {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(120%); }
}
@keyframes souq-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
@keyframes souq-crescent-draw {
  0% { stroke-dashoffset: 64; opacity: 0.35; }
  45% { stroke-dashoffset: 0; opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 0.85; }
}
@keyframes souq-star-twinkle {
  0%, 100% { opacity: 0.35; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1.15); }
}
@keyframes souq-kaaba-breathe {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-1px) scale(1.04); }
}
.souq-logo-root {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  min-width: 0;
}
.souq-mark-wrap {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  animation: souq-glow 2.8s ease-in-out infinite, souq-float 3.2s ease-in-out infinite;
}
.souq-mark-wrap.sm { width: 36px; height: 36px; }
.souq-mark-wrap.lg { width: 52px; height: 52px; }
.souq-orbit {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 1.5px dashed rgba(212,160,23,0.45);
  animation: souq-spin-slow 10s linear infinite;
}
.souq-orbit-inner {
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  border: 1px solid rgba(245,230,184,0.22);
  animation: souq-spin-rev 14s linear infinite;
  pointer-events: none;
}
.souq-orbit-dot {
  position: absolute;
  top: -2px;
  inset-inline-start: 50%;
  width: 5px;
  height: 5px;
  margin-inline-start: -2.5px;
  border-radius: 50%;
  background: #F5E6B8;
  box-shadow: 0 0 6px #D4A017;
  animation: souq-pulse 1.8s ease-in-out infinite;
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
  background: linear-gradient(90deg, transparent, rgba(245,230,184,0.4), transparent);
  animation: souq-shimmer 2.6s ease-in-out infinite;
}
.souq-mark-svg .souq-crescent-stroke {
  fill: none;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-dasharray: 64;
  stroke-dashoffset: 64;
  animation: souq-crescent-draw 3.6s ease-in-out infinite;
}
.souq-mark-svg .souq-star {
  transform-origin: 46px 20px;
  animation: souq-star-twinkle 2.2s ease-in-out infinite;
}
.souq-mark-svg .souq-kaaba {
  transform-origin: 32px 40px;
  animation: souq-kaaba-breathe 2.8s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .souq-mark-wrap,
  .souq-orbit,
  .souq-orbit-inner,
  .souq-orbit-dot,
  .souq-shimmer-bar::after,
  .souq-mark-svg .souq-crescent-stroke,
  .souq-mark-svg .souq-star,
  .souq-mark-svg .souq-kaaba {
    animation: none !important;
  }
  .souq-mark-svg .souq-crescent-stroke {
    stroke-dashoffset: 0;
    opacity: 0.85;
  }
}
`;

const TITLE_AR = 'منصة سوق';
const TITLE_EN = 'Souq Platform';

/** Animated Saudi-modern mark — crescent + Kaaba geometry + gold glow (GIF-like loop) */
function MarkSvg({ size = 44, uid }: { size?: number; uid: string }) {
  const gold = `${uid}-gold`;
  const deep = `${uid}-deep`;
  const glow = `${uid}-glow`;
  return (
    <svg
      className="souq-mark-svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={gold} x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5E6B8" />
          <stop offset="45%" stopColor="#D4A017" />
          <stop offset="100%" stopColor="#A67C00" />
        </linearGradient>
        <linearGradient id={deep} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0B3D4A" />
          <stop offset="100%" stopColor="#04222B" />
        </linearGradient>
        <radialGradient id={glow} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#D4A017" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#D4A017" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#${glow})`} />
      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${deep})`} />
      <rect
        x="4.5"
        y="4.5"
        width="55"
        height="55"
        rx="14"
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth="1.4"
        opacity="0.75"
      />
      {/* Crescent fill */}
      <path
        d="M42 18c-7.2 1.2-12.5 7.5-12.5 15s5.3 13.8 12.5 15c-8.8.2-16-7-16-15.5S33.2 17.8 42 18z"
        fill={`url(#${gold})`}
      />
      {/* Arabic-style crescent stroke redraw (GIF loop) */}
      <path
        className="souq-crescent-stroke"
        d="M40.5 19.5c-6.4 1.4-11 7.1-11 13.5s4.6 12.1 11 13.5"
        stroke={`url(#${gold})`}
      />
      {/* Kaaba-inspired cube */}
      <g className="souq-kaaba">
        <path d="M22 34l10-5 10 5v12l-10 5-10-5V34z" fill="#F5E6B8" opacity="0.95" />
        <path d="M22 34l10 5 10-5-10-5-10 5z" fill="#D4A017" />
        <path d="M32 39v12" stroke="#0B3D4A" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M24 42.5h16" stroke="#0B3D4A" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
      </g>
      <circle className="souq-star" cx="46" cy="20" r="2.2" fill="#F5E6B8" />
    </svg>
  );
}

function AnimatedMark({
  size,
  wrapClass,
  isAr,
  className = '',
}: {
  size: number;
  wrapClass: string;
  isAr: boolean;
  className?: string;
}) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <span
      className={`souq-mark-wrap ${wrapClass} ${className}`.trim()}
      role="img"
      aria-label={isAr ? TITLE_AR : TITLE_EN}
    >
      <style>{ANIM_CSS}</style>
      <span className="souq-orbit" aria-hidden />
      <span className="souq-orbit-inner" aria-hidden />
      <span className="souq-orbit-dot" aria-hidden />
      <MarkSvg size={size} uid={uid} />
      <span className="souq-shimmer-bar" aria-hidden />
    </span>
  );
}

/** Collapsed sidebar — animated mark only */
export const SouqEMakkahMark: React.FC<{ className?: string; isAr?: boolean }> = ({
  className = '',
  isAr = false,
}) => <AnimatedMark size={36} wrapClass="sm" isAr={isAr} className={className} />;

/** Expanded sidebar — centered animated mark only (no wordmark text) */
export const SouqEMakkahLogo: React.FC<{ className?: string; isAr?: boolean }> = ({
  className = '',
  isAr = false,
}) => (
  <span className={`souq-logo-root ${className}`} dir={isAr ? 'rtl' : 'ltr'}>
    <AnimatedMark size={48} wrapClass="lg" isAr={isAr} />
  </span>
);
