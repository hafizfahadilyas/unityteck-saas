/**
 * CT-07 — Pure isolation helpers for coffee theme chrome + widgets (no DOM / no heavy store).
 * Keys and slices must never blend store A into store B.
 */

export function themeSettingsKey(storeId: string, themeId?: string): string {
  if (themeId && themeId.trim() !== '') {
    return `unityteck_theme_settings_${storeId}_${themeId.trim()}`;
  }
  return `unityteck_theme_settings_full_${storeId}`;
}

export function builderDraftStorageKey(storeId: string, themeId: string): string {
  return `selia_builder_draft_${storeId}_${themeId}`;
}

export function builderPublishedStorageKey(storeId: string, themeId: string): string {
  return `selia_builder_published_${storeId}_${themeId}`;
}

export type IsolatedThemeSlice = {
  announcementBar?: { messages?: Array<{ textEn?: string; textAr?: string }> };
  footer?: { aboutEn?: string; aboutAr?: string; copyrightEn?: string };
  customHeader?: { announcement?: { messages?: Array<{ textEn?: string }> } };
};

/** Deep-merge one store's slice without reading another store's object. */
export function applyStoreThemeSlice(
  base: IsolatedThemeSlice,
  patch: IsolatedThemeSlice,
): IsolatedThemeSlice {
  return {
    ...base,
    ...patch,
    announcementBar: patch.announcementBar
      ? { ...base.announcementBar, ...patch.announcementBar }
      : base.announcementBar,
    footer: patch.footer ? { ...base.footer, ...patch.footer } : base.footer,
    customHeader: patch.customHeader
      ? { ...base.customHeader, ...patch.customHeader }
      : base.customHeader,
  };
}

export function themeSettingsKeysDiffer(storeA: string, storeB: string, themeId: string): boolean {
  if (!storeA || !storeB || storeA === storeB) return false;
  const aFull = themeSettingsKey(storeA);
  const bFull = themeSettingsKey(storeB);
  const aTheme = themeSettingsKey(storeA, themeId);
  const bTheme = themeSettingsKey(storeB, themeId);
  return aFull !== bFull && aTheme !== bTheme && !aTheme.includes(storeB) && !bTheme.includes(storeA);
}

export function builderKeysDiffer(storeA: string, storeB: string, themeId: string): boolean {
  if (!storeA || !storeB || storeA === storeB) return false;
  const a = builderDraftStorageKey(storeA, themeId);
  const b = builderDraftStorageKey(storeB, themeId);
  return a !== b && a.includes(storeA) && b.includes(storeB) && !a.includes(storeB);
}

/** True when store B payload never contains store A chrome marker strings. */
export function sliceLacksForeignMarkers(
  slice: IsolatedThemeSlice,
  foreignMarkers: string[],
): boolean {
  const blob = JSON.stringify(slice);
  return foreignMarkers.every((m) => !blob.includes(m));
}
