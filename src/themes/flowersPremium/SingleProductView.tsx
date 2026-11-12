import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight,
  Star,
  Flame,
  Clock,
  Truck,
  ShieldCheck,
  RotateCcw,
  ShoppingCart,
  MessageCircle,
  Eye,
  Plus,
  Minus,
  Play,
  Heart,
  Share2,
  Sparkles,
  MapPin,
  X,
  Package,
  Zap,
} from 'lucide-react';
import type { Product, ProductVariation, ShippingRate } from '../../types';
import { whatsappOrderHref } from './WhatsAppChatFab';
import { effectiveProductPricing } from '../../utils/productSaleSchedule';
import { isVariantPurchasable, variationOptionsLabel } from '../../utils/productVariants';
import { ProductDynamicPurchase } from '../../components/storefront/ProductDynamicPurchase';
import {
  fetchStoreReviews,
  submitStoreReviewApi,
  type StoreReviewRow,
} from '../../api/tenantApi';
import type { FieldValueMap } from '../../utils/storefrontPurchase';
import {
  customFieldsExtra,
  missingRequiredField,
  resolveSelectionPrice,
} from '../../utils/storefrontPurchase';
import { pickLocaleText } from '../../utils/localeLabel';

export type FlowersVariationPick = {
  variationId?: string | null;
  selectedOptions?: Record<string, string> | null;
  unitPrice?: number;
  label?: string;
};

type Props = {
  product: Product;
  products: Product[];
  lang: string;
  money: (amount: number) => string;
  onAddToCart: (p: Product, qty: number, pick?: FlowersVariationPick) => void;
  onBuyNow: (p: Product, qty: number, pick?: FlowersVariationPick) => void;
  onBackToShop: () => void;
  onSelectCategory: (category: string) => void;
  onSelectProduct: (p: Product) => void;
  onOpenLightbox: (p: Product) => void;
  inWishlist: boolean;
  onToggleWishlist: () => void;
  shippingRates: ShippingRate[];
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  videoUrl?: string;
};

