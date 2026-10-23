import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Product, CartItem, Order, Language, OccasionReminder, SavedAddress, AddonOption } from '../types';
import { PRODUCTS, INITIAL_ORDERS, INITIAL_OCCASIONS, INITIAL_ADDRESSES } from '../data/mockData';
import { COFFEE_STORE_PRODUCTS } from '../../../data/hadayaMeccaData';
import { useTenant } from '../../../context/TenantContext';
import { CouponItem } from '../../../types';
import { usePrefs } from '../../../i18n/PrefsContext';
import {
  CartInterceptConfig,
  fetchCartInterceptSettingsApi,
  trackCartInterceptActionApi,
} from '../../../api/tenantApi';

interface UserInfo {
  name: string;
  email: string;
  avatar: string;
  isLoggedIn: boolean;
}

interface AppContextType {
  products: Product[];
  language: Language;
  setLanguage: (lang: Language) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (prod: Product | null) => void;
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  wishlist: string[];
  orders: Order[];
  lastOrder: Order | null;
  loyaltyPoints: number;
  savedAddresses: SavedAddress[];
  savedOccasions: OccasionReminder[];
  toastMessage: string | null;
  user: UserInfo;
  loginWithGoogle: (customEmail?: string, customName?: string, customAvatar?: string) => void;
  logout: () => void;
  showInvoiceModal: boolean;
  setShowInvoiceModal: (show: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number, addons?: AddonOption[], cardMessage?: string, size?: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  navigateToProduct: (product: Product) => void;
  navigateToCategory: (categoryName: string) => void;
  placeOrder: (orderInfo: Partial<Order>) => Order;
  cancelOrderRequest: (orderId: string, reason?: string) => void;
  addOccasion: (item: Omit<OccasionReminder, 'id'>) => void;
  removeOccasion: (id: string) => void;
  addAddress: (addr: Omit<SavedAddress, 'id'>) => void;
  removeAddress: (id: string) => void;
  cartSubtotal: number;
  cartCount: number;
  freeShippingRemaining: number;
  appliedCoupon: CouponItem | null;
  appliedDiscount: number;
  applyCouponCode: (rawCode: string) => { success: boolean; message: string; discount: number };
  removeAppliedCoupon: () => void;
  builderDevice?: 'desktop' | 'laptop' | 'tablet' | 'mobile';
  setBuilderDevice?: (device: 'desktop' | 'laptop' | 'tablet' | 'mobile') => void;
  // Cart Intercept Modal
  isCartInterceptOpen: boolean;
  setIsCartInterceptOpen: (open: boolean) => void;
  cartInterceptConfig: CartInterceptConfig;
  handleCartInterceptPrimary: () => void;
  handleCartInterceptSecondary: () => void;
  handleCartInterceptClose: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentProducts, currentOrders, activeStore, currentCoupons, addOrder: tenantAddOrder, updateOrderStatus, updateOrder, recordCouponUsage } = useTenant();
  const prefs = usePrefs();
  const localeFromPrefs = prefs?.locale || 'ar';
  const setLocaleFromPrefs = prefs?.setLocale;

