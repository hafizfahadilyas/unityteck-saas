import type { ComponentType } from 'react';

export interface ThemeSectionDefinition {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  category:
    | 'header'
    | 'hero'
    | 'products'
    | 'categories'
    | 'features'
    | 'promotions'
    | 'media'
    | 'reviews'
    | 'faq'
    | 'footer'
    | 'custom';
  defaultEnabled?: boolean;
  defaultSettings?: Record<string, unknown>;
}

export interface ThemeHomeStyleDefinition {
  id: string;
  name: string;
  nameAr: string;
  previewImage?: string;
  description?: string;
  descriptionAr?: string;
}

export interface ThemePageDefinition {
  id: string;
  slug: string;
  title: string;
  titleAr: string;
  isSystem?: boolean;
}

export interface ThemeColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  background: string;
  text: string;
}

export interface ThemeManifest {
  /** Unique catalog identifier, e.g. 'theme-coffee', 'theme-transport', 'theme-gifts' */
  id: string;
  /** Internal folder and slug key, e.g. 'coffeeRoasters', 'saudiaTransport', 'meccaGifts' */
  slug: string;
  /** Display title (English) */
  name: string;
  /** Display title (Arabic) */
  nameAr: string;
  /** SemVer version string */
  version: string;
  /** Brief description (English) */
  description: string;
  /** Brief description (Arabic) */
  descriptionAr: string;
  /** Author or vendor */
  author: string;
  /** Industry category */
  category: 'cafe' | 'automotive' | 'gifts' | 'fashion' | 'electronics' | 'general';
  /** Primary preview image or banner URL */
  previewImage: string;
  /** Search and filtering tags */
  tags: string[];
  /** Default palette presets */
  defaultColors: ThemeColorPalette;
  /** Supported homepage layouts / seasonal presets */
  homeStyles: ThemeHomeStyleDefinition[];
  /** Supported section types for builder customization */
  supportedSections: ThemeSectionDefinition[];
  /** Standard system pages provided by this theme */
  systemPages: ThemePageDefinition[];
  /** Root storefront view component (direct or React.lazy code-split) */
  ViewComponent:
    | ComponentType<{ initialPage?: string; isAdmin?: boolean }>
    | React.LazyExoticComponent<ComponentType<{ initialPage?: string; isAdmin?: boolean }>>;
}