export const SingleProductView: React.FC<Props> = ({
  product,
  products,
  lang,
  money,
  onAddToCart,
  onBuyNow,
  onBackToShop,
  onSelectCategory,
  onSelectProduct,
  onOpenLightbox,
  inWishlist,
  onToggleWishlist,
  shippingRates,
  selectedDistrict,
  onSelectDistrict,
  videoUrl,
}) => {
  const isAr = lang === 'ar';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [product.id]);

  const apiVariations = (product.variations || []).filter((v) => v.isActive !== false);
  const firstBuyable =
    apiVariations.find((v) => isVariantPurchasable(v, 1)) || apiVariations[0] || null;
  const [selectedVarId, setSelectedVarId] = useState<string | null>(firstBuyable?.id || null);

  useEffect(() => {
    const rows = (product.variations || []).filter((v) => v.isActive !== false);
    const pick = rows.find((v) => isVariantPurchasable(v, 1)) || rows[0] || null;
    setSelectedVarId(pick?.id || null);
  }, [product.id, product.variations]);

  const selectedVariation: ProductVariation | undefined = apiVariations.find(
    (v) => v.id === selectedVarId,
  );
  const pricing = effectiveProductPricing(product);
  const [optionPick, setOptionPick] = useState<Record<string, string>>({});
  const [fieldValues, setFieldValues] = useState<FieldValueMap>({});
  const [reviews, setReviews] = useState<StoreReviewRow[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3'>('1:1');
  const [imageDisplayMode, setImageDisplayMode] = useState<'cover' | 'contain'>('cover');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews' | 'shipping'>('desc');
  const [saleLeft, setSaleLeft] = useState<{ h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    setOptionPick({});
    setFieldValues({});
    setQty(1);
    setActiveImageIndex(0);
  }, [product.id]);

  useEffect(() => {
    const storeId = product.storeId;
    if (!storeId || !product.id) {
      setReviews([]);
      return;
    }
    let cancelled = false;
    setReviewsLoading(true);
    void fetchStoreReviews(storeId, { productId: product.id, approvedOnly: true })
      .then((rows) => {
        if (!cancelled) setReviews(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [product.storeId, product.id]);

  const selection = resolveSelectionPrice(
    pricing.price,
    product.productOptions || [],
    optionPick,
    product.variations,
  );
  const variationPrice =
    selectedVariation?.price != null
      ? Number(selectedVariation.price)
      : selection.variant?.price != null
        ? Number(selection.variant.price)
        : selection.selling;
  const fieldsExtra = customFieldsExtra(
    product.customFields || [],
    fieldValues,
    product.conditionalRules,
    optionPick,
  );
  const currentPrice = variationPrice + fieldsExtra;
  const originalPrice =
    selectedVariation?.compareAtPrice != null &&
    Number(selectedVariation.compareAtPrice) > variationPrice
      ? Number(selectedVariation.compareAtPrice) + fieldsExtra
      : selection.mrp != null && selection.mrp > variationPrice
        ? selection.mrp + fieldsExtra
        : pricing.compareAt != null
          ? pricing.compareAt + fieldsExtra
          : null;
  const discountPct =
    originalPrice != null && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : null;

  const galleryImages = useMemo(() => {
    const urls = [
      selectedVariation?.imageUrl || '',
      product.image,
      ...(product.galleryUrls || []),
      ...(product.additionalImages || []),
    ].filter((u) => u && String(u).trim());
    return Array.from(new Set(urls));
  }, [selectedVariation?.imageUrl, product.image, product.galleryUrls, product.additionalImages]);

  const productCategories = useMemo(() => {
    const list = product.categories?.length
      ? product.categories
      : product.category
        ? [product.category]
        : [];
    return Array.from(new Set(list.filter((c) => c && String(c).trim())));
  }, [product.categories, product.category]);

  const displayName = pickLocaleText(isAr, product.name, product.nameAr);
  const displaySubtitle = pickLocaleText(isAr, product.subtitle || '', product.subtitleAr || '');

  const stockQty =
    selectedVariation != null
      ? selectedVariation.unlimitedStock
        ? null
        : Number(selectedVariation.stock ?? 0)
      : Number(product.stock ?? 0);
  const inStock =
    selectedVariation != null
      ? isVariantPurchasable(selectedVariation, qty)
      : (product.stock ?? 0) > 0 ||
        (product.variations || []).some(
          (v) => v.isActive !== false && (v.unlimitedStock || (v.stock ?? 0) > 0),
        );

  /** Real sale-end countdown only — never invent flash timers */
  useEffect(() => {
    if (!pricing.saleActive || !product.discountEndAt) {
      setSaleLeft(null);
      return;
    }
    const tick = () => {
      const end = Date.parse(product.discountEndAt!);
      if (Number.isNaN(end)) {
        setSaleLeft(null);
        return;
      }
      const diff = Math.max(0, end - Date.now());
      if (diff <= 0) {
        setSaleLeft(null);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setSaleLeft({ h, m, s });
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [pricing.saleActive, product.discountEndAt]);

  const avgRating = useMemo(() => {
    const rated = reviews.filter((r) => Number(r.rating) > 0);
    if (!rated.length) return null;
    const sum = rated.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return Math.round((sum / rated.length) * 10) / 10;
  }, [reviews]);

  const currentVarLabel = variationOptionsLabel(selectedVariation?.options, isAr);
  const variationPick: FlowersVariationPick | undefined = selectedVariation
    ? {
        variationId: selectedVariation.id,
        selectedOptions: { ...(selectedVariation.options || {}), ...optionPick },
        unitPrice: currentPrice,
        label: currentVarLabel,
      }
    : Object.keys(optionPick).length
      ? {
          selectedOptions: optionPick,
          unitPrice: currentPrice,
          label: Object.values(optionPick).join(' / '),
        }
      : undefined;
  const canBuy =
    inStock &&
    !missingRequiredField(
      product.customFields || [],
      fieldValues,
      product.conditionalRules,
      optionPick,
      isAr,
    );

  const whatsappMessage = [
    isAr ? 'السلام عليكم ورحمة الله،' : 'Hello,',
    isAr
      ? `أرغب بطلب منتج: *${displayName}*`
      : `I would like to order: *${displayName}*`,
    currentVarLabel ? `${isAr ? 'الخيار' : 'Option'}: ${currentVarLabel}` : '',
    `${isAr ? 'الكمية' : 'Qty'}: ${qty}`,
    `${isAr ? 'السعر الإجمالي' : 'Total'}: ${money(currentPrice * qty)}`,
    `${isAr ? 'حي التوصيل في مكة' : 'Makkah District'}: ${selectedDistrict}`,
    isAr ? 'مع خدمة توصيل سيارات مبردة 18°C' : 'With chilled delivery 18°C',
  ].filter(Boolean);

  const whatsappLink = whatsappOrderHref(lang, whatsappMessage);

  // Aspect ratio classes
  const aspectClass =
    aspectRatio === '1:1'
      ? 'aspect-square'
      : aspectRatio === '3:4'
        ? 'aspect-3/4'
        : 'aspect-4/3';

  // Related products — same category / brand from live catalog only
  const relatedProducts = products
    .filter((p) => {
      if (p.id === product.id) return false;
      const cats = [
        p.category,
        ...(Array.isArray(p.categories) ? p.categories : []),
      ].filter(Boolean);
      const overlap = productCategories.some((c) => cats.includes(c));
      return overlap || (product.brand && p.brand === product.brand);
    })
    .slice(0, 4);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* 1. Breadcrumbs & Back Navigation */}
      <div className="flex items-center justify-between gap-3 text-xs flex-wrap border-b pb-4" style={{ borderColor: 'var(--sf-border)' }}>
        <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--sf-muted)' }}>
          <button
            type="button"
            onClick={onBackToShop}
            className="hover:text-emerald-600 transition-colors cursor-pointer"
          >
            {isAr ? 'المتجر' : 'Shop'}
          </button>
          <span>/</span>
          {productCategories[0] ? (
            <button
              type="button"
              onClick={() => {
                onSelectCategory(productCategories[0]);
                onBackToShop();
              }}
              className="hover:text-emerald-600 transition-colors cursor-pointer"
            >
              {productCategories[0]}
            </button>
          ) : null}
          {productCategories[0] ? <span>/</span> : null}
          <span className="truncate max-w-[200px] sm:max-w-xs text-slate-900 dark:text-white">
            {displayName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleWishlist}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={inWishlist ? (isAr ? 'محفوظ في المفضلة' : 'In Wishlist') : (isAr ? 'إضافة للمفضلة' : 'Add to Wishlist')}
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-500 text-rose-500' : 'text-slate-600 dark:text-slate-400'}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: displayName, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isAr ? 'مشاركة المنتج' : 'Share Product'}
          >
            <Share2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* 2. Sale countdown — only when scheduled sale window is active */}
      {saleLeft && pricing.saleActive ? (
        <div
          className="rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold shadow-xs border"
          style={{
            background: 'linear-gradient(90deg, #032320 0%, #064e3b 100%)',
            color: '#ffffff',
            borderColor: '#059669',
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 animate-pulse">
              <Flame className="w-4 h-4 fill-current text-rose-400" />
            </span>
            <div>
              <span className="text-amber-300 font-black">
                {isAr ? 'عرض خاص ينتهي قريباً' : 'Sale ending soon'}
              </span>
              {discountPct != null ? (
                <span className="opacity-90 block sm:inline sm:ms-2 text-[11px] font-normal">
                  {isAr ? `خصم ${discountPct}%` : `${discountPct}% off`}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-[10px] uppercase font-sans opacity-80 me-1">
              {isAr ? 'ينتهي العرض:' : 'Ends in:'}
            </span>
            <span className="px-2 py-1 rounded-md bg-black/40 text-amber-300 font-black">
              {String(saleLeft.h).padStart(2, '0')}h
            </span>
            <span>:</span>
            <span className="px-2 py-1 rounded-md bg-black/40 text-amber-300 font-black">
              {String(saleLeft.m).padStart(2, '0')}m
            </span>
            <span>:</span>
            <span className="px-2 py-1 rounded-md bg-black/40 text-amber-300 font-black">
              {String(saleLeft.s).padStart(2, '0')}s
            </span>
          </div>
        </div>
      ) : null}

      {/* 3. Main Single Product Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Gallery & View Controls (cols 12 -> 6) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Showcase Image */}
          <div
            className={`w-full ${aspectClass} rounded-3xl overflow-hidden border shadow-md relative bg-slate-100 dark:bg-slate-800 group`}
            style={{ borderColor: 'var(--sf-border)' }}
          >
            <img
              src={galleryImages[activeImageIndex] || product.image}
              alt={displayName}
              className={`w-full h-full ${
                imageDisplayMode === 'cover' ? 'object-cover' : 'object-contain'
              } transition-transform duration-500 group-hover:scale-105`}
            />

            {/* Badges Overlay — real sale % / merchant badge only */}
            <div className="absolute top-4 start-4 flex flex-col gap-2 z-10">
              {discountPct != null && pricing.saleActive ? (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-md flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>{isAr ? `خصم ${discountPct}%` : `${discountPct}% OFF`}</span>
                </span>
              ) : null}
              {product.brand ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-900/80 text-white backdrop-blur-md">
                  {product.brand}
                </span>
              ) : null}
              {product.badge && product.badge !== 'No' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-700/90 text-white backdrop-blur-md">
                  {product.badge}
                </span>
              ) : null}
            </div>

            {/* Quick Actions (Zoom Lightbox & Video) */}
            <div className="absolute bottom-4 end-4 flex items-center gap-2 z-10">
              {videoUrl && (
                <button
                  type="button"
                  onClick={() => setShowVideoModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-white text-xs font-black flex items-center gap-1.5 shadow-lg backdrop-blur-md cursor-pointer transition-all hover:scale-105"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                  <span>{isAr ? 'فيديو المنتج' : 'Watch Video'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenLightbox(product)}
                className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-900 shadow-lg backdrop-blur-md cursor-pointer transition-all hover:scale-105"
                title={isAr ? 'تكبير الصورة' : 'Zoom Image'}
              >
                <Eye className="w-4 h-4 text-emerald-700" />
              </button>
            </div>
          </div>

          {/* Aspect Ratio & Mode Toggle Controls (Selia Spec) */}
          <div className="flex items-center justify-between text-xs px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase">{isAr ? 'أبعاد الصورة:' : 'Aspect:'}</span>
              {(['1:1', '3:4', '4:3'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setAspectRatio(r)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    aspectRatio === r
                      ? 'bg-emerald-600 text-white'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase">{isAr ? 'العرض:' : 'Mode:'}</span>
              <button
                type="button"
                onClick={() => setImageDisplayMode(imageDisplayMode === 'cover' ? 'contain' : 'cover')}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 hover:text-emerald-600 transition-colors cursor-pointer"
              >
                {imageDisplayMode === 'cover' ? (isAr ? 'قص الهوامش تغطية' : 'Cover') : (isAr ? 'كامل بدون قص احتواء كامل' : 'Contain')}
              </button>
            </div>
          </div>

          {/* Gallery Thumbnails */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200 shrink-0 ${
                  activeImageIndex === idx
                    ? 'border-emerald-600 ring-2 ring-emerald-500/30 scale-102'
                    : 'border-slate-200 dark:border-slate-700 opacity-75 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

        </div>

        {/* Right: Product Details, Variations, CTAs (cols 12 -> 6) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Brand & Category & SKU */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
              {productCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    onSelectCategory(cat);
                    onBackToShop();
                  }}
                  className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold tracking-wider cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-900"
                >
                  {cat}
                </button>
              ))}
              {product.sku ? (
                <>
                  {productCategories.length > 0 ? <span className="text-slate-400">·</span> : null}
                  <span className="text-slate-500 dark:text-slate-400 font-bold">{product.sku}</span>
                </>
              ) : null}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight" style={{ color: 'var(--sf-text)' }}>
              {displayName}
            </h1>

            {displaySubtitle ? (
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                {displaySubtitle}
              </p>
            ) : null}
          </div>

          {(avgRating != null || reviews.length > 0 || (typeof product.salesCount === 'number' && product.salesCount > 0)) ? (
          <div className="flex items-center gap-3 text-xs flex-wrap">
            {avgRating != null ? (
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-amber-400/30'}`} />
              ))}
              <span className="font-black text-slate-800 dark:text-slate-200 ms-1.5">{avgRating}</span>
            </div>
            ) : null}

            {reviews.length > 0 ? (
            <>
            {avgRating != null ? <span className="text-slate-300 dark:text-slate-700">|</span> : null}
            <span className="font-bold text-slate-600 dark:text-slate-400">
              {reviews.length} {isAr ? 'تقييم' : 'reviews'}
            </span>
            </>
            ) : null}

            {typeof product.salesCount === 'number' && product.salesCount > 0 ? (
            <>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-rose-600 font-black flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{product.salesCount} {isAr ? 'تم بيعها' : 'sold'}</span>
            </span>
            </>
            ) : null}
          </div>
          ) : null}

          {/* Pricing Row */}
          <div className="flex items-baseline gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {money(currentPrice * qty)}
            </span>
            {originalPrice != null && Number(originalPrice) > currentPrice ? (
              <span className="text-base text-slate-400 line-through">
                {money(Number(originalPrice) * qty)}
              </span>
            ) : null}
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full ms-auto">
              {isAr ? 'شامل الضريبة 15%' : 'Includes 15% VAT'}
            </span>
          </div>

          {/* Real stock from catalog / selected variation */}
          <p
            className={`text-xs font-bold ${
              inStock ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'
            }`}
          >
            {inStock
              ? stockQty == null
                ? isAr
                  ? 'متوفر'
                  : 'In stock'
                : isAr
                  ? `متوفر — ${stockQty} قطعة`
                  : `In stock — ${stockQty} units`
              : isAr
                ? 'غير متوفر'
                : 'Out of stock'}
          </p>

          {/* Product Options / Variations Selector */}
          {apiVariations.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider block text-slate-700 dark:text-slate-300">
                {isAr ? 'خيارات المنتج:' : 'Product options:'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {apiVariations.map((v) => {
                  const active = selectedVarId === v.id;
                  const label = variationOptionsLabel(v.options, isAr) || v.sku;
                  const vPrice = v.price != null ? Number(v.price) : pricing.price;
                  const buyable = isVariantPurchasable(v, 1);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={!buyable}
                      onClick={() => buyable && setSelectedVarId(v.id)}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                        !buyable
                          ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800'
                          : active
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs cursor-pointer'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300 cursor-pointer'
                      }`}
                    >
                      <span>{label}</span>
                      <span className="text-[10px] text-muted">
                        {buyable
                          ? money(vPrice)
                          : isAr
                            ? 'غير متوفر'
                            : 'Out of stock'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <ProductDynamicPurchase
            options={product.productOptions || []}
            variations={product.variations}
            fields={product.customFields}
            rules={product.conditionalRules}
            selected={optionPick}
            onSelect={setOptionPick}
            fieldValues={fieldValues}
            onFieldValues={setFieldValues}
            isAr={isAr}
            tone="mecca"
            basePrice={currentPrice}
          />

          {/* Makkah District Delivery Selector Box */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isAr ? 'التوصيل المباشر في مكة المكرمة:' : 'Deliver to Makkah District:'}</span>
            </div>

            <select
              value={selectedDistrict}
              onChange={(e) => onSelectDistrict(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500"
            >
              {shippingRates.map((s) => (
                <option key={s.id} value={s.cityName}>
                  {s.cityName} — ({s.rate === 0 ? (isAr ? 'شحن مجاني' : 'Free Delivery') : money(s.rate)})
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'سيارات مجهزة تبريد 18°C' : 'Chilled 18°C Fleet'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{isAr ? 'توصيل خلال ساعتين' : '2-hour express delivery'}</span>
              </div>
            </div>
          </div>

          {/* Quantity & CTA Buttons (Add to Cart, Buy Now, WhatsApp) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAr ? 'الكمية:' : 'Quantity:'}
              </span>
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-black text-sm">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!canBuy}
                onClick={() => canBuy && onAddToCart(product, qty, variationPick)}
                className="py-3.5 px-5 rounded-2xl border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{isAr ? 'إضافة إلى السلة' : 'Add to Cart'}</span>
              </button>

              <button
                type="button"
                disabled={!canBuy}
                onClick={() => canBuy && onBuyNow(product, qty, variationPick)}
                className="py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                <span>{isAr ? 'شراء فوري الآن' : 'Buy Now'}</span>
              </button>
            </div>

            {/* Order on WhatsApp Button */}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>{isAr ? 'اطلب فوراً عبر واتساب مع التفاصيل' : 'Order via WhatsApp (Instant)'}</span>
            </a>
          </div>

          {/* Guarantees List */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isAr ? 'ضمان نضارة الزهور 100%' : '100% Freshness Guarantee'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{isAr ? 'كرت إهداء عربي فاخر مجاناً' : 'Free luxury greeting card'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Information Tabs (Description, Specs, Reviews, Shipping) */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2 scrollbar-none">
          {(
            [
              ['desc', isAr ? 'الوصف والتفاصيل' : 'Description'],
              ['specs', isAr ? 'المواصفات الفنية' : 'Specifications'],
              [
                'reviews',
                isAr
                  ? `تقييمات العملاء${reviews.length ? ` (${reviews.length})` : ''}`
                  : `Customer Reviews${reviews.length ? ` (${reviews.length})` : ''}`,
              ],
              ['shipping', isAr ? 'التوصيل والإرجاع' : 'Shipping & Returns'],
            ] as const
          ).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'desc' && (
          <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {product.description?.trim() ? (
              /<[a-z][\s\S]*>/i.test(product.description) ? (
                <div
                  className="rich-text-content leading-relaxed text-slate-600 dark:text-slate-300 [&_ul]:list-disc [&_ul]:ps-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ps-5 [&_ol]:my-2 [&_a]:text-emerald-600 [&_a]:underline [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_u]:underline [&_h1]:text-2xl [&_h1]:font-black [&_h1]:my-3 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:my-2.5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2 [&_h4]:text-base [&_h4]:font-bold [&_h4]:my-2 [&_h5]:text-sm [&_h5]:font-bold [&_h5]:my-1.5 [&_h6]:text-xs [&_h6]:font-bold [&_h6]:my-1.5 [&_p]:my-2 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-3 [&_video]:max-w-full [&_video]:rounded-xl [&_video]:my-3 [&_iframe]:max-w-full [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl [&_iframe]:my-3"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="whitespace-pre-line">{product.description}</p>
              )
            ) : (
              <p className="text-slate-500 dark:text-slate-400">
                {isAr ? 'لا يوجد وصف لهذا المنتج بعد' : 'No description yet'}
              </p>
            )}
            {product.tags && product.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              [isAr ? 'بلد المنشأ' : 'Country of Origin', product.countryOfOrigin],
              [isAr ? 'العلامة التجارية' : 'Brand', product.brand],
              [
                isAr ? 'الوزن' : 'Weight',
                product.weightKg != null && Number(product.weightKg) > 0
                  ? `${product.weightKg} kg`
                  : null,
              ],
              [isAr ? 'رمز المنتج' : 'SKU', product.sku],
              [
                isAr ? 'التصنيفات' : 'Categories',
                productCategories.length ? productCategories.join(', ') : null,
              ],
            ]
              .filter(([, v]) => v != null && String(v).trim() !== '')
              .map(([label, value]) => (
                <div
                  key={String(label)}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between gap-3"
                >
                  <span className="font-bold text-muted">{label}:</span>
                  <span className="font-black text-slate-900 dark:text-white text-end">{value}</span>
                </div>
              ))}
            {[
              product.countryOfOrigin,
              product.brand,
              product.weightKg,
              product.sku,
              productCategories.length,
            ].every((v) => !v) ? (
              <p className="text-slate-500 col-span-full text-center py-4">
                {isAr ? 'لا توجد مواصفات بعد' : 'No specifications yet'}
              </p>
            ) : null}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviewsLoading ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                {isAr ? 'جاري التحميل…' : 'Loading…'}
              </p>
            ) : null}
            {avgRating != null ? (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
                <div className="text-center">
                  <span className="text-3xl font-black text-amber-600">{avgRating}</span>
                  <div className="flex items-center text-amber-400 mt-1 justify-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < Math.round(avgRating) ? 'fill-current' : 'opacity-30'}`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                  {isAr ? `${reviews.length} تقييم` : `${reviews.length} reviews`}
                </span>
              </div>
            ) : null}

            {reviews.length > 0 ? (
              <ul className="space-y-3">
                {reviews.map((rev) => (
                  <li
                    key={rev.id || `${rev.author}-${rev.date}`}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-bold">{rev.author || (isAr ? 'عميل' : 'Customer')}</span>
                      {rev.verified ? (
                        <span className="text-[10px] font-bold text-emerald-600">
                          {isAr ? 'شراء موثق' : 'Verified purchase'}
                        </span>
                      ) : null}
                      {rev.rating ? (
                        <span className="text-amber-500 font-bold">{'★'.repeat(Number(rev.rating))}</span>
                      ) : null}
                    </div>
                    <p className="text-sm mt-1 text-slate-600 dark:text-slate-300">
                      {isAr ? rev.commentAr || rev.comment : rev.comment || rev.commentAr}
                    </p>
                    {(rev.media_urls?.length || rev.image_url) ? (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {(rev.media_urls?.length
                          ? rev.media_urls
                          : rev.image_url
                            ? [rev.image_url]
                            : []
                        ).map((url) => (
                          <img key={url} src={url} alt="" className="w-14 h-14 rounded-lg object-cover border" />
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : !reviewsLoading ? (
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 py-4 text-center">
                {isAr ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
              </p>
            ) : null}

            <form
              className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!product.storeId || !reviewAuthor.trim() || !reviewComment.trim()) return;
                setReviewBusy(true);
                setReviewMsg(null);
                try {
                  await submitStoreReviewApi(product.storeId, {
                    author: reviewAuthor.trim(),
                    comment: reviewComment.trim(),
                    commentAr: reviewComment.trim(),
                    rating: reviewRating,
                    product: product.name || product.id,
                    productAr: product.nameAr || product.name,
                    product_id: product.id,
                  } as never);
                  setReviewAuthor('');
                  setReviewComment('');
                  setReviewRating(5);
                  setReviewMsg(
                    isAr
                      ? 'تم إرسال التقييم — يظهر بعد موافقة المتجر'
                      : 'Review submitted — appears after store approval',
                  );
                } catch {
                  setReviewMsg(isAr ? 'تعذر إرسال التقييم' : 'Could not submit review');
                } finally {
                  setReviewBusy(false);
                }
              }}
            >
              <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                {isAr ? 'اكتب تقييمك' : 'Write a review'}
              </p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setReviewRating(n)}
                    className={`p-1 ${n <= reviewRating ? 'text-amber-500' : 'text-slate-300'}`}
                  >
                    <Star className={`w-4 h-4 ${n <= reviewRating ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
              <input
                value={reviewAuthor}
                onChange={(e) => setReviewAuthor(e.target.value)}
                placeholder={isAr ? 'الاسم' : 'Your name'}
                className="w-full px-3 py-2 rounded-xl border text-xs"
                required
              />
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={isAr ? 'اكتب رأيك…' : 'Your review…'}
                className="w-full px-3 py-2 rounded-xl border text-xs min-h-[72px]"
                required
              />
              <button
                type="submit"
                disabled={reviewBusy}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50"
              >
                {reviewBusy
                  ? isAr
                    ? 'جاري الإرسال…'
                    : 'Submitting…'
                  : isAr
                    ? 'إرسال التقييم'
                    : 'Submit review'}
              </button>
              {reviewMsg ? <p className="text-xs text-emerald-700">{reviewMsg}</p> : null}
            </form>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              {isAr
                ? 'يتم توصيل جميع طلبات مكة المكرمة عبر أسطول سيارات مجهزة بنظام تبريد حراري (18 درجة مئوية) لضمان عدم تأثر البتلات بأشعة الشمس أثناء النقل.'
                : 'All orders in Makkah are dispatched inside climate-controlled chilled vans at 18°C.'}
            </p>
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isAr ? 'المنطقة المركزية وفنادق الحرم: توصيل خلال ساعتين' : 'Central Haram Hotels: 2-hour express delivery'}</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isAr ? 'سياسة استبدال فورية خلال ساعتين عند وصول أي تلف' : 'Immediate replacement within 2 hours if affected during transit'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Related Products Carousel / Grid */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black" style={{ color: 'var(--sf-text)' }}>
              {isAr ? 'قد يعجبك أيضاً' : 'You May Also Like'}
            </h3>
            <button
              type="button"
              onClick={onBackToShop}
              className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isAr ? 'عرض الكل' : 'View All'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProduct(p)}
                className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2 cursor-pointer hover:shadow-md transition-all hover:-translate-y-1"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  {(() => {
                    const rp = effectiveProductPricing(p);
                    if (!rp.saleActive || !rp.compareAt || rp.compareAt <= rp.price) return null;
                    const pct = Math.round(((rp.compareAt - rp.price) / rp.compareAt) * 100);
                    return (
                      <span className="absolute top-2 start-2 px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white">
                        {isAr ? `خصم ${pct}%` : `${pct}% OFF`}
                      </span>
                    );
                  })()}
                </div>
                <div>
                  <h4 className="font-bold text-xs truncate text-slate-900 dark:text-white">
                    {pickLocaleText(isAr, p.name, p.nameAr)}
                  </h4>
                  <p className="text-[11px] font-black text-emerald-600">
                    {money(effectiveProductPricing(p).price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-black rounded-3xl overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <video
              src={videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-blooming-flowers-in-spring-41221-large.mp4'}
              controls
              autoPlay
              className="w-full aspect-video object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};
