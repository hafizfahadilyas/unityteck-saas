import React from 'react';
import { ShieldCheck, Star, Truck, CreditCard, Palette, MessageCircle, Wrench, Headphones, Layers, Zap } from 'lucide-react';
import { bi, type FeaturesSectionSettings } from '../../settings/coffeeModularSettings';
import {
  featuresSectionColumns,
  featuresSectionShowsOnDevice,
  visibleFeaturesSectionItems,
  type FeaturesPreviewDevice,
} from './coffeeFeaturesSectionLogic';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldCheck,
  Star,
  Truck,
  CreditCard,
  Palette,
  MessageCircle,
  Wrench,
  Headphones,
  Layers,
  Zap,
};

function alignClass(align: FeaturesSectionSettings['contentAlign'] | undefined): string {
  if (align === 'left') return 'text-start items-start';
  if (align === 'right') return 'text-end items-end';
  return 'text-center items-center';
}

export const CoffeeFeaturesSection: React.FC<{
  settings: FeaturesSectionSettings | null | undefined;
  lang?: 'ar' | 'en';
  device?: FeaturesPreviewDevice;
}> = ({ settings, lang = 'en', device = 'desktop' }) => {
  if (!featuresSectionShowsOnDevice(settings, device)) return null;
  const items = visibleFeaturesSectionItems(settings);
  if (!items.length) return null;

  const cols = featuresSectionColumns(settings, device);
  const align = alignClass(settings?.contentAlign);
  const iconPos = settings?.iconPosition || 'top';
  const gap = settings?.cardGapPx ?? 16;
  const pad = settings?.cardPaddingPx ?? 20;
  const isAr = lang === 'ar';

  return (
    <section
      data-customize-section="C-FEAT"
      className="w-full max-w-[1360px] mx-auto px-4 lg:px-8"
      style={{
        paddingTop: (settings?.spacingTopPx ?? 0) + (settings?.sectionPaddingY ?? 48),
        paddingBottom: (settings?.spacingBottomPx ?? 0) + (settings?.sectionPaddingY ?? 48),
      }}
    >
      <div className={`mb-6 flex flex-col gap-2 ${align}`}>
        {settings?.showBadge !== false && (settings?.badgeEn || settings?.badgeAr) ? (
          <span className="text-[11px] font-bold tracking-wide uppercase text-[#8C531B]">
            {bi(lang, settings.badgeEn, settings.badgeAr)}
          </span>
        ) : null}
        {(settings?.titleEn || settings?.titleAr) ? (
          <h2 className="text-2xl sm:text-3xl font-black text-[#2B1809]">
            {bi(lang, settings.titleEn, settings.titleAr)}
          </h2>
        ) : null}
        {settings?.showDescription !== false && (settings?.descriptionEn || settings?.descriptionAr) ? (
          <p className="text-sm text-[#5C422E] max-w-2xl">
            {bi(lang, settings.descriptionEn, settings.descriptionAr)}
          </p>
        ) : null}
      </div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap,
        }}
      >
        {items.map((it) => {
          const Icon = ICON_MAP[it.icon] || Star;
          const title = bi(lang, it.titleEn, it.titleAr);
          const desc = bi(lang, it.descriptionEn, it.descriptionAr);
          const row =
            iconPos === 'left' || iconPos === 'right'
              ? `flex ${iconPos === 'right' ? 'flex-row-reverse' : 'flex-row'} gap-3 ${align.includes('center') ? 'items-center' : 'items-start'}`
              : `flex flex-col gap-2 ${align}`;
          return (
            <article
              key={it.id}
              className={`rounded-2xl bg-gradient-to-b from-[#FDFBF7] to-[#F1E5D6] ${row}`}
              style={{ padding: pad }}
            >
              <div className="w-10 h-10 shrink-0 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Icon className="w-5 h-5 text-[#8C531B]" />
              </div>
              <div className={iconPos === 'top' ? align : 'min-w-0 flex-1'}>
                {title ? <h3 className="font-bold text-sm text-[#2B1809]">{title}</h3> : null}
                {desc ? <p className="text-xs text-[#5C422E] mt-1 leading-relaxed">{desc}</p> : null}
                {!title && !desc ? (
                  <p className="text-xs text-[#7A593D]">{isAr ? 'بانتظار البيانات' : 'Waiting for Data'}</p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
