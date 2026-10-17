import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product, CartItem, ProductColor, StorageOption, WarrantyOption, BundleOption, CustomCornerOrderSpecs } from '../types';
import { PRODUCTS } from '../data/products';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';

import { FlyingCartOverlay, FlyingCartItem } from '../components/FlyingCartOverlay';

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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Initial sample item: HiBrew Dual-Boiler 20-Bar Barista Pro
    const sampleProduct = PRODUCTS[0];
    return [
      {
        id: `cart_${Date.now()}`,
        productId: sampleProduct.id,
        productName: sampleProduct.name,
        unitPrice: sampleProduct.basePrice,
        quantity: 1,
        image: sampleProduct.colors[0].image,
        selectedColor: sampleProduct.colors[0],
        selectedStorage: sampleProduct.storageOptions[0]
      }
    ];
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

  const [user, setUser] = useState<UserState>({
    isLoggedIn: true,
    name: 'Fahad Al-Otaibi',
    email: 'alfahad3110@gmail.com',
    phone: '0501234567',
    points: 1250,
    orders: [
      {
        id: 'HB-892104',
        orderNumber: 'HB-892104',
        date: '28 Sep 2026',
        items: [
          {
            id: 'sample-1',
            productId: 'hb-h10a-dualboiler',
            productName: 'HiBrew Barista Pro H7A Dual-Boiler 20-Bar',
            unitPrice: 1899,
            quantity: 1,
            image: './src/assets/images/hibrew_espresso_isolated.jpg',
            selectedColor: {
              name: 'Brushed Steel',
              nameAr: 'ستانلس ستيل مصقول',
              hex: '#D1D5DB',
              image: './src/assets/images/hibrew_espresso_isolated.jpg'
            },
            selectedStorage: {
              capacity: 'Standard 58mm Kit',
              ram: 'Single & Double Baskets',
              priceDelta: 0
            }
          }
        ],
        total: 1899,
        paymentMethod: 'tabby',
        shippingAddress: {
          name: 'Fahad Al-Otaibi',
          phone: '0501234567',
          city: 'Riyadh (الرياض)',
          district: 'An Narjis',
          street: 'Anas Ibn Malik Street'
        },
        status: 'Delivered'
      }
    ]
  });

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
      phone: phone || prev.phone || '0501234567',
      points: prev.points > 0 ? prev.points : 500
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

  let tenant: ReturnType<typeof useTenant> | null = null;
  try {
    tenant = useTenant();
  } catch {
    tenant = null;
  }

  // Merge database/API products reactively with theme catalog
  const mergedProducts = useMemo(() => {
    const dbProducts = tenant?.currentProducts || [];
    if (!dbProducts.length) return PRODUCTS;

    return PRODUCTS.map(p => {
      const match = dbProducts.find(
        dp => dp.id === p.id || dp.sku === p.id || dp.name.toLowerCase() === p.name.toLowerCase()
      );
      if (!match) return p;
      return {
        ...p,
        name: match.name || p.name,
        nameAr: match.nameAr || p.nameAr,
        basePrice: match.price || p.basePrice,
        originalPrice: match.originalPrice ?? p.originalPrice,
        specComparisonImage: match.specComparisonImage || p.specComparisonImage,
        specComparisonImageAr: match.specComparisonImageAr || p.specComparisonImageAr,
        images: match.image ? [match.image, ...(match.galleryUrls || [])] : p.images,
      };
    });
  }, [tenant?.currentProducts]);

  const selectedProduct = mergedProducts.find(p => p.id === selectedProductId) || mergedProducts[0];

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
        toastMessage
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
