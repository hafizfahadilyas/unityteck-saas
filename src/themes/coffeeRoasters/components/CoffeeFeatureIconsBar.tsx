import React from 'react';
import {
  Award,
  Clock,
  CreditCard,
  Gem,
  Gift,
  Headphones,
  Heart,
  Mail,
  MessageCircle,
  Package,
  Palette,
  Percent,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Wrench,
} from 'lucide-react';
import {
  featureItemDescription,
  featureItemTitle,
  featureLinkKind,
  featureShowsOn,
  type EnhancedFeatureItem,
  type EnhancedFeaturesSettings,
  type FeaturePreviewDevice,
} from '../../settings/themeSettingsStore';
import { coffeeWhatsAppDigits } from '../../settings/coffeeModularSettings';

export const FEATURE_ICON_LIBRARY: { name: string; Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }[] = [
  { name: 'Truck', Icon: Truck },
  { name: 'ShieldCheck', Icon: ShieldCheck },
  { name: 'RotateCcw', Icon: RotateCcw },
  { name: 'MessageCircle', Icon: MessageCircle },
  { name: 'Mail', Icon: Mail },
  { name: 'Gift', Icon: Gift },
  { name: 'Star', Icon: Star },
  { name: 'Gem', Icon: Gem },
  { name: 'Package', Icon: Package },
  { name: 'Heart', Icon: Heart },
  { name: 'Percent', Icon: Percent },
  { name: 'Headphones', Icon: Headphones },
  { name: 'CreditCard', Icon: CreditCard },
  { name: 'Award', Icon: Award },
  { name: 'Clock', Icon: Clock },
  { name: 'Sparkles', Icon: Sparkles },
  { name: 'Palette', Icon: Palette },
  { name: 'Wrench', Icon: Wrench },
];

const ICON_MAP = Object.fromEntries(FEATURE_ICON_LIBRARY.map((row) => [row.name, row.Icon]));

export function safeFeatureImage(url?: string): string {
  const value = (url || '').trim();
  if (!value) return '';
  if (/unsplash\.com|images\.unsplash|picsum\.photos|placeholder\.com/i.test(value)) return '';
  return value;
}

export function featureItemsForDevice(
  settings: EnhancedFeaturesSettings | null | undefined,
  device: FeaturePreviewDevice | 'responsive',
  opts?: { includeEmpty?: boolean },
): EnhancedFeatureItem[] {
  if (!settings?.enabled) return [];
  return (settings.features || []).filter((item) => {
    const title = featureItemTitle(item, 'en') || featureItemTitle(item, 'ar');
    const description = featureItemDescription(item, 'en') || featureItemDescription(item, 'ar');
    const image = item.mediaType === 'image' ? safeFeatureImage(item.imageUrl) : '';
    if (!opts?.includeEmpty && !title && !description && !image) return false;
    if (device === 'responsive') {
      return item.showDesktop !== false || item.showTablet !== false || item.showMobile !== false;
    }
    return featureShowsOn(item, device);
  });
}

function shapeRadius(shape: EnhancedFeatureItem['iconShape']): string {
  if (shape === 'circle') return '999px';
  if (shape === 'square' || shape === 'none') return '0px';
  return '16px';
}

function openWhatsApp(phone: string, lang: 'en' | 'ar') {
  const clean = coffeeWhatsAppDigits(phone);
  if (!clean) return;
  const msg =
    lang === 'ar'
      ? 'السلام عليكم، أود الاستفسار عن طلب من هايبرو.'
      : 'Hello, I would like to ask about a HiBrew order.';
  window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
}

