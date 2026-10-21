/**
 * Central Theme Settings Store — All 18 Design Pages (LOCKED)
 * Source of Truth: designs/Theme_Settings_UIUX/
 * Full reactivity, per-store isolation, soft cache invalidation.
 */

import { defaultStoreIdentity, readStoreIdentity, writeStoreIdentity, type StoreIdentitySettings } from './storeIdentity';
import { type HeaderCustomSettings, DEFAULT_HEADER_SETTINGS, getDefaultHeaderSettings } from './headerCustomSettings';
import { getThemeManifest } from '../registry';
import { bumpStore } from '../../api/cacheTags';

export interface CustomMenuItem {
  id: string;
  labelEn: string;
  labelAr: string;
  url: string;
  type: 'link' | 'page';
  bodyEn?: string;
  bodyAr?: string;
  isExternal?: boolean;
  active: boolean;
  isMegaMenu?: boolean;
  subItems?: Array<{ id: string; labelEn: string; labelAr: string; url: string }>;
}

export interface GeneralOptionsSettings {
  arabicNumerals: boolean;
  contentProtection: boolean;
  breadcrumbNav: boolean;
  equalProductHeights: boolean;
  homepageAnimations: boolean;
  alternativeLogoUrl: string;
  sectionTitleDesign: 'classic' | 'modern';
  headerLayout: 'standard' | 'centered' | 'minimal' | 'split';
  footerLayout: 'standard' | 'columns' | 'saudi-minimal';
  categoryLayoutWidth?: 'container' | 'fullwidth';
  mobileDisplayMode?: '2-columns' | '1-column';
  autoSeasonThemeColors?: boolean;
  customNavigationMenu?: CustomMenuItem[];
  mobileMenuIcon?: string;
  fontFamily?: string;
  customFontUrl?: string;
}

export function getSeasonalThemeColors(homepageStyle: string) {
  if (homepageStyle.includes('Valentine')) {
    return {
      accent: '#e11d48',
      headerBg: 'linear-gradient(to right, #4c0519, #881337, #4c0519)',
      footerBg: '#1c040b',
      textOnHeader: '#ffffff',
      tag: 'Valentine Crimson',
    };
  }
  if (homepageStyle.includes('Ramadan')) {
    return {
      accent: '#d97706',
      headerBg: 'linear-gradient(to right, #0f172a, #1e1b4b, #0f172a)',
      footerBg: '#0b1120',
      textOnHeader: '#ffffff',
      tag: 'Ramadan Amber & Indigo',
    };
  }
  if (homepageStyle.includes('Eid')) {
    return {
      accent: '#047857',
      headerBg: 'linear-gradient(to right, #022c22, #064e3b, #022c22)',
      footerBg: '#022019',
      textOnHeader: '#ffffff',
      tag: 'Eid Royal Emerald',
    };
  }
  return {
    accent: '#059669',
    headerBg: 'linear-gradient(to right, #032320, #063b35, #032320)',
    footerBg: '#021816',
    textOnHeader: '#ffffff',
    tag: 'Classic Emerald',
  };
}

export interface StoreColorsSettings {
  enableDarkModeSwitch: boolean;
  forceDarkMode: boolean;
  primaryBgColor: string;
  secondaryBgColor: string;
  mainTextColor: string;
  secondaryTextColor: string;
  headerBgColor: string;
  headerTextColor: string;
  productCardBgColor: string;
  promoLabelBgColor: string;
  enableLoadingScreen: boolean;
  enableDashboardLoader: boolean;
  loadingAnimatedLogo: boolean;
  loadingIndicator: boolean;
  loadingCustomBg: boolean;
  loadingBgImage: string;
  loadingLogoUrl: string;
  loadingTitle: string;
  loadingSubtitle: string;
  enablePatternBg: boolean;
  patternStyle: string;
  enableBackToTop: boolean;
  enableWhatsAppBtn: boolean;
  enablePhoneBtn: boolean;
}

export interface CategoryCartCustomerSettings {
  autoLoadProducts: boolean;
  categoryBannerUrl: string;
  subcategories: boolean;
  breadcrumbs: boolean;
  enhancedCart: boolean;
  recommendedProducts: boolean;
  recommendedDisplayStyle: 'grid' | 'slider';
  customerBgImage: string;
  loginPageStyle: 'image' | 'solid' | 'minimal';
  registerPageStyle: 'image' | 'solid' | 'minimal';
  accountPageStyle: 'image' | 'solid' | 'minimal';
  showWhatsAppInCustomer: boolean;
  showPhoneInCustomer: boolean;
}

export interface SlideSpecItem {
  icon: 'gauge' | 'flame' | 'coffee' | 'zap' | 'ruler';
  labelEn: string;
  labelAr: string;
  valueEn: string;
  valueAr: string;
}

export interface SliderSlide {
  id: string;
  productId?: string;
  type: 'image' | 'video';
  image: string;
  fallbackImage?: string;
  videoUrl?: string;
  title: string;
  titleAr?: string;
  titleEn?: string;
  subtitle: string;
  subtitleAr?: string;
  subtitleEn?: string;
  buttonText: string;
  buttonTextAr?: string;
  buttonTextEn?: string;
  buttonUrl: string;
  buttonLink?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  buttonIcon?: string;
  buttonStyle?: 'filled' | 'outlined' | 'gradient' | 'glass';
  buttonBorderRadius?: number;
  badge: string;
  badgeAr?: string;
  badgeEn?: string;
  overlayGradient?: string;
  bgColor?: string;
  // Specifications Box (Matching user screenshot: Size WxHxL + Pressure + Boiler + Grouphead)
  dimensionsEn?: string;
  dimensionsAr?: string;
  priceEn?: string;
  priceAr?: string;
  specs?: SlideSpecItem[];
  spec1Icon?: 'gauge' | 'flame' | 'coffee' | 'zap' | 'ruler';
  spec1LabelEn?: string;
  spec1LabelAr?: string;
  spec1ValueEn?: string;
  spec1ValueAr?: string;
  spec2Icon?: 'gauge' | 'flame' | 'coffee' | 'zap' | 'ruler';
  spec2LabelEn?: string;
  spec2LabelAr?: string;
  spec2ValueEn?: string;
  spec2ValueAr?: string;
  spec3Icon?: 'gauge' | 'flame' | 'coffee' | 'zap' | 'ruler';
  spec3LabelEn?: string;
  spec3LabelAr?: string;
  spec3ValueEn?: string;
  spec3ValueAr?: string;
}

export interface AdvancedSliderSettings {
  slides: SliderSlide[];
  transitionEffect: 'fade' | 'slide' | 'zoom';
  transitionDuration: number;
  animationSpeed: number;
  autoPlay: boolean;
  buttonBgColor: string;
  buttonTextColor: string;
  buttonStyle: 'filled' | 'outlined';
  buttonBorderRadius: number;
  showOnDesktop: boolean;
  showOnMobile: boolean;
  customCss: string;
  heroWidgetType?: 'slider' | 'flower-scroll-hero' | '3d-interactive';
}

export interface VideoProductItem {
  id: string;
  name: string;
  price: number;
  videoUrl: string;
  poster: string;
  badge?: string;
}

export interface ProductVideosSettings {
  enabled: boolean;
  elementTitle: string;
  subtitle: string;
  displayType: 'list' | 'slider';
  videoProducts: VideoProductItem[];
  promotionalVideoBadge: boolean;
  promoBadgeText: string;
  autoPlayVideo: boolean;
  videoAspectRatio: '9:16' | '1:1' | '16:9';
  badgePosition: 'top-left' | 'top-right';
  showViewAll: boolean;
}

export interface ProductTabsSettings {
  enabled: boolean;
  mainTitle: string;
  subtitle: string;
  tabsStyle: 'buttons' | 'switch' | 'underline';
  activeTab: string;
  tabs: string[];
  displayType: 'list' | 'slider';
  numberOfProducts: number;
  columnsCount?: number;
  collectionFilter?: string;
  displayViewAll: boolean;
}

