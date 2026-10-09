import React from 'react';

/** Decorative Holst SVG for Master login hero (platform / control plane). */
export function MasterLoginArt({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="mGrad" x1="40" y1="40" x2="280" y2="240" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1D8B94" />
          <stop offset="1" stopColor="#4FB8B4" />
        </linearGradient>
        <linearGradient id="mSoft" x1="160" y1="20" x2="160" y2="260" gradientUnits="userSpaceOnUse">
          <stop stopColor="#98D8D0" stopOpacity="0.35" />
          <stop offset="1" stopColor="#E2F4F0" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <rect x="24" y="36" width="272" height="208" rx="28" fill="url(#mSoft)" />
      <rect x="56" y="68" width="120" height="144" rx="16" fill="url(#mGrad)" opacity="0.95" />
      <rect x="188" y="68" width="76" height="64" rx="12" fill="#0A3D4A" opacity="0.85" />
      <rect x="188" y="148" width="76" height="64" rx="12" fill="#10606F" opacity="0.9" />
      <circle cx="116" cy="112" r="22" fill="#E2F4F0" opacity="0.9" />
      <path
        d="M106 112l6 6 12-14"
        stroke="#1D8B94"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="72" y="148" width="88" height="8" rx="4" fill="#E2F4F0" opacity="0.55" />
      <rect x="72" y="168" width="64" height="8" rx="4" fill="#E2F4F0" opacity="0.4" />
      <rect x="72" y="188" width="76" height="8" rx="4" fill="#E2F4F0" opacity="0.3" />
      <circle cx="226" cy="100" r="8" fill="#4FB8B4" />
      <circle cx="226" cy="180" r="8" fill="#98D8D0" />
    </svg>
  );
}

/** Makkah Fresh Flowers — Saudi Makkah fresh flowers bouquet (store-1 brand art). */
export function StoreLoginArt({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="stemGrad" x1="160" y1="120" x2="160" y2="250" gradientUnits="userSpaceOnUse">
          <stop stopColor="#047857" />
          <stop offset="1" stopColor="#064E3B" />
        </linearGradient>
        <linearGradient id="petalRed" x1="100" y1="40" x2="180" y2="140" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FB7185" />
          <stop offset="1" stopColor="#BE123C" />
        </linearGradient>
        <linearGradient id="petalCream" x1="180" y1="50" x2="240" y2="130" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FEF3C7" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* Soft ground — light on dark hero */}
      <ellipse cx="160" cy="248" rx="118" ry="22" fill="#ECFDF5" opacity="0.22" />

      {/* Leaves */}
      <ellipse cx="118" cy="175" rx="36" ry="16" transform="rotate(-35 118 175)" fill="#34D399" opacity="0.9" />
      <ellipse cx="208" cy="180" rx="34" ry="15" transform="rotate(32 208 180)" fill="#10B981" opacity="0.85" />

      {/* Stems */}
      <path d="M148 130 C145 170 142 200 138 235" stroke="url(#stemGrad)" strokeWidth="5" strokeLinecap="round" />
      <path d="M168 125 C172 165 176 200 182 235" stroke="url(#stemGrad)" strokeWidth="5" strokeLinecap="round" />
      <path d="M158 120 C158 165 158 200 160 238" stroke="url(#stemGrad)" strokeWidth="6" strokeLinecap="round" />

      {/* Cream rose (right) */}
      <circle cx="198" cy="98" r="28" fill="url(#petalCream)" />
      <circle cx="210" cy="88" r="16" fill="#FEF9C3" opacity="0.9" />
      <circle cx="188" cy="92" r="14" fill="#FDE68A" opacity="0.85" />

      {/* Red rose (center) */}
      <circle cx="155" cy="82" r="34" fill="url(#petalRed)" />
      <circle cx="148" cy="72" r="18" fill="#FDA4AF" opacity="0.9" />
      <circle cx="165" cy="78" r="15" fill="#E11D48" opacity="0.75" />
      <circle cx="155" cy="88" r="10" fill="#9F1239" opacity="0.7" />

      {/* Soft white bloom (left) */}
      <circle cx="112" cy="105" r="24" fill="#ECFDF5" />
      <circle cx="104" cy="98" r="12" fill="#A7F3D0" opacity="0.85" />
      <circle cx="120" cy="100" r="11" fill="#FFFFFF" opacity="0.9" />

      {/* Small buds */}
      <circle cx="230" cy="130" r="10" fill="#FB7185" />
      <circle cx="95" cy="140" r="8" fill="#FDE68A" />

      {/* Makkah crescent mark (subtle) */}
      <path
        d="M248 58c-10 2-17 12-15 22 6-4 14-4 20 1 2-11-1-21-5-23z"
        fill="#ECFDF5"
        opacity="0.55"
      />
    </svg>
  );
}
