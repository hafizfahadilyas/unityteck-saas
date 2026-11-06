/** Built-in library folder slugs (not stored in media_folders). */
export const SYSTEM_MEDIA_FOLDERS = [
  { slug: 'general', nameEn: 'General', nameAr: 'ملفات عامة' },
  { slug: 'products', nameEn: 'Products', nameAr: 'المنتجات' },
  { slug: 'banners', nameEn: 'Banners & Hero', nameAr: 'البانرات والعروض' },
  { slug: 'categories', nameEn: 'Categories', nameAr: 'التصنيفات' },
  { slug: 'branding', nameEn: 'Branding & Logos', nameAr: 'الهوية والشعار' },
  { slug: 'marketing', nameEn: 'Marketing & Videos', nameAr: 'التسويق والفيديو' },
] as const;

export function mediaFolderLabel(slug: string, isAr: boolean): string {
  const sys = SYSTEM_MEDIA_FOLDERS.find((f) => f.slug === slug);
  if (sys) return isAr ? sys.nameAr : sys.nameEn;
  return slug;
}
