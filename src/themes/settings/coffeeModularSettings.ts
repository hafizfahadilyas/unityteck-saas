/**
 * HiBrew KSA modular theme keys (Word C-FCP … C-NEWS / C-CPB).
 * Separate persist keys — hero banners are not featured-section banners.
 * Default seeds use real public/images catalog art (merchant can replace via theme settings).
 * Empty collections stay empty once a merchant has cleared them (see modularHasContent).
 */

import { normalizeWhatsAppDigits } from './storeContact';

const H1 = '/images/coffee_hero_flagship_machine_1791218907782.jpg';
const H2 = '/images/coffee_grinder_mill_banner_1791218928342.jpg';
const H3 = '/images/coffee_corner_luxury_station_1791219182840.jpg';
/** AI-generated dual-slider pack (full overlay + image-only), desktop + mobile. */
const AI_FULL_DESKTOP = '/images/coffee_hero_full_desktop.jpg';
const AI_FULL_MOBILE = '/images/coffee_hero_full_mobile.jpg';
const AI_IMG_DESKTOP = '/images/coffee_hero_imageonly_desktop.jpg';
const AI_IMG_MOBILE = '/images/coffee_hero_imageonly_mobile.jpg';

export interface FeaturedCategoryEntry {
  id: string;
  enabled: boolean;
  entryType: 'category' | 'subcategory' | 'page';
  labelEn: string;
  labelAr: string;
  categoryId: string;
  image: string;
  pageUrl: string;
}

export interface FeaturedCategoriesSection {
  id: string;
  enabled: boolean;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  categories: FeaturedCategoryEntry[];
  productSource: 'selected' | 'category' | 'latest';
  productIds: string[];
  sortBy: 'manual' | 'latest' | 'price-asc' | 'price-desc';
  productCount: number;
  compareEnabled: boolean;
  maxCompare: number;
  compareButtonEn: string;
  compareButtonAr: string;
  showPrice: boolean;
  showRating: boolean;
  showDiscount: boolean;
  showCompare: boolean;
  showViewMore: boolean;
  viewMoreEn: string;
  viewMoreAr: string;
  viewMoreLink: string;
  columnsDesktop: number;
  columnsTablet?: number;
  columnsMobile: number;
  cardStyle: 'rounded' | 'square';
  spacing: 'small' | 'medium' | 'large';
}

/** Top promotional banners for Category Showcase (CW-03). */
export interface CategoryShowcaseBanner {
  id: string;
  enabled: boolean;
  image: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  link: string;
  textAlign?: 'top-left' | 'top-right' | 'center' | 'bottom-left' | 'bottom-right';
  overlay?: 'none' | 'dark' | 'light';
  overlayOpacity?: number;
  textColor?: string;
  borderRadius?: number;
}

export interface FeaturedCategoriesProductsSettings {
  enabled: boolean;
  /** Section chrome title (showcase-level). */
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  banners?: CategoryShowcaseBanner[];
  /** Manual product ids for bottom grid when productSource is selected. */
  productIds?: string[];
  productSource?: 'selected' | 'category' | 'latest';
  /** Full filter control (preferred when present). */
  productFilter?: CoffeeProductSourceConfig;
  productsPerRowDesktop?: number;
  productsPerRowTablet?: number;
  productsPerRowMobile?: number;
  cardStyle?: 'rounded' | 'square';
  cardSpacing?: 'small' | 'medium' | 'large';
  sectionSpacingPx?: number;
  bgColor?: string;
  contentAlign?: 'left' | 'center' | 'right';
  showProductName?: boolean;
  showPrice?: boolean;
  showOriginalPrice?: boolean;
  showDiscount?: boolean;
  enableCarousel?: boolean;
  enableTouchSwipe?: boolean;
  showArrowsDesktop?: boolean;
  showArrowsTablet?: boolean;
  showArrowsMobile?: boolean;
  autoplay?: boolean;
  autoplaySpeedSec?: number;
  /** Card CTA labels (Buy / Learn More) — EN+AR. */
  buyLabelEn?: string;
  buyLabelAr?: string;
  learnMoreLabelEn?: string;
  learnMoreLabelAr?: string;
  /** Per-element typography / color (merchant Style tab). */
  titleFontSizePx?: number;
  titleColor?: string;
  taglineFontSizePx?: number;
  taglineColor?: string;
  priceFontSizePx?: number;
  priceColor?: string;
  ctaFontSizePx?: number;
  buyColor?: string;
  learnMoreColor?: string;
  /** Stretch companion cards to equal height in a row. */
  equalCardHeights?: boolean;
  /** When catalog exceeds maxVisibleProducts, show More Products → shop. */
  showMoreProducts?: boolean;
  moreProductsEn?: string;
  moreProductsAr?: string;
  /** Default shop route: `products` (coffee shop page). Absolute URL also allowed. */
  moreProductsUrl?: string;
  maxVisibleProducts?: number;
  sections: FeaturedCategoriesSection[];
}

export interface HeroBannerButtonFlags {
  buyNowEnabled: boolean;
  buyNowEn: string;
  buyNowAr: string;
  addToCartEnabled: boolean;
  addToCartEn: string;
  addToCartAr: string;
  learnMoreEnabled: boolean;
  learnMoreEn: string;
  learnMoreAr: string;
  learnMoreUrl: string;
  customOrderEnabled: boolean;
  customOrderEn: string;
  customOrderAr: string;
  customOrderUrl: string;
}

/** Per-device chrome for the full (text) hero — mobile ≠ laptop ≠ desktop. */
export interface HeroDeviceChromeStyle {
  textColor?: string;
  cardBg?: string;
  cardOpacity?: number;
  buttonBg?: string;
  buttonTextColor?: string;
  priceColor?: string;
  linkColor?: string;
  scrimFrom?: string;
}

export interface HeroBannerSlideSettings extends HeroBannerButtonFlags {
  id: string;
  enabled: boolean;
  image: string;
  /** Optional tablet / laptop crop — falls back to `image`. */
  tabletImage?: string;
  mobileImage: string;
  /** Search-engine description for the slide image. Separate from the heading. */
  altEn?: string;
  altAr?: string;
  promoEn: string;
  promoAr: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  showPrice: boolean;
  price: string;
  currency: string;
  productId: string;
  textColor: string;
  /** Per-slide WhatsApp CTA (section `showWhatsapp` must also be on). */
  whatsappEnabled?: boolean;
  /** Full-overlay colors — desktop / large screens. */
  styleDesktop?: HeroDeviceChromeStyle;
  /** Full-overlay colors — laptop / tablet (md–lg). */
  styleLaptop?: HeroDeviceChromeStyle;
  /** Full-overlay colors — phones. */
  styleMobile?: HeroDeviceChromeStyle;
}

/**
 * C-HERO display:
 * - `image_only` — image carousel only
 * - `full` — text + card + buttons
 * - `both` — image-only slider then full text slider on the home page
 */
export type HeroBannerContentMode = 'image_only' | 'full' | 'both';

export interface HeroBannersSettings {
  enabled: boolean;
  autoplay: boolean;
  intervalMs: number;
  showArrows: boolean;
  showDots: boolean;
  showWhatsapp: boolean;
  whatsappNumber: string;
  textColor: string;
  contentMode?: HeroBannerContentMode;
  /**
   * Slides for the image-only slider when `contentMode` is `image_only` or `both`.
   * Empty → reuse `banners` images without overlay.
   */
  imageOnlyBanners?: HeroBannerSlideSettings[];
  /**
   * Section-level device chrome defaults (overridden by per-slide style*).
   */
  styleDesktop?: HeroDeviceChromeStyle;
  styleLaptop?: HeroDeviceChromeStyle;
  styleMobile?: HeroDeviceChromeStyle;
  banners: HeroBannerSlideSettings[];
}

export function emptyHeroDeviceStyle(): HeroDeviceChromeStyle {
  return {
    textColor: '#111111',
    cardBg: '#ffffff',
    cardOpacity: 0.8,
    buttonBg: '#111111',
    buttonTextColor: '#ffffff',
    priceColor: '#111111',
    linkColor: '#111111',
    scrimFrom: '#ffffff',
  };
}

export function resolveHeroDeviceStyle(
  device: 'mobile' | 'laptop' | 'desktop',
  section?: HeroBannersSettings | null,
  slide?: HeroBannerSlideSettings | null,
): HeroDeviceChromeStyle {
  const base = emptyHeroDeviceStyle();
  const sectionStyle =
    device === 'mobile'
      ? section?.styleMobile
      : device === 'laptop'
        ? section?.styleLaptop
        : section?.styleDesktop;
  const slideStyle =
    device === 'mobile'
      ? slide?.styleMobile
      : device === 'laptop'
        ? slide?.styleLaptop
        : slide?.styleDesktop;
  return {
    ...base,
    textColor: slide?.textColor || section?.textColor || base.textColor,
    ...sectionStyle,
    ...slideStyle,
  };
}

export interface FeaturedBannerButton {
  id: string;
  enabled: boolean;
  type: 'buy' | 'cart' | 'link';
  labelEn: string;
  labelAr: string;
  url: string;
  productId: string;
}

