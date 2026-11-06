import React from 'react';

interface IconProps {
  className?: string;
  title?: string;
  style?: React.CSSProperties;
  /** Accepted for Lucide-compatible call sites (sidebar); brand SVGs are fill-based */
  strokeWidth?: number | string;
}

/** Official-style brand marks for order sources, social & KSA payments */

export const TikTokIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', title = 'TikTok' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden={!title} role="img">
    {title ? <title>{title}</title> : null}
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .56.04.82.12v-3.4a6.37 6.37 0 0 0-.82-.05A6.34 6.34 0 0 0 3.15 15.8a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.19 8.19 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15z" />
  </svg>
);

export const SnapchatIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', title = 'Snapchat' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden={!title} role="img">
    {title ? <title>{title}</title> : null}
    <path d="M12.017 1.5c-2.4 0-4.35 1.78-4.35 4.53v.56c0 .2-.06.7-.7.9-.45.14-.95-.12-1.12-.22-.3-.17-.67-.15-.9.1-.22.25-.2.62.05.85.08.07.85.7 1.55 1.05.55.28.7.6.7 1.05 0 .95-.6 1.95-1.75 2.85-.5.4-1.05.7-1.7.95-.25.1-.42.35-.42.62 0 .55.55.95 1.85 1.2.15.9.55 2.05 1.6 2.7.35.22.75.2 1.05-.05.35-.28.8-.55 1.35-.55.35 0 .7.1 1.05.25.45.2.95.35 1.5.35s1.05-.15 1.5-.35c.35-.15.7-.25 1.05-.25.55 0 1 .27 1.35.55.3.25.7.27 1.05.05 1.05-.65 1.45-1.8 1.6-2.7 1.3-.25 1.85-.65 1.85-1.2 0-.27-.17-.52-.42-.62-.65-.25-1.2-.55-1.7-.95-1.15-.9-1.75-1.9-1.75-2.85 0-.45.15-.77.7-1.05.7-.35 1.47-.98 1.55-1.05.25-.23.27-.6.05-.85-.23-.25-.6-.27-.9-.1-.17.1-.67.36-1.12.22-.64-.2-.7-.7-.7-.9v-.56c0-2.75-1.95-4.53-4.35-4.53z" />
  </svg>
);

export const InstagramBrandIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', title = 'Instagram' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden={!title} role="img">
    {title ? <title>{title}</title> : null}
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.12.14 4.58 1.62 4.72 4.72.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.14 3.1-1.6 4.58-4.72 4.72-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.12-.14-4.58-1.62-4.72-4.72-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.57 3.85 4.03 2.37 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16m0-2.16C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.36-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.69 21.31.27 16.95.07 15.67.01 15.26 0 12 0z" />
    <path d="M12 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 12 7.84a4 4 0 0 1 0 8.16zM18.41 4.15a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
  </svg>
);

export const FacebookBrandIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', title = 'Facebook' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden={!title} role="img">
    {title ? <title>{title}</title> : null}
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export const WhatsAppBrandIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', title = 'WhatsApp', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" aria-hidden={!title} role="img">
    {title ? <title>{title}</title> : null}
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

export const XBrandIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', title = 'X' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden={!title} role="img">
    {title ? <title>{title}</title> : null}
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const YouTubeBrandIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', title = 'YouTube' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden={!title} role="img">
    {title ? <title>{title}</title> : null}
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export const GoogleAdsIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', title = 'Google Ads' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden={!title} role="img">
    {title ? <title>{title}</title> : null}
    <path fill="#FBBC04" d="M3.5 19.5 12 4.5l4.2 7.5H9.8L3.5 19.5z" />
    <path fill="#4285F4" d="M12 4.5 20.5 19.5H12l-4.2-7.5L12 4.5z" />
    <circle fill="#34A853" cx="5.2" cy="18.2" r="3.2" />
  </svg>
);

