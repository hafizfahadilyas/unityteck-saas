/**
 * Customizer sidebar: per-page panel order + duplicate list items inside a section.
 * Order is UI preference only (does not reshuffle locked coffee storefront chrome).
 */

import {
  readAllThemeSettings,
  writeAllThemeSettings,
  type AllThemeSettings,
} from '../../../themes/settings/themeSettingsStore';
import { isCoffeeStore, resolveCoffeeThemeSettings } from '../../../themes/settings/coffeeThemeDefaults';

const ORDER_PREFIX = 'unityteck_customizer_panel_order_v1_';

export function readPanelOrder(storeId: string, pageId: string): string[] | null {
  if (!storeId || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${ORDER_PREFIX}${storeId}`);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string[]>;
    const list = map?.[pageId];
    return Array.isArray(list) && list.length ? list : null;
  } catch {
    return null;
  }
}

export function writePanelOrder(storeId: string, pageId: string, ids: string[]): void {
  if (!storeId || typeof localStorage === 'undefined') return;
  try {
    const key = `${ORDER_PREFIX}${storeId}`;
    const raw = localStorage.getItem(key);
    const map = (raw ? JSON.parse(raw) : {}) as Record<string, string[]>;
    map[pageId] = ids;
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

/** Merge saved order with current catalog ids (keep unknown saved ids out; append new ids). */
export function mergePanelOrder(catalogIds: string[], saved: string[] | null): string[] {
  if (!saved?.length) return catalogIds;
  const set = new Set(catalogIds);
  const ordered = saved.filter((id) => set.has(id));
  const missing = catalogIds.filter((id) => !ordered.includes(id));
  return [...ordered, ...missing];
}

export function moveIdInList(ids: string[], fromIndex: number, toIndex: number): string[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return ids;
  if (fromIndex >= ids.length || toIndex >= ids.length) return ids;
  const next = [...ids];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function swapIdInList(ids: string[], index: number, dir: -1 | 1): string[] {
  const j = index + dir;
  if (j < 0 || j >= ids.length) return ids;
  return moveIdInList(ids, index, j);
}

type DupResult =
  | { ok: true; kind: 'item'; messageEn: string; messageAr: string }
  | { ok: true; kind: 'clipboard'; messageEn: string; messageAr: string }
  | { ok: false; messageEn: string; messageAr: string };

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function cloneWithNewIds<T extends { id: string }>(items: T[], prefix: string): T[] {
  return items.map((it) => ({ ...it, id: newId(prefix) }));
}

/**
 * Duplicate the primary list inside a Word/coffee customizer section.
 * Unique chrome panels → copy settings JSON to clipboard when possible.
 */
export function duplicateCustomizerSectionContent(
  storeId: string,
  sectionId: string,
  storeFallback?: { id: string; name?: string; nameEn?: string; nameAr?: string } | null,
): DupResult {
  if (!storeId) {
    return {
      ok: false,
      messageEn: 'No store selected',
      messageAr: 'لم يتم اختيار متجر',
    };
  }

  const storeRef = storeFallback || { id: storeId };
  const settings = isCoffeeStore(storeRef)
    ? resolveCoffeeThemeSettings(storeId, storeRef)
    : readAllThemeSettings(storeId, storeFallback as any);
  const next = { ...settings } as AllThemeSettings;

  const failEmpty = (): DupResult => ({
    ok: false,
    messageEn: 'Nothing to copy in this panel yet — add content first',
    messageAr: 'لا يوجد محتوى للنسخ في هذا القسم — أضف عنصراً أولاً',
  });

  const okItem = (n: number): DupResult => ({
    ok: true,
    kind: 'item',
    messageEn: n === 1 ? 'Element duplicated' : `${n} elements duplicated`,
    messageAr: n === 1 ? 'تم نسخ العنصر' : `تم نسخ ${n} عناصر`,
  });

  switch (sectionId) {
    case 'C-HERO': {
      if (!next.heroBanners) return failEmpty();
      const banners = next.heroBanners.banners || [];
      if (!banners.length) return failEmpty();
      const src = banners[banners.length - 1];
      next.heroBanners = {
        ...next.heroBanners,
        banners: [...banners, { ...src, id: newId('hero') }],
      };
      writeAllThemeSettings(storeId, next);
      return okItem(1);
    }
    case 'C-ANN': {
      const messages = next.announcementBar?.messages || [];
      if (!messages.length) return failEmpty();
      const src = messages[messages.length - 1];
      next.announcementBar = {
        ...next.announcementBar,
        messages: [...messages, { ...src, id: newId('ann') }],
      };
      writeAllThemeSettings(storeId, next);
      return okItem(1);
    }
    case 'C-ICON': {
      const features = next.enhancedFeatures?.features || [];
      if (!features.length) return failEmpty();
      const src = features[features.length - 1];
      next.enhancedFeatures = {
        ...next.enhancedFeatures,
        features: [...features, { ...src, id: newId('cf') }],
      };
      writeAllThemeSettings(storeId, next);
      return okItem(1);
    }
    case 'C-IMG': {
      if (!next.imageBanners) return failEmpty();
      const items = next.imageBanners.items || [];
      if (!items.length) return failEmpty();
      const src = items[items.length - 1];
      next.imageBanners = {
        ...next.imageBanners,
        items: [...items, { ...src, id: newId('img') }],
      };
      writeAllThemeSettings(storeId, next);
      return okItem(1);
    }
    case 'C-BEN': {
      if (!next.exclusiveBenefits) return failEmpty();
      const items = next.exclusiveBenefits.items || [];
      if (!items.length) return failEmpty();
      const src = items[items.length - 1];
      next.exclusiveBenefits = {
        ...next.exclusiveBenefits,
        items: [...items, { ...src, id: newId('ben') }],
      };
      writeAllThemeSettings(storeId, next);
      return okItem(1);
    }
    case 'C-FSB': {
      if (!next.featuredSectionBanners) return failEmpty();
      const banners = next.featuredSectionBanners.banners || [];
      if (!banners.length) return failEmpty();
      const src = banners[banners.length - 1];
      next.featuredSectionBanners = {
        ...next.featuredSectionBanners,
        banners: [...banners, { ...src, id: newId('fsb') }],
      };
      writeAllThemeSettings(storeId, next);
      return okItem(1);
    }
    case 'C-FCP': {
      if (!next.featuredCategoriesProducts) return failEmpty();
      const sections = next.featuredCategoriesProducts.sections || [];
      if (!sections.length) return failEmpty();
      const src = sections[sections.length - 1];
      const cloned = {
        ...src,
        id: newId('fcp'),
        categories: cloneWithNewIds(src.categories || [], 'fcp-cat'),
      };
      next.featuredCategoriesProducts = {
        ...next.featuredCategoriesProducts,
        sections: [...sections, cloned],
      };
      writeAllThemeSettings(storeId, next);
      return okItem(1);
    }
    case 'C-FP': {
      if (!next.featuredProducts) return failEmpty();
      const tabs = next.featuredProducts.tabs || [];
      if (!tabs.length) return failEmpty();
      const src = tabs[tabs.length - 1];
      next.featuredProducts = {
        ...next.featuredProducts,
        tabs: [...tabs, { ...src, id: newId('fp') }],
      };
      writeAllThemeSettings(storeId, next);
      return okItem(1);
    }
    case 'C-FOOT': {
      if (!next.footer) return failEmpty();
      const columns = next.footer.columns || [];
      if (!columns.length) return failEmpty();
      const src = columns[columns.length - 1];
      next.footer = {
        ...next.footer,
        columns: [
          ...columns,
          {
            ...src,
            id: newId('foot'),
            links: cloneWithNewIds(src.links || [], 'foot-link'),
          },
        ],
      };
      writeAllThemeSettings(storeId, next);
      return okItem(1);
    }
    default: {
      try {
        const payload = JSON.stringify({ sectionId, storeId, at: Date.now() });
        void navigator.clipboard?.writeText(payload);
      } catch {
        /* ignore */
      }
      return {
        ok: true,
        kind: 'clipboard',
        messageEn: 'Panel reference copied — open the panel to edit its unique settings',
        messageAr: 'تم نسخ مرجع القسم — افتح القسم لتعديل إعداداته',
      };
    }
  }
}

/** How many saved rows this panel already has for the open store. */
export function countSectionElements(settings: AllThemeSettings, sectionId: string): number {
  const cats = (settings.featuredCategoriesProducts?.sections || []).reduce(
    (n, section) => n + (section.categories?.length || 0),
    0,
  );
  switch (sectionId) {
    case 'C-HERO':
      return settings.heroBanners?.banners?.length || 0;
    case '05_advanced_slider':
      return settings.slider?.slides?.length || 0;
    case 'C-FCP':
      return cats;
    case 'C-ANN':
    case '13_announcement_bar':
      return settings.announcementBar?.messages?.length || 0;
    case 'C-FSB':
      return settings.featuredSectionBanners?.banners?.length || 0;
    case 'C-FP':
    case '07_product_tabs':
      return settings.featuredProducts?.tabs?.length || settings.tabs?.tabs?.length || 0;
    case 'C-IMG':
      return settings.imageBanners?.items?.length || 0;
    case '11_banners':
    case '09_image_grid':
      return settings.imageBanners?.items?.length || settings.banners?.banners?.length || 0;
    case 'C-FOOT':
      return settings.footer?.columns?.length || 0;
    case 'C-ICON':
    case '14_enhanced_features':
      return settings.enhancedFeatures?.features?.length || 0;
    case 'C-BEN':
      return settings.exclusiveBenefits?.items?.length || 0;
    case 'C-CPB':
    case '16_custom_products':
      return settings.customOrder?.fields?.length || 0;
    case '10_custom_links':
      return settings.customLinks?.links?.length || 0;
    case '12_blog':
      return settings.blog?.articles?.length || 0;
    default:
      return 0;
  }
}