  const [language, setLanguageState] = useState<Language>(() => {
    if (localeFromPrefs === 'en' || localeFromPrefs === 'ar') return localeFromPrefs;
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('unityteck_prefs');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.locale === 'en' || parsed.locale === 'ar') return parsed.locale;
        }
      }
    } catch {}
    return 'ar';
  });

  useEffect(() => {
    if (localeFromPrefs && (localeFromPrefs === 'en' || localeFromPrefs === 'ar') && localeFromPrefs !== language) {
      setLanguageState(localeFromPrefs);
    }
  }, [localeFromPrefs]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (setLocaleFromPrefs) {
      setLocaleFromPrefs(lang === 'ar' ? 'ar' : 'en');
    }
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('unityteck_prefs');
        const p = raw ? JSON.parse(raw) : {};
        localStorage.setItem('unityteck_prefs', JSON.stringify({ ...p, locale: lang }));
      }
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  }, [setLocaleFromPrefs]);

  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    const handleSync = () => {
      setSyncTick((t) => t + 1);
    };
    window.addEventListener('unityteck-product-updated', handleSync);
    window.addEventListener('unityteck-data', handleSync);
    window.addEventListener('unityteck-categories-updated', handleSync);
    window.addEventListener('unityteck-brands-updated', handleSync);
    window.addEventListener('unityteck-theme-settings', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('unityteck-product-updated', handleSync);
      window.removeEventListener('unityteck-data', handleSync);
      window.removeEventListener('unityteck-categories-updated', handleSync);
      window.removeEventListener('unityteck-brands-updated', handleSync);
      window.removeEventListener('unityteck-theme-settings', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Dynamic products from store tenant context strictly isolated to activeStore
  const products: Product[] = useMemo(() => {
    const isCoffee = activeStore?.id === 'store-coffee' || (activeStore?.category && activeStore.category.includes('قهوة'));

    // Prioritize fresh live tenant catalog. Never overwrite with stale localStorage cache if currentProducts exists.
    let sourceProducts = (currentProducts && currentProducts.length > 0) ? currentProducts : [];
    if (sourceProducts.length === 0) {
      try {
        if (typeof window !== 'undefined' && activeStore?.id) {
          const rawMap = localStorage.getItem('unityteck_products_map');
          if (rawMap) {
            const map = JSON.parse(rawMap);
            if (Array.isArray(map[activeStore.id]) && map[activeStore.id].length > 0) {
              sourceProducts = map[activeStore.id];
            }
          }
        }
      } catch {}
    }

    if (sourceProducts && sourceProducts.length > 0) {
      return sourceProducts.map((p) => {
        const hasArChars = (str?: string) => Boolean(str && /[\u0600-\u06FF]/.test(str));
        const nameAr = p.nameAr || (hasArChars(p.name) ? p.name : p.subtitleAr || p.name || '');
        const nameEn = p.nameEn || (!hasArChars(p.name) ? p.name : p.subtitle || p.sku || p.name || '');
        const pAny = p as any;
        const currentLangName = language === 'ar' ? (nameAr || nameEn) : (nameEn || nameAr);
        const currentLangCat = language === 'ar' ? (p.categoryAr || p.category) : (pAny.categoryEn || p.categoryEn || p.category);
        const currentLangDesc = language === 'ar' ? (p.descriptionAr || p.description) : (p.description || p.descriptionAr);

        return {
          id: String(p.id),
          storeId: p.storeId || activeStore.id,
          name: currentLangName,
          nameAr: nameAr || nameEn,
          nameEn: nameEn || nameAr,
          sku: p.sku,
          price: Number(p.discountedPrice || p.price || 0),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : (p.discountedPrice && p.discountedPrice < p.price ? Number(p.price) : undefined),
          rating: 4.9,
          reviewsCount: p.salesCount || 135,
          image: (p.image ? p.image.replace('/src/assets/images/', '/images/') : '/images/hadaya_red_roses_bouquet_1791276749666.jpg'),
          additionalImages: p.galleryUrls && p.galleryUrls.length > 0 ? p.galleryUrls : (p.image ? [p.image] : []),
          category: currentLangCat,
          categoryAr: p.categoryAr || p.category,
          categoryEn: pAny.categoryEn || p.categoryEn || p.category,
          categorySlug: pAny.categorySlug || (p.category ? p.category.toLowerCase().replace(/\s+/g, '-') : 'general'),
          occasions: p.tags || [],
          tags: p.tags || [],
          badge: p.originalPrice ? (language === 'ar' ? 'عرض خاص' : 'Special Offer') : undefined,
          badgeEn: p.originalPrice ? 'Special Offer' : undefined,
          description: currentLangDesc || '',
          descriptionAr: p.descriptionAr || p.description || '',
          descriptionEn: p.description || p.descriptionAr || '',
          subtitle: p.subtitle,
          subtitleAr: p.subtitleAr,
          flowerTypes: pAny.flowerTypes || [],
          dimensions: pAny.dimensions || '',
          inStock: p.stock !== undefined ? p.stock > 0 : true,
          stock: p.stock,
          status: p.status,
          featured: true,
        };
      });
    }

    if (isCoffee) {
      return COFFEE_STORE_PRODUCTS.map((p) => {
        const hasArChars = (str?: string) => Boolean(str && /[\u0600-\u06FF]/.test(str));
        const nameAr = p.nameAr || (hasArChars(p.name) ? p.name : p.subtitleAr || p.name || '');
        const nameEn = p.nameEn || (!hasArChars(p.name) ? p.name : p.subtitle || p.sku || p.name || '');
        return {
          id: String(p.id),
          storeId: p.storeId || 'store-coffee',
          name: language === 'ar' ? (nameAr || nameEn) : (nameEn || nameAr),
          nameAr: nameAr || nameEn,
          nameEn: nameEn || nameAr,
          sku: p.sku,
          price: Number(p.discountedPrice || p.price || 0),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
          rating: 4.9,
          reviewsCount: p.salesCount || 140,
          image: p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
          additionalImages: p.galleryUrls && p.galleryUrls.length > 0 ? p.galleryUrls : (p.image ? [p.image] : []),
          category: language === 'ar' ? (p.categoryAr || p.category) : (p.categoryEn || p.category),
          categoryAr: p.categoryAr || p.category,
          categoryEn: p.categoryEn || 'Specialty Beans',
          categorySlug: 'coffee-beans',
          occasions: ['قهوة الصباح', 'تحميص طازج'],
          tags: ['قهوة مختصة', 'محمصة', 'سنجل أوريجن'],
          badge: p.originalPrice ? (language === 'ar' ? 'عرض خاص' : 'Special Offer') : undefined,
          badgeEn: p.originalPrice ? 'Special Offer' : undefined,
          description: (language === 'ar' ? (p.descriptionAr || p.description) : (p.description || p.descriptionAr)) || '',
          descriptionAr: p.descriptionAr || p.description || '',
          descriptionEn: p.description || p.descriptionAr || '',
          flowerTypes: [],
          dimensions: '250g',
          inStock: true,
          featured: true,
        };
      });
    }

    // Zero Dummy / Mock Data policy:
    // If a store has no products yet in database/dashboard, return genuine empty list []
    return [];
  }, [currentProducts, activeStore, syncTick, language]);

  const resolveValidPage = (raw: string | null | undefined): string | null => {
    if (!raw) return null;
    const clean = raw.toLowerCase().trim();
    if (clean === 'storefront') return 'home'; // SaaS dashboard tab param -> storefront home
    if (clean === 'shop') return 'catalog';
    if (clean === 'profile' || clean === 'account' || clean === 'orders') return 'crm';
    if (['home', 'catalog', 'product', 'cart', 'checkout', 'thankyou', 'crm'].includes(clean)) {
      return clean;
    }
    return null;
  };

  const [builderDevice, setBuilderDevice] = useState<'desktop' | 'laptop' | 'tablet' | 'mobile'>('desktop');
  const [currentPage, setCurrentPageState] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const pageParam = searchParams.get('page');
        const resolvedPage = resolveValidPage(pageParam);
        if (resolvedPage) return resolvedPage;

        const tabParam = searchParams.get('tab');
        const resolvedTab = resolveValidPage(tabParam);
        if (resolvedTab && resolvedTab !== 'storefront') return resolvedTab;

        const path = window.location.pathname.replace(/\/$/, '') || '/';
        if (path === '/cart') return 'cart';
        if (path === '/checkout') return 'checkout';
        if (path === '/crm' || path === '/profile' || path === '/account' || path === '/orders') return 'crm';
        if (path === '/catalog' || path === '/shop') return 'catalog';
        if (path === '/product') return 'product';
        if (path === '/thankyou') return 'thankyou';

        const saved = sessionStorage.getItem('unityteck_mecca_page');
        if (saved) {
          const resolvedSaved = resolveValidPage(saved);
          if (resolvedSaved) return resolvedSaved;
        }
      }
    } catch {}
    return 'home';
  });

  const setCurrentPage = (page: string) => {
    const valid = resolveValidPage(page) || 'home';
    setCurrentPageState(valid);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('unityteck_mecca_page', valid);
        const url = new URL(window.location.href);
        if (valid === 'home') {
          url.searchParams.delete('page');
        } else {
          url.searchParams.set('page', valid);
        }
        window.history.replaceState({ page: valid }, '', url.toString());
      }
    } catch {}

    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 50);
    }
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      try {
        if (e.state && e.state.page) {
          const resolved = resolveValidPage(e.state.page) || 'home';
          setCurrentPageState(resolved);
          return;
        }
        const searchParams = new URLSearchParams(window.location.search);
        const pageParam = searchParams.get('page');
        const resolvedPage = resolveValidPage(pageParam);
        if (resolvedPage) {
          setCurrentPageState(resolvedPage);
          return;
        }

        const tabParam = searchParams.get('tab');
        const resolvedTab = resolveValidPage(tabParam);
        if (resolvedTab && resolvedTab !== 'storefront') {
          setCurrentPageState(resolvedTab);
          return;
        }

        const path = window.location.pathname.replace(/\/$/, '') || '/';
        if (path === '/cart') setCurrentPageState('cart');
        else if (path === '/checkout') setCurrentPageState('checkout');
        else if (path === '/crm' || path === '/profile' || path === '/account' || path === '/orders') setCurrentPageState('crm');
        else if (path === '/catalog' || path === '/shop') setCurrentPageState('catalog');
        else if (path === '/product') setCurrentPageState('product');
        else if (path === '/thankyou') setCurrentPageState('thankyou');
        else setCurrentPageState('home');
      } catch {}
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Automatic UTM & Referrer Traffic Attribution Engine
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const utmSource = params.get('utm_source');
        const utmMedium = params.get('utm_medium');
        const utmCampaign = params.get('utm_campaign');
        const utmTerm = params.get('utm_term');
        const utmContent = params.get('utm_content');
        const ref = document.referrer || '';

        // If URL contains explicit UTM parameters, store them immediately
        if (utmSource || utmCampaign) {
          const attribution = {
            source: utmSource ? utmSource.toLowerCase() : 'direct',
            medium: utmMedium || 'cpc',
            campaign: utmCampaign || 'general',
            term: utmTerm || '',
            content: utmContent || '',
            referrer: ref,
            landingPage: window.location.pathname + window.location.search,
            capturedAt: new Date().toISOString(),
          };
          sessionStorage.setItem('selia_traffic_attribution', JSON.stringify(attribution));
          localStorage.setItem('selia_traffic_attribution', JSON.stringify(attribution));
        } else if (ref && !sessionStorage.getItem('selia_traffic_attribution')) {
          // Detect organic platform from document.referrer
          let autoSource = 'Direct / Organic';
          let autoMedium = 'referral';
          if (ref.includes('google.')) { autoSource = 'Google Search'; autoMedium = 'organic'; }
          else if (ref.includes('tiktok.')) { autoSource = 'TikTok'; autoMedium = 'social'; }
          else if (ref.includes('instagram.')) { autoSource = 'Instagram'; autoMedium = 'bio_link'; }
          else if (ref.includes('snapchat.')) { autoSource = 'Snapchat'; autoMedium = 'social'; }
          else if (ref.includes('whatsapp.') || ref.includes('api.whatsapp.')) { autoSource = 'WhatsApp'; autoMedium = 'chat'; }
          else if (ref.includes('facebook.') || ref.includes('fb.')) { autoSource = 'Facebook'; autoMedium = 'social'; }
          else if (ref.includes('twitter.') || ref.includes('t.co') || ref.includes('x.com')) { autoSource = 'X (Twitter)'; autoMedium = 'social'; }

          const attribution = {
            source: autoSource,
            medium: autoMedium,
            campaign: 'organic_discovery',
            referrer: ref,
            landingPage: window.location.pathname,
            capturedAt: new Date().toISOString(),
          };
          sessionStorage.setItem('selia_traffic_attribution', JSON.stringify(attribution));
        }
      }
    } catch {}
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const prodId = params.get('product') || params.get('id');
        if (prodId) {
          const found = (products || []).find((p) => p.id === prodId) || PRODUCTS.find((p) => p.id === prodId);
          if (found) return found;
        }
        const savedProd = sessionStorage.getItem('unityteck_mecca_product_id');
        if (savedProd) {
          const found = (products || []).find((p) => p.id === savedProd) || PRODUCTS.find((p) => p.id === savedProd);
          if (found) return found;
        }
      }
    } catch {}
    return (products && products.length > 0 ? products[0] : null) || PRODUCTS[0] || null;
  });

  useEffect(() => {
    if (selectedProduct) {
      const updated = products.find((p) => p.id === selectedProduct.id);
      if (updated && (updated.image !== selectedProduct.image || updated.price !== selectedProduct.price || updated.name !== selectedProduct.name)) {
        setSelectedProduct(updated);
      }
    }
  }, [products]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`mecca_gifts_wishlist_${activeStore?.id || 'store-1'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const stored = localStorage.getItem('mecca_gifts_customer_orders');
      if (stored) {
        return JSON.parse(stored) as Order[];
      }
    } catch {}
    return [];
  });
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('mecca_gifts_customer_loyalty');
      if (stored) return Number(stored);
    } catch {}
    return 0;
  });
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(() => {
    try {
      const saved = localStorage.getItem(`mecca_gifts_addresses_${activeStore?.id || 'store-1'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [savedOccasions, setSavedOccasions] = useState<OccasionReminder[]>(() => {
    try {
      const saved = localStorage.getItem(`mecca_gifts_occasions_${activeStore?.id || 'store-1'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`mecca_gifts_wishlist_${activeStore?.id || 'store-1'}`, JSON.stringify(wishlist));
    } catch {}
  }, [wishlist, activeStore?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`mecca_gifts_addresses_${activeStore?.id || 'store-1'}`, JSON.stringify(savedAddresses));
    } catch {}
  }, [savedAddresses, activeStore?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(`mecca_gifts_occasions_${activeStore?.id || 'store-1'}`, JSON.stringify(savedOccasions));
    } catch {}
  }, [savedOccasions, activeStore?.id]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // ── Cart Intercept (1st Click Modal on Flowers Store) ─────────────────
  const [isCartInterceptOpen, setIsCartInterceptOpen] = useState<boolean>(false);
  const pendingAddToCartRef = React.useRef<{
    product: Product;
    quantity?: number;
    addons?: AddonOption[];
    cardMessage?: string;
    size?: string;
  } | null>(null);

  const [visitorId] = useState<string>(() => {
    try {
      let vid = localStorage.getItem('mecca_gifts_visitor_id');
      if (!vid) {
        vid = `vis-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem('mecca_gifts_visitor_id', vid);
      }
      return vid;
    } catch {
      return `vis-${Date.now()}`;
    }
  });

  const [cartInterceptConfig, setCartInterceptConfig] = useState<CartInterceptConfig>({
    enabled: true,
    active_modal: 'loyalty',
    loyalty_points: 25,
    discount_percent: 10,
    coupon_code: 'HADAYA10',
    title_en: "Don't Lose Your Points!",
    title_ar: 'لا تفوّت نقاطك الذهبية!',
    subtitle_en: 'Log in and earn 25 points on this cart.',
    subtitle_ar: 'سجّل دخولك الآن واكسب 25 نقطة إضافية على هذه السلة.',
    gift_title_en: 'Your Gift is Ready!',
    gift_title_ar: 'هديتك بانتظارك!',
    gift_subtitle_en: 'Log in now and get 10% OFF automatically applied to your cart.',
    gift_subtitle_ar: 'سجّل دخولك الآن واحصل على خصم 10% يطبق تلقائياً على سلتك.',
    save_cart_title_en: 'Save Your Cart?',
    save_cart_title_ar: 'هل ترغب بحفظ سلتك؟',
    save_cart_subtitle_en: "As a guest, your cart might be lost. Log in and we'll save it for you across any device.",
    save_cart_subtitle_ar: 'كزائر، قد تفقد سلتك عند إغلاق المتصفح. سجّل دخولك وسنحفظها لك عبر جميع أجهزتك.',
  });

  useEffect(() => {
    let isMounted = true;
    const targetStoreId = activeStore?.id || 'store-1';
    const loadConfig = async () => {
      try {
        const cfg = await fetchCartInterceptSettingsApi(targetStoreId);
        if (cfg && isMounted) {
          setCartInterceptConfig(cfg);
        }
      } catch {
        try {
          const raw = localStorage.getItem(`unityteck_cart_intercept_${targetStoreId}`);
          if (raw && isMounted) setCartInterceptConfig(JSON.parse(raw));
        } catch {}
      }
    };
    loadConfig();

    const handleUpdate = () => loadConfig();
    window.addEventListener('unityteck-cart-intercept-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('unityteck-cart-intercept-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [activeStore?.id]);

  // User auth state with instant 1-click Google Sign-In & persistent storage
  const [user, setUser] = useState<UserInfo>(() => {
    try {
      const stored = localStorage.getItem('mecca_gifts_customer_user');
      if (stored) {
        return JSON.parse(stored) as UserInfo;
      }
    } catch {}
    return {
      name: 'ضيف كريم',
      email: '',
      avatar: 'https://cdn.assets.salla.network/prod/stores/themes/default/assets/images/avatar_male.png',
      isLoggedIn: false
    };
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`mecca_gifts_cart_${activeStore?.id || 'store-1'}`);
        if (saved) return JSON.parse(saved);
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`mecca_gifts_cart_${activeStore?.id || 'store-1'}`, JSON.stringify(cart));
      }
    } catch {}
  }, [cart, activeStore?.id]);



  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const setPageSafe = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loginWithGoogle = (customEmail?: string, customName?: string, customAvatar?: string) => {
    const finalEmail = (customEmail && customEmail.trim()) || 'alfahad3110@gmail.com';
    const finalName = (customName && customName.trim()) || (finalEmail.includes('@') ? finalEmail.split('@')[0] : 'alfahad');
    const finalAvatar = (customAvatar && customAvatar.trim()) || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=102a1c&color=e6ca98&size=128`;
    
    const newUser: UserInfo = {
      name: finalName,
      email: finalEmail,
      avatar: finalAvatar,
      isLoggedIn: true
    };

    setUser(newUser);
    try {
      localStorage.setItem('mecca_gifts_customer_user', JSON.stringify(newUser));
    } catch {}

    // Apply pending intercept reward upon successful login
    try {
      const pendingReward = localStorage.getItem('mecca_pending_intercept_reward');
      if (pendingReward === 'loyalty') {
        const pts = cartInterceptConfig.loyalty_points || 25;
        setLoyaltyPoints((prev) => {
          const updated = prev + pts;
          try { localStorage.setItem('mecca_gifts_customer_loyalty', String(updated)); } catch {}
          return updated;
        });
        showToast(language === 'ar' ? `مرحباً بك ${finalName}! تم إضافة ${pts} نقطة ولاء إلى رصيدك 🪙` : `Welcome ${finalName}! ${pts} loyalty points credited!`);
      } else if (pendingReward === 'gift') {
        const code = cartInterceptConfig.coupon_code || 'HADAYA10';
        applyCouponCode(code);
        showToast(language === 'ar' ? `مرحباً بك ${finalName}! تم تطبيق كود الخصم (${code}) على سلتك 🎁` : `Welcome ${finalName}! Coupon (${code}) applied!`);
      } else if (pendingReward === 'save_cart') {
        showToast(language === 'ar' ? `مرحباً بك ${finalName}! تم حفظ ومزامنة سلتك في حسابك عبر أي جهاز 🛒` : `Welcome ${finalName}! Cart saved across your devices!`);
      } else {
        showToast(language === 'ar' ? `مرحباً بك ${finalName} في متجر هدايا مكة ✓` : `Welcome back ${finalName} ✓`);
      }
      localStorage.removeItem('mecca_pending_intercept_reward');
    } catch {
      showToast(language === 'ar' ? `مرحباً بك ${finalName} في متجر هدايا مكة ✓` : `Welcome back ${finalName} ✓`);
    }

    setIsAuthModalOpen(false);
  };

  const logout = () => {
    const guestUser: UserInfo = {
      name: 'ضيف كريم',
      email: '',
      avatar: '',
      isLoggedIn: false
    };
    setUser(guestUser);
    try {
      localStorage.removeItem('mecca_gifts_customer_user');
    } catch {}
    showToast(language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Signed out successfully');
  };

  const directAddToCart = (
    product: Product,
    quantity: number = 1,
    addons: AddonOption[] = [],
    cardMessage?: string,
    size?: string
  ) => {
    const existingIndex = cart.findIndex(
      (item) => item.productId === product.id && item.selectedSize === size
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += quantity;
      setCart(updated);
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        product,
        quantity,
        addons,
        cardMessage,
        selectedSize: size || 'الحجم الكلاسيكي'
      };
      setCart((prev) => [newItem, ...prev]);
    }

    setIsCartOpen(true);
    showToast(language === 'ar' ? 'تمت إضافة الهدية إلى السلة بنجاح' : 'Added to bag successfully');
  };

  const addToCart = (
    product: Product,
    quantity: number = 1,
    addons: AddonOption[] = [],
    cardMessage?: string,
    size?: string
  ) => {
    const storeId = activeStore?.id || 'store-1';
    const isFlowersStore =
      storeId === 'store-1' ||
      activeStore?.category?.includes('ورد') ||
      activeStore?.category?.includes('هدايا') ||
      activeStore?.category?.includes('gift') ||
      activeStore?.category?.includes('flower') ||
      window.location.pathname.startsWith('/flowers') ||
      window.location.pathname.startsWith('/hadaya');

    // Check if Cart Intercept is configured & active exclusively for Flowers store
    if (isFlowersStore && cartInterceptConfig.enabled && cartInterceptConfig.active_modal !== 'disabled') {
      const dismissKey = `mecca_cart_intercept_dismissed_${storeId}`;
      const isAlreadyDismissed = Boolean(
        localStorage.getItem(dismissKey) || sessionStorage.getItem(dismissKey)
      );

      if (!isAlreadyDismissed) {
        // 1ST CLICK: Trigger Cart Intercept Modal!
        pendingAddToCartRef.current = { product, quantity, addons, cardMessage, size };
        setIsCartInterceptOpen(true);

        // Record impression in real backend tracking API (MySQL)
        trackCartInterceptActionApi(storeId, {
          visitor_id: visitorId,
          customer_id: user.isLoggedIn ? user.email : null,
          customer_name: user.isLoggedIn ? user.name : null,
          customer_email: user.isLoggedIn ? user.email : null,
          modal_type: cartInterceptConfig.active_modal as any,
          action: 'impression',
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          product_image: product.image,
        }).catch(() => {});

        return; // Modal opens, direct add deferred
      }
    }

    // 2ND TIME (or once interacted/dismissed): Add directly to cart without modal!
    directAddToCart(product, quantity, addons, cardMessage, size);
  };

  const handleCartInterceptPrimary = () => {
    const storeId = activeStore?.id || 'store-1';
    const dismissKey = `mecca_cart_intercept_dismissed_${storeId}`;
    try {
      localStorage.setItem(dismissKey, 'true');
      sessionStorage.setItem(dismissKey, 'true');
    } catch {}

    // Add pending item to cart
    if (pendingAddToCartRef.current) {
      const { product, quantity, addons, cardMessage, size } = pendingAddToCartRef.current;
      directAddToCart(product, quantity, addons, cardMessage, size);
      pendingAddToCartRef.current = null;
    }

    const actionMap: Record<string, 'collect_points' | 'get_code' | 'save_cart'> = {
      loyalty: 'collect_points',
      gift: 'get_code',
      save_cart: 'save_cart',
    };
    const actionName = actionMap[cartInterceptConfig.active_modal] || 'collect_points';

    // Track conversion in real Hostinger MySQL backend
    trackCartInterceptActionApi(storeId, {
      visitor_id: visitorId,
      customer_id: user.isLoggedIn ? user.email : null,
      customer_name: user.isLoggedIn ? user.name : null,
      customer_email: user.isLoggedIn ? user.email : null,
      modal_type: cartInterceptConfig.active_modal as any,
      action: actionName,
      cart_items: cart,
    }).catch(() => {});

    setIsCartInterceptOpen(false);

    if (!user.isLoggedIn) {
      // Store pending reward so when user signs in, reward is credited
      try {
        localStorage.setItem('mecca_pending_intercept_reward', cartInterceptConfig.active_modal);
      } catch {}
      setIsAuthModalOpen(true);
    } else {
      // User is already logged in - apply benefit immediately!
      if (cartInterceptConfig.active_modal === 'loyalty') {
        const pts = cartInterceptConfig.loyalty_points || 25;
        setLoyaltyPoints((prev) => {
          const updated = prev + pts;
          try { localStorage.setItem('mecca_gifts_customer_loyalty', String(updated)); } catch {}
          return updated;
        });
        showToast(language === 'ar' ? `تم جمع ${pts} نقطة ولاء وإضافتها إلى حسابك بنجاح! 🪙` : `${pts} loyalty points collected!`);
      } else if (cartInterceptConfig.active_modal === 'gift') {
        const code = cartInterceptConfig.coupon_code || 'HADAYA10';
        applyCouponCode(code);
        showToast(language === 'ar' ? `تم تطبيق كود الخصم (${code}) على سلتك بنجاح! 🎁` : `Coupon (${code}) applied to cart!`);
      } else if (cartInterceptConfig.active_modal === 'save_cart') {
        showToast(language === 'ar' ? 'تم حفظ سلة مشترياتك في حسابك بنجاح! 🛒' : 'Cart saved across your devices!');
      }
    }
  };

  const handleCartInterceptSecondary = () => {
    const storeId = activeStore?.id || 'store-1';
    const dismissKey = `mecca_cart_intercept_dismissed_${storeId}`;
    try {
      localStorage.setItem(dismissKey, 'true');
      sessionStorage.setItem(dismissKey, 'true');
    } catch {}

    if (pendingAddToCartRef.current) {
      const { product, quantity, addons, cardMessage, size } = pendingAddToCartRef.current;
      directAddToCart(product, quantity, addons, cardMessage, size);
      pendingAddToCartRef.current = null;
    }

    const actionName = cartInterceptConfig.active_modal === 'gift' ? 'later' : 'continue_as_guest';
    trackCartInterceptActionApi(storeId, {
      visitor_id: visitorId,
      customer_id: user.isLoggedIn ? user.email : null,
      customer_name: user.isLoggedIn ? user.name : null,
      customer_email: user.isLoggedIn ? user.email : null,
      modal_type: cartInterceptConfig.active_modal as any,
      action: actionName as any,
    }).catch(() => {});

    setIsCartInterceptOpen(false);
  };

  const handleCartInterceptClose = () => {
    const storeId = activeStore?.id || 'store-1';
    const dismissKey = `mecca_cart_intercept_dismissed_${storeId}`;
    try {
      localStorage.setItem(dismissKey, 'true');
      sessionStorage.setItem(dismissKey, 'true');
    } catch {}

    if (pendingAddToCartRef.current) {
      const { product, quantity, addons, cardMessage, size } = pendingAddToCartRef.current;
      directAddToCart(product, quantity, addons, cardMessage, size);
      pendingAddToCartRef.current = null;
    }

    trackCartInterceptActionApi(storeId, {
      visitor_id: visitorId,
      customer_id: user.isLoggedIn ? user.email : null,
      customer_name: user.isLoggedIn ? user.name : null,
      customer_email: user.isLoggedIn ? user.email : null,
      modal_type: cartInterceptConfig.active_modal as any,
      action: 'dismissed',
    }).catch(() => {});

    setIsCartInterceptOpen(false);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
    showToast(language === 'ar' ? 'تم حذف العنصر من السلة' : 'Item removed from bag');
  };

  const updateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === cartItemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast(language === 'ar' ? 'تمت الإزالة من المفضلة' : 'Removed from wishlist');
        return prev.filter((id) => id !== productId);
      } else {
        showToast(language === 'ar' ? 'تمت الإضافة إلى المفضلة' : 'Added to wishlist');
        return [...prev, productId];
      }
    });
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  const navigateToProduct = (product: Product) => {
    setSelectedProduct(product);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('unityteck_mecca_product_id', product.id);
        const url = new URL(window.location.href);
        url.searchParams.set('page', 'product');
        url.searchParams.set('product', product.id);
        window.history.replaceState({ page: 'product', product: product.id }, '', url.toString());
      }
    } catch {}
    setCurrentPage('product');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };

  const navigateToCategory = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setCurrentPage('catalog');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  };

  const cartSubtotal = cart.reduce((acc, item) => {
    const addonsTotal = item.addons.reduce((aSum, a) => aSum + a.price, 0);
    return acc + (item.product.price + addonsTotal) * item.quantity;
  }, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const freeShippingThreshold = 299;
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - cartSubtotal);

  const [appliedCoupon, setAppliedCoupon] = useState<CouponItem | null>(null);

  const appliedDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.status !== 'active') return 0;
    if (appliedCoupon.minOrderValue && cartSubtotal < appliedCoupon.minOrderValue) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      return Math.round(cartSubtotal * (appliedCoupon.discountValue / 100));
    }
    return Math.min(cartSubtotal, appliedCoupon.discountValue);
  }, [appliedCoupon, cartSubtotal]);

  const applyCouponCode = (rawCode: string): { success: boolean; message: string; discount: number } => {
    if (!rawCode || !rawCode.trim()) {
      return {
        success: false,
        message: language === 'ar' ? 'يرجى كتابة كود الخصم' : 'Please enter a coupon code',
        discount: 0,
      };
    }
    const cleanCode = rawCode.trim().toUpperCase().replace(/\s+/g, '');
    const found = (currentCoupons || []).find((c) => c.code.toUpperCase() === cleanCode);

    if (!found) {
      return {
        success: false,
        message: language === 'ar' ? `كود الخصم "${cleanCode}" غير صحيح أو غير متوفر` : `Coupon "${cleanCode}" is invalid`,
        discount: 0,
      };
    }

    if (found.status !== 'active') {
      return {
        success: false,
        message: language === 'ar' ? 'هذا الكود غير نشط أو منتهي الصلاحية' : 'This coupon is expired or inactive',
        discount: 0,
      };
    }

    if (found.validUntil) {
      const today = new Date().toISOString().split('T')[0];
      if (today > found.validUntil) {
        return {
          success: false,
          message: language === 'ar' ? 'انتهت صلاحية هذا الكود' : 'This coupon has expired',
          discount: 0,
        };
      }
    }

    if (found.maxUsage && (found.usageCount || 0) >= found.maxUsage) {
      return {
        success: false,
        message: language === 'ar' ? 'وصل الكوبون للحد الأقصى من الاستخدام' : 'Coupon reached maximum usage limit',
        discount: 0,
      };
    }

    if (found.minOrderValue && cartSubtotal < found.minOrderValue) {
      return {
        success: false,
        message:
          language === 'ar'
            ? `الحد الأدنى لتطبيق هذا الكوبون هو ${found.minOrderValue} ر.س (سلتك الحالية: ${cartSubtotal} ر.س)`
            : `Minimum order for this coupon is ${found.minOrderValue} SAR (Current: ${cartSubtotal} SAR)`,
        discount: 0,
      };
    }

    setAppliedCoupon(found);
    const disc =
      found.discountType === 'percentage'
        ? Math.round(cartSubtotal * (found.discountValue / 100))
        : Math.min(cartSubtotal, found.discountValue);

    return {
      success: true,
      message:
        language === 'ar'
          ? `تم تطبيق الكوبون "${found.code}" وحصلت على خصم ${disc} ر.س 🎉`
          : `Coupon "${found.code}" applied! You saved ${disc} SAR 🎉`,
      discount: disc,
    };
  };

  const removeAppliedCoupon = () => {
    setAppliedCoupon(null);
  };

  const placeOrder = (orderInfo: Partial<Order>): Order => {
    const shipping = cartSubtotal >= 299 ? 0 : 35;
    const discount = orderInfo.discount !== undefined ? orderInfo.discount : appliedDiscount;
    const finalTotal = Math.max(0, cartSubtotal + shipping - discount);

    const newOrder: Order = {
      orderId: `HDY-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString().split('T')[0],
      items: [...cart],
      subtotal: cartSubtotal,
      shipping,
      discount,
      total: finalTotal,
      status: 'confirmed',
      recipientName: orderInfo.recipientName || 'المستلم الكريم',
      recipientPhone: orderInfo.recipientPhone || '+966 50 000 0000',
      city: orderInfo.city || 'مكة المكرمة',
      address: orderInfo.address || 'حي العوالي، مكة المكرمة',
      deliveryDate: orderInfo.deliveryDate || 'اليوم',
      deliveryTimeSlot: orderInfo.deliveryTimeSlot || 'توصيل عاجل خلال ساعة',
      isAnonymousSender: !!orderInfo.isAnonymousSender,
      paymentMethod: orderInfo.paymentMethod || 'مدى (Mada)',
      cardMessage: orderInfo.cardMessage
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    try {
      localStorage.setItem('mecca_gifts_customer_orders', JSON.stringify(updatedOrders));
      const newPoints = loyaltyPoints + Math.floor(finalTotal * 0.1);
      setLoyaltyPoints(newPoints);
      localStorage.setItem('mecca_gifts_customer_loyalty', String(newPoints));
    } catch {}
    setLastOrder(newOrder);

    // Sync order to dashboard with dynamic UTM / Traffic attribution
    if (tenantAddOrder && activeStore?.id) {
      try {
        let orderSource = 'Direct / Storefront';
        let attributionDetails: any = null;
        try {
          const stored = sessionStorage.getItem('selia_traffic_attribution') || localStorage.getItem('selia_traffic_attribution');
          if (stored) {
            attributionDetails = JSON.parse(stored);
            if (attributionDetails.source) {
              const src = attributionDetails.source.toLowerCase();
              if (src.includes('google')) orderSource = `Google Ads (${attributionDetails.medium || 'cpc'})`;
              else if (src.includes('tiktok')) orderSource = `TikTok Ads (${attributionDetails.medium || 'reels'})`;
              else if (src.includes('snapchat')) orderSource = `Snapchat (${attributionDetails.medium || 'stories'})`;
              else if (src.includes('instagram')) orderSource = `Instagram (${attributionDetails.medium || 'bio'})`;
              else if (src.includes('whatsapp')) orderSource = `WhatsApp (${attributionDetails.medium || 'direct'})`;
              else if (src.includes('qr_stand')) orderSource = `Hotel QR Stand`;
              else orderSource = `${attributionDetails.source} (${attributionDetails.campaign || 'Campaign'})`;
            }
          }
        } catch {}

        tenantAddOrder({
          orderNumber: `#${newOrder.orderId}`,
          customerName: newOrder.recipientName,
          customerPhone: newOrder.recipientPhone,
          customerEmail: user?.email || 'customer@hadayamakkah.sa',
          customerAvatar: 'VIP',
          itemsCount: newOrder.items.length,
          itemsSummary: newOrder.items.map((i) => i.product.name).join(', '),
          items: newOrder.items.map((i) => ({
            id: i.productId,
            name: i.product.name,
            sku: (i.product as any).sku || 'HM-ITEM',
            price: i.product.price,
            quantity: i.quantity,
            total: i.product.price * i.quantity,
            image: i.product.image,
          })),
          subtotal: newOrder.subtotal,
          discountAmount: newOrder.discount,
          shippingFee: newOrder.shipping,
          tax: Math.round(newOrder.total * 0.15),
          total: newOrder.total,
          source: orderSource,
          deliveryLocation: `${newOrder.city}, ${newOrder.address}`,
          status: 'pending',
          paymentMethod: newOrder.paymentMethod,
          paymentStatus: 'Paid',
          customerNotes: newOrder.cardMessage,
          attribution: attributionDetails,
        } as any);
      } catch (err) {
        console.warn('Tenant order sync non-blocking error:', err);
      }
    }

    clearCart();
    setShowInvoiceModal(true); // Open official alert popup invoice
    setCurrentPage('thankyou');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return newOrder;
  };

  const cancelOrderRequest = (orderId: string, reason?: string) => {
    const updated = orders.map((o) => {
      const isMatch = o.orderId === orderId || o.orderId === `#${orderId}` || `#${o.orderId}` === orderId;
      if (isMatch) {
        return {
          ...o,
          status: 'cancellation_requested' as const,
          cancelReason: reason || 'طلب إلغاء من العميل',
          cancelRequestedAt: new Date().toISOString(),
          refundStatus: 'pending' as const,
        };
      }
      return o;
    });

    setOrders(updated);
    try {
      localStorage.setItem('mecca_gifts_customer_orders', JSON.stringify(updated));
    } catch {}

    // Sync to dashboard orders so Admin sees it immediately
    if (activeStore?.id) {
      try {
        const cleanId = orderId.replace(/^#/, '');
        const found = currentOrders?.find(
          (co) => co.orderNumber.replace(/^#/, '') === cleanId || co.id === cleanId
        );
        if (found) {
          updateOrderStatus(found.id, 'cancellation_requested' as any, activeStore.id);
          updateOrder(
            found.id,
            {
              status: 'cancellation_requested' as any,
              refundStatus: 'pending',
              cancelReason: reason || 'طلب إلغاء من العميل واسترداد المبلغ',
              cancelRequestedAt: new Date().toISOString(),
            },
            activeStore.id
          );
        }
      } catch (err) {
        console.warn('Sync cancel request error:', err);
      }
    }

    showToast(
      language === 'ar'
        ? 'تم إرسال طلب إلغاء الطلب للإدارة للمراجعة والموافقة على استرداد المبلغ ⏳'
        : 'Order cancellation & refund request submitted to admin for approval ⏳'
    );
  };

  const addOccasion = (item: Omit<OccasionReminder, 'id'>) => {
    const newOccasion: OccasionReminder = {
      ...item,
      id: `occ-${Date.now()}`
    };
    setSavedOccasions((prev) => [...prev, newOccasion]);
    showToast(language === 'ar' ? 'تم حفظ المناسبة بنجاح' : 'Occasion saved successfully');
  };

  const removeOccasion = (id: string) => {
    setSavedOccasions((prev) => prev.filter((item) => item.id !== id));
    showToast(language === 'ar' ? 'تم حذف المناسبة' : 'Occasion deleted');
  };

  const addAddress = (addr: Omit<SavedAddress, 'id'>) => {
    const newAddress: SavedAddress = {
      ...addr,
      id: `addr-${Date.now()}`
    };
    setSavedAddresses((prev) => [...prev, newAddress]);
    showToast(language === 'ar' ? 'تم إضافة العنوان بنجاح' : 'Address added successfully');
  };

  const removeAddress = (id: string) => {
    setSavedAddresses((prev) => prev.filter((addr) => addr.id !== id));
    showToast(language === 'ar' ? 'تم حذف العنوان' : 'Address deleted');
  };

  return (
    <AppContext.Provider
      value={{
        products,
        language,
        setLanguage,
        currentPage,
        setCurrentPage: setPageSafe,
        selectedCategory,
        setSelectedCategory,
        selectedProduct,
        setSelectedProduct,
        cart,
        isCartOpen,
        setIsCartOpen,
        wishlist,
        orders,
        lastOrder,
        loyaltyPoints,
        savedAddresses,
        savedOccasions,
        toastMessage,
        user,
        loginWithGoogle,
        logout,
        showInvoiceModal,
        setShowInvoiceModal,
        isAuthModalOpen,
        setIsAuthModalOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isWishlisted,
        navigateToProduct,
        navigateToCategory,
        placeOrder,
        cancelOrderRequest,
        addOccasion,
        removeOccasion,
        addAddress,
        removeAddress,
        cartSubtotal,
        cartCount,
        freeShippingRemaining,
        appliedCoupon,
        appliedDiscount,
        applyCouponCode,
        removeAppliedCoupon,
        builderDevice,
        setBuilderDevice,
        isCartInterceptOpen,
        setIsCartInterceptOpen,
        cartInterceptConfig,
        handleCartInterceptPrimary,
        handleCartInterceptSecondary,
        handleCartInterceptClose,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

const DEFAULT_FALLBACK_APP_CONTEXT: AppContextType = {
  products: PRODUCTS,
  language: 'ar',
  setLanguage: () => {},
  currentPage: 'home',
  setCurrentPage: () => {},
  selectedCategory: null,
  setSelectedCategory: () => {},
  selectedProduct: null,
  setSelectedProduct: () => {},
  cart: [],
  isCartOpen: false,
  setIsCartOpen: () => {},
  wishlist: [],
  orders: INITIAL_ORDERS,
  lastOrder: INITIAL_ORDERS[0] || null,
  loyaltyPoints: 120,
  savedAddresses: INITIAL_ADDRESSES,
  savedOccasions: INITIAL_OCCASIONS,
  toastMessage: null,
  user: {
    name: 'عميل مكة المكرمة',
    email: 'client@giftshop-sa.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    isLoggedIn: false,
  },
  loginWithGoogle: () => {},
  logout: () => {},
  showInvoiceModal: false,
  setShowInvoiceModal: () => {},
  isAuthModalOpen: false,
  setIsAuthModalOpen: () => {},
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  toggleWishlist: () => {},
  isWishlisted: () => false,
  navigateToProduct: () => {},
  navigateToCategory: () => {},
  placeOrder: () => ({} as Order),
  cancelOrderRequest: () => {},
  addOccasion: () => {},
  removeOccasion: () => {},
  addAddress: () => {},
  removeAddress: () => {},
  cartSubtotal: 0,
  cartCount: 0,
  freeShippingRemaining: 299,
  appliedCoupon: null,
  appliedDiscount: 0,
  applyCouponCode: () => ({ success: false, message: '', discount: 0 }),
  removeAppliedCoupon: () => {},
  builderDevice: 'desktop',
  setBuilderDevice: () => {},
  isCartInterceptOpen: false,
  setIsCartInterceptOpen: () => {},
  cartInterceptConfig: {
    enabled: true,
    active_modal: 'loyalty',
    loyalty_points: 25,
    discount_percent: 10,
    coupon_code: 'HADAYA10',
    title_en: "Don't Lose Your Points!",
    title_ar: 'لا تفوّت نقاطك الذهبية!',
    subtitle_en: 'Log in and earn 25 points on this cart.',
    subtitle_ar: 'سجّل دخولك الآن واكسب 25 نقطة إضافية على هذه السلة.',
  },
  handleCartInterceptPrimary: () => {},
  handleCartInterceptSecondary: () => {},
  handleCartInterceptClose: () => {},
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    return DEFAULT_FALLBACK_APP_CONTEXT;
  }
  return context;
};