export interface DetailedProductsSettings {
  enabled: boolean;
  elementTitle: string;
  subtitle: string;
  addTopSpacing?: boolean;
  selectedProductId: string;
  productVideoUrl?: string;
  showSalesCount: boolean;
  salesCount?: string | number;
  useCustomRating: boolean;
  ratingValue: number;
  numberOfReviews: number;
  imageDimensions: 'square' | 'portrait' | 'landscape';
  imageDisplayMode?: 'cover' | 'full';
  cardBorderColor?: string;
  movingBannerText: string;
  bannerDividerIcon: string;
  bannerBgColor: string;
  bannerTextColor: string;
  displayProductOptions?: boolean;
  displayTwoLinesDesc?: boolean;
  displayBuyNowButton?: boolean;
  enableCarMatsCustomizer?: boolean;
  enableTrunkMatOption?: boolean;
  enableHybridFuelOption?: boolean;
  enableDriverHeelPadOption?: boolean;
  enableRemovableCarpetOption?: boolean;
  customCssClass?: string;
  browserDisplay?: 'all' | 'desktop' | 'mobile';
}

export interface ImageGridItem {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  link: string;
  span?: string;
}

export interface ImageGridSettings {
  enabled: boolean;
  layoutStyle: 'bento' | 'classic' | 'masonry' | 'magazine' | 'fullwidth' | 'collage' | 'carousel';
  shape: 'square' | 'rectangle' | 'portrait' | 'circle' | 'rounded' | 'hexagon';
  hoverEffect: 'none' | 'zoom' | 'fade' | 'slide-up' | 'grayscale';
  desktopColumns: number;
  mobileColumns: number;
  items: ImageGridItem[];
}

export interface CustomLinkItem {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  category: string;
  link: string;
  linkType?: 'Product' | 'Category' | 'Brand' | 'Landing Page' | 'Article' | 'Blog Category' | 'Discounts' | 'Brands' | 'Blog' | 'External Link';
  targetId?: string;
  externalUrl?: string;
  showButton?: boolean;
  buttonText?: string;
  buttonColor?: string;
  buttonStyle?: 'filled' | 'outline' | 'glass';
}

export interface CustomLinksSettings {
  enabled: boolean;
  title: string;
  subtitle: string;
  makeFullWidth?: boolean;
  displayAsSlider?: boolean;
  layoutStyle: 'grid' | 'slider' | 'bento' | 'carousel' | 'masonry' | 'custom';
  aspectRatio: 'wide' | 'standard' | 'square' | 'portrait' | 'custom';
  hoverEffect: 'none' | 'zoom' | 'fade' | 'slide-up' | 'blur' | 'grayscale' | 'lift';
  desktopColumns: number;
  mobileColumns: number;
  imageDisplayMode?: 'cover' | 'full' | 'original';
  roundedCorners?: 'none' | 'small' | 'medium' | 'large' | 'full';
  enableOverlay?: boolean;
  overlayStyle?: 'dark' | 'gradient' | 'blur' | 'custom';
  textPosition?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showButtonOnBanner?: boolean;
  buttonText?: string;
  buttonColor?: string;
  buttonStyle?: 'filled' | 'outline' | 'glass';
  enableAutoSlider?: boolean;
  sliderSpeed?: number;
  showNavArrows?: boolean;
  showPaginationDots?: boolean;
  customCssClass?: string;
  browserDisplay?: 'all' | 'desktop' | 'mobile';
  links: CustomLinkItem[];
}

export interface BannerItem {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  discountBadge: string;
  buttonText: string;
  link: string;
}

export interface BannersSettings {
  enabled: boolean;
  topSpacing: boolean;
  fullWidth: boolean;
  roundedCorners: 'small' | 'medium' | 'large';
  bannerHeight: 'auto' | 'compact' | 'tall';
  equalHeight: boolean;
  showNavigationArrows: boolean;
  arrowStyle: 'circle' | 'square' | 'minimal';
  showPaginationDots: boolean;
  autoPlay: boolean;
  slideDuration: number;
  transitionEffect: 'slide' | 'fade' | 'zoom';
  textPosition: 'left' | 'center' | 'right';
  overlayOpacity: number;
  desktopVersion: boolean;
  mobileVersion: boolean;
  banners: BannerItem[];
}

export interface BlogArticleItem {
  id: string;
  image: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
}

export interface BlogSettings {
  enabled: boolean;
  title: string;
  subtitle: string;
  showViewAll: boolean;
  buttonText: string;
  articleSource: 'latest' | 'featured';
  numberOfArticles: number;
  displayStyle: 'featured-cards' | 'grid' | 'carousel';
  articles: BlogArticleItem[];
}

export interface AnnouncementMessage {
  id: string;
  icon: string;
  text: string;
  link?: string;
  active: boolean;
}

export interface AnnouncementBarSettings {
  enabled: boolean;
  messages: AnnouncementMessage[];
  animationType: 'marquee' | 'rotate' | 'fade';
  direction: 'rtl' | 'ltr';
  animationSpeed: 'slow' | 'medium' | 'fast';
  pauseOnHover: boolean;
  enableCountdown: boolean;
  countdownEndDate: string;
  countdownStyle: 'boxes' | 'minimal' | 'badge';
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
  showButton: boolean;
  buttonText: string;
  buttonLink: string;
  stickyOnScroll: boolean;
  showCloseButton: boolean;
  bgType: 'solid' | 'gradient' | 'glass';
  bgColor: string;
  textColor: string;
  iconColor: string;
  desktopVersion: boolean;
  mobileVersion: boolean;
}

export interface EnhancedFeatureItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  linkText?: string;
  linkUrl?: string;
}

export interface EnhancedFeaturesSettings {
  enabled: boolean;
  mainTitle: string;
  subtitle: string;
  layoutStyle: 'classic-cards' | 'minimal' | 'floating' | 'glass' | 'timeline';
  itemsPerRowDesktop: number;
  itemsPerRowMobile: number;
  features: EnhancedFeatureItem[];
  cardBackground: 'white' | 'glass' | 'dark';
  cardBorder: 'none' | 'soft' | 'solid';
  borderRadius: number;
  shadow: boolean;
  iconAnimation: 'floating' | 'pulse' | 'zoom' | 'none';
  hoverEffect: 'zoom' | 'lift' | 'glow';
}

export interface ProductCardsSettings {
  imageHeight: number;
  productsPerRow: number;
  equalHeight: boolean;
  roundedCards: boolean;
  addBorder: boolean;
  borderColor: string;
  changeImageOnHover: boolean;
  imageAnimation: 'zoom' | 'fade' | 'slide';
  zoomEffect: 'light' | 'deep';
  showProductButtons: boolean;
  buttonPosition: 'on-image-hover' | 'card-bottom';
  usePrimaryColorForIcons: boolean;
  showProductOptions: boolean;
  showNotifyMe: boolean;
  showDiscountPercentage: boolean;
  showProductRating: boolean;
  cardDesignPreset?: 'royal-luxury' | 'classic' | 'minimal';
  showFeatureBadges?: boolean;
  showWhatsAppButton?: boolean;
}

export interface CustomProductsSettings {
  enabled: boolean;
  addTopSpacing: boolean;
  mainTitle: string;
  subtitle: string;
  displayType: 'list' | 'slider';
  productType: 'latest' | 'featured' | 'discounts';
  numberOfProducts: number;
  columnsCount?: number;
  collectionFilter?: string;
  displayViewAll: boolean;
}