export const SmsaIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', title = 'SMSA' }) => (
  <span className={`inline-flex items-center justify-center rounded bg-[#c8102e] text-white font-black text-[9px] px-1.5 py-0.5 ${className}`} title={title}>
    SMSA
  </span>
);

export const AramexIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', title = 'Aramex' }) => (
  <span className={`inline-flex items-center justify-center rounded bg-[#e31837] text-white font-black text-[8px] px-1.5 py-0.5 tracking-tight ${className}`} title={title}>
    aramex
  </span>
);

export const SplIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', title = 'SPL' }) => (
  <span className={`inline-flex items-center justify-center rounded bg-[#006633] text-white font-black text-[9px] px-1.5 py-0.5 ${className}`} title={title}>
    SPL
  </span>
);

export const TelegramBrandIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', title = 'Telegram' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden={!title} role="img">
    {title ? <title>{title}</title> : null}
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.788.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.447 4.476-1.456z" />
  </svg>
);

export const ORDER_SOURCE_OPTIONS: { value: string; labelEn: string; labelAr: string }[] = [
  { value: 'Direct', labelEn: 'Direct / Walk-in', labelAr: 'مباشر / متجر' },
  { value: 'Website', labelEn: 'Website', labelAr: 'الموقع' },
  { value: 'TikTok', labelEn: 'TikTok', labelAr: 'تيك توك' },
  { value: 'Snapchat', labelEn: 'Snapchat', labelAr: 'سناب شات' },
  { value: 'Instagram', labelEn: 'Instagram', labelAr: 'إنستغرام' },
  { value: 'WhatsApp', labelEn: 'WhatsApp', labelAr: 'واتساب' },
  { value: 'Facebook', labelEn: 'Facebook', labelAr: 'فيسبوك' },
  { value: 'X', labelEn: 'X (Twitter)', labelAr: 'إكس (تويتر)' },
  { value: 'Telegram', labelEn: 'Telegram', labelAr: 'تيليجرام' },
  { value: 'Google Ads', labelEn: 'Google Ads', labelAr: 'إعلانات جوجل' },
  { value: 'YouTube', labelEn: 'YouTube', labelAr: 'يوتيوب' },
  { value: 'Organic Search', labelEn: 'Organic Search', labelAr: 'بحث عضوي' },
  { value: 'Referral', labelEn: 'Referral', labelAr: 'إحالة' },
];

export function OrderSourceIcon({ source, className = 'w-4 h-4' }: { source: string; className?: string }) {
  const s = (source || '').toLowerCase();
  if (s.includes('tiktok')) return <TikTokIcon className={`${className} text-slate-900 dark:text-white`} />;
  if (s.includes('snap')) return <SnapchatIcon className={`${className} text-amber-400`} />;
  if (s.includes('instagram')) return <InstagramBrandIcon className={`${className} text-pink-500`} />;
  if (s.includes('facebook')) return <FacebookBrandIcon className={`${className} text-blue-600`} />;
  if (s.includes('whatsapp')) return <WhatsAppBrandIcon className={`${className} text-emerald-500`} />;
  if (s.includes('google')) return <GoogleAdsIcon className={className} />;
  if (s === 'x' || s.includes('twitter')) return <XBrandIcon className={`${className} text-slate-900 dark:text-white`} />;
  if (s.includes('telegram') || s.includes('تيليجرام')) return <TelegramBrandIcon className={`${className} text-sky-500`} />;
  if (s.includes('youtube')) return <YouTubeBrandIcon className={`${className} text-red-600`} />;
  return (
    <svg className={`${className} text-slate-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function ShippingCarrierIcon({ carrier }: { carrier?: string }) {
  const c = (carrier || '').toLowerCase();
  if (c.includes('smsa')) return <SmsaIcon />;
  if (c.includes('aramex')) return <AramexIcon />;
  if (c.includes('spl') || c.includes('saudi post') || c.includes('بريد')) return <SplIcon />;
  return <SmsaIcon title={carrier || 'Courier'} />;
}
