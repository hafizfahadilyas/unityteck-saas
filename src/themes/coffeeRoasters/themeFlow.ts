export function themeDirection(isAr: boolean): 'rtl' | 'ltr' {
  return isAr ? 'rtl' : 'ltr';
}

export function headingFlowStyle(): { overflowWrap: 'anywhere'; wordBreak: 'break-word'; maxWidth: '100%' } {
  return { overflowWrap: 'anywhere', wordBreak: 'break-word', maxWidth: '100%' };
}

export function chromeOffset(headerPx: number, announcementPx: number): number {
  return Math.max(0, Math.round(headerPx)) + Math.max(0, Math.round(announcementPx));
}

export function sliderStageStyle(): { aspectRatio: string; overflow: 'hidden'; minHeight: string } {
  return { aspectRatio: '16 / 7', overflow: 'hidden', minHeight: '280px' };
}

export const themeLayers = { section: 0, header: 50, menu: 60, modal: 70 } as const;

export function warningIds(warnings: string[], prefix: string): string[] {
  return warnings.filter((item) => item.startsWith(prefix)).map((item) => item.slice(prefix.length));
}

export function applyChosen(
  current: Record<string, string>,
  suggestion: Record<string, string | undefined>,
  chosen: string[],
): Record<string, string> {
  const next = { ...current };
  for (const key of chosen) {
    const value = suggestion[key];
    if (typeof value === 'string') next[key] = value;
  }
  return next;
}

export function draftAfterSave<T>(local: T, api: T | null, online: boolean): { draft: T; error: boolean } {
  if (!online || api == null) return { draft: local, error: true };
  return { draft: api, error: false };
}

export function viewportNotes(width: number, locale: 'ar' | 'en'): {
  width: number;
  dir: 'rtl' | 'ltr';
  columns: '1fr' | 'multi';
  overflowX: 'hidden';
} {
  return {
    width,
    dir: locale === 'ar' ? 'rtl' : 'ltr',
    columns: width <= 390 ? '1fr' : 'multi',
    overflowX: 'hidden',
  };
}