export interface SpecialOfferCountdownSettings {
  enabled: boolean;
  badgeText: string;
  title: string;
  description: string;
  bgImage: string;
  bgColor: string;
  contentColor: string;
  countdownEndDate: string;
  countdownStyle: 'modern-cards' | 'boxes' | 'compact';
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
  buttonText: string;
  buttonLink: string;
  buttonStyle: 'filled' | 'outlined';
  showProductImage: boolean;
  productImage: string;
  showTrustMessages: boolean;
  trustMessages: Array<{ id: string; icon: string; text: string }>;
}

export interface StoreStatisticItem {
  id: string;
  icon: string;
  number: string;
  label: string;
  description: string;
}

export interface StoreStatisticsSettings {
  enabled: boolean;
  mainTitle: string;
  subtitle: string;
  layoutStyle: 'classic' | 'card' | 'glass' | 'floating' | 'stats-bar';
  itemsPerRowDesktop: number;
  itemsPerRowMobile: number;
  items: StoreStatisticItem[];
  iconNumberColor: string;
  animationEffect: 'counter' | 'fade' | 'pulse';
  animationTrigger: 'on-scroll' | 'instant';
  hoverEffect: 'zoom' | 'glow' | 'none';
}

export interface MaintenanceModeSettings {
  enabled: boolean;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  launchDate: string;
  showCountdown: boolean;
  showWhatsapp: boolean;
  showEmailSubscribe: boolean;
  whatsappNumber: string;
}

export interface CustomOrderSettings {
  enabled: boolean;
  whatsappNumber: string;
  whatsappMessageAr: string;
  whatsappMessageEn: string;
  buttonLabelAr?: string;
  buttonLabelEn?: string;
}

export interface AllThemeSettings {
  identity: StoreIdentitySettings;
  general: GeneralOptionsSettings;
  colors: StoreColorsSettings;
  categoryCartCustomer: CategoryCartCustomerSettings;
  slider: AdvancedSliderSettings;
  videos: ProductVideosSettings;
  tabs: ProductTabsSettings;
  detailedProducts: DetailedProductsSettings;
  imageGrid: ImageGridSettings;
  customLinks: CustomLinksSettings;
  banners: BannersSettings;
  blog: BlogSettings;
  announcementBar: AnnouncementBarSettings;
  enhancedFeatures: EnhancedFeaturesSettings;
  productCards: ProductCardsSettings;
  customProducts: CustomProductsSettings;
  specialOffer: SpecialOfferCountdownSettings;
  statistics: StoreStatisticsSettings;
  customHeader?: HeaderCustomSettings;
  maintenance?: MaintenanceModeSettings;
  customOrder?: CustomOrderSettings;
  updatedAt: string;
}

