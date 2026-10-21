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
  HelpCircle,
  BookOpen,
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
import { usePrefs } from '../../i18n/PrefsContext';
import { Product, CategoryItem } from '../../types';
import { 
  CAR_BRANDS, 
  CAR_MODELS_MAP, 
  CarModelDef,
  SEAT_COLORS, 
  FLOOR_MAT_COLORS,
  FloorMatColorOption,
  TOP_10_SEAT_COVERS,
  HOME_PAGE_PRODUCTS,
  FEATURED_HOME_SEATS, 
  FEATURED_FLOOR_MATS, 
  BLECO_STORE_PRODUCTS, 
  BLECO_CATEGORIES,
  BLECO_FAQ, 
  BLECO_BLOG_POSTS,
  BLECO_TESTIMONIALS, 
  BLECO_STORE_INFO, 
  CarBrandItem, 
  SeatColorOption,
  BlecoBlogPost,
  BlecoFaqItem,
  getProductColors
} from '../../data/blecoStoreData';
import { readAllThemeSettings } from '../settings/themeSettingsStore';
import { AlsaeediLuxuryFooter } from './components/AlsaeediLuxuryFooter';
import { FloorMatLuxuryModal, FloorMatCustomSpecs } from './components/FloorMatLuxuryModal';
import { SeatCoverLuxuryModal, SeatCoverCustomSpecs } from './components/SeatCoverLuxuryModal';
import { VehicleMatchAlertModal } from './components/VehicleMatchAlertModal';
import { CoreTwoCategoriesSection } from './components/CoreTwoCategoriesSection';
import { AutomotiveBlogSection } from './components/AutomotiveBlogSection';
import { AutomotiveBlogModal } from './components/AutomotiveBlogModal';
import { LuxuryVehicleCockpit } from './components/LuxuryVehicleCockpit';
import { AlsaeediLuxuryHero } from './components/AlsaeediLuxuryHero';
import { LuxuryToastSystem, ToastItem } from './components/LuxuryToastSystem';
import { PostCategoryAdvancedFeatures } from './components/PostCategoryAdvancedFeatures';
import { ModernLuxuryFloorMatsSection } from './components/ModernLuxuryFloorMatsSection';
import { ModernLuxurySeatCoversSection } from './components/ModernLuxurySeatCoversSection';
import { CustomerAccountModal } from './components/CustomerAccountModal';
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
  const { activeStore, addOrder, recordStoreVisit, currentProducts, addToCart: tenantAddToCart } = useTenant();
  const prefs = usePrefs();
  const locale = prefs?.locale;
  const setLocale = prefs?.setLocale;

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

  // Bilingual State (AR / EN)
  const [currentLang, setCurrentLang] = useState<'ar' | 'en'>(locale === 'en' ? 'en' : 'ar');
  const isAr = currentLang === 'ar';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'ar' ? 'en' : 'ar';
    setCurrentLang(nextLang);
    if (setLocale) setLocale(nextLang);
  };

  const recordedVisitRef = useRef(false);
  useEffect(() => {
    if (!recordedVisitRef.current) {
      recordedVisitRef.current = true;
      recordStoreVisit?.(storeId);
    }
  }, [storeId, recordStoreVisit]);

  useEffect(() => {
    try {
      document.title = isAr 
        ? 'متجر السعيدي لخدمات السيارات — تنجيد مكة | تلابيس مقاعد وأرضيات ليزر ودايموند'
        : 'Al-Saeedi Car Upholstery & Accessories Makkah | Custom Seat Covers & 5D Floor Mats';
    } catch {}
  }, [currentLang, isAr]);

  // View Mode: 'home' vs 'catalog'
  const [viewMode, setViewMode] = useState<'home' | 'catalog'>(() => {
    try {
      if (typeof window !== 'undefined') {
        const search = new URLSearchParams(window.location.search);
        const p = (search.get('page') || search.get('preview_page') || '').toLowerCase().trim();
        if (p === 'catalog' || p === 'products' || p === 'shop' || p === 'fleet') return 'catalog';
        const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
        if (pathname === '/catalog' || pathname === '/shop' || pathname === '/products') return 'catalog';
        const saved = sessionStorage.getItem('unityteck_transport_page');
        if (saved === 'catalog') return 'catalog';
      }
    } catch {}
    return 'home';
  });
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        const search = new URLSearchParams(window.location.search);
        const pId = search.get('product') || search.get('id');
        const p = (search.get('page') || search.get('preview_page') || '').toLowerCase().trim();
        if (pId || p === 'product' || p === 'product-detail' || p === 'detail') {
          const allProds = (currentProducts && currentProducts.length > 0 ? currentProducts : BLECO_STORE_PRODUCTS) as Product[];
          if (pId) {
            const found = allProds.find((prod) => prod.id === pId);
            if (found) return found;
          }
          return allProds[0] || null;
        }
        const savedId = sessionStorage.getItem('unityteck_transport_product_id');
        if (savedId) {
          const allProds = (currentProducts && currentProducts.length > 0 ? currentProducts : BLECO_STORE_PRODUCTS) as Product[];
          const found = allProds.find((prod) => prod.id === savedId);
          if (found) return found;
        }
      }
    } catch {}
    return null;
  });
  const [detailColor, setDetailColor] = useState<SeatColorOption | null>(null);
  const [detailMaterial, setDetailMaterial] = useState<'fabric' | 'leather' | 'diamond'>('leather');
  const [detailCoverage, setDetailCoverage] = useState<'full' | 'front_only'>('full');
  const [detailQuantity, setDetailQuantity] = useState(1);

  // Modern Luxury Floor Mat Customizer & Showcase Modal
  const [selectedFloorMatModal, setSelectedFloorMatModal] = useState<Product | null>(null);

  // Blog Post Reading Modal
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlecoBlogPost | null>(null);

  // Interactive Accordion State for 9 FAQs
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Dynamic Price for Customizer
  const computedDetailPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    let base = selectedProduct.discountedPrice || selectedProduct.price;
    if (detailMaterial === 'fabric') base = Math.max(390, base - 70);
    else if (detailMaterial === 'diamond') base += 120;
    if (detailCoverage === 'front_only') base -= 110;
    return Math.max(290, base);
  }, [selectedProduct, detailMaterial, detailCoverage]);

  // Cart State (Persisted in localStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('alsaeedi_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Checkout State
  const [checkoutOpen, setCheckoutOpen] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const search = new URLSearchParams(window.location.search);
        const p = (search.get('page') || search.get('preview_page') || '').toLowerCase().trim();
        if (p === 'checkout') return true;
        const pathname = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
        if (pathname === '/checkout') return true;
        const saved = sessionStorage.getItem('unityteck_transport_page');
        if (saved === 'checkout') return true;
      }
    } catch {}
    return false;
  });

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('alsaeedi_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

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
      const firstProd = (currentProducts && currentProducts.length > 0 ? currentProducts[0] : null) || BLECO_STORE_PRODUCTS[0];
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

  // Synchronize Saudia Transport theme state to URL and storage so refreshing preserves current page
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        let activePage = 'home';
        if (checkoutOpen) {
          activePage = 'checkout';
        } else if (selectedProduct) {
          activePage = 'product';
          url.searchParams.set('product', selectedProduct.id);
          sessionStorage.setItem('unityteck_transport_product_id', selectedProduct.id);
        } else if (viewMode === 'catalog') {
          activePage = 'catalog';
        }

        if (!selectedProduct) {
          url.searchParams.delete('product');
          sessionStorage.removeItem('unityteck_transport_product_id');
        }

        if (activePage === 'home') {
          url.searchParams.delete('page');
        } else {
          url.searchParams.set('page', activePage);
        }
        sessionStorage.setItem('unityteck_transport_page', activePage);
        window.history.replaceState({ page: activePage }, '', url.toString());
      }
    } catch {}
  }, [viewMode, checkoutOpen, selectedProduct]);

  // Ensure view is scrolled strictly to top header on any page change or refresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const t = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 50);
      return () => clearTimeout(t);
    }
  }, [viewMode, checkoutOpen, selectedProduct]);

  // Handle browser popstate navigation
  useEffect(() => {
    const handlePopState = () => {
      try {
        const search = new URLSearchParams(window.location.search);
        const p = (search.get('page') || search.get('preview_page') || '').toLowerCase().trim();
        if (p === 'catalog' || p === 'products' || p === 'shop') {
          setViewMode('catalog');
          setSelectedProduct(null);
          setCheckoutOpen(false);
          return;
        }
        if (p === 'checkout') {
          setCheckoutOpen(true);
          return;
        }
        if (p === 'home' || !p) {
          setViewMode('home');
          setSelectedProduct(null);
          setCheckoutOpen(false);
        }
      } catch {}
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
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
      title: isAr ? `تم تحديد ${brandName} (${modelEn})` : `Selected ${brandName} (${modelEn})`,
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

  // Checkout State
  const [orderCompleteData, setOrderCompleteData] = useState<{ orderNumber: string; total: number } | null>(null);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    city: 'مكة المكرمة',
    address: '',
    paymentMethod: 'cod',
    notes: '',
  });

  // Super Advanced Vehicle Match Popup Alert State
  const [vehicleMatchModalOpen, setVehicleMatchModalOpen] = useState(false);

  // Handle Search / Filter Form Submit -> Opens vehicle match modal directly without toast clutter
  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVehicleMatchModalOpen(true);
  };

  const handleOpenCatalogFromFilter = () => {
    setViewMode('catalog');

    let feedback = isAr ? 'نتائج مطابقة: ' : 'Matching Results: ';
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
    let source = currentProducts;
    try {
      if (typeof window !== 'undefined' && activeStore?.id) {
        const rawMap = localStorage.getItem('unityteck_products_map');
        if (rawMap) {
          const map = JSON.parse(rawMap);
          if (Array.isArray(map[activeStore.id]) && map[activeStore.id].length > 0) {
            source = map[activeStore.id];
          }
        }
      }
    } catch {}

    const isDefaultTransportStore = !activeStore?.id || activeStore.id === 'store-bleco' || activeStore.id === 'store-transport' || (activeStore as any)?.themeId === 'theme-saudia-transport';
    if (source && source.length > 0) {
      return source;
    }
    if (isDefaultTransportStore) {
      return BLECO_STORE_PRODUCTS;
    }
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

  const seatCoversCount = useMemo(() => {
    return storeCatalog.filter(p => p.type === 'seat-cover').length;
  }, [storeCatalog]);

  const floorMatsCount = useMemo(() => {
    return storeCatalog.filter(p => p.type === 'floor-mat').length;
  }, [storeCatalog]);

  const fullFilteredProducts = useMemo(() => {
    return storeCatalog.filter(product => {
      // 1. Category Tab Filter
      if (activeCategory) {
        if (activeCategory.id === 'cat-floors' && product.type !== 'floor-mat') return false;
        if (activeCategory.id === 'cat-clothing' && product.type !== 'seat-cover') return false;
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
        selectedMaterial: isAr ? 'جلد صناعي صديق للبيئة (11 مل - 5 طبقات SASO)' : 'Eco Synthetic Leather (11mm 5D SASO)',
        selectedCoverage: specs.coverageLabelAr || (specs.seats === '2_seats'
          ? (isAr ? 'مقعدين (غمارتين)' : '2 Seats (Pickup)')
          : specs.seats === '7_seats' 
            ? (isAr ? '٧ مقاعد (3 صفوف)' : '7 Seats (3 Rows)') 
            : (isAr ? '٥ مقاعد (صفين)' : '5 Seats (2 Rows)')),
        unitPrice: specs.unitPrice,
        specs
      }];
    });
    showToast(isAr ? `تمت إضافة أرضيات ${product.nameAr} لسلتك بنجاح!` : `Floor mats added to cart!`);
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
      text += `*السعر:* ${finalPrice} ر.س%0a`;
    } else if (cart.length > 0) {
      text += `*سلة المشتريات:*%0a`;
      cart.forEach((it, i) => {
        text += `${i + 1}. ${it.product.nameAr || it.product.name} (${it.selectedColor?.nameAr || 'بيج'} - ${it.selectedCoverage || ''}) x ${it.quantity}%0a`;
      });
      text += `*الإجمالي:* ${cartTotal} ر.س%0a`;
    } else {
      text += isAr ? `أريد تفصيل تلبيسة أو أرضيات لسيارتي` : `I want custom tailored seat covers or floor mats`;
    }

    window.open(`https://wa.me/${phoneNum.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  // Checkout Submission
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address) {
      alert(isAr ? 'يرجى تعبئة جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    const orderNumber = `#ALS-${Math.floor(1000 + Math.random() * 9000)}`;
    addOrder({
      customerName: checkoutForm.name,
      customerPhone: checkoutForm.phone,
      customerEmail: `${checkoutForm.phone.replace(/[^0-9]/g, '')}@tanjeedmakkah.sa`,
      deliveryLocation: `${checkoutForm.city} - ${checkoutForm.address}`,
      itemsCount: cartCount,
      items: cart.map(it => {
        const sp = it.specs as any;
        const carDetail = sp ? `[${sp.brandNameAr || sp.brand || ''} ${sp.model || ''} ${sp.year || ''} - ${sp.seatsLabelAr || it.selectedCoverage || ''} - ${it.selectedColor?.nameAr || ''}${sp.includeBundle ? ' + ملمع بلاكو' : ''}]` : `(${it.selectedColor?.nameAr || 'بيج'} - ${it.selectedCoverage || ''})`;
        return {
          id: it.product.id,
          sku: it.product.sku,
          name: `${it.product.nameAr || it.product.name} ${carDetail}`.trim(),
          price: it.unitPrice,
          quantity: it.quantity,
          total: it.unitPrice * it.quantity,
          image: it.selectedColor?.image || it.product.image
        };
      }),
      total: cartTotal,
      subtotal: cartTotal,
      status: 'pending',
      paymentMethod: checkoutForm.paymentMethod === 'cod' ? 'Cash on Delivery' : 'mada',
      paymentStatus: checkoutForm.paymentMethod === 'cod' ? 'Pending' : 'Paid',
      source: 'Car Store Online',
      customerNotes: checkoutForm.notes,
      time: new Date().toLocaleTimeString('ar-SA'),
    }, storeId);

    setOrderCompleteData({ orderNumber, total: cartTotal });
    setCart([]);
    setCheckoutOpen(false);
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
      <div className="alsaeedi-top-announce flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-3 sm:gap-5 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-[#f6c344] shrink-0" />
              <span>{isAr ? 'مكة المكرمة — بطحاء قريش' : 'Makkah Al-Mukarramah'}</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-slate-300">
              <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{isAr ? 'شحن سريع لجميع مناطق المملكة (3-5 أيام)' : 'Express 3-5 Day Delivery Across KSA'}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a 
              href={`https://wa.me/${BLECO_STORE_INFO.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank" 
              rel="noreferrer"
              className="text-[#f6c344] font-bold text-xs flex items-center gap-1 hover:underline"
            >
              <WhatsAppGlyph className="w-3.5 h-3.5" />
              <span dir="ltr">0597757086</span>
            </a>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[#f6c344] font-bold text-[11px] border border-[#d5a027]/40 cursor-pointer transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-[#f6c344]" />
              <span>{isAr ? 'English' : 'العربية'}</span>
              <span className="text-[9px] bg-[#d5a027] text-[#120224] px-1.5 py-0.2 rounded font-black">
                {isAr ? 'EN' : 'AR'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN MODERN LUXURY NAVBAR */}
      <header className="sticky top-0 z-50 bg-[#16032e]/95 text-white shadow-xl border-b border-[#d5a027]/30 backdrop-blur-md">
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
              <h1 className="text-[11px] sm:text-xs xl:text-[13px] font-extrabold text-white leading-snug flex items-center gap-1.5">
                <span className="truncate max-w-[145px] sm:max-w-[200px] xl:max-w-[240px]">
                  {storeDisplayName}
                </span>
                <span className="text-[8px] sm:text-[9px] bg-gradient-to-r from-[#d5a027] to-[#f6c344] text-[#120224] px-1.5 py-0.5 rounded font-black tracking-wider shadow-xs shrink-0 leading-none">
                  VIP
                </span>
              </h1>
              <p className="text-[9px] sm:text-[10px] text-[#f6c344]/90 font-medium hidden sm:block truncate max-w-[190px] xl:max-w-[240px] leading-tight">
                {isAr ? 'تنجيد وتلابيس مقاعد وأرضيات ليزر 5D' : 'Luxury Seat Covers & 5D Laser Mats'}
              </p>
            </div>
          </div>

          {/* Clean Desktop Nav Links + Categories Dropdown */}
          <nav className="hidden lg:flex items-center justify-center gap-3 xl:gap-5 text-[11px] xl:text-xs font-bold text-slate-200 whitespace-nowrap">
            <button 
              type="button"
              onClick={() => { setViewMode('home'); handleResetFilter(); }}
              className={`hover:text-[#f6c344] transition-colors cursor-pointer py-1 ${viewMode === 'home' ? 'text-[#f6c344]' : ''}`}
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
                  <div className="bg-[#16032e]/98 border border-[#d5a027]/40 rounded-2xl shadow-2xl p-2 backdrop-blur-xl space-y-1">
                    <a
                      href="#featured-seats-section"
                      onClick={() => { if (viewMode !== 'home') setViewMode('home'); setNavDropdownOpen(false); }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#d5a027]/15 border border-[#d5a027]/30 flex items-center justify-center text-[#f6c344] shrink-0 group-hover:bg-[#d5a027] group-hover:text-[#120224] transition-colors">
                        <Palette className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white group-hover:text-[#f6c344] transition-colors">
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
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#d5a027]/15 border border-[#d5a027]/30 flex items-center justify-center text-[#f6c344] shrink-0 group-hover:bg-[#d5a027] group-hover:text-[#120224] transition-colors">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white group-hover:text-[#f6c344] transition-colors">
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
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#d5a027]/15 border border-[#d5a027]/30 flex items-center justify-center text-[#f6c344] shrink-0 group-hover:bg-[#d5a027] group-hover:text-[#120224] transition-colors">
                        <Car className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white group-hover:text-[#f6c344] transition-colors">
                          {isAr ? 'ماركات السيارات' : 'Car Brands'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {isAr ? 'أكثر من 400+ موديل سيارة' : '400+ Supported Vehicle Models'}
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
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-[#d5a027]/20 to-[#f6c344]/10 hover:from-[#d5a027] hover:to-[#f6c344] text-[#f6c344] hover:text-[#120224] text-[11px] font-black transition-all cursor-pointer"
                      >
                        <span>{isAr ? 'تصفح جميع المنتجات' : 'Browse Full Catalog'}</span>
                        {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <a href="#featured-seats-section" className="hover:text-[#f6c344] transition-colors py-1">
              {isAr ? 'تلابيس المقاعد' : 'Seat Covers'}
            </a>
            <a href="#floor-mats-section" className="hover:text-[#f6c344] transition-colors py-1">
              {isAr ? 'أرضيات 5D' : '5D Mats'}
            </a>
            <a href="#brands-section" className="hover:text-[#f6c344] transition-colors py-1">
              {isAr ? 'الماركات' : 'Car Brands'}
            </a>
            <a href="#faq-section" className="hover:text-[#f6c344] transition-colors py-1">
              {isAr ? 'الأسئلة' : 'FAQ'}
            </a>
            <button
              type="button"
              onClick={() => {
                if (viewMode !== 'home') setViewMode('home');
                setTimeout(() => {
                  const el = document.getElementById('blog-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 80);
              }}
              className="hover:text-[#f6c344] transition-colors cursor-pointer py-1"
            >
              {isAr ? 'المدونة' : 'Blog'}
            </button>
            <a href="#reviews-section" className="hover:text-[#f6c344] transition-colors py-1">
              {isAr ? 'التقييمات' : 'Reviews'}
            </a>
          </nav>

          {/* Right Action Icons: Search Icon, WhatsApp Icon, Cart & Mobile Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Search Toggle Icon Button */}
            <button
              type="button"
              onClick={() => setSearchBarOpen(prev => !prev)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border shrink-0 ${
                searchBarOpen
                  ? 'bg-[#d5a027] text-[#120224] border-[#f6c344] shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white hover:text-[#f6c344] border-white/15'
              }`}
              title={isAr ? 'بحث عن سيارة أو موديل' : 'Search car model'}
              aria-label={isAr ? 'بحث' : 'Search'}
            >
              {searchBarOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>

            {/* User Account / Profile Circular Icon Button */}
            <button
              type="button"
              onClick={() => setIsAccountModalOpen(true)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-[#f6c344] border border-white/15 flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0"
              title={isAr ? 'حسابي والطلبات (VIP Portal)' : 'My Account & Orders'}
              aria-label={isAr ? 'حسابي' : 'My Account'}
            >
              <User className="w-4 h-4" />
            </button>

            {/* WhatsApp Circular Icon Button */}
            <button 
              type="button"
              onClick={() => openWhatsAppOrder()}
              className="w-9 h-9 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center transition-all shadow-md hover:scale-105 cursor-pointer shrink-0"
              title={isAr ? 'تواصل عبر واتساب' : 'WhatsApp Order'}
              aria-label="WhatsApp"
            >
              <WhatsAppGlyph className="w-4 h-4" />
            </button>

            {/* Cart Button */}
            <button 
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              className="relative h-9 px-3 btn-bashayer-gold text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer shrink-0"
              title={isAr ? 'سلة المشتريات' : 'Shopping Cart'}
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{isAr ? 'السلة' : 'Cart'}</span>
              {cartCount > 0 && (
                <span className="bg-red-600 text-white text-[10px] w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center font-black animate-scaleIn">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-[#f6c344] lg:hidden flex items-center justify-center cursor-pointer transition-all border border-white/15 shrink-0"
              aria-label={isAr ? 'فتح القائمة' : 'Open Menu'}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Search Dropdown Bar */}
        {searchBarOpen && (
          <div className="border-t border-[#d5a027]/25 bg-[#120224]/98 backdrop-blur-xl px-3 sm:px-6 py-2.5 animate-fadeIn">
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
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#ffffff' }}
                  className="w-full !bg-white/10 !text-white placeholder-slate-400 text-xs rounded-full pl-9 pr-9 py-2 focus:outline-none focus:ring-2 focus:ring-[#d5a027] transition-all border border-[#d5a027]/40"
                />
                <Search className={`w-3.5 h-3.5 text-[#f6c344] absolute ${isAr ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 pointer-events-none`} />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className={`absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer`}
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

          <div className={`relative w-[85%] max-w-sm h-full bg-[#16032e] text-white z-10 flex flex-col justify-between shadow-2xl border-l border-r border-[#d5a027]/30 ${
            isAr ? 'mr-auto animate-drawer-rtl' : 'ml-auto animate-drawer-ltr'
          }`}>
            <div className="p-5 space-y-5 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <img src={BLECO_STORE_INFO.logo} alt="Logo" className="h-8 w-auto object-contain" />
                  <div>
                    <h3 className="text-sm font-black text-white">{storeDisplayName}</h3>
                    <span className="text-[10px] text-[#f6c344] font-bold">VIP Studio · Makkah</span>
                  </div>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
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
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-[#d5a027]/30 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Globe className="w-4 h-4 text-[#f6c344]" />
                  <span>{isAr ? 'اللغة الحالية: العربية' : 'Current Language: English'}</span>
                </div>
                <span className="text-[10px] bg-gradient-to-r from-[#d5a027] to-[#f6c344] text-[#120224] px-2.5 py-0.5 rounded-full font-black">
                  {isAr ? 'Switch to English' : 'التحويل للعربية'}
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
                  className="w-full bg-white/10 text-white placeholder-slate-400 text-xs rounded-xl pl-9 pr-9 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#d5a027] border border-white/15"
                />
                <Search className={`w-4 h-4 text-slate-400 absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 pointer-events-none`} />
              </div>

              {/* Navigation Links with Icons */}
              <nav className="space-y-1 text-xs font-bold text-slate-200">
                <button
                  onClick={() => {
                    setViewMode('home');
                    handleResetFilter();
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-left rtl:text-right"
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
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-left rtl:text-right text-[#f6c344]"
                >
                  <User className="w-4 h-4 text-[#f6c344]" />
                  <span>{isAr ? 'حسابي والطلبات (VIP Portal)' : 'My Account & Orders'}</span>
                </button>

                <a
                  href="#brands-section"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <Car className="w-4 h-4 text-[#f6c344]" />
                  <span>{isAr ? 'ماركات السيارات (400+ موديل)' : 'Car Brands (400+ Models)'}</span>
                </a>

                <a
                  href="#floor-mats-section"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-[#f6c344]" />
                  <span>{isAr ? 'أرضيات 5D ليزر دقيقة' : '5D Precision Floor Mats'}</span>
                </a>

                <a
                  href="#featured-seats-section"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <Palette className="w-4 h-4 text-[#f6c344]" />
                  <span>{isAr ? 'تلابيس مقاعد ملكية تفصيل' : 'VIP Custom Seat Covers'}</span>
                </a>

                <a
                  href="#guarantees-section"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-[#f6c344]" />
                  <span>{isAr ? 'الضمان الذهبي والشحن' : 'VIP Warranty & Shipping'}</span>
                </a>

                <a
                  href="#faq-section"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-[#f6c344]" />
                  <span>{isAr ? 'الأسئلة الشائعة (FAQ)' : 'FAQ & Fitting Assurance'}</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (viewMode !== 'home') setViewMode('home');
                    setTimeout(() => {
                      const el = document.getElementById('blog-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 80);
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors w-full text-start cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-[#f6c344]" />
                  <span>{isAr ? 'مدونة عناية السيارات' : 'Car Upholstery Care Blog'}</span>
                </button>

                <a
                  href="#reviews-section"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <Star className="w-4 h-4 text-[#f6c344]" />
                  <span>{isAr ? 'آراء وتجارب العملاء' : 'Customer Reviews (4.9/5)'}</span>
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
              const defaultMat = FEATURED_FLOOR_MATS[0];
              if (defaultMat) setSelectedFloorMatModal(defaultMat);
            }}
            onToggleLang={toggleLanguage}
          />

          {/* MAIN PAGE BODY */}
          <main className="max-w-7xl mx-auto px-4 py-12 space-y-16">

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
                ADVANCED UI/UX FEATURES AFTER CATEGORIES
                (استوديو التخصيص الملكي + مختبر المقاسات الليزرية وأمان الإيرباق)
                ======================================================== */}
            <PostCategoryAdvancedFeatures 
              isAr={isAr}
              isAdmin={isAdmin}
              storeId={storeId}
              onOpenVehicleModal={(make, model) => {
                if (make) setFormMake(make.toLowerCase());
                if (model) setFormModel(model);
                setVehicleMatchModalOpen(true);
              }}
              onAddToCart={(prod, col) => addToCart(prod, 1, col)}
              onWhatsAppOrder={(prod, col, customText) => {
                if (prod) openWhatsAppOrder(prod, col, undefined, customText);
                else {
                  const phoneNum = themeSettings?.identity?.whatsapp || BLECO_STORE_INFO.whatsapp;
                  const url = `https://wa.me/${phoneNum.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(customText || 'مرحباً، أود تفصيل مقاعد أو أرضيات لسيارتي')}`;
                  window.open(url, '_blank');
                }
              }}
              onTriggerToast={(toast) => addToast(toast)}
            />

            {/* ========================================================
                SECTION 2: BROWSE BY CAR TYPE (تصفح حسب نوع السيارة - VIP LUXURY)
                ======================================================== */}
            <section 
              id="brands-section" 
              className="relative rounded-3xl bg-white p-4 sm:p-6 lg:p-7 border border-[#ede8f5] shadow-[0_10px_35px_-10px_rgba(62,15,119,0.07)] overflow-hidden space-y-5"
            >
              {/* Luxury Top Accent Line */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#d5a027]/70 to-transparent" />
              
              {/* Ambient Glows */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-radial from-[#d5a027]/12 to-transparent rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-radial from-[#3e0f77]/08 to-transparent rounded-full blur-3xl pointer-events-none" />

              {/* Section Header */}
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-purple-50 to-amber-50/80 border border-[#d5a027]/30 text-[#3e0f77]">
                    <Sparkles className="w-3.5 h-3.5 text-[#d5a027]" />
                    <span>{isAr ? 'وكالات وماركات معتمدة · تفصيل ومقاسات ليزرية' : 'OFFICIAL OEM BRANDS · LASER-PRECISION FIT'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#3e0f77] via-[#25074d] to-[#0d011c] text-[#f6c344] flex items-center justify-center shadow-md border border-[#d5a027]/30 shrink-0">
                      <Car className="w-5 h-5 drop-shadow" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <span>{isAr ? 'تصفح حسب ماركة سيارتك' : 'Browse by Car Brand'}</span>
                      </h3>
                      <p className="text-xs sm:text-[13px] text-slate-500 font-medium mt-0.5">
                        {isAr ? 'اضغط على أي ماركة لاكتشاف الموديلات والتلابيس الملكية والفرش المخصص' : 'Click any brand to explore models, bespoke seat covers & laser floor mats'}
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
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-50/70 border border-purple-200/50 text-xs font-bold text-[#3e0f77]">
                      <Award className="w-3.5 h-3.5 text-[#d5a027]" />
                      <span>{isAr ? '14 ماركة كبرى · 400+ موديل' : '14 Major Brands · 400+ Models'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Brands Grid with Luxury Circular Emblem Podium */}
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-3.5">
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
                      className={`alsaeedi-brand-card p-3 sm:p-3.5 flex flex-col items-center justify-center text-center cursor-pointer group ${
                        isSelected ? 'active' : ''
                      }`}
                    >
                      {/* Active indicator checkmark */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-gradient-to-r from-[#d5a027] to-[#f6c344] text-[#16032e] flex items-center justify-center shadow-xs z-10 animate-fadeIn">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Circular Emblem Shape */}
                      <div className="alsaeedi-brand-emblem my-1">
                        <img 
                          src={brand.logo} 
                          alt={isAr ? brand.nameAr : brand.nameEn} 
                          className="h-8 max-w-[46px] w-auto object-contain filter group-hover:scale-110 transition-transform duration-300 drop-shadow-xs"
                          loading="lazy" decoding="async"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div 
                          style={{ display: 'none' }}
                          className="w-9 h-9 rounded-full bg-purple-50 text-[#3e0f77] font-black text-xs items-center justify-center border border-purple-200"
                        >
                          {brand.nameEn.slice(0, 2).toUpperCase()}
                        </div>
                      </div>

                      {/* Brand Title */}
                      <span className="text-xs sm:text-[13px] font-black mt-2 text-slate-800 group-hover:text-[#3e0f77] transition-colors line-clamp-1 tracking-tight">
                        {isAr ? brand.nameAr : brand.nameEn}
                      </span>

                      {/* Models count tag */}
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#d5a027] transition-colors mt-0.5">
                        {modelsCount > 0 ? (isAr ? `${modelsCount} موديل` : `${modelsCount} models`) : (isAr ? 'متعدد' : 'All')}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Models Chips if Brand Selected - Luxury VIP Model Picker */}
              {activeBrand && (
                <div className="relative z-10 p-4 sm:p-5 bg-gradient-to-r from-purple-50/90 via-white to-amber-50/40 border-1.5 border-[#d5a027]/40 rounded-2xl shadow-sm space-y-3 animate-fadeIn">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100/80 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 p-1 flex items-center justify-center shadow-2xs">
                        <img 
                          src={activeBrand.logo} 
                          alt={activeBrand.nameEn} 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-black text-[#3e0f77]">
                          {isAr ? `موديلات ${activeBrand.nameAr} المتوافقة:` : `${activeBrand.nameEn} Compatible Models:`}
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
                      className="text-xs font-bold text-[#3e0f77] hover:text-[#d5a027] transition-colors cursor-pointer"
                    >
                      {isAr ? `عرض كل منتجات ${activeBrand.nameAr}` : `View all ${activeBrand.nameEn}`}
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
                              ? 'bg-gradient-to-r from-[#3e0f77] to-[#25074d] text-white border-[#d5a027] ring-2 ring-[#d5a027]/30 shadow-md'
                              : 'bg-white hover:bg-purple-50 text-slate-800 border-slate-200 hover:border-[#d5a027]/60'
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

            {/* ========================================================
                SECTION 3: CAR FLOOR MATS (أرضيات 5D ليزر فائقة الدقة والرفاهية)
                ======================================================== */}
            {(() => {
              const matsFromStore = currentProducts?.filter(p =>
                p.type === 'floor-mat' ||
                p.category?.includes('أرضيات') ||
                p.categoryAr?.includes('أرضيات') ||
                p.categoryEn?.toLowerCase().includes('mat') ||
                p.tags?.some(t => t.includes('mat') || t.includes('أرضيات'))
              ) || [];
              const existingIds = new Set(matsFromStore.map(m => m.id));
              const restMats = FEATURED_FLOOR_MATS.filter(f => !existingIds.has(f.id));
              const displayMats = [...matsFromStore, ...restMats].slice(0, 10);

              return (
                <ModernLuxuryFloorMatsSection
                  isAr={isAr}
                  mats={displayMats}
                  onSelectMat={(mat) => setSelectedFloorMatModal(mat)}
                  onOpenWhatsApp={(mat, selectedColorName) => {
                    const customMsg = isAr
                      ? `مرحباً متجر السعيدي، أرغب بالطلب والاستفسار عن أرضيات 5D ليزر:\n*النوع:* ${mat.nameAr || mat.name}\n${selectedColorName ? `*اللون المفضل:* ${selectedColorName}\n` : ''}*السعر:* ${mat.price} ر.س\n*المطلوب:* تفصيل ليزري لموديل سيارتي.`
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
              );
            })()}

            {/* ========================================================
                SECTION 4: CAR SEAT COVERS (تلابيس مقاعد ملكية تفصيل وكالة ليزري)
                ======================================================== */}
            {(() => {
              const seatsFromStore = currentProducts?.filter(p => 
                p.type === 'seat-cover' || 
                p.category?.includes('تلابيس') || 
                p.categoryAr?.includes('تلابيس') ||
                p.categoryEn?.toLowerCase().includes('seat') ||
                p.tags?.some(t => t.includes('seat') || t.includes('تلبيس'))
              ) || [];
              const existingIds = new Set(seatsFromStore.map(s => s.id));
              const restSeats = FEATURED_HOME_SEATS.filter(f => !existingIds.has(f.id));
              const displaySeats = [...seatsFromStore, ...restSeats].slice(0, 10);

              return (
                <ModernLuxurySeatCoversSection
                  isAr={isAr}
                  seats={displaySeats}
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
                SECTION 5: FREQUENTLY ASKED QUESTIONS (01 TO 09)
                ======================================================== */}
            <section id="faq-section" className="space-y-6">
              <div className="text-center space-y-1.5 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#16032e] text-xs font-bold">
                  <HelpCircle className="w-3.5 h-3.5 text-[#16032e]" />
                  <span>{isAr ? 'إجابات واضحة لجميع استفساراتك' : 'Fitment & Order Assurance'}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {isAr ? 'الأسئلة الشائعة وضمان التركيب' : 'Frequently Asked Questions & Fitment Assurance'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr 
                    ? 'تعرف على معايير الأمان، الضمان الذهبي، وخدمات التوصيل والتقسيط في متجر السعيدي' 
                    : 'Everything you need to know about safety, warranty, installments, and shipping'}
                </p>
              </div>

              {/* Numbered FAQ Accordion 01 to 09 */}
              <div className="max-w-4xl mx-auto space-y-3">
                {BLECO_FAQ.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  const questionText = isAr ? (faq.qAr || faq.question) : (faq.qEn || faq.questionEn);
                  const answerText = isAr ? (faq.aAr || faq.answer) : (faq.aEn || faq.answerEn);
                  return (
                    <div 
                      key={idx}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isOpen 
                          ? 'bg-white border-[#16032e] shadow-md ring-1 ring-[#16032e]/10' 
                          : 'bg-white/80 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-start cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5">
                          <span className={`w-8 h-8 rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 transition-colors ${
                            isOpen ? 'bg-[#16032e] text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {faq.number}
                          </span>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                            {questionText}
                          </h4>
                        </div>
                        <div className={`p-1 rounded-full shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#16032e]' : 'text-slate-400'}`}>
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100/80 animate-fadeIn">
                          <p>{answerText}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SECTION 7: BLOG */}
            <AutomotiveBlogSection
              isAr={isAr}
              onSelectPost={(post) => setSelectedBlogPost(post)}
              openWhatsAppOrder={(customMsg) => openWhatsAppOrder(undefined, undefined, undefined, customMsg)}
            />

            {/* ========================================================
                SECTION 8: VERIFIED CUSTOMER REVIEWS (6 REAL REVIEWS)
                ======================================================== */}
            <section id="reviews-section" className="space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {isAr ? 'تجارب عملاء النخبة بالمملكة · تقييم 4.9/5' : 'Verified VIP Customer Reviews across KSA · 4.9/5 Rating'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr ? 'تقييمات موثقة لعملاء قاموا بتركيب التلابيس والأرضيات بمكة والرياض وجدة والشرقية مع ضمان سنتين' : 'Verified customer ratings across Saudi Arabia with 100% factory match guarantee'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {BLECO_TESTIMONIALS.map((rev, idx) => (
                  <div key={idx} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img src={rev.avatar} alt="User" className="w-9 h-9 rounded-full object-cover border border-slate-100" />
                        <div>
                          <h5 className="font-bold text-xs text-slate-900">{isAr ? rev.name : rev.nameEn}</h5>
                          <span className="text-[10px] text-slate-400">{isAr ? rev.city : rev.cityEn} · {isAr ? rev.car : rev.carEn}</span>
                        </div>
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "{isAr ? (rev.comment || (rev as any).text) : (rev.commentEn || (rev as any).textEn)}"
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isAr ? 'شراء مؤكد ومطابق للمقاس' : 'Verified Purchase'}</span>
                    </div>
                  </div>
                ))}
              </div>
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
              className="text-xs font-bold text-[#3e0f77] flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{isAr ? 'العودة للرئيسية' : 'Back to Home'}</span>
            </button>

            <span className="text-xs text-slate-500 font-mono">
              {isAr ? `وجدنا ${fullFilteredProducts.length} منتج متوافق` : `Found ${fullFilteredProducts.length} matching products`}
            </span>
          </div>

          {/* 2 CORE CATEGORIES SELECTOR TABS (seats cover or mats bs overall) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs ${
                activeCategory === null
                  ? 'bg-[#3e0f77] text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-[#3e0f77]'
              }`}
            >
              <span>{isAr ? 'الكل (جميع المنتجات)' : 'All Products'}</span>
              <span className="text-[10px] opacity-80">({storeCatalog.length})</span>
            </button>

            <button
              onClick={() => setActiveCategory(BLECO_CATEGORIES[0])}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs ${
                activeCategory?.id === 'cat-clothing'
                  ? 'bg-[#3e0f77] text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-[#3e0f77]'
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
                  ? 'bg-[#d5a027] text-[#1c0537] font-black shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-[#d5a027]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'أرضيات ودعاسات 5D' : '5D Floor Mats'}</span>
              <span className="text-[10px] opacity-80">({floorMatsCount})</span>
            </button>
          </div>

          {/* SAUDI TRUST & SPECIFICATIONS STRIP (حسب متطلبات السوق السعودي) */}
          <div className="bg-gradient-to-r from-purple-900 via-[#1c0537] to-[#16032e] text-white p-3 sm:p-3.5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-2.5 text-[11px] font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isAr ? '🇸🇦 مطابق لمقاس الوكالة السعودية 100%' : '🇸🇦 100% Saudi Agency Fit Guaranteed'}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-amber-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'ضمان ذهبي سنتين ضد التقشير والبهتان' : '2-Year Full Color & Peel Warranty'}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-300">
              <Truck className="w-3.5 h-3.5" />
              <span>{isAr ? 'شحن سريع لجميع مدن المملكة' : 'Fast Delivery across all KSA cities'}</span>
            </div>
            <div className="hidden md:flex items-center gap-1 text-purple-200">
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isAr ? 'تقسيط مريح 4 دفعات (تمارا · تابي)' : '4 Installments with Tamara & Tabby'}</span>
            </div>
          </div>

          {/* ========================================================
              ADVANCE AUTOMOTIVE FILTER SUITE (فلتر متقدم للماركات والموديلات والألوان)
              ======================================================== */}
          <div className="space-y-4">
            {/* 1. Quick Brand Pills with Logos (10 Companies) */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-[#3e0f77]" />
                  <span>{isAr ? 'اختر ماركة سيارتك (10 شركات كبرى):' : 'Select Car Brand (10 Major Companies):'}</span>
                </span>
                {formMake !== 'all' && (
                  <button
                    onClick={() => { setFormMake('all'); setFormModel('all'); }}
                    className="text-[11px] font-bold text-[#3e0f77] hover:underline cursor-pointer"
                  >
                    {isAr ? 'عرض كل الماركات' : 'All Brands'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x touch-pan-x -mx-1 px-1">
                <button
                  onClick={() => { setFormMake('all'); setFormModel('all'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 snap-start ${
                    formMake === 'all'
                      ? 'bg-[#3e0f77] text-white shadow-md'
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
                          ? 'bg-purple-50 border-[#3e0f77] text-[#3e0f77] ring-2 ring-[#3e0f77]/30 shadow-sm'
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
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                {/* Model dropdown */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{isAr ? 'موديل السيارة:' : 'Vehicle Model:'}</label>
                  <select 
                    value={formModel} 
                    onChange={e => setFormModel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold cursor-pointer text-xs focus:ring-2 focus:ring-[#3e0f77] focus:outline-none"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold cursor-pointer text-xs focus:ring-2 focus:ring-[#3e0f77] focus:outline-none"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold cursor-pointer text-xs focus:ring-2 focus:ring-[#3e0f77] focus:outline-none"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold cursor-pointer text-xs focus:ring-2 focus:ring-[#3e0f77] focus:outline-none"
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
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-8 pl-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3e0f77]"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* 3. Interactive Color Swatches Row */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#3e0f77]" />
                    <span>{isAr ? 'فلترة حسب اللون:' : 'Filter by Color:'}</span>
                  </span>
                  
                  <button
                    onClick={() => setFormColor('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                      formColor === 'all'
                        ? 'bg-[#3e0f77] text-white shadow-xs'
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
                              ? 'border-[#3e0f77] bg-purple-50 ring-2 ring-[#3e0f77]/30 scale-105 shadow-xs'
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
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#3e0f77] text-[10px] font-bold flex items-center gap-1">
                      <span>{formMake.toUpperCase()}</span>
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFormMake('all')} />
                    </span>
                  )}
                  {formModel !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#3e0f77] text-[10px] font-bold flex items-center gap-1">
                      <span>{formModel}</span>
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFormModel('all')} />
                    </span>
                  )}
                  {formColor !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#3e0f77] text-[10px] font-bold flex items-center gap-1">
                      <span>{formColor}</span>
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFormColor('all')} />
                    </span>
                  )}
                  {catalogMaterialFilter !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#3e0f77] text-[10px] font-bold flex items-center gap-1">
                      <span>{catalogMaterialFilter === 'leather' ? (isAr ? 'جلد فاخر' : 'Leather') : (isAr ? 'قماش أصلي' : 'Fabric')}</span>
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setCatalogMaterialFilter('all')} />
                    </span>
                  )}
                  {formYear !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#3e0f77] text-[10px] font-bold flex items-center gap-1">
                      <span>{formYear}</span>
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFormYear('all')} />
                    </span>
                  )}
                  {searchQuery && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#3e0f77] text-[10px] font-bold flex items-center gap-1">
                      <span>"{searchQuery}"</span>
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Full Grid (2 columns on mobile, 4 columns on desktop) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
            {fullFilteredProducts.slice(0, catalogPageLimit).map(prod => {
              const liveProd = currentProducts?.find(p => p.id === prod.id) || prod;
              const prodColors = getProductColors(liveProd).slice(0, 3);
              const userColor = cardSelectedColors[liveProd.id];
              const activeColor = userColor || prodColors[0];
              const cardImg = (liveProd.type === 'seat-cover') ? (userColor?.image || activeColor?.image || liveProd.image) : liveProd.image;
              const finalPrice = liveProd.discountedPrice || liveProd.price;
              const originalPrice = liveProd.originalPrice || Math.round(finalPrice * 1.18);
              const monthlyTabby = Math.round(finalPrice / 4);

              return (
                <div key={liveProd.id} className="alsaeedi-product-card group relative flex flex-col justify-between border border-slate-200/90 hover:border-[#d5a027] hover:shadow-xl transition-all duration-300 rounded-xl sm:rounded-2xl md:rounded-3xl bg-white overflow-hidden">
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
                    <img src={cardImg} alt={liveProd.name} className="w-full h-full object-cover img-zoom transition-all duration-500" loading="lazy" decoding="async" />
                    
                    {/* Brand Pill */}
                    <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 bg-[#16032e]/90 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20 shadow-xs">
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
                        className="font-bold text-slate-900 line-clamp-2 hover:text-[#3e0f77] cursor-pointer text-xs sm:text-sm leading-snug"
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
                        {isAr ? `4 دفعات x ${monthlyTabby} ر.س` : `4x ${monthlyTabby} SAR`}
                      </span>
                      <span className="text-[#3e0f77] font-black shrink-0">{isAr ? 'تابي · تمارا' : 'Tabby'}</span>
                    </div>

                    {/* Price and CTA */}
                    <div className="pt-1.5 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="font-black text-sm sm:text-base text-slate-900">{finalPrice}</span>
                          <span className="text-[10px] font-bold text-[#b07e16] mr-0.5 ml-0.5">{isAr ? 'ر.س' : 'SAR'}</span>
                        </div>
                        {originalPrice > finalPrice && (
                          <span className="text-[10px] text-slate-400 line-through">
                            {originalPrice} {isAr ? 'ر.س' : 'SAR'}
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

          {/* SAUDI CONCIERGE EMPTY STATE (إذا لم يتم العثور على موديل محدد) */}
          {fullFilteredProducts.length === 0 && (
            <div className="text-center py-12 px-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4 max-w-lg mx-auto my-6">
              <div className="w-16 h-16 rounded-full bg-purple-50 text-[#3e0f77] flex items-center justify-center mx-auto">
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
                className="px-6 py-2.5 btn-bashayer-purple text-xs font-black cursor-pointer shadow"
              >
                {isAr ? `عرض المزيد (${fullFilteredProducts.length - catalogPageLimit} متبقية)` : `Load More (${fullFilteredProducts.length - catalogPageLimit} left)`}
              </button>
            </div>
          )}
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
            <div className="p-4 bg-[#3e0f77] text-white flex items-center justify-between">
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
                    <img src={item.selectedColor?.image || item.product.image} alt="cart item" className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-slate-900 line-clamp-1">{isAr ? item.product.nameAr : item.product.nameEn}</h5>
                      <span className="text-[10px] text-[#3e0f77] font-bold block">{item.selectedColor?.nameAr || 'مخصص'} · {item.unitPrice * item.quantity} {isAr ? 'ر.س' : 'SAR'}</span>
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
                  <span className="text-[#3e0f77]">{cartTotal} {isAr ? 'ر.س' : 'SAR'}</span>
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
            <div className="p-4 bg-[#3e0f77] text-white flex items-center justify-between">
              <h4 className="font-black text-sm">{isAr ? 'إتمام الطلب' : 'Checkout'}</h4>
              <button onClick={() => setCheckoutOpen(false)} className="p-1 rounded-full bg-white/10 cursor-pointer">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">{isAr ? 'الاسم:' : 'Name:'}</label>
                <input 
                  type="text" 
                  required
                  value={checkoutForm.name}
                  onChange={e => setCheckoutForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">{isAr ? 'الجوال (واتساب):' : 'Phone:'}</label>
                <input 
                  type="tel" 
                  required
                  value={checkoutForm.phone}
                  onChange={e => setCheckoutForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="05XXXXXXXX"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">{isAr ? 'العنوان / الحي والشارع:' : 'Address:'}</label>
                <input 
                  type="text" 
                  required
                  value={checkoutForm.address}
                  onChange={e => setCheckoutForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-black text-sm">
                <span>{isAr ? 'المجموع:' : 'Total:'}</span>
                <span className="text-[#3e0f77]">{cartTotal} {isAr ? 'ر.س' : 'SAR'}</span>
              </div>

              <button 
                type="submit"
                className="w-full py-3 btn-bashayer-gold font-black text-xs cursor-pointer shadow"
              >
                {isAr ? 'تأكيد وإرسال الطلب' : 'Confirm Order'}
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
            <p className="text-slate-600 font-mono">{isAr ? 'رقم الطلب:' : 'Order ID:'} <strong className="text-[#3e0f77]">{orderCompleteData.orderNumber}</strong></p>
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
        onOpenFaq={(idx) => {
          setOpenFaqIndex(typeof idx === 'number' ? idx : 0);
          const el = document.getElementById('faq-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenReviews={() => {
          const el = document.getElementById('reviews-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="alsaeedi-mobile-bottom-nav lg:hidden flex items-center justify-around py-2 px-2 safe-area-inset-bottom">
        <button
          onClick={() => {
            setViewMode('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold cursor-pointer transition-colors ${
            viewMode === 'home' ? 'text-[#f6c344]' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>{isAr ? 'الرئيسية' : 'Home'}</span>
        </button>

        <a
          href="#floor-mats-section"
          className="flex flex-col items-center gap-1 p-1 text-[10px] font-bold text-slate-300 hover:text-[#f6c344] transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isAr ? 'أرضيات 5D' : '5D Mats'}</span>
        </a>

        <a
          href="#vehicle-filter-bar"
          className="flex flex-col items-center gap-1 p-1 text-[10px] font-bold text-slate-300 hover:text-[#f6c344] transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>{isAr ? 'تطابق سيارتك' : 'Fit Car'}</span>
        </a>

        <button
          onClick={() => openWhatsAppOrder()}
          className="flex flex-col items-center gap-1 p-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
        >
          <WhatsAppGlyph className="w-4 h-4" />
          <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
        </button>

        <button
          onClick={() => setCartDrawerOpen(true)}
          className="relative flex flex-col items-center gap-1 p-1 text-[10px] font-bold text-slate-300 hover:text-[#f6c344] cursor-pointer"
        >
          <div className="relative">
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black">
                {cartCount}
              </span>
            )}
          </div>
          <span>{isAr ? 'السلة' : 'Cart'}</span>
        </button>

        <button
          onClick={() => setIsAccountModalOpen(true)}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold cursor-pointer transition-colors ${
            isAccountModalOpen ? 'text-[#f6c344]' : 'text-slate-300 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
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