export const CoffeeFeatureIconsBar: React.FC<{
  settings: EnhancedFeaturesSettings | null | undefined;
  lang: 'en' | 'ar';
  device?: FeaturePreviewDevice | 'responsive';
  phone?: string;
  /** Admin frames pass a fixed device. Storefront uses responsive CSS. */
  variant?: 'storefront' | 'frame';
  includeEmpty?: boolean;
}> = ({ settings, lang, device = 'responsive', phone, variant = 'storefront', includeEmpty }) => {
  if (!settings?.enabled) return null;
  const items = featureItemsForDevice(settings, device, { includeEmpty });
  if (!items.length) return null;

  const title =
    lang === 'ar'
      ? settings.mainTitleAr || settings.mainTitle || settings.mainTitleEn || ''
      : settings.mainTitleEn || settings.mainTitle || settings.mainTitleAr || '';
  const subtitle =
    lang === 'ar'
      ? settings.subtitleAr || settings.subtitle || ''
      : settings.subtitleEn || settings.subtitle || '';

  const align = settings.contentAlign || 'center';
  const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
  const textAlign = align === 'left' ? 'start' : align === 'right' ? 'end' : 'center';
  const bg = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(settings.bgColor || '')
    ? settings.bgColor!
    : '#F8FAFC';
  const radius = Number.isFinite(settings.borderRadius) ? settings.borderRadius : 16;

  const cols =
    device === 'mobile'
      ? settings.itemsPerRowMobile || 1
      : device === 'tablet'
        ? settings.itemsPerRowTablet || 2
        : settings.itemsPerRowDesktop || 4;
  const gap = device === 'mobile' || device === 'tablet' ? settings.itemSpacingMobile ?? 16 : settings.itemSpacingDesktop ?? 32;
  const pad = device === 'mobile' ? settings.sectionPaddingMobile ?? 16 : settings.sectionPaddingDesktop ?? 24;

  const gridStyle: React.CSSProperties | undefined =
    device === 'responsive'
      ? undefined
      : {
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(1, cols)}, minmax(0, 1fr))`,
          gap,
          padding: pad,
          background: bg,
          borderRadius: radius,
        };

  const responsiveClass = device === 'responsive' ? 'cfi-responsive' : '';

  const body = (
    <>
      {device === 'responsive' ? (
        <style>{`
          .cfi-responsive {
            display: grid;
            grid-template-columns: repeat(${Math.max(1, settings.itemsPerRowMobile || 1)}, minmax(0, 1fr));
            gap: ${settings.itemSpacingMobile ?? 16}px;
            padding: ${settings.sectionPaddingMobile ?? 16}px;
            background: ${bg};
            border-radius: ${radius}px;
          }
          @media (min-width: 768px) {
            .cfi-responsive { grid-template-columns: repeat(${Math.max(1, settings.itemsPerRowTablet || 2)}, minmax(0, 1fr)); }
          }
          @media (min-width: 1024px) {
            .cfi-responsive {
              grid-template-columns: repeat(${Math.max(1, settings.itemsPerRowDesktop || 4)}, minmax(0, 1fr));
              gap: ${settings.itemSpacingDesktop ?? 32}px;
              padding: ${settings.sectionPaddingDesktop ?? 24}px;
            }
          }
          @media (max-width: 767px) { .cfi-hide-m { display: none !important; } }
          @media (min-width: 768px) and (max-width: 1023px) { .cfi-hide-t { display: none !important; } }
          @media (min-width: 1024px) { .cfi-hide-d { display: none !important; } }
        `}</style>
      ) : null}
      {(title || subtitle) && (
        <div className="text-center mb-3 space-y-0.5" style={{ textAlign: 'center' }}>
          {title ? <h3 className="text-sm sm:text-base font-bold text-slate-900">{title}</h3> : null}
          {subtitle ? <p className="text-[11px] sm:text-xs text-slate-500">{subtitle}</p> : null}
        </div>
      )}
      <div className={responsiveClass} style={gridStyle}>
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon] || ShieldCheck;
          const label = featureItemTitle(item, lang) || (lang === 'ar' ? 'ميزة' : 'Feature');
          const description = featureItemDescription(item, lang);
          const image = item.mediaType === 'image' ? safeFeatureImage(item.imageUrl) : '';
          const size = item.iconSize || 40;
          const color = item.iconColor || '#111111';
          const iconBg = item.iconShape === 'none' ? 'transparent' : item.iconBg || '#FFFFFF';
          const kind = featureLinkKind(item);
          const hide =
            device === 'responsive'
              ? `${item.showMobile === false ? 'cfi-hide-m' : ''} ${item.showTablet === false ? 'cfi-hide-t' : ''} ${item.showDesktop === false ? 'cfi-hide-d' : ''}`
              : '';
          const inner = (
            <>
              <div
                className="shrink-0 overflow-hidden flex items-center justify-center shadow-sm"
                style={{
                  width: size,
                  height: size,
                  background: image ? 'transparent' : iconBg,
                  borderRadius: shapeRadius(item.iconShape),
                  color,
                }}
              >
                {image ? (
                  <img src={image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Icon style={{ width: Math.round(size * 0.46), height: Math.round(size * 0.46) }} />
                )}
              </div>
              <div className="min-w-0" style={{ textAlign }}>
                <div className="font-bold text-[12px] sm:text-[13px] text-slate-900 leading-snug">{label}</div>
                {description ? <div className="text-[10px] sm:text-[11px] text-slate-500 leading-snug mt-0.5">{description}</div> : null}
              </div>
            </>
          );
          const rowClass = `flex items-center gap-2.5 min-w-0 ${hide}`;
          const rowStyle: React.CSSProperties = { justifyContent: justify };
          if (variant === 'frame' || kind === 'none') {
            return (
              <div key={item.id} className={rowClass} style={rowStyle}>
                {inner}
              </div>
            );
          }
          if (kind === 'whatsapp') {
            return (
              <button key={item.id} type="button" className={`${rowClass} text-start`} style={rowStyle} onClick={() => openWhatsApp(phone || '', lang)}>
                {inner}
              </button>
            );
          }
          const href = item.linkUrl || (kind === 'product' || kind === 'category' ? '#products' : '');
          if (!href) {
            return (
              <div key={item.id} className={rowClass} style={rowStyle}>
                {inner}
              </div>
            );
          }
          return (
            <a key={item.id} href={href} className={rowClass} style={rowStyle}>
              {inner}
            </a>
          );
        })}
      </div>
    </>
  );

  if (variant === 'frame') {
    return <div className="p-2">{body}</div>;
  }

  return <section data-customize-section="C-ICON" className="w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10">{body}</section>;
};
