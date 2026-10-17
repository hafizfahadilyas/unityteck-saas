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
  Smartphone,
  Banknote,
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
import { HADAAYA_MAKKAH_PRODUCTS } from '../../data/hadayaMeccaData';
import type { Order, Product } from '../../types';
import { handleImageError, FALLBACK_PRODUCT_IMAGE } from '../../utils/imageFallback';
import { getProductDisplayCategory } from '../../utils/storeLocalization';

export interface CreateStoreOrderModalProps {
  isOpen?: boolean;
  storeName?: string;
  storeId?: string;
  products?: Product[];
  onClose: () => void;
  onCreate: (orderData: Partial<Order>) => void;
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
  const { currentProducts, allProducts, activeStore } = useTenant();
  const resolvedStoreId = storeId || activeStore?.id;
  
  const catalogProducts: Product[] = useMemo(() => {
    if (propProducts && propProducts.length > 0) return propProducts;
    if (resolvedStoreId && allProducts[resolvedStoreId] && allProducts[resolvedStoreId].length > 0) {
      return allProducts[resolvedStoreId];
    }
    if (currentProducts && currentProducts.length > 0) {
      return currentProducts;
    }
    return HADAAYA_MAKKAH_PRODUCTS;
  }, [propProducts, resolvedStoreId, allProducts, currentProducts]);

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
    deliveryMethod,
    setDeliveryMethod,
    shippingFee,
    setShippingFee,
    shippingAddress,
    setShippingAddress,
    subtotal,
    effectiveShippingFee,
    tax,
    grandTotal,
    isValid,
    getOrderPayload,
  } = useManualOrderForm({
    initialShippingFee: 15.0,
    taxRate: 0.15,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = getOrderPayload(resolvedStoreId);
      onCreate(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCountry = COUNTRY_OPTIONS.find((c) => c.code === countryCode) || COUNTRY_OPTIONS[0];

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh] text-slate-800 dark:text-slate-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── TOP HEADER ── */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/90 flex items-center justify-between bg-gradient-to-r from-white via-slate-50/40 to-teal-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/20 sticky top-0 z-30">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black shadow-sm">
                <Store className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {isAr ? 'إنشاء طلب يدوي جديد للمتجر' : 'Create Store Order'}
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
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
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
                  placeholder={isAr ? 'سارة عبد العزيز الشريف' : 'Sara Al-Sharif'}
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
                      ? 'ابحث باسم المنتج، رمز SKU، التصنيف، أو الكلمات المفتاحية...'
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
                                <span>SKU: {product.sku || product.id}</span>
                                <span>•</span>
                                {isOutOfStock ? (
                                  <span className="text-rose-500 font-sans font-bold">
                                    {isAr ? 'نفذت الكمية' : 'Out of Stock'}
                                  </span>
                                ) : isLowStock ? (
                                  <span className="text-amber-500 font-sans font-bold">
                                    {isAr ? `متبقي ${stockCount} فقط` : `${stockCount} left`}
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

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectProduct(product);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all ${
                                qtyInOrder > 0
                                  ? 'bg-teal-600 text-white hover:bg-teal-700'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-teal-600 hover:text-white'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{qtyInOrder > 0 ? `${qtyInOrder} ${isAr ? 'مضاف' : 'in order'}` : isAr ? 'إضافة' : 'Add'}</span>
                            </button>
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
                            SKU: {item.sku}
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

          {/* ════ SECTION 3: PAYMENT METHOD & STATUS ════ */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shadow-2xs border border-teal-100/60 dark:border-teal-900/40">
                <CreditCard className="w-4 h-4" />
              </span>
              <h3 className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                {isAr ? 'طريقة وحالة الدفع' : 'Payment Method & Status'}
              </h3>
            </div>

            <div className="space-y-3.5">
              {/* Payment Method Tiles */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {isAr ? 'طريقة الدفع المختارة' : 'Selected Payment Method'} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { id: 'mada', labelEn: 'mada', labelAr: 'مدى', icon: 'mada' },
                    { id: 'apple', labelEn: 'Apple Pay', labelAr: 'أبل باي', icon: 'apple' },
                    { id: 'visa', labelEn: 'Visa / MC', labelAr: 'فيزا / ماستركارد', icon: 'card' },
                    { id: 'stc', labelEn: 'stc pay', labelAr: 'اس تي سي باي', icon: 'stc' },
                    { id: 'cash', labelEn: 'Cash on Delivery', labelAr: 'الدفع عند الاستلام', icon: 'cash' },
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
                        {pm.id === 'mada' && (
                          <span className="w-5 h-4 bg-emerald-600 text-[9px] font-black text-white rounded-xs flex items-center justify-center">
                            M
                          </span>
                        )}
                        {pm.id === 'apple' && <Smartphone className="w-4 h-4 text-slate-800 dark:text-slate-200" />}
                        {pm.id === 'visa' && <CreditCard className="w-4 h-4 text-blue-600" />}
                        {pm.id === 'stc' && (
                          <span className="px-1 py-0.2 bg-purple-600 text-[8px] font-black text-white rounded-xs">
                            stc
                          </span>
                        )}
                        {pm.id === 'cash' && <Banknote className="w-4 h-4 text-emerald-600" />}
                        <span className="text-[11px] leading-tight text-center">
                          {isAr ? pm.labelAr : pm.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

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
                    <span>{isAr ? 'بانتظار التحصيل / الدفع' : 'Pending Payment'}</span>
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
                    onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none bg-transparent disabled:opacity-40 disabled:cursor-not-allowed font-medium tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
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
                <span className="font-semibold">{isAr ? 'ضريبة القيمة المضافة (15% VAT)' : 'Value Added Tax (15% VAT)'}</span>
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

        {/* ── STICKY FOOTER ACTIONS ── */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-end gap-3 sticky bottom-0 z-30">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
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
    </div>
  );
};

export default CreateStoreOrderModal;
