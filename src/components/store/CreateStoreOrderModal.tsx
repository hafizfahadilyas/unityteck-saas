import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  User,
  ShoppingCart,
  CreditCard,
  Truck,
  Receipt,
  Trash2,
  Plus,
  Minus,
  Check,
  Building2,
  MapPin,
  ChevronDown,
  Package,
  Store,
  Sparkles,
  Search,
  Tag,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import { useManualOrderForm } from '../../hooks/useManualOrderForm';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { commerceTerm } from '../../i18n/commerceTerms';
import type { Order, Product } from '../../types';
import {
  fetchDeliveryDriversApi,
  fetchStoreBankAccountsApi,
  type DeliveryDriverRow,
  type StoreBankAccountRow,
} from '../../api/tenantApi';
import { handleImageError, FALLBACK_PRODUCT_IMAGE } from '../../utils/imageFallback';
import { getProductDisplayCategory } from '../../utils/storeLocalization';
import { ORDER_SOURCE_OPTIONS, OrderSourceIcon } from '../common/BrandIcons';
import { GlobalModal } from '../common/GlobalModal';
import {
  MadaIcon,
  ApplePayIcon,
  StcPayIcon,
  VisaIcon,
  MastercardIcon,
  CodIcon,
  TabbyIcon,
  TamaraIcon,
} from '../../themes/coffeeRoasters/components/PaymentIcons';
import { DeliveryLiveMapPin } from './DeliveryLiveMapPin';
import type { CheckoutGeoPoint } from '../storefront/checkout/CheckoutLocationPicker';

export interface CreateStoreOrderModalProps {
  isOpen?: boolean;
  storeName?: string;
  storeId?: string;
  products?: Product[];
  onClose: () => void;
  onCreate: (orderData: Partial<Order>) => void | Order | Promise<void | Order | null | undefined>;
}