function buildRawDefaultThemeSettings(fallback: {
  name: string;
  ownerEmail?: string;
  logo?: string;
  accentColor?: string;
  id?: string;
}): AllThemeSettings {
  const storeId = (fallback as any)?.id || '';
  const storeName = (fallback as any)?.name || '';
  const isCoffee =
    storeId === 'store-coffee' ||
    storeId.includes('coffee') ||
    storeName.toLowerCase().includes('coffee') ||
    storeName.includes('قهوة') ||
    storeName.includes('HiBrew') ||
    (fallback as any)?.category?.includes('قهوة');

  const isCar =
    storeId === 'store-bleco' ||
    storeId.includes('car') ||
    storeId.includes('bleco') ||
    storeName.toLowerCase().includes('bleco') ||
    storeName.includes('سيارات');

  // Dynamic Store-Aware Slider Defaults
  const defaultSlides: SliderSlide[] = isCoffee
    ? [
        {
          id: 'slide-coffee-1',
          productId: 'hb-h10a-dualboiler',
          type: 'image',
          image: '/hero_coffee_banner_white_1.jpg',
          title: 'HiBrew Barista Pro™ H7A Dual-Boiler',
          titleAr: 'هايبرو بارستا برو H7A دبل بويلر 20 بار',
          titleEn: 'HiBrew Barista Pro™ H7A Dual-Boiler',
          subtitle: 'Dual independent PID thermoblock with commercial 58mm group and 20-bar Italian ULKA pump.',
          subtitleAr: 'دبل بويلر مستقل ونظام تحكم حراري PID مع مقبس تجاري 58 ملم ومضخة إيطالية 20 بار.',
          subtitleEn: 'Dual independent PID thermoblock with commercial 58mm group and 20-bar Italian ULKA pump.',
          buttonText: 'Shop Barista Pro →',
          buttonTextAr: 'تسوّق الآن →',
          buttonTextEn: 'Shop Barista Pro →',
          buttonUrl: '#products',
          buttonBgColor: '#c88a58',
          buttonTextColor: '#FFFFFF',
          buttonIcon: 'ShoppingBag',
          buttonStyle: 'filled',
          buttonBorderRadius: 12,
          badge: 'AI✦ Flagship Choice',
          badgeAr: 'خيار الفلاجشيب AI✦',
          badgeEn: 'AI✦ Flagship Choice',
          dimensionsEn: 'W: 34cm · H: 31cm · L: 42cm',
          dimensionsAr: 'عرض: 34سم · ارتفاع: 31سم · طول: 42سم',
          priceEn: 'SAR 1,899.00',
          priceAr: '1,899.00 ر.س',
          spec1Icon: 'gauge',
          spec1LabelEn: 'Pressure',
          spec1LabelAr: 'الضغط',
          spec1ValueEn: '20-Bar ULKA',
          spec1ValueAr: 'مضخة ٢٠ بار',
          spec2Icon: 'flame',
          spec2LabelEn: 'Boiler',
          spec2LabelAr: 'التسخين',
          spec2ValueEn: 'Dual PID System',
          spec2ValueAr: 'دبل بويلر PID',
          spec3Icon: 'coffee',
          spec3LabelEn: 'Grouphead',
          spec3LabelAr: 'المقبس',
          spec3ValueEn: '58mm Brass',
          spec3ValueAr: '٥٨ مم نحاسي',
        },
        {
          id: 'slide-coffee-2',
          productId: 'hb-barista-silver-pro',
          type: 'image',
          image: '/hero_coffee_banner_white_2.jpg',
          title: 'HiBrew Titanium Burr Grinder G5',
          titleAr: 'مطحنة القهوة المخروطية G5 بتروس تيتانيوم',
          titleEn: 'HiBrew Titanium Burr Grinder G5',
          subtitle: '40mm Titanium CNC burrs, stepless micron dial with zero-retention blowing hopper.',
          subtitleAr: 'تروس تيتانيوم CNC 40 مم مع ضبط ميكروني فائق الدقة ومنفاخ تفريغ البن بالكامل.',
          subtitleEn: '40mm Titanium CNC burrs, stepless micron dial with zero-retention blowing hopper.',
          buttonText: 'Explore Grinders',
          buttonTextAr: 'اكتشف المطاحن',
          buttonTextEn: 'Explore Grinders',
          buttonUrl: '#products',
          buttonBgColor: '#21140e',
          buttonTextColor: '#FFFFFF',
          buttonIcon: 'Zap',
          buttonStyle: 'filled',
          buttonBorderRadius: 12,
          badge: 'Titanium Burrs',
          badgeAr: 'تروس تيتانيوم',
          badgeEn: 'Titanium Burrs',
          dimensionsEn: 'W: 32cm · H: 30cm · L: 38cm',
          dimensionsAr: 'عرض: 32سم · ارتفاع: 30سم · طول: 38سم',
          priceEn: 'SAR 1,499.00',
          priceAr: '1,499.00 ر.س',
          spec1Icon: 'gauge',
          spec1LabelEn: 'Pressure',
          spec1LabelAr: 'الضغط',
          spec1ValueEn: '20-Bar Pump',
          spec1ValueAr: 'مضخة ٢٠ بار',
          spec2Icon: 'zap',
          spec2LabelEn: 'Warmup',
          spec2LabelAr: 'التسخين',
          spec2ValueEn: '30s Fast Heating',
          spec2ValueAr: 'تسخين ٣٠ ثانية',
          spec3Icon: 'coffee',
          spec3LabelEn: 'Steam Wand',
          spec3LabelAr: 'التبخير',
          spec3ValueEn: 'Microfoam Steam',
          spec3ValueAr: 'تبخير ميكروفوم',
        },
        {
          id: 'slide-coffee-3',
          productId: 'hb-classic-duo-espresso',
          type: 'image',
          image: '/hero_coffee_banner_white_3.jpg',
          title: 'HiBrew Luxury Oak Coffee Station',
          titleAr: 'ركن ودولاب القهوة الملكي من خشب البلوط',
          titleEn: 'HiBrew Luxury Oak Coffee Station',
          subtitle: 'Natural fluted American oak with heat-proof sintered stone and internal power track.',
          subtitleAr: 'خشب بلوط أمريكي طبيعي مع سطح حجر مقاوم للحرارة ومسار كهربائي مخفي للباريستا.',
          subtitleEn: 'Natural fluted American oak with heat-proof sintered stone and internal power track.',
          buttonText: 'Custom Made to Order',
          buttonTextAr: 'تفصيل حسب الطلب',
          buttonTextEn: 'Custom Made to Order',
          buttonUrl: 'https://wa.me/966549876543',
          buttonBgColor: '#78350f',
          buttonTextColor: '#FFFFFF',
          buttonIcon: 'Sparkles',
          buttonStyle: 'filled',
          buttonBorderRadius: 12,
          badge: 'Handcrafted',
          badgeAr: 'تفصيل فاخر',
          badgeEn: 'Handcrafted',
          dimensionsEn: 'W: 140cm · H: 92cm · D: 60cm',
          dimensionsAr: 'عرض: 140سم · ارتفاع: 92سم · عمق: 60سم',
          priceEn: 'SAR 2,450.00',
          priceAr: '2,450.00 ر.س',
          spec1Icon: 'ruler',
          spec1LabelEn: 'Structure',
          spec1LabelAr: 'الهيكل',
          spec1ValueEn: 'Natural Solid Oak',
          spec1ValueAr: 'خشب بلوط طبيعي',
          spec2Icon: 'flame',
          spec2LabelEn: 'Surface',
          spec2LabelAr: 'السطح',
          spec2ValueEn: 'Sintered Stone',
          spec2ValueAr: 'حجر إيطالي فاخر',
          spec3Icon: 'zap',
          spec3LabelEn: 'Power',
          spec3LabelAr: 'الكهرباء',
          spec3ValueEn: 'Concealed Rail',
          spec3ValueAr: 'مسار كهرباء مخفي',
        },
      ]
    : isCar
    ? [
        {
          id: 'slide-car-1',
          type: 'image',
          image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1920&q=80',
          title: 'Royal 7D Diamond Leather Car Mats',
          titleAr: 'دعاسات وأرضيات السيارات الملكية 7D بالجلد الماسي',
          titleEn: 'Royal 7D Diamond Leather Car Mats',
          subtitle: 'Laser-scanned precision fit for all luxury vehicle makes with waterproof multi-layer armor.',
          subtitleAr: 'تفصيل ليزري مخصص بدقة ثلاثية الأبعاد لجميع أنواع السيارات مع حماية عازلة للماء.',
          subtitleEn: 'Laser-scanned precision fit for all luxury vehicle makes with waterproof multi-layer armor.',
          buttonText: 'Configure Mats →',
          buttonTextAr: 'فصّل أرضيتك الآن →',
          buttonTextEn: 'Configure Mats →',
          buttonUrl: '#products',
          buttonBgColor: '#d97706',
          buttonTextColor: '#FFFFFF',
          buttonIcon: 'ShoppingBag',
          buttonStyle: 'filled',
          buttonBorderRadius: 12,
          badge: 'VIP 7D Armor',
          badgeAr: 'حماية VIP 7D',
          badgeEn: 'VIP 7D Armor',
        },
        {
          id: 'slide-car-2',
          type: 'image',
          image: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1920&q=80',
          title: 'Custom Diamond Cabin Upholstery',
          titleAr: 'تنجيد مراتب السيارات الفاخر بالجلد الطبيعي',
          titleEn: 'Custom Diamond Cabin Upholstery',
          subtitle: 'Artisan hand-stitched German thread diamond upholstery with 5-year anti-sag guarantee.',
          subtitleAr: 'تنجيد مقاعد يدوي فاخر بخيوط ألمانية أصلية وضمان 5 سنوات ضد الهبوط والتآكل.',
          subtitleEn: 'Artisan hand-stitched German thread diamond upholstery with 5-year anti-sag guarantee.',
          buttonText: 'Order Custom Seats',
          buttonTextAr: 'طلب تنجيد مخصص',
          buttonTextEn: 'Order Custom Seats',
          buttonUrl: '#products',
          buttonBgColor: '#0f172a',
          buttonTextColor: '#FFFFFF',
          buttonIcon: 'Sparkles',
          buttonStyle: 'filled',
          buttonBorderRadius: 12,
          badge: '5-Year Guarantee',
          badgeAr: 'ضمان 5 سنوات',
          badgeEn: '5-Year Guarantee',
        },
      ]
    : [
        {
          id: 'slide-flowers-1',
          type: 'image',
          image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
          title: 'Discover Luxury Floral Bouquets',
          titleAr: 'أفخم باقات الورد الطبيعي والهدايا الملكية',
          titleEn: 'Discover Luxury Floral Bouquets',
          subtitle: 'Daily fresh imports from Holland and Ecuador crafted for your sacred moments in Makkah.',
          subtitleAr: 'ورود طبيعية مستوردة يومياً من هولندا والإكوادور صُنعت بشغف لأروع المناسبات.',
          subtitleEn: 'Daily fresh imports from Holland and Ecuador crafted for your sacred moments in Makkah.',
          buttonText: 'Shop Bouquets →',
          buttonTextAr: 'تسوّق الباقات →',
          buttonTextEn: 'Shop Bouquets →',
          buttonUrl: '#store-products-grid',
          buttonBgColor: '#059669',
          buttonTextColor: '#FFFFFF',
          buttonIcon: 'ShoppingBag',
          buttonStyle: 'filled',
          buttonBorderRadius: 12,
          badge: 'Fresh Daily Import',
          badgeAr: 'استيراد يومي طازج',
          badgeEn: 'Fresh Daily Import',
        },
        {
          id: 'slide-flowers-2',
          type: 'image',
          image: 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1920&q=80',
          title: 'Royal Lily & Orchid Elegance',
          titleAr: 'تشكيلة الليليوم والأوركيد الملكية الفاخرة',
          titleEn: 'Royal Lily & Orchid Elegance',
          subtitle: 'Daily fresh imports delivered chilled to your doorstep within 60 minutes across Makkah.',
          subtitleAr: 'توصيل مبرد وسريع خلال 60 دقيقة لكافة أحياء مكة المكرمة والمشاعر.',
          subtitleEn: 'Daily fresh imports delivered chilled to your doorstep within 60 minutes across Makkah.',
          buttonText: 'Explore Collection',
          buttonTextAr: 'تصفح التشكيلة',
          buttonTextEn: 'Explore Collection',
          buttonUrl: '#store-products-grid',
          buttonBgColor: '#047857',
          buttonTextColor: '#FFFFFF',
          buttonIcon: 'Sparkles',
          buttonStyle: 'filled',
          buttonBorderRadius: 12,
          badge: 'Bestseller',
          badgeAr: 'الأكثر مبيعاً',
          badgeEn: 'Bestseller',
        },
      ];

  return {
    identity: defaultStoreIdentity(fallback),
    general: {
      arabicNumerals: true,
      contentProtection: false,
      breadcrumbNav: true,
      equalProductHeights: true,
      homepageAnimations: true,
      alternativeLogoUrl: fallback.logo || '',
      sectionTitleDesign: 'modern',
      headerLayout: 'standard',
      footerLayout: 'standard',
      categoryLayoutWidth: 'container',
      mobileDisplayMode: '2-columns',
      autoSeasonThemeColors: true,
      customNavigationMenu: isCoffee
        ? [
            { id: 'menu-1', labelEn: 'Shop Gear', labelAr: 'المتجر والمعدات', url: 'products', type: 'page', active: true },
            { id: 'menu-2', labelEn: 'Machines', labelAr: 'مكائن القهوة', url: 'products', type: 'page', active: true },
            { id: 'menu-3', labelEn: 'Mills', labelAr: 'مطاحن البن', url: 'products', type: 'page', active: true },
            { id: 'menu-5', labelEn: 'Reviews', labelAr: 'آراء العملاء', url: 'reviews', type: 'page', active: true },
          ]
        : isCar
        ? [
            { id: 'menu-1', labelEn: 'Custom Mats', labelAr: 'دعاسات السيارات 7D', url: 'catalog', type: 'page', active: true },
            { id: 'menu-2', labelEn: 'Upholstery', labelAr: 'تنجيد المراتب', url: 'catalog', type: 'page', active: true },
            { id: 'menu-3', labelEn: 'Accessories', labelAr: 'إكسسوارات المقصورة', url: 'catalog', type: 'page', active: true },
            { id: 'menu-4', labelEn: 'Calculator', labelAr: 'حاسبة الأسعار', url: 'catalog', type: 'page', active: true },
          ]
        : [
            { id: 'menu-1', labelEn: 'Home', labelAr: 'الرئيسية', url: 'home', type: 'page', active: true },
            { id: 'menu-2', labelEn: 'Shop', labelAr: 'المتجر', url: 'shop', type: 'page', active: true },
            { id: 'menu-3', labelEn: 'Track Order', labelAr: 'تتبع الطلب', url: 'track-order', type: 'page', active: true },
            { id: 'menu-4', labelEn: 'Blog', labelAr: 'المدونة', url: 'blog', type: 'page', active: true },
            { id: 'menu-5', labelEn: 'About Us', labelAr: 'من نحن', url: 'about', type: 'page', active: true },
            { id: 'menu-6', labelEn: 'Contact', labelAr: 'تواصل معنا', url: 'contact', type: 'page', active: true },
          ],
    },
    colors: {
      enableDarkModeSwitch: true,
      forceDarkMode: false,
      primaryBgColor: '#FFFFFF',
      secondaryBgColor: isCoffee ? '#1a110c' : isCar ? '#0f172a' : '#F8FAFC',
      mainTextColor: isCoffee ? '#f7ede2' : '#111827',
      secondaryTextColor: isCoffee ? '#c88a58' : '#6B7280',
      headerBgColor: isCoffee ? '#160e0a' : isCar ? '#020617' : '#032320',
      headerTextColor: '#FFFFFF',
      productCardBgColor: '#FFFFFF',
      promoLabelBgColor: isCoffee ? '#c88a58' : isCar ? '#d97706' : '#EF4444',
      enableLoadingScreen: false,
      enableDashboardLoader: true,
      loadingAnimatedLogo: true,
      loadingIndicator: true,
      loadingCustomBg: false,
      loadingBgImage: '',
      loadingLogoUrl: '',
      loadingTitle: '',
      loadingSubtitle: '',
      enablePatternBg: false,
      patternStyle: 'subtle-dots',
      enableBackToTop: true,
      enableWhatsAppBtn: true,
      enablePhoneBtn: false,
    },
    categoryCartCustomer: {
      autoLoadProducts: true,
      categoryBannerUrl: isCoffee
        ? '/hero_coffee_banner_white_2.jpg'
        : 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1920&q=80',
      subcategories: true,
      breadcrumbs: true,
      enhancedCart: true,
      recommendedProducts: true,
      recommendedDisplayStyle: 'grid',
      customerBgImage: isCoffee
        ? '/hero_coffee_banner_white_3.jpg'
        : 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1920&q=80',
      loginPageStyle: 'image',
      registerPageStyle: 'image',
      accountPageStyle: 'solid',
      showWhatsAppInCustomer: true,
      showPhoneInCustomer: false,
    },
    slider: {
      slides: defaultSlides,
      transitionEffect: 'fade',
      transitionDuration: 5,
      animationSpeed: 2,
      autoPlay: true,
      buttonBgColor: isCoffee ? '#c88a58' : isCar ? '#d97706' : '#059669',
      buttonTextColor: '#FFFFFF',
      buttonStyle: 'filled',
      buttonBorderRadius: 12,
      showOnDesktop: true,
      showOnMobile: true,
      customCss: '',
      heroWidgetType: 'slider',
    },
    customHeader: getDefaultHeaderSettings(fallback, (fallback as any)?.theme_id),
    videos: {
      enabled: true,
      elementTitle: 'Product Videos',
      subtitle: 'Discover our latest collection through real live videos',
      displayType: 'slider',
      videoProducts: [
        {
          id: 'vp-1',
          name: 'Embroidered Royal Floral Vase',
          price: 286.35,
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-blooming-flowers-in-spring-41221-large.mp4',
          poster: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80',
          badge: 'Trending Video',
        },
        {
          id: 'vp-2',
          name: 'Classic White Lily Arrangement',
          price: 297.85,
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-white-roses-in-a-bouquet-41220-large.mp4',
          poster: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
          badge: 'Staff Pick',
        },
        {
          id: 'vp-3',
          name: 'Modern Red Rose Tower',
          price: 309.35,
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-red-roses-close-up-41223-large.mp4',
          poster: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=600&q=80',
          badge: '4K Reel',
        },
        {
          id: 'vp-4',
          name: 'Black Velvet Luxury Box',
          price: 345.0,
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-blooming-flowers-in-spring-41221-large.mp4',
          poster: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=80',
          badge: 'New Arrival',
        },
      ],
      promotionalVideoBadge: true,
      promoBadgeText: 'Product Video',
      autoPlayVideo: true,
      videoAspectRatio: '9:16',
      badgePosition: 'top-left',
      showViewAll: true,
    },
    tabs: {
      enabled: true,
      mainTitle: 'Our Featured Collection',
      subtitle: 'Discover the latest styles and fragrances for every occasion',
      tabsStyle: 'buttons',
      activeTab: 'Best Selling',
      tabs: ['Best Selling', 'Latest', 'Discounts', 'Bridal', 'Luxury Vases', 'Accessories'],
      displayType: 'slider',
      numberOfProducts: 8,
      columnsCount: 4,
      collectionFilter: 'all',
      displayViewAll: true,
    },
    detailedProducts: {
      enabled: true,
      elementTitle: 'Product of the Week',
      subtitle: 'A limited-time offer you do not want to miss!',
      addTopSpacing: false,
      selectedProductId: 'prod-1',
      productVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-blooming-flowers-in-spring-41221-large.mp4',
      showSalesCount: true,
      salesCount: '1.2k sold',
      useCustomRating: true,
      ratingValue: 4.9,
      numberOfReviews: 120,
      imageDimensions: 'square',
      imageDisplayMode: 'cover',
      cardBorderColor: '#e2e8f0',
      movingBannerText: 'Free Express Shipping in Makkah · 1 Year Official Quality Warranty · Easy 14-Day Returns · Secure Payment',
      bannerDividerIcon: 'Vertical Line (|)',
      bannerBgColor: '#032320',
      bannerTextColor: '#FFFFFF',
      displayProductOptions: true,
      displayTwoLinesDesc: true,
      displayBuyNowButton: true,
      enableCarMatsCustomizer: true,
      enableTrunkMatOption: true,
      enableHybridFuelOption: true,
      enableDriverHeelPadOption: true,
      enableRemovableCarpetOption: true,
      browserDisplay: 'all',
    },
    imageGrid: {
      enabled: true,
      layoutStyle: 'bento',
      shape: 'rounded',
      hoverEffect: 'zoom',
      desktopColumns: 4,
      mobileColumns: 2,
      items: [
        {
          id: 'ig-1',
          image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80',
          title: 'Royal Bouquets',
          subtitle: 'Handcrafted floral art',
          link: '#store-products-grid',
          span: 'col-span-1 row-span-2',
        },
        {
          id: 'ig-2',
          image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
          title: 'Bridal Blooms',
          subtitle: 'Unforgettable wedding gifts',
          link: '#store-products-grid',
          span: 'col-span-2 row-span-1',
        },
        {
          id: 'ig-3',
          image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80',
          title: 'Table Vases',
          subtitle: 'Living room luxury',
          link: '#store-products-grid',
          span: 'col-span-1 row-span-1',
        },
        {
          id: 'ig-4',
          image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80',
          title: 'Perfumes & Chocolates',
          subtitle: 'Sweet harmony pairings',
          link: '#store-products-grid',
          span: 'col-span-1 row-span-2',
        },
      ],
    },
    customLinks: {
      enabled: true,
      title: 'Shop by Category',
      subtitle: 'Discover our best collections and exclusive deals',
      makeFullWidth: true,
      displayAsSlider: true,
      layoutStyle: 'grid',
      aspectRatio: 'wide',
      hoverEffect: 'zoom',
      desktopColumns: 4,
      mobileColumns: 2,
      imageDisplayMode: 'cover',
      roundedCorners: 'medium',
      enableOverlay: true,
      overlayStyle: 'gradient',
      textPosition: 'bottom-left',
      showButtonOnBanner: true,
      buttonText: 'Shop Now',
      buttonColor: '#059669',
      buttonStyle: 'filled',
      enableAutoSlider: false,
      sliderSpeed: 5,
      showNavArrows: true,
      showPaginationDots: true,
      browserDisplay: 'all',
      links: [
        {
          id: 'cl-1',
          image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=600&q=80',
          title: 'Luxury Hand Bouquets',
          subtitle: 'Imported Ecuadorian blooms',
          category: 'Luxury Hand Bouquets',
          link: '#store-products-grid',
          linkType: 'Category',
          showButton: true,
          buttonText: 'Shop Now',
        },
        {
          id: 'cl-2',
          image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
          title: 'Luxury Vases & Crystal',
          subtitle: 'Pure royal freshness for hotel & home',
          category: 'Luxury Vases',
          link: '#store-products-grid',
          linkType: 'Category',
          showButton: true,
          buttonText: 'Shop Now',
        },
        {
          id: 'cl-3',
          image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80',
          title: 'Haram & Hotel Gifts',
          subtitle: 'Zamzam, oud & VIP floral hampers',
          category: 'Haram & Hotel Gifts',
          link: '#store-products-grid',
          linkType: 'Category',
          showButton: true,
          buttonText: 'Shop Now',
        },
        {
          id: 'cl-4',
          image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=80',
          title: 'Seasonal Specials',
          subtitle: 'Eid, Ramadan & celebration floral gifts',
          category: 'Seasonal Specials',
          link: '#store-products-grid',
          linkType: 'Category',
          showButton: true,
          buttonText: 'Shop Now',
        },
      ],
    },
    banners: {
      enabled: true,
      topSpacing: true,
      fullWidth: true,
      roundedCorners: 'medium',
      bannerHeight: 'auto',
      equalHeight: true,
      showNavigationArrows: true,
      arrowStyle: 'circle',
      showPaginationDots: true,
      autoPlay: true,
      slideDuration: 5,
      transitionEffect: 'slide',
      textPosition: 'left',
      overlayOpacity: 10,
      desktopVersion: true,
      mobileVersion: true,
      banners: [
        {
          id: 'b-1',
          image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1920&q=80',
          title: 'A Fresh Look For Every Moment',
          subtitle: 'Discover stylish pieces and fragrant bouquets for your everyday life.',
          discountBadge: 'UP TO 30% OFF',
          buttonText: 'Shop Now →',
          link: '#store-products-grid',
        },
        {
          id: 'b-2',
          image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1920&q=80',
          title: 'Ramadan Special Luxury Vases',
          subtitle: 'Special 50% discount on selected arrangements with free delivery to Clock Tower.',
          discountBadge: 'SPECIAL 50% OFF',
          buttonText: 'Grab Deal',
          link: '#store-products-grid',
        },
      ],
    },
    blog: {
      enabled: true,
      title: 'Stories, Tips and Ideas',
      subtitle: 'Discover the latest news, guides, and flower maintenance tips.',
      showViewAll: true,
      buttonText: 'View All Articles',
      articleSource: 'latest',
      numberOfArticles: 3,
      displayStyle: 'featured-cards',
      articles: [
        {
          id: 'art-1',
          image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80',
          title: 'How to Keep Natural Flowers Fresh in Makkah Weather',
          excerpt: 'Essential tips for keeping Dutch blooms vibrant for over 10 days in air-conditioned environments.',
          category: 'Flower Care',
          date: 'Sep 28, 2026',
          readTime: '5 min read',
        },
        {
          id: 'art-2',
          image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
          title: 'Top 5 Fragrant Bouquets for Umrah Pilgrims',
          excerpt: 'Surprise your loved ones staying at Central District hotels with holy blessed rose sets.',
          category: 'Gift Guide',
          date: 'Sep 25, 2026',
          readTime: '4 min read',
        },
        {
          id: 'art-3',
          image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80',
          title: 'The Symbolism of White Lilies in Islamic Hospitality',
          excerpt: 'Why white flowers are the premier choice for welcoming honored pilgrims.',
          category: 'Culture & Heritage',
          date: 'Sep 20, 2026',
          readTime: '6 min read',
        },
      ],
    },
    announcementBar: {
      enabled: true,
      messages: [
        {
          id: 'msg-1',
          icon: 'Gift',
          text: 'Get 50% OFF on all products! Use code MKS',
          link: '#store-products-grid',
          active: true,
        },
        {
          id: 'msg-2',
          icon: 'Truck',
          text: 'Free shipping on orders above 200 SAR in Makkah',
          link: '#store-products-grid',
          active: true,
        },
        {
          id: 'msg-3',
          icon: 'CreditCard',
          text: 'Shop now, pay later with Tabby & Tamara',
          link: '#store-products-grid',
          active: true,
        },
      ],
      animationType: 'marquee',
      direction: 'rtl',
      animationSpeed: 'medium',
      pauseOnHover: true,
      enableCountdown: true,
      countdownEndDate: '2026-12-31T23:59:59',
      countdownStyle: 'boxes',
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
      showButton: true,
      buttonText: 'Shop Now →',
      buttonLink: '#store-products-grid',
      stickyOnScroll: true,
      showCloseButton: true,
      bgType: 'gradient',
      bgColor: '#FF4A6B',
      textColor: '#FFFFFF',
      iconColor: '#FFD700',
      desktopVersion: true,
      mobileVersion: true,
    },
    enhancedFeatures: {
      enabled: true,
      mainTitle: 'A Better Shopping Experience',
      subtitle: 'Everything you need for a smooth and secure shopping journey in Makkah.',
      layoutStyle: 'classic-cards',
      itemsPerRowDesktop: 4,
      itemsPerRowMobile: 2,
      features: [
        {
          id: 'feat-1',
          icon: 'Truck',
          title: 'Fast & Free Delivery',
          description: 'Refrigerated 18°C delivery within 2 hours across all Makkah districts & hotels.',
          linkText: 'Learn more →',
        },
        {
          id: 'feat-2',
          icon: 'CreditCard',
          title: 'Flexible Payment Options',
          description: 'Mada, Apple Pay, Tabby, Visa/MC, and Cash on Delivery supported seamlessly.',
          linkText: 'Learn more →',
        },
        {
          id: 'feat-3',
          icon: 'ShieldCheck',
          title: 'Secure Shopping',
          description: 'ZATCA-certified e-invoicing and 256-bit bank grade encryption.',
          linkText: 'Learn more →',
        },
        {
          id: 'feat-4',
          icon: 'Headphones',
          title: '24/7 Customer Support',
          description: 'Our floral concierge team is always here on WhatsApp to assist you.',
          linkText: 'Learn more →',
        },
      ],
      cardBackground: 'white',
      cardBorder: 'soft',
      borderRadius: 16,
      shadow: true,
      iconAnimation: 'floating',
      hoverEffect: 'zoom',
    },
    productCards: {
      imageHeight: 18,
      productsPerRow: 4,
      equalHeight: true,
      roundedCards: true,
      addBorder: true,
      borderColor: '#E2E8F0',
      changeImageOnHover: true,
      imageAnimation: 'zoom',
      zoomEffect: 'light',
      showProductButtons: true,
      buttonPosition: 'on-image-hover',
      usePrimaryColorForIcons: true,
      showProductOptions: true,
      showNotifyMe: true,
      showDiscountPercentage: true,
      showProductRating: true,
      cardDesignPreset: (!isCoffee && !isCar) ? 'royal-luxury' : 'classic',
      showFeatureBadges: (!isCoffee && !isCar) ? true : false,
      showWhatsAppButton: true,
    },
    customProducts: {
      enabled: true,
      addTopSpacing: true,
      mainTitle: 'Featured Collection',
      subtitle: 'Discover the latest styles for every sacred occasion in Makkah',
      displayType: 'slider',
      productType: 'featured',
      numberOfProducts: 8,
      columnsCount: 4,
      collectionFilter: 'all',
      displayViewAll: true,
    },
    specialOffer: {
      enabled: true,
      badgeText: 'LIMITED TIME OFFER',
      title: 'Special Sale Up to 50% Off',
      description: 'Shop your favorite fresh floral arrangements before the offer ends!',
      bgImage: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1920&q=80',
      bgColor: '#FDF2F0',
      contentColor: '#1F2937',
      countdownEndDate: '2026-12-31T23:59:59',
      countdownStyle: 'modern-cards',
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
      buttonText: 'Shop Now →',
      buttonLink: '#store-products-grid',
      buttonStyle: 'filled',
      showProductImage: true,
      productImage: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80',
      showTrustMessages: true,
      trustMessages: [
        { id: 'tm-1', icon: 'Truck', text: 'Free Express Shipping' },
        { id: 'tm-2', icon: 'ShieldCheck', text: 'Secure Saudi Payment' },
        { id: 'tm-3', icon: 'Clock', text: 'Limited Stock Available' },
      ],
    },
    statistics: {
      enabled: true,
      mainTitle: 'Why Customers Trust Us?',
      subtitle: 'Numbers that reflect our experience and customer satisfaction in Makkah.',
      layoutStyle: 'glass',
      itemsPerRowDesktop: 4,
      itemsPerRowMobile: 2,
      items: [
        {
          id: 'stat-1',
          icon: 'Package',
          number: '+500',
          label: 'Fresh Bouquets',
          description: 'A wide selection crafted daily',
        },
        {
          id: 'stat-2',
          icon: 'Users',
          number: '+3K',
          label: 'Happy Pilgrims & Guests',
          description: 'Trusted by thousands in Makkah',
        },
        {
          id: 'stat-3',
          icon: 'ShoppingCart',
          number: '+200',
          label: 'Daily Deliveries',
          description: 'Processed and delivered on time',
        },
        {
          id: 'stat-4',
          icon: 'Store',
          number: '+12',
          label: 'Hotel Hubs',
          description: 'Across Makkah Central Area',
        },
      ],
      iconNumberColor: '#059669',
      animationEffect: 'counter',
      animationTrigger: 'on-scroll',
      hoverEffect: 'zoom',
    },
    maintenance: {
      enabled: false,
      titleAr: 'نجهز لكم تجربة إهداء ملكية تليق بأطهر بقاع الأرض',
      titleEn: 'Crafting a Royal Floral Gifting Experience in Holy Makkah',
      subtitleAr: 'نعمل بكل حب على تجهيز تشكيلات الزهور الطبيعية الهولندية، شوكولاتة باتشي وبستاني الملكية، وكيك المناسبات لخدمتكم بأعلى معايير الفخامة في فنادق وأحياء مكة المكرمة.',
      subtitleEn: 'We are arranging the finest natural Dutch blooms, Patchi & Bostani luxury chocolates, and celebratory cakes with 2-hour express delivery to Haram hotels.',
      launchDate: '2026-10-25T00:00:00',
      showCountdown: true,
      showWhatsapp: true,
      showEmailSubscribe: true,
      whatsappNumber: '+966581617712',
    },
    customOrder: {
      enabled: false,
      whatsappNumber: (fallback as any)?.whatsapp || (fallback as any)?.phone || '966549876543',
      whatsappMessageAr: isCoffee
        ? 'السلام عليكم، أود الاستفسار وطلب تفصيل ركن قهوة مخصص حسب المقاسات والتصميم'
        : 'السلام عليكم، أود الاستفسار بخصوص تفصيل طلب مخصص',
      whatsappMessageEn: isCoffee
        ? 'Hello, I would like to inquire about placing a custom coffee corner order.'
        : 'Hello, I would like to inquire about placing a custom order.',
      buttonLabelAr: isCoffee ? 'تفصيل حسب الطلب · تصميم وتنفيذ' : 'طلب مخصص وتفصيل',
      buttonLabelEn: isCoffee ? 'Custom Made · Design & Build' : 'Custom Made to Order',
    },
    updatedAt: new Date().toISOString(),
  };
}

