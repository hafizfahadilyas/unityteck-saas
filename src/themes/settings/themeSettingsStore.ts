/**
 * Central Theme Settings Store — All 18 Design Pages (LOCKED)
 * Source of Truth: designs/Theme_Settings_UIUX/
 * Full reactivity, per-store isolation, soft cache invalidation.
 */

import { defaultStoreIdentity, readStoreIdentity, writeStoreIdentity, type StoreIdentitySettings } from './storeIdentity';

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

export interface SliderSlide {
  id: string;
  type: 'image' | 'video';
  image: string;
  videoUrl?: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonUrl: string;
  badge: string;
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
}

export interface CustomProductsSettings {
  enabled: boolean;
  addTopSpacing: boolean;
  mainTitle: string;
  subtitle: string;
  displayType: 'list' | 'slider';
  productType: 'latest' | 'featured' | 'discounts';
  numberOfProducts: number;
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
  maintenance?: MaintenanceModeSettings;
  updatedAt: string;
}

export function defaultThemeSettingsMap(fallback: {
  name: string;
  ownerEmail?: string;
  logo?: string;
  accentColor?: string;
}): AllThemeSettings {
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
      customNavigationMenu: [
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
      secondaryBgColor: '#F8FAFC',
      mainTextColor: '#111827',
      secondaryTextColor: '#6B7280',
      headerBgColor: '#032320',
      headerTextColor: '#FFFFFF',
      productCardBgColor: '#FFFFFF',
      promoLabelBgColor: '#EF4444',
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
      categoryBannerUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1920&q=80',
      subcategories: true,
      breadcrumbs: true,
      enhancedCart: true,
      recommendedProducts: true,
      recommendedDisplayStyle: 'grid',
      customerBgImage: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1920&q=80',
      loginPageStyle: 'image',
      registerPageStyle: 'image',
      accountPageStyle: 'solid',
      showWhatsAppInCustomer: true,
      showPhoneInCustomer: false,
    },
    slider: {
      slides: [
        {
          id: 'slide-1',
          type: 'image',
          image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
          title: 'Discover Your Style',
          subtitle: 'Premium quality floral bouquets crafted for your sacred moments in Makkah.',
          buttonText: 'Shop Now →',
          buttonUrl: '#store-products-grid',
          badge: 'Limited Edition',
        },
        {
          id: 'slide-2',
          type: 'image',
          image: 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=1920&q=80',
          title: 'Royal Lily & Orchid Elegance',
          subtitle: 'Daily fresh imports from Netherlands and Ecuador delivered to your doorstep in 2 hours.',
          buttonText: 'Explore Collection',
          buttonUrl: '#store-products-grid',
          badge: 'Bestseller',
        },
        {
          id: 'slide-3',
          type: 'image',
          image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1920&q=80',
          title: 'Ramadan & Eid Celebrations',
          subtitle: 'Spread joy and blessing with handcrafted luxury arrangements.',
          buttonText: 'Order via WhatsApp',
          buttonUrl: 'https://wa.me/966504428819',
          badge: 'Special Season',
        },
      ],
      transitionEffect: 'fade',
      transitionDuration: 5,
      animationSpeed: 2,
      autoPlay: true,
      buttonBgColor: '#059669',
      buttonTextColor: '#FFFFFF',
      buttonStyle: 'filled',
      buttonBorderRadius: 12,
      showOnDesktop: true,
      showOnMobile: true,
      customCss: '',
    },
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
    },
    customProducts: {
      enabled: true,
      addTopSpacing: true,
      mainTitle: 'Featured Collection',
      subtitle: 'Discover the latest styles for every sacred occasion in Makkah',
      displayType: 'slider',
      productType: 'featured',
      numberOfProducts: 8,
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
    updatedAt: new Date().toISOString(),
  };
}

const themeSettingsStorageKey = (storeId: string) => `unityteck_theme_settings_full_${storeId}`;

export function readAllThemeSettings(
  storeId: string,
  fallbackStore: { name: string; ownerEmail?: string; logo?: string; accentColor?: string },
): AllThemeSettings {
  const defaults = defaultThemeSettingsMap(fallbackStore);
  try {
    const raw = localStorage.getItem(themeSettingsStorageKey(storeId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaults,
        ...parsed,
        identity: { ...defaults.identity, ...(parsed.identity || {}) },
        general: { ...defaults.general, ...(parsed.general || {}) },
        colors: { ...defaults.colors, ...(parsed.colors || {}) },
        categoryCartCustomer: { ...defaults.categoryCartCustomer, ...(parsed.categoryCartCustomer || {}) },
        slider: { ...defaults.slider, ...(parsed.slider || {}) },
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
        maintenance: { ...(defaults.maintenance || {}), ...(parsed.maintenance || {}) },
      };
    }
  } catch {
    /* fallback to defaults */
  }
  return defaults;
}

export function writeAllThemeSettings(storeId: string, settings: AllThemeSettings): void {
  const next = { ...settings, updatedAt: new Date().toISOString() };
  localStorage.setItem(themeSettingsStorageKey(storeId), JSON.stringify(next));

  // Sync identity with the dedicated storeIdentity key for backwards compatibility
  writeStoreIdentity(storeId, next.identity);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('unityteck-theme-settings', {
        detail: { storeId, updatedAt: next.updatedAt },
      }),
    );
    window.dispatchEvent(
      new CustomEvent('unityteck-data', {
        detail: { tag: `store:${storeId}:theme-settings`, version: Date.now() },
      }),
    );
  }
}