const COUNTRY_OPTIONS = [
  { code: '+966', nameEn: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية', flag: '🇸🇦' },
  { code: '+971', nameEn: 'UAE', nameAr: 'الإمارات العربية المتحدة', flag: '🇦🇪' },
  { code: '+965', nameEn: 'Kuwait', nameAr: 'الكويت', flag: '🇰🇼' },
  { code: '+974', nameEn: 'Qatar', nameAr: 'قطر', flag: '🇶🇦' },
  { code: '+973', nameEn: 'Bahrain', nameAr: 'البحرين', flag: '🇧🇭' },
  { code: '+968', nameEn: 'Oman', nameAr: 'سلطنة عُمان', flag: '🇴🇲' },
  { code: '+20', nameEn: 'Egypt', nameAr: 'جمهورية مصر', flag: '🇪🇬' },
];

export const CreateStoreOrderModal: React.FC<CreateStoreOrderModalProps> = ({
  storeName,
  storeId,
  products: propProducts,
  onClose,
  onCreate,
}) => {
  const { locale, dir } = usePrefs();
  const isAr = locale === 'ar';
  const currencyLabel = isAr ? 'ر.س' : 'SAR';

  // Access store catalog from TenantContext with fallbacks
  const { currentProducts, allProducts, activeStore, currentShippingMethods } = useTenant();
  const resolvedStoreId = storeId || activeStore?.id;
  
  const catalogProducts: Product[] = useMemo(() => {
    if (propProducts && propProducts.length > 0) return propProducts;
    if (resolvedStoreId && allProducts[resolvedStoreId] && allProducts[resolvedStoreId].length > 0) {
      return allProducts[resolvedStoreId];
    }
    if (currentProducts && currentProducts.length > 0) {
      return currentProducts;
    }
    // Empty catalog → genuine empty (no cross-tenant / demo product seed)
    return [];
  }, [propProducts, resolvedStoreId, allProducts, currentProducts]);

  const initialStoreItems = useMemo(() => {
    if (catalogProducts && catalogProducts.length > 0) {
      const p = catalogProducts[0];
      return [
        {
          id: p.id,
          name: isAr ? (p.nameAr || p.name) : (p.nameEn || p.name),
          sku: p.sku || 'SKU-001',
          price: p.price || 50,
          quantity: 1,
          total: p.price || 50,
          image: p.image,
        },
      ];
    }
    return [];
  }, [catalogProducts, isAr]);

  const {
    countryCode,
    setCountryCode,
    customerPhone,
    setCustomerPhone,
    customerName,
    setCustomerName,
    items,
    addItem,
    removeItem,
    updateQuantity,
    updateItemPrice,
    paymentMethod,
    setPaymentMethod,
    paymentStatus,
    setPaymentStatus,
    paymentPlan,
    setPaymentPlan,
    amountPaid,
    setAmountPaid,
    bankAccountId,
    setBankAccountId,
    deliveryMethod,
    setDeliveryMethod,
    deliveryMode,
    setDeliveryMode,
    driverId,
    setDriverId,
    shippingFee,
    setShippingFee,
    shippingAddress,
    setShippingAddress,
    shippingCompany,
    setShippingCompany,
    orderSource,
    setOrderSource,
    subtotal,
    effectiveShippingFee,
    tax,
    grandTotal,
    remainingBalance,
    isValid,
    getOrderPayload,
  } = useManualOrderForm({
    initialShippingFee: 15.0,
    taxRate: 0.15,
    initialItems: initialStoreItems,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [drivers, setDrivers] = useState<DeliveryDriverRow[]>([]);
  const [bankAccounts, setBankAccounts] = useState<StoreBankAccountRow[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [banksLoading, setBanksLoading] = useState(false);
  const [deliveryGeo, setDeliveryGeo] = useState<CheckoutGeoPoint | null>(null);

  useEffect(() => {
    if (!resolvedStoreId) {
      setDrivers([]);
      return;
    }
    let cancelled = false;
    setDriversLoading(true);
    fetchDeliveryDriversApi(resolvedStoreId, { is_active: true, all: true })
      .then((rows) => {
        if (!cancelled) setDrivers(rows.filter((d) => d.is_active !== false));
      })
      .catch(() => {
        if (!cancelled) setDrivers([]);
      })
      .finally(() => {
        if (!cancelled) setDriversLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resolvedStoreId]);

  const needsBankAccount =
    paymentMethod === 'bank_transfer' || paymentPlan === 'partial';

  useEffect(() => {
    if (!resolvedStoreId || !needsBankAccount) {
      return;
    }
    let cancelled = false;
    setBanksLoading(true);
    fetchStoreBankAccountsApi(resolvedStoreId, { is_active: true })
      .then((rows) => {
        if (!cancelled) setBankAccounts(rows.filter((b) => b.is_active !== false));
      })
      .catch(() => {
        if (!cancelled) setBankAccounts([]);
      })
      .finally(() => {
        if (!cancelled) setBanksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resolvedStoreId, needsBankAccount]);
  
  // Real Products Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showCustomProductForm, setShowCustomProductForm] = useState(false);
  
  // Custom Product Fields
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState<number | string>(180);
  const [customSku, setCustomSku] = useState('');

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Extract unique categories from product catalog
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    catalogProducts.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [catalogProducts]);

  // Filter products based on search query and category filter
  const filteredProducts = useMemo(() => {
    let list = catalogProducts;

    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return list.slice(0, 10); // Show top 10 recommended items if no query
    }

    return list.filter((product) => {
      const matchName = product.name?.toLowerCase().includes(query);
      const matchNameAr = product.nameAr?.toLowerCase().includes(query);
      const matchSku = product.sku?.toLowerCase().includes(query);
      const matchCat = product.category?.toLowerCase().includes(query);
      const matchTags = product.tags?.some((t) => t.toLowerCase().includes(query));
      return matchName || matchNameAr || matchSku || matchCat || matchTags;
    });
  }, [catalogProducts, searchQuery, selectedCategory]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick helper to check if a product is already in order
  const getProductOrderQuantity = (productId: string) => {
    const found = items.find((i) => i.id === productId);
    return found ? found.quantity : 0;
  };

  const handleSelectProduct = (product: Product) => {
    addItem({
      id: product.id,
      name: isAr && product.nameAr ? product.nameAr : product.name,
      sku: product.sku || `SKU-${product.id.slice(0, 6)}`,
      price: Number(product.price) || 0,
      quantity: 1,
      image: product.image || (product.galleryUrls && product.galleryUrls[0]) || '',
    });
    // Keep focus or clear search query for next item
    setSearchQuery('');
  };

  const handleCreateCustomProduct = () => {
    if (!customName.trim()) return;
    const finalPrice = Math.max(0, Number(customPrice) || 0);
    const finalSku = customSku.trim() || `CUST-${Math.floor(1000 + Math.random() * 9000)}`;

    addItem({
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      sku: finalSku,
      price: finalPrice,
      quantity: 1,
    });

    setCustomName('');
    setCustomPrice(180);
    setCustomSku('');
    setShowCustomProductForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = getOrderPayload(resolvedStoreId);
      if (
        deliveryMethod === 'delivery' &&
        deliveryGeo &&
        payload.deliveryLocation &&
        !payload.deliveryLocation.includes(`${deliveryGeo.lat.toFixed(5)}`)
      ) {
        payload.deliveryLocation = `${payload.deliveryLocation} · ${deliveryGeo.lat.toFixed(5)},${deliveryGeo.lng.toFixed(5)}`;
      }
      await Promise.resolve(onCreate(payload));
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : isAr
            ? 'تعذر إنشاء الطلب. تحقق من الاتصال وحاول مرة أخرى.'
            : 'Could not create the order. Check your connection and try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCountry = COUNTRY_OPTIONS.find((c) => c.code === countryCode) || COUNTRY_OPTIONS[0];

  return (
    <GlobalModal
      onClose={onClose}
      dir={dir}
      aria-label={commerceTerm('createNewOrder', isAr)}
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[min(94vh,94dvh)] text-slate-800 dark:text-slate-100 font-sans">
        {/* ── TOP HEADER ── */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/90 flex items-center justify-between bg-gradient-to-r from-white via-slate-50/40 to-teal-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/20 sticky top-0 z-30">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black shadow-sm">
                <Store className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {commerceTerm('createNewOrder', isAr)}
              </h2>
              {(storeName || activeStore?.name) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  <span>{storeName || activeStore?.name}</span>
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              {isAr
                ? 'ابحث وأضف منتجات حقيقية من كتالوج المتجر وحدد بيانات العميل والتوصيل'
                : 'Search and add real products from store catalog, set customer info, and finalize manual order'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-5 sm:px-7 py-6 space-y-7 flex-1 custom-scrollbar">
          {/* ════ SECTION 1: CUSTOMER INFORMATION ════ */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shadow-2xs border border-teal-100/60 dark:border-teal-900/40">
                  <User className="w-4 h-4" />
                </span>
                <h3 className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                  {isAr ? 'بيانات العميل' : 'Customer Information'}
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {isAr ? 'الحقول بعلامة (*) مطلوبة' : 'Fields with (*) are required'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone Number with Interactive Country Dial Code Popover */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'رقم هاتف العميل (واتساب)' : 'Customer Phone (WhatsApp)'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 shadow-2xs focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all">
                  {/* Country Selector Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryMenu(!showCountryMenu)}
                      className="h-full px-3 py-2.5 border-e border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 cursor-pointer rounded-s-xl transition-colors"
                    >
                      <span className="text-base leading-none">{selectedCountry.flag}</span>
                      <span className="font-mono">{selectedCountry.code}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {/* Country Dropdown Popover */}
                    {showCountryMenu && (
                      <div className="absolute start-0 top-full mt-1.5 z-40 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                        {COUNTRY_OPTIONS.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setCountryCode(c.code);
                              setShowCountryMenu(false);
                            }}
                            className={`w-full px-3.5 py-2.5 text-xs flex items-center justify-between text-start hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer ${
                              countryCode === c.code
                                ? 'bg-teal-50/70 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold'
                                : 'text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span>{c.flag}</span>
                              <span className="truncate">{isAr ? c.nameAr : c.nameEn}</span>
                            </span>
                            <span className="font-mono text-slate-400">{c.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Phone Input */}
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9\s]*"
                    required
                    value={customerPhone}
                    onChange={(e) => {
                      // Digits + spaces only — block letter mixes like 123eee
                      const cleaned = e.target.value.replace(/[^\d\s]/g, '');
                      setCustomerPhone(cleaned);
                    }}
                    placeholder="50 123 4567"
                    className="w-full px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none bg-transparent font-medium"
                  />
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'اسم العميل الكامل' : 'Customer Full Name'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={isAr ? 'اكتب الاسم' : 'Type name'}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs transition-all font-medium"
                />
              </div>
            </div>
          </section>

          {/* ════ SECTION 2: PRODUCTS (REAL SEARCH & AUTO-SUGGEST) ════ */}
          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shadow-2xs border border-teal-100/60 dark:border-teal-900/40">
                  <ShoppingCart className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                    {isAr ? 'المنتجات والطلبات' : 'Products & Order Items'}
                  </h3>
                </div>
                {items.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-teal-600 text-white shadow-2xs">
                    {items.reduce((acc, i) => acc + i.quantity, 0)} {isAr ? 'عنصر' : 'items'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomProductForm(!showCustomProductForm)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                    showCustomProductForm
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isAr ? '+ منتج مخصص' : '+ Custom Product'}</span>
                </button>
              </div>
            </div>

            {/* ── REAL PRODUCT SEARCH & SUGGESTIONS BAR ── */}
            <div ref={searchContainerRef} className="relative z-20">
              <div className="relative flex items-center rounded-2xl border-2 border-teal-500/40 dark:border-teal-500/30 bg-white dark:bg-slate-850 shadow-sm focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-500/15 transition-all">
                <div className="ps-3.5 pe-2 text-teal-600 dark:text-teal-400 flex items-center pointer-events-none">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  placeholder={
                    isAr
                      ? 'ابحث باسم المنتج، رمز المنتج، التصنيف، أو الكلمات المفتاحية...'
                      : 'Search by product name, SKU, category, or tags to add...'
                  }
                  className="w-full py-3 pe-10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 bg-transparent focus:outline-none font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="p-1.5 me-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Quick Filters */}
              {availableCategories.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 no-scrollbar">
                  <span className="text-[11px] font-bold text-slate-400 me-1 shrink-0">
                    <Tag className="w-3 h-3 inline me-1" />
                    {isAr ? 'التصنيفات:' : 'Categories:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setIsSearchFocused(true);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isAr ? 'الكل' : 'All'} ({catalogProducts.length})
                  </button>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsSearchFocused(true);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-teal-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* ── AUTO-SUGGESTIONS DROPDOWN PANEL ── */}
              {isSearchFocused && (
                <div className="absolute start-0 end-0 top-full mt-2 bg-white dark:bg-slate-850 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-750 max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 z-50 animate-in fade-in zoom-in-98 duration-150">
                  <div className="px-4 py-2 bg-slate-50/90 dark:bg-slate-800/90 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 sticky top-0 z-10 backdrop-blur-xs">
                    <span>
                      {searchQuery
                        ? isAr
                          ? `نتائج البحث عن "${searchQuery}" (${filteredProducts.length})`
                          : `Search results for "${searchQuery}" (${filteredProducts.length})`
                        : isAr
                        ? 'المنتجات الممتازة والشائعة في المتجر'
                        : 'Featured & Popular Store Products'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSearchFocused(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold cursor-pointer"
                    >
                      {isAr ? 'إغلاق' : 'Close'}
                    </button>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className="p-6 text-center">
                      <AlertCircle className="w-7 h-7 text-amber-500 mx-auto mb-2 opacity-80" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {isAr
                          ? `لم يتم العثور على منتجات تطابق "${searchQuery}"`
                          : `No products matching "${searchQuery}"`}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {isAr
                          ? 'يمكنك إضافة هذا العنصر كمنتج مخصص بسعر محدد'
                          : 'You can quickly add this as a custom product with custom pricing'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomName(searchQuery);
                          setShowCustomProductForm(true);
                          setIsSearchFocused(false);
                        }}
                        className="mt-3 px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAr ? `إضافة "${searchQuery}" كمنتج مخصص` : `Add "${searchQuery}" as Custom`}</span>
                      </button>
                    </div>
                  ) : (
                    filteredProducts.map((product) => {
                      const qtyInOrder = getProductOrderQuantity(product.id);
                      const stockCount = typeof product.stock === 'number' ? product.stock : 10;
                      const isLowStock = stockCount > 0 && stockCount <= 5;
                      const isOutOfStock = stockCount === 0;

                      return (
                        <div
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                          className={`p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 hover:bg-teal-50/60 dark:hover:bg-slate-800 cursor-pointer transition-colors group ${
                            qtyInOrder > 0 ? 'bg-teal-50/30 dark:bg-teal-950/20' : ''
                          }`}
                        >
                          {/* Thumbnail + Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={isAr && product.nameAr ? product.nameAr : product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                                />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                  {isAr && product.nameAr ? product.nameAr : product.name}
                                </h4>
                                {product.category && (
                                  <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    {getProductDisplayCategory(product, locale)}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                                <span>
                                  {isAr ? 'رمز المنتج' : 'SKU'}: {product.sku || product.id}
                                </span>
                                <span>•</span>
                                {isOutOfStock ? (
                                  <span className="text-rose-500 font-sans font-bold">
                                    {isAr ? 'نفذت الكمية' : 'Out of Stock'}
                                  </span>
                                ) : isLowStock ? (
                                  <span className="text-amber-500 font-sans font-bold">
                                    {isAr ? `متبقي${stockCount}فقط` : `${stockCount} left`}
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-sans font-bold">
                                    {isAr ? `متوفر (${stockCount})` : `In Stock (${stockCount})`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Price & Action Button */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-end">
                              <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                                <span className="text-[10px] text-slate-400 me-1 font-bold">{currencyLabel}</span>
                                <span>{Number(product.price).toFixed(2)}</span>
                              </div>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-[10px] text-slate-400 line-through font-mono">
                                  {currencyLabel} {product.originalPrice.toFixed(2)}
                                </span>
                              )}
                            </div>

                            {qtyInOrder > 0 ? (
                              <div
                                className="flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(product.id, -1);
                                  }}
                                  className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 dark:hover:bg-rose-950/40 flex items-center justify-center cursor-pointer shadow-2xs transition-all"
                                  title={isAr ? 'تقليل أو إزالة' : 'Decrease or remove'}
                                  aria-label={isAr ? 'تقليل أو إزالة' : 'Decrease or remove'}
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="min-w-[2rem] text-center text-xs font-black tabular-nums text-teal-700 dark:text-teal-300">
                                  {qtyInOrder}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectProduct(product);
                                  }}
                                  className="w-8 h-8 rounded-xl bg-teal-600 text-white hover:bg-teal-700 flex items-center justify-center cursor-pointer shadow-2xs transition-all"
                                  title={isAr ? 'زيادة الكمية' : 'Increase quantity'}
                                  aria-label={isAr ? 'زيادة الكمية' : 'Increase quantity'}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeItem(product.id);
                                  }}
                                  className="w-8 h-8 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center cursor-pointer shadow-2xs transition-all"
                                  title={isAr ? 'إزالة من الطلب' : 'Remove from order'}
                                  aria-label={isAr ? 'إزالة من الطلب' : 'Remove from order'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectProduct(product);
                                }}
                                className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-teal-600 hover:text-white"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{isAr ? 'إضافة' : 'Add'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* ── CUSTOM PRODUCT DRAWER ── */}
            {showCustomProductForm && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/70 via-teal-50/50 to-emerald-50/40 dark:from-slate-850 dark:via-slate-850 dark:to-teal-950/30 border border-amber-200/90 dark:border-amber-900/50 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {isAr ? 'إضافة منتج مخصص / خدمة خاصة' : 'Add Custom Store Product or Service'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCustomProductForm(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder={isAr ? 'اسم المنتج أو الباقة أو الخدمة...' : 'Product title, service or gift bundle...'}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs shadow-2xs">
                      <span className="text-[10px] text-slate-400 me-1.5 font-bold">{currencyLabel}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        placeholder="Price"
                        className="w-full bg-transparent focus:outline-none font-bold text-slate-900 dark:text-white tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCreateCustomProduct}
                      disabled={!customName.trim()}
                      className="flex-1 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
                    >
                      {isAr ? 'إضافة للطلب' : 'Add to Order'}
                    </button>
                  </div>
                </div>

                {/* Automotive Presets Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-amber-200/50 text-[10px]">
                  <span className="text-slate-500 font-bold">{isAr ? 'قوالب سريعة للسيارات:' : 'Quick Auto Presets:'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomName('أرضيات دايموند 5D تفصيل ليزر (٥ مقاعد - صفين)');
                      setCustomPrice('380');
                    }}
                    className="px-2 py-0.5 rounded-md bg-white/80 border border-amber-300 text-slate-800 hover:bg-amber-100 cursor-pointer font-bold"
                  >
                    أرضيات ٥ مقاعد (380 ر.س)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomName('أرضيات دايموند 5D تفصيل ليزر (٥ مقاعد + دعاسة الشنطة)');
                      setCustomPrice('470');
                    }}
                    className="px-2 py-0.5 rounded-md bg-white/80 border border-amber-300 text-slate-800 hover:bg-amber-100 cursor-pointer font-bold"
                  >
                    أرضيات ٥ مقاعد + الشنطة (470 ر.س)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomName('أرضيات دايموند 5D تفصيل ليزر (٧ مقاعد عائلية + دعاسة الشنطة)');
                      setCustomPrice('530');
                    }}
                    className="px-2 py-0.5 rounded-md bg-white/80 border border-amber-300 text-slate-800 hover:bg-amber-100 cursor-pointer font-bold"
                  >
                    أرضيات ٧ مقاعد + الشنطة (530 ر.س)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomName('دعاسة شنطة سيارة دايموند 5D تفصيل ليزر');
                      setCustomPrice('150');
                    }}
                    className="px-2 py-0.5 rounded-md bg-white/80 border border-amber-300 text-slate-800 hover:bg-amber-100 cursor-pointer font-bold"
                  >
                    دعاسة الشنطة فقط (150 ر.س)
                  </button>
                </div>
              </div>
            )}

            {/* ── PRODUCTS TABLE / ORDER ITEMS ── */}
            <div className="border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-850 shadow-xs">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/90 dark:border-slate-750 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <div className="col-span-6 sm:col-span-5">{isAr ? 'المنتج' : 'Product'}</div>
                <div className="col-span-3 sm:col-span-3 text-center sm:text-start">{isAr ? 'سعر الوحدة' : 'Unit Price'}</div>
                <div className="col-span-3 sm:col-span-2 text-center">{isAr ? 'الكمية' : 'Quantity'}</div>
                <div className="hidden sm:block sm:col-span-2 text-end">{isAr ? 'المجموع' : 'Total'}</div>
              </div>

              {items.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {isAr
                      ? 'لم تتم إضافة أي منتج بعد'
                      : 'No products added to this order yet'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isAr
                      ? 'استخدم شريط البحث أعلاه لاختيار منتجات حقيقية من كتالوج متجرك'
                      : 'Use the search box above to choose real products from your catalog'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-2 px-4 py-3.5 items-center hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Product Thumbnail & Details */}
                      <div className="col-span-6 sm:col-span-5 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title={isAr ? 'حذف المنتج' : 'Remove item'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                            {isAr ? 'رمز المنتج' : 'SKU'}: {item.sku}
                          </p>
                        </div>
                      </div>

                      {/* Unit Price (Editable for discounts or special deals) */}
                      <div className="col-span-3 sm:col-span-3">
                        <div className="inline-flex items-center px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs focus-within:ring-2 focus-within:ring-teal-500/20">
                          <span className="text-[10px] text-slate-400 me-1 font-bold">{currencyLabel}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                            className="w-16 bg-transparent focus:outline-none font-bold tabular-nums"
                          />
                        </div>
                      </div>

                      {/* Quantity Controller */}
                      <div className="col-span-3 sm:col-span-2 flex items-center justify-center">
                        <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={item.quantity <= 1}
                            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-black text-slate-900 dark:text-white tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Row Total */}
                      <div className="hidden sm:block sm:col-span-2 text-end">
                        <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                          {currencyLabel} {item.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ════ SECTION 3: ORDER SOURCE + PAYMENT ════ */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shadow-2xs border border-teal-100/60 dark:border-teal-900/40">
                <CreditCard className="w-4 h-4" />
              </span>
              <h3 className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                {isAr ? 'مصدر الطلب والدفع' : 'Order Source & Payment'}
              </h3>
            </div>

            <div className="space-y-3.5">
              {/* Order Source — TikTok, Snapchat, etc. */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {isAr ? 'مصدر / قناة الطلب' : 'Order Source / Channel'} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {ORDER_SOURCE_OPTIONS.map((opt) => {
                    const selected = orderSource === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setOrderSource(opt.value)}
                        className={`p-2.5 rounded-2xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          selected
                            ? 'border-teal-600 bg-teal-50/90 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 ring-2 ring-teal-500/20 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <OrderSourceIcon source={opt.value} className="w-5 h-5" />
                        <span className="leading-tight text-center">{isAr ? opt.labelAr : opt.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Method Tiles — real Saudi brand marks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {isAr ? 'طريقة الدفع المختارة' : 'Selected Payment Method'} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                  {[
                    { id: 'mada', labelEn: 'mada', labelAr: 'مدى' },
                    { id: 'apple', labelEn: 'Apple Pay', labelAr: 'أبل باي' },
                    { id: 'visa', labelEn: 'Visa / MC', labelAr: 'فيزا / ماستركارد' },
                    { id: 'stc', labelEn: 'stc pay', labelAr: 'اس تي سي باي' },
                    { id: 'tabby', labelEn: 'Tabby', labelAr: 'تابي' },
                    { id: 'tamara', labelEn: 'Tamara', labelAr: 'تمارا' },
                    { id: 'cash', labelEn: 'Cash on Delivery', labelAr: 'الدفع عند الاستلام' },
                    { id: 'bank_transfer', labelEn: 'Bank Transfer', labelAr: 'تحويل بنكي' },
                  ].map((pm) => {
                    const isSelected = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50/90 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 ring-2 ring-teal-500/20 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {pm.id === 'mada' && <MadaIcon className="h-6 w-auto" />}
                        {pm.id === 'apple' && <ApplePayIcon className="h-6 w-auto" />}
                        {pm.id === 'visa' && (
                          <span className="inline-flex items-center gap-1">
                            <VisaIcon className="h-5 w-auto" />
                            <MastercardIcon className="h-5 w-auto" />
                          </span>
                        )}
                        {pm.id === 'stc' && <StcPayIcon className="h-6 w-auto" />}
                        {pm.id === 'tabby' && <TabbyIcon className="h-6 w-auto" />}
                        {pm.id === 'tamara' && <TamaraIcon className="h-6 w-auto" />}
                        {pm.id === 'cash' && <CodIcon className="h-6 w-auto" />}
                        {pm.id === 'bank_transfer' && <Building2 className="h-6 w-6 text-teal-600" />}
                        <span className="text-[11px] leading-tight text-center">
                          {isAr ? pm.labelAr : pm.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Plan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {isAr ? 'خطة الدفع' : 'Payment Plan'}
                </label>
                <div className="grid grid-cols-2 gap-2 max-w-xl">
                  {(
                    [
                      { id: 'full' as const, label: commerceTerm('fullPayment', isAr) },
                      { id: 'partial' as const, label: commerceTerm('partialPayment', isAr) },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setPaymentPlan(opt.id);
                        if (opt.id === 'full') setAmountPaid(grandTotal);
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        paymentPlan === opt.id
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/15 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentPlan === 'partial' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {commerceTerm('amountPaid', isAr)}
                    </label>
                    <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 overflow-hidden">
                      <span className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-e border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500">
                        {currencyLabel}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        max={grandTotal}
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 text-xs font-medium tabular-nums bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {commerceTerm('remainingBalance', isAr)}
                    </label>
                    <div className="px-3 py-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/30 text-xs font-black tabular-nums text-amber-800 dark:text-amber-200">
                      {currencyLabel} {remainingBalance.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {needsBankAccount && (
                <div className="space-y-2 max-w-xl">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {commerceTerm('bankAccount', isAr)} <span className="text-rose-500">*</span>
                  </label>
                  {banksLoading ? (
                    <p className="text-xs text-slate-500">{isAr ? 'جاري التحميل…' : 'Loading…'}</p>
                  ) : bankAccounts.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      {isAr
                        ? 'لا توجد حسابات بنكية. أضفها من صفحة المدفوعات.'
                        : 'No bank accounts found. Add them from Payments settings.'}
                    </p>
                  ) : (
                    <>
                      <select
                        value={bankAccountId}
                        onChange={(e) => setBankAccountId(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 font-medium"
                      >
                        <option value="">
                          {isAr ? 'اختر الحساب البنكي' : 'Select bank account'}
                        </option>
                        {bankAccounts.map((b) => (
                          <option key={b.id} value={b.id}>
                            {(isAr && b.bank_name_ar) || b.bank_name} — {b.iban}
                            {b.is_default ? (isAr ? '(افتراضي)' : ' (default)') : ''}
                          </option>
                        ))}
                      </select>
                      {(() => {
                        const selected = bankAccounts.find((b) => b.id === bankAccountId);
                        if (!selected) return null;
                        const bankLabel =
                          (isAr && selected.bank_name_ar) || selected.bank_name;
                        const titleLabel =
                          (isAr && selected.account_title_ar) || selected.account_title;
                        return (
                          <div className="rounded-xl border border-teal-200/70 dark:border-teal-900/50 bg-teal-50/50 dark:bg-teal-950/30 p-3 space-y-1.5 text-xs">
                            <p className="font-black text-teal-900 dark:text-teal-200">
                              {isAr ? 'تفاصيل التحويل البنكي' : 'Bank transfer details'}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-700 dark:text-slate-300">
                              <span className="font-semibold">{isAr ? 'البنك' : 'Bank'}</span>
                              <span className="font-bold sm:text-end">{bankLabel}</span>
                              <span className="font-semibold">{isAr ? 'اسم الحساب' : 'Account title'}</span>
                              <span className="font-bold sm:text-end break-all">{titleLabel}</span>
                              <span className="font-semibold">IBAN</span>
                              <span className="font-mono font-bold sm:text-end break-all" dir="ltr">
                                {selected.iban}
                              </span>
                              {selected.account_number ? (
                                <>
                                  <span className="font-semibold">
                                    {isAr ? 'رقم الحساب' : 'Account number'}
                                  </span>
                                  <span className="font-mono font-bold sm:text-end" dir="ltr">
                                    {selected.account_number}
                                  </span>
                                </>
                              ) : null}
                              {selected.payment_reference_prefix ? (
                                <>
                                  <span className="font-semibold">
                                    {isAr ? 'مرجع الدفع' : 'Payment reference'}
                                  </span>
                                  <span className="font-mono font-bold sm:text-end" dir="ltr">
                                    {selected.payment_reference_prefix}
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              )}

              {/* Payment Status Segmented Control */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {isAr ? 'حالة الدفع' : 'Payment Status'} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('Paid')}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      paymentStatus === 'Paid'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-400/40" />
                    <span>{isAr ? 'مدفوع بالكامل' : 'Paid in Full'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('Pending Payment')}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      paymentStatus === 'Pending Payment'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-400/40" />
                    <span>{isAr ? 'بانتظار الدفع' : 'Awaiting payment'}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ════ SECTION 4: DELIVERY & SHIPPING ════ */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shadow-2xs border border-teal-100/60 dark:border-teal-900/40">
                <Truck className="w-4 h-4" />
              </span>
              <h3 className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                {isAr ? 'التوصيل والشحن' : 'Delivery & Shipping'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Delivery Method Segmented Controls */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'طريقة التوصيل' : 'Delivery Method'} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('delivery')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      deliveryMethod === 'delivery'
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/15 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>{isAr ? 'توصيل سريع' : 'Express Delivery'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      deliveryMethod === 'pickup'
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/15 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>{isAr ? 'استلام من الفرع' : 'Branch Pickup'}</span>
                  </button>
                </div>
              </div>

              {/* Shipping Fee */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'رسوم التوصيل والشحن' : 'Shipping Fee'} <span className="text-rose-500">*</span>
                </label>
                <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 shadow-2xs overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all">
                  <span className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-e border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400">
                    {currencyLabel}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={deliveryMethod === 'pickup'}
                    value={deliveryMethod === 'pickup' ? 0 : shippingFee}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d.]/g, '');
                      setShippingFee(parseFloat(raw) || 0);
                    }}
                    className="w-full px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none bg-transparent disabled:opacity-40 disabled:cursor-not-allowed font-medium tabular-nums"
                  />
                </div>
              </div>
            </div>

            {deliveryMethod === 'delivery' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {commerceTerm('shipping', isAr)}
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-w-md">
                    <button
                      type="button"
                      onClick={() => setDeliveryMode('own_delivery')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        deliveryMode === 'own_delivery'
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/15'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {commerceTerm('ownDelivery', isAr)}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryMode('shipping_company');
                        setDriverId('');
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        deliveryMode === 'shipping_company'
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/15'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {commerceTerm('shippingCompany', isAr)}
                    </button>
                  </div>
                </div>

                {deliveryMode === 'own_delivery' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {commerceTerm('assignDriver', isAr)}
                    </label>
                    {driversLoading ? (
                      <p className="text-xs text-slate-500">{isAr ? 'جاري التحميل…' : 'Loading…'}</p>
                    ) : drivers.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        {isAr
                          ? 'لا يوجد مندوبو توصيل نشطون'
                          : 'No active delivery drivers'}
                      </p>
                    ) : (
                      <select
                        value={driverId}
                        onChange={(e) => setDriverId(e.target.value)}
                        className="w-full max-w-md px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 font-medium"
                      >
                        <option value="">
                          {isAr ? 'اختر مندوب التوصيل' : 'Select delivery driver'}
                        </option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {(isAr && d.name_ar) || d.name}
                            {d.phone ? ` · ${d.phone}` : ''}
                            {d.city ? ` · ${d.city}` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {deliveryMode === 'shipping_company' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {commerceTerm('shippingCompany', isAr)}
                    </label>
                    {(() => {
                      const courierMethods = (currentShippingMethods || []).filter(
                        (m) => m.isActive && (m.fulfillmentMode || 'courier') !== 'own_delivery',
                      );
                      if (courierMethods.length === 0) {
                        return (
                          <input
                            type="text"
                            value={shippingCompany}
                            onChange={(e) => setShippingCompany(e.target.value)}
                            placeholder={isAr ? 'مثال: سمسا، أرامكس، سبل' : 'e.g. SMSA, Aramex, SPL'}
                            className="w-full max-w-md px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 font-medium"
                          />
                        );
                      }
                      return (
                        <div className="space-y-2 max-w-md">
                          <select
                            value={shippingCompany}
                            onChange={(e) => {
                              const idOrName = e.target.value;
                              setShippingCompany(idOrName);
                              const m = courierMethods.find(
                                (x) => x.id === idOrName || x.name === idOrName || x.nameAr === idOrName,
                              );
                              if (m) {
                                setShippingFee(Number(m.baseRate) || 0);
                                setShippingCompany(isAr ? (m.nameAr || m.name) : m.name);
                              }
                            }}
                            className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 font-medium"
                          >
                            <option value="">
                              {isAr ? 'اختر شركة الشحن' : 'Select shipping company'}
                            </option>
                            {courierMethods.map((m) => {
                              const label = isAr ? (m.nameAr || m.name) : m.name;
                              const fee = Number(m.baseRate) || 0;
                              const perKg = Number(m.perKgRate) || 0;
                              const eta = m.estimatedDelivery || '';
                              const feeBit =
                                perKg > 0
                                  ? isAr
                                    ? `${fee}ر.س +${perKg}/كجم`
                                    : `${fee} SAR + ${perKg}/kg`
                                  : isAr
                                    ? `${fee}ر.س`
                                    : `${fee} SAR`;
                              return (
                                <option key={m.id} value={m.id}>
                                  {label} · {feeBit}
                                  {eta ? ` · ${eta}` : ''}
                                  {m.trackingEnabled ? (isAr ? '· تتبع' : ' · Track') : ''}
                                </option>
                              );
                            })}
                          </select>
                          <p className="text-[10px] text-slate-500">
                            {isAr
                              ? 'الرسوم والوقت والتتبع من إعدادات الشحن (ثابت أو حسب الكيلو).'
                              : 'Fee, ETA, and tracking come from Shipping settings (fixed or per-kg).'}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Shipping Address + live map pin */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'عنوان التوصيل والحي' : 'Delivery Address & District'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required={deliveryMethod === 'delivery'}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder={
                    isAr
                      ? 'مكة المكرمة - الشوقية، شارع عبد الله بن العباس'
                      : 'Makkah - Al Shawqiyyah, Abdullah Ibn Al Abbas St.'
                  }
                  disabled={deliveryMethod === 'pickup'}
                  className="w-full ps-10 pe-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all font-medium"
                />
              </div>
              <DeliveryLiveMapPin
                isAr={isAr}
                onAddressChange={setShippingAddress}
                geo={deliveryGeo}
                onGeoChange={setDeliveryGeo}
                disabled={deliveryMethod === 'pickup'}
              />
            </div>
          </section>

          {/* ════ SECTION 5: ORDER SUMMARY RECEIPT ════ */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shadow-2xs border border-teal-100/60 dark:border-teal-900/40">
                <Receipt className="w-4 h-4" />
              </span>
              <h3 className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                {isAr ? 'ملخص الفاتورة والحساب' : 'Invoice & Bill Summary'}
              </h3>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50/40 via-slate-50/70 to-emerald-50/40 dark:from-slate-850 dark:to-slate-800 border border-teal-100/90 dark:border-teal-900/50 space-y-3 shadow-xs">
              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold">{isAr ? 'المجموع الفرعي للمنتجات' : 'Products Subtotal'}</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {currencyLabel} {subtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold">{isAr ? 'رسوم الشحن والتوصيل' : 'Delivery / Shipping Fee'}</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {deliveryMethod === 'pickup'
                    ? isAr
                      ? 'مجاناً (استلام من الفرع)'
                      : 'Free (Branch Pickup)'
                    : `${currencyLabel} ${effectiveShippingFee.toFixed(2)}`}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold">{isAr ? 'ضريبة القيمة المضافة (١٥٪)' : 'Value Added Tax (15%)'}</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {currencyLabel} {tax.toFixed(2)}
                </span>
              </div>

              <div className="pt-3 border-t border-teal-200/80 dark:border-teal-900/60 flex justify-between items-center">
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? 'المجموع الكلي المطلوب' : 'Grand Total Payable'}
                </span>
                <span className="text-xl font-black text-teal-600 dark:text-teal-400 tabular-nums">
                  {currencyLabel} {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </section>
        </form>

        {submitError ? (
          <div className="mx-6 mb-2 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        ) : null}

        {/* ── STICKY FOOTER ACTIONS ── */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-end gap-3 sticky bottom-0 z-30">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            {commerceTerm('cancel', isAr)}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-black flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isAr ? 'إنشاء وتأكيد الطلب' : 'Create & Finalize Order'}</span>
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};

export default CreateStoreOrderModal;