/** True only for the flowers/gifts vertical, the single store type allowed to keep floral seed content. */
export function isFlowerStore(store: { id?: string; name?: string }): boolean {
  const id = (store.id || '').toLowerCase();
  const name = store.name || '';
  return (
    id === 'store-1' ||
    /flower|bouquet|florist|hadaya|gift/i.test(name) ||
    /زهور|ورد|هدايا|باقات/.test(name)
  );
}

const FLOWER_CONTENT_PATTERN =
  /photo-1518895949257|photo-1563245372|photo-1526047932273|photo-1490750967868|photo-1561181286|bouquet|flower|floral|vases?\b|haram|makkah|dutch|bridal|زهور|باقات|مكة|الحرم/i;

/** Detects floral seed content that must never appear on non-flower stores. */
export function containsFlowerContent(section: unknown): boolean {
  if (section == null) return false;
  try {
    return FLOWER_CONTENT_PATTERN.test(JSON.stringify(section));
  } catch {
    return false;
  }
}

/** Sections whose default content is vertical-specific and must be empty for non-flower stores. */
const CONTENT_SECTION_KEYS = [
  'videos',
  'tabs',
  'detailedProducts',
  'imageGrid',
  'customLinks',
  'banners',
  'blog',
  'announcementBar',
  'enhancedFeatures',
  'specialOffer',
  'statistics',
  'maintenance',
  'customOrder',
] as const;

