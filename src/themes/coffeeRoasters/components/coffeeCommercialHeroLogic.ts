/** Pure Commercial Hero helpers — node-test safe (slides from theme settings only). */

import type {
  CommercialHeroFeature,
  CommercialHeroSettings,
  CommercialHeroSlide,
} from '../../settings/coffeeModularSettings';

export type CommercialHeroPreviewDevice = 'desktop' | 'tablet' | 'mobile';

export const COMMERCIAL_HERO_MAX_SLIDES = 12;
export const COMMERCIAL_HERO_MAX_FEATURES = 12;

export function commercialHeroShowsOnDevice(
  settings: CommercialHeroSettings | null | undefined,
  device: CommercialHeroPreviewDevice,
): boolean {
  if (!settings || settings.enabled === false) return false;
  if (device === 'desktop') return settings.showOnDesktop !== false;
  if (device === 'tablet') return settings.showOnTablet !== false;
  return settings.showOnMobile !== false;
}

/** Visible slides: enabled + title or image. */
export function visibleCommercialHeroSlides(
  settings: CommercialHeroSettings | null | undefined,
): CommercialHeroSlide[] {
  if (!settings || settings.enabled === false) return [];
  return (settings.slides || []).filter((slide) => {
    if (slide.enabled === false) return false;
    return Boolean(
      (slide.titleEn || '').trim() ||
        (slide.titleAr || '').trim() ||
        (slide.image || '').trim(),
    );
  });
}

export function visibleCommercialHeroFeatures(
  slide: CommercialHeroSlide | null | undefined,
): CommercialHeroFeature[] {
  if (!slide) return [];
  return (slide.features || []).filter((f) => {
    if (f.enabled === false) return false;
    return Boolean(
      (f.labelEn || '').trim() ||
        (f.labelAr || '').trim() ||
        (f.valueEn || '').trim() ||
        (f.valueAr || '').trim(),
    );
  });
}

export function blankCommercialHeroFeature(
  partial?: Partial<CommercialHeroFeature>,
): CommercialHeroFeature {
  return {
    id:
      partial?.id ||
      `ch-feat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    enabled: partial?.enabled !== false,
    icon: partial?.icon || 'Star',
    labelEn: partial?.labelEn || '',
    labelAr: partial?.labelAr || '',
    valueEn: partial?.valueEn || '',
    valueAr: partial?.valueAr || '',
  };
}

export function blankCommercialHeroSlide(
  partial?: Partial<CommercialHeroSlide>,
): CommercialHeroSlide {
  return {
    id:
      partial?.id ||
      `ch-slide-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    enabled: partial?.enabled !== false,
    image: partial?.image || '',
    badgeEn: partial?.badgeEn || '',
    badgeAr: partial?.badgeAr || '',
    titleEn: partial?.titleEn || '',
    titleAr: partial?.titleAr || '',
    subtitleEn: partial?.subtitleEn || '',
    subtitleAr: partial?.subtitleAr || '',
    price: partial?.price ?? null,
    productId: partial?.productId || '',
    buyNowEnabled: partial?.buyNowEnabled !== false,
    buyNowEn: partial?.buyNowEn || '',
    buyNowAr: partial?.buyNowAr || '',
    addToCartEnabled: partial?.addToCartEnabled !== false,
    addToCartEn: partial?.addToCartEn || '',
    addToCartAr: partial?.addToCartAr || '',
    features: partial?.features || [],
  };
}

export function duplicateCommercialHeroFeature(
  item: CommercialHeroFeature,
): CommercialHeroFeature {
  return blankCommercialHeroFeature({
    ...item,
    id: undefined,
    labelEn: item.labelEn ? `${item.labelEn} (copy)` : '',
    labelAr: item.labelAr ? `${item.labelAr} (نسخة)` : '',
  });
}

export function duplicateCommercialHeroSlide(item: CommercialHeroSlide): CommercialHeroSlide {
  return blankCommercialHeroSlide({
    ...item,
    id: undefined,
    titleEn: item.titleEn ? `${item.titleEn} (copy)` : '',
    titleAr: item.titleAr ? `${item.titleAr} (نسخة)` : '',
    features: (item.features || []).map((f) =>
      blankCommercialHeroFeature({ ...f, id: undefined }),
    ),
  });
}

export function reorderCommercialHeroSlides(
  items: CommercialHeroSlide[],
  from: number,
  to: number,
): CommercialHeroSlide[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) {
    return items;
  }
  const next = items.slice();
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

export function reorderCommercialHeroFeatures(
  items: CommercialHeroFeature[],
  from: number,
  to: number,
): CommercialHeroFeature[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) {
    return items;
  }
  const next = items.slice();
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

export function commercialHeroWidthClass(
  width: CommercialHeroSettings['contentWidth'] | undefined,
): string {
  if (width === 'narrow') return 'max-w-3xl';
  if (width === 'medium') return 'max-w-5xl';
  if (width === 'full') return 'max-w-none';
  return 'max-w-[1360px]';
}
