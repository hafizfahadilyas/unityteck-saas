import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Car, 
  ShieldCheck, 
  Sparkles, 
  MapPin, 
  Search, 
  ShoppingCart, 
  X, 
  Star, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown,
  ChevronUp,
  CheckCircle2, 
  CheckCircle,
  Check,
  Award, 
  Truck, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Globe, 
  Palette, 
  SlidersHorizontal,
  RefreshCw,
  Phone,
  Calendar,
  FileText,
  Lock,
  Eye,
  ExternalLink,
  ArrowRight,
  Menu,
  Layers,
  CreditCard,
  User
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { submitPublicStorefrontOrder } from '../../utils/submitStorefrontOrder';
import { readTrafficSource } from '../../utils/trafficSource';
import { trackStorefrontEvent } from '../../utils/storefrontAnalytics';
import {
  validateStorefrontCoupon,
  fetchStoreReviewsApi,
  calculateShippingRates,
  type StoreReviewRecord,
} from '../../api/tenantApi';
import { usePrefs } from '../../i18n/PrefsContext';
import { Product, CategoryItem } from '../../types';
import { 
  CAR_BRANDS, 
  CAR_MODELS_MAP, 
  CarModelDef,
  SEAT_COLORS, 
  FLOOR_MAT_COLORS,
  FloorMatColorOption,
  BLECO_CATEGORIES,
  BLECO_STORE_INFO, 
  CarBrandItem, 
  SeatColorOption,
  BlecoBlogPost,
  getProductColors
} from '../../data/blecoStoreData';
import { readAllThemeSettings } from '../settings/themeSettingsStore';
import { AlsaeediLuxuryFooter } from './components/AlsaeediLuxuryFooter';
import { AlsaeediServicesBooking } from './components/AlsaeediServicesBooking';
import { FloorMatLuxuryModal, FloorMatCustomSpecs } from './components/FloorMatLuxuryModal';
import { SeatCoverLuxuryModal, SeatCoverCustomSpecs } from './components/SeatCoverLuxuryModal';
import { VehicleMatchAlertModal } from './components/VehicleMatchAlertModal';
import { CoreTwoCategoriesSection } from './components/CoreTwoCategoriesSection';
import { AutomotiveBlogModal } from './components/AutomotiveBlogModal';
import { LuxuryVehicleCockpit } from './components/LuxuryVehicleCockpit';
import { AlsaeediLuxuryHero } from './components/AlsaeediLuxuryHero';
import { LuxuryToastSystem, ToastItem } from './components/LuxuryToastSystem';
import { ModernLuxuryFloorMatsSection } from './components/ModernLuxuryFloorMatsSection';
import { ModernLuxurySeatCoversSection } from './components/ModernLuxurySeatCoversSection';
import { CustomerAccountModal } from './components/CustomerAccountModal';
import {
  AlsaeediBrandsSkeleton,
  AlsaeediCatalogSkeleton,
  AlsaeediReviewsSkeleton,
} from './components/AlsaeediSkeletons';
import './saudiaTransport.css';

interface SaudiaTransportThemeViewProps {
  initialPage?: string;
  isAdmin?: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: SeatColorOption | FloorMatColorOption;
  selectedMaterial?: string;
  selectedCoverage?: string;
  unitPrice: number;
  specs?: FloorMatCustomSpecs;
}

