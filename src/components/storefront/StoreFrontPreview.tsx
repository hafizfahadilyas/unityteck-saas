import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { Product } from '../../types';
import { generateStoreSEO, applySEOToDOM } from '../../utils/storeSEO';
import { 
  Smartphone, 
  Monitor, 
  Tablet,
  ShoppingCart, 
  CreditCard, 
  Sparkles, 
  Check, 
  Globe, 
  Zap, 
  ShieldCheck, 
  Trash2, 
  X,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Heart,
  Search,
  Star,
  MapPin,
  Clock,
  Phone,
  Flower2,
  Car,
  Coffee,
  Lock,
  Gift,
  Truck,
  CheckCircle2,
  UserCheck,
  Palette,
  Copy,
  Code2,
  Eye,
  Share2,
  User,
  MessageCircle,
  Menu,
  Grid,
  ArrowRight,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Tag,
  Package,
  RotateCcw as RotateIcon,
  Home,
  ShoppingBag,
  BookOpen,
  Info,
} from 'lucide-react';
import { ClientAuthModal } from '../common/ClientAuthModal';
import { PrefsSwitcher } from '../common/PrefsSwitcher';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  FLOWERS_THEME_ID,
  FLOWERS_HOMEPAGES,
  FLOWERS_HERO_BY_HOME,
  FLOWERS_VARIATIONS,
  FLOWERS_CIRCLE_CATEGORIES,
  resolveFlowersHomepage,
  type FlowersSfPage,
} from '../../themes/flowersPremium/pack';
import { FlowerFrameHero } from '../../themes/flowersPremium/FlowerFrameHero';
import { CircleCategories } from '../../themes/flowersPremium/CircleCategories';
import { SingleProductView } from '../../themes/flowersPremium/SingleProductView';
import { OfferPopup } from '../../themes/flowersPremium/OfferPopup';
import {
  consumeOfferPreviewOnce,
  isOfferDismissed,
  markOfferDismissed,
  readOfferConfig,
  type StoreOfferConfig,
} from '../../themes/flowersPremium/offerConfig';
import { WhatsAppChatFab, whatsappOrderHref } from '../../themes/flowersPremium/WhatsAppChatFab';
import { FlowersStaticPage, isStaticFlowersPage } from '../../themes/flowersPremium/StaticPages';
import { HomeFaq } from '../../themes/flowersPremium/HomeFaq';
import { HomeReviews } from '../../themes/flowersPremium/HomeReviews';
import { ProductCard } from '../../themes/flowersPremium/ProductCard';
import { ThankYouPage } from '../../themes/flowersPremium/ThankYouPage';
import { CustomerLoginModal } from '../../themes/flowersPremium/CustomerLoginModal';
import { CustomerProfile } from '../../themes/flowersPremium/CustomerProfile';
import {
  clearSfCustomer,
  readSfCustomer,
  type SfCustomerSession,
} from '../../themes/flowersPremium/sfCustomerSession';
import { readStoreIdentity } from '../../themes/settings/storeIdentity';
import { readAllThemeSettings, getSeasonalThemeColors, type AllThemeSettings, type CustomMenuItem } from '../../themes/settings/themeSettingsStore';
import {
  SfAnnouncementBar,
  SfHeroSlider,
  SfEnhancedFeatures,
  SfSpecialOfferCountdown,
  SfShopByCategory,
  SfProductVideos,
  SfBentoImageGrid,
  SfPromotionalBanner,
  SfStoreStatistics,
  SfBlogSection,
  SfProductTabs,
  SfDetailedProductSpotlight,
  SfFloatingButtons,
} from './ThemeSectionsPreview';
const VisualThemeBuilder = React.lazy(() =>
  import('../store/visualBuilder/VisualThemeBuilder').then((m) => ({ default: m.VisualThemeBuilder })),
);
import { LightboxModal, type LightboxImageItem } from '../../themes/flowersPremium/LightboxModal';
import { TrackOrderPage } from '../../themes/flowersPremium/TrackOrderPage';
import { BlogPageView } from '../../themes/flowersPremium/BlogPageView';
import { MobileBottomNav } from '../../themes/flowersPremium/MobileBottomNav';
import { MobileMenuDrawer } from '../../themes/flowersPremium/MobileMenuDrawer';
import { AVAILABLE_ICONS } from '../store/visualBuilder/icons/IconLibraryModal';
import { DynamicThemeRenderer } from './DynamicThemeRenderer';
import { OfferVideoBanner } from '../../themes/meccaGifts/components/OfferVideoBanner';
import { getStoreDisplayName } from '../../utils/storeLocalization';
import { getStorePageBySlug } from '../../services/storePagesService';

export interface StoreFrontPreviewProps {
  isAdmin?: boolean;
}

