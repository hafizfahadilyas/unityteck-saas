/** Theme Settings section badge — locale-safe chrome only */
export function themeSettingsBadge(sectionNum: number | string, isAr: boolean): string {
  return isAr ? `إعدادات الثيم · ${sectionNum}` : `Theme Settings · ${sectionNum}`;
}