export function defaultThemeSettingsMap(fallback: {
  name: string;
  ownerEmail?: string;
  logo?: string;
  accentColor?: string;
  id?: string;
}): AllThemeSettings {
  const base = buildRawDefaultThemeSettings(fallback);
  if (isFlowerStore({ id: fallback.id, name: fallback.name })) return base;

  // Non-flower store: no fabricated catalog/marketing content. Sections render genuine empty states
  // or fall back to the active theme's own components fed by the store's real products.
  const s: any = base;
  s.videos = { ...s.videos, enabled: false, videoProducts: [] };
  s.tabs = { ...s.tabs, tabs: [], activeTab: '' };
  s.detailedProducts = {
    ...s.detailedProducts,
    selectedProductId: '',
    productVideoUrl: '',
    salesCount: '',
    movingBannerText: '',
  };
  s.imageGrid = { ...s.imageGrid, items: [] };
  s.customLinks = { ...s.customLinks, links: [] };
  s.banners = { ...s.banners, banners: [] };
  s.blog = { ...s.blog, articles: [] };
  if (s.statistics) s.statistics = { ...s.statistics, items: [] };
  if (s.maintenance) {
    s.maintenance = {
      ...s.maintenance,
      titleEn: fallback.name || '',
      titleAr: fallback.name || '',
      subtitleEn: '',
      subtitleAr: '',
    };
  }
  return base;
}