export interface FeaturedSectionBanner {
  id: string;
  enabled: boolean;
  bgColor: string;
  images: string[];
  promoEn: string;
  promoAr: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  showPrice: boolean;
  price: string;
  currency: string;
  productId: string;
  textColor: string;
  align: 'left' | 'center' | 'right';
  overlay: 'none' | 'dark' | 'light';
  overlayOpacity: number;
  buttons: FeaturedBannerButton[];
}

export interface FeaturedSectionBannersSettings {
  enabled: boolean;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  /** Section height presets (px) — CW-14 polish. */
  heightDesktop?: number;
  heightTablet?: number;
  heightMobile?: number;
  banners: FeaturedSectionBanner[];
}

export interface FeaturedProductTab {
  id: string;
  enabled: boolean;
  labelEn: string;
  labelAr: string;
  categoryId: string;
}

export type FeaturedProductsSort = 'manual' | 'price_asc' | 'price_desc' | 'newest';

export interface CoffeeFeaturedProductsSettings {
  enabled: boolean;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  tabs: FeaturedProductTab[];
  productCount: number;
  highlightFirst: boolean;
  sortBy?: FeaturedProductsSort;
  showImage?: boolean;
  showTitle?: boolean;
  showPrice: boolean;
  showBadge?: boolean;
  showRating: boolean;
  showStock?: boolean;
  showAddToCart?: boolean;
  showBuyNow?: boolean;
}

export interface ImageBannerItem {
  id: string;
  enabled: boolean;
  image: string;
  altEn?: string;
  altAr?: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  link: string;
  buttonEn: string;
  buttonAr: string;
  overlay?: 'none' | 'gradient' | 'dark';
  gradientFrom?: string;
  gradientTo?: string;
}

export type ImageBannersLayout = 'grid' | 'bento' | 'row' | 'stack' | 'masonry';

export interface ImageBannersSettings {
  enabled: boolean;
  layout: ImageBannersLayout;
  columnsDesktop: number;
  columnsMobile: number;
  items: ImageBannerItem[];
}

export interface FooterColumnLink {
  id: string;
  labelEn: string;
  labelAr: string;
  url: string;
  /** Hide without deleting. */
  enabled?: boolean;
}

export interface FooterColumn {
  id: string;
  titleEn: string;
  titleAr: string;
  links: FooterColumnLink[];
  /** Hide column without deleting its links. */
  enabled?: boolean;
  showDesktop?: boolean;
  showMobile?: boolean;
}

export interface FooterSocialLink {
  id: string;
  platform: 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'x' | 'whatsapp' | 'other';
  url: string;
  enabled?: boolean;
}

export interface CoffeeFooterSettings {
  enabled: boolean;
  layout: 'standard' | 'columns' | 'saudi-minimal';
  aboutEn: string;
  aboutAr: string;
  columns: FooterColumn[];
  copyrightEn: string;
  copyrightAr: string;
  showSocial: boolean;
  showPaymentIcons: boolean;
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsApp?: string;
  addressEn?: string;
  addressAr?: string;
  hoursEn?: string;
  hoursAr?: string;
  newsletterTitleEn?: string;
  newsletterTitleAr?: string;
  showNewsletter?: boolean;
  paymentsEn?: string;
  paymentsAr?: string;
  /** Doc layout: colors + width + columns count. */
  bgColor?: string;
  textColor?: string;
  linkColor?: string;
  linkHoverColor?: string;
  contentWidth?: 'full' | 'boxed';
  desktopColumns?: 1 | 2 | 3 | 4;
  fontSizePx?: number;
  columnGapPx?: number;
  /** Contact / bottom / social subsections. */
  showContact?: boolean;
  showBottomBar?: boolean;
  taxNumber?: string;
  showTaxNumber?: boolean;
  crNumber?: string;
  showCrNumber?: boolean;
  socialLinks?: FooterSocialLink[];
  bottomLinks?: FooterColumnLink[];
}

export type ExclusiveBenefitButtonStyle = 'primary' | 'secondary' | 'outline' | 'whatsapp';

export interface ExclusiveBenefitButton {
  id: string;
  enabled: boolean;
  labelEn: string;
  labelAr: string;
  style: ExclusiveBenefitButtonStyle;
  url: string;
}

export interface ExclusiveBenefitItem {
  id: string;
  enabled: boolean;
  /** When true, card stays visible but faded (unavailable). */
  unavailable?: boolean;
  icon: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  buttons?: ExclusiveBenefitButton[];
}

export interface ExclusiveBenefitsSettings {
  enabled: boolean;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  showTitle?: boolean;
  showDescription?: boolean;
  columnsDesktop?: number;
  columnsMobile?: number;
  cardGapPx?: number;
  items: ExclusiveBenefitItem[];
}

export type ProductCarouselCardStyle = 'rounded' | 'square';
export type ProductCarouselLearnLinkType = 'none' | 'product' | 'category' | 'page' | 'external';
export type ProductCarouselOpenIn = 'same' | 'new';

export interface ProductCarouselColorOpt {
  id: string;
  labelEn: string;
  labelAr: string;
  hex: string;
}

export interface ProductCarouselChoiceOpt {
  id: string;
  labelEn: string;
  labelAr: string;
}

/** Carousel card entry — display overrides; storefront prefers live catalog when productId matches. */
export interface ProductCarouselItem {
  id: string;
  productId: string;
  enabled: boolean;
  nameEn: string;
  nameAr: string;
  promoTagEn: string;
  promoTagAr: string;
  imageUrl: string;
  gallery: string[];
  productLink: string;
  showOptions: boolean;
  colors: ProductCarouselColorOpt[];
  storage: ProductCarouselChoiceOpt[];
  otherOptions: ProductCarouselChoiceOpt[];
  originalPrice: number | null;
  discountedPrice: number | null;
  showOriginalPrice: boolean;
  showBuyNow: boolean;
  buyNowEn: string;
  buyNowAr: string;
  showAddToCart: boolean;
  addToCartEn: string;
  addToCartAr: string;
  showLearnMore: boolean;
  learnMoreEn: string;
  learnMoreAr: string;
  learnMoreLinkType: ProductCarouselLearnLinkType;
  learnMoreUrl: string;
  learnMoreOpenIn: ProductCarouselOpenIn;
}

/** Shared filter for home product rails (C-PC / C-PCB / slider / collection / C-FCP). */
export type CoffeeProductSourceMode =
  | 'all'
  | 'category'
  | 'brand'
  | 'selected'
  | 'mix'
  | 'featured'
  | 'latest'
  | 'best_selling';

export interface CoffeeProductSourceConfig {
  mode: CoffeeProductSourceMode;
  categoryIds: string[];
  brandIds: string[];
  productIds: string[];
  productCount: number;
}

export interface ProductCarouselSettings {
  enabled: boolean;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  categoryId: string;
  productCount: number;
  autoplay: boolean;
  productsPerRowDesktop?: 2 | 3;
  productsPerRowTablet?: 1 | 2;
  productsPerRowMobile?: 1 | 2;
  cardStyle?: ProductCarouselCardStyle;
  cardBgColor?: string;
  cardBorderRadius?: number;
  cardPadding?: number;
  itemSpacing?: number;
  showArrowsDesktop?: boolean;
  showArrowsMobile?: boolean;
  enableTouchSwipe?: boolean;
  /** Manual curated cards. Empty → fall back to productSource / category + productCount. */
  items?: ProductCarouselItem[];
  /** Full filter: all / category / brand / selected / mix / featured / latest / best_selling */
  productSource?: CoffeeProductSourceConfig;
}

export interface ProductCarouselBannerSettings {
  enabled: boolean;
  bannerImage: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  buttonEn: string;
  buttonAr: string;
  buttonUrl: string;
  categoryId: string;
  productCount: number;
  productSource?: CoffeeProductSourceConfig;
}

export interface NewsletterSettings {
  enabled: boolean;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  placeholderEn: string;
  placeholderAr: string;
  buttonEn: string;
  buttonAr: string;
  successEn: string;
  successAr: string;
  couponCode: string;
  showCoupon: boolean;
  bgColor: string;
  textColor: string;
}

export type ShopCatalogSort =
  | 'featured'
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'best_selling'
  | 'rating';

export type ShopCatalogLoadMore = 'pagination' | 'load_more' | 'infinite';
export type ShopPriceFilterType = 'slider' | 'presets' | 'both';

/** #19 Product Catalog / shop grid chrome (ProductsListPage + builder product_catalog). */
export interface ShopCatalogSettings {
  enabled?: boolean;
  badgeEn?: string;
  badgeAr?: string;
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  showBadge?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  columnsDesktop: number;
  columnsTablet: number;
  columnsMobile: number;
  perPage: number;
  defaultSort: ShopCatalogSort;
  showFilters: boolean;
  showCategories?: boolean;
  showProductCount?: boolean;
  defaultCategory?: string;
  showSort?: boolean;
  showPriceFilter?: boolean;
  priceFilterType?: ShopPriceFilterType;
  showInStockFilter?: boolean;
  showResultsCount?: boolean;
  loadMoreType?: ShopCatalogLoadMore;
  showPrice?: boolean;
  showOriginalPrice?: boolean;
  showGiftLabel?: boolean;
  showInstallment?: boolean;
  showStock?: boolean;
  showBuyNow?: boolean;
  showAddToCart?: boolean;
  showLearnMore?: boolean;
  showWishlist?: boolean;
  showCompare?: boolean;
  showProductDescription?: boolean;
  sectionPaddingY?: number;
  cardGapPx?: number;
  cardPaddingPx?: number;
  showOnDesktop?: boolean;
  showOnTablet?: boolean;
  showOnMobile?: boolean;
}

