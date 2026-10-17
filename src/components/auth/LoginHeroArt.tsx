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

/**
 * Saudi Commerce Cloud & 100 Stores Mission Hero Art
 * Modern enterprise illustration with Saudi digital network, cybersecurity shield, and multi-tenant commerce cloud
 */
export function SaudiCommerceHeroArt({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 360 290"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="saudiCloudBg" x1="20" y1="20" x2="340" y2="270" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0B4032" stopOpacity="0.85" />
          <stop offset="1" stopColor="#022B22" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="saudiGoldAccent" x1="60" y1="40" x2="300" y2="240" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="saudiShieldGrad" x1="180" y1="60" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <filter id="saudiGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background card with glass effect */}
      <rect x="18" y="24" width="324" height="242" rx="28" fill="url(#saudiCloudBg)" stroke="#10B981" strokeOpacity="0.3" strokeWidth="1.5" />

      {/* Saudi Network Grid & Connection Waves */}
      <path d="M45 80 Q180 120 315 70" stroke="#34D399" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="4 4" />
      <path d="M45 190 Q180 150 315 200" stroke="#34D399" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="4 4" />
      <path d="M90 60 L180 120 L270 60" stroke="#F59E0B" strokeOpacity="0.3" strokeWidth="1" />
      <path d="M90 220 L180 160 L270 220" stroke="#F59E0B" strokeOpacity="0.3" strokeWidth="1" />

      {/* City Nodes (Saudi Hubs: Riyadh, Jeddah, Makkah, Medina, Dammam) */}
      {/* Riyadh (Center Node) */}
      <circle cx="180" cy="140" r="44" fill="#047857" fillOpacity="0.35" filter="url(#saudiGlow)" />
      {/* Jeddah (West Node) */}
      <circle cx="75" cy="135" r="16" fill="#065F46" stroke="#34D399" strokeWidth="1.5" />
      <text x="75" y="165" fill="#A7F3D0" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Jeddah</text>

      {/* Makkah (Holy Capital Node) */}
      <circle cx="95" cy="195" r="18" fill="#065F46" stroke="#F59E0B" strokeWidth="2" />
      <text x="95" y="225" fill="#FDE68A" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Makkah</text>

      {/* Riyadh (Capital Headquarters) */}
      <circle cx="215" cy="95" r="19" fill="#065F46" stroke="#10B981" strokeWidth="2" />
      <text x="215" y="70" fill="#A7F3D0" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Riyadh</text>

      {/* Medina */}
      <circle cx="85" cy="75" r="15" fill="#065F46" stroke="#34D399" strokeWidth="1.5" />
      <text x="85" y="55" fill="#A7F3D0" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Medina</text>

      {/* Eastern Province / Dammam */}
      <circle cx="285" cy="135" r="17" fill="#065F46" stroke="#34D399" strokeWidth="1.5" />
      <text x="285" y="165" fill="#A7F3D0" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Dammam</text>

      {/* Inter-Node Glowing Lines */}
      <line x1="95" y1="195" x2="180" y2="140" stroke="#34D399" strokeWidth="2" opacity="0.6" />
      <line x1="75" y1="135" x2="180" y2="140" stroke="#34D399" strokeWidth="2" opacity="0.6" />
      <line x1="215" y1="95" x2="180" y2="140" stroke="#10B981" strokeWidth="2.5" opacity="0.8" />
      <line x1="285" y1="135" x2="180" y2="140" stroke="#34D399" strokeWidth="2" opacity="0.6" />
      <line x1="85" y1="75" x2="215" y2="95" stroke="#34D399" strokeWidth="1.5" opacity="0.4" />

      {/* Central Cybersecurity Shield (Bank Grade & Anti-SQLi) */}
      <g transform="translate(152, 108)">
        <path
          d="M28 2 C44 2 54 10 54 10 C54 36 38 54 28 60 C18 54 2 36 2 10 C2 10 12 2 28 2 Z"
          fill="url(#saudiShieldGrad)"
          stroke="#ECFDF5"
          strokeWidth="2"
        />
        {/* Checkmark inside shield */}
        <path
          d="M18 30 L25 37 L39 21"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Mission 100 Stores Saudi Badge */}
      <g transform="translate(195, 175)">
        <rect x="0" y="0" width="125" height="42" rx="12" fill="#042F2E" stroke="#F59E0B" strokeWidth="1.5" />
        <circle cx="16" cy="21" r="9" fill="#F59E0B" />
        <text x="16" y="24" fill="#000000" fontSize="10" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">🇸🇦</text>
        <text x="32" y="18" fill="#FDE68A" fontSize="10" fontWeight="800" fontFamily="sans-serif">مبادرة 100 متجر</text>
        <text x="32" y="31" fill="#99F6E4" fontSize="8" fontWeight="600" fontFamily="sans-serif">100+ Stores Mission</text>
      </g>

      {/* SSL 256-Bit & SQLi Shield Badge */}
      <g transform="translate(36, 175)">
        <rect x="0" y="0" width="115" height="42" rx="12" fill="#042F2E" stroke="#10B981" strokeWidth="1.5" />
        <circle cx="16" cy="21" r="9" fill="#10B981" />
        <path d="M13 21l2 2 4-4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="30" y="18" fill="#FFFFFF" fontSize="9" fontWeight="800" fontFamily="sans-serif">حماية سيبرانية شاملة</text>
        <text x="30" y="31" fill="#6EE7B7" fontSize="8" fontWeight="600" fontFamily="sans-serif">SQLi & Anti-DDoS</text>
      </g>
    </svg>
  );
}

/** Store specific flower bouquet art (fallback / theme reference) */
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
