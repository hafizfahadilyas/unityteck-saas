/** Pure Events & Masterclasses helpers — node-test safe. */

import type {
  EventMasterclassItem,
  EventsMasterclassesSettings,
} from '../../settings/coffeeModularSettings';

export const EVENTS_MAX_ITEMS = 10;

export function blankEventItem(partial?: Partial<EventMasterclassItem>): EventMasterclassItem {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    enabled: true,
    cardSize: 'small',
    image: '',
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    tagEn: '',
    tagAr: '',
    showButton: true,
    buttonEn: 'Learn More',
    buttonAr: 'اعرف المزيد',
    buttonUrl: '',
    buttonStyle: 'text-arrow',
    ...partial,
  };
}

export function reorderEvents(items: EventMasterclassItem[], from: number, to: number): EventMasterclassItem[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

export function duplicateEvent(item: EventMasterclassItem): EventMasterclassItem {
  return {
    ...item,
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };
}

export function eventHasContent(item: EventMasterclassItem): boolean {
  return Boolean(
    (item.titleEn || '').trim() ||
      (item.titleAr || '').trim() ||
      (item.descriptionEn || '').trim() ||
      (item.descriptionAr || '').trim() ||
      (item.image || '').trim(),
  );
}

export function visibleEvents(settings: EventsMasterclassesSettings | null | undefined): EventMasterclassItem[] {
  if (!settings?.enabled) return [];
  return (settings.events || []).filter((e) => e.enabled !== false && eventHasContent(e));
}

export function splitLargeSmall(events: EventMasterclassItem[]): {
  large: EventMasterclassItem | null;
  small: EventMasterclassItem[];
} {
  const large = events.find((e) => e.cardSize === 'large') || events[0] || null;
  const small = events.filter((e) => e.id !== large?.id);
  return { large, small };
}

export function spacingPx(spacing: EventsMasterclassesSettings['cardSpacing'] | undefined): number {
  if (spacing === 'small') return 12;
  if (spacing === 'large') return 28;
  return 20;
}
