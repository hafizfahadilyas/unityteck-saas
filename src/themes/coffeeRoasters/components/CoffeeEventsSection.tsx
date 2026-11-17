import React, { useEffect, useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import { bi, type EventsMasterclassesSettings } from '../../settings/coffeeModularSettings';
import { InteractiveBannerCard } from './InteractiveBannerCard';
import { spacingPx, visibleEvents } from './coffeeEventsLogic';

function safeImage(url?: string): string {
  const img = (url || '').trim();
  if (!img) return '';
  const lower = img.toLowerCase();
  if (lower.startsWith('http') || lower.startsWith('data:') || lower.startsWith('/')) return img;
  return '';
}

export const CoffeeEventsSection: React.FC<{
  settings: EventsMasterclassesSettings | null | undefined;
}> = ({ settings }) => {
  const { language, navigateTo } = useCart();
  const isAr = language === 'AR';
  const lang = isAr ? 'ar' : 'en';
  const events = useMemo(() => visibleEvents(settings), [settings]);
  const [largeIndex, setLargeIndex] = useState(0);

  const largePool = useMemo(() => {
    const larges = events.filter((e) => e.cardSize === 'large');
    return larges.length ? larges : events;
  }, [events]);

  useEffect(() => {
    if (!settings?.autoplay || largePool.length < 2) return;
    const ms = Math.max(2, settings.autoplaySpeedSec || 5) * 1000;
    const t = window.setInterval(() => setLargeIndex((i) => (i + 1) % largePool.length), ms);
    return () => window.clearInterval(t);
  }, [settings?.autoplay, settings?.autoplaySpeedSec, largePool.length]);

  if (!settings?.enabled || events.length === 0) return null;

  const featured = largePool[Math.min(largeIndex, largePool.length - 1)] || events[0];
  const rest = events.filter((e) => e.id !== featured.id);
  const gap = spacingPx(settings.cardSpacing);
  const radius = settings.cardBorderRadius ?? 16;
  const padY = settings.sectionPaddingY ?? 48;

  const openEvent = (url: string) => {
    const href = (url || '').trim();
    if (!href) {
      navigateTo('products');
      return;
    }
    if (href.startsWith('http') || href.startsWith('/')) {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }
    navigateTo('products');
  };

  return (
    <section
      data-customize-section="C-EVT"
      className="w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 select-none overflow-hidden"
      style={{ paddingTop: padY, paddingBottom: padY }}
    >
      <div
        className="max-w-3xl mx-auto py-2 sm:py-4 space-y-3"
        style={{ textAlign: settings.contentAlign || 'center' }}
      >
        {settings.showSectionTag !== false && (settings.badgeEn || settings.badgeAr) ? (
          <span className="inline-block text-xs font-bold text-neutral-600 uppercase tracking-widest bg-neutral-100 px-4 py-1.5 rounded-full">
            {bi(lang, settings.badgeEn, settings.badgeAr)}
          </span>
        ) : null}
        {(settings.titleEn || settings.titleAr) ? (
          <h2
            className={`text-2xl sm:text-4xl font-extrabold text-neutral-900 ${
              isAr ? 'leading-[1.38] tracking-normal' : 'leading-tight tracking-[-0.01em]'
            }`}
          >
            {bi(lang, settings.titleEn, settings.titleAr)}
          </h2>
        ) : null}
        {(settings.descriptionEn || settings.descriptionAr) ? (
          <p className="text-sm text-neutral-500">{bi(lang, settings.descriptionEn, settings.descriptionAr)}</p>
        ) : null}
      </div>

      <div className="space-y-4 sm:space-y-6 w-full max-w-full" style={{ gap }}>
        {featured ? (
          <div style={{ borderRadius: radius, overflow: 'hidden' }}>
            <InteractiveBannerCard
              title={bi(lang, featured.titleEn, featured.titleAr)}
              subtitle={settings.showDescriptions === false ? '' : bi(lang, featured.descriptionEn, featured.descriptionAr)}
              image={safeImage(featured.image)}
              size="large"
              badge={settings.showCardLabels === false ? '' : bi(lang, featured.tagEn, featured.tagAr)}
              onClick={() => openEvent(featured.buttonUrl)}
              ctaText={
                settings.showActionButtons === false || featured.showButton === false
                  ? ''
                  : bi(lang, featured.buttonEn, featured.buttonAr)
              }
            />
          </div>
        ) : null}

        {settings.autoplay && settings.showCarouselControls !== false && largePool.length > 1 ? (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border text-xs font-bold"
              onClick={() => setLargeIndex((i) => (i - 1 + largePool.length) % largePool.length)}
            >
              {isAr ? 'السابق' : 'Prev'}
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg border text-xs font-bold"
              onClick={() => setLargeIndex((i) => (i + 1) % largePool.length)}
            >
              {isAr ? 'التالي' : 'Next'}
            </button>
          </div>
        ) : null}

        {rest.length > 0 ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 w-full"
            style={{
              gap,
              gridTemplateColumns:
                settings.cardsLayout === 'grid'
                  ? `repeat(${Math.max(1, settings.cardsPerRowBottom || 2)}, minmax(0, 1fr))`
                  : undefined,
            }}
          >
            {(settings.cardsLayout === 'one-large-two-small' ? rest.slice(0, 2) : rest).map((ev) => (
              <div key={ev.id} style={{ borderRadius: radius, overflow: 'hidden' }}>
                <InteractiveBannerCard
                  title={bi(lang, ev.titleEn, ev.titleAr)}
                  subtitle={settings.showDescriptions === false ? '' : bi(lang, ev.descriptionEn, ev.descriptionAr)}
                  image={safeImage(ev.image)}
                  size="half"
                  badge={settings.showCardLabels === false ? '' : bi(lang, ev.tagEn, ev.tagAr)}
                  onClick={() => openEvent(ev.buttonUrl)}
                  ctaText={
                    settings.showActionButtons === false || ev.showButton === false
                      ? ''
                      : bi(lang, ev.buttonEn, ev.buttonAr)
                  }
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};