export const getThemeSettingsCompositeKey = (storeId: string, themeId?: string): string => {
  if (themeId && themeId.trim() !== '') {
    return `unityteck_theme_settings_${storeId}_${themeId.trim()}`;
  }
  return `unityteck_theme_settings_full_${storeId}`;
};

export function resolveStoreActiveThemeId(storeId: string): string | undefined {
  if (typeof localStorage === 'undefined') return undefined;
  try {
    const rawMap = localStorage.getItem('unityteck_store_active_theme_map');
    if (rawMap) {
      const map = JSON.parse(rawMap);
      if (map && map[storeId]) return map[storeId];
    }
  } catch {}
  return undefined;
}

const themeSettingsCache = new Map<string, AllThemeSettings>();

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!e.key || e.key.startsWith('unityteck_theme_settings_') || e.key === 'unityteck_store_active_theme_map') {
      themeSettingsCache.clear();
    }
  });
  window.addEventListener('unityteck-theme-settings', () => {
    themeSettingsCache.clear();
  });
}

export function readAllThemeSettings(
  storeId: string,
  fallbackStore: { name: string; ownerEmail?: string; logo?: string; accentColor?: string },
  explicitThemeId?: string,
): AllThemeSettings {
  const targetThemeId = explicitThemeId || resolveStoreActiveThemeId(storeId);
  const cacheKey = `${storeId}::${targetThemeId || ''}::${fallbackStore?.name || ''}`;
  const cached = themeSettingsCache.get(cacheKey);
  if (cached) return cached;

  const defaults = defaultThemeSettingsMap({ ...fallbackStore, id: storeId } as any);

  // If a theme manifest exists, adapt default colors to match that theme's branding
  if (targetThemeId) {
    const manifest = getThemeManifest(targetThemeId);
    if (manifest && manifest.defaultColors) {
      defaults.colors = {
        ...defaults.colors,
        primaryBgColor: manifest.defaultColors.primary,
        secondaryBgColor: manifest.defaultColors.secondary,
        headerBgColor: manifest.defaultColors.surface,
        mainTextColor: manifest.defaultColors.text,
      };
    }
  }

  try {
    // 1. Try loading from theme-isolated composite key
    let raw: string | null = null;
    if (targetThemeId) {
      raw = localStorage.getItem(getThemeSettingsCompositeKey(storeId, targetThemeId));
    }
    // 2. If not found, try fallback legacy store key
    if (!raw) {
      raw = localStorage.getItem(getThemeSettingsCompositeKey(storeId));
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      // Strict vertical isolation: purge any floral seed content persisted for a non-flower store.
      if (!isFlowerStore({ id: storeId, name: fallbackStore.name })) {
        for (const key of CONTENT_SECTION_KEYS) {
          if (containsFlowerContent(parsed[key])) delete parsed[key];
        }
      }
      // Self-heal header if it holds wrong store's default flowers for coffee/car/other store
      const isNotHadayaStore = storeId === 'store-coffee' || storeId === 'store-bleco' || storeId !== 'store-1';
      const hasWrongFlowerHeader = isNotHadayaStore && (
        parsed.customHeader?.logo?.titleAr === 'هدايا مكة' ||
        parsed.customHeader?.logo?.titleEn === 'Hadaya Makkah' ||
        parsed.customHeader?.announcement?.messages?.some((m: any) => m.textEn?.includes('Holland') || m.textEn?.includes('Flowers'))
      );
      const safeCustomHeader = hasWrongFlowerHeader
        ? defaults.customHeader
        : (parsed.customHeader || defaults.customHeader);

      // Self-heal slider if it holds floral bouquet defaults on coffee or car store
      const hasWrongFlowerSlider = isNotHadayaStore && (
        parsed.slider?.slides?.some((s: any) =>
          s.subtitle?.toLowerCase().includes('floral') ||
          s.title?.toLowerCase().includes('floral') ||
          s.subtitle?.includes('باقات') ||
          s.title?.includes('باقات')
        )
      );
      const safeSlider = hasWrongFlowerSlider
        ? defaults.slider
        : (parsed.slider || defaults.slider);

      const result: AllThemeSettings = {
        ...defaults,
        ...parsed,
        identity: { ...defaults.identity, ...(parsed.identity || {}) },
        general: { ...defaults.general, ...(parsed.general || {}) },
        colors: { ...defaults.colors, ...(parsed.colors || {}) },
        categoryCartCustomer: { ...defaults.categoryCartCustomer, ...(parsed.categoryCartCustomer || {}) },
        slider: safeSlider,
        videos: { ...defaults.videos, ...(parsed.videos || {}) },
        tabs: { ...defaults.tabs, ...(parsed.tabs || {}) },
        detailedProducts: { ...defaults.detailedProducts, ...(parsed.detailedProducts || {}) },
        imageGrid: { ...defaults.imageGrid, ...(parsed.imageGrid || {}) },
        customLinks: { ...defaults.customLinks, ...(parsed.customLinks || {}) },
        banners: { ...defaults.banners, ...(parsed.banners || {}) },
        blog: { ...defaults.blog, ...(parsed.blog || {}) },
        announcementBar: { ...defaults.announcementBar, ...(parsed.announcementBar || {}) },
        enhancedFeatures: { ...defaults.enhancedFeatures, ...(parsed.enhancedFeatures || {}) },
        productCards: { ...defaults.productCards, ...(parsed.productCards || {}) },
        customProducts: { ...defaults.customProducts, ...(parsed.customProducts || {}) },
        specialOffer: { ...defaults.specialOffer, ...(parsed.specialOffer || {}) },
        statistics: { ...defaults.statistics, ...(parsed.statistics || {}) },
        customHeader: safeCustomHeader,
        maintenance: { ...(defaults.maintenance || {}), ...(parsed.maintenance || {}) },
        customOrder: { ...(defaults.customOrder || {}), ...(parsed.customOrder || {}) },
      };
      themeSettingsCache.set(cacheKey, result);
      return result;
    }
  } catch {
    /* fallback to defaults */
  }
  themeSettingsCache.set(cacheKey, defaults);
  return defaults;
}

