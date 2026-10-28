import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product, CartItem, ProductColor, StorageOption, WarrantyOption, BundleOption, CustomCornerOrderSpecs } from '../types';
import { PRODUCTS } from '../data/products';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import type { CouponItem } from '../../../types';
import { sellingPrice } from '../../../utils/productPricing';

import { FlyingCartOverlay, FlyingCartItem } from '../components/FlyingCartOverlay';
import { readStoreIdentity, type StoreIdentitySettings } from '../../settings/storeIdentity';

export type RouteType =
  | 'home'
  | 'products'
  | 'product-detail'
  | 'product-buy'
  | 'custom-order'
  | 'cart'
  | 'checkout'
  | 'profile'
  | 'reviews'
  | 'thankyou'
  | 'privacy'
  | 'return'
  | 'terms'
  | 'shipping'
  | 'warranty'
  | 'locator'
  | 'track-order'
  | 'about'
  | 'contact'
  | 'faq'
  | 'page';

export interface OrderItemRecord {
  id: string;
  orderNumber: string;
  date: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  shippingAddress: {
    name: string;
    phone: string;
    city: string;
    district: string;
    street: string;
  };
  status: string;
}

export interface UserState {
  isLoggedIn: boolean;
  name: string;
  email: string;
  phone?: string;
  points: number;
  orders: OrderItemRecord[];
}

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  cartBump: boolean;
  triggerFlyToCart: (
    startRect: DOMRect | { left: number; top: number; width: number; height: number },
    image: string
  ) => void;
  cartTotal: number;
  cartVat: number;
  isMiniCartOpen: boolean;
  setIsMiniCartOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  currentRoute: RouteType;
  previousRoute: RouteType;
  goBack: () => void;
  selectedProductId: string;
  selectedProduct: Product;
  products: Product[];
  storeIdentity?: StoreIdentitySettings;
  selectedPageSlug?: string;
  countryNoticeVisible: boolean;
  dismissCountryNotice: () => void;
  language: 'EN' | 'AR';
  setLanguage: (lang: 'EN' | 'AR') => void;
  toggleLanguage: () => void;
  user: UserState;
  loginUser: (name: string, email: string, phone?: string) => void;
  logoutUser: () => void;
  lastOrder: OrderItemRecord | null;
  setLastOrder: (order: OrderItemRecord | null) => void;
  addToCart: (
    product: Product,
    color?: ProductColor,
    storage?: StorageOption,
    warranty?: WarrantyOption,
    bundles?: BundleOption[],
    openMiniCart?: boolean
  ) => void;
  addCustomCornerToCart: (
    specs: CustomCornerOrderSpecs,
    totalPrice: number,
    openMiniCart?: boolean
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  navigateTo: (route: string, productId?: string, pageSlug?: string) => void;
  showToast: (msg: string) => void;
  toastMessage: string | null;
  appliedCoupon: CouponItem | null;
  couponDiscount: number;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('unityteck_coffee_cart');
        return saved ? JSON.parse(saved) : [];
      }
    } catch {}
    return [];
  });

  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<RouteType>('home');
  const [previousRoute, setPreviousRoute] = useState<RouteType>('home');
  const [routeHistory, setRouteHistory] = useState<RouteType[]>(['home']);
  const [selectedProductId, setSelectedProductId] = useState<string>('hb-h10a-dualboiler');
  const [selectedPageSlug, setSelectedPageSlug] = useState<string>('privacy-policy');
  const [countryNoticeVisible, setCountryNoticeVisible] = useState(true);

  let prefs: ReturnType<typeof usePrefs> | null = null;
  try {
    prefs = usePrefs();
  } catch {
    prefs = null;
  }

  const [localLanguage, setLocalLanguage] = useState<'EN' | 'AR'>(() => {
    try {
      const saved = localStorage.getItem('unityteck_coffee_lang') || localStorage.getItem('unityteck_prefs');
      if (saved) {
        if (saved === 'EN' || saved === 'en' || saved.includes('"locale":"en"')) return 'EN';
        if (saved === 'AR' || saved === 'ar' || saved.includes('"locale":"ar"')) return 'AR';
      }
    } catch {}
    return 'AR';
  });

  const language: 'EN' | 'AR' = prefs?.locale ? (prefs.locale === 'ar' ? 'AR' : 'EN') : localLanguage;

  const setLanguage = useCallback((lang: 'EN' | 'AR') => {
    try {
      localStorage.setItem('unityteck_coffee_lang', lang);
    } catch {}
    setLocalLanguage(lang);
    if (prefs?.setLocale) {
      prefs.setLocale(lang === 'AR' ? 'ar' : 'en');
    }
  }, [prefs]);

  const toggleLanguage = useCallback(() => {
    const next = language === 'EN' ? 'AR' : 'EN';
    setLanguage(next);
  }, [language, setLanguage]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [flyingItems, setFlyingItems] = useState<FlyingCartItem[]>([]);
  const [cartBump, setCartBump] = useState<boolean>(false);

  const triggerFlyToCart = (
    startRect: DOMRect | { left: number; top: number; width: number; height: number },
    image: string
  ) => {
    const id = `fly_${Date.now()}_${Math.random()}`;
    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;

    const cartBtn = document.getElementById('header-cart-btn');
    const cartRect = cartBtn?.getBoundingClientRect();
    const endX = cartRect ? cartRect.left + cartRect.width / 2 : window.innerWidth - 48;
    const endY = cartRect ? cartRect.top + cartRect.height / 2 : 32;

    setFlyingItems((prev) => [...prev, { id, startX, startY, endX, endY, image }]);

    setTimeout(() => {
      setCartBump(true);
      setTimeout(() => setCartBump(false), 650);
      setFlyingItems((prev) => prev.filter((f) => f.id !== id));
    }, 820);
  };

  const [lastOrder, setLastOrder] = useState<OrderItemRecord | null>(null);

  const [user, setUser] = useState<UserState>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('unityteck_coffee_customer');
        if (saved) return JSON.parse(saved);
      }
    } catch {}
    return {
      isLoggedIn: false,
      name: '',
      email: '',
      phone: '',
      points: 0,
      orders: [],
    };
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('unityteck_coffee_cart', JSON.stringify(cart));
      }
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('unityteck_coffee_customer', JSON.stringify(user));
      }
    } catch {}
  }, [user]);

  // Reset to Home page at top on every page load/refresh
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    setCurrentRoute('home');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });

    // Clean hash so browser doesn't anchor-scroll (preserve search params)
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = language === 'AR' ? 'rtl' : 'ltr';
    document.documentElement.lang = language === 'AR' ? 'ar' : 'en';
  }, [language]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const dismissCountryNotice = () => {
    setCountryNoticeVisible(false);
  };

  const navigateTo = useCallback((route: string, productId?: string, pageSlug?: string) => {
    if (productId) {
      setSelectedProductId((prev) => (prev !== productId ? productId : prev));
    }
    if (pageSlug) {
      setSelectedPageSlug(pageSlug);
    } else if (
      route === 'privacy' ||
      route === 'return' ||
      route === 'terms' ||
      route === 'shipping' ||
      route === 'warranty' ||
      route === 'locator' ||
      route === 'track-order' ||
      route === 'about' ||
      route === 'contact' ||
      route === 'faq'
    ) {
      setSelectedPageSlug(
        route === 'privacy'
          ? 'privacy-policy'
          : route === 'return'
          ? 'return-policy'
          : route === 'terms'
          ? 'terms-and-conditions'
          : route === 'shipping'
          ? 'shipping-policy'
          : route === 'warranty'
          ? 'warranty-policy'
          : route === 'locator'
          ? 'store-locator'
          : route === 'track-order'
          ? 'order-tracking'
          : route === 'about'
          ? 'about-us'
          : route === 'contact'
          ? 'contact-us'
          : 'faq'
      );
    }
    const targetRoute = route as RouteType;
    setCurrentRoute((prev) => {
      setPreviousRoute(prev);
      setRouteHistory((h) => {
        if (h.length > 0 && h[h.length - 1] === targetRoute) return h;
        return [...h, targetRoute];
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return targetRoute;
    });
  }, []);

  const goBack = useCallback(() => {
    setRouteHistory((prevHistory) => {
      if (prevHistory.length > 1) {
        const updatedHistory = [...prevHistory];
        updatedHistory.pop();
        const prev = updatedHistory[updatedHistory.length - 1] || 'home';
        setCurrentRoute(prev);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return updatedHistory;
      }
      setCurrentRoute('products');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return ['home', 'products'];
    });
  }, []);

  const addToCart = (
    product: Product,
    color?: ProductColor,
    storage?: StorageOption,
    warranty?: WarrantyOption,
    bundles?: BundleOption[],
    openMiniCart: boolean = true
  ) => {
    const selectedColor = color || product.colors[0];
    const selectedStorage = storage || product.storageOptions[0];
    const extraPrice = (selectedColor?.priceDelta || 0) +
      (selectedStorage.priceDelta || 0) +
      (warranty ? warranty.price : 0) +
      (bundles ? bundles.reduce((s, b) => s + b.price, 0) : 0);
    const unitPrice = product.basePrice + extraPrice;

    const newItem: CartItem = {
      id: `cart_${Date.now()}_${Math.random()}`,
      productId: product.id,
      productName: product.name,
      unitPrice,
      quantity: 1,
      image: selectedColor.image,
      selectedColor,
      selectedStorage,
      selectedWarranty: warranty,
      selectedBundles: bundles
    };

    setCart(prev => [newItem, ...prev]);
    if (openMiniCart) {
      setIsMiniCartOpen(true);
    }
    const toastMsg = language === 'AR'
      ? `تمت إضافة "${product.nameAr || product.name}" إلى السلة ✦`
      : `Added "${product.name}" to Shopping Bag ✦`;
    showToast(toastMsg);
  };

  const addCustomCornerToCart = (
    specs: CustomCornerOrderSpecs,
    totalPrice: number,
    openMiniCart: boolean = true
  ) => {
    const defaultColorImage = specs.structureColor.image || './src/assets/images/hero_coffee_corner_cabinet_1791217199146.jpg';
    const cornerNameEn = 'HiBrew Bespoke Tailor-Made Coffee Corner';
    const cornerNameAr = 'ركن قهوة فاخر تفصيل حسب الطلب (هايبرو)';

    const newItem: CartItem = {
      id: `custom_corner_${Date.now()}_${Math.random()}`,
      productId: 'hb-custom-corner',
      productName: language === 'AR' ? cornerNameAr : cornerNameEn,
      unitPrice: totalPrice,
      quantity: 1,
      image: defaultColorImage,
      selectedColor: {
        name: specs.structureColor.name,
        nameAr: specs.structureColor.nameAr,
        hex: specs.structureColor.hex,
        image: defaultColorImage
      },
      selectedStorage: {
        capacity: `${specs.dimensions.width}×${specs.dimensions.depth}×${specs.dimensions.height} cm`,
        ram: specs.woodTypeNameAr || specs.woodTypeName,
        priceDelta: 0
      },
      customCornerSpecs: specs
    };

    setCart(prev => [newItem, ...prev]);
    if (openMiniCart) {
      setIsMiniCartOpen(true);
    }
    const toastMsg = language === 'AR'
      ? 'تمت إضافة ركن القهوة المخصص إلى سلة المشتريات ✦'
      : 'Added Tailor-Made Coffee Corner to Shopping Bag ✦';
    showToast(toastMsg);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev =>
      prev.map(item => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const loginUser = (name: string, email: string, phone?: string) => {
    setUser(prev => ({
      ...prev,
      isLoggedIn: true,
      name,
      email,
      phone: phone || prev.phone || '',
      points: prev.points || 0
    }));
    showToast(`Welcome, ${name}!`);
  };

  const logoutUser = () => {
    setUser({
      isLoggedIn: false,
      name: '',
      email: '',
      phone: '',
      points: 0,
      orders: []
    });
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const cartVat = Math.round(cartTotal * 0.15 / 1.15); // 15% inclusive VAT

  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    const handleSync = () => setSyncTick((t) => t + 1);
    window.addEventListener('unityteck-product-updated', handleSync);
    window.addEventListener('unityteck-categories-updated', handleSync);
    window.addEventListener('unityteck-brands-updated', handleSync);
    window.addEventListener('unityteck-theme-settings', handleSync);
    window.addEventListener('unityteck-theme-identity', handleSync);
    window.addEventListener('unityteck-store-updated', handleSync);
    window.addEventListener('unityteck-pages-changed', handleSync);
    window.addEventListener('unityteck-data', handleSync);
    window.addEventListener('storage', handleSync);
    const handleMsg = (e: MessageEvent) => {
      if (e.data?.type === 'UNITYTECK_PREVIEW_SYNC' || e.data?.type === 'UNITYTECK_THEME_SYNC') {
        setSyncTick((t) => t + 1);
      }
    };
    window.addEventListener('message', handleMsg);
    return () => {
      window.removeEventListener('unityteck-product-updated', handleSync);
      window.removeEventListener('unityteck-categories-updated', handleSync);
      window.removeEventListener('unityteck-brands-updated', handleSync);
      window.removeEventListener('unityteck-theme-settings', handleSync);
      window.removeEventListener('unityteck-theme-identity', handleSync);
      window.removeEventListener('unityteck-store-updated', handleSync);
      window.removeEventListener('unityteck-pages-changed', handleSync);
      window.removeEventListener('unityteck-data', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('message', handleMsg);
    };
  }, []);

  let tenant: ReturnType<typeof useTenant> | null = null;
  try {
    tenant = useTenant();
  } catch {
    tenant = null;
  }

  // ── Unified Coupon Engine (real store coupons from TenantContext) ──
  const [appliedCoupon, setAppliedCoupon] = useState<CouponItem | null>(null);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon || appliedCoupon.status !== 'active') return 0;
    if (appliedCoupon.minOrderValue && cartTotal < appliedCoupon.minOrderValue) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      return Math.round(cartTotal * (appliedCoupon.discountValue / 100));
    }
    return Math.min(cartTotal, appliedCoupon.discountValue);
  }, [appliedCoupon, cartTotal]);

  const applyCoupon = (rawCode: string): { success: boolean; message: string } => {
    const isAr = language === 'AR';
    const code = (rawCode || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!code) return { success: false, message: isAr ? 'يرجى إدخال كود الخصم' : 'Please enter a coupon code' };
    const list: CouponItem[] = (tenant?.currentCoupons as CouponItem[]) || [];
    const found = list.find((c) => c.code.toUpperCase() === code);
    if (!found) return { success: false, message: isAr ? 'كود الخصم غير صحيح' : 'Invalid coupon code' };
    if (found.status !== 'active') return { success: false, message: isAr ? 'الكود غير نشط أو منتهي' : 'Coupon is inactive or expired' };
    if (found.validUntil && !found.noExpiry && new Date().toISOString().split('T')[0] > found.validUntil) {
      return { success: false, message: isAr ? 'انتهت صلاحية الكود' : 'Coupon has expired' };
    }
    if (found.maxUsage && (found.usageCount || 0) >= found.maxUsage) {
      return { success: false, message: isAr ? 'تم بلوغ الحد الأقصى لاستخدام الكود' : 'Coupon usage limit reached' };
    }
    if (found.minOrderValue && cartTotal < found.minOrderValue) {
      return {
        success: false,
        message: isAr ? `الحد الأدنى للطلب ${found.minOrderValue} ر.س` : `Minimum order is SAR ${found.minOrderValue}`
      };
    }
    setAppliedCoupon(found);
    return { success: true, message: isAr ? `تم تطبيق الكود ${found.code}` : `Coupon ${found.code} applied` };
  };

  const removeCoupon = () => setAppliedCoupon(null);

  // Merge database/API products reactively with theme catalog
  const mergedProducts = useMemo(() => {
    const activeStoreId = tenant?.activeStore?.id || 'store-coffee';
    let dbProducts: any[] = [];
    if (tenant?.allProducts && tenant.allProducts[activeStoreId] && tenant.allProducts[activeStoreId].length > 0) {
      dbProducts = tenant.allProducts[activeStoreId];
    } else if (tenant?.currentProducts && tenant.activeStore?.id === activeStoreId && tenant.currentProducts.length > 0) {
      dbProducts = tenant.currentProducts;
    } else {
      try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('unityteck_products_map') : null;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed[activeStoreId]) && parsed[activeStoreId].length > 0) {
            dbProducts = parsed[activeStoreId];
          }
        }
      } catch {}
    }

    if (!dbProducts.length) {
      // Flagship store initial seed or empty
      return activeStoreId === 'store-coffee' || activeStoreId.includes('coffee') ? PRODUCTS : [];
    }

    // Dynamic resolution based strictly on current database/TenantContext products
    const resolvedList: Product[] = [];

    dbProducts.forEach((dp: any) => {
      const match = PRODUCTS.find(
        (p) =>
          p.id === dp.id ||
          p.id === dp.sku ||
          p.id?.toLowerCase() === dp.id?.toLowerCase() ||
          p.id?.toLowerCase() === dp.sku?.toLowerCase() ||
          p.name?.toLowerCase() === dp.name?.toLowerCase(),
      );

      const primaryImg =
        dp.image ||
        (dp.galleryUrls && dp.galleryUrls[0]) ||
        match?.colors?.[0]?.image ||
        match?.images?.[0] ||
        '/src/assets/images/hibrew_h7a_flagship_machine.png';

      if (match) {
        const updatedColors = primaryImg
          ? (match.colors && match.colors.length > 0
              ? [{ ...match.colors[0], image: primaryImg }, ...match.colors.slice(1)]
              : [{ name: 'Default', hex: '#1c1917', image: primaryImg }])
          : match.colors;
        const updatedImages = primaryImg
          ? [primaryImg, ...(dp.galleryUrls || match.images || []).filter((u: string) => u !== primaryImg)]
          : match.images;

        const sell = sellingPrice(Number(dp.price) || 0, dp.discountedPrice);
        const compareAt =
          dp.originalPrice && Number(dp.originalPrice) > sell
            ? Number(dp.originalPrice)
            : dp.discountedPrice && Number(dp.discountedPrice) > 0 && Number(dp.discountedPrice) < Number(dp.price)
              ? Number(dp.price)
              : match.originalPrice;

        resolvedList.push({
          ...match,
          id: dp.id,
          name: dp.name || match.name,
          nameAr: dp.nameAr || match.nameAr || dp.name,
          basePrice: sell || (dp.basePrice ?? match.basePrice),
          originalPrice: compareAt,
          category: dp.category || match.category,
          specComparisonImage: dp.specComparisonImage || match.specComparisonImage,
          specComparisonImageAr: dp.specComparisonImageAr || match.specComparisonImageAr,
          image: primaryImg,
          images: updatedImages,
          colors: updatedColors,
          tagline: dp.subtitle || dp.description || match.tagline,
          taglineAr: dp.subtitleAr || dp.descriptionAr || match.taglineAr,
        });
      } else {
        const sellNew = sellingPrice(Number(dp.price) || 0, dp.discountedPrice);
        const compareNew =
          dp.originalPrice && Number(dp.originalPrice) > sellNew
            ? Number(dp.originalPrice)
            : dp.discountedPrice && Number(dp.discountedPrice) > 0 && Number(dp.discountedPrice) < Number(dp.price)
              ? Number(dp.price)
              : undefined;

        resolvedList.push({
          id: dp.id,
          name: dp.name,
          nameAr: dp.nameAr || dp.name,
          tagline: dp.subtitle || dp.description || 'Specialty Coffee Gear',
          taglineAr: dp.subtitleAr || dp.descriptionAr || 'معدات القهوة المختصة والتحضير الاحترافي',
          category: (dp.category as any) || 'machines',
          basePrice: sellNew || (dp.basePrice ?? 0),
          originalPrice: compareNew,
          badge: dp.tags?.[0] || undefined,
          badgeAr: dp.tags?.[0] || undefined,
          reviewCount: dp.reviewsCount || 12,
          rating: dp.rating || 4.9,
          colors: [{ name: 'Default', hex: '#1c1917', image: primaryImg }],
          storageOptions: [{ capacity: 'Standard', ram: 'Default', priceDelta: 0 }],
          specs: dp.specs || [],
          images: [primaryImg, ...(dp.galleryUrls || []).filter((u: string) => u !== primaryImg)],
          overview: dp.description || '',
          overviewAr: dp.descriptionAr || '',
        });
      }
    });

    return resolvedList;
  }, [tenant?.currentProducts, tenant?.allProducts, tenant?.cacheEpoch, tenant?.activeStore?.id, syncTick]);

  const selectedProduct = mergedProducts.find(p => p.id === selectedProductId) || mergedProducts[0];

  const storeIdentity = useMemo(() => {
    return readStoreIdentity(
      tenant?.activeStore?.id || 'store-coffee',
      tenant?.activeStore || { name: 'HiBrew KSA' }
    );
  }, [tenant?.activeStore?.id, tenant?.activeStore?.name, tenant?.activeStore?.logo, syncTick]);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartBump,
        triggerFlyToCart,
        cartTotal,
        cartVat,
        isMiniCartOpen,
        setIsMiniCartOpen,
        isSearchOpen,
        setIsSearchOpen,
        currentRoute,
        previousRoute,
        goBack,
        selectedProductId,
        selectedProduct,
        products: mergedProducts,
        storeIdentity,
        selectedPageSlug,
        countryNoticeVisible,
        dismissCountryNotice,
        language,
        setLanguage,
        toggleLanguage,
        user,
        loginUser,
        logoutUser,
        lastOrder,
        setLastOrder,
        addToCart,
        addCustomCornerToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        navigateTo,
        showToast,
        toastMessage,
        appliedCoupon,
        couponDiscount,
        applyCoupon,
        removeCoupon
      }}
    >
      {children}
      <FlyingCartOverlay items={flyingItems} />
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
