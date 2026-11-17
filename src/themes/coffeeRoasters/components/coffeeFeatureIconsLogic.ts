/** Pure Feature Icons helpers — safe for node --experimental-strip-types tests (no React / storeIdentity). */

export type FeaturePreviewDevice = 'desktop' | 'tablet' | 'mobile';

export type FeatureIconShape = 'rounded' | 'circle' | 'square' | 'none';
export type FeatureContentAlign = 'left' | 'center' | 'right';
export type FeatureLinkType = 'none' | 'url' | 'product' | 'category' | 'page' | 'whatsapp';

export interface EnhancedFeatureItem {
  id: string;
  icon: string;
  title: string;
  titleEn?: string;
  titleAr?: string;
  description: string;
  descriptionEn?: string;
  descriptionAr?: string;
  linkText?: string;
  linkUrl?: string;
  linkType?: FeatureLinkType;
  mediaType?: 'icon' | 'image';
  imageUrl?: string;
  iconBg?: string;
  iconColor?: string;
  iconSize?: number;
  iconShape?: FeatureIconShape;
  enabled?: boolean;
  showDesktop?: boolean;
  showTablet?: boolean;
  showMobile?: boolean;
}

export interface EnhancedFeaturesSettings {
  enabled: boolean;
  mainTitle: string;
  mainTitleEn?: string;
  mainTitleAr?: string;
  subtitle: string;
  subtitleEn?: string;
  subtitleAr?: string;
  layoutStyle: 'classic-cards' | 'minimal' | 'floating' | 'glass' | 'timeline';
  itemsPerRowDesktop: number;
  itemsPerRowTablet?: number;
  itemsPerRowMobile: number;
  features: EnhancedFeatureItem[];
  cardBackground: 'white' | 'glass' | 'dark';
  cardBorder: 'none' | 'soft' | 'solid';
  borderRadius: number;
  shadow: boolean;
  iconAnimation: 'floating' | 'pulse' | 'zoom' | 'none';
  hoverEffect: 'zoom' | 'lift' | 'glow';
  bgColor?: string;
  contentAlign?: FeatureContentAlign;
  itemSpacingDesktop?: number;
  itemSpacingTablet?: number;
  itemSpacingMobile?: number;
  sectionPaddingDesktop?: number;
  sectionPaddingTablet?: number;
  sectionPaddingMobile?: number;
  customCssClass?: string;
}

export function featureItemTitle(item: EnhancedFeatureItem, lang: 'en' | 'ar'): string {
  if (lang === 'ar') return (item.titleAr || item.title || item.titleEn || '').trim();
  return (item.titleEn || item.title || item.titleAr || '').trim();
}

export function featureItemDescription(item: EnhancedFeatureItem, lang: 'en' | 'ar'): string {
  if (lang === 'ar') return (item.descriptionAr || item.description || item.descriptionEn || '').trim();
  return (item.descriptionEn || item.description || item.descriptionAr || '').trim();
}

export function featureShowsOn(item: EnhancedFeatureItem, device: FeaturePreviewDevice): boolean {
  if (device === 'desktop') return item.showDesktop !== false;
  if (device === 'tablet') return item.showTablet !== false;
  return item.showMobile !== false;
}

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
    if (item.enabled === false) return false;
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