export function emptyShopCatalog(): ShopCatalogSettings {
  return {
    enabled: true,
    badgeEn: '',
    badgeAr: '',
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    showBadge: true,
    showTitle: true,
    showDescription: true,
    columnsDesktop: 4,
    columnsTablet: 3,
    columnsMobile: 2,
    perPage: 24,
    defaultSort: 'featured',
    showFilters: true,
    showCategories: true,
    showProductCount: true,
    defaultCategory: 'all',
    showSort: true,
    showPriceFilter: true,
    priceFilterType: 'both',
    showInStockFilter: true,
    showResultsCount: true,
    loadMoreType: 'load_more',
    showPrice: true,
    showOriginalPrice: true,
    showGiftLabel: true,
    showInstallment: true,
    showStock: true,
    showBuyNow: true,
    showAddToCart: true,
    showLearnMore: true,
    showWishlist: false,
    showCompare: false,
    showProductDescription: false,
    sectionPaddingY: 32,
    cardGapPx: 16,
    cardPaddingPx: 16,
    showOnDesktop: true,
    showOnTablet: true,
    showOnMobile: true,
  };
}

export interface CheckoutFieldSettings {
  allowGuest: boolean;
  showCoupon: boolean;
  showOrderNote: boolean;
  showShipping: boolean;
}

export interface SeoDefaultSettings {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  ogImage: string;
}

export function shopGridClass(shop?: Partial<ShopCatalogSettings> | null): string {
  const mobile = shop?.columnsMobile === 1 ? 'grid-cols-1' : 'grid-cols-2';
  const tablet = shop?.columnsTablet === 2 ? 'md:grid-cols-2' : shop?.columnsTablet === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3';
  const desktop = shop?.columnsDesktop === 2 ? 'lg:grid-cols-2' : shop?.columnsDesktop === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';
  return `${mobile} sm:${mobile} ${tablet} ${desktop} gap-2.5 sm:gap-6 items-stretch auto-rows-fr`;
}

export interface CustomOrderField {
  id: string;
  enabled: boolean;
  labelEn: string;
  labelAr: string;
  type: 'text' | 'select' | 'number';
  required: boolean;
}

export interface CustomOrderSettings {
  enabled: boolean;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  whatsappNumber: string;
  whatsappMessageEn: string;
  whatsappMessageAr: string;
  ctaEn: string;
  ctaAr: string;
  fields: CustomOrderField[];
}

export type EventCardSize = 'large' | 'small';
export type EventButtonStyle = 'primary' | 'secondary' | 'outline' | 'text-arrow';
export type EventsCardsLayout = 'one-large-two-small' | 'grid';

export interface EventMasterclassItem {
  id: string;
  enabled: boolean;
  cardSize: EventCardSize;
  image: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  tagEn: string;
  tagAr: string;
  showButton: boolean;
  buttonEn: string;
  buttonAr: string;
  buttonUrl: string;
  buttonStyle: EventButtonStyle;
}

export interface EventsMasterclassesSettings {
  enabled: boolean;
  badgeEn: string;
  badgeAr: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  cardsLayout: EventsCardsLayout;
  cardsPerRowBottom: number;
  cardSpacing: 'small' | 'medium' | 'large';
  cardBorderRadius: number;
  sectionPaddingY: number;
  contentAlign: 'left' | 'center' | 'right';
  showSectionTag: boolean;
  showDescriptions: boolean;
  showActionButtons: boolean;
  showCardLabels: boolean;
  autoplay: boolean;
  showCarouselControls: boolean;
  autoplaySpeedSec: number;
  events: EventMasterclassItem[];
}

/** #13 Features Section — product/spec cards (≠ enhancedFeatures / C-ICON). */
export type FeaturesIconPosition = 'top' | 'left' | 'right';
export type FeaturesCardLayout = 'stacked' | 'inline' | 'centered';
export type FeaturesContentAlign = 'left' | 'center' | 'right';