export const StoreFrontPreview: React.FC<StoreFrontPreviewProps> = ({ isAdmin = false }) => {
  const { 
    activeStore, 
    currentProducts, 
    themes, 
    storeActiveTheme, 
    setStoreTheme,
    storeActiveHomepage,
    setStoreHomepageStyle,
    cart, 
    addToCart, 
    removeFromCart, 
    clearCart,
    currentShipping,
    addOrder,
    currentSEOConfig,
    currentCoupons,
    currentCustomers,
    currentOrders,
    addCustomer,
    recordStoreVisit,
  } = useTenant();

  useEffect(() => {
    recordStoreVisit?.(activeStore.id);
  }, [activeStore.id, recordStoreVisit]);
  const { locale: lang, money, theme, currency } = usePrefs();

  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [sfPage, setSfPage] = useState<FlowersSfPage>('home');
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<'mada' | 'apple_pay' | 'tabby' | 'cod'>('mada');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'popular'>('featured');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [navCategoriesOpen, setNavCategoriesOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [selectedMakkahDistrict, setSelectedMakkahDistrict] = useState(currentShipping[0]?.cityName || 'Makkah - Al Haram & Clock Tower Hotels');
  const [cardMessage, setCardMessage] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCustomerLogin, setShowCustomerLogin] = useState(false);
  const [showVisualBuilder, setShowVisualBuilder] = useState(false);
  const [lightboxData, setLightboxData] = useState<{
    isOpen: boolean;
    items: LightboxImageItem[];
    initialIndex: number;
  }>({
    isOpen: false,
    items: [],
    initialIndex: 0,
  });
  const [sfCustomer, setSfCustomer] = useState<SfCustomerSession | null>(null);
  const [pendingCheckoutAfterLogin, setPendingCheckoutAfterLogin] = useState(false);
  const [lastThankYou, setLastThankYou] = useState<{ ref: string; total: number; district: string } | null>(null);
  const [showSEOModal, setShowSEOModal] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [orderToast, setOrderToast] = useState<{ message: string; show: boolean } | null>(null);
  const [showOfferPopup, setShowOfferPopup] = useState(false);
  const [offerConfig, setOfferConfig] = useState<StoreOfferConfig>(() =>
    readOfferConfig(activeStore.id),
  );
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [storeIdentityTick, setStoreIdentityTick] = useState(0);

  const [themeSettings, setThemeSettings] = useState<AllThemeSettings>(() =>
    readAllThemeSettings(activeStore.id, activeStore),
  );

  useEffect(() => {
    const syncTheme = () => setThemeSettings(readAllThemeSettings(activeStore.id, activeStore));
    syncTheme();
    window.addEventListener('unityteck-theme-settings', syncTheme);
    window.addEventListener('unityteck-data', syncTheme);
    return () => {
      window.removeEventListener('unityteck-theme-settings', syncTheme);
      window.removeEventListener('unityteck-data', syncTheme);
    };
  }, [activeStore.id, activeStore.name, activeStore.accentColor]);

  const themeId = storeActiveTheme[activeStore.id] || FLOWERS_THEME_ID;
  const currentTheme = themes.find(t => t.id === themeId) || themes[0];
  const homepageStyle = resolveFlowersHomepage(storeActiveHomepage[activeStore.id]);

  // Direct inspection of URL search parameters and path for instant bulletproof theme routing
  const urlSearch = typeof window !== 'undefined' ? window.location.search.toLowerCase() : '';
  const urlPath = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';

  const isExplicitCar =
    urlSearch.includes('store=car') ||
    urlSearch.includes('store=cars') ||
    urlSearch.includes('store=bleco') ||
    urlSearch.includes('store=alsaeedi') ||
    urlSearch.includes('demo=car') ||
    urlPath.startsWith('/car') ||
    urlPath.startsWith('/cars') ||
    urlPath.startsWith('/bleco');

  const isExplicitCoffee =
    urlSearch.includes('store=coffee') ||
    urlSearch.includes('store=roasters') ||
    urlSearch.includes('demo=coffee') ||
    urlPath.startsWith('/coffee');

  const isExplicitFlowers =
    urlSearch.includes('store=flowers') ||
    urlSearch.includes('store=hadaya') ||
    urlSearch.includes('store=makkah') ||
    urlPath.startsWith('/flowers') ||
    urlPath.startsWith('/hadaya');

  // Firmly anchor store identity to activeStore.id (Strict Multi-Tenant Isolation)
  const isCoffeeStore =
    isExplicitCoffee ||
    (!isExplicitCar && !isExplicitFlowers && (
      activeStore.id === 'store-coffee' ||
      activeStore.slug === 'coffee-store' ||
      (activeStore.id !== 'store-bleco' && activeStore.id !== 'store-1' &&
       (activeStore.slug?.includes('coffee') || activeStore.category?.includes('قهوة') || themeId?.includes('coffee')))
    ));

  const isCarStore =
    isExplicitCar ||
    (!isExplicitCoffee && !isExplicitFlowers && (
      activeStore.id === 'store-bleco' ||
      activeStore.slug === 'bleco-sa' ||
      activeStore.slug === 'alsaeedi-cars' ||
      (activeStore.id !== 'store-1' &&
       (activeStore.slug?.includes('car') || activeStore.slug?.includes('transport') || themeId === 'theme-saudia-transport'))
    ));

  const isFlowersStore = !isCarStore && !isCoffeeStore;
  const isFlowersPremium = isFlowersStore;
  const storeIdentity = useMemo(
    () => readStoreIdentity(activeStore.id, activeStore),
    [activeStore.id, activeStore.name, activeStore.logo, activeStore.ownerEmail, storeIdentityTick],
  );

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [customPageContent, setCustomPageContent] = useState<{ title: string; body: string } | null>(null);
  const [mobileGridCols, setMobileGridCols] = useState<'2-columns' | '1-column'>('2-columns');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileMode = viewMode === 'mobile' || windowWidth < 768;

  const seasonalColors = useMemo(() => {
    if (themeSettings.general.autoSeasonThemeColors !== false) {
      return getSeasonalThemeColors(homepageStyle);
    }
    return null;
  }, [themeSettings.general.autoSeasonThemeColors, homepageStyle]);

  const activeAccent = seasonalColors ? seasonalColors.accent : (activeStore.accentColor || '#059669');
  const activeHeaderBg = themeSettings.colors.headerBgColor || (seasonalColors ? seasonalColors.headerBg : 'linear-gradient(to right, #032320, #063b35, #032320)');
  const activeFooterBg = seasonalColors ? seasonalColors.footerBg : '#021816';

  const heroSlides = FLOWERS_HERO_BY_HOME[homepageStyle];

  useEffect(() => {
    const cfg = readOfferConfig(activeStore.id);
    setOfferConfig(cfg);
    const previewOnce = consumeOfferPreviewOnce();
    const shouldOpen =
      isFlowersPremium &&
      (previewOnce || (cfg.enabled && !isOfferDismissed(activeStore.id)));
    setShowOfferPopup(Boolean(shouldOpen));
  }, [activeStore.id, isFlowersPremium]);

  useEffect(() => {
    const onCfg = () => setOfferConfig(readOfferConfig(activeStore.id));
    window.addEventListener('unityteck:offer-config', onCfg as EventListener);
    return () => window.removeEventListener('unityteck:offer-config', onCfg as EventListener);
  }, [activeStore.id]);

  useEffect(() => {
    setSfCustomer(readSfCustomer(activeStore.id));
  }, [activeStore.id]);

  useEffect(() => {
    const bump = () => setStoreIdentityTick((n) => n + 1);
    const onData = (e: Event) => {
      const detail = (e as CustomEvent).detail as { tag?: string } | undefined;
      const tag = detail?.tag ?? '';
      if (!tag || tag.includes(activeStore.id) || tag === 'soft-refresh' || tag.includes(':theme')) {
        bump();
      }
    };
    window.addEventListener('focus', bump);
    window.addEventListener('unityteck-theme-identity', bump);
    window.addEventListener('unityteck-data', onData as EventListener);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener('focus', bump);
      window.removeEventListener('unityteck-theme-identity', bump);
      window.removeEventListener('unityteck-data', onData as EventListener);
      window.removeEventListener('storage', bump);
    };
  }, [activeStore.id]);

  useEffect(() => {
    // Capture UTM tracking parameters for ecommerce attribution
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const utmSource = urlParams.get('utm_source');
        const utmMedium = urlParams.get('utm_medium');
        const utmCampaign = urlParams.get('utm_campaign');
        const utmTerm = urlParams.get('utm_term');
        const utmContent = urlParams.get('utm_content');

        if (utmSource || utmMedium || utmCampaign) {
          const attribution = {
            source: utmSource || 'Direct',
            medium: utmMedium || '',
            campaign: utmCampaign || '',
            term: utmTerm || '',
            content: utmContent || '',
            timestamp: Date.now(),
          };
          sessionStorage.setItem(`unityteck_utm_${activeStore.id}`, JSON.stringify(attribution));
        }
      } catch {
        // silent fallback
      }
    }
  }, [activeStore.id]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [homepageStyle]);

  useEffect(() => {
    if (quickViewProduct) {
      const vars = FLOWERS_VARIATIONS[quickViewProduct.id];
      setSelectedVariationId(vars?.[0]?.id ?? null);
    } else {
      setSelectedVariationId(null);
    }
  }, [quickViewProduct]);

  const variationDelta = useMemo(() => {
    if (!quickViewProduct || !selectedVariationId) return 0;
    return FLOWERS_VARIATIONS[quickViewProduct.id]?.find((v) => v.id === selectedVariationId)?.priceDelta ?? 0;
  }, [quickViewProduct, selectedVariationId]);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const couponDiscount =
    couponApplied && couponCode.toUpperCase() === offerConfig.code.toUpperCase()
      ? Math.round(cartTotal * (offerConfig.discountPercent / 100))
      : 0;
  const afterCoupon = Math.max(0, cartTotal - couponDiscount);
  const vatAmount = Math.round(afterCoupon * 0.15);

  const matchedShippingZone = useMemo(() => {
    return (
      currentShipping.find(
        (z) => z.cityName.toLowerCase() === selectedMakkahDistrict.toLowerCase()
      ) || currentShipping[0]
    );
  }, [currentShipping, selectedMakkahDistrict]);

  const shippingFee = useMemo(() => {
    if (!matchedShippingZone) return 0;
    if (matchedShippingZone.freeShippingAbove && afterCoupon >= matchedShippingZone.freeShippingAbove) {
      return 0;
    }
    return matchedShippingZone.rate || 0;
  }, [matchedShippingZone, afterCoupon]);

  const finalTotal = afterCoupon + vatAmount + shippingFee;

  // Golden Rule: Automatic Store-wise Public SEO computation with strict Tenant Isolation
  const seoData = useMemo(() => {
    return generateStoreSEO({
      store: activeStore,
      products: currentProducts,
      seoConfig: currentSEOConfig,
      lang: (lang === 'ar' ? 'ar' : 'en') as 'ar' | 'en',
      selectedCategory,
      activeProduct: quickViewProduct,
    });
  }, [activeStore, currentProducts, currentSEOConfig, lang, selectedCategory, quickViewProduct]);

  // Dynamically update DOM head, title, meta tags, and Schema.org JSON-LD
  useEffect(() => {
    applySEOToDOM(seoData);
  }, [seoData]);

  const allBrands = useMemo(() => {
    const set = new Set<string>();
    currentProducts.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set);
  }, [currentProducts]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    currentProducts.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return map;
  }, [currentProducts]);

  const brandCounts = useMemo(() => {
    const map: Record<string, number> = {};
    currentProducts.forEach((p) => {
      const b = p.brand || 'Dutch Flora';
      map[b] = (map[b] || 0) + 1;
    });
    return map;
  }, [currentProducts]);

  const activeFiltersCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedBrand !== 'All' ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const filteredProducts = useMemo(() => {
    let list = currentProducts.filter((p) => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesBrand = selectedBrand === 'All' || p.brand === selectedBrand;
      const matchesInStock = !inStockOnly || p.stock > 0;
      const matchesSearch =
        !searchTerm.trim() ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCat && matchesBrand && matchesInStock && matchesSearch;
    });

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'popular') {
      list = [...list].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
    }
    return list;
  }, [currentProducts, selectedCategory, selectedBrand, inStockOnly, searchTerm, sortBy]);

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    const known =
      code === offerConfig.code.toUpperCase() ||
      currentCoupons.some((c) => c.code.toUpperCase() === code && c.status === 'active');
    setCouponApplied(known);
  };

  const toggleWishlist = (id: string) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const placeOrder = (sessionOverride?: SfCustomerSession | null) => {
    const customer = sessionOverride ?? sfCustomer;
    if (!customer) {
      setPendingCheckoutAfterLogin(true);
      setShowCustomerLogin(true);
      return;
    }
    setCheckoutComplete(true);
    const orderRef = `WM-${Date.now().toString().slice(-6)}`;
    const totalSnapshot = finalTotal;
    const districtSnapshot = selectedMakkahDistrict;
    setTimeout(() => {
      let utmAttrs: { source?: string; medium?: string; campaign?: string; term?: string; content?: string } = {};
      try {
        const rawUtm = sessionStorage.getItem(`unityteck_utm_${activeStore.id}`);
        if (rawUtm) utmAttrs = JSON.parse(rawUtm);
      } catch {
        // fallback
      }

      const resolvedSource = utmAttrs.source || (paymentChoice === 'mada' || paymentChoice === 'apple_pay' ? 'Direct' : 'WhatsApp');

      addOrder({
        customerName: customer.name,
        customerPhone: customer.phone || '+966 50 000 0000',
        itemsCount: cart.reduce((sum, item) => sum + item.quantity, 0),
        itemsSummary: cart.map(i => `${i.product.name} (x${i.quantity})`).join(', '),
        total: totalSnapshot,
        shippingFee: shippingFee,
        shippingCompany: 'Saudi Post (SPL)',
        source: resolvedSource,
        sourceDetails: `Public Storefront Web Checkout · Makkah Delivery (${districtSnapshot}) · ${customer.email}${utmAttrs.campaign ? ` · Campaign: ${utmAttrs.campaign}` : ''}`,
        deliveryLocation: districtSnapshot,
        shippingAddress: `${districtSnapshot}, Makkah, Kingdom of Saudi Arabia`,
        status: 'pending',
        paymentMethod:
          paymentChoice === 'mada'
            ? 'Mada'
            : paymentChoice === 'apple_pay'
              ? 'Apple Pay'
              : paymentChoice === 'tabby'
                ? 'Visa/MC'
                : 'COD',
        medium: utmAttrs.medium || (resolvedSource === 'Direct' ? 'Direct' : 'Web'),
        campaign: utmAttrs.campaign,
        utmTerm: utmAttrs.term,
        utmContent: utmAttrs.content,
      });

      // Fire GA4 ecommerce purchase event if gtag is available
      if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
        try {
          (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'purchase', {
            transaction_id: orderRef,
            value: totalSnapshot,
            currency: 'SAR',
            items: cart.map(i => ({
              item_id: i.product.id,
              item_name: i.product.name,
              price: i.product.price,
              quantity: i.quantity,
            })),
          });
        } catch {
          // ignore
        }
      }

      clearCart();
      setCouponApplied(false);
      setCouponCode('');
      setCheckoutComplete(false);
      setShowCartDrawer(false);
      setLastThankYou({ ref: orderRef, total: totalSnapshot, district: districtSnapshot });
      setSfPage('thankyou');
      setOrderToast({
        message: lang === 'ar'
          ? `تم استلام طلبك بنجاح لدى ${storeIdentity.storeName || activeStore.name}!`
          : `Order placed successfully at ${storeIdentity.storeName || activeStore.name}!`,
        show: true,
      });

      setTimeout(() => {
        setOrderToast(null);
      }, 4000);
    }, 1200);
  };

  const handleCheckout = () => {
    placeOrder();
  };

  const copySchemaJson = () => {
    navigator.clipboard.writeText(JSON.stringify(seoData.schema, null, 2));
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const openLightboxForProduct = (p: Product) => {
    const allProductImages: LightboxImageItem[] = currentProducts.map((prod) => ({
      id: prod.id,
      image: prod.image,
      title: prod.name,
      subtitle: `${prod.category} · ${prod.sku}`,
      price: prod.price,
    }));
    const idx = allProductImages.findIndex((item) => item.id === p.id);
    setLightboxData({
      isOpen: true,
      items: allProductImages,
      initialIndex: idx >= 0 ? idx : 0,
    });
  };

  const openLightboxForBento = () => {
    const bentoItems: LightboxImageItem[] = themeSettings.imageGrid.items.map((b) => ({
      image: b.image,
      title: b.title,
      subtitle: b.subtitle,
    }));
    if (bentoItems.length > 0) {
      setLightboxData({
        isOpen: true,
        items: bentoItems,
        initialIndex: 0,
      });
    }
  };

  const isDark = theme === 'dark' || themeSettings.colors.forceDarkMode;
  const sfBg = isDark
    ? (themeSettings.colors.primaryBgColor && themeSettings.colors.primaryBgColor !== '#FFFFFF' ? themeSettings.colors.primaryBgColor : '#04222b')
    : (themeSettings.colors.primaryBgColor || '#f8fafc');
  const sfSurface = isDark
    ? (themeSettings.colors.secondaryBgColor && themeSettings.colors.secondaryBgColor !== '#F8FAFC' ? themeSettings.colors.secondaryBgColor : '#ffffff')
    : (themeSettings.colors.secondaryBgColor || '#ffffff');
  const sfText = isDark ? '#f2fbf8' : '#0f172a';
  const sfMuted = isDark ? '#98d8d0' : '#475569';
  const sfBorder = isDark ? '#10606f' : '#cbd5e1';

  if (!isAdmin) {
    const effectiveTheme = isCoffeeStore ? 'theme-coffee-artisan' : isCarStore ? 'theme-saudia-transport' : themeId;
    const effectiveId = isCoffeeStore ? 'store-coffee' : isCarStore ? 'store-bleco' : activeStore.id;
    const effectiveCat = isCoffeeStore ? 'مكائن ومستلزمات القهوة' : isCarStore ? 'خدمات سيارات' : activeStore.category;
    return (
      <DynamicThemeRenderer
        storeId={effectiveId}
        themeId={effectiveTheme}
        category={effectiveCat}
        initialPage={sfPage}
        isAdmin={false}
      />
    );
  }

  return (
    <div className={isAdmin ? "p-2 sm:p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen" : "w-full min-h-screen"}>
      {orderToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-950 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="text-xs font-bold">{orderToast.message}</span>
          <button onClick={() => setOrderToast(null)} className="text-emerald-300 hover:text-white p-1 ml-2 transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Controller Bar — Exclusively available inside Admin Dashboard */}
      {isAdmin && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${
              isCarStore ? 'bg-[#127bfe] text-white shadow-blue-500/30' :
              isCoffeeStore ? 'bg-amber-900 text-amber-200' :
              'bg-emerald-600 text-white shadow-emerald-900/20'
            }`}>
              {isCarStore ? <Car className="w-5 h-5" /> : isCoffeeStore ? <Coffee className="w-5 h-5" /> : <Flower2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {getStoreDisplayName(activeStore, lang)} {lang === 'ar' ? '— الواجهة المباشرة' : 'Storefront'}
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                  isCarStore ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                  isCoffeeStore ? 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                  'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                }`}>
                  Live Storefront
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isCarStore
                  ? (lang === 'ar' ? 'متجر السعيدي لخدمات السيارات · تلابيس مقاعد وأرضيات ليزر ودايموند واكسسوارات سيارات' : 'Al-Saeedi Car Services · Precision Floor Mats & Luxury Seat Covers')
                  : isCoffeeStore
                  ? (lang === 'ar' ? 'متجر القهوة المختصة وأدوات الباريستا' : 'Specialty Coffee Roasters & Barista Tools')
                  : (lang === 'ar' ? 'متجر هدايا مكة للزهور الطبيعية والهدايا الفاخرة' : 'Makkah Al-Mukarramah flagship floral boutique')}
              </p>
            </div>
          </div>

          {/* Theme, Device, and Live SEO Switchers */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Open in New Tab Button (User Request) */}
            <a
              href={`${typeof window !== 'undefined' ? window.location.origin : ''}/?${isCarStore ? 'store=car&' : isCoffeeStore ? 'store=coffee&' : ''}fullscreen=1`}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-3.5 py-1.5 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 cursor-pointer ${
                isCarStore ? 'bg-[#127bfe] hover:bg-[#0d62cc]' : isCoffeeStore ? 'bg-amber-900 hover:bg-amber-800' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
              title={lang === 'ar' ? 'عرض المتجر المباشر في نافذة جديدة مستقلة' : 'Open live storefront in clean new browser tab'}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'فتح في نافذة جديدة' : 'Open in New Tab'}</span>
            </a>

            {/* Elementor Visual Builder Trigger (User Request) */}
            <button
              type="button"
              onClick={() => setShowVisualBuilder(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 cursor-pointer"
              title={lang === 'ar' ? 'محرر التصميم البصري الكامل بأسلوب إلمنتور' : 'Elementor-style visual theme builder & customizer'}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'محرر التصميم البصري' : 'Visual Builder'}</span>
            </button>

            {/* Public Storefront Live SEO Inspector Trigger */}
            <button
              onClick={() => setShowSEOModal(true)}
              className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Inspect dynamic Meta tags, Canonical URL, and Schema.org JSON-LD for this store"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>Store SEO &amp; Schema</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>

            {/* Theme Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs">
              <Palette className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
              <select
                value={themeId}
                onChange={(e) => setStoreTheme(activeStore.id, e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-2"
              >
                {themes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Multi-homepage: Eid / Ramadan / Valentine */}
            {isFlowersPremium ? (
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-1 rounded-2xl text-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 ml-1" />
                <select
                  value={homepageStyle}
                  onChange={(e) => {
                    setStoreHomepageStyle(activeStore.id, e.target.value);
                    setSfPage('home');
                  }}
                  className="bg-transparent text-xs font-bold text-emerald-900 dark:text-emerald-300 focus:outline-none cursor-pointer pr-2"
                >
                  {FLOWERS_HOMEPAGES.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {/* Theme Page Switcher Dropdown (Home, Catalog, Product Detail, Cart, Checkout, Policies) */}
            <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 p-1 rounded-2xl text-xs">
              <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ml-1.5" />
              <select
                value={sfPage}
                onChange={(e) => setSfPage(e.target.value as FlowersSfPage)}
                className="bg-transparent text-xs font-bold text-indigo-900 dark:text-indigo-200 focus:outline-none cursor-pointer pr-2"
                title={lang === 'ar' ? 'مبدل صفحات الثيم المباشر' : 'Theme Page Switcher'}
              >
                <option value="home">{lang === 'ar' ? 'الرئيسية (Home)' : 'Home (Homepage)'}</option>
                <option value="shop">{lang === 'ar' ? 'المتجر والمنتجات (Catalog / 100 Products)' : 'Catalog / Shop (All Products)'}</option>
                <option value="product">{lang === 'ar' ? 'صفحة تفاصيل المنتج (Single Product)' : 'Product Detail (Single Page)'}</option>
                <option value="cart">{lang === 'ar' ? 'سلة المشتريات (Cart Drawer / Page)' : 'Cart (Shopping Basket)'}</option>
                <option value="checkout">{lang === 'ar' ? 'إتمام الطلب والدفع (Checkout)' : 'Checkout (Payment Screen)'}</option>
                <option value="thankyou">{lang === 'ar' ? 'تم استلام الطلب (Thank You)' : 'Thank You Page'}</option>
                <option value="about">{lang === 'ar' ? 'صفحة من نحن (About Us)' : 'About Us'}</option>
                <option value="contact">{lang === 'ar' ? 'صفحة اتصل بنا (Contact Us)' : 'Contact Us'}</option>
                <option value="privacy">{lang === 'ar' ? 'سياسة الخصوصية (Privacy Policy)' : 'Privacy Policy'}</option>
                <option value="terms">{lang === 'ar' ? 'الشروط والأحكام (Terms & Conditions)' : 'Terms & Conditions'}</option>
              </select>
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs">
              <button
                onClick={() => setViewMode('desktop')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'desktop' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                onClick={() => setViewMode('tablet')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'tablet' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tablet</span>
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'mobile' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            {/* Client Portal Trigger Button */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Client Login / Register</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= STOREFRONT CONTAINER ================= */}
      <div
        data-sf-theme={isDark ? 'dark' : 'light'}
        className={`mx-auto transition-all duration-300 sf-shell ${
          isAdmin && viewMode === 'mobile' 
            ? 'max-w-[400px] max-h-[82vh] overflow-y-auto rounded-[48px] border-[10px] border-slate-900 shadow-2xl' 
            : isAdmin && viewMode === 'tablet'
              ? 'max-w-[768px] max-h-[85vh] overflow-y-auto rounded-[32px] border-[8px] border-slate-800 shadow-2xl'
              : isAdmin
                ? 'w-full rounded-3xl border shadow-md'
                : 'w-full'
        }`}
        style={{
          ['--sf-bg' as string]: sfBg,
          ['--sf-surface' as string]: sfSurface,
          ['--sf-text' as string]: sfText,
          ['--sf-muted' as string]: sfMuted,
          ['--sf-border' as string]: sfBorder,
          ['--sf-accent' as string]: activeAccent,
          ['--sf-ink' as string]: isDark ? '#04222b' : '#0a3d4a',
          ['--sf-card-shadow' as string]: isDark
            ? '0 8px 24px rgba(0,0,0,0.45)'
            : '0 8px 24px color-mix(in srgb, var(--sf-accent) 12%, transparent)',
          background: 'var(--sf-surface)',
          borderColor: 'var(--sf-border)',
          color: 'var(--sf-text)',
        }}
      >
        {true ? (
          <DynamicThemeRenderer
            storeId={isCoffeeStore ? 'store-coffee' : isCarStore ? 'store-bleco' : activeStore.id}
            themeId={isCoffeeStore ? 'theme-coffee-artisan' : isCarStore ? 'theme-saudia-transport' : themeId}
            category={isCoffeeStore ? 'مكائن ومستلزمات القهوة' : isCarStore ? 'خدمات سيارات' : activeStore.category}
            initialPage={sfPage}
            isAdmin={isAdmin}
          />
        ) : (
          <>
            {/* 1. STOREFRONT TOP ANNOUNCEMENT BAR */}
        {themeSettings.announcementBar.enabled ? (
          <SfAnnouncementBar
            settings={themeSettings.announcementBar}
            phone={storeIdentity.phone}
            lang={lang}
            currency={currency}
            onCtaClick={() => setSfPage('shop')}
          />
        ) : (
          <div className="bg-[#021816] text-white px-4 py-2 text-[11px] font-medium flex items-center justify-between border-b border-emerald-950 gap-2">
            <div className="flex items-center gap-2 truncate min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span className="truncate">
                {lang === 'ar'
                  ? 'توصيل سريع خلال ساعتين لكافة أحياء وفنادق مكة · '
                  : 'Express 2-hour delivery in Makkah · '}
                <span className="opacity-80">{currency}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a href={`tel:${storeIdentity.phone.replace(/\s/g, '')}`} className="hidden sm:flex items-center gap-1 text-emerald-300 hover:text-white">
                <Phone className="w-3 h-3" />
                <span>{storeIdentity.phone}</span>
              </a>
              <PrefsSwitcher showCurrency compact />
            </div>
          </div>
        )}

        {/* 2. STOREFRONT MAIN HEADER */}
        <header
          className="border-b px-3 sm:px-8 py-3.5 sm:py-4 transition-colors"
          style={{
            background: activeHeaderBg,
            color: themeSettings.colors.headerTextColor || '#ffffff',
            borderColor: 'rgba(255,255,255,0.12)',
          }}
        >
          <div className={`flex items-center justify-between gap-3 ${
            themeSettings.general.headerLayout === 'centered' ? 'flex-col sm:flex-row text-center' : ''
          }`}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Mobile Hamburger Menu Toggle Button (Visible on mobile view ONLY) */}
              {viewMode === 'mobile' && (
                <button
                  type="button"
                  onClick={() => setShowMobileMenu(true)}
                  className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title={lang === 'ar' ? 'القائمة الرئيسية' : 'Open Navigation Menu'}
                >
                  {(() => {
                    const iconItem = AVAILABLE_ICONS.find((i) => i.id === themeSettings.general.mobileMenuIcon) || AVAILABLE_ICONS[0];
                    const IconComp = iconItem.icon;
                    return <IconComp className="w-5 h-5" />;
                  })()}
                </button>
              )}

              <div className="relative shrink-0">
                {themeSettings.general.alternativeLogoUrl || storeIdentity.logoUrl || activeStore.logo ? (
                  <img
                    src={themeSettings.general.alternativeLogoUrl || storeIdentity.logoUrl || activeStore.logo}
                    alt={storeIdentity.storeName}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=120&q=80';
                    }}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover shadow-lg border border-white/20"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40">
                    <Flower2 className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="font-black text-sm sm:text-xl tracking-tight flex items-center gap-1.5 truncate">
                  <span className="truncate">
                    {(!storeIdentity.storeName || storeIdentity.storeName.includes('Loading'))
                      ? (lang === 'ar' ? 'زهور مكة الطازجة' : 'Makkah Fresh Flowers')
                      : storeIdentity.storeName}
                  </span>
                  <span className="text-[9px] sm:text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 sm:px-2 py-0.5 rounded-full font-sans shrink-0">
                    {lang === 'ar' ? 'مكة' : 'Makkah'}
                  </span>
                </h1>
                <p className="text-[10px] sm:text-[11px] opacity-80 truncate">
                  {lang === 'ar' ? storeIdentity.taglineAr : storeIdentity.taglineEn}
                </p>
              </div>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xs relative mx-4">
              <Search className="w-3.5 h-3.5 opacity-60 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={lang === 'ar' ? 'ابحث عن باقة، فازة، أو هدية...' : 'Search floral bouquets or gifts...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-black/20 border border-white/20 rounded-xl text-xs placeholder-white/60 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            {/* Actions: Track Order · Profile · Wishlist · Cart */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setSfPage('track-order')}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-current text-xs font-bold transition-colors cursor-pointer"
                title={lang === 'ar' ? 'تتبع طلبك المباشر' : 'Track your order'}
              >
                <Truck className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden lg:inline">{lang === 'ar' ? 'تتبع الطلب' : 'Track'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!sfCustomer) {
                    setShowCustomerLogin(true);
                    return;
                  }
                  setSfPage('profile');
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-current transition-colors cursor-pointer"
                title={sfCustomer ? (lang === 'ar' ? 'ملفي' : 'Profile') : (lang === 'ar' ? 'دخول العميل' : 'Customer login')}
              >
                <User className="w-4 h-4" />
              </button>
              <div className="relative">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-current transition-colors">
                  <Heart className="w-4 h-4" />
                </div>
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </div>

              <button
                onClick={() => setShowCartDrawer(true)}
                className="relative px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">{lang === 'ar' ? 'السلة' : 'Bag'}</span>
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-950 text-emerald-400 text-[10px] sm:text-[11px] font-black flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Modern Luxury Desktop/Tablet Navigation Bar — Strictly hidden on mobile */}
        {isFlowersPremium && viewMode !== 'mobile' ? (
          <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 py-2.5 flex items-center justify-between gap-2 overflow-x-auto text-xs font-semibold shadow-xs relative">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <button
                type="button"
                onClick={() => setSfPage('home')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap cursor-pointer transition-all duration-200 flex items-center gap-1.5 ${
                  sfPage === 'home'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold scale-[1.02]'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'الرئيسية' : 'Home'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSfPage('shop')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap cursor-pointer transition-all duration-200 flex items-center gap-1.5 ${
                  sfPage === 'shop'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold scale-[1.02]'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'المتجر والمنتجات' : 'Shop'}</span>
              </button>

              {/* Categories & Brands Dropdown in Navbar */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNavCategoriesOpen(!navCategoriesOpen)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap cursor-pointer transition-all duration-200 flex items-center gap-1.5 ${
                    navCategoriesOpen || selectedCategory !== 'All' || selectedBrand !== 'All'
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'ar' ? 'الأقسام والماركات' : 'Categories & Brands'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${navCategoriesOpen ? 'rotate-180' : ''}`} />
                </button>

                {navCategoriesOpen && (
                  <div className="absolute top-full start-0 mt-2 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div>
                      <span className="text-[10px] font-black uppercase text-muted tracking-wider block px-2 mb-1.5">
                        {lang === 'ar' ? 'أقسام المتجر الرئيسية' : 'Store Categories'}
                      </span>
                      <div className="space-y-1">
                        {FLOWERS_CIRCLE_CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat.filter);
                              setSelectedBrand('All');
                              setSfPage('shop');
                              setNavCategoriesOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              selectedCategory === cat.filter
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <img src={cat.image} alt="" className="w-6 h-6 rounded-full object-cover border border-emerald-500/30" />
                              <span>{lang === 'ar' ? cat.nameAr : cat.nameEn}</span>
                            </div>
                            {typeof categoryCounts[cat.filter] === 'number' && (
                              <span className="text-[10px] opacity-75 font-mono">
                                ({categoryCounts[cat.filter]})
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {allBrands.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                        <span className="text-[10px] font-black uppercase text-muted tracking-wider block px-2">
                          {lang === 'ar' ? 'العلامات التجارية والماركات' : 'Brands & Designers'}
                        </span>
                        <div className="flex flex-wrap gap-1 px-1">
                          {allBrands.map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => {
                                setSelectedBrand(b);
                                setSelectedCategory('All');
                                setSfPage('shop');
                                setNavCategoriesOpen(false);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                selectedBrand === b
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span>{b}</span>
                              {typeof brandCounts[b] === 'number' && (
                                <span className="ms-1 opacity-70">({brandCounts[b]})</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {(
                [
                  ['track-order', lang === 'ar' ? 'تتبع الطلب' : 'Track Order', Truck],
                  ['blog', lang === 'ar' ? 'المدونة' : 'Blog', BookOpen],
                  ['about', lang === 'ar' ? 'من نحن' : 'About', Info],
                  ['contact', lang === 'ar' ? 'تواصل' : 'Contact', Phone],
                  ['location', lang === 'ar' ? 'الموقع' : 'Location', MapPin],
                  ['privacy', lang === 'ar' ? 'الخصوصية' : 'Privacy', ShieldCheck],
                  ['return', lang === 'ar' ? 'الإرجاع' : 'Returns', RotateIcon],
                ] as Array<[FlowersSfPage, string, React.ComponentType<{ className?: string }>]>
              ).map(([id, label, NavIcon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSfPage(id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap cursor-pointer transition-all duration-200 flex items-center gap-1.5 ${
                    sfPage === id
                      ? 'bg-emerald-600 text-white shadow-xs font-bold scale-[1.02]'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600'
                  }`}
                >
                  <NavIcon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}

              {/* Any custom menu items from theme settings */}
              {themeSettings.general.customNavigationMenu?.filter(m => m.active && m.url === 'custom-page').map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCustomPageContent({
                      title: lang === 'ar' ? c.labelAr : c.labelEn,
                      body: (lang === 'ar' ? c.bodyAr : c.bodyEn) || '',
                    });
                    setSfPage('custom-page');
                  }}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap cursor-pointer transition-all duration-200 ${
                    sfPage === 'custom-page' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {lang === 'ar' ? c.labelAr : c.labelEn}
                </button>
              ))}
            </div>

            {/* Right Side: Quick Live Delivery Badge */}
            <div className="hidden xl:flex items-center gap-2 shrink-0 ps-3 border-s border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{lang === 'ar' ? 'توصيل مبرد ٢ ساعة لمكة' : '2h Chilled Delivery'}</span>
            </div>
          </nav>
        ) : null}

        {sfPage === 'product' && quickViewProduct ? (
          <SingleProductView
            product={quickViewProduct!}
            products={currentProducts}
            lang={lang}
            money={money}
            onAddToCart={(p, qty) => {
              for (let i = 0; i < qty; i++) addToCart(p);
              setShowCartDrawer(true);
            }}
            onBuyNow={(p, qty) => {
              for (let i = 0; i < qty; i++) addToCart(p);
              setShowCartDrawer(true);
            }}
            onBackToShop={() => setSfPage('shop')}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setSelectedBrand('All');
              setSfPage('shop');
            }}
            onSelectProduct={(p) => setQuickViewProduct(p)}
            onOpenLightbox={(p) => openLightboxForProduct(p)}
            inWishlist={quickViewProduct ? wishlist.includes(quickViewProduct!.id) : false}
            onToggleWishlist={() => quickViewProduct && toggleWishlist(quickViewProduct!.id)}
            shippingRates={currentShipping}
            selectedDistrict={selectedMakkahDistrict}
            onSelectDistrict={(d) => setSelectedMakkahDistrict(d)}
            videoUrl={themeSettings.detailedProducts.productVideoUrl}
          />
        ) : sfPage === 'track-order' ? (
          <TrackOrderPage
            lang={lang}
            orders={currentOrders}
            money={money}
            onBack={() => setSfPage('home')}
            initialOrderRef={lastThankYou?.ref}
          />
        ) : sfPage === 'blog' ? (
          <BlogPageView
            articles={themeSettings.blog.articles}
            lang={lang}
            onBack={() => setSfPage('home')}
            onGoToShop={() => setSfPage('shop')}
          />
        ) : sfPage === 'custom-page' ? (
          <div className="p-6 sm:p-10 max-w-3xl mx-auto space-y-4 min-h-[360px]">
            <button
              type="button"
              onClick={() => setSfPage('home')}
              className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              <span>{lang === 'ar' ? 'العودة للمتجر' : 'Back to shop'}</span>
            </button>
            <h1 className="text-2xl font-black" style={{ color: 'var(--sf-text)' }}>
              {customPageContent?.title || (lang === 'ar' ? 'صفحة مخصصة' : 'Custom Page')}
            </h1>
            <div className="prose max-w-none text-sm leading-relaxed" style={{ color: 'var(--sf-text)' }}>
              {customPageContent?.body || (lang === 'ar' ? 'أهلاً بكم في متجرنا بمكة المكرمة.' : 'Welcome to our specialized boutique page.')}
            </div>
          </div>
        ) : getStorePageBySlug(activeStore.id, sfPage, activeStore) ? (() => {
          const storePage = getStorePageBySlug(activeStore.id, sfPage, activeStore)!;
          return (
            <div className="p-6 sm:p-12 max-w-4xl mx-auto space-y-6 min-h-[420px]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <button
                type="button"
                onClick={() => setSfPage('home')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1.5 cursor-pointer bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 transition-colors shadow-2xs"
              >
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{lang === 'ar' ? 'العودة للمتجر الرئيسي' : 'Back to Storefront'}</span>
              </button>
              <div className="border-b border-slate-200/80 pb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-2">
                  {storePage.category === 'legal'
                    ? (lang === 'ar' ? 'وثيقة نظامية رسمية' : 'Official Legal Document')
                    : (lang === 'ar' ? 'صفحة المتجر' : 'Store Page')}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900" style={{ color: 'var(--sf-text)' }}>
                  {lang === 'ar' ? storePage.titleAr : storePage.titleEn}
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {storeIdentity.storeName || activeStore.name} · {storePage.updatedAt}
                </p>
              </div>
              <div
                className="prose max-w-none text-sm leading-relaxed whitespace-pre-line text-slate-700"
                style={{ color: 'var(--sf-text)' }}
              >
                {lang === 'ar' ? storePage.contentAr : storePage.contentEn}
              </div>
            </div>
          );
        })() : isStaticFlowersPage(sfPage) ? (
          <FlowersStaticPage page={sfPage as any} lang={lang} onBack={() => setSfPage('home')} />
        ) : sfPage === 'thankyou' ? (
          <ThankYouPage
            lang={lang}
            storeName={storeIdentity.storeName || activeStore.name}
            orderRef={lastThankYou?.ref}
            district={lastThankYou?.district}
            moneyTotal={lastThankYou ? money(lastThankYou!.total) : undefined}
            onContinueShopping={() => setSfPage('shop')}
            onOpenProfile={() => {
              if (!sfCustomer) {
                setShowCustomerLogin(true);
                return;
              }
              setSfPage('profile');
            }}
          />
        ) : sfPage === 'profile' ? (
          sfCustomer ? (
            <CustomerProfile
              lang={lang}
              session={sfCustomer!}
              orders={currentOrders}
              money={money}
              onLogout={() => {
                clearSfCustomer(activeStore.id);
                setSfCustomer(null);
                setSfPage('home');
              }}
              onBack={() => setSfPage('home')}
            />
          ) : (
            <div className="p-8 sm:p-14 max-w-lg mx-auto text-center space-y-5 my-8">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 mx-auto flex items-center justify-center shadow-md">
                <UserCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {lang === 'ar' ? 'بوابة عملاء زهور مكة' : 'Makkah Customer Portal'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {lang === 'ar'
                  ? 'يرجى تسجيل الدخول أو إنشاء حساب عميل لمتابعة سجل الطلبات، تتبع الشحنات المباشر، وحفظ عناوين التوصيل في فنادق وأحياء مكة المكرمة.'
                  : 'Please sign in or create an account to view your order history, live tracking, and saved delivery addresses in Makkah hotels & districts.'}
              </p>
              <button
                type="button"
                onClick={() => setShowCustomerLogin(true)}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تسجيل الدخول / إنشاء حساب عميل' : 'Customer Sign In / Register'}</span>
              </button>
            </div>
          )
        ) : (
          <>
        {/* 3. HERO SLIDER — seasonal by homepage (Eid / Ramadan / Valentine) */}
        {/* 3. HERO SLIDER — custom Theme Settings (Section 05) or seasonal fallback */}
        {(sfPage === 'home' || sfPage === 'shop') && (
          (homepageStyle as string) === 'Luxury Flower Scroll Hero' || (themeSettings.slider as any)?.heroWidgetType === 'flower-scroll-hero' ? (
            <FlowerFrameHero
              lang={lang}
              isMobile={isMobileMode}
              onCtaClick={() => setSfPage('shop')}
              onSecondaryCtaClick={() => setSfPage('shop')}
            />
          ) : themeSettings.slider.slides.length > 0 ? (
            <SfHeroSlider
              settings={themeSettings.slider}
              lang={lang}
              isMobile={isMobileMode}
              onCtaClick={() => setSfPage('shop')}
            />
          ) : (
            <div className={`relative overflow-hidden bg-slate-950 ${
              isMobileMode ? 'min-h-[220px] aspect-16/9' : 'aspect-16/7 sm:aspect-21/8'
            }`}>
              {heroSlides.map((slide, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={lang === 'ar' ? slide.titleAr : slide.titleEn}
                    className="w-full h-full object-cover object-center filter brightness-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent flex flex-col justify-end p-4 sm:p-10 text-white">
                    <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 bg-emerald-500/90 text-slate-950 font-black text-[9px] sm:text-xs rounded-full mb-1.5 self-start shadow-md">
                      {slide.badge}
                    </span>
                    <h2 className="text-base sm:text-3xl lg:text-4xl font-black max-w-2xl leading-tight drop-shadow-md">
                      {lang === 'ar' ? slide.titleAr : slide.titleEn}
                    </h2>
                    <p className="hidden sm:block text-xs sm:text-sm text-slate-200 mt-1 max-w-xl drop-shadow-sm line-clamp-2">
                      {lang === 'ar' ? slide.subtitleAr : slide.subtitleEn}
                    </p>
                    <div className="mt-2.5 sm:mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSfPage('shop')}
                        className="px-3.5 py-1.5 sm:px-5 sm:py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] sm:text-xs rounded-xl shadow-lg transition-transform active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{lang === 'ar' ? slide.ctaAr : slide.ctaEn}</span>
                        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Slider Controls */}
              <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
                <button
                  onClick={() => setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))}
                  className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1))}
                  className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        )}

        {/* Seasonal homepage badge */}
        {sfPage === 'home' ? (
          <div className="px-4 sm:px-6 py-2 bg-emerald-50 border-b border-emerald-100 text-[11px] font-bold text-emerald-900 flex items-center justify-between gap-2">
            <span>
              {lang === 'ar' ? 'الصفحة الرئيسية المختارة:' : 'Active homepage:'} {homepageStyle}
            </span>
            <span className="text-emerald-700 font-semibold">
              {currentProducts.length} {lang === 'ar' ? 'منتجات ورد طبيعي' : 'real flower products'}
            </span>
          </div>
        ) : null}

        {/* 4. ENHANCED FEATURES / TRUST (SECTION 14) */}
        {sfPage === 'home' && themeSettings.enhancedFeatures.enabled && (
          <SfEnhancedFeatures
            settings={themeSettings.enhancedFeatures}
            lang={lang}
            isMobile={isMobileMode}
            mobileDisplayMode={mobileGridCols}
          />
        )}

        {/* 5. DISTRICT DELIVERY SELECTOR BAR */}
        <div
          className="border-y px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          style={{
            background: 'var(--sf-bg)',
            borderColor: 'var(--sf-border)',
            color: 'var(--sf-text)',
          }}
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">
              {lang === 'ar' ? 'حدد موقع التوصيل في مكة المكرمة:' : 'Deliver to Makkah District:'}
            </span>
            <select
              value={selectedMakkahDistrict}
              onChange={(e) => setSelectedMakkahDistrict(e.target.value)}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer border"
              style={{
                background: 'var(--sf-surface)',
                borderColor: 'var(--sf-border)',
                color: 'var(--sf-text)',
              }}
            >
              {currentShipping.map(s => (
                <option key={s.id} value={s.cityName} style={{ background: 'var(--sf-surface)', color: 'var(--sf-text)' }}>
                  {s.cityName} ({lang === 'ar' ? 'رسوم التوصيل: ' : 'Delivery Fee: '}{s.rate === 0 ? (lang === 'ar' ? 'مجاني' : 'Free') : money(s.rate)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--sf-muted)' }}>
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              <Truck className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'سيارات مجهزة تبريد 18°C' : 'Chilled 18°C Fleet'}</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 font-semibold text-blue-600">
              <Clock className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'توصيل خلال ساعتين' : 'Delivery within 2 Hours'}</span>
            </span>
          </div>
        </div>

        {/* 6. CIRCLE CATEGORIES (images) */}
        <CircleCategories
          lang={lang}
          selectedFilter={selectedCategory}
          onSelect={(filter) => {
            setSelectedCategory(filter);
            setSelectedBrand('All');
            setSfPage('shop');
          }}
          productCounts={categoryCounts}
          onSelectBrand={(brand) => {
            setSelectedBrand(brand);
            setSelectedCategory('All');
            setSfPage('shop');
          }}
          selectedBrand={selectedBrand}
        />

        {/* 7. SHOP BY CATEGORY / CUSTOM LINKS (SECTION 10) */}
        {sfPage === 'home' && themeSettings.customLinks.enabled && (
          <SfShopByCategory
            settings={themeSettings.customLinks}
            lang={lang}
            isMobile={isMobileMode}
            mobileDisplayMode={mobileGridCols}
            onCategoryClick={(target, linkType) => {
              if (linkType === 'Brand') {
                setSelectedBrand(target);
                setSelectedCategory('All');
              } else {
                setSelectedCategory(target);
                setSelectedBrand('All');
              }
              setSfPage('shop');
            }}
          />
        )}

        {/* 8. SPECIAL OFFER COUNTDOWN (SECTION 17) */}
        {sfPage === 'home' && themeSettings.specialOffer.enabled && (
          <SfSpecialOfferCountdown
            settings={themeSettings.specialOffer}
            lang={lang}
            onCtaClick={() => setSfPage('shop')}
          />
        )}

        {/* 9. PRODUCT TABS SECTION (SECTION 07) */}
        {sfPage === 'home' && themeSettings.tabs.enabled && (
          <SfProductTabs
            settings={themeSettings.tabs}
            products={currentProducts}
            lang={lang}
            money={money}
            isMobile={isMobileMode}
            mobileDisplayMode={mobileGridCols}
            onAddToCart={(p) => addToCart(p)}
            onQuickView={(p) => {
              setQuickViewProduct(p);
              setSfPage('product');
            }}
          />
        )}

        {/* 10. DETAILED PRODUCT SPOTLIGHT (SECTION 08) */}
        {sfPage === 'home' && themeSettings.detailedProducts.enabled && (
          <SfDetailedProductSpotlight
            settings={themeSettings.detailedProducts}
            products={currentProducts}
            lang={lang}
            money={money}
            onAddToCart={(p, q) => {
              for (let i = 0; i < q; i++) addToCart(p);
              setShowCartDrawer(true);
            }}
            onBuyNow={(p, q) => {
              for (let i = 0; i < q; i++) addToCart(p);
              setShowCartDrawer(true);
            }}
            onViewProduct={(p) => {
              setQuickViewProduct(p);
              setSfPage('product');
            }}
          />
        )}

        {/* 11. MAIN PRODUCTS CARDS GRID (archive / shop) */}
        <main
          id="store-products-grid"
          className={`p-4 sm:p-6 space-y-6 ${
            themeSettings.general.categoryLayoutWidth === 'fullwidth' ? 'w-full' : 'max-w-7xl mx-auto'
          }`}
        >
          {/* Catalog Header with Category/Brand Context */}
          <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-4" style={{ borderColor: 'var(--sf-border)' }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                  {selectedCategory !== 'All' ? selectedCategory : selectedBrand !== 'All' ? `${lang === 'ar' ? 'ماركة' : 'Brand'}: ${selectedBrand}` : (lang === 'ar' ? 'تشكيلة المتجر' : 'Catalog')}
                </span>
                <span className="text-xs text-muted">
                  ({filteredProducts.length} {lang === 'ar' ? 'منتج متوفر' : 'products'})
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black" style={{ color: 'var(--sf-text)' }}>
                {selectedCategory !== 'All'
                  ? selectedCategory
                  : selectedBrand !== 'All'
                    ? selectedBrand
                    : (lang === 'ar' ? 'تشكيلة الزهور الطبيعية الفاخرة' : 'Luxury Fresh Flowers Catalog')}
              </h3>
            </div>

            {/* Filter & Sort & View Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Button */}
              <button
                type="button"
                onClick={() => setShowFilterDrawer(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                style={{ color: 'var(--sf-text)' }}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === 'ar' ? 'تصفية وفلترة' : 'Filters'}</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Sort Order Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none cursor-pointer"
                style={{ color: 'var(--sf-text)' }}
              >
                <option value="featured">{lang === 'ar' ? 'المميزة' : 'Featured'}</option>
                <option value="popular">{lang === 'ar' ? 'الأكثر مبيعاً' : 'Best Sellers'}</option>
                <option value="price-asc">{lang === 'ar' ? 'السعر (أقل للأعلى)' : 'Price: Low'}</option>
                <option value="price-desc">{lang === 'ar' ? 'السعر (أعلى للأقل)' : 'Price: High'}</option>
              </select>

              {/* Mobile Columns Switcher */}
              {isMobileMode && (
                <div
                  className="flex items-center gap-1 p-1 rounded-xl border bg-white dark:bg-slate-800 text-xs shadow-2xs"
                  style={{ borderColor: 'var(--sf-border)' }}
                >
                  <button
                    type="button"
                    onClick={() => setMobileGridCols('2-columns')}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      mobileGridCols === '2-columns'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    2 Col
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileGridCols('1-column')}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      mobileGridCols === '1-column'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    1 Col
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Filter Chips Ribbon */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[11px] font-bold text-muted">{lang === 'ar' ? 'الفلاتر النشطة:' : 'Active filters:'}</span>

              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                  <span>{selectedCategory}</span>
                  <button type="button" onClick={() => setSelectedCategory('All')} className="hover:opacity-75 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedBrand !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold text-[11px]">
                  <span>{selectedBrand}</span>
                  <button type="button" onClick={() => setSelectedBrand('All')} className="hover:opacity-75 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {inStockOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                  <span>{lang === 'ar' ? 'متوفر فقط' : 'In Stock Only'}</span>
                  <button type="button" onClick={() => setInStockOnly(false)} className="hover:opacity-75 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedBrand('All');
                  setInStockOnly(false);
                }}
                className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer ms-1"
              >
                {lang === 'ar' ? 'مسح الكل' : 'Clear All'}
              </button>
            </div>
          )}

          {/* Product Cards Grid or Empty State */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 space-y-3 rounded-3xl border border-dashed p-8" style={{ borderColor: 'var(--sf-border)' }}>
              <Package className="w-12 h-12 text-muted mx-auto opacity-50" />
              <h4 className="font-black text-base" style={{ color: 'var(--sf-text)' }}>
                {lang === 'ar' ? 'لم يتم العثور على منتجات مطابقة' : 'No products found'}
              </h4>
              <p className="text-xs text-muted max-w-sm mx-auto">
                {lang === 'ar'
                  ? 'جرّب تغيير خيارات التصفية أو مسح الفلاتر لعرض كافة باقات الزهور المتوفرة'
                  : 'Try adjusting your filters or search term to see available products'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedBrand('All');
                  setInStockOnly(false);
                  setSearchTerm('');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                {lang === 'ar' ? 'إعادة عرض كافة المنتجات' : 'View All Products'}
              </button>
            </div>
          ) : (
            <div className={
              isMobileMode
                ? mobileGridCols === '1-column'
                  ? 'grid grid-cols-1 gap-4'
                  : 'grid grid-cols-2 gap-3'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5'
            }>
              {filteredProducts.map((prod) => {
                const inWishlist = wishlist.includes(prod.id);
                const inCart = cart.find((i) => i.product.id === prod.id);
                return (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    lang={lang}
                    money={money}
                    inCartQty={inCart?.quantity}
                    inWishlist={inWishlist}
                    onAddToCart={() => addToCart(prod)}
                    onQuickView={() => {
                      setQuickViewProduct(prod);
                      setSfPage('product');
                    }}
                    onToggleWishlist={() => toggleWishlist(prod.id)}
                  />
                );
              })}
            </div>
          )}
        </main>

        {/* 12. PRODUCT VIDEOS (SECTION 06) */}
        {sfPage === 'home' && themeSettings.videos.enabled && (
          <SfProductVideos
            settings={themeSettings.videos}
            lang={lang}
            money={money}
            isMobile={isMobileMode}
          />
        )}

        {/* 13. BENTO IMAGE GRID (SECTION 09) */}
        {sfPage === 'home' && themeSettings.imageGrid.enabled && (
          <SfBentoImageGrid
            settings={themeSettings.imageGrid}
            lang={lang}
            isMobile={isMobileMode}
            onItemClick={openLightboxForBento}
          />
        )}

        {/* 14. PROMOTIONAL BANNERS (SECTION 11) */}
        {sfPage === 'home' && themeSettings.banners.enabled && (
          <SfPromotionalBanner
            settings={themeSettings.banners}
            lang={lang}
            onCtaClick={() => setSfPage('shop')}
          />
        )}

        {sfPage === 'home' && isFlowersPremium ? (
          <>
            <HomeReviews lang={lang} isMobile={isMobileMode} />
            <HomeFaq lang={lang} />
          </>
        ) : null}

        {/* 15. STORE STATISTICS (SECTION 18) */}
        {sfPage === 'home' && themeSettings.statistics.enabled && (
          <SfStoreStatistics
            settings={themeSettings.statistics}
            lang={lang}
            isMobile={isMobileMode}
          />
        )}

        {/* 15.5. SPECIAL OFFER VIDEO BANNER (BEFORE BLOGS) */}
        {sfPage === 'home' && (
          <OfferVideoBanner />
        )}

        {/* 16. BLOG SECTION (SECTION 12) */}
        {sfPage === 'home' && themeSettings.blog.enabled && (
          <SfBlogSection
            settings={themeSettings.blog}
            lang={lang}
            onViewAll={() => setSfPage('blog')}
            onReadArticle={() => setSfPage('blog')}
          />
        )}

        {/* 17. WHY CHOOSE WARD AL-MAKKAH */}
        <div className="bg-[#032320] text-white p-6 sm:p-10 border-t border-emerald-950 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="text-xl sm:text-2xl font-black">
              لماذا يختارنا زوار وأهل مكة المكرمة؟
            </h3>
            <p className="text-xs text-emerald-200/80">
              خدمة راقية تليق بقدسية المكان وضيافة ضيوف الرحمن
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-emerald-950/60 border border-emerald-800/40 p-5 rounded-3xl text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm">قطاف هولندي يومي</h4>
              <p className="text-xs text-emerald-200/70 leading-relaxed">
                ورود جوري، ليليوم، وأوركيد طازجة يتم شحنها مبردة يومياً لضمان بقائها أكثر من 10 أيام.
              </p>
            </div>

            <div className="bg-emerald-950/60 border border-emerald-800/40 p-5 rounded-3xl text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm">توصيل فنادق الحرم المباشر</h4>
              <p className="text-xs text-emerald-200/70 leading-relaxed">
                تسليم فوري ومباشر لغرف وأجنحة أبراج الساعة، جبل عمر، وفنادق المنطقة المركزية.
              </p>
            </div>

            <div className="bg-emerald-950/60 border border-emerald-800/40 p-5 rounded-3xl text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm">دفع سعودي آمن (مدى وApple Pay)</h4>
              <p className="text-xs text-emerald-200/70 leading-relaxed">
                بوابات دفع مشفرة ومتوافقة مع هيئة الزكاة والضريبة والجمارك (ZATCA) مع فاتورة إلكترونية فورية.
              </p>
            </div>
          </div>
        </div>
          </>
        )}

        {/* 8. FOOTER */}
        <footer
          className="text-xs p-6 sm:p-10 border-t transition-colors"
          style={{
            background: activeFooterBg,
            borderColor: 'rgba(255,255,255,0.1)',
            color: '#94a3b8',
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Flower2 className="w-5 h-5 text-emerald-500" />
                <span>زهور مكة الفاخرة</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                بوتيك الأزهار الطبيعية والهدايا الملكية الرائد في العاصمة المقدسة.
              </p>
              <div className="text-[10px] text-emerald-400 font-mono">
                س.ت: {storeIdentity.commercialReg} · رقم ضريبي: {storeIdentity.vatNumber}
              </div>
            </div>

            <div className="space-y-1.5">
              <h5 className="font-bold text-white text-xs mb-2">أقسام المتجر</h5>
              <button type="button" onClick={() => setSfPage('shop')} className="block hover:text-white cursor-pointer text-start">باقات الورد الطبيعي</button>
              <button type="button" onClick={() => setSfPage('shop')} className="block hover:text-white cursor-pointer text-start">فازات الليليوم الفاخرة</button>
              <button type="button" onClick={() => setSfPage('about')} className="block hover:text-white cursor-pointer text-start">من نحن</button>
              <button type="button" onClick={() => setSfPage('track-order')} className="block hover:text-white cursor-pointer text-start font-bold text-amber-300">تتبع الطلب المباشر</button>
              <button type="button" onClick={() => setSfPage('blog')} className="block hover:text-white cursor-pointer text-start">المدونة ونصائح الورد</button>
              <button type="button" onClick={() => setSfPage('return')} className="block hover:text-white cursor-pointer text-start">سياسة الإرجاع</button>
            </div>

            <div className="space-y-1.5">
              <h5 className="font-bold text-white text-xs mb-2">التوصيل وخدمة العملاء</h5>
              <button type="button" onClick={() => setSfPage('location')} className="block hover:text-white cursor-pointer text-start">موقع المتجر بمكة</button>
              <button type="button" onClick={() => setSfPage('contact')} className="block hover:text-white cursor-pointer text-start">تواصل معنا</button>
              <button type="button" onClick={() => setSfPage('privacy')} className="block hover:text-white cursor-pointer text-start">الخصوصية</button>
              <a href={whatsappOrderHref(lang, [])} target="_blank" rel="noopener noreferrer" className="block hover:text-white">واتساب المباشر: +966 50 442 8819</a>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-white text-xs mb-2">طرق الدفع المعتمدة</h5>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 bg-white/10 rounded-lg text-[10px] font-bold text-white">مدى Mada</span>
                <span className="px-2.5 py-1 bg-white/10 rounded-lg text-[10px] font-bold text-white">Apple Pay</span>
                <span className="px-2.5 py-1 bg-white/10 rounded-lg text-[10px] font-bold text-white">Tabby تابي</span>
                <span className="px-2.5 py-1 bg-white/10 rounded-lg text-[10px] font-bold text-white">الدفع عند الاستلام</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[11px]">
            <div>
              © 2026 {activeStore.name}. جميع الحقوق محفوظة لمتجر زهور مكة المكرمة.
            </div>
            {isAdmin && (
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-bold">Premium flowers theme · {homepageStyle}</span>
                <span>·</span>
                <button onClick={() => setShowSEOModal(true)} className="text-emerald-300 hover:underline cursor-pointer">
                  View Schema.org JSON-LD
                </button>
              </div>
            )}
          </div>
        </footer>

        {/* 18. FLOATING ACTION BUTTONS (SECTION 03) — Public storefront only */}
        {!isAdmin && (
          <SfFloatingButtons
            settings={themeSettings.colors}
            whatsappHref={whatsappOrderHref(lang, [])}
          />
        )}

        {/* 19. MOBILE BOTTOM NAVIGATION */}
        {isMobileMode && (
          <MobileBottomNav
            activePage={sfPage}
            onSelectPage={(page) => setSfPage(page)}
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
            wishlistCount={wishlist.length}
            onOpenCart={() => setShowCartDrawer(true)}
            onOpenProfile={() => {
              if (!sfCustomer) setShowCustomerLogin(true);
              else setSfPage('profile');
            }}
            lang={lang}
          />
        )}

        {/* 20. MOBILE MENU DRAWER */}
        <MobileMenuDrawer
          isOpen={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
          activePage={sfPage}
          onSelectPage={(page, customItem) => {
            if (page === 'custom-page' && customItem) {
              setCustomPageContent({
                title: lang === 'ar' ? customItem.labelAr : customItem.labelEn,
                body: (lang === 'ar' ? customItem.bodyAr : customItem.bodyEn) || '',
              });
            }
            setSfPage(page);
          }}
          storeName={storeIdentity.storeName || activeStore.name}
          storeLogo={themeSettings.general.alternativeLogoUrl || storeIdentity.logoUrl || activeStore.logo}
          tagline={lang === 'ar' ? storeIdentity.taglineAr : storeIdentity.taglineEn}
          phone={storeIdentity.phone}
          lang={lang}
          customMenuItems={themeSettings.general.customNavigationMenu}
          categories={FLOWERS_CIRCLE_CATEGORIES.map((c) => ({
            id: c.id,
            name: lang === 'ar' ? c.nameAr : c.nameEn,
            filter: c.filter,
            count: c.filter === 'All' ? currentProducts.length : (categoryCounts[c.filter] || 0),
          }))}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setSelectedBrand('All');
            setSfPage('shop');
            setShowMobileMenu(false);
          }}
        />
          </>
        )}
      </div>

      {/* ================= MODAL: PUBLIC STOREFRONT SEO & SCHEMA INSPECTOR ================= */}
      {isAdmin && showSEOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">Store-Wise Public SEO &amp; Schema Inspector</h3>
                  <p className="text-[10px] text-emerald-300">Golden Rule Verified · Strict Tenant SEO Isolation for {activeStore.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSEOModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-800">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Language &amp; Direction</span>
                  <span className="text-sm font-black text-slate-900 mt-0.5 block">{seoData.lang.toUpperCase()} ({seoData.dir.toUpperCase()})</span>
                  <span className="text-[10px] text-emerald-600">Updated dynamically without page refresh</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Canonical URL</span>
                  <span className="text-xs font-mono font-bold text-blue-700 truncate mt-0.5 block">{seoData.canonicalUrl}</span>
                  <span className="text-[10px] text-slate-400">Unique store domain resolution</span>
                </div>
              </div>

              {/* Live Meta Title */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Document &lt;title&gt; (Dynamic):</label>
                <div className="p-3 bg-slate-100 rounded-xl font-bold text-slate-900 text-xs border border-slate-200">
                  {seoData.title}
                </div>
              </div>

              {/* Live Meta Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">&lt;meta name="description"&gt; (Length: {seoData.description.length} chars):</label>
                <div className="p-3 bg-slate-100 rounded-xl text-slate-700 text-xs border border-slate-200 leading-relaxed">
                  {seoData.description}
                </div>
              </div>

              {/* Natural Keywords */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Target Natural Keywords (Safe &amp; Relevant):</label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {seoData.keywords.map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-medium">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Schema.org Structured Data Preview */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Schema.org JSON-LD (Florist + Product ItemList)</span>
                  </label>
                  <button
                    onClick={copySchemaJson}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSchema ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSchema ? 'Copied!' : 'Copy JSON-LD'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-2xl overflow-x-auto max-h-48 border border-slate-800 leading-tight">
                  {JSON.stringify(seoData.schema, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Golden Rule Verified: Zero Keyword Stuffing · Strict Store Isolation</span>
              </span>
              <button
                onClick={() => setShowSEOModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: QUICK VIEW PRODUCT & PRODUCT SEO ================= */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div
              className="relative aspect-16/9 bg-slate-100 dark:bg-slate-800 cursor-pointer group"
              onClick={() => openLightboxForProduct(quickViewProduct)}
            >
              <img src={quickViewProduct.image} alt={quickViewProduct.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickViewProduct(null);
                }} 
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/80 text-white flex items-center justify-center cursor-pointer hover:bg-slate-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{lang === 'ar' ? 'انقر للتكبير في المعرض (Lightbox)' : 'Click for Lightbox Zoom'}</span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs font-mono text-slate-400 block mb-1">{quickViewProduct.sku} · {quickViewProduct.category}</span>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mt-0.5">{quickViewProduct.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {lang === 'ar' 
                    ? 'تنسيق ملكي حصري في مكة المكرمة مع بطاقة إهداء مخصصة وتوصيل فوري خلال ساعتين لكافة الأحياء والفنادق.'
                    : 'Exclusive royal flower bouquet crafted in Holy Makkah with complimentary gift card & 2-hour delivery.'}
                </p>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block">
                    {lang === 'ar' ? 'السعر مع الضريبة (15% ZATCA)' : 'Price incl. 15% VAT'}
                  </span>
                  <span className="text-xl font-black text-emerald-950 dark:text-emerald-100">
                    {money(quickViewProduct.price + variationDelta)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    addToCart({
                      ...quickViewProduct,
                      price: quickViewProduct.price + variationDelta,
                    });
                    setQuickViewProduct(null);
                    setShowCartDrawer(true);
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-transform"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'إضافة إلى السلة' : 'Add to Bag'}</span>
                </button>
              </div>

              {FLOWERS_VARIATIONS[quickViewProduct.id] ? (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    {lang === 'ar' ? 'اختر النوع / المقاس:' : 'Choose variation:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {FLOWERS_VARIATIONS[quickViewProduct.id].map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariationId(v.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                          selectedVariationId === v.id
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {lang === 'ar' ? v.labelAr : v.labelEn}
                        {v.priceDelta > 0 ? ` (+${money(v.priceDelta)})` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-2 pt-1">
                <a
                  href={whatsappOrderHref(lang, [
                    `${quickViewProduct.name} · ${money(quickViewProduct.price + variationDelta)}`,
                    `التوصيل: ${selectedMakkahDistrict}`,
                  ])}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20 hover:scale-[1.02] transition-all"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>{lang === 'ar' ? 'اطلب هذا المنتج عبر واتساب' : 'Order via WhatsApp'}</span>
                </a>

                <button
                  type="button"
                  onClick={() => openLightboxForProduct(quickViewProduct)}
                  className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Open Lightbox"
                >
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">{lang === 'ar' ? 'تكبير' : 'Zoom'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= CART DRAWER ================= */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900">سلة التسوق الملكية</h3>
              </div>
              <button 
                onClick={() => setShowCartDrawer(false)}
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Flower2 className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-800">السلة فارغة حالياً</h4>
                  <p className="text-xs text-slate-400">اختر من باقات الورد الطبيعي لإضافتها إلى سلتك</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <img src={item.product.image} alt={item.product.name} className="w-14 h-14 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs text-slate-900 truncate">{item.product.name}</h5>
                      <span className="text-[11px] font-bold text-emerald-700">{money(item.product.price)}</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">الكمية: {item.quantity}</div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}

              {/* Optional Gift Card Message */}
              {cart.length > 0 && (
                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    عبارة كرت الإهداء (تُكتب بخط عربي فاخر مجاناً):
                  </label>
                  <textarea
                    rows={2}
                    value={cardMessage}
                    onChange={(e) => setCardMessage(e.target.value)}
                    placeholder="اكتب رسالتك لمتلقي الهدية في مكة المكرمة..."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Cart Footer & Checkout */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-4">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>مجموع الورود:</span>
                    <span className="tabular-nums font-mono">{money(cartTotal)}</span>
                  </div>
                  {couponDiscount > 0 ? (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>خصم الكوبون ({couponCode}):</span>
                      <span className="tabular-nums font-mono">-{money(couponDiscount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-slate-500">
                    <span>ضريبة القيمة المضافة (15% ZATCA):</span>
                    <span className="tabular-nums font-mono">{money(vatAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>{lang === 'ar' ? 'التوصيل والشحن:' : 'Shipping Fee:'}</span>
                    <span className="font-bold tabular-nums">
                      {shippingFee === 0 ? (
                        <span className="text-emerald-600 font-bold">{lang === 'ar' ? 'شحن مجاني' : 'Free Shipping'}</span>
                      ) : (
                        money(shippingFee)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                    <span>المجموع النهائي:</span>
                    <span className="tabular-nums font-mono text-emerald-800 text-base">{money(finalTotal)}</span>
                  </div>
                </div>

                {/* Coupon */}
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponApplied(false);
                    }}
                    placeholder={lang === 'ar' ? 'كود الخصم' : 'Coupon code'}
                    className="flex-1 px-2.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    className="px-3 py-2 rounded-xl text-[11px] font-bold bg-slate-900 text-white cursor-pointer"
                  >
                    {lang === 'ar' ? 'تطبيق' : 'Apply'}
                  </button>
                </div>
                {couponApplied ? (
                  <p className="text-[10px] text-emerald-700 font-bold">
                    {lang === 'ar' ? 'تم تطبيق الكوبون بنجاح' : 'Coupon applied'}
                  </p>
                ) : null}

                {/* Payment Selection */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700">اختر وسيلة الدفع:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(
                      [
                        ['mada', 'مدى Mada'],
                        ['apple_pay', 'Apple Pay'],
                        ['tabby', 'Tabby تابي'],
                        ['cod', lang === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPaymentChoice(id)}
                        className={`p-2 rounded-xl font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                          paymentChoice === id
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkoutComplete}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{checkoutComplete ? 'جارٍ تسجيل الطلب وتوصيله...' : `إتمام الطلب الآن (${money(finalTotal)})`}</span>
                </button>

                <a
                  href={whatsappOrderHref(
                    lang,
                    cart.map((i) => `${i.product.name} x${i.quantity} · ${money(i.product.price * i.quantity)}`),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-2xl text-xs font-black bg-[#25D366] text-white flex items-center justify-center gap-2 hover:brightness-105"
                >
                  {lang === 'ar' ? 'اطلب السلة عبر واتساب' : 'Order cart on WhatsApp'}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SIDE FILTER DRAWER ================= */}
      {showFilterDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      {lang === 'ar' ? 'تصفية وفلترة المنتجات' : 'Filter & Refine Products'}
                    </h3>
                    {activeFiltersCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                        {activeFiltersCount}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === 'ar' ? 'حدد التصنيفات، الماركات والمخزون' : 'Narrow down by category, brand & stock'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedBrand('All');
                      setInStockOnly(false);
                      setSortBy('featured');
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 p-1 cursor-pointer"
                  >
                    <RotateIcon className="w-3 h-3" />
                    <span>{lang === 'ar' ? 'إعادة ضبط' : 'Reset'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFilterDrawer(false)}
                  className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Options Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              {/* Category Filter */}
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                  {lang === 'ar' ? 'الأقسام والتصنيفات' : 'Categories'}
                </span>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('All')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === 'All'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 opacity-75" />
                      <span>{lang === 'ar' ? 'جميع الأقسام' : 'All Categories'}</span>
                    </div>
                    <span className="text-[10px] opacity-75 font-mono">
                      ({currentProducts.length})
                    </span>
                  </button>

                  {FLOWERS_CIRCLE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.filter)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedCategory === cat.filter
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={cat.image}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-emerald-500/20"
                        />
                        <span>{lang === 'ar' ? cat.nameAr : cat.nameEn}</span>
                      </div>
                      <span className="text-[10px] opacity-75 font-mono">
                        ({categoryCounts[cat.filter] || 0})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Brands Filter */}
              {allBrands.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                    {lang === 'ar' ? 'الماركات والعلامات التجارية' : 'Brands & Designers'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedBrand('All')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedBrand === 'All'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {lang === 'ar' ? 'الكل' : 'All'}
                    </button>
                    {allBrands.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setSelectedBrand(selectedBrand === b ? 'All' : b)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          selectedBrand === b
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Tag className="w-3 h-3 opacity-60" />
                        <span>{b}</span>
                        <span className="text-[10px] opacity-70">({brandCounts[b] || 0})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability Filter */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <div className="space-y-0.5">
                    <div className="text-xs font-black text-slate-800 dark:text-slate-100">
                      {lang === 'ar' ? 'المتوفر في المخزون فقط' : 'In-Stock Only'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {lang === 'ar' ? 'إخفاء الباقات المنتهية مؤقتاً' : 'Hide out of stock items'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInStockOnly(!inStockOnly)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      inStockOnly ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                  </button>
                </div>
              </div>

              {/* Sort Order Selector */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                  {lang === 'ar' ? 'ترتيب وتصنيف النتائج' : 'Sort Order'}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'featured', labelAr: 'المميزة', labelEn: 'Featured' },
                    { id: 'popular', labelAr: 'الأكثر مبيعاً', labelEn: 'Best Sellers' },
                    { id: 'price-asc', labelAr: 'السعر: الأقل', labelEn: 'Price: Low' },
                    { id: 'price-desc', labelAr: 'السعر: الأعلى', labelEn: 'Price: High' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSortBy(opt.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                        sortBy === opt.id
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {lang === 'ar' ? opt.labelAr : opt.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Apply CTA */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowFilterDrawer(false);
                  if (sfPage !== 'shop') setSfPage('shop');
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>
                  {lang === 'ar'
                    ? `عرض النتائج (${filteredProducts.length} باقة)`
                    : `Show Results (${filteredProducts.length} items)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <OfferPopup
        open={isFlowersPremium && showOfferPopup}
        lang={lang}
        config={offerConfig}
        onClose={() => {
          markOfferDismissed(activeStore.id);
          setShowOfferPopup(false);
        }}
        onApplyCode={(code) => {
          setCouponCode(code);
          setCouponApplied(true);
        }}
      />
      {!isAdmin && !isFlowersStore && isFlowersPremium ? <WhatsAppChatFab lang={lang} isAdmin={isAdmin} /> : null}

      <CustomerLoginModal
        open={showCustomerLogin}
        lang={lang}
        storeId={activeStore.id}
        storeName={storeIdentity.storeName || activeStore.name}
        customers={currentCustomers}
        onClose={() => {
          setShowCustomerLogin(false);
          setPendingCheckoutAfterLogin(false);
        }}
        onSuccess={(session) => {
          setSfCustomer(session);
          if (pendingCheckoutAfterLogin && cart.length > 0) {
            setPendingCheckoutAfterLogin(false);
            setTimeout(() => placeOrder(session), 200);
          }
        }}
        onRegisterLocal={({ name, email, phone }) => {
          addCustomer({
            name,
            email,
            phone,
            status: 'New',
            city: 'Makkah',
            country: 'Saudi Arabia',
            gender: 'Other',
            source: 'Direct',
            group: 'Regular',
            totalOrders: 0,
            totalSpending: 0,
            avgOrderValue: 0,
            lastOrderDate: '—',
          });
          const session = {
            storeId: activeStore.id,
            customerId: `sf-${Date.now()}`,
            name,
            email,
            phone,
            loggedInAt: new Date().toISOString(),
          };
          return session;
        }}
      />

      {/* Lightbox Modal Gallery with WhatsApp Order action */}
      <LightboxModal
        isOpen={lightboxData.isOpen}
        onClose={() => setLightboxData((prev) => ({ ...prev, isOpen: false }))}
        items={lightboxData.items}
        initialIndex={lightboxData.initialIndex}
        lang={lang}
        money={money}
      />

      {/* Elementor-Style Visual Theme Builder Modal (Authenticated Admin Only - Lazy Loaded) */}
      {isAdmin && showVisualBuilder && (
        <React.Suspense fallback={null}>
          <VisualThemeBuilder
            isOpen={showVisualBuilder}
            onClose={() => setShowVisualBuilder(false)}
          />
        </React.Suspense>
      )}

      {/* Client Auth & Registration Modal */}
      <ClientAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};