export function writeAllThemeSettings(
  storeId: string,
  settings: AllThemeSettings,
  explicitThemeId?: string,
): void {
  themeSettingsCache.clear();
  const targetThemeId = explicitThemeId || resolveStoreActiveThemeId(storeId);
  const next = { ...settings, updatedAt: new Date().toISOString() };

  // 1. Write to theme-isolated composite key
  if (targetThemeId) {
    localStorage.setItem(getThemeSettingsCompositeKey(storeId, targetThemeId), JSON.stringify(next));
  }
  // 2. Also write to legacy store key for compatibility
  localStorage.setItem(getThemeSettingsCompositeKey(storeId), JSON.stringify(next));

  // Sync identity with the dedicated storeIdentity key for backwards compatibility
  writeStoreIdentity(storeId, next.identity);

  if (typeof window !== 'undefined') {
    bumpStore(storeId, 'theme');
    bumpStore(storeId, 'settings');
    window.dispatchEvent(
      new CustomEvent('unityteck-theme-settings', {
        detail: { storeId, themeId: targetThemeId, updatedAt: next.updatedAt },
      }),
    );
    window.dispatchEvent(
      new CustomEvent('unityteck-data', {
        detail: { tag: `store:${storeId}:theme-settings`, version: Date.now() },
      }),
    );
  }
}