export interface FeaturesSectionItem {
  id: string;
  enabled: boolean;
  icon: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface FeaturesSectionSettings {
  enabled: boolean;
  badgeEn: string;
  badgeAr: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  showBadge: boolean;
  showDescription: boolean;
  columnsDesktop: number;
  columnsTablet: number;
  columnsMobile: number;
  cardLayout: FeaturesCardLayout;
  contentAlign: FeaturesContentAlign;
  iconPosition: FeaturesIconPosition;
  sectionPaddingY: number;
  cardGapPx: number;
  cardPaddingPx: number;
  spacingTopPx: number;
  spacingBottomPx: number;
  showOnDesktop: boolean;
  showOnTablet: boolean;
  showOnMobile: boolean;
  items: FeaturesSectionItem[];
}

/** #14 Model Comparison — merchant models + spec rows (builder `model_comparison`). */
export interface ModelComparisonSpecValue {
  valueEn: string;
  valueAr: string;
}

export interface ModelComparisonModel {
  id: string;
  enabled: boolean;
  productId: string;
  image: string;
  nameEn: string;
  nameAr: string;
  price: number | null;
  buttonEn: string;
  buttonAr: string;
  selected: boolean;
}

export interface ModelComparisonSpec {
  id: string;
  enabled: boolean;
  nameEn: string;
  nameAr: string;
  /** Spec cell per model id */
  values: Record<string, ModelComparisonSpecValue>;
}

export interface ModelComparisonSettings {
  enabled: boolean;
  badgeEn: string;
  badgeAr: string;
  secondaryLabelEn: string;
  secondaryLabelAr: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  showBadge: boolean;
  showSecondaryLabel: boolean;
  showDescription: boolean;
  showProductImages: boolean;
  showProductPrices: boolean;
  showSelectionButtons: boolean;
  showSpecifications: boolean;
  highlightSelectedModel: boolean;
  showSpecificationLabels: boolean;
  allowFullScreen: boolean;
  sectionPaddingY: number;
  modelGapPx: number;
  cardPaddingPx: number;
  specRowGapPx: number;
  spacingTopPx: number;
  spacingBottomPx: number;
  showOnDesktop: boolean;
  showOnTablet: boolean;
  showOnMobile: boolean;
  models: ModelComparisonModel[];
  specs: ModelComparisonSpec[];
}

export interface CoffeeModularSlice {
  featuredCategoriesProducts: FeaturedCategoriesProductsSettings;
  heroBanners: HeroBannersSettings;
  featuredSectionBanners: FeaturedSectionBannersSettings;
  featuredProducts: CoffeeFeaturedProductsSettings;
  imageBanners: ImageBannersSettings;
  footer: CoffeeFooterSettings;
  exclusiveBenefits: ExclusiveBenefitsSettings;
  productCarousel: ProductCarouselSettings;
  productCarouselBanner: ProductCarouselBannerSettings;
  newsletter: NewsletterSettings;
  customOrder: CustomOrderSettings;
  eventsMasterclasses: EventsMasterclassesSettings;
  /** Builder type `features` — not Feature Icons. */
  featuresSection: FeaturesSectionSettings;
  /** Builder type `model_comparison`. */
  modelComparison: ModelComparisonSettings;
  /** Builder type `reviews` — chrome + form limits (review rows live on reviews API). */
  customerReviews: CustomerReviewsSettings;
  /** Builder type `faq` — bilingual Q/A accordion. */
  faq: FaqSettings;
  /** Builder type `commercial_hero` — single SKU hero with feature chips (≠ C-FSB / C-HERO). */
  commercialHero: CommercialHeroSettings;
  /** Builder type `product_slider` — horizontal product rail (≠ productCarousel). */
  productSlider: ProductSliderSettings;
  /** Builder type `product_collection` — promo + products + benefit boxes (≠ slider / PCB). */
  productCollection: ProductCollectionSettings;
  /** Builder type `product_catalog` / C-SHOP — shop grid chrome (≠ carousel / slider). */
  shop: ShopCatalogSettings;
  /**
   * Shared PDP chrome flags — ONE ProductDetailPage template.
   * applyScope=all → every SKU; selected → only productIds (others keep full defaults).
   */
  productDetail: ProductDetailPageSettings;
  checkoutFields?: CheckoutFieldSettings;
  seoDefaults?: SeoDefaultSettings;
}

/** Product detail page chrome (not catalog fields — those stay on Products admin / C-EDIT). */
export type ProductDetailApplyScope = 'all' | 'selected';

export interface ProductDetailPageSettings {
  enabled: boolean;
  applyScope: ProductDetailApplyScope;
  /** When applyScope=selected — THIS store product ids only. Empty = nobody gets custom flags. */
  productIds: string[];
  showFeatures: boolean;
  showVideo: boolean;
  showSpecs: boolean;
  showWarranty: boolean;
  showFloatingBuy: boolean;
  /** Customizer / builder preview SKU (not storefront truth). */
  previewProductId?: string;
}

export function emptyProductDetailPage(enabled = true): ProductDetailPageSettings {
  return {
    enabled,
    applyScope: 'all',
    productIds: [],
    showFeatures: true,
    showVideo: true,
    showSpecs: true,
    showWarranty: true,
    showFloatingBuy: true,
    previewProductId: '',
  };
}

export const COFFEE_MODULAR_KEYS = [
  'featuredCategoriesProducts',
  'heroBanners',
  'featuredSectionBanners',
  'featuredProducts',
  'imageBanners',
  'footer',
  'exclusiveBenefits',
  'productCarousel',
  'productCarouselBanner',
  'newsletter',
  'customOrder',
  'eventsMasterclasses',
  'featuresSection',
  'modelComparison',
  'customerReviews',
  'faq',
  'commercialHero',
  'productSlider',
  'productCollection',
  'shop',
  'productDetail',
] as const;

export type CoffeeModularKey = (typeof COFFEE_MODULAR_KEYS)[number];

function heroSlide(
  partial: Pick<HeroBannerSlideSettings, 'id' | 'image' | 'promoEn' | 'promoAr' | 'titleEn' | 'titleAr' | 'descriptionEn' | 'descriptionAr' | 'price' | 'productId' | 'buyNowEn' | 'buyNowAr'>,
): HeroBannerSlideSettings {
  return {
    enabled: true,
    mobileImage: '',
    showPrice: true,
    currency: 'SAR',
    textColor: '#111111',
    buyNowEnabled: true,
    addToCartEnabled: true,
    addToCartEn: 'Add to Cart',
    addToCartAr: 'أضف للسلة',
    learnMoreEnabled: true,
    learnMoreEn: 'Learn More',
    learnMoreAr: 'تعرف على المزيد',
    learnMoreUrl: '#products',
    customOrderEnabled: partial.id.includes('cabinet') || partial.id.includes('station'),
    customOrderEn: 'Custom Made to Order',
    customOrderAr: 'تفصيل حسب الطلب',
    // Empty = use Store Identity WhatsApp on click (wa.me). Do not force internal page.
    customOrderUrl: '',
    ...partial,
  };
}

export function emptyEventsMasterclasses(enabled = false): EventsMasterclassesSettings {
  return {
    enabled,
    badgeEn: '',
    badgeAr: '',
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    cardsLayout: 'one-large-two-small',
    cardsPerRowBottom: 2,
    cardSpacing: 'medium',
    cardBorderRadius: 16,
    sectionPaddingY: 48,
    contentAlign: 'center',
    showSectionTag: true,
    showDescriptions: true,
    showActionButtons: true,
    showCardLabels: true,
    autoplay: false,
    showCarouselControls: true,
    autoplaySpeedSec: 5,
    events: [],
  };
}

export function emptyFeaturesSection(enabled = false): FeaturesSectionSettings {
  return {
    enabled,
    badgeEn: '',
    badgeAr: '',
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    showBadge: true,
    showDescription: true,
    columnsDesktop: 3,
    columnsTablet: 2,
    columnsMobile: 1,
    cardLayout: 'stacked',
    contentAlign: 'center',
    iconPosition: 'top',
    sectionPaddingY: 48,
    cardGapPx: 16,
    cardPaddingPx: 20,
    spacingTopPx: 0,
    spacingBottomPx: 0,
    showOnDesktop: true,
    showOnTablet: true,
    showOnMobile: true,
    items: [],
  };
}

export function emptyModelComparison(enabled = false): ModelComparisonSettings {
  return {
    enabled,
    badgeEn: '',
    badgeAr: '',
    secondaryLabelEn: '',
    secondaryLabelAr: '',
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    showBadge: true,
    showSecondaryLabel: true,
    showDescription: true,
    showProductImages: true,
    showProductPrices: true,
    showSelectionButtons: true,
    showSpecifications: true,
    highlightSelectedModel: true,
    showSpecificationLabels: true,
    allowFullScreen: false,
    sectionPaddingY: 48,
    modelGapPx: 16,
    cardPaddingPx: 16,
    specRowGapPx: 8,
    spacingTopPx: 0,
    spacingBottomPx: 0,
    showOnDesktop: true,
    showOnTablet: true,
    showOnMobile: true,
    models: [],
    specs: [],
  };
}

/** #15 Customer Reviews — widget chrome; review rows stay on `/reviews` API. */
export interface CustomerReviewsSettings {
  enabled: boolean;
  badgeEn: string;
  badgeAr: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  showBadge: boolean;
  showDescription: boolean;
  showRatingsSummary: boolean;
  showReviewTabs: boolean;
  allowPhotoUpload: boolean;
  enableWriteReview: boolean;
  requireApproval: boolean;
  formTitleEn: string;
  formTitleAr: string;
  placeholderEn: string;
  placeholderAr: string;
  characterLimit: number;
  photoUploadLimit: number;
  submitButtonEn: string;
  submitButtonAr: string;
  writeButtonEn: string;
  writeButtonAr: string;
  reviewsPerPage: number;
  sectionPaddingY: number;
  cardGapPx: number;
  spacingTopPx: number;
  spacingBottomPx: number;
  showOnDesktop: boolean;
  showOnTablet: boolean;
  showOnMobile: boolean;
}

export function emptyCustomerReviews(enabled = false): CustomerReviewsSettings {
  return {
    enabled,
    badgeEn: '',
    badgeAr: '',
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    showBadge: true,
    showDescription: true,
    showRatingsSummary: true,
    showReviewTabs: true,
    allowPhotoUpload: true,
    enableWriteReview: true,
    requireApproval: true,
    formTitleEn: '',
    formTitleAr: '',
    placeholderEn: '',
    placeholderAr: '',
    characterLimit: 500,
    photoUploadLimit: 5,
    submitButtonEn: '',
    submitButtonAr: '',
    writeButtonEn: '',
    writeButtonAr: '',
    reviewsPerPage: 10,
    sectionPaddingY: 48,
    cardGapPx: 16,
    spacingTopPx: 0,
    spacingBottomPx: 0,
    showOnDesktop: true,
    showOnTablet: true,
    showOnMobile: true,
  };
}

/** #16 FAQ — bilingual Q/A accordion (merchant items only; never seed-decorate). */
export interface FaqItem {
  id: string;
  enabled: boolean;
  qEn: string;
  qAr: string;
  aEn: string;
  aAr: string;
}

export interface FaqSettings {
  enabled: boolean;
  badgeEn: string;
  badgeAr: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  showBadge: boolean;
  showTitle: boolean;
  showDescription: boolean;
  allowMultipleOpen: boolean;
  openFirstByDefault: boolean;
  sectionPaddingY: number;
  itemGapPx: number;
  spacingTopPx: number;
  spacingBottomPx: number;
  showOnDesktop: boolean;
  showOnTablet: boolean;
  showOnMobile: boolean;
  items: FaqItem[];
}

export function emptyFaq(enabled = false): FaqSettings {
  return {
    enabled,
    badgeEn: '',
    badgeAr: '',
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    showBadge: true,
    showTitle: true,
    showDescription: true,
    allowMultipleOpen: false,
    openFirstByDefault: true,
    sectionPaddingY: 48,
    itemGapPx: 12,
    spacingTopPx: 0,
    spacingBottomPx: 0,
    showOnDesktop: true,
    showOnTablet: true,
    showOnMobile: true,
    items: [],
  };
}

/** #17 Commercial Hero — flagship SKU slides + feature chips (≠ heroBanners / FSB). */
export interface CommercialHeroFeature {
  id: string;
  enabled: boolean;
  icon: string;
  labelEn: string;
  labelAr: string;
  valueEn: string;
  valueAr: string;
}

export interface CommercialHeroSlide {
  id: string;
  enabled: boolean;
  image: string;
  badgeEn: string;
  badgeAr: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  price: number | null;
  productId: string;
  buyNowEnabled: boolean;
  buyNowEn: string;
  buyNowAr: string;
  addToCartEnabled: boolean;
  addToCartEn: string;
  addToCartAr: string;
  features: CommercialHeroFeature[];
}

/** Text left + image right | text right + image left | centered stack. */
export type CommercialHeroAlign = 'image-right' | 'image-left' | 'centered';
export type CommercialHeroWidth = 'narrow' | 'medium' | 'wide' | 'full';

export interface CommercialHeroSettings {
  enabled: boolean;
  showBadge: boolean;
  showSubtitle: boolean;
  showPrice: boolean;
  showButtons: boolean;
  showIcons: boolean;
  showFeatures: boolean;
  autoplay: boolean;
  showArrows: boolean;
  showDots: boolean;
  transitionSec: number;
  contentAlign: CommercialHeroAlign;
  contentWidth: CommercialHeroWidth;
  sectionPaddingY: number;
  contentGapPx: number;
  featuresGapPx: number;
  showOnDesktop: boolean;
  showOnTablet: boolean;
  showOnMobile: boolean;
  slides: CommercialHeroSlide[];
}

export function emptyCommercialHero(enabled = false): CommercialHeroSettings {
  return {
    enabled,
    showBadge: true,
    showSubtitle: true,
    showPrice: true,
    showButtons: true,
    showIcons: true,
    showFeatures: true,
    autoplay: false,
    showArrows: true,
    showDots: true,
    transitionSec: 5,
    contentAlign: 'image-right',
    contentWidth: 'wide',
    sectionPaddingY: 48,
    contentGapPx: 24,
    featuresGapPx: 12,
    showOnDesktop: true,
    showOnTablet: true,
    showOnMobile: true,
    slides: [],
  };
}

/** #18 Product Slider — horizontal rail (≠ Product Carousel C-PC). */
export type ProductSliderSource =
  | 'manual'
  | 'category'
  | 'featured'
  | 'latest'
  | 'best_selling';

export interface ProductSliderItem {
  id: string;
  enabled: boolean;
  productId: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  image: string;
  price: number | null;
  originalPrice: number | null;
  productLink: string;
  showBuyNow: boolean;
  showAddToCart: boolean;
  featured: boolean;
}

export interface ProductSliderSettings {
  enabled: boolean;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  showTitle: boolean;
  showDescription: boolean;
  sourceType: ProductSliderSource;
  categoryId: string;
  /** Prefer over legacy sourceType when set (category/brand multi + mix). */
  productSource?: CoffeeProductSourceConfig;
  productCount: number;
  showArrows: boolean;
  showDots: boolean;
  autoplay: boolean;
  transitionSec: number;
  itemsPerViewDesktop: number;
  itemsPerViewTablet: number;
  itemsPerViewMobile: number;
  showPrice: boolean;
  showOriginalPrice: boolean;
  showAddToCart: boolean;
  showBuyNow: boolean;
  showProductDescription: boolean;
  sectionPaddingY: number;
  cardGapPx: number;
  cardPaddingPx: number;
  showOnDesktop: boolean;
  showOnTablet: boolean;
  showOnMobile: boolean;
  items: ProductSliderItem[];
}

export function emptyProductSlider(enabled = false): ProductSliderSettings {
  return {
    enabled,
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    showTitle: true,
    showDescription: true,
    sourceType: 'manual',
    categoryId: '',
    productCount: 8,
    showArrows: true,
    showDots: false,
    autoplay: false,
    transitionSec: 5,
    itemsPerViewDesktop: 4,
    itemsPerViewTablet: 2,
    itemsPerViewMobile: 1,
    showPrice: true,
    showOriginalPrice: true,
    showAddToCart: true,
    showBuyNow: true,
    showProductDescription: false,
    sectionPaddingY: 48,
    cardGapPx: 16,
    cardPaddingPx: 16,
    showOnDesktop: true,
    showOnTablet: true,
    showOnMobile: true,
    items: [],
  };
}

/** #20 Product Collection — promo card + products + benefit boxes. */
export type ProductCollectionLayout =
  | 'promo_slider'
  | 'products_only'
  | 'promo_products'
  | 'promo_slider_benefits';

export type ProductCollectionPromoLayout =
  | 'vertical-left'
  | 'vertical-right'
  | 'horizontal-top'
  | 'horizontal-bottom';

export type ProductCollectionBenefitsLayout = 'row4' | 'grid2' | 'scroll' | 'stack';

export interface ProductCollectionPromo {
  enabled: boolean;
  badgeEn: string;
  badgeAr: string;
  titleEn: string;
  titleAr: string;
  buttonEn: string;
  buttonAr: string;
  buttonUrl: string;
  image: string;
}

export interface ProductCollectionBenefit {
  id: string;
  enabled: boolean;
  icon: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface ProductCollectionSettings {
  enabled: boolean;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  showTitle: boolean;
  showDescription: boolean;
  sectionStyle: ProductCollectionLayout;
  showPromoCard: boolean;
  promoLayout: ProductCollectionPromoLayout;
  promo: ProductCollectionPromo;
  sourceType: ProductSliderSource;
  categoryId: string;
  /** Prefer over legacy sourceType when set. */
  productSource?: CoffeeProductSourceConfig;
  productCount: number;
  showArrows: boolean;
  showDots: boolean;
  autoplay: boolean;
  transitionSec: number;
  itemsPerViewDesktop: number;
  itemsPerViewTablet: number;
  itemsPerViewMobile: number;
  showBenefitBoxes: boolean;
  benefitsLayout: ProductCollectionBenefitsLayout;
  showPrice: boolean;
  showBuyNow: boolean;
  showAddToCart: boolean;
  showLearnMore: boolean;
  sectionPaddingY: number;
  cardGapPx: number;
  promoGapPx: number;
  benefitsGapPx: number;
  showOnDesktop: boolean;
  showOnTablet: boolean;
  showOnMobile: boolean;
  items: ProductSliderItem[];
  benefits: ProductCollectionBenefit[];
}

export function emptyProductCollection(enabled = false): ProductCollectionSettings {
  return {
    enabled,
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    showTitle: true,
    showDescription: true,
    sectionStyle: 'promo_slider_benefits',
    showPromoCard: true,
    promoLayout: 'vertical-left',
    promo: {
      enabled: true,
      badgeEn: '',
      badgeAr: '',
      titleEn: '',
      titleAr: '',
      buttonEn: '',
      buttonAr: '',
      buttonUrl: '',
      image: '',
    },
    sourceType: 'manual',
    categoryId: '',
    productCount: 8,
    showArrows: true,
    showDots: false,
    autoplay: false,
    transitionSec: 5,
    itemsPerViewDesktop: 3,
    itemsPerViewTablet: 2,
    itemsPerViewMobile: 1,
    showBenefitBoxes: true,
    benefitsLayout: 'row4',
    showPrice: true,
    showBuyNow: true,
    showAddToCart: true,
    showLearnMore: true,
    sectionPaddingY: 48,
    cardGapPx: 16,
    promoGapPx: 24,
    benefitsGapPx: 12,
    showOnDesktop: true,
    showOnTablet: true,
    showOnMobile: true,
    items: [],
    benefits: [],
  };
}

export function emptyCoffeeModular(): CoffeeModularSlice {
  return {
    featuredCategoriesProducts: { enabled: false, sections: [] },
    heroBanners: {
      enabled: false,
      autoplay: true,
      intervalMs: 5000,
      showArrows: true,
      showDots: true,
      showWhatsapp: false,
      whatsappNumber: '',
      textColor: '#111111',
      contentMode: 'both',
      styleDesktop: emptyHeroDeviceStyle(),
      styleLaptop: emptyHeroDeviceStyle(),
      styleMobile: emptyHeroDeviceStyle(),
      banners: [],
      imageOnlyBanners: [],
    },
    featuredSectionBanners: { enabled: false, titleEn: '', titleAr: '', subtitleEn: '', subtitleAr: '', banners: [] },
    featuredProducts: {
      enabled: false,
      titleEn: '',
      titleAr: '',
      descriptionEn: '',
      descriptionAr: '',
      tabs: [],
      productCount: 8,
      highlightFirst: true,
      showPrice: true,
      showRating: true,
    },
    imageBanners: { enabled: false, layout: 'grid', columnsDesktop: 3, columnsMobile: 1, items: [] },
    footer: {
      enabled: false,
      layout: 'columns',
      aboutEn: '',
      aboutAr: '',
      columns: [],
      copyrightEn: '',
      copyrightAr: '',
      showSocial: false,
      showPaymentIcons: false,
    },
    exclusiveBenefits: { enabled: false, titleEn: '', titleAr: '', subtitleEn: '', subtitleAr: '', items: [] },
    productCarousel: {
      enabled: false,
      titleEn: '',
      titleAr: '',
      subtitleEn: '',
      subtitleAr: '',
      categoryId: '',
      productCount: 8,
      autoplay: false,
      productsPerRowDesktop: 3,
      productsPerRowTablet: 2,
      productsPerRowMobile: 1,
      cardStyle: 'rounded',
      cardBgColor: '#FFFFFF',
      cardBorderRadius: 16,
      cardPadding: 16,
      itemSpacing: 16,
      showArrowsDesktop: true,
      showArrowsMobile: false,
      enableTouchSwipe: true,
      items: [],
    },
    productCarouselBanner: {
      enabled: false,
      bannerImage: '',
      titleEn: '',
      titleAr: '',
      subtitleEn: '',
      subtitleAr: '',
      buttonEn: '',
      buttonAr: '',
      buttonUrl: '',
      categoryId: '',
      productCount: 4,
    },
    newsletter: {
      enabled: false,
      titleEn: '',
      titleAr: '',
      subtitleEn: '',
      subtitleAr: '',
      placeholderEn: '',
      placeholderAr: '',
      buttonEn: '',
      buttonAr: '',
      successEn: '',
      successAr: '',
      couponCode: '',
      showCoupon: false,
      bgColor: '#111111',
      textColor: '#FFFFFF',
    },
    customOrder: {
      enabled: false,
      titleEn: '',
      titleAr: '',
      subtitleEn: '',
      subtitleAr: '',
      whatsappNumber: '',
      whatsappMessageEn: '',
      whatsappMessageAr: '',
      ctaEn: '',
      ctaAr: '',
      fields: [],
    },
    eventsMasterclasses: emptyEventsMasterclasses(false),
    featuresSection: emptyFeaturesSection(false),
    modelComparison: emptyModelComparison(false),
    customerReviews: emptyCustomerReviews(false),
    faq: emptyFaq(false),
    commercialHero: emptyCommercialHero(false),
    productSlider: emptyProductSlider(false),
    productCollection: emptyProductCollection(false),
    shop: emptyShopCatalog(),
    productDetail: emptyProductDetailPage(true),
  };
}

export function coffeeModularSeed(): CoffeeModularSlice {
  return {
    featuredCategoriesProducts: {
      enabled: true,
      titleEn: 'Shop HiBrew by Category',
      titleAr: 'تسوّق هايبرو حسب التصنيف',
      descriptionEn: 'Official machines, mills, cabinets, and barista tools for KSA.',
      descriptionAr: 'مكائن ومطاحن وخزائن وأدوات باريستا رسمية داخل المملكة.',
      buyLabelEn: 'Buy',
      buyLabelAr: 'شراء',
      learnMoreLabelEn: 'Learn More',
      learnMoreLabelAr: 'تعرف على المزيد',
      titleFontSizePx: 16,
      titleColor: '#171717',
      taglineFontSizePx: 13,
      taglineColor: '#525252',
      priceFontSizePx: 15,
      priceColor: '#171717',
      ctaFontSizePx: 12,
      buyColor: '#171717',
      learnMoreColor: '#171717',
      equalCardHeights: true,
      showMoreProducts: true,
      moreProductsEn: 'More Products',
      moreProductsAr: 'المزيد من المنتجات',
      moreProductsUrl: 'products',
      maxVisibleProducts: 5,
      bgColor: '#F9F9F9',
      cardStyle: 'rounded',
      cardSpacing: 'medium',
      showPrice: true,
      sections: [
        {
          id: 'fcp-hibrew-gear',
          enabled: true,
          titleEn: 'Shop HiBrew by Category',
          titleAr: 'تسوّق هايبرو حسب التصنيف',
          descriptionEn: 'Official machines, mills, cabinets, and barista tools for KSA.',
          descriptionAr: 'مكائن ومطاحن وخزائن وأدوات باريستا رسمية داخل المملكة.',
          categories: [
            { id: 'fcp-cat-machines', enabled: true, entryType: 'category', labelEn: 'Coffee Machines', labelAr: 'مكائن القهوة', categoryId: 'machines', image: H1, pageUrl: '' },
            { id: 'fcp-cat-mills', enabled: true, entryType: 'category', labelEn: 'Coffee Mills', labelAr: 'مطاحن القهوة', categoryId: 'mills', image: H2, pageUrl: '' },
            { id: 'fcp-cat-cabinets', enabled: true, entryType: 'category', labelEn: 'Coffee Cabinets', labelAr: 'خزائن القهوة', categoryId: 'cabinets', image: H3, pageUrl: '' },
            { id: 'fcp-cat-accessories', enabled: true, entryType: 'category', labelEn: 'Barista Accessories', labelAr: 'إكسسوارات الباريستا', categoryId: 'accessories', image: H1, pageUrl: '' },
          ],
          productSource: 'category',
          productIds: [],
          sortBy: 'manual',
          productCount: 8,
          compareEnabled: true,
          maxCompare: 3,
          compareButtonEn: 'Compare',
          compareButtonAr: 'قارن',
          showPrice: true,
          showRating: true,
          showDiscount: true,
          showCompare: true,
          showViewMore: true,
          viewMoreEn: 'More Products',
          viewMoreAr: 'المزيد من المنتجات',
          viewMoreLink: 'products',
          columnsDesktop: 5,
          columnsMobile: 2,
          cardStyle: 'rounded',
          spacing: 'medium',
        },
      ],
    },
    heroBanners: {
      enabled: true,
      autoplay: true,
      intervalMs: 6000,
      showArrows: true,
      showDots: true,
      showWhatsapp: true,
      whatsappNumber: '',
      textColor: '#111111',
      contentMode: 'both',
      styleDesktop: {
        ...emptyHeroDeviceStyle(),
        textColor: '#111111',
        cardBg: '#ffffff',
        cardOpacity: 0.85,
        buttonBg: '#111111',
        buttonTextColor: '#ffffff',
      },
      styleLaptop: {
        ...emptyHeroDeviceStyle(),
        textColor: '#111111',
        cardBg: '#ffffff',
        cardOpacity: 0.82,
        buttonBg: '#171717',
        buttonTextColor: '#ffffff',
      },
      styleMobile: {
        ...emptyHeroDeviceStyle(),
        textColor: '#0a0a0a',
        cardBg: '#ffffff',
        cardOpacity: 0.92,
        buttonBg: '#000000',
        buttonTextColor: '#ffffff',
      },
      banners: [
        {
          ...heroSlide({
            id: 'hero-ai-full-dual',
            image: AI_FULL_DESKTOP,
            promoEn: 'Flagship Choice',
            promoAr: 'خيار الفئة الرائدة',
            titleEn: 'HiBrew Barista Pro Dual-Boiler',
            titleAr: 'هايبرو بارستا برو دبل بويلر',
            descriptionEn: 'Dual PID thermoblock, 58mm group, and 20-bar Italian pump.',
            descriptionAr: 'دبل بويلر PID ومقبس 58 ملم ومضخة إيطالية 20 بار.',
            price: '1899',
            productId: 'hb-h10a-dualboiler',
            buyNowEn: 'Shop Now',
            buyNowAr: 'تسوق الآن',
          }),
          mobileImage: AI_FULL_MOBILE,
          tabletImage: AI_FULL_DESKTOP,
        },
        {
          ...heroSlide({
            id: 'hero-hibrew-mill',
            image: H2,
            promoEn: 'Titanium Burrs',
            promoAr: 'تروس تيتانيوم',
            titleEn: 'HiBrew Titanium Burr Grinder G5',
            titleAr: 'مطحنة هايبرو G5 بتروس تيتانيوم',
            descriptionEn: '40mm CNC titanium burrs with a stepless micron dial.',
            descriptionAr: 'تروس تيتانيوم 40 مم مع ضبط ميكروني متدرّج.',
            price: '749',
            productId: 'hb-mill-g5-pro',
            buyNowEn: 'Explore Grinders',
            buyNowAr: 'اكتشف المطاحن',
          }),
          mobileImage: H2,
        },
        {
          ...heroSlide({
            id: 'hero-hibrew-station',
            image: H3,
            promoEn: 'Handcrafted',
            promoAr: 'تفصيل فاخر',
            titleEn: 'HiBrew Luxury Oak Coffee Station',
            titleAr: 'ركن قهوة هايبرو من خشب البلوط',
            descriptionEn: 'Fluted American oak, sintered stone top, concealed power track.',
            descriptionAr: 'بلوط أمريكي وسطح حجر مقاوم للحرارة ومسار كهرباء مخفي.',
            price: '2450',
            productId: 'hb-nordic-cabinet',
            buyNowEn: 'Design Your Corner',
            buyNowAr: 'صمّم ركنك',
          }),
          mobileImage: H3,
        },
      ],
      imageOnlyBanners: [
        {
          ...heroSlide({
            id: 'hero-ai-img-only-1',
            image: AI_IMG_DESKTOP,
            promoEn: '',
            promoAr: '',
            titleEn: '',
            titleAr: '',
            descriptionEn: '',
            descriptionAr: '',
            price: '',
            productId: 'hb-mill-g5-pro',
            buyNowEn: '',
            buyNowAr: '',
          }),
          mobileImage: AI_IMG_MOBILE,
          tabletImage: AI_IMG_DESKTOP,
          showPrice: false,
          buyNowEnabled: false,
          addToCartEnabled: false,
          learnMoreEnabled: false,
          customOrderEnabled: false,
        },
        {
          ...heroSlide({
            id: 'hero-ai-img-only-2',
            image: AI_FULL_DESKTOP,
            promoEn: '',
            promoAr: '',
            titleEn: '',
            titleAr: '',
            descriptionEn: '',
            descriptionAr: '',
            price: '',
            productId: 'hb-h10a-dualboiler',
            buyNowEn: '',
            buyNowAr: '',
          }),
          mobileImage: AI_FULL_MOBILE,
          tabletImage: AI_FULL_DESKTOP,
          showPrice: false,
          buyNowEnabled: false,
          addToCartEnabled: false,
          learnMoreEnabled: false,
          customOrderEnabled: false,
        },
      ],
    },
    featuredSectionBanners: {
      enabled: true,
      titleEn: 'Featured HiBrew Flagships',
      titleAr: 'إصدارات هايبرو الرائدة',
      subtitleEn: 'Dual-boiler extraction, precision mills, and bespoke oak stations.',
      subtitleAr: 'استخلاص دبل بويلر ومطاحن دقيقة وأركان بلوط حسب الطلب.',
      banners: [
        {
          id: 'fsb-dual',
          enabled: true,
          bgColor: '#F5EADA',
          images: [H1, H2],
          promoEn: 'Flagship extraction',
          promoAr: 'استخلاص الفئة الرائدة',
          titleEn: 'HiBrew Dual-Boiler 20-Bar Barista Pro',
          titleAr: 'ماكينة هايبرو دبل بويلر 20 بار',
          descriptionEn: 'Commercial 58mm group and golden crema for home baristas.',
          descriptionAr: 'مقبس تجاري 58 ملم وكريما ذهبية لباريستا المنزل.',
          showPrice: true,
          price: '1899',
          currency: 'SAR',
          productId: 'hb-h10a-dualboiler',
          textColor: '#1a110c',
          align: 'left',
          overlay: 'none',
          overlayOpacity: 0,
          buttons: [
            { id: 'fsb-dual-buy', enabled: true, type: 'buy', labelEn: 'Buy Now', labelAr: 'اشتر الآن', url: '', productId: 'hb-h10a-dualboiler' },
            { id: 'fsb-dual-cart', enabled: true, type: 'cart', labelEn: 'Add to Cart', labelAr: 'أضف للسلة', url: '', productId: 'hb-h10a-dualboiler' },
            { id: 'fsb-dual-more', enabled: true, type: 'link', labelEn: 'Learn More', labelAr: 'تعرف على المزيد', url: 'product-detail', productId: 'hb-h10a-dualboiler' },
          ],
        },
        {
          id: 'fsb-mill',
          enabled: true,
          bgColor: '#F8E2D8',
          images: [H2, H3],
          promoEn: 'Precision mill',
          promoAr: 'مطحنة دقيقة',
          titleEn: 'HiBrew Titanium Burr Grinder G5',
          titleAr: 'مطحنة هايبرو G5 تيتانيوم',
          descriptionEn: 'Stepless grind and zero-retention chute for espresso dial-in.',
          descriptionAr: 'طحن متدرّج ومجرى بدون بقايا لضبط الإسبريسو.',
          showPrice: true,
          price: '749',
          currency: 'SAR',
          productId: 'hb-mill-g5-pro',
          textColor: '#1a110c',
          align: 'left',
          overlay: 'none',
          overlayOpacity: 0,
          buttons: [
            { id: 'fsb-mill-buy', enabled: true, type: 'buy', labelEn: 'Buy Now', labelAr: 'اشتر الآن', url: '', productId: 'hb-mill-g5-pro' },
            { id: 'fsb-mill-more', enabled: true, type: 'link', labelEn: 'Learn More', labelAr: 'تعرف على المزيد', url: 'product-detail', productId: 'hb-mill-g5-pro' },
          ],
        },
        {
          id: 'fsb-oak',
          enabled: true,
          bgColor: '#E6ECE5',
          images: [H3, H1],
          promoEn: 'Custom order',
          promoAr: 'تفصيل حسب الطلب',
          titleEn: 'HiBrew Luxury Oak Coffee Station',
          titleAr: 'ركن القهوة الفاخر من البلوط',
          descriptionEn: 'Made to your measurements. WhatsApp the dimensions.',
          descriptionAr: 'يُفصَّل على مقاسك. أرسل الأبعاد عبر واتساب.',
          showPrice: true,
          price: '2450',
          currency: 'SAR',
          productId: 'hb-nordic-cabinet',
          textColor: '#1a110c',
          align: 'left',
          overlay: 'none',
          overlayOpacity: 0,
          buttons: [
            { id: 'fsb-oak-more', enabled: true, type: 'link', labelEn: 'Design Your Corner', labelAr: 'صمّم ركنك', url: 'custom-order', productId: '' },
          ],
        },
      ],
    },
    featuredProducts: {
      enabled: true,
      titleEn: 'All Products',
      titleAr: 'جميع المنتجات',
      descriptionEn: 'Official HiBrew machines, mills, cabinets, and barista gear.',
      descriptionAr: 'مكائن ومطاحن وخزائن وأدوات باريستا من هايبرو الرسمية.',
      tabs: [
        { id: 'fp-all', enabled: true, labelEn: 'Latest Product', labelAr: 'أحدث المنتجات', categoryId: 'all' },
        { id: 'fp-machines', enabled: true, labelEn: 'Coffee Machines', labelAr: 'مكائن القهوة', categoryId: 'machines' },
        { id: 'fp-mills', enabled: true, labelEn: 'Coffee Mills', labelAr: 'مطاحن القهوة', categoryId: 'mills' },
        { id: 'fp-cabinets', enabled: true, labelEn: 'Coffee Cabinets', labelAr: 'خزائن القهوة', categoryId: 'cabinets' },
        { id: 'fp-accessories', enabled: true, labelEn: 'Barista Accessories', labelAr: 'إكسسوارات الباريستا', categoryId: 'accessories' },
        { id: 'fp-offers', enabled: true, labelEn: 'Special Offers', labelAr: 'عروض خاصة', categoryId: 'offers' },
      ],
      productCount: 8,
      highlightFirst: true,
      showPrice: true,
      showRating: true,
    },
    imageBanners: {
      enabled: true,
      layout: 'grid',
      columnsDesktop: 3,
      columnsMobile: 1,
      items: [
        { id: 'img-machines', enabled: true, image: H1, titleEn: 'Dual-Boiler Machines', titleAr: 'مكائن الدبل بويلر', subtitleEn: '20-bar extraction for home cafés', subtitleAr: 'استخلاص 20 بار لمقاهي المنزل', link: 'products', buttonEn: 'Shop Machines', buttonAr: 'تسوّق المكائن' },
        { id: 'img-mills', enabled: true, image: H2, titleEn: 'Titanium Mills', titleAr: 'مطاحن التيتانيوم', subtitleEn: 'Micron dial, zero retention', subtitleAr: 'ضبط ميكروني بدون بقايا', link: 'products', buttonEn: 'Shop Mills', buttonAr: 'تسوّق المطاحن' },
        { id: 'img-corners', enabled: true, image: H3, titleEn: 'Oak Coffee Corners', titleAr: 'أركان قهوة من البلوط', subtitleEn: 'Custom sizes across KSA', subtitleAr: 'مقاسات مخصصة في كل مدن المملكة', link: 'custom-order', buttonEn: 'Start a Custom Order', buttonAr: 'ابدأ طلب التفصيل' },
      ],
    },
    footer: {
      enabled: true,
      layout: 'columns',
      aboutEn: 'HiBrew KSA — official coffee machines, mills, and barista stations with a 2-year agency warranty.',
      aboutAr: 'هايبرو السعودية — مكائن ومطاحن وأركان قهوة رسمية مع ضمان الوكيل لمدة سنتين.',
      copyrightEn: 'Copyright © HiBrew KSA. All rights reserved.',
      copyrightAr: 'حقوق النشر © هايبرو السعودية. جميع الحقوق محفوظة.',
      showSocial: true,
      showPaymentIcons: true,
      columns: [
        {
          id: 'ft-about',
          titleEn: 'About HiBrew',
          titleAr: 'عن هايبرو',
          links: [
            { id: 'ft-about-story', labelEn: 'Brand Story', labelAr: 'قصة العلامة', url: 'about' },
            { id: 'ft-about-reviews', labelEn: 'Customer Reviews', labelAr: 'آراء العملاء', url: 'reviews' },
            { id: 'ft-about-stores', labelEn: 'Showrooms', labelAr: 'المعارض', url: 'locator' },
          ],
        },
        {
          id: 'ft-products',
          titleEn: 'Products',
          titleAr: 'المنتجات',
          links: [
            { id: 'ft-pr-machines', labelEn: 'Coffee Machines', labelAr: 'مكائن القهوة', url: 'products' },
            { id: 'ft-pr-mills', labelEn: 'Coffee Mills', labelAr: 'مطاحن القهوة', url: 'products' },
            { id: 'ft-pr-custom', labelEn: 'Custom Corners', labelAr: 'أركان حسب الطلب', url: 'custom-order' },
          ],
        },
        {
          id: 'ft-support',
          titleEn: 'Support',
          titleAr: 'الدعم',
          links: [
            { id: 'ft-sup-warranty', labelEn: '2-Year Warranty', labelAr: 'ضمان سنتين', url: 'warranty' },
            { id: 'ft-sup-contact', labelEn: 'Contact', labelAr: 'تواصل معنا', url: 'contact' },
            { id: 'ft-sup-track', labelEn: 'Track Order', labelAr: 'تتبع الطلب', url: 'track-order' },
          ],
        },
      ],
    },
    exclusiveBenefits: {
      enabled: true,
      titleEn: 'Exclusive HiBrew Benefits',
      titleAr: 'مزايا هايبرو الحصرية',
      subtitleEn: 'Warranty, delivery, and bespoke corners for Saudi baristas.',
      subtitleAr: 'ضمان وتوصيل وأركان مفصّلة لباريستا المملكة.',
      items: [
        { id: 'ben-warranty', enabled: true, icon: 'ShieldCheck', titleEn: '2-Year Agency Warranty', titleAr: 'ضمان الوكيل سنتين', descriptionEn: 'Authorized service and genuine spare parts.', descriptionAr: 'صيانة معتمدة وقطع غيار أصلية.' },
        { id: 'ben-ship', enabled: true, icon: 'Truck', titleEn: 'Express KSA Delivery', titleAr: 'توصيل سريع داخل المملكة', descriptionEn: 'Free shipping on orders over SAR 200.', descriptionAr: 'شحن مجاني للطلبات فوق 200 ريال.' },
        { id: 'ben-bnpl', enabled: true, icon: 'CreditCard', titleEn: 'Buy Now, Pay Later', titleAr: 'اشتر الآن وادفع لاحقاً', descriptionEn: 'Tabby and Tamara installments.', descriptionAr: 'تقسيط عبر تابي وتمارا.' },
        { id: 'ben-custom', enabled: true, icon: 'Palette', titleEn: 'Custom Coffee Corners', titleAr: 'تفصيل أركان القهوة', descriptionEn: 'Oak and sintered stone built to your size.', descriptionAr: 'بلوط وحجر يُفصَّلان على مقاسك.' },
      ],
    },
    productCarousel: {
      enabled: true,
      titleEn: 'HiBrew Flagship Machines',
      titleAr: 'مكائن هايبرو الرائدة',
      subtitleEn: 'Dual-boiler espresso, mills, and barista stations.',
      subtitleAr: 'إسبريسو دبل بويلر ومطاحن وأركان باريستا.',
      categoryId: 'machines',
      productCount: 8,
      autoplay: false,
      productsPerRowDesktop: 3,
      productsPerRowTablet: 2,
      productsPerRowMobile: 1,
      cardStyle: 'rounded',
      cardBgColor: '#FFFFFF',
      cardBorderRadius: 16,
      cardPadding: 16,
      itemSpacing: 16,
      showArrowsDesktop: true,
      showArrowsMobile: false,
      enableTouchSwipe: true,
      items: [],
    },
    productCarouselBanner: {
      enabled: true,
      bannerImage: H1,
      titleEn: 'Build Your Coffee Corner',
      titleAr: 'ابنِ ركن قهوتك',
      subtitleEn: 'Pair a flagship machine with a custom oak station.',
      subtitleAr: 'اجمع ماكينة رائدة مع ركن بلوط مفصّل.',
      buttonEn: 'Shop the Edit',
      buttonAr: 'تسوّق التشكيلة',
      buttonUrl: 'products',
      categoryId: 'accessories',
      productCount: 4,
    },
    newsletter: {
      enabled: true,
      titleEn: 'Subscribe for HiBrew offers and barista notes',
      titleAr: 'اشترك لعروض هايبرو وملاحظات الباريستا',
      subtitleEn: 'Occasional product news. Unsubscribe any time. A code is a label only until a coupon is created in marketing.',
      subtitleAr: 'أخبار المنتجات بين الحين والآخر. يمكنك إلغاء الاشتراك في أي وقت. الرمز وصفي إلى أن يُنشأ كوبون في التسويق.',
      placeholderEn: 'Email address',
      placeholderAr: 'البريد الإلكتروني',
      buttonEn: 'Subscribe',
      buttonAr: 'اشتراك',
      successEn: 'You are subscribed.',
      successAr: 'تم الاشتراك.',
      couponCode: '',
      showCoupon: false,
      bgColor: '#111111',
      textColor: '#FFFFFF',
    },
    customOrder: {
      enabled: true,
      titleEn: 'Custom Coffee Corner',
      titleAr: 'ركن قهوة حسب الطلب',
      subtitleEn: 'Send your width, wood, and stone choices. We confirm on WhatsApp.',
      subtitleAr: 'أرسل العرض ونوع الخشب والحجر. نؤكد الطلب عبر واتساب.',
      whatsappNumber: '',
      whatsappMessageEn: 'Hello, I would like a custom HiBrew coffee corner.',
      whatsappMessageAr: 'السلام عليكم، أود طلب ركن قهوة هايبرو حسب المقاس.',
      ctaEn: 'Send on WhatsApp',
      ctaAr: 'إرسال عبر واتساب',
      fields: [
        { id: 'co-width', enabled: true, labelEn: 'Width (cm)', labelAr: 'العرض (سم)', type: 'number', required: true },
        { id: 'co-wood', enabled: true, labelEn: 'Wood', labelAr: 'نوع الخشب', type: 'text', required: true },
        { id: 'co-stone', enabled: true, labelEn: 'Countertop', labelAr: 'سطح العمل', type: 'text', required: false },
        { id: 'co-notes', enabled: true, labelEn: 'Notes', labelAr: 'ملاحظات', type: 'text', required: false },
      ],
    },
    /** Empty events — never invent HONOR/Mixkit rows (DF-01 / CW-05). */
    eventsMasterclasses: emptyEventsMasterclasses(false),
    /** Empty features section — never seed-decorate (CW-06 / DF-01). */
    featuresSection: emptyFeaturesSection(false),
    /** Empty model comparison — never invent models (CW-07 / DF-01). */
    modelComparison: emptyModelComparison(false),
    /** Reviews chrome empty — rows come from reviews API only (CW-08). */
    customerReviews: emptyCustomerReviews(false),
    /** FAQ empty — never invent Q/A rows (CW-09 / DF-01). */
    faq: emptyFaq(false),
    /** Commercial Hero empty — never invent flagship slides (CW-10 / DF-01). */
    commercialHero: emptyCommercialHero(false),
    /** Product Slider empty — never invent rails (CW-11 / DF-01). */
    productSlider: emptyProductSlider(false),
    /** Product Collection empty — never invent promo/products/benefits (CW-13 / DF-01). */
    productCollection: emptyProductCollection(false),
    /** Shop catalog chrome — no fake product rows (CW-12 / DF-01). */
    shop: emptyShopCatalog(),
    /** PDP chrome — shared template; scope all vs selected (no 40 page drafts). */
    productDetail: emptyProductDetailPage(true),
  };
}

const LIST_FIELD: Partial<Record<CoffeeModularKey, string>> = {
  featuredCategoriesProducts: 'sections',
  heroBanners: 'banners',
  featuredSectionBanners: 'banners',
  imageBanners: 'items',
  exclusiveBenefits: 'items',
  eventsMasterclasses: 'events',
  featuresSection: 'items',
  modelComparison: 'models',
  productCarousel: 'items',
  faq: 'items',
  commercialHero: 'slides',
  productSlider: 'items',
  productCollection: 'items',
  productDetail: 'productIds',
};

/**
 * True when a section object already exists in saved settings.
 * Empty arrays count as intentional merchant-empty (do NOT reseed).
 * Only missing / non-object values need seed.
 */
export function modularHasContent(section: unknown, key: string): boolean {
  if (section == null || typeof section !== 'object') return false;
  const row = section as Record<string, unknown>;
  const listField = LIST_FIELD[key as CoffeeModularKey];
  if (listField) {
    return Array.isArray(row[listField]);
  }
  if ('enabled' in row) return true;
  const title = String(row.titleEn || row.aboutEn || row.ctaEn || '').trim();
  const titleAr = String(row.titleAr || row.aboutAr || row.ctaAr || '').trim();
  const nested = row.tabs || row.columns || row.fields;
  if (Array.isArray(nested)) return true;
  return Boolean(title || titleAr);
}

export function mergeModularSection<T extends Record<string, any>>(
  defaults: T,
  parsed: Partial<T> | undefined,
  listKey?: string,
): T {
  if (!parsed) return defaults;
  const next: Record<string, any> = { ...defaults, ...parsed };
  if (listKey) {
    const incoming = (parsed as Record<string, unknown>)[listKey];
    next[listKey] = Array.isArray(incoming) ? incoming : (defaults as Record<string, any>)[listKey];
  }
  return next as T;
}

export function applyMissingModularSeeds<T extends Record<string, any>>(settings: T): T {
  const seeds = coffeeModularSeed();
  const next: Record<string, any> = { ...settings };
  for (const key of COFFEE_MODULAR_KEYS) {
    if (!modularHasContent(next[key], key)) {
      next[key] = seeds[key];
    }
  }
  return next as T;
}

/** Card switches default on so the locked card stays until the merchant turns one off. */
export function productCardFlags(settings?: Partial<CoffeeFeaturedProductsSettings> | null) {
  return {
    showImage: settings?.showImage !== false,
    showTitle: settings?.showTitle !== false,
    showPrice: settings?.showPrice !== false,
    showBadge: settings?.showBadge !== false,
    showRating: settings?.showRating !== false,
    showStock: settings?.showStock !== false,
    showAddToCart: settings?.showAddToCart !== false,
  };
}

/** Locale-pure label: AR never falls back to EN (and vice versa). Use `fallback` only for same-locale defaults. */
export function bi(lang: 'AR' | 'EN' | 'ar' | 'en' | string | undefined, en?: string, ar?: string, fallback = ''): string {
  const arMode = lang === 'AR' || lang === 'ar';
  const primary = arMode ? ar : en;
  return (primary || fallback).trim();
}

/** Digits-only WhatsApp / phone for wa.me — empty when merchant has not set a number (no fake fallback). */
export function coffeeWhatsAppDigits(raw?: string | null): string {
  return normalizeWhatsAppDigits(raw);
}