// WhatsApp icon SVG glyph
function WhatsAppGlyph({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export const SaudiaTransportThemeView: React.FC<SaudiaTransportThemeViewProps> = ({
  initialPage = 'home',
  isAdmin = false
}) => {
  const { activeStore, addOrder, syncOrderFromApi, recordStoreVisit, currentProducts, addToCart: tenantAddToCart, apiReady } = useTenant();
  const productsLoading = !apiReady;
  const prefs = usePrefs();
  const locale = prefs?.locale;

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

  // Read admin theme settings
  const storeId = activeStore?.id || 'store-bleco';
  const themeSettings = useMemo(() => {
    try {
      return readAllThemeSettings(storeId, activeStore || { name: BLECO_STORE_INFO.nameAr });
    } catch {
      return null;
    }
  }, [storeId, activeStore, syncTick]);

  // Bilingual State (AR / EN) — local storefront only; do not write admin prefs (avoids chrome flip).
  const [currentLang, setCurrentLang] = useState<'ar' | 'en'>(locale === 'en' ? 'en' : 'ar');
  const isAr = currentLang === 'ar';

  useEffect(() => {
    const next = locale === 'en' ? 'en' : 'ar';
    setCurrentLang((prev) => (prev === next ? prev : next));
  }, [locale]);

  const toggleLanguage = () => {
    const nextLang = currentLang === 'ar' ? 'en' : 'ar';
    setCurrentLang(nextLang);
  };

  const recordedVisitRef = useRef(false);
  useEffect(() => {
    if (!recordedVisitRef.current) {
      recordedVisitRef.current = true;
      recordStoreVisit?.(storeId);
    }
  }, [storeId, recordStoreVisit]);

  // View Mode: 'home' vs 'catalog' vs 'booking'
  const [viewMode, setViewMode] = useState<'home' | 'catalog' | 'booking'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const p = window.location.pathname.toLowerCase();
      if (hash.includes('booking') || hash.includes('services') || p.endsWith('/booking')) {
        return 'booking';
      }
      if (hash.includes('catalog') || p.endsWith('/products') || p.endsWith('/catalog')) {
        return 'catalog';
      }
    }
    return 'home';
  });

  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash.toLowerCase();
      if (h.includes('booking') || h.includes('services')) {
        setViewMode('booking');
      } else if (h.includes('catalog')) {
        setViewMode('catalog');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    try {
      const storeName = isAr
        ? (activeStore?.nameAr || activeStore?.name || 'متجر السيارات')
        : (activeStore?.nameEn || activeStore?.name || 'Car Store');
      const title = viewMode === 'booking'
        ? (isAr ? `حجز موعد واستفسار | ${storeName}` : `Book Appointment & Inquiries | ${storeName}`)
        : viewMode === 'catalog'
        ? (isAr ? `المنتجات | ${storeName}` : `Products | ${storeName}`)
        : (isAr
          ? `${storeName} | تنجيد وتلابيس مقاعد وأرضيات 5D`
          : `${storeName} | Luxury Seat Covers & 5D Mats`);
      const desc = viewMode === 'booking'
        ? (isAr
          ? `احجز موعد خدمة تنجيد أو استفسر عن تفصيل سيارتك لدى ${storeName} بمكة المكرمة.`
          : `Book automotive upholstery appointment or request custom fitment at ${storeName}.`)
        : viewMode === 'catalog'
        ? (isAr
          ? `تصفح منتجات ${storeName} — تلابيس مقاعد وأرضيات ليزر 5D. الأسعار بالريال والتوصيل داخل المملكة.`
          : `Browse ${storeName} — seat covers and 5D laser mats. Prices in SAR with delivery across Saudi Arabia.`)
        : (isAr
          ? `${storeName} — تنجيد فاخر وتلابيس مقاعد وأرضيات 5D مع ضمان سنتين والتوصيل لجميع مدن المملكة.`
          : `${storeName} — luxury upholstery, seat covers and 5D mats with 2-year warranty and KSA-wide delivery.`);
      document.title = title;

      const upsertMeta = (attr: 'name' | 'property', key: string, content: string) => {
        let el = document.querySelector(`meta[${attr}="${key}"]`);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute(attr, key);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      upsertMeta('name', 'description', desc);
      upsertMeta('name', 'robots', 'index,follow');
      upsertMeta('property', 'og:title', title);
      upsertMeta('property', 'og:description', desc);
      upsertMeta('property', 'og:type', 'website');
      upsertMeta('property', 'og:locale', isAr ? 'ar_SA' : 'en_US');
      upsertMeta('name', 'twitter:card', 'summary_large_image');
      upsertMeta('name', 'twitter:title', title);
      upsertMeta('name', 'twitter:description', desc);

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const path = typeof window !== 'undefined' ? window.location.pathname : '/';
      const canonicalHref = `${origin}${path}`;
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', canonicalHref);

      const logo = activeStore?.logo || BLECO_STORE_INFO.logo || '';
      if (logo) {
        upsertMeta('property', 'og:image', logo.startsWith('http') ? logo : `${origin}${logo}`);
      }

      const jsonLdId = 'alsaeedi-jsonld';
      let script = document.getElementById(jsonLdId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = jsonLdId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'AutoPartsStore',
        name: storeName,
        description: desc,
        url: canonicalHref,
        image: logo || undefined,
        telephone: themeSettings?.identity?.whatsapp || BLECO_STORE_INFO.whatsapp,
        address: {
          '@type': 'PostalAddress',
          addressLocality: isAr ? 'مكة المكرمة' : 'Makkah',
          addressCountry: 'SA',
        },
        priceRange: 'SAR',
        areaServed: 'SA',
      });

      if (!isAdmin) {
        document.documentElement.lang = isAr ? 'ar' : 'en';
        document.documentElement.dir = isAr ? 'rtl' : 'ltr';
      }
    } catch {}
  }, [isAr, viewMode, isAdmin, activeStore?.name, activeStore?.nameAr, activeStore?.nameEn, activeStore?.logo, themeSettings?.identity?.whatsapp]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const [searchBarOpen, setSearchBarOpen] = useState(false);

  // Filter Form State
  const [formMake, setFormMake] = useState<string>('all');
  const [formModel, setFormModel] = useState<string>('all');
  const [formYear, setFormYear] = useState<string>('all');
  const [formColor, setFormColor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFeedback, setFilterFeedback] = useState<string | null>(null);
  const [homeSeatDisplayLimit, setHomeSeatDisplayLimit] = useState(24);
  const [selectedProductGalleryImg, setSelectedProductGalleryImg] = useState<string | null>(null);
  const [catalogMaterialFilter, setCatalogMaterialFilter] = useState<'all' | 'leather' | 'fabric'>('all');

  // Dynamic models for selected make
  const availableModels = useMemo(() => {
    if (formMake !== 'all' && CAR_MODELS_MAP[formMake]) {
      return CAR_MODELS_MAP[formMake];
    }
    // If all makes, gather unique models across all companies
    const allList: CarModelDef[] = [];
    Object.values(CAR_MODELS_MAP).forEach(models => {
      models.forEach(m => {
        if (!allList.some(x => x.modelEn === m.modelEn)) {
          allList.push(m);
        }
      });
    });
    return allList;
  }, [formMake]);

  // Dynamic years for selected model
  const availableYears = useMemo(() => {
    if (!availableModels || availableModels.length === 0 || formModel === 'all') {
      return ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2015'];
    }
    const found = availableModels.find(m => m.modelEn.toLowerCase() === formModel.toLowerCase() || m.modelAr === formModel);
    return found ? found.years : ['2025', '2024', '2023', '2022', '2021', '2020'];
  }, [availableModels, formModel]);

  // Active Brand filter
  const [activeBrand, setActiveBrand] = useState<CarBrandItem | null>(null);

  // Active Category filter
  const [activeCategory, setActiveCategory] = useState<CategoryItem | null>(null);

  // Card Color Swatches State (productId -> selectedColorOption)
  const [cardSelectedColors, setCardSelectedColors] = useState<Record<string, SeatColorOption>>({});

  // Single Product Detail Modal & Customizer
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailColor, setDetailColor] = useState<SeatColorOption | null>(null);
  const [detailMaterial, setDetailMaterial] = useState<'fabric' | 'leather' | 'diamond'>('leather');
  const [detailCoverage, setDetailCoverage] = useState<'full' | 'front_only'>('full');
  const [detailQuantity, setDetailQuantity] = useState(1);

  // Modern Luxury Floor Mat Customizer & Showcase Modal
  const [selectedFloorMatModal, setSelectedFloorMatModal] = useState<Product | null>(null);

  // Blog Post Reading Modal
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlecoBlogPost | null>(null);

  // Interactive Accordion State for 9 FAQs

  // Dynamic Price for Customizer
  const computedDetailPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    let base = selectedProduct.discountedPrice || selectedProduct.price;
    if (detailMaterial === 'fabric') base = Math.max(390, base - 70);
    else if (detailMaterial === 'diamond') base += 120;
    if (detailCoverage === 'front_only') base -= 110;
    return Math.max(290, base);
  }, [selectedProduct, detailMaterial, detailCoverage]);

  // Cart State — store_id isolated persistence
  const cartStorageKey = `alsaeedi_cart_${storeId}`;
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const scoped = localStorage.getItem(`alsaeedi_cart_${activeStore?.id || 'store-bleco'}`);
      if (scoped) return JSON.parse(scoped);
      const legacy = localStorage.getItem('alsaeedi_cart');
      return legacy ? JSON.parse(legacy) : [];
    } catch {
      return [];
    }
  });
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(cart));
      localStorage.removeItem('alsaeedi_cart');
    } catch {}
  }, [cart, cartStorageKey]);

  // Handle route switching from initialPage prop (Home, Catalog, Product, Cart, Checkout, Profile)
  const prevInitialPageRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!initialPage) return;
    if (prevInitialPageRef.current === initialPage) return;
    prevInitialPageRef.current = initialPage;

    const p = initialPage.toLowerCase().trim();
    if (p === 'catalog' || p === 'shop' || p === 'products' || p === 'fleet') {
      setViewMode('catalog');
      setSelectedProduct(null);
    } else if (p === 'cart') {
      setCartDrawerOpen(true);
      setCheckoutOpen(false);
    } else if (p === 'checkout') {
      setCartDrawerOpen(false);
      setCheckoutOpen(true);
    } else if (p === 'profile' || p === 'crm' || p === 'account' || p === 'login') {
      setIsAccountModalOpen(true);
    } else if (p === 'product' || p === 'product-detail' || p === 'detail') {
      const firstProd = (currentProducts && currentProducts.length > 0 ? currentProducts[0] : null);
      if (firstProd) {
        setSelectedProduct(firstProd);
      }
    } else if (p === 'home') {
      setViewMode('home');
      setSelectedProduct(null);
      setCartDrawerOpen(false);
      setCheckoutOpen(false);
    }
  }, [initialPage, currentProducts]);
  
  // Luxury Animated Toast Stack (Single active notification strictly controlled to prevent spam)
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const lastToastRef = useRef<{ key: string; time: number } | null>(null);

  const addToast = (toast: Omit<ToastItem, 'id'> & { id?: string }) => {
    const now = Date.now();
    const key = `${toast.title || ''}-${toast.message || ''}`;
    // Deduplicate: If same toast was triggered in the last 3.5 seconds, ignore
    if (lastToastRef.current && lastToastRef.current.key === key && now - lastToastRef.current.time < 3500) {
      return;
    }
    lastToastRef.current = { key, time: now };

    const newId = toast.id || `toast-${now}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { ...toast, id: newId, duration: toast.duration || 3200 };
    setToasts([newToast]); // Keep strictly 1 active toast at a time
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showToast = (msg: string) => {
    addToast({
      type: 'success',
      title: isAr ? 'إشعار تنجيد مكة الفاخر' : 'Al-Saeedi VIP Notice',
      message: msg,
      duration: 3200
    });
  };

  const handleQuickVehicleSelect = (makeEn: string, modelEn: string) => {
    setFormMake(makeEn.toLowerCase());
    setFormModel(modelEn);
    const brand = CAR_BRANDS.find(b => b.nameEn.toLowerCase() === makeEn.toLowerCase() || b.id === makeEn);
    const brandName = brand ? (isAr ? brand.nameAr : brand.nameEn) : makeEn.toUpperCase();
    addToast({
      type: 'vehicle-match',
      title: isAr ? `تم تحديد${brandName}(${modelEn})` : `Selected ${brandName} (${modelEn})`,
      message: isAr 
        ? 'تم تفعيل التوافق الليزري المباشر — المقاسات جاهزة للتفصيل مع ضمان سنتين' 
        : 'Instant laser fitment activated — Ready for bespoke crafting with 2-yr warranty',
      metadata: {
        brandLogo: brand?.logo,
        carName: `${brandName} ${modelEn}`
      },
      actionLabel: isAr ? 'تقرير المطابقة' : 'Fitment Report',
      onAction: () => setVehicleMatchModalOpen(true)
    });
  };

  const handlePillClick = (pillKey: string) => {
    if (pillKey === 'oem') {
      addToast({
        type: 'vehicle-match',
        title: isAr ? 'مطابقة الوكالة 100% ليزرياً' : '100% OEM Laser Fit',
        message: isAr ? 'تفصيل ليزري بالمليمتر لمقاعد وأرضيات كل سيارة بدون أي تعديل أو فراغات' : 'Laser cut to exact factory specifications with zero modifications.',
        actionLabel: isAr ? 'فحص سيارتك' : 'Check Car',
        onAction: () => setVehicleMatchModalOpen(true)
      });
    } else if (pillKey === 'warranty') {
      addToast({
        type: 'warranty',
        title: isAr ? 'ضمان ذهبي سنتين كاملتين' : '2-Year VIP Golden Warranty',
        message: isAr ? 'يشمل الاستبدال الفوري ضد التقشير، التمزق، وتغير اللون تحت درجات حرارة الخليج' : 'Comprehensive replacement warranty against peeling, tearing, or color fading.',
      });
    } else if (pillKey === 'weather') {
      addToast({
        type: 'success',
        title: isAr ? 'عزل حراري ومقاومة للماء 55°C' : 'All-Weather Defense 55°C',
        message: isAr ? 'خامات جلد بيئي وأقمشة ألمانية ويابانية تتحمل صيف مكة والخليج الشديد' : 'Specially formulated materials resisting extreme temperatures up to 55°C.',
      });
    } else if (pillKey === 'makkah') {
      addToast({
        type: 'success',
        title: isAr ? 'تركيب مجاني بمكة المكرمة' : 'Free Installation in Makkah',
        message: isAr ? 'خدمة تركيب احترافية مجانية بفرع بطحاء قريش مكة، مع شحن سريع لجميع مدن المملكة' : 'Free professional installation at Batha Quraish branch, or express home delivery.',
      });
    }
  };

  // Live store reviews (API only — empty when none)
  const [storeReviews, setStoreReviews] = useState<StoreReviewRecord[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setReviewsLoading(true);
    fetchStoreReviewsApi(storeId)
      .then((rows) => {
        if (!alive) return;
        const normalized = (Array.isArray(rows) ? rows : []).map((r: any) => ({
          ...r,
          author: r.author || r.name || r.nameEn || '',
          comment: r.comment || r.commentEn || '',
          commentAr: r.commentAr || r.comment || '',
          active: r.active ?? r.isActive ?? r.is_active ?? true,
        }));
        setStoreReviews(normalized.filter((r) => r.active !== false));
      })
      .catch(() => {
        if (alive) setStoreReviews([]);
      })
      .finally(() => {
        if (alive) setReviewsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [storeId]);

  // Checkout State
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingBusy, setShippingBusy] = useState(false);
  const [shippingLabel, setShippingLabel] = useState<string | null>(null);
  const [orderCompleteData, setOrderCompleteData] = useState<{ orderNumber: string; total: number } | null>(null);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    city: 'مكة المكرمة',
    address: '',
    paymentMethod: 'cod' as 'cod' | 'mada',
    notes: '',
  });

  useEffect(() => {
    if (!checkoutOpen || !activeStore?.id) return;
    const cartValue = cart.reduce(
      (sum, it) => sum + (Number(it.unitPrice) || 0) * (it.quantity || 1),
      0,
    );
    trackStorefrontEvent(activeStore.id, 'begin_checkout', {
      path: typeof location !== 'undefined' ? location.pathname : '/checkout',
      meta: {
        cart_items: cart.length,
        items_count: cart.reduce((n, it) => n + (it.quantity || 1), 0),
        cart_value: cartValue,
        cart_total: cartValue,
      },
    });
  }, [checkoutOpen, activeStore?.id, cart.length]);

  useEffect(() => {
    if (!checkoutOpen || !activeStore?.id) return;
    if (!checkoutForm.city.trim() && !checkoutForm.address.trim()) return;
    trackStorefrontEvent(activeStore.id, 'add_shipping_info', {
      path: typeof location !== 'undefined' ? location.pathname : '/checkout',
      meta: {
        city: checkoutForm.city || undefined,
        address_set: Boolean(checkoutForm.address.trim()),
      },
    });
  }, [checkoutOpen, activeStore?.id, checkoutForm.city, checkoutForm.address]);

  useEffect(() => {
    if (!checkoutOpen || !activeStore?.id || !checkoutForm.paymentMethod) return;
    trackStorefrontEvent(activeStore.id, 'add_payment_info', {
      path: typeof location !== 'undefined' ? location.pathname : '/checkout',
      meta: { payment_method: checkoutForm.paymentMethod },
    });
  }, [checkoutOpen, activeStore?.id, checkoutForm.paymentMethod]);

  // Super Advanced Vehicle Match Popup Alert State
  const [vehicleMatchModalOpen, setVehicleMatchModalOpen] = useState(false);

  // Handle Search / Filter Form Submit -> Opens vehicle match modal directly without toast clutter
  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVehicleMatchModalOpen(true);
  };

  const handleOpenCatalogFromFilter = () => {
    setViewMode('catalog');

    let feedback = isAr ? 'نتائج مطابقة:' : 'Matching Results: ';
    if (formMake !== 'all') feedback += `${formMake.toUpperCase()} `;
    if (formModel !== 'all') feedback += `(${formModel}) `;
    if (formYear !== 'all') feedback += `[${formYear}] `;
    if (formColor !== 'all') feedback += `· ${formColor}`;
    setFilterFeedback(feedback);

    setTimeout(() => {
      const el = document.getElementById('catalog-view-top');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleResetFilter = () => {
    setFormMake('all');
    setFormModel('all');
    setFormYear('all');
    setFormColor('all');
    setSearchQuery('');
    setActiveBrand(null);
    setActiveCategory(null);
    setFilterFeedback(null);
    setViewMode('home');
  };

  // Full Catalog Filtered (For Advance Search View)
  const [catalogSort, setCatalogSort] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [catalogPageLimit, setCatalogPageLimit] = useState(24);

  const storeCatalog = useMemo(() => {
    // Prefer live API products for this store_id only
    if (currentProducts && currentProducts.length > 0) {
      return currentProducts;
    }
    try {
      if (typeof window !== 'undefined' && activeStore?.id) {
        const rawMap = localStorage.getItem('unityteck_products_map');
        if (rawMap) {
          const map = JSON.parse(rawMap);
          if (Array.isArray(map[activeStore.id]) && map[activeStore.id].length > 0) {
            return map[activeStore.id];
          }
        }
      }
    } catch {}
    // Empty store → empty catalog (never BLECO mock pack on live path)
    return [];
  }, [currentProducts, activeStore, syncTick]);

  useEffect(() => {
    if (selectedProduct) {
      const live = storeCatalog.find((p) => p.id === selectedProduct.id);
      if (live && (live.image !== selectedProduct.image || live.price !== selectedProduct.price || live.name !== selectedProduct.name || live.images !== selectedProduct.images)) {
        setSelectedProduct(live);
      }
    }
  }, [storeCatalog]);

  useEffect(() => {
    if (!activeStore?.id || !selectedProduct?.id) return;
    trackStorefrontEvent(activeStore.id, 'product_view', {
      path: typeof location !== 'undefined' ? location.pathname : '/product',
      meta: {
        product_id: selectedProduct.id,
        product_name: selectedProduct.nameAr || selectedProduct.name || undefined,
      },
    });
  }, [activeStore?.id, selectedProduct?.id]);

  /* Scroll reveal — observe + re-observe after async sections (booking/catalog) mount */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.querySelector('.alsaeedi-theme-container');
    if (!root) return;
    const selector = '.alsaeedi-reveal, .alsaeedi-reveal-left, .alsaeedi-reveal-scale';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      root.querySelectorAll(selector).forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observed = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '80px 0px 80px 0px', threshold: 0.01 },
    );
    const observeNew = () => {
      root.querySelectorAll(selector).forEach((el) => {
        if (el.classList.contains('is-visible') || observed.has(el)) return;
        observed.add(el);
        io.observe(el);
      });
    };
    observeNew();
    const mo = new MutationObserver(() => observeNew());
    mo.observe(root, { childList: true, subtree: true });
    // Safety: never leave mid-viewport content invisible forever
    const safety = window.setTimeout(() => {
      root.querySelectorAll(selector).forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight + 120) {
          el.classList.add('is-visible');
        }
      });
    }, 1200);
    return () => {
      mo.disconnect();
      io.disconnect();
      window.clearTimeout(safety);
    };
  }, [viewMode, productsLoading, syncTick]);

  // Dynamically computed counts from actual store catalog
  const brandProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    storeCatalog.forEach(p => {
      if (p.brand) {
        const b = p.brand.toLowerCase();
        counts[b] = (counts[b] || 0) + 1;
      }
    });
    return counts;
  }, [storeCatalog]);

  const isSeatCoverProduct = (p: Product) => {
    const blob = [p.type, p.id, p.category, p.categoryAr, p.categoryEn, p.name, p.nameAr, p.nameEn]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return (
      p.type === 'seat-cover' ||
      blob.includes('seat') ||
      blob.includes('تلابيس') ||
      blob.includes('تلبيس') ||
      blob.includes('مقعد') ||
      String(p.id || '').startsWith('prod-seat')
    );
  };

  const isFloorMatProduct = (p: Product) => {
    const blob = [p.type, p.id, p.category, p.categoryAr, p.categoryEn, p.name, p.nameAr, p.nameEn]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return (
      p.type === 'floor-mat' ||
      blob.includes('floor') ||
      blob.includes('mat') ||
      blob.includes('أرض') ||
      blob.includes('ارض') ||
      blob.includes('دعاس') ||
      String(p.id || '').startsWith('prod-mat')
    );
  };

  const seatCoversCount = useMemo(() => storeCatalog.filter(isSeatCoverProduct).length, [storeCatalog]);
  const floorMatsCount = useMemo(() => storeCatalog.filter(isFloorMatProduct).length, [storeCatalog]);

  const fullFilteredProducts = useMemo(() => {
    return storeCatalog.filter(product => {
      // 1. Category Tab Filter
      if (activeCategory) {
        const id = activeCategory.id;
        const en = (activeCategory.nameEn || '').toLowerCase();
        const ar = activeCategory.nameAr || '';
        const blob = `${product.type || ''} ${product.category || ''} ${product.categoryAr || ''} ${product.name || ''} ${product.nameAr || ''}`.toLowerCase();
        const builtIn =
          (id === 'cat-floors' && (product.type === 'floor-mat' || blob.includes('floor') || blob.includes('ارض') || blob.includes('أرض'))) ||
          (id === 'cat-clothing' && (product.type === 'seat-cover' || blob.includes('seat') || blob.includes('تلبيس') || blob.includes('مقعد')));
        const named = (en && blob.includes(en)) || (ar && blob.includes(ar.toLowerCase()));
        if (!builtIn && !named) return false;
      }

      // 2. Car Brand Filter (Strict: When a brand is selected, ONLY show matching products, do NOT pollute with floor mats)
      if (formMake !== 'all') {
        const bLower = formMake.toLowerCase();
        const matchesMake = (product.brand && product.brand.toLowerCase() === bLower) ||
                            product.tags?.some(t => t.toLowerCase() === bLower) ||
                            (product.name && product.name.toLowerCase().includes(bLower)) ||
                            (product.nameAr && product.nameAr.toLowerCase().includes(bLower));
        if (!matchesMake) return false;
      } else if (activeBrand) {
        const matchesBrand = product.brand?.toLowerCase() === activeBrand.nameEn.toLowerCase() ||
                             product.brand === activeBrand.nameAr ||
                             product.tags?.some(t => t.toLowerCase() === activeBrand.nameEn.toLowerCase() || t === activeBrand.nameAr);
        if (!matchesBrand && product.brand !== 'جميع الماركات') return false;
      }

      // 3. Vehicle Model Filter
      if (formModel !== 'all') {
        const m = formModel.toLowerCase();
        const matchesModel = product.name.toLowerCase().includes(m) || 
                             (product.nameAr && product.nameAr.toLowerCase().includes(m)) ||
                             (product.nameEn && product.nameEn.toLowerCase().includes(m)) ||
                             product.tags?.some(t => t.toLowerCase().includes(m));
        if (!matchesModel) return false;
      }

      // 4. Year Filter
      if (formYear !== 'all') {
        const yr = formYear.toLowerCase();
        const matchesYear = product.name.includes(yr) || 
                            (product.nameAr && product.nameAr.includes(yr)) ||
                            (product.nameEn && product.nameEn.includes(yr)) ||
                            product.tags?.some(t => t.includes(yr));
        if (!matchesYear) return false;
      }

      // 5. Color Filter
      if (formColor !== 'all') {
        const matchesColor = product.name.includes(formColor) || 
                             (product.nameAr && product.nameAr.includes(formColor)) ||
                             product.tags?.some(t => t.includes(formColor)) ||
                             product.colors?.some(c => c.nameAr === formColor || c.nameEn.toLowerCase() === formColor.toLowerCase());
        if (!matchesColor) return false;
      }

      // 6. Material Filter
      if (catalogMaterialFilter !== 'all') {
        if (catalogMaterialFilter === 'leather' && !product.name.includes('جلد') && !product.tags?.includes('جلد')) return false;
        if (catalogMaterialFilter === 'fabric' && !product.name.includes('قماش') && !product.tags?.includes('قماش')) return false;
      }

      // 7. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQ = product.name.toLowerCase().includes(q) || 
                         (product.nameAr && product.nameAr.toLowerCase().includes(q)) ||
                         (product.nameEn && product.nameEn.toLowerCase().includes(q)) ||
                         (product.brand && product.brand.toLowerCase().includes(q)) || 
                         product.tags?.some(t => t.toLowerCase().includes(q));
        if (!matchesQ) return false;
      }
      return true;
    }).sort((a, b) => {
      const pA = a.discountedPrice || a.price;
      const pB = b.discountedPrice || b.price;
      if (catalogSort === 'price-asc') return pA - pB;
      if (catalogSort === 'price-desc') return pB - pA;
      return (b.salesCount || 0) - (a.salesCount || 0);
    });
  }, [storeCatalog, activeBrand, activeCategory, formMake, formModel, formYear, formColor, catalogMaterialFilter, searchQuery, catalogSort]);

  // Cart Management
  const addToCart = (
    product: Product, 
    quantity = 1, 
    color?: SeatColorOption | null, 
    material?: string, 
    coverage?: string, 
    customPrice?: number,
    customSpecs?: any
  ) => {
    const unitPrice = customPrice || product.discountedPrice || product.price;
    const prodColors = getProductColors(product);
    const selectedCol = color || cardSelectedColors[product.id] || prodColors[0];

    if (activeStore?.id && product?.id) {
      trackStorefrontEvent(activeStore.id, 'add_to_cart', {
        path: typeof location !== 'undefined' ? location.pathname : '/cart',
        meta: {
          product_id: product.id,
          product_name: product.nameAr || product.name || undefined,
          quantity,
        },
      });
    }

    setCart(prev => {
      const existing = prev.find(item => 
        item.product.id === product.id && 
        item.selectedColor?.id === selectedCol?.id &&
        item.selectedMaterial === (material || (isAr ? 'جلد ألماني فاخر' : 'German Leather')) &&
        item.selectedCoverage === (coverage || (isAr ? 'طقم كامل لجميع المقاعد' : 'Full Set'))
      );
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id && 
          item.selectedColor?.id === selectedCol?.id &&
          item.selectedMaterial === (material || (isAr ? 'جلد ألماني فاخر' : 'German Leather')) &&
          item.selectedCoverage === (coverage || (isAr ? 'طقم كامل لجميع المقاعد' : 'Full Set'))
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, {
        product,
        quantity,
        selectedColor: selectedCol,
        selectedMaterial: material || (isAr ? 'جلد ألماني فاخر' : 'German Leather'),
        selectedCoverage: coverage || (isAr ? 'طقم كامل لجميع المقاعد' : 'Full Set'),
        unitPrice,
        specs: customSpecs
      }];
    });

    // Also sync to global tenant cart if present
    if (tenantAddToCart) {
      try {
        tenantAddToCart({
          ...product,
          id: `${product.id}-${selectedCol?.id || 'def'}-${Date.now()}`,
          name: product.name,
          nameAr: product.nameAr,
          price: unitPrice,
          image: selectedCol?.image || product.image,
        } as any);
      } catch (err) {
        console.error('tenantAddToCart error:', err);
      }
    }

    showToast(isAr ? `تمت إضافة "${product.nameAr || product.name}" للسلة بنجاح` : `Added "${product.nameEn || product.name}" to cart`);
  };

  const addFloorMatToCart = (product: Product, quantity: number, specs: FloorMatCustomSpecs) => {
    setCart(prev => {
      return [...prev, {
        product,
        quantity,
        selectedColor: {
          id: specs.color.id,
          nameAr: specs.color.nameAr,
          nameEn: specs.color.nameEn,
          hex: specs.color.baseHex,
          image: product.image
        },
        selectedMaterial: isAr ? 'جلد صناعي صديق للبيئة (11 مل - 5 طبقات ساسو)' : 'Eco Synthetic Leather (11mm 5D SASO)',
        selectedCoverage: specs.coverageLabelAr || (specs.seats === '2_seats'
          ? (isAr ? 'مقعدين (غمارتين)' : '2 Seats (Pickup)')
          : specs.seats === '7_seats' 
            ? (isAr ? '٧ مقاعد (3 صفوف)' : '7 Seats (3 Rows)') 
            : (isAr ? '٥ مقاعد (صفين)' : '5 Seats (2 Rows)')),
        unitPrice: specs.unitPrice,
        specs
      }];
    });
    showToast(isAr ? `تمت إضافة أرضيات${product.nameAr}لسلتك بنجاح!` : `Floor mats added to cart!`);
  };

  const directBuyFloorMat = (product: Product, quantity: number, specs: FloorMatCustomSpecs) => {
    addFloorMatToCart(product, quantity, specs);
    setSelectedFloorMatModal(null);
    setCartDrawerOpen(false);
    setCheckoutOpen(true);
  };

  const updateQuantity = (idx: number, qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter((_, i) => i !== idx));
      return;
    }
    setCart(prev => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item));
  };

  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const checkoutPayable = Math.max(0, cartTotal - couponDiscount) + Math.max(0, shippingFee);

  useEffect(() => {
    if (!checkoutOpen || !storeId || !checkoutForm.city.trim()) {
      setShippingFee(0);
      setShippingLabel(null);
      return;
    }
    let alive = true;
    setShippingBusy(true);
    const productIds = cart.map((it) => it.product.id).filter(Boolean);
    void calculateShippingRates(storeId, {
      city: checkoutForm.city,
      order_total: Math.max(0, cartTotal - couponDiscount),
      product_ids: productIds,
    })
      .then((res) => {
        if (!alive) return;
        const methods = Array.isArray(res.available_methods) ? res.available_methods : [];
        const fee =
          typeof res.calculated_shipping_fee === 'number'
            ? res.calculated_shipping_fee
            : Number(methods[0]?.fee ?? methods[0]?.rate ?? 0) || 0;
        setShippingFee(res.is_free_shipping ? 0 : Math.max(0, fee));
        const methodName = methods[0]?.name_ar || methods[0]?.name || null;
        setShippingLabel(
          res.is_free_shipping
            ? (isAr ? 'شحن مجاني' : 'Free shipping')
            : methodName
              ? String(methodName)
              : methods.length === 0
                ? (isAr ? 'لا توجد طريقة شحن لهذه المدينة' : 'No shipping method for this city')
                : null,
        );
      })
      .catch(() => {
        if (!alive) return;
        setShippingFee(0);
        setShippingLabel(isAr ? 'تعذر حساب الشحن' : 'Could not calculate shipping');
      })
      .finally(() => {
        if (alive) setShippingBusy(false);
      });
    return () => {
      alive = false;
    };
  }, [checkoutOpen, storeId, checkoutForm.city, cartTotal, couponDiscount, cart.length, isAr]);

  const storeWhatsApp = String(
    themeSettings?.identity?.whatsapp || BLECO_STORE_INFO.whatsapp || '',
  ).replace(/[^0-9]/g, '');

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      setCouponDiscount(0);
      setCouponMessage(isAr ? 'أدخل رمز الكوبون' : 'Enter a coupon code');
      return;
    }
    setCouponBusy(true);
    setCouponMessage(null);
    try {
      const res = await validateStorefrontCoupon(storeId, code, cartTotal);
      if (res.valid && res.discount > 0) {
        setCouponDiscount(Number(res.discount) || 0);
        setCouponMessage(isAr ? 'تم تطبيق الكوبون بنجاح' : 'Coupon applied successfully');
      } else {
        setCouponDiscount(0);
        setCouponMessage(res.message || (isAr ? 'رمز الكوبون غير صالح' : 'Invalid coupon code'));
      }
    } catch {
      setCouponDiscount(0);
      setCouponMessage(isAr ? 'تعذر التحقق من الكوبون' : 'Could not validate coupon');
    } finally {
      setCouponBusy(false);
    }
  };

  // WhatsApp Order message
  const openWhatsAppOrder = (product?: Product, color?: SeatColorOption | null, price?: number, customMessage?: string) => {
    const phoneNum = themeSettings?.identity?.whatsapp || BLECO_STORE_INFO.whatsapp;
    if (customMessage) {
      window.open(`https://wa.me/${phoneNum.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(customMessage)}`, '_blank');
      return;
    }

    const p = product || selectedProduct;
    const c = color || detailColor || (p?.colors?.[0] || SEAT_COLORS[0]);
    const finalPrice = price || computedDetailPrice || (p ? (p.discountedPrice || p.price) : 0);

    let text = isAr 
      ? `مرحباً متجر السعيدي لتنجيد السيارات، أرغب بالطلب والاستفسار:%0a`
      : `Hello Al-Saeedi Car Upholstery, I would like to order:%0a`;

    if (p) {
      text += `*المنتج:* ${p.nameAr || p.name}%0a*الكود:* ${p.sku}%0a`;
      if (c && p.type === 'seat-cover') text += `*اللون والتطريز:* ${c.nameAr} (${c.nameEn})%0a`;
      text += `*السعر:* ${finalPrice} ⃁%0a`;
    } else if (cart.length > 0) {
      text += `*سلة المشتريات:*%0a`;
      cart.forEach((it, i) => {
        text += `${i + 1}. ${it.product.nameAr || it.product.name} (${it.selectedColor?.nameAr || 'بيج'} - ${it.selectedCoverage || ''}) x ${it.quantity}%0a`;
      });
      text += `*الإجمالي:* ${cartTotal} ⃁%0a`;
    } else {
      text += isAr ? `أريد تفصيل تلبيسة أو أرضيات لسيارتي` : `I want custom tailored seat covers or floor mats`;
    }

    window.open(`https://wa.me/${phoneNum.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  // Checkout Submission — live API order + optional coupon discount
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    if (!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address || !checkoutForm.city) {
      setCheckoutError(isAr ? 'يرجى تعبئة جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    if (cart.length === 0) {
      setCheckoutError(isAr ? 'السلة فارغة' : 'Cart is empty');
      return;
    }

    const storeIdResolved = storeId || activeStore?.id || 'store-bleco';
    const payable = Math.max(0, cartTotal - couponDiscount) + Math.max(0, shippingFee);
    const itemsPayload = cart.map((it) => {
      const sp = it.specs as any;
      const carDetail = sp
        ? `[${sp.brandNameAr || sp.brand || ''} ${sp.model || ''} ${sp.year || ''} - ${sp.seatsLabelAr || it.selectedCoverage || ''} - ${it.selectedColor?.nameAr || ''}${sp.includeBundle ? ' + ملمع' : ''}]`
        : `(${it.selectedColor?.nameAr || 'بيج'} - ${it.selectedCoverage || ''})`;
      return {
        id: it.product.id,
        sku: it.product.sku,
        name: `${it.product.nameAr || it.product.name} ${carDetail}`.trim(),
        price: it.unitPrice,
        quantity: it.quantity,
        total: it.unitPrice * it.quantity,
        image: it.selectedColor?.image || it.product.image,
      };
    });

    void (async () => {
      setCheckoutBusy(true);
      try {
        const persisted = await submitPublicStorefrontOrder(
          storeIdResolved,
          {
            customerName: checkoutForm.name,
            customerPhone: checkoutForm.phone,
            customerEmail: undefined,
            deliveryLocation: `${checkoutForm.city} - ${checkoutForm.address}`,
            total: payable,
            status: 'pending',
            paymentMethod: checkoutForm.paymentMethod === 'cod' ? 'Cash on Delivery' : 'mada',
            paymentStatus: 'pending',
            source: readTrafficSource().source,
            medium: readTrafficSource().medium || undefined,
            campaign: readTrafficSource().campaign || undefined,
            utmTerm: readTrafficSource().utmTerm || undefined,
            utmContent: readTrafficSource().utmContent || undefined,
            couponCode: couponCode.trim() || undefined,
            shippingFee: Math.max(0, shippingFee),
            customerNotes: [
              checkoutForm.notes,
              couponCode.trim() ? `Coupon: ${couponCode.trim()} (-${couponDiscount} SAR)` : '',
              shippingLabel ? `Shipping: ${shippingLabel}` : '',
            ].filter(Boolean).join(' | ') || undefined,
            items: cart.map((it) => {
              const sp = it.specs as Record<string, unknown> | undefined;
              const selectedOptions: Record<string, string> = {};
              if (it.selectedColor?.nameEn || it.selectedColor?.nameAr) {
                selectedOptions.color = String(it.selectedColor.nameEn || it.selectedColor.nameAr);
              }
              if (it.selectedMaterial) selectedOptions.material = String(it.selectedMaterial);
              if (it.selectedCoverage) selectedOptions.coverage = String(it.selectedCoverage);
              if (sp?.brand || sp?.brandNameAr) {
                selectedOptions.brand = String(sp.brandNameAr || sp.brand || '');
              }
              if (sp?.model) selectedOptions.model = String(sp.model);
              if (sp?.year) selectedOptions.year = String(sp.year);
              const live = it.product as { variations?: Array<{ id: string; options?: Record<string, string>; isActive?: boolean }> };
              const matched = (live.variations || []).find((v) => {
                if (v.isActive === false) return false;
                const opts = v.options || {};
                return Object.entries(selectedOptions).every(([k, val]) => {
                  if (!val) return true;
                  const have = opts[k];
                  if (have == null || have === '') return true;
                  return String(have).trim().toLowerCase() === String(val).trim().toLowerCase();
                });
              });
              return {
                id: it.product.id,
                name: `${it.product.nameAr || it.product.name}`.trim(),
                quantity: it.quantity,
                price: it.unitPrice,
                variationId: matched?.id || null,
                selectedOptions,
              };
            }),
          },
          {
            syncOrderFromApi,
            addOrder,
            toAddOrderPayload: () => ({
              customerName: checkoutForm.name,
              customerPhone: checkoutForm.phone,
              customerEmail: undefined,
              deliveryLocation: `${checkoutForm.city} - ${checkoutForm.address}`,
              itemsCount: cartCount,
              items: itemsPayload,
              total: payable,
              subtotal: cartTotal,
              discount: couponDiscount,
              shipping: shippingFee,
              status: 'pending',
              paymentMethod: checkoutForm.paymentMethod === 'cod' ? 'Cash on Delivery' : 'mada',
              paymentStatus: 'Pending',
              source: readTrafficSource().source,
              customerNotes: [
                checkoutForm.notes,
                couponCode.trim() ? `Coupon: ${couponCode.trim()} (-${couponDiscount} SAR)` : '',
                shippingLabel ? `Shipping: ${shippingLabel}` : '',
              ].filter(Boolean).join(' | '),
              time: new Date().toLocaleTimeString('ar-SA'),
            }),
          },
        );
        setOrderCompleteData({ orderNumber: persisted.orderNumber, total: payable });
        setCart([]);
        setCouponCode('');
        setCouponDiscount(0);
        setCouponMessage(null);
        setCheckoutOpen(false);
        addToast({
          type: 'success',
          title: isAr ? 'تم استلام الطلب' : 'Order received',
          message: isAr
            ? `رقم الطلب ${persisted.orderNumber}`
            : `Order ${persisted.orderNumber}`,
        });
      } catch {
        setCheckoutError(isAr ? 'تعذر إتمام الطلب. حاول مرة أخرى.' : 'Could not place order. Please try again.');
      } finally {
        setCheckoutBusy(false);
      }
    })();
  };

  const storeDisplayName = isAr 
    ? (activeStore?.nameAr || BLECO_STORE_INFO.nameAr)
    : (activeStore?.nameEn || BLECO_STORE_INFO.nameEn);

  const isAnyModalOpen = !!(
    selectedProduct || 
    selectedFloorMatModal || 
    selectedBlogPost || 
    vehicleMatchModalOpen || 
    cartDrawerOpen || 
    checkoutOpen
  );

  return (
    <div className="alsaeedi-theme-container pb-20 lg:pb-0" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Luxury Animated Toast & Alert Notification Center (Strictly hidden when modal is open) */}
      <LuxuryToastSystem 
        toasts={toasts} 
        onDismiss={dismissToast} 
        isAr={isAr} 
        hasOpenModal={isAnyModalOpen}
      />

      {/* 1. SLIM TOP MICRO-BAR */}
      <div className="alsaeedi-top-announce">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 sm:px-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-5 text-[10px] sm:text-xs">
            <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
              <span className="truncate">{isAr ? 'مكة المكرمة — بطحاء قريش' : 'Makkah Al-Mukarramah'}</span>
            </span>
            <span className="hidden items-center gap-1.5 text-slate-500 md:flex">
              <Truck className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>{isAr ? 'شحن سريع لجميع مناطق المملكة (3-5 أيام)' : 'Express 3-5 Day Delivery Across KSA'}</span>
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <a
              href={storeWhatsApp ? `https://wa.me/${storeWhatsApp}` : undefined}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:underline sm:text-xs"
            >
              <WhatsAppGlyph className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline" dir="ltr">{storeWhatsApp || '—'}</span>
            </a>
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex cursor-pointer items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-[#915f3c] transition-all hover:bg-[#faede4] sm:gap-1.5 sm:px-3 sm:text-[11px]"
              aria-label={isAr ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic'}
            >
              <Globe className="h-3.5 w-3.5 text-[#915f3c]" aria-hidden="true" />
              <span>{isAr ? 'إنجليزي' : 'العربية'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN MODERN LUXURY NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/95 text-slate-900 shadow-[0_4px_20px_-8px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2.5 flex items-center justify-between gap-2 lg:gap-4">
          {/* Logo & Store Identity (Compact & Responsive) */}
          <div 
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer min-w-0 shrink-0" 
            onClick={() => handleResetFilter()}
          >
            <img 
              src={BLECO_STORE_INFO.logo} 
              alt={isAr ? "متجر السعيدي لخدمات السيارات" : "Al-Saeedi VIP Automotive Services"} 
              className="h-8 sm:h-9 w-auto object-contain filter drop-shadow shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-[11px] sm:text-xs xl:text-[13px] font-extrabold text-slate-900 leading-snug flex items-center gap-1.5">
                <span className="truncate max-w-[145px] sm:max-w-[200px] xl:max-w-[240px]">
                  {storeDisplayName}
                </span>
                <span className="text-[8px] sm:text-[9px] bg-[#915f3c] text-white px-1.5 py-0.5 rounded font-black tracking-wider shadow-xs shrink-0 leading-none">
                  VIP
                </span>
              </h1>
              <p className="text-[9px] sm:text-[10px] text-[#915f3c] font-medium hidden sm:block truncate max-w-[190px] xl:max-w-[240px] leading-tight">
                {isAr ? 'تنجيد وتلابيس مقاعد وأرضيات ليزر 5D' : 'Luxury Seat Covers & 5D Laser Mats'}
              </p>
            </div>
          </div>

          {/* Clean Desktop Nav Links + Categories Dropdown */}
          <nav className="hidden lg:flex items-center justify-center gap-3 xl:gap-4 text-[11px] xl:text-xs font-semibold text-slate-600 whitespace-nowrap">
            <button 
              type="button"
              onClick={() => { setViewMode('home'); handleResetFilter(); }}
              className={`hover:text-amber-800 transition-colors cursor-pointer py-1 ${viewMode === 'home' ? 'text-amber-800' : ''}`}
            >
              {isAr ? 'الرئيسية' : 'Home'}
            </button>

            {/* Categories Interactive Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setNavDropdownOpen(true)}
              onMouseLeave={() => setNavDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => setNavDropdownOpen(prev => !prev)}
                className={`flex items-center gap-1 py-1.5 hover:text-[#f6c344] transition-colors cursor-pointer ${navDropdownOpen ? 'text-[#f6c344]' : ''}`}
              >
                <span>{isAr ? 'أقسامنا' : 'Categories'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${navDropdownOpen ? 'rotate-180 text-[#f6c344]' : 'text-slate-400'}`} />
              </button>

              {navDropdownOpen && (
                <div className={`absolute top-full pt-2 w-64 z-50 animate-fadeIn ${isAr ? 'right-0' : 'left-0'}`}>
                  <div className="bg-white/98 border border-[#d5a027]/40 rounded-2xl shadow-2xl p-2 backdrop-blur-xl space-y-1">
                    <a
                      href="#featured-seats-section"
                      onClick={() => { if (viewMode !== 'home') setViewMode('home'); setNavDropdownOpen(false); }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#d5a027]/15 border border-[#d5a027]/30 flex items-center justify-center text-[#f6c344] shrink-0 group-hover:bg-[#d5a027] group-hover:text-slate-900 transition-colors">
                        <Palette className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors">
                          {isAr ? 'تلابيس المقاعد الملكية' : 'VIP Seat Covers'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {isAr ? 'جلد ألماني، قماش، ودايموند' : 'Leather, Fabric & Diamond Fit'}
                        </div>
                      </div>
                    </a>

                    <a
                      href="#floor-mats-section"
                      onClick={() => { if (viewMode !== 'home') setViewMode('home'); setNavDropdownOpen(false); }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#d5a027]/15 border border-[#d5a027]/30 flex items-center justify-center text-[#f6c344] shrink-0 group-hover:bg-[#d5a027] group-hover:text-slate-900 transition-colors">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors">
                          {isAr ? 'أرضيات ليزر 5D' : '5D Laser Floor Mats'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {isAr ? 'حماية 5 طبقات مقاومة للماء' : '5-Layer Waterproof Protection'}
                        </div>
                      </div>
                    </a>

                    <a
                      href="#brands-section"
                      onClick={() => { if (viewMode !== 'home') setViewMode('home'); setNavDropdownOpen(false); }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#d5a027]/15 border border-[#d5a027]/30 flex items-center justify-center text-[#f6c344] shrink-0 group-hover:bg-[#d5a027] group-hover:text-slate-900 transition-colors">
                        <Car className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors">
                          {isAr ? 'ماركات السيارات' : 'Car Brands'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {isAr ? 'فلترة حسب ماركة سيارتك' : 'Filter by your car brand'}
                        </div>
                      </div>
                    </a>

                    <div className="border-t border-white/10 my-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('catalog');
                          setNavDropdownOpen(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-[#d5a027]/20 to-[#f6c344]/10 hover:from-[#d5a027] hover:to-[#f6c344] text-[#f6c344] hover:text-slate-900 text-[11px] font-black transition-all cursor-pointer"
                      >
                        <span>{isAr ? 'تصفح جميع المنتجات' : 'Browse Full Catalog'}</span>
                        {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <a href="#featured-seats-section" className="hover:text-amber-800 transition-colors py-1">
              {isAr ? 'تلابيس' : 'Seats'}
            </a>
            <a href="#floor-mats-section" className="hover:text-amber-800 transition-colors py-1">
              {isAr ? 'أرضيات' : 'Mats'}
            </a>
            <button
              type="button"
              onClick={() => {
                setViewMode('booking');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`transition-colors py-1 px-3 rounded-full font-bold cursor-pointer ${
                viewMode === 'booking'
                  ? 'bg-[#faede4] text-[#915f3c] shadow-2xs'
                  : 'text-slate-700 hover:text-[#915f3c] hover:bg-[#faede4]'
              }`}
            >
              {isAr ? 'حجز موعد واستفسار' : 'Book & Inquire'}
            </button>
            <a href="#brands-section" className="hover:text-amber-800 transition-colors py-1">
              {isAr ? 'ماركات' : 'Brands'}
            </a>
            <a href="#reviews-section" className="hover:text-amber-800 transition-colors py-1">
              {isAr ? 'آراء' : 'Reviews'}
            </a>
          </nav>

          {/* Right Action Icons: Search, Account, WhatsApp, Cart, Mobile Menu */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setSearchBarOpen((prev) => !prev)}
              className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all sm:h-9 sm:w-9 shadow-xs ${
                searchBarOpen
                  ? 'bg-[#915f3c] text-white'
                  : 'bg-slate-50 text-slate-700 hover:bg-[#faede4] hover:text-[#915f3c]'
              }`}
              title={isAr ? 'بحث عن سيارة أو موديل' : 'Search car model'}
              aria-label={isAr ? 'بحث' : 'Search'}
            >
              {searchBarOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => setIsAccountModalOpen(true)}
              className="hidden h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-50 text-slate-700 transition-all hover:bg-[#faede4] hover:text-[#915f3c] sm:flex sm:h-9 sm:w-9 shadow-xs"
              title={isAr ? 'حسابي والطلبات' : 'My Account & Orders'}
              aria-label={isAr ? 'حسابي' : 'My Account'}
            >
              <User className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => openWhatsAppOrder()}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-emerald-600 text-white transition-all hover:bg-emerald-500 sm:h-9 sm:w-9 shadow-xs"
              title={isAr ? 'تواصل عبر واتساب' : 'WhatsApp Order'}
              aria-label={isAr ? 'واتساب' : 'WhatsApp'}
            >
              <WhatsAppGlyph className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              className="relative flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#915f3c] px-2.5 text-xs font-bold text-white transition-all hover:bg-[#7e5233] sm:h-9 sm:px-3.5 shadow-sm"
              title={isAr ? 'سلة المشتريات' : 'Shopping Cart'}
              aria-label={isAr ? 'السلة' : 'Cart'}
            >
              <ShoppingCart className="h-4 w-4 shrink-0 text-white" />
              <span className="hidden sm:inline">{isAr ? 'السلة' : 'Cart'}</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -end-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#faede4] px-1 text-[10px] font-black text-[#915f3c] shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-[#915f3c] transition-all hover:bg-[#faede4] lg:hidden sm:h-9 sm:w-9 shadow-xs"
              aria-label={isAr ? 'فتح القائمة' : 'Open Menu'}
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Search Dropdown Bar */}
        {searchBarOpen && (
          <div className="bg-white/95 backdrop-blur-xl px-3 sm:px-6 py-2.5 animate-fadeIn shadow-md">
            <div className="max-w-2xl mx-auto flex items-center gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => { 
                    if (e.key === 'Enter') {
                      handleApplyFilter();
                      setSearchBarOpen(false);
                    }
                  }}
                  autoFocus
                  placeholder={isAr ? "ابحث باسم السيارة أو الموديل (مثال: كامري، لاندكروزر، إلنترا)..." : "Search car make or model (e.g., Camry, Land Cruiser, Sonata)..."}
                  style={{ backgroundColor: '#f8fafc', color: '#1e293b' }}
                  className="w-full !bg-slate-50 !text-slate-900 placeholder-slate-400 text-xs rounded-full pl-9 pr-9 py-2 focus:outline-none focus:ring-2 focus:ring-[#915f3c] transition-all"
                />
                <Search className={`w-3.5 h-3.5 text-[#915f3c] absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className={`absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 cursor-pointer`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  handleApplyFilter();
                  setSearchBarOpen(false);
                }}
                className="px-4 py-2 rounded-full btn-bashayer-gold text-xs font-black shrink-0 cursor-pointer"
              >
                {isAr ? 'بحث' : 'Search'}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* MOBILE SLIDE-OUT DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className={`relative w-[85%] max-w-sm h-full bg-white text-slate-900 z-10 flex flex-col justify-between shadow-2xl border-l border-r border-[#d5a027]/30 ${
            isAr ? 'mr-auto animate-drawer-rtl' : 'ml-auto animate-drawer-ltr'
          }`}>
            <div className="p-5 space-y-5 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <img src={BLECO_STORE_INFO.logo} alt="Logo" className="h-8 w-auto object-contain" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{storeDisplayName}</h3>
                    <span className="text-[10px] text-[#f6c344] font-bold">VIP Studio · Makkah</span>
                  </div>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Language Switcher in Drawer */}
              <button
                onClick={() => {
                  toggleLanguage();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-[#d5a027]/30 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <Globe className="w-4 h-4 text-[#f6c344]" />
                  <span>{isAr ? 'اللغة الحالية: العربية' : 'Current Language: English'}</span>
                </div>
                <span className="text-[10px] bg-gradient-to-r from-[#d5a027] to-[#f6c344] text-slate-900 px-2.5 py-0.5 rounded-full font-black">
                  {isAr ? 'التبديل إلى الإنجليزية' : 'التحويل للعربية'}
                </span>
              </button>

              {/* Search Inside Drawer */}
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => { 
                    if (e.key === 'Enter') { 
                      handleApplyFilter(); 
                      setMobileMenuOpen(false); 
                    } 
                  }}
                  placeholder={isAr ? "ابحث بالماركة أو الموديل..." : "Search car model..."}
                  className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-9 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#d5a027] border border-white/15"
                />
                <Search className={`w-4 h-4 text-slate-400 absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 pointer-events-none`} />
              </div>

              {/* Navigation Links with Icons */}
              <nav className="space-y-1 text-xs font-bold text-slate-600">
                <button
                  onClick={() => {
                    setViewMode('home');
                    handleResetFilter();
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-left rtl:text-right"
                >
                  <Car className="w-4 h-4 text-[#f6c344]" />
                  <span>{isAr ? 'الصفحة الرئيسية' : 'Home'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsAccountModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-left rtl:text-right text-[#f6c344]"
                >
                  <User className="w-4 h-4 text-[#f6c344]" />
                  <span>{isAr ? 'حسابي والطلبات' : 'My Account & Orders'}</span>
                </button>

                <a
                  href="#featured-seats-section"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <Palette className="w-4 h-4 text-[#f6c344]" />
                  <span>{isAr ? 'تلابيس المقاعد' : 'Seat Covers'}</span>
                </a>

                <a
                  href="#floor-mats-section"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-[#f6c344]" />
                  <span>{isAr ? 'أرضيات 5D' : '5D Floor Mats'}</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setViewMode('booking');
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#faede4] text-[#915f3c] font-black hover:bg-[#f5e1d3] transition-colors cursor-pointer text-left rtl:text-right"
                >
                  <Calendar className="w-4 h-4 text-[#915f3c]" />
                  <span>{isAr ? 'حجز موعد واستفسار' : 'Book & Inquire'}</span>
                </button>

                <a
                  href="#brands-section"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <Car className="w-4 h-4 text-[#f6c344]" />
                  <span>{isAr ? 'ماركات السيارات' : 'Car Brands'}</span>
                </a>

                <a
                  href="#reviews-section"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <Star className="w-4 h-4 text-[#f6c344]" />
                  <span>{isAr ? 'آراء العملاء' : 'Customer Reviews'}</span>
                </a>
              </nav>
            </div>

            <div className="p-4 bg-black/40 border-t border-white/10 space-y-2.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openWhatsAppOrder();
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <WhatsAppGlyph className="w-4 h-4" />
                <span>{isAr ? 'محادثة واتساب مباشرة' : 'Direct WhatsApp Chat'}</span>
              </button>

              <div className="text-center text-[10px] text-slate-400">
                <span>{isAr ? 'فرع مكة المكرمة · بطحاء قريش' : 'Makkah Studio · Batha Quraish'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: HOME PAGE */}
      {viewMode === 'home' && (
        <>
          {/* 3. ULTRA-LUXURY MODERN RESPONSIVE SAUDI HERO SECTION */}
          <AlsaeediLuxuryHero 
            isAr={isAr}
            formMake={formMake}
            setFormMake={setFormMake}
            formModel={formModel}
            setFormModel={setFormModel}
            formYear={formYear}
            setFormYear={setFormYear}
            formColor={formColor}
            setFormColor={setFormColor}
            availableModels={availableModels}
            availableYears={availableYears}
            onSubmit={handleApplyFilter}
            onReset={handleResetFilter}
            onQuickVehicleSelect={handleQuickVehicleSelect}
            onPillClick={handlePillClick}
            onOpenWhatsApp={(msg) => openWhatsAppOrder(undefined, undefined, undefined, msg)}
            onSelectCategory={(catId) => {
              if (catId === 'cat-clothing') {
                const el = document.getElementById('featured-seats-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              } else if (catId === 'cat-floors') {
                const el = document.getElementById('floor-mats-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            onOpenFloorMatModal={() => {
              const liveMat = (currentProducts || []).find(isFloorMatProduct);
              if (liveMat) setSelectedFloorMatModal(liveMat);
              else {
                const el = document.getElementById('floor-mats-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            onToggleLang={toggleLanguage}
          />

          {/* MAIN PAGE BODY */}
          <main className="max-w-7xl mx-auto px-3 sm:px-4 py-8 sm:py-12 alsaeedi-main-stack flex flex-col">

            {/* ========================================================
                SECTION 1: THE 2 CORE CATEGORIES (أقسامنا الرئيسية: تلابيس المقاعد وأرضيات السيارات)
                ======================================================== */}
            <CoreTwoCategoriesSection 
              isAr={isAr}
              activeCategoryId={activeCategory?.id}
              onSelectCategory={(catId) => {
                if (catId === 'cat-clothing') {
                  const el = document.getElementById('featured-seats-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                } else if (catId === 'cat-floors') {
                  const el = document.getElementById('floor-mats-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />

            {/* ========================================================
                SECTION 4: CAR SEAT COVERS (تلابيس مقاعد ملكية تفصيل وكالة ليزري)
                ======================================================== */}
            {(() => {
              const seatsFromStore = currentProducts?.filter((p) => {
                const blob = [
                  p.type,
                  p.id,
                  p.category,
                  p.categoryAr,
                  p.categoryEn,
                  p.name,
                  p.nameAr,
                  p.nameEn,
                ]
                  .filter(Boolean)
                  .join(' ')
                  .toLowerCase();
                return (
                  p.type === 'seat-cover' ||
                  blob.includes('seat') ||
                  blob.includes('تلابيس') ||
                  blob.includes('تلبيس') ||
                  blob.includes('مقعد') ||
                  String(p.id || '').startsWith('prod-seat')
                );
              });
              const displaySeats = (seatsFromStore && seatsFromStore.length > 0
                ? seatsFromStore
                : []).slice(0, 300);

              return (
                <ModernLuxurySeatCoversSection
                  isAr={isAr}
                  seats={displaySeats}
                  loading={productsLoading}
                  currentProducts={currentProducts}
                  cardSelectedColors={cardSelectedColors}
                  setCardSelectedColors={setCardSelectedColors}
                  onSelectProduct={(liveProd, cardImg, activeCol) => {
                    setSelectedProduct(liveProd);
                    if (cardImg) setSelectedProductGalleryImg(cardImg);
                    if (activeCol) setDetailColor(activeCol);
                    setDetailQuantity(1);
                  }}
                  onOpenWhatsApp={(prod, col, price, customMsg) => {
                    openWhatsAppOrder(prod, col, price, customMsg);
                  }}
                  onAddToCart={(prod, qty, col) => {
                    addToCart(prod, qty, col);
                  }}
                  onViewAll={() => {
                    const el = document.getElementById('catalog-view-top');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    setViewMode('catalog');
                  }}
                />
              );
            })()}

{/* ========================================================
                SECTION 3: CAR FLOOR MATS (أرضيات 5D ليزر فائقة الدقة والرفاهية)
                ======================================================== */}
            <ModernLuxuryFloorMatsSection
              isAr={isAr}
              loading={productsLoading}
              mats={(currentProducts?.filter((p) => {
                const blob = [
                  p.type,
                  p.id,
                  p.category,
                  p.categoryAr,
                  p.categoryEn,
                  p.name,
                  p.nameAr,
                  p.nameEn,
                ]
                  .filter(Boolean)
                  .join(' ')
                  .toLowerCase();
                return (
                  p.type === 'floor-mat' ||
                  blob.includes('floor') ||
                  blob.includes('mat') ||
                  blob.includes('أرض') ||
                  blob.includes('ارض') ||
                  blob.includes('دعاس') ||
                  String(p.id || '').startsWith('prod-mat')
                );
              }) || []).slice(0, 300)}
              onSelectMat={(mat) => setSelectedFloorMatModal(mat)}
              onOpenWhatsApp={(mat, selectedColorName) => {
                const customMsg = isAr
                  ? `مرحباً متجر السعيدي، أرغب بالطلب والاستفسار عن أرضيات 5D ليزر:\n*النوع:*${mat.nameAr || mat.name}\n${selectedColorName ?`*اللون المفضل:* ${selectedColorName}\n` : ''}*السعر:* ${mat.price} ⃁\n*المطلوب:* تفصيل ليزري لموديل سيارتي.`
                  : `Hello Al-Saeedi Car Services, I would like to order 5D Laser Floor Mats:\n*Type:* ${mat.nameEn || mat.name}\n${selectedColorName ? `*Preferred Color:* ${selectedColorName}\n` : ''}*Price:* ${mat.price} SAR\n*Request:* Laser tailored for my vehicle model.`;
                openWhatsAppOrder(mat, undefined, undefined, customMsg);
              }}
              onViewAll={() => {
                const el = document.getElementById('catalog-view-top');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                setViewMode('catalog');
              }}
              onAddToCart={addFloorMatToCart}
            />

            {/* ========================================================
                SECTION: BROWSE BY CAR BRAND (filter helper)
                ======================================================== */}
            <section 
              id="brands-section" 
              className="alsaeedi-section alsaeedi-anim-fadeup relative p-4 sm:p-6 lg:p-7 space-y-5"
            >
              {/* Ambient Glows */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-radial from-[#d5a027]/12 to-transparent rounded-full blur-xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-radial from-slate-300/25 to-transparent rounded-full blur-xl pointer-events-none" />

              {/* Section Header */}
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black bg-[#faede4] text-[#915f3c] shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#915f3c] alsaeedi-anim-pulse" />
                    <span>{isAr ? 'اختر ماركة سيارتك' : 'Choose your car brand'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#915f3c] text-white flex items-center justify-center shadow-md shrink-0">
                      <Car className="w-5 h-5 drop-shadow" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span>{isAr ? 'تصفح حسب ماركة سيارتك' : 'Browse by Car Brand'}</span>
                      </h3>
                      <p className="text-xs sm:text-[13px] text-slate-500 font-medium mt-0.5">
                        {isAr ? 'اضغط الماركة ثم الموديل لتصفية المنتجات' : 'Tap a brand, then a model to filter products'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  {activeBrand ? (
                    <button 
                      onClick={() => {
                        setActiveBrand(null);
                        setFormMake('all');
                        setFormModel('all');
                      }} 
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 transition-all cursor-pointer shadow-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{isAr ? 'عرض جميع الماركات' : 'Clear Filter'}</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                      <Award className="w-3.5 h-3.5 text-[#d5a027]" />
                      <span>{isAr ? `${CAR_BRANDS.length} ماركة` : `${CAR_BRANDS.length} brands`}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Brands Grid with Luxury Circular Emblem Podium */}
              {productsLoading ? (
                <div className="relative z-10">
                  <AlsaeediBrandsSkeleton />
                </div>
              ) : (
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-3.5 pt-1 pb-2 alsaeedi-stagger">
                {CAR_BRANDS.map(brand => {
                  const isSelected = activeBrand?.id === brand.id;
                  const modelsCount = CAR_MODELS_MAP[brand.id]?.length || 0;
                  return (
                    <div 
                      key={brand.id}
                      onClick={() => {
                        setActiveBrand(isSelected ? null : brand);
                        setFormMake(isSelected ? 'all' : brand.nameEn.toLowerCase());
                        if (isSelected) setFormModel('all');
                      }}
                      className={`alsaeedi-brand-card p-3 sm:p-3.5 flex flex-col items-center justify-center text-center cursor-pointer group relative isolate ${
                        isSelected ? 'active' : ''
                      }`}
                    >
                      {/* Active indicator checkmark */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-gradient-to-r from-[#d5a027] to-[#f6c344] text-slate-900 flex items-center justify-center shadow-xs z-10 animate-fadeIn">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Circular Emblem Shape */}
                      <div className="alsaeedi-brand-emblem my-1">
                        <img 
                          src={brand.logo} 
                          alt={isAr ? brand.nameAr : brand.nameEn} 
                          className="h-8 max-w-[46px] w-auto object-contain filter group-hover:scale-110 transition-transform duration-300 drop-shadow-xs"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div 
                          style={{ display: 'none' }}
                          className="w-9 h-9 rounded-full bg-slate-50 text-slate-800 font-black text-xs items-center justify-center border border-slate-200"
                        >
                          {brand.nameEn.slice(0, 2).toUpperCase()}
                        </div>
                      </div>

                      {/* Brand Title */}
                      <span className="text-xs sm:text-[13px] font-black mt-2 text-slate-800 group-hover:text-slate-800 transition-colors line-clamp-1 tracking-tight">
                        {isAr ? brand.nameAr : brand.nameEn}
                      </span>

                      {/* Models count tag */}
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#d5a027] transition-colors mt-0.5">
                        {modelsCount > 0 ? (isAr ? `${modelsCount}موديل` : `${modelsCount} models`) : (isAr ? 'متعدد' : 'All')}
                      </span>
                    </div>
                  );
                })}
              </div>
              )}

              {/* Models Chips if Brand Selected - Luxury VIP Model Picker */}
              {!productsLoading && activeBrand && (
                <div className="relative z-10 p-4 sm:p-5 alsaeedi-card-gold border border-[#d5a027]/40 rounded-2xl space-y-3 alsaeedi-anim-slide">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100/90 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full alsaeedi-card-chip p-1 flex items-center justify-center">
                        <img 
                          src={activeBrand.logo} 
                          alt={activeBrand.nameEn} 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-black text-slate-800">
                          {isAr ? `موديلات${activeBrand.nameAr}المتوافقة:` : `${activeBrand.nameEn} Compatible Models:`}
                        </span>
                        <p className="text-[11px] text-slate-500">
                          {isAr ? 'اضغط على الموديل للفلترة السريعة وتفصيل المقاس الدقيق' : 'Click a model for instantaneous custom match'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFormModel('all');
                        handleApplyFilter();
                      }}
                      className="text-xs font-bold text-slate-800 hover:text-[#d5a027] transition-colors cursor-pointer"
                    >
                      {isAr ? `عرض كل منتجات${activeBrand.nameAr}` : `View all ${activeBrand.nameEn}`}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {(CAR_MODELS_MAP[activeBrand.id] || []).map((m, idx) => {
                      const isModelSel = formModel === m.modelEn;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setFormModel(m.modelEn);
                            handleApplyFilter();
                          }}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 border ${
                            isModelSel
                              ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white border-[#d5a027] ring-2 ring-[#d5a027]/30 shadow-md'
                              : 'alsaeedi-card-chip text-slate-800 hover:border-[#d5a027]/60'
                          }`}
                        >
                          <span>{isAr ? m.modelAr : m.modelEn}</span>
                          {isModelSel && <Check className="w-3 h-3 text-[#f6c344]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            <AlsaeediServicesBooking isAr={isAr} storeId={storeId} />

            {/* Customer comments only — no fake KPI scores */}
            <section id="reviews-section" className="alsaeedi-section-soft alsaeedi-anim-fadeup space-y-5 p-4 sm:p-6">
              <div className="text-center space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {isAr ? 'آراء العملاء' : 'Customer Reviews'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr ? 'تعليقات مشترين من مدن المملكة' : 'Comments from customers across Saudi Arabia'}
                </p>
              </div>

              {reviewsLoading || productsLoading ? (
                <AlsaeediReviewsSkeleton />
              ) : storeReviews.length === 0 ? (
                <div className="rounded-2xl bg-white shadow-2xs px-4 py-10 text-center">
                  <Star className="mx-auto mb-2 h-8 w-8 text-slate-300" aria-hidden="true" />
                  <p className="text-sm font-bold text-slate-700">
                    {isAr ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {isAr ? 'بانتظار أول تقييمات العملاء الحقيقية لهذا المتجر.' : 'Waiting for real customer reviews for this store.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 alsaeedi-stagger sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                  {storeReviews.slice(0, 6).map((rev) => {
                    const stars = Math.max(1, Math.min(5, Number(rev.rating) || 5));
                    return (
                      <div key={rev.id} className="alsaeedi-card alsaeedi-anim-lift alsaeedi-reveal-scale space-y-3 p-5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h5 className="truncate text-xs font-bold text-slate-900">{rev.author || (isAr ? 'عميل' : 'Customer')}</h5>
                            {rev.date ? (
                              <span className="text-[10px] text-slate-400">{rev.date}</span>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 text-amber-400" aria-label={`${stars}/5`}>
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < stars ? 'fill-current' : 'text-slate-200'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-600">
                          {(isAr ? (rev.commentAr || rev.comment) : (rev.comment || rev.commentAr)) ||
                            (isAr ? 'لا يوجد تعليق' : 'No comment')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </main>
        </>
      )}

      {/* VIEW 2: ADVANCE SEARCH & 400+ CATALOG VIEW */}
      {viewMode === 'catalog' && (
        <main id="catalog-view-top" className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <button
              onClick={() => handleResetFilter()}
              className="text-xs font-bold text-slate-800 flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{isAr ? 'العودة للرئيسية' : 'Back to Home'}</span>
            </button>

            <span className="text-xs text-slate-500 font-mono">
              {isAr ? `وجدنا${fullFilteredProducts.length}منتج متوافق` : `Found ${fullFilteredProducts.length} matching products`}
            </span>
          </div>

          {/* 2 CORE CATEGORIES SELECTOR TABS (seats cover or mats bs overall) */}
          <div className="flex items-center gap-2 overflow-x-auto overscroll-x-contain touch-pan-x pb-1 scrollbar-none" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pinch-zoom' }}>
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs ${
                activeCategory === null
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <span>{isAr ? 'الكل (جميع المنتجات)' : 'All Products'}</span>
              <span className="text-[10px] opacity-80">({storeCatalog.length})</span>
            </button>

            <button
              onClick={() => setActiveCategory(BLECO_CATEGORIES[0])}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs ${
                activeCategory?.id === 'cat-clothing'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>{isAr ? 'تلابيس وتنجيد المقاعد' : 'Custom Seat Covers'}</span>
              <span className="text-[10px] opacity-80">({seatCoversCount})</span>
            </button>

            <button
              onClick={() => setActiveCategory(BLECO_CATEGORIES[1])}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs ${
                activeCategory?.id === 'cat-floors'
                  ? 'bg-[#d5a027] text-slate-900 font-black shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-[#d5a027]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'أرضيات ودعاسات 5D' : '5D Floor Mats'}</span>
              <span className="text-[10px] opacity-80">({floorMatsCount})</span>
            </button>
          </div>

          {/* SAUDI TRUST & SPECIFICATIONS STRIP (حسب متطلبات السوق السعودي) */}
          <div className="bg-gradient-to-r from-slate-100 via-white to-slate-50 text-slate-800 p-3 sm:p-3.5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-2.5 text-[11px] font-bold">
            <div className="flex min-w-0 items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
              <span className="truncate">{isAr ? 'مطابق لمقاس الوكالة السعودية 100%' : '100% Saudi Agency Fit Guaranteed'}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-amber-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'ضمان ذهبي سنتين ضد التقشير والبهتان' : '2-Year Full Color & Peel Warranty'}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-700">
              <Truck className="w-3.5 h-3.5" />
              <span>{isAr ? 'شحن سريع لجميع مدن المملكة' : 'Fast Delivery across all KSA cities'}</span>
            </div>
            <div className="hidden md:flex items-center gap-1 text-amber-700">
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isAr ? 'تقسيط مريح 4 دفعات (تمارا · تابي)' : '4 Installments with Tamara & Tabby'}</span>
            </div>
          </div>

          {/* ========================================================
              ADVANCE AUTOMOTIVE FILTER SUITE (فلتر متقدم للماركات والموديلات والألوان)
              ======================================================== */}
          <div className="space-y-4">
            {/* 1. Quick Brand Pills with Logos (10 Companies) */}
            <div className="alsaeedi-card-panel p-3 sm:p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-slate-800" />
                  <span>{isAr ? 'اختر ماركة سيارتك (10 شركات كبرى):' : 'Select Car Brand (10 Major Companies):'}</span>
                </span>
                {formMake !== 'all' && (
                  <button
                    onClick={() => { setFormMake('all'); setFormModel('all'); }}
                    className="text-[11px] font-bold text-slate-800 hover:underline cursor-pointer"
                  >
                    {isAr ? 'عرض كل الماركات' : 'All Brands'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto overscroll-x-contain pb-2 scrollbar-none snap-x snap-proximity touch-pan-x -mx-1 px-1" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pinch-zoom', scrollBehavior: 'auto' }}>
                <button
                  onClick={() => { setFormMake('all'); setFormModel('all'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 snap-start ${
                    formMake === 'all'
                      ? 'bg-slate-800 text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{isAr ? 'جميع الشركات' : 'All Brands'}</span>
                  <span className="text-[10px] opacity-75">({storeCatalog.length})</span>
                </button>

                {CAR_BRANDS.slice(0, 10).map(b => {
                  const isSel = formMake.toLowerCase() === b.nameEn.toLowerCase();
                  const realCount = brandProductCounts[b.nameEn.toLowerCase()] || b.productCount;
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        setFormMake(isSel ? 'all' : b.nameEn.toLowerCase());
                        setFormModel('all');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 border snap-start ${
                        isSel
                          ? 'bg-slate-50 border-slate-300 text-slate-800 ring-2 ring-slate-400/30 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <img src={b.logo} alt={b.nameEn} className="w-4 h-4 object-contain" />
                      <span>{isAr ? b.nameAr : b.nameEn}</span>
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded-full bg-slate-100 text-slate-600">
                        {realCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Advance Filters Controls Grid */}
            <div className="p-4 alsaeedi-card-panel space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                {/* Model dropdown */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{isAr ? 'موديل السيارة:' : 'Vehicle Model:'}</label>
                  <select 
                    value={formModel} 
                    onChange={e => setFormModel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold cursor-pointer text-xs focus:ring-2 focus:ring-slate-400 focus:outline-none"
                  >
                    <option value="all">{isAr ? 'جميع الموديلات' : 'All Models'}</option>
                    {availableModels.map((m, idx) => (
                      <option key={idx} value={m.modelEn}>{isAr ? m.modelAr : m.modelEn}</option>
                    ))}
                  </select>
                </div>

                {/* Material Filter */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{isAr ? 'نوع الخامة:' : 'Material:'}</label>
                  <select 
                    value={catalogMaterialFilter} 
                    onChange={e => setCatalogMaterialFilter(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold cursor-pointer text-xs focus:ring-2 focus:ring-slate-400 focus:outline-none"
                  >
                    <option value="all">{isAr ? 'جميع الخامات' : 'All Materials'}</option>
                    <option value="leather">{isAr ? 'جلد فاخر مطابق للوكالة' : 'Luxury OEM Leather'}</option>
                    <option value="fabric">{isAr ? 'قماش أصلي بارد' : 'Cooling Fabric'}</option>
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{isAr ? 'سنة الصنع:' : 'Model Year:'}</label>
                  <select 
                    value={formYear} 
                    onChange={e => setFormYear(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold cursor-pointer text-xs focus:ring-2 focus:ring-slate-400 focus:outline-none"
                  >
                    <option value="all">{isAr ? 'جميع السنوات' : 'All Years'}</option>
                    {availableYears.map((yr: string) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{isAr ? 'الترتيب حسب:' : 'Sort By:'}</label>
                  <select 
                    value={catalogSort} 
                    onChange={e => setCatalogSort(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold cursor-pointer text-xs focus:ring-2 focus:ring-slate-400 focus:outline-none"
                  >
                    <option value="featured">{isAr ? 'الأكثر طلباً ومبيعاً' : 'Most Popular & Best Sellers'}</option>
                    <option value="price-asc">{isAr ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                    <option value="price-desc">{isAr ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                  </select>
                </div>

                {/* Search query box */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-700 font-bold mb-1">{isAr ? 'بحث سريع:' : 'Quick Search:'}</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={isAr ? 'كامري، يوكن، جلد...' : 'Camry, Yukon...'}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-8 pl-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* 3. Interactive Color Swatches Row */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-slate-800" />
                    <span>{isAr ? 'فلترة حسب اللون:' : 'Filter by Color:'}</span>
                  </span>
                  
                  <button
                    onClick={() => setFormColor('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                      formColor === 'all'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isAr ? 'كل الألوان' : 'All'}
                  </button>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {SEAT_COLORS.map(c => {
                      const isColActive = formColor === c.nameAr;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setFormColor(isColActive ? 'all' : c.nameAr)}
                          className={`px-2 py-1 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all ${
                            isColActive
                              ? 'border-slate-300 bg-slate-50 ring-2 ring-slate-400/30 scale-105 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                          title={isAr ? c.nameAr : c.nameEn}
                        >
                          <span className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs" style={{ backgroundColor: c.hex }} />
                          <span className="text-[10px] font-bold text-slate-700">{isAr ? c.nameAr : c.nameEn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Reset button */}
                <button 
                  onClick={handleResetFilter}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مسح الفلاتر' : 'Reset All'}</span>
                </button>
              </div>

              {/* Active Filter Chips */}
              {(formMake !== 'all' || formModel !== 'all' || formYear !== 'all' || formColor !== 'all' || catalogMaterialFilter !== 'all' || searchQuery) && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500">{isAr ? 'الفلاتر النشطة:' : 'Active Filters:'}</span>
                  {formMake !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold flex items-center gap-1">
                      <span>{formMake.toUpperCase()}</span>
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFormMake('all')} />
                    </span>
                  )}
                  {formModel !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold flex items-center gap-1">
                      <span>{formModel}</span>
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFormModel('all')} />
                    </span>
                  )}
                  {formColor !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold flex items-center gap-1">
                      <span>{formColor}</span>
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFormColor('all')} />
                    </span>
                  )}
                  {catalogMaterialFilter !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold flex items-center gap-1">
                      <span>{catalogMaterialFilter === 'leather' ? (isAr ? 'جلد فاخر' : 'Leather') : (isAr ? 'قماش أصلي' : 'Fabric')}</span>
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setCatalogMaterialFilter('all')} />
                    </span>
                  )}
                  {formYear !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold flex items-center gap-1">
                      <span>{formYear}</span>
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFormYear('all')} />
                    </span>
                  )}
                  {searchQuery && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold flex items-center gap-1">
                      <span>"{searchQuery}"</span>
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Full Grid (2 columns on mobile, 4 columns on desktop) */}
          {productsLoading ? (
            <AlsaeediCatalogSkeleton count={8} />
          ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
            {fullFilteredProducts.slice(0, catalogPageLimit).map(prod => {
              const liveProd = currentProducts?.find(p => p.id === prod.id) || prod;
              const prodColors = getProductColors(liveProd).slice(0, 3);
              const userColor = cardSelectedColors[liveProd.id];
              const activeColor = userColor || prodColors[0];
              const cardImg = (liveProd.type === 'seat-cover') ? (userColor?.image || activeColor?.image || liveProd.image) : liveProd.image;
              const finalPrice = liveProd.discountedPrice || liveProd.price;
              const originalPrice =
                liveProd.originalPrice && liveProd.originalPrice > finalPrice
                  ? liveProd.originalPrice
                  : null;
              const monthlyTabby = Math.round(finalPrice / 4);

              return (
                <div key={liveProd.id} className="alsaeedi-product-card alsaeedi-reveal-scale group relative flex flex-col justify-between transition-all duration-300 rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden">
                  <div 
                    className="relative aspect-square overflow-hidden bg-slate-50 cursor-pointer"
                    onClick={() => { 
                      if (liveProd.type === 'floor-mat') {
                        setSelectedFloorMatModal(liveProd);
                      } else {
                        setSelectedProduct(liveProd); 
                        setSelectedProductGalleryImg(cardImg);
                        setDetailColor(activeColor); 
                      }
                    }}
                  >
                    <img
                      src={cardImg}
                      alt={liveProd.name}
                      className="w-full h-full object-contain object-center img-zoom transition-all duration-500"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const el = e.currentTarget;
                        if (el.dataset.fallbackApplied === '1') {
                          el.dataset.broken = '1';
                          return;
                        }
                        el.dataset.fallbackApplied = '1';
                        el.src = '/images/categories/vip-luxury-seat-covers.jpg';
                      }}
                    />
                    
                    {/* Brand Pill */}
                    <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 bg-slate-900/80 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20 shadow-xs">
                      {liveProd.brand}
                    </span>

                    {/* Tag / Badge */}
                    {liveProd.type === 'floor-mat' ? (
                      <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 bg-emerald-600 text-white text-[8.5px] sm:text-[9.5px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs">
                        5D OEM
                      </span>
                    ) : (
                      <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 bg-amber-500 text-white text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs">
                        {isAr ? 'ضمان سنتين' : '2Y Warranty'}
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 sm:p-3.5 md:p-4 flex-1 flex flex-col justify-between space-y-2 text-xs">
                    <div>
                      <h4 
                        onClick={() => { 
                          if (liveProd.type === 'floor-mat') {
                            setSelectedFloorMatModal(liveProd);
                          } else {
                            setSelectedProduct(liveProd); 
                            setSelectedProductGalleryImg(cardImg);
                            setDetailColor(activeColor); 
                          }
                        }}
                        className="font-bold text-slate-900 line-clamp-2 hover:text-slate-800 cursor-pointer text-xs sm:text-sm leading-snug"
                      >
                        {isAr ? (liveProd.nameAr || liveProd.name) : (liveProd.nameEn || liveProd.name)}
                      </h4>

                      {/* Agency Fit Tag */}
                      <p className="mt-1 text-[9.5px] sm:text-[10.5px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{isAr ? 'مقاس وكالة 100% · عازل للحرارة' : '100% Agency Fit · Heat Insulated'}</span>
                      </p>

                      {/* Color dots row */}
                      {liveProd.type === 'seat-cover' && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[9.5px] text-slate-500 font-bold truncate max-w-[70px] sm:max-w-[100px]">
                            {isAr ? activeColor.nameAr : activeColor.nameEn}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {prodColors.map(c => (
                              <button
                                key={c.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCardSelectedColors(prev => ({ ...prev, [liveProd.id]: c }));
                                }}
                                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-black/15 shadow-2xs transition-all ${activeColor?.id === c.id ? 'ring-2 ring-[#d5a027] scale-110' : 'opacity-80 hover:opacity-100'}`}
                                style={{ backgroundColor: c.hex }}
                                title={isAr ? c.nameAr : c.nameEn}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Installments Mini Banner (Tamara / Tabby) */}
                    <div className="py-1 px-1.5 sm:px-2 rounded-lg bg-amber-50/80 border border-amber-200/60 flex items-center justify-between text-[8.5px] sm:text-[9.5px]">
                      <span className="text-amber-900 font-bold truncate">
                        {isAr ? `4 دفعات x${monthlyTabby}⃁` : `4x ${monthlyTabby} ⃁`}
                      </span>
                      <span className="text-slate-800 font-black shrink-0">{isAr ? 'تابي · تمارا' : 'Tabby'}</span>
                    </div>

                    {/* Price and CTA */}
                    <div className="pt-1.5 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="font-black text-sm sm:text-base text-slate-900">{finalPrice}</span>
                          <span className="text-[10px] font-bold text-[#b07e16] mr-0.5 ml-0.5">{'⃁'}</span>
                        </div>
                        {originalPrice != null && originalPrice > finalPrice && (
                          <span className="text-[10px] text-slate-400 line-through">
                            {originalPrice} {'⃁'}
                          </span>
                        )}
                      </div>

                      <button 
                        onClick={() => {
                          if (liveProd.type === 'floor-mat') {
                            setSelectedFloorMatModal(liveProd);
                          } else {
                            setSelectedProduct(liveProd);
                            setSelectedProductGalleryImg(cardImg);
                            setDetailColor(activeColor);
                          }
                        }}
                        className="w-full py-1.5 sm:py-2 rounded-xl btn-bashayer-gold font-black text-[11px] sm:text-xs cursor-pointer flex items-center justify-center gap-1 shadow-xs transition-transform active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{liveProd.type === 'floor-mat' ? (isAr ? 'تخصيص المقاس' : 'Customize') : (isAr ? 'تخصيص والطلب' : 'Customize & Order')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {/* SAUDI CONCIERGE EMPTY STATE (إذا لم يتم العثور على موديل محدد) */}
          {!productsLoading && fullFilteredProducts.length === 0 && (
            <div className="text-center py-12 px-4 alsaeedi-card rounded-3xl space-y-4 max-w-lg mx-auto my-6">
              <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-800 flex items-center justify-center mx-auto">
                <Car className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-black text-slate-900 text-base sm:text-lg">
                  {isAr ? 'لم تجد موديل سيارتك بالتحديد؟' : 'Can\'t find your exact car model?'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isAr 
                    ? 'نوفر تفصيل خاص فوري لأي سيارة وموديل بالمملكة خلال 48 ساعة فقط بنفس خامات الوكالة وضمان سنتين.' 
                    : 'We custom-tailor seat covers & 5D mats for all vehicle models in Saudi Arabia within 48 hours with a 2-year warranty.'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => handleResetFilter()}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  {isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
                </button>
                <button
                  onClick={() => openWhatsAppOrder(undefined, undefined, undefined, 'السلام عليكم، أود الاستفسار عن تفصيل خاص لسيارتي')}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <WhatsAppGlyph className="w-4 h-4" />
                  <span>{isAr ? 'طلب تفصيل خاص عبر الواتساب' : 'Custom Order via WhatsApp'}</span>
                </button>
              </div>
            </div>
          )}

          {catalogPageLimit < fullFilteredProducts.length && (
            <div className="pt-6 text-center">
              <button 
                onClick={() => setCatalogPageLimit(prev => prev + 24)}
                className="px-6 py-2.5 alsaeedi-anim-shimmer text-xs font-black cursor-pointer shadow rounded-full"
              >
                {isAr ? `عرض المزيد (${fullFilteredProducts.length - catalogPageLimit}متبقية)` : `Load More (${fullFilteredProducts.length - catalogPageLimit} left)`}
              </button>
            </div>
          )}
        </main>
      )}

      {/* ========================================================
          VIEW 3: DEDICATED MODERN WORKSHOP BOOKING & INQUIRIES PAGE
          (صفحة حجز الخدمات والاستفسارات الفاخرة لمتجر السعيدي)
          ======================================================== */}
      {viewMode === 'booking' && (
        <main id="booking-view-top" className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-8 animate-fadeIn">
          {/* Breadcrumb & Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <button
              type="button"
              onClick={() => {
                setViewMode('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-xs font-bold text-slate-800 flex items-center gap-1.5 hover:text-[#915f3c] cursor-pointer"
            >
              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{isAr ? 'العودة للرئيسية' : 'Back to Home'}</span>
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#faede4] text-[#915f3c] text-xs font-bold shadow-2xs">
              <Calendar className="w-3.5 h-3.5" />
              <span>{isAr ? 'حجز فوري ومباشر مع الورشة' : 'Direct VIP Workshop Booking'}</span>
            </div>
          </div>

          {/* Luxury Banner */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-10 shadow-lg">
            <div className="relative z-10 max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#faede4] text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#faede4]" />
                <span>{isAr ? 'مركز السعيدي الفاخر — مكة المكرمة' : 'Al-Saeedi VIP Center — Makkah'}</span>
              </span>
              <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                {isAr ? 'احجز موعد خدمة أو استفسر عن تفصيل سيارتك' : 'Book a Workshop Service or Request Custom Fitment'}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {isAr
                  ? 'خدمات التنجيد الملكي، تجديد الطبلون، عزل النوافذ وحماية PPF. اختر موعدك وسيتواصل معك الفني لتأكيد الحجز ومطابقة المقاس.'
                  : 'VIP leather upholstery, dashboard restoration, heat insulation & PPF. Select your preferred slot and our master technician will confirm your vehicle fitment.'}
              </p>
            </div>
          </div>

          {/* Live Interactive Booking Form Component */}
          <AlsaeediServicesBooking isAr={isAr} storeId={storeId} />

          {/* Quick VIP WhatsApp Support Box */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#faf7f4] border border-[#faede4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-emerald-600 text-white inline-flex items-center justify-center shrink-0 shadow-sm">
                <WhatsAppGlyph className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {isAr ? 'هل تحتاج استشارة سريعة قبل الحجز؟' : 'Need quick consultation before booking?'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr ? 'تواصل مباشرة مع المشرف الفني عبر واتساب' : 'Chat directly with our master technician on WhatsApp'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openWhatsAppOrder()}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <WhatsAppGlyph className="w-4 h-4" />
              <span>{isAr ? 'محادثة فورية عبر واتساب' : 'Direct WhatsApp Chat'}</span>
            </button>
          </div>
        </main>
      )}

      {/* ========================================================
          MODAL 1: MODERN ULTRA-LUXURY FLOOR MAT CUSTOMIZER MODAL
          (متجر السعيدي - أرضيات الدايموند، الليزر، الفاخر، المثلثات)
          ======================================================== */}
      <FloorMatLuxuryModal
        isOpen={!!selectedFloorMatModal}
        onClose={() => setSelectedFloorMatModal(null)}
        product={selectedFloorMatModal}
        isAr={isAr}
        onSelectProduct={(p) => setSelectedFloorMatModal(p)}
        onAddToCart={addFloorMatToCart}
        onDirectBuy={directBuyFloorMat}
      />

      {/* ========================================================
          MODAL 2: LUXURY AUTOMOTIVE BLOG READING MODAL
          ======================================================== */}
      {selectedBlogPost && (
        <AutomotiveBlogModal
          post={selectedBlogPost}
          isAr={isAr}
          onClose={() => setSelectedBlogPost(null)}
          onSelectProduct={(prod) => {
            setSelectedProduct(prod);
          }}
          onSelectBlogPost={(post) => setSelectedBlogPost(post)}
          openWhatsAppOrder={(customMsg) => openWhatsAppOrder(undefined, undefined, undefined, customMsg)}
        />
      )}

      {/* ========================================================
          MODAL 3: PRODUCT CUSTOMIZER & DETAIL MODAL (Saudi VIP Luxury)
          ======================================================== */}
      <SeatCoverLuxuryModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        isAr={isAr}
        defaultMake={formMake !== 'all' ? formMake : 'toyota'}
        defaultModel={formModel !== 'all' ? formModel : 'كامري'}
        defaultYear={formYear !== 'all' ? formYear : '2025'}
        onAddToCart={(prod, qty, col, mat, cov, pr, specs) => {
          addToCart(prod, qty, col, mat, cov, pr, specs);
          setCartDrawerOpen(true); // Open cart drawer immediately so customer sees their item!
        }}
        onDirectBuy={(prod, qty, col, mat, cov, pr, specs) => {
          addToCart(prod, qty, col, mat, cov, pr, specs);
          setCheckoutOpen(true); // Immediate checkout!
        }}
        onWhatsAppOrder={(prod, col, pr, customMsg) => {
          openWhatsAppOrder(prod, col, pr, customMsg);
        }}
      />

      {/* ========================================================
          MODAL 4: CART DRAWER
          ======================================================== */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-sm h-full flex flex-col justify-between shadow-2xl text-xs">
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#f6c344]" />
                <h4 className="font-black text-sm">{isAr ? `السلة (${cartCount})` : `Cart (${cartCount})`}</h4>
              </div>
              <button onClick={() => setCartDrawerOpen(false)} className="p-1 rounded-full bg-white/10 cursor-pointer">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
              {cart.length === 0 ? (
                <div className="py-16 text-center space-y-2 text-slate-400">
                  <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
                  <p>{isAr ? 'السلة فارغة' : 'Your cart is empty'}</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2.5">
                    <img src={item.selectedColor?.image || item.product.image} alt="cart item" className="w-12 h-12 rounded-lg object-contain" />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-slate-900 line-clamp-1">{isAr ? item.product.nameAr : item.product.nameEn}</h5>
                      <span className="text-[10px] text-slate-800 font-bold block">{item.selectedColor?.nameAr || 'مخصص'} · {item.unitPrice * item.quantity} {'⃁'}</span>
                      {item.specs && (
                        <div className="text-[9px] text-slate-500 space-y-0.5">
                          <span className="block truncate font-semibold text-slate-700">
                            {item.specs.brandNameAr} {item.specs.model} ({item.specs.year})
                            {item.specs.fuelTypeLabelAr ? ` · ${item.specs.fuelTypeLabelAr}` : ''}
                          </span>
                          <span className="block truncate text-[#b07e16] font-bold">
                            {item.specs.coverageLabelAr || (item.specs.seats === '7_seats' ? (isAr ? '٧ مقاعد' : '7 Seats') : (isAr ? '٥ مقاعد' : '5 Seats'))}
                            {item.specs.heelPad === 'metal_sport' ? ` + ${isAr ? 'كعبية حديد' : 'Heel pad'}` : ''}
                            {item.specs.doubleLayer ? ` + ${isAr ? 'سجاد شعر' : 'Carpet layer'}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQuantity(idx, item.quantity - 1)} className="p-1 rounded bg-white border border-slate-200 cursor-pointer">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-xs">{item.quantity}</span>
                      <button onClick={() => updateQuantity(idx, item.quantity + 1)} className="p-1 rounded bg-white border border-slate-200 cursor-pointer">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between font-black text-sm text-slate-900">
                  <span>{isAr ? 'الإجمالي:' : 'Total:'}</span>
                  <span className="text-slate-800">{cartTotal} {'⃁'}</span>
                </div>
                <button 
                  onClick={() => { setCartDrawerOpen(false); setCheckoutOpen(true); }}
                  className="w-full py-3 btn-bashayer-gold font-black text-xs cursor-pointer shadow"
                >
                  {isAr ? 'إتمام الطلب' : 'Checkout'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: FAST CHECKOUT MODAL
          ======================================================== */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200 text-xs">
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
              <h4 className="font-black text-sm">{isAr ? 'إتمام الطلب' : 'Checkout'}</h4>
              <button onClick={() => setCheckoutOpen(false)} className="p-1 rounded-full bg-white/10 cursor-pointer">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="max-h-[80vh] space-y-3 overflow-y-auto p-5">
              <div>
                <label className="mb-1 block font-bold text-slate-700">{isAr ? 'الاسم' : 'Name'}</label>
                <input
                  type="text"
                  required
                  value={checkoutForm.name}
                  onChange={(e) => setCheckoutForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-[#d5a027]/40"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">{isAr ? 'الجوال' : 'Phone'}</label>
                <input
                  type="tel"
                  required
                  value={checkoutForm.phone}
                  onChange={(e) => setCheckoutForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="05XXXXXXXX"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-[#d5a027]/40"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">{isAr ? 'المدينة' : 'City'}</label>
                <select
                  required
                  value={checkoutForm.city}
                  onChange={(e) => setCheckoutForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-[#d5a027]/40"
                >
                  {(isAr
                    ? ['مكة المكرمة', 'جدة', 'الرياض', 'الدمام', 'المدينة المنورة', 'الطائف', 'أبها', 'تبوك']
                    : ['Makkah', 'Jeddah', 'Riyadh', 'Dammam', 'Madinah', 'Taif', 'Abha', 'Tabuk']
                  ).map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">{isAr ? 'العنوان / الحي والشارع' : 'Address'}</label>
                <input
                  type="text"
                  required
                  value={checkoutForm.address}
                  onChange={(e) => setCheckoutForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-[#d5a027]/40"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">{isAr ? 'طريقة الدفع' : 'Payment'}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutForm((prev) => ({ ...prev, paymentMethod: 'cod' }))}
                    className={`rounded-xl border px-3 py-2 text-[11px] font-black cursor-pointer ${
                      checkoutForm.paymentMethod === 'cod'
                        ? 'border-slate-800 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {isAr ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutForm((prev) => ({ ...prev, paymentMethod: 'mada' }))}
                    className={`rounded-xl border px-3 py-2 text-[11px] font-black cursor-pointer ${
                      checkoutForm.paymentMethod === 'mada'
                        ? 'border-[#d5a027] bg-amber-50 text-amber-950'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {isAr ? 'مدى / تحويل' : 'Mada / Transfer'}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-700">{isAr ? 'رمز الكوبون' : 'Coupon code'}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponDiscount(0);
                      setCouponMessage(null);
                    }}
                    placeholder={isAr ? 'أدخل الرمز' : 'Enter code'}
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-[#d5a027]/40"
                  />
                  <button
                    type="button"
                    onClick={() => void applyCoupon()}
                    disabled={couponBusy}
                    aria-busy={couponBusy}
                    className="shrink-0 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-[11px] font-black text-white cursor-pointer disabled:opacity-60"
                  >
                    {couponBusy ? (isAr ? '...' : '...') : isAr ? 'تطبيق' : 'Apply'}
                  </button>
                </div>
                {couponMessage ? (
                  <p className={`mt-1 text-[10px] font-bold ${couponDiscount > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {couponMessage}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1 border-t border-slate-100 pt-2 text-sm font-black">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{isAr ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span>{cartTotal} ⃁</span>
                </div>
                {couponDiscount > 0 ? (
                  <div className="flex items-center justify-between text-xs text-emerald-700">
                    <span>{isAr ? 'خصم الكوبون' : 'Coupon discount'}</span>
                    <span>-{couponDiscount} ⃁</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{isAr ? 'الشحن' : 'Shipping'}</span>
                  <span>
                    {shippingBusy
                      ? '…'
                      : shippingFee <= 0
                        ? (shippingLabel || (isAr ? '—' : '—'))
                        : `${shippingFee} ⃁`}
                  </span>
                </div>
                {shippingLabel && shippingFee > 0 ? (
                  <p className="text-[10px] font-medium text-slate-400">{shippingLabel}</p>
                ) : null}
                <div className="flex items-center justify-between">
                  <span>{isAr ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-slate-900">{checkoutPayable} ⃁</span>
                </div>
              </div>

              {checkoutError ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">
                  {checkoutError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={checkoutBusy}
                aria-busy={checkoutBusy}
                className="w-full cursor-pointer py-3 text-xs font-black shadow btn-bashayer-gold disabled:opacity-60"
              >
                {checkoutBusy
                  ? (isAr ? 'جاري الإرسال...' : 'Submitting...')
                  : (isAr ? 'تأكيد وإرسال الطلب' : 'Confirm Order')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 6: ORDER COMPLETE MODAL
          ======================================================== */}
      {orderCompleteData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 text-center space-y-3 shadow-2xl text-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-black text-slate-900">{isAr ? 'تم استلام طلبك بنجاح!' : 'Order Received!'}</h4>
            <p className="text-slate-600 font-mono">{isAr ? 'رقم الطلب:' : 'Order ID:'} <strong className="text-slate-800">{orderCompleteData.orderNumber}</strong></p>
            <p className="text-slate-500">{isAr ? 'سيتواصل معك فريق خدمة العملاء لتأكيد المقاس وموعد الشحن.' : 'Our team will contact you to verify fitment and dispatch.'}</p>
            <button 
              onClick={() => setOrderCompleteData(null)}
              className="px-5 py-2 btn-bashayer-gold font-black cursor-pointer"
            >
              {isAr ? 'حسناً' : 'OK'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 7: SUPER ADVANCED VEHICLE MATCH POPUP ALERT
          ======================================================== */}
      <VehicleMatchAlertModal 
        isOpen={vehicleMatchModalOpen}
        onClose={() => setVehicleMatchModalOpen(false)}
        isAr={isAr}
        make={formMake}
        model={formModel}
        year={formYear}
        color={formColor}
        brandObj={CAR_BRANDS.find(b => b.nameEn.toLowerCase() === formMake.toLowerCase() || b.id === formMake)}
        colorObj={SEAT_COLORS.find(c => c.nameAr === formColor || c.nameEn.toLowerCase() === formColor.toLowerCase())}
        catalogProducts={storeCatalog}
        onSelectSeatCover={(prod, col) => {
          setSelectedProduct(prod);
          setDetailColor(col || null);
          setDetailQuantity(1);
        }}
        onSelectFloorMat={(prod) => {
          setSelectedFloorMatModal(prod);
        }}
        onViewInCatalog={() => {
          handleOpenCatalogFromFilter();
        }}
        onWhatsAppOrder={(prod, col, customMsg) => {
          openWhatsAppOrder(prod, col, undefined, customMsg);
        }}
        onSelectBrandQuickly={(brandSlug) => {
          setFormMake(brandSlug);
          setFormModel('all');
        }}
      />

      {/* ========================================================
          ADVANCE LUXURY FOOTER & FLOATING ACTIONS
          ======================================================== */}
      <AlsaeediLuxuryFooter
        isAr={isAr}
        storeDisplayName={storeDisplayName}
        onNavigateHome={() => {
          setViewMode('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateCatalog={() => {
          setViewMode('catalog');
          const el = document.getElementById('catalog-view-top');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setViewMode('catalog');
          const el = document.getElementById('catalog-view-top');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenBlog={(post) => setSelectedBlogPost(post)}
        onOpenFaq={() => {
          const el = document.getElementById('services-booking');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenReviews={() => {
          const el = document.getElementById('reviews-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="alsaeedi-mobile-bottom-nav lg:hidden flex items-stretch gap-0.5 px-1.5 pt-1.5 safe-area-inset-bottom">
        <button
          type="button"
          onClick={() => {
            setViewMode('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-[9px] font-bold cursor-pointer transition-colors ${
            viewMode === 'home' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Car className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{isAr ? 'الرئيسية' : 'Home'}</span>
        </button>

        <a
          href="#floor-mats-section"
          className="flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-[9px] font-bold text-slate-500 transition-colors hover:text-amber-600"
        >
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{isAr ? 'أرضيات' : 'Mats'}</span>
        </a>

        <a
          href="#vehicle-filter-bar"
          className="flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-[9px] font-bold text-slate-500 transition-colors hover:text-amber-600"
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{isAr ? 'سيارتك' : 'Fit'}</span>
        </a>

        <button
          type="button"
          onClick={() => openWhatsAppOrder()}
          className="flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-[9px] font-bold text-emerald-600 cursor-pointer hover:text-emerald-700"
        >
          <WhatsAppGlyph className="h-4 w-4 shrink-0" />
          <span>{isAr ? 'واتساب' : 'Chat'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCartDrawerOpen(true)}
          className="relative flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-[9px] font-bold text-slate-500 cursor-pointer hover:text-amber-600"
        >
          <span className="relative inline-flex">
            <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden="true" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -end-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-0.5 text-[8px] font-black text-white">
                {cartCount}
              </span>
            )}
          </span>
          <span>{isAr ? 'السلة' : 'Cart'}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsAccountModalOpen(true)}
          className={`flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-[9px] font-bold cursor-pointer transition-colors ${
            isAccountModalOpen ? 'text-amber-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{isAr ? 'حسابي' : 'Profile'}</span>
        </button>
      </nav>

      {/* 11. VIP CUSTOMER ACCOUNT & PROFILE CRM MODAL */}
      <CustomerAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        isAr={isAr}
        onApplyGarageVehicle={(brand, model, year) => {
          setFormMake(brand);
          setFormModel(model);
          setFormYear(year);
          setViewMode('catalog');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};
