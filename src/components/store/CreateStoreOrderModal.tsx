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
  Building2,
} from 'lucide-react';
import { useManualOrderForm } from '../../hooks/useManualOrderForm';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { commerceTerm } from '../../i18n/commerceTerms';
import type { Order, Product } from '../../types';
import {
  fetchCouriers,
  fetchDeliveryDriversApi,
  fetchProductsPage,
  fetchShippingMethods,
  fetchStorefrontCatalog,
  type DeliveryDriverRow,
} from '../../api/tenantApi';
import type { CourierConnectionItem, ShippingMethodItem } from '../../types';
import { handleImageError, FALLBACK_PRODUCT_IMAGE } from '../../utils/imageFallback';
import {
  getProductDisplayCategory,
  getProductDisplayName,
  getStoreDisplayName,
} from '../../utils/storeLocalization';
import { ORDER_SOURCE_OPTIONS, OrderSourceIcon } from '../common/BrandIcons';
import { GlobalModal } from '../common/GlobalModal';
import { PortalSelect } from '../common/PortalSelect';
import { CREATE_ORDER_PAYMENT_OPTIONS } from '../../utils/paymentMethodLogos';
import { DeliveryLiveMapPin } from './DeliveryLiveMapPin';
import { prefetchGoogleMaps } from '../../utils/googleMapsLoader';
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
  const {
    currentProducts,
    allProducts,
    activeStore,
    currentShippingMethods,
    currentCouriers,
  } = useTenant();
  const resolvedStoreId = storeId || activeStore?.id;
  const [liveCatalog, setLiveCatalog] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [localShippingMethods, setLocalShippingMethods] = useState<ShippingMethodItem[]>([]);
  const [localCouriers, setLocalCouriers] = useState<CourierConnectionItem[]>([]);

  // Warm Google Maps while catalog loads so the delivery pin is ready when scrolled into view.
  useEffect(() => {
    prefetchGoogleMaps();
  }, []);

  // Seed from context first (instant UI) — one light refresh, no triple sequential hangs.
  useEffect(() => {
    if (!resolvedStoreId) {
      setLiveCatalog([]);
      setCatalogError(null);
      return;
    }
    let cancelled = false;
    const ctxRows =
      allProducts[resolvedStoreId] ||
      (activeStore?.id === resolvedStoreId ? currentProducts : null) ||
      propProducts ||
      [];
    const seed = Array.isArray(ctxRows) ? ctxRows : [];
    if (seed.length > 0) {
      setLiveCatalog(seed);
      setCatalogLoading(false);
      setCatalogError(null);
    } else {
      setCatalogLoading(true);
      setCatalogError(null);
    }

    (async () => {
      const mergeUnique = (rows: Product[]) => {
        const seen = new Set<string>();
        const out: Product[] = [];
        for (const row of rows) {
          if (!row?.id || seen.has(row.id)) continue;
          seen.add(row.id);
          out.push(row);
        }
        return out;
      };

      let loaded: Product[] = [];
      let fetchFailed = false;
      try {
        loaded = await fetchStorefrontCatalog(resolvedStoreId);
      } catch {
        /* try admin page */
      }
      if (!Array.isArray(loaded) || loaded.length === 0) {
        try {
          const page = await fetchProductsPage(resolvedStoreId, {
            page: 1,
            per_page: 100,
            sort: 'updated_at',
            dir: 'desc',
          });
          loaded = page.data;
        } catch {
          loaded = [];
          fetchFailed = true;
        }
      }

      if (cancelled) return;
      const next = mergeUnique(Array.isArray(loaded) ? loaded : []);
      if (next.length > 0) setLiveCatalog(next);
      setCatalogLoading(false);
      setCatalogError(
        fetchFailed && next.length === 0 && seed.length === 0
          ? isAr
            ? 'تعذر تحميل منتجات هذا المتجر. تحقق من الاتصال وحاول مرة أخرى.'
            : 'Could not load products for this store. Check connection and try again.'
          : null,
      );
    })();

    return () => {
      cancelled = true;
    };
    // Only re-run when the store (or locale) changes — not on every catalog map rewrite.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedStoreId, isAr]);

  // Ensure enabled shipping methods + connected couriers are available for the dropdown.
  useEffect(() => {
    if (!resolvedStoreId) {
      setLocalShippingMethods([]);
      setLocalCouriers([]);
      return;
    }
    let cancelled = false;
    void Promise.allSettled([
      fetchShippingMethods(resolvedStoreId),
      fetchCouriers(resolvedStoreId),
    ]).then(([methodsRes, couriersRes]) => {
      if (cancelled) return;
      if (methodsRes.status === 'fulfilled' && Array.isArray(methodsRes.value)) {
        setLocalShippingMethods(methodsRes.value.filter((m) => m.isActive !== false));
      }
      if (couriersRes.status === 'fulfilled' && Array.isArray(couriersRes.value)) {
        const normalized: CourierConnectionItem[] = couriersRes.value.map((raw: any) => {
          const statusRaw = String(raw.status || '').toLowerCase();
          const connected =
            statusRaw === 'connected' ||
            raw.is_connected === true ||
            raw.isConnected === true;
          return {
            id: String(raw.id || ''),
            storeId: String(raw.store_id || raw.storeId || resolvedStoreId),
            provider: (raw.provider || 'smsa') as CourierConnectionItem['provider'],
            accountName: String(raw.account_name || raw.accountName || raw.provider || ''),
            accountNumber: raw.account_number || raw.accountNumber,
            maskedApiKey: String(raw.masked_api_key || raw.maskedApiKey || ''),
            isSandbox: Boolean(raw.is_sandbox ?? raw.isSandbox),
            isConnected: connected,
            status: connected ? 'connected' : statusRaw === 'error' ? 'error' : 'disconnected',
            settings: raw.settings,
            lastTestedAt: raw.last_tested_at || raw.lastTestedAt,
            lastSyncAt: raw.last_sync_at || raw.lastSyncAt,
          };
        });
        setLocalCouriers(normalized.filter((c) => c.status === 'connected' || c.isConnected));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [resolvedStoreId]);

  const catalogProducts: Product[] = useMemo(() => {
    // Strict store isolation — never borrow another tenant's catalog.
    const fromCtx =
      resolvedStoreId && allProducts[resolvedStoreId]?.length
        ? allProducts[resolvedStoreId]
        : resolvedStoreId && activeStore?.id === resolvedStoreId && currentProducts?.length
          ? currentProducts
          : [];
    const fromProps = propProducts?.length ? propProducts : [];
    const ranked = [liveCatalog, fromProps, fromCtx].sort((a, b) => b.length - a.length);
    return ranked[0] || [];
  }, [propProducts, liveCatalog, resolvedStoreId, allProducts, currentProducts, activeStore?.id]);

  const initialStoreItems = useMemo(() => {
    if (catalogProducts && catalogProducts.length > 0) {
      const p = catalogProducts[0];
      return [
        {
          id: p.id,
          name: getProductDisplayName(p, locale),
          sku: p.sku || 'SKU-001',
          price: p.price || 50,
          quantity: 1,
          total: p.price || 50,
          image: p.image,
        },
      ];
    }
    return [];
  }, [catalogProducts, locale]);

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
  const [driversLoading, setDriversLoading] = useState(false);
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

  // Unique catalog categories with locale-correct labels (EN chrome ≠ Arabic category strings)
  const availableCategories = useMemo(() => {
    const byKey = new Map<string, { key: string; label: string; hasEn: boolean }>();
    catalogProducts.forEach((p) => {
      const key = (p.category || p.categoryAr || p.categoryEn || '').trim();
      if (!key) return;
      const hasEn = Boolean(p.categoryEn && !/[\u0600-\u06FF]/.test(p.categoryEn));
      const existing = byKey.get(key);
      if (!existing || (!existing.hasEn && hasEn)) {
        byKey.set(key, {
          key,
          label: getProductDisplayCategory(p, locale),
          hasEn,
        });
      }
    });
    return Array.from(byKey.values()).map(({ key, label }) => ({ key, label }));
  }, [catalogProducts, locale]);

  // Filter products based on search query and category filter
  const filteredProducts = useMemo(() => {
    let list = catalogProducts;

    if (selectedCategory !== 'all') {
      const selected = selectedCategory.toLowerCase();
      list = list.filter((p) => {
        const keys = [p.category, p.categoryAr, p.categoryEn]
          .filter(Boolean)
          .map((v) => String(v).trim().toLowerCase());
        return keys.includes(selected);
      });
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return list.slice(0, 10); // Show top 10 recommended items if no query
    }

    return list.filter((product) => {
      const matchName = product.name?.toLowerCase().includes(query);
      const matchNameEn = product.nameEn?.toLowerCase().includes(query);
      const matchNameAr = product.nameAr?.toLowerCase().includes(query);
      const matchSku = product.sku?.toLowerCase().includes(query);
      const matchCat = product.category?.toLowerCase().includes(query);
      const matchCatEn = product.categoryEn?.toLowerCase().includes(query);
      const matchCatAr = product.categoryAr?.toLowerCase().includes(query);
      const matchTags = product.tags?.some((t) => t.toLowerCase().includes(query));
      return (
        matchName ||
        matchNameEn ||
        matchNameAr ||
        matchSku ||
        matchCat ||
        matchCatEn ||
        matchCatAr ||
        matchTags
      );
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
      name: getProductDisplayName(product, locale),
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

  type CreatePaymentMode = 'full' | 'partial' | 'awaiting';
  const paymentMode: CreatePaymentMode =
    paymentPlan === 'partial' ? 'partial' : paymentStatus === 'Paid' ? 'full' : 'awaiting';

  const selectPaymentMode = (mode: CreatePaymentMode) => {
    if (mode === 'full') {
      setPaymentPlan('full');
      setPaymentStatus('Paid');
      setAmountPaid(grandTotal);
      return;
    }
    if (mode === 'partial') {
      setPaymentPlan('partial');
      setPaymentStatus('Pending Payment');
      setAmountPaid((prev) => Math.min(prev || 0, grandTotal));
      return;
    }
    setPaymentPlan('full');
    setPaymentStatus('Pending Payment');
    setAmountPaid(0);
  };

  // Keep amountPaid in sync when Full Payment is selected and totals change.
  useEffect(() => {
    if (paymentMode === 'full') setAmountPaid(grandTotal);
    if (paymentMode === 'awaiting') setAmountPaid(0);
  }, [paymentMode, grandTotal, setAmountPaid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;
    if (!resolvedStoreId) {
      setSubmitError(
        isAr
          ? 'تعذر تحديد المتجر. أعد فتح الطلب من لوحة المتجر الصحيح.'
          : 'Store could not be resolved. Re-open create order from the correct store.'
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = getOrderPayload(resolvedStoreId);
      if (!payload.storeId || payload.storeId !== resolvedStoreId) {
        payload.storeId = resolvedStoreId;
      }
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
      <div
        className="relative w-[calc(100vw-0.75rem)] sm:w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[min(96vh,96dvh)]"
        style={{
          background: 'var(--surface, #fff)',
          border: '1px solid var(--border, #e2e8f0)',
          color: 'var(--text, #0f172a)',
          fontFamily: 'var(--font-ui, inherit)',
        }}
      >
        {/* ── TOP HEADER — Holst global CTA (same BrandingPanel / unity-btn-primary) ── */}
        <div
          className="unity-modal-header px-6 py-4.5 border-b flex items-center justify-between sticky top-0 z-30"
          style={{
            background: 'var(--portal-cta)',
            backgroundColor: 'var(--portal-600)',
            borderColor: 'transparent',
            color: '#fff',
          }}
        >
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-black shadow-sm"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                <Store className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {commerceTerm('createNewOrder', isAr)}
              </h2>
              {(storeName || activeStore?.name) && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs"
                  style={{
                    background: 'rgba(255,255,255,0.14)',
                    borderColor: 'rgba(255,255,255,0.28)',
                    color: '#fff',
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: '#ffffff' }}
                  />
                  <span>
                    {activeStore
                      ? getStoreDisplayName(activeStore, locale)
                      : storeName}
                  </span>
                </span>
              )}
            </div>
            <p className="text-xs font-semibold mt-1 text-white/80">
              {isAr
                ? 'ابحث وأضف منتجات حقيقية من كتالوج المتجر وحدد بيانات العميل والتوصيل'
                : 'Search and add real products from store catalog, set customer info, and finalize manual order'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-2xl transition-colors cursor-pointer text-white/70 hover:text-white hover:bg-white/10"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.key);
                        setIsSearchFocused(true);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                        selectedCategory === cat.key
                          ? 'bg-teal-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat.label}
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

                  {catalogLoading && catalogProducts.length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="w-7 h-7 mx-auto mb-2 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {isAr ? 'جاري تحميل منتجات المتجر...' : 'Loading store products...'}
                      </p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-6 text-center">
                      <AlertCircle className="w-7 h-7 text-amber-500 mx-auto mb-2 opacity-80" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {catalogError
                          ? catalogError
                          : searchQuery.trim()
                            ? isAr
                              ? `لم يتم العثور على منتجات تطابق "${searchQuery}"`
                              : `No products matching "${searchQuery}"`
                            : isAr
                              ? 'لا توجد منتجات في كتالوج هذا المتجر'
                              : 'No products found in this store catalog'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {isAr
                          ? 'يمكنك إضافة هذا العنصر كمنتج مخصص بسعر محدد'
                          : 'You can quickly add this as a custom product with custom pricing'}
                      </p>
                      {searchQuery.trim() ? (
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
                      ) : null}
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
                                  alt={getProductDisplayName(product, locale)}
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
                                  {getProductDisplayName(product, locale)}
                                </h4>
                                {(product.category || product.categoryEn || product.categoryAr) && (
                                  <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    {getProductDisplayCategory(product, locale)}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                <span>
                                  {isAr ? 'رمز المنتج' : 'SKU'}:{' '}
                                  <span className="font-mono">{product.sku || product.id}</span>
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
              <div className={`grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/90 dark:border-slate-750 text-[11px] font-bold text-slate-500 dark:text-slate-400 ${isAr ? '' : 'uppercase tracking-wider'}`}>
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
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {isAr ? 'رمز المنتج' : 'SKU'}:{' '}
                            <span className="font-mono">{item.sku}</span>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {CREATE_ORDER_PAYMENT_OPTIONS.map((pm) => {
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
                        {pm.logoSrc ? (
                          <span className="h-8 w-full flex items-center justify-center rounded-lg bg-white dark:bg-slate-900 px-1.5 py-1 border border-slate-100 dark:border-slate-700">
                            <img
                              src={pm.logoSrc}
                              alt={isAr ? pm.labelAr : pm.labelEn}
                              className="h-6 w-auto max-w-full object-contain"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                const el = e.currentTarget;
                                el.style.display = 'none';
                                const fallback = el.parentElement?.querySelector('[data-pay-fallback]');
                                if (fallback instanceof HTMLElement) fallback.style.display = 'flex';
                              }}
                            />
                            <span
                              data-pay-fallback
                              className="hidden items-center justify-center text-teal-600"
                              aria-hidden
                            >
                              <CreditCard className="h-6 w-6" />
                            </span>
                          </span>
                        ) : (
                          <CreditCard className="h-6 w-6 text-teal-600" />
                        )}
                        <span className="text-[11px] leading-tight text-center">
                          {isAr ? pm.labelAr : pm.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Plan: Full / Partial / Awaiting — one working row */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {isAr ? 'خطة الدفع' : 'Payment Plan'}
                </label>
                <div className="grid grid-cols-3 gap-2 max-w-2xl">
                  <button
                    type="button"
                    onClick={() => selectPaymentMode('full')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      paymentMode === 'full'
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/15 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {commerceTerm('fullPayment', isAr)}
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPaymentMode('partial')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      paymentMode === 'partial'
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/15 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {commerceTerm('partialPayment', isAr)}
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPaymentMode('awaiting')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 ${
                      paymentMode === 'awaiting'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        paymentMode === 'awaiting' ? 'bg-amber-500 ring-2 ring-amber-400/40' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                    <span className="leading-tight text-center">{isAr ? 'بانتظار الدفع' : 'Awaiting payment'}</span>
                  </button>
                </div>
              </div>

              {paymentMode === 'partial' && (
                <div className="flex flex-col gap-3 max-w-xl">
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
                    <div className="px-3 py-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/30 text-sm font-black tabular-nums text-amber-800 dark:text-amber-200">
                      {currencyLabel} {remainingBalance.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
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
                      <div className="w-full max-w-md">
                        <PortalSelect
                          value={driverId}
                          onChange={setDriverId}
                          placeholder={isAr ? 'اختر مندوب التوصيل' : 'Select delivery driver'}
                          className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 font-medium text-start"
                          options={drivers.map((d) => ({
                            value: d.id,
                            label: [
                              (isAr && d.name_ar) || d.name,
                              d.phone || '',
                              d.city || '',
                            ]
                              .filter(Boolean)
                              .join(' · '),
                          }))}
                        />
                      </div>
                    )}
                  </div>
                )}

                {deliveryMode === 'shipping_company' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {commerceTerm('shippingCompany', isAr)}
                    </label>
                    {(() => {
                      type ShipOpt = {
                        id: string;
                        name: string;
                        nameAr: string;
                        baseRate: number;
                        perKgRate: number;
                        estimatedDelivery: string;
                        trackingEnabled: boolean;
                      };
                      const providerLabel = (code: string): { en: string; ar: string } => {
                        const c = code.toLowerCase();
                        if (c === 'smsa') return { en: 'SMSA Express', ar: 'سمسا إكسبريس' };
                        if (c === 'aramex') return { en: 'Aramex', ar: 'أرامكس' };
                        if (c === 'spl') return { en: 'Saudi Post (SPL)', ar: 'البريد السعودي' };
                        if (c === 'dhl') return { en: 'DHL', ar: 'دي إتش إل' };
                        if (c === 'fedex') return { en: 'FedEx', ar: 'فيديكس' };
                        if (c === 'ups') return { en: 'UPS', ar: 'يو بي إس' };
                        return { en: code.toUpperCase(), ar: code.toUpperCase() };
                      };

                      const methodsPool =
                        (currentShippingMethods || []).length > 0
                          ? currentShippingMethods
                          : localShippingMethods;
                      const couriersPool =
                        (currentCouriers || []).length > 0 ? currentCouriers : localCouriers;

                      const seen = new Set<string>();
                      const courierMethods: ShipOpt[] = [];

                      for (const m of methodsPool || []) {
                        if (m.isActive === false) continue;
                        if ((m.fulfillmentMode || 'courier') === 'own_delivery') continue;
                        const key = String(m.courierCode || m.name || m.id)
                          .trim()
                          .toLowerCase();
                        if (!key || seen.has(key)) continue;
                        seen.add(key);
                        courierMethods.push({
                          id: m.id,
                          name: m.name || key,
                          nameAr: m.nameAr || m.name || key,
                          baseRate: Number(m.baseRate) || 0,
                          perKgRate: Number(m.perKgRate) || 0,
                          estimatedDelivery: m.estimatedDelivery || '',
                          trackingEnabled: m.trackingEnabled !== false,
                        });
                      }

                      for (const c of couriersPool || []) {
                        if (!(c.status === 'connected' || c.isConnected === true)) continue;
                        const key = String(c.provider || '').trim().toLowerCase();
                        if (!key || seen.has(key)) continue;
                        seen.add(key);
                        const names = providerLabel(key);
                        courierMethods.push({
                          id: c.id || `courier-${key}`,
                          name: c.accountName || names.en,
                          nameAr: names.ar,
                          baseRate: 0,
                          perKgRate: 0,
                          estimatedDelivery: '',
                          trackingEnabled: true,
                        });
                      }

                      courierMethods.sort((a, b) =>
                        (isAr ? a.nameAr : a.name).localeCompare(isAr ? b.nameAr : b.name),
                      );

                      if (courierMethods.length === 0) {
                        return (
                          <div className="space-y-2 max-w-md">
                            <input
                              type="text"
                              value={shippingCompany}
                              onChange={(e) => setShippingCompany(e.target.value)}
                              placeholder={isAr ? 'مثال: سمسا، أرامكس، سبل' : 'e.g. SMSA, Aramex, SPL'}
                              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 font-medium"
                            />
                            <p className="text-[10px] text-amber-700 dark:text-amber-300">
                              {isAr
                                ? 'لا توجد شركات شحن مفعّلة — فعّلها من إعدادات الشحن أو اكتب الاسم يدوياً.'
                                : 'No enabled shipping companies — enable them in Shipping settings or type a name.'}
                            </p>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-2 w-full max-w-md">
                          <PortalSelect
                            value={
                              courierMethods.find(
                                (x) =>
                                  x.id === shippingCompany ||
                                  x.name === shippingCompany ||
                                  x.nameAr === shippingCompany,
                              )?.id || ''
                            }
                            onChange={(idOrName) => {
                              const m = courierMethods.find(
                                (x) => x.id === idOrName || x.name === idOrName || x.nameAr === idOrName,
                              );
                              if (m) {
                                setShippingFee(Number(m.baseRate) || 0);
                                setShippingCompany(isAr ? m.nameAr || m.name : m.name);
                              } else {
                                setShippingCompany(idOrName);
                              }
                            }}
                            placeholder={isAr ? 'اختر شركة الشحن' : 'Select shipping company'}
                            className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 font-medium text-start"
                            options={courierMethods.map((m) => {
                              const label = isAr ? m.nameAr || m.name : m.name;
                              const fee = Number(m.baseRate) || 0;
                              const perKg = Number(m.perKgRate) || 0;
                              const eta = m.estimatedDelivery || '';
                              const feeBit =
                                fee > 0 || perKg > 0
                                  ? perKg > 0
                                    ? isAr
                                      ? `${fee}ر.س +${perKg}/كجم`
                                      : `${fee} SAR + ${perKg}/kg`
                                    : isAr
                                      ? `${fee}ر.س`
                                      : `${fee} SAR`
                                  : isAr
                                    ? 'مفعّلة'
                                    : 'Enabled';
                              return {
                                value: m.id,
                                label: `${label} · ${feeBit}${eta ? ` · ${eta}` : ''}${
                                  m.trackingEnabled ? (isAr ? ' · تتبع' : ' · Track') : ''
                                }`,
                              };
                            })}
                          />
                          <p className="text-[10px] text-slate-500">
                            {isAr
                              ? `كل شركات الشحن المفعّلة (${courierMethods.length}) — الرسوم من إعدادات الشحن.`
                              : `All enabled shipping companies (${courierMethods.length}) — fees from Shipping settings.`}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Shipping Address + modern Saudi Google Map */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'عنوان التوصيل والحي' : 'Delivery Address & District'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <p className="mb-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'الخيار ١: اسحب الدبوس للتثبيت دون كتابة — الخيار ٢: اكتب العنوان للبحث'
                  : 'Option 1: drag the pin to lock with no typing — Option 2: type to search'}
              </p>
              {/* Hidden required: typed address OR map pin is enough */}
              <input
                type="text"
                required={deliveryMethod === 'delivery' && !deliveryGeo && !shippingAddress.trim()}
                value={shippingAddress || (deliveryGeo ? `${deliveryGeo.lat},${deliveryGeo.lng}` : '')}
                onChange={(e) => setShippingAddress(e.target.value)}
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
                disabled={deliveryMethod === 'pickup'}
              />
              <DeliveryLiveMapPin
                isAr={isAr}
                address={shippingAddress}
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
                <span className="font-semibold">
                  {isAr ? 'ضريبة القيمة المضافة (١٥٪ مشمولة)' : 'Value Added Tax (15% included)'}
                </span>
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

              {(paymentMode === 'partial' || paymentMode === 'awaiting') && (
                <div className="pt-2 flex justify-between items-center text-xs">
                  <span className="font-black text-amber-800 dark:text-amber-200">
                    {commerceTerm('remainingBalance', isAr)}
                  </span>
                  <span className="text-base font-black tabular-nums text-amber-800 dark:text-amber-200">
                    {currencyLabel} {remainingBalance.toFixed(2)}
                  </span>
                </div>
              )}
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
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 sticky bottom-0 z-30">
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
            className="px-6 py-2.5 rounded-xl unity-btn-primary active:scale-95 text-white text-xs font-black flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
