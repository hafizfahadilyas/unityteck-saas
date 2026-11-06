export const COFFEE_CANONICAL_SECTIONS = [
  'announcement',
  'hero',
  'categories',
  'products',
  'image_banners',
  'carousel',
  'features',
  'benefits',
  'newsletter',
  'footer',
] as const;

const SECTION_ALIAS: Record<string, (typeof COFFEE_CANONICAL_SECTIONS)[number]> = {
  announcement_bar: 'announcement',
  announcement: 'announcement',
  hero_banners: 'hero',
  hero_slider: 'hero',
  hero: 'hero',
  featured_categories_products: 'categories',
  categories: 'categories',
  featured_products: 'products',
  products: 'products',
  image_banners: 'image_banners',
  product_carousel: 'carousel',
  carousel: 'carousel',
  store_features_bar: 'features',
  features: 'features',
  exclusive_benefits: 'benefits',
  benefits: 'benefits',
  newsletter: 'newsletter',
  footer: 'footer',
};

export function defaultCoffeeSectionOrder(): string[] {
  return [...COFFEE_CANONICAL_SECTIONS];
}

export function canonicalCoffeeSection(type: string): string | null {
  return SECTION_ALIAS[type] || null;
}

export function withoutRetiredBanners<T extends { type?: string }>(blocks: T[]): T[] {
  return blocks.filter((block) => block.type !== 'banners');
}

export function keepMerchantSectionOrder<T extends { type?: string }>(blocks: T[]): T[] {
  return withoutRetiredBanners(blocks);
}
