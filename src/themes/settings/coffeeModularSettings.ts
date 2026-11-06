/**
 * HiBrew KSA modular theme keys (Word C-FCP … C-NEWS / C-CPB).
 * Separate persist keys — hero banners are not featured-section banners.
 * Default seeds use real public/images catalog art (merchant can replace via theme settings).
 * Empty collections stay empty once a merchant has cleared them (see modularHasContent).
 */

const H1 = '/images/coffee_hero_flagship_machine_1791218907782.jpg';
const H2 = '/images/coffee_grinder_mill_banner_1791218928342.jpg';
const H3 = '/images/coffee_corner_luxury_station_1791219182840.jpg';

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
  columnsMobile: number;
  cardStyle: 'rounded' | 'square';
  spacing: 'small' | 'medium' | 'large';
}

export interface FeaturedCategoriesProductsSettings {
  enabled: boolean;
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

export interface HeroBannerSlideSettings extends HeroBannerButtonFlags {
  id: string;
  enabled: boolean;
  image: string;
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
}

export interface HeroBannersSettings {
  enabled: boolean;
  autoplay: boolean;
  intervalMs: number;
  showArrows: boolean;
  showDots: boolean;
  showWhatsapp: boolean;
  whatsappNumber: string;
  textColor: string;
  banners: HeroBannerSlideSettings[];
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
  banners: FeaturedSectionBanner[];
}

export interface FeaturedProductTab {
  id: string;
  enabled: boolean;
  labelEn: string;
  labelAr: string;
  categoryId: string;
}

export interface CoffeeFeaturedProductsSettings {
  enabled: boolean;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  tabs: FeaturedProductTab[];
  productCount: number;
  highlightFirst: boolean;
  showImage?: boolean;
  showTitle?: boolean;
  showPrice: boolean;
  showBadge?: boolean;
  showRating: boolean;
  showStock?: boolean;
  showAddToCart?: boolean;
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
}

export interface ImageBannersSettings {
  enabled: boolean;
  layout: 'grid' | 'bento' | 'row';
  columnsDesktop: number;
  columnsMobile: number;
  items: ImageBannerItem[];
}

export interface FooterColumnLink {
  id: string;
  labelEn: string;
  labelAr: string;
  url: string;
}

export interface FooterColumn {
  id: string;
  titleEn: string;
  titleAr: string;
  links: FooterColumnLink[];
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
  addressEn?: string;
  addressAr?: string;
  hoursEn?: string;
  hoursAr?: string;
  newsletterTitleEn?: string;
  newsletterTitleAr?: string;
  showNewsletter?: boolean;
  paymentsEn?: string;
  paymentsAr?: string;
}

export interface ExclusiveBenefitItem {
  id: string;
  enabled: boolean;
  icon: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface ExclusiveBenefitsSettings {
  enabled: boolean;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  items: ExclusiveBenefitItem[];
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

export interface ShopCatalogSettings {
  columnsDesktop: number;
  columnsTablet: number;
  columnsMobile: number;
  perPage: number;
  defaultSort: 'featured' | 'price-asc' | 'price-desc' | 'rating';
  showFilters: boolean;
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
  return `${mobile} sm:${mobile} ${tablet} ${desktop} gap-2.5 sm:gap-6`;
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
  shop?: ShopCatalogSettings;
  checkoutFields?: CheckoutFieldSettings;
  seoDefaults?: SeoDefaultSettings;
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
    customOrderUrl: 'custom-order',
    ...partial,
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
      banners: [],
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
  };
}

export function coffeeModularSeed(): CoffeeModularSlice {
  return {
    featuredCategoriesProducts: {
      enabled: true,
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
          viewMoreEn: 'View More Products',
          viewMoreAr: 'عرض المزيد من المنتجات',
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
      whatsappNumber: '+966549876543',
      textColor: '#111111',
      banners: [
        heroSlide({
          id: 'hero-hibrew-dual',
          image: H1,
          promoEn: 'AI✦ Flagship Choice',
          promoAr: 'خيار الفلاجشيب AI✦',
          titleEn: 'HiBrew Barista Pro H7A Dual-Boiler',
          titleAr: 'هايبرو بارستا برو H7A دبل بويلر',
          descriptionEn: 'Dual PID thermoblock, 58mm group, and 20-bar Italian pump.',
          descriptionAr: 'دبل بويلر PID ومقبس 58 ملم ومضخة إيطالية 20 بار.',
          price: '1899',
          productId: 'hb-h10a-dualboiler',
          buyNowEn: 'Shop Barista Pro',
          buyNowAr: 'تسوّق بارستا برو',
        }),
        heroSlide({
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
        heroSlide({
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
      whatsappNumber: '+966549876543',
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
  };
}

const LIST_FIELD: Partial<Record<CoffeeModularKey, string>> = {
  featuredCategoriesProducts: 'sections',
  heroBanners: 'banners',
  featuredSectionBanners: 'banners',
  imageBanners: 'items',
  exclusiveBenefits: 'items',
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
  let clean = String(raw || '').replace(/\D/g, '');
  if (!clean) return '';
  if (clean.startsWith('05')) clean = `966${clean.slice(1)}`;
  else if (clean.startsWith('5') && clean.length === 9) clean = `966${clean}`;
  return clean;
}
