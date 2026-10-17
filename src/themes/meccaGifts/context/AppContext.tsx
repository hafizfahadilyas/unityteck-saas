import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Product, CartItem, Order, Language, OccasionReminder, SavedAddress, AddonOption } from '../types';
import { PRODUCTS, INITIAL_ORDERS, INITIAL_OCCASIONS, INITIAL_ADDRESSES } from '../data/mockData';
import { COFFEE_STORE_PRODUCTS } from '../../../data/hadayaMeccaData';
import { useTenant } from '../../../context/TenantContext';
import { CouponItem } from '../../../types';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentProducts, currentOrders, activeStore, currentCoupons, addOrder: tenantAddOrder, updateOrderStatus, updateOrder, recordCouponUsage } = useTenant();

  // Dynamic products from store tenant context with store-isolated fallbacks
  const products: Product[] = useMemo(() => {
    const isCoffee = activeStore?.id === 'store-coffee' || (activeStore?.category && activeStore.category.includes('قهوة'));

    if (currentProducts && currentProducts.length > 0) {
      return currentProducts.map((p) => {
        const isArName = /[\u0600-\u06FF]/.test(p.nameAr || p.name || '');
        const nameAr = p.nameAr || (isArName ? p.name : p.subtitleAr || p.name);
        const nameEn = (!isArName ? p.name : (p.subtitle || p.sku || p.name));
        const pAny = p as any;
        return {
          id: String(p.id),
          name: nameAr || (isCoffee ? 'محصول قهوة مختصة' : 'باقة ورد طبيعي'),
          nameEn: nameEn || (isCoffee ? 'Specialty Single Origin Coffee' : 'Fresh Flower Bouquet'),
          price: Number(p.discountedPrice || p.price || 0),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : (p.discountedPrice && p.discountedPrice < p.price ? Number(p.price) : undefined),
          rating: 4.9,
          reviewsCount: p.salesCount || 135,
          image: p.image || (isCoffee ? 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80' : '/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg'),
          additionalImages: p.galleryUrls && p.galleryUrls.length > 0 ? p.galleryUrls : [p.image],
          category: p.category || (isCoffee ? 'حبوب القهوة المختصة' : 'باقات الورود الطبيعية'),
          categoryEn: pAny.categoryEn || p.category || (isCoffee ? 'Specialty Beans' : 'Natural Flower Bouquets'),
          categorySlug: pAny.categorySlug || (p.category ? p.category.toLowerCase().replace(/\s+/g, '-') : (isCoffee ? 'coffee-beans' : 'bouquets')),
          occasions: p.tags || (isCoffee ? ['قهوة الصباح', 'محاصيل مختارة'] : ['هدايا الحرم', 'مناسبات خاصة']),
          tags: p.tags || (isCoffee ? ['قهوة مختصة', 'محمصة', 'حبوب بن'] : ['طبيعي', 'هولندي', 'فاخر']),
          badge: p.originalPrice ? 'عرض خاص' : undefined,
          badgeEn: p.originalPrice ? 'Special Offer' : undefined,
          description: p.descriptionAr || p.description || (isCoffee ? 'محصول قهوة مختصة محمص بعناية وإيحاءات فريدة.' : 'تنسيق فاخر من أجود أنواع الزهور والورود الطبيعية.'),
          descriptionEn: p.description || p.descriptionAr || (isCoffee ? 'Specialty single origin roasted coffee beans.' : 'Luxury fresh floral arrangement crafted with premium blooms.'),
          flowerTypes: isCoffee ? [] : (pAny.flowerTypes || ['جوري هولندي فاخر', 'بيبي روز', 'يوكاليبتوس']),
          dimensions: pAny.dimensions || (isCoffee ? '250g' : 'ارتفاع 50 سم × عرض 35 سم'),
          inStock: p.stock !== undefined ? p.stock > 0 : true,
          featured: true,
        };
      });
    }

    if (isCoffee) {
      return COFFEE_STORE_PRODUCTS.map((p) => {
        const isArName = /[\u0600-\u06FF]/.test(p.nameAr || p.name || '');
        const nameAr = p.nameAr || (isArName ? p.name : p.subtitleAr || p.name);
        const nameEn = (!isArName ? p.name : (p.subtitle || p.sku || p.name));
        return {
          id: String(p.id),
          name: nameAr || 'محصول قهوة مختصة',
          nameEn: nameEn || 'Specialty Coffee',
          price: Number(p.discountedPrice || p.price || 0),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
          rating: 4.9,
          reviewsCount: p.salesCount || 140,
          image: p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
          additionalImages: p.galleryUrls && p.galleryUrls.length > 0 ? p.galleryUrls : [p.image],
          category: p.category || 'حبوب القهوة المختصة',
          categoryEn: 'Specialty Beans',
          categorySlug: 'coffee-beans',
          occasions: ['قهوة الصباح', 'تحميص طازج'],
          tags: ['قهوة مختصة', 'محمصة', 'سنجل أوريجن'],
          badge: p.originalPrice ? 'عرض خاص' : undefined,
          badgeEn: p.originalPrice ? 'Special Offer' : undefined,
          description: p.descriptionAr || p.description || 'محصول قهوة مختصة فريد النكهات.',
          descriptionEn: p.description || 'Specialty single origin beans.',
          flowerTypes: [],
          dimensions: '250g',
          inStock: true,
          featured: true,
        };
      });
    }

    return PRODUCTS;
  }, [currentProducts, activeStore]);

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

  const [language, setLanguageState] = useState<Language>('ar');
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
      }
    } catch {}
    return 'home';
  });

  const setCurrentPage = (page: string) => {
    const valid = resolveValidPage(page) || 'home';
    setCurrentPageState(valid);
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (valid === 'home') {
          url.searchParams.delete('page');
        } else {
          url.searchParams.set('page', valid);
        }
        window.history.pushState({ page: valid }, '', url.toString());
      }
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => products[0] || PRODUCTS[0]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [wishlist, setWishlist] = useState<string[]>(['wm-peony-05', 'wm-val-06', 'disc-1']);
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
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(INITIAL_ADDRESSES);
  const [savedOccasions, setSavedOccasions] = useState<OccasionReminder[]>(INITIAL_OCCASIONS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

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

  const [cart, setCart] = useState<CartItem[]>([
    {
      id: 'cart-init-1',
      productId: PRODUCTS[0].id,
      product: PRODUCTS[0],
      quantity: 1,
      selectedSize: 'الحجم الفاخر الملكي',
      cardMessage: 'أجمل التهاني بمناسبة قدوم مولودكم الجديد',
      addons: []
    }
  ]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

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

    showToast(language === 'ar' ? `مرحباً بك ${finalName} في متجر هدايا مكة ✓` : `Welcome back ${finalName} ✓`);
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

  const addToCart = (
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
    setCurrentPage('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToCategory = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setCurrentPage('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    return DEFAULT_FALLBACK_APP_CONTEXT;
  }
  return context;
};

