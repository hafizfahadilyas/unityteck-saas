import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { ProductColor, StorageOption, WarrantyOption, BundleOption } from '../types';
import {
  Star,
  ShieldCheck,
  Truck,
  ShoppingBag,
  Zap,
  Gift,
  Award,
  Coins,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Headphones,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ThumbsUp,
  CheckCircle2,
  Layers,
  Flame,
  Gauge,
  Send,
  Coffee,
  RotateCcw,
  Mail,
  Clock,
  Tag,
} from 'lucide-react';
import { TabbyIcon, TamaraIcon, MadaIcon, ApplePayIcon, VisaIcon, MastercardIcon } from './PaymentIcons';
import { ProductComparisonSection } from './ProductComparisonSection';
import { GroupChildrenComparison } from './GroupChildrenComparison';
import { ProductDynamicPurchase } from '../../../components/storefront/ProductDynamicPurchase';
import {
  HonorColorSwatch,
  HonorMemoryCard,
  HonorSelectMark,
  honorCardStyle,
} from '../../../components/storefront/honorSelectionUi';
import {
  customFieldsExtra,
  initialOptionSelection,
  missingRequiredField,
  missingRequiredFieldIds,
  purchaseNotes,
  resolveSelectionPrice,
  visibleProductOptions,
  type FieldValueMap,
} from '../../../utils/storefrontPurchase';
import { optionValuesList } from '../../../utils/productVariants';
import { useTenant } from '../../../context/TenantContext';
import { effectiveProductPricing } from '../../../utils/productSaleSchedule';
import { saleCountdownParts } from '../../../utils/saleCountdown';
import { isPurchaseCustomField } from '../../../utils/coffeeLearnMoreFields';
import { resolveCoffeeThemeSettings } from '../../settings/coffeeThemeDefaults';
import {
  fetchProduct,
  fetchStoreReviews,
  fetchStorefrontPaymentMethodsApi,
  submitStoreReviewApi,
} from '../../../api/tenantApi';
import type { Product as ThemeProduct } from '../types';
import baristaKitImg from '../assets/images/hibrew_barista_kit_isolated.jpg';
import scaleImg from '../assets/images/hibrew_scale_isolated.jpg';
import {
  cleanImageUrl,
  COFFEE_STOREFRONT_IMAGE_FALLBACK,
  handleImageError,
  resolveProductThumbnail,
} from '../../../utils/imageFallback';

function resolveBuyPageImage(
  url: string | undefined,
  item?: { id?: string; sku?: string; name?: string; nameAr?: string },
): string {
  return resolveProductThumbnail({
    image: cleanImageUrl(url || ''),
    id: item?.id,
    sku: item?.sku,
    name: item?.name,
    nameAr: item?.nameAr,
  });
}

function mapApiChildToThemeProduct(child: import('../../../types').Product): ThemeProduct {
  const primary = cleanImageUrl(
    child.image ||
      child.imageUrl ||
      (child.galleryUrls && child.galleryUrls[0]) ||
      '',
  );
  const regular = Number(child.price) || 0;
  const sale = Number(child.discountedPrice) || 0;
  const selling = sale > 0 && sale < regular ? sale : regular;
  return {
    id: child.id,
    sku: child.sku,
    brand: child.brand,
    name: child.name,
    nameAr: child.nameAr || child.name,
    tagline: child.subtitle || '',
    taglineAr: child.subtitleAr || '',
    category: (child.category as ThemeProduct['category']) || '',
    categoryAr: child.categoryAr,
    stock: typeof child.stock === 'number' ? child.stock : undefined,
    seoTitle: child.seoTitle || undefined,
    seoDescription: child.seoDescription || undefined,
    discountStartAt: child.discountStartAt || undefined,
    discountEndAt: child.discountEndAt || undefined,
    basePrice: selling,
    originalPrice: child.originalPrice || undefined,
    price: regular,
    discountedPrice: sale || undefined,
    reviewCount: child.reviewsCount || 0,
    rating: child.rating || 0,
    colors: [],
    storageOptions: [],
    specs: Array.isArray(child.specs) ? child.specs : [],
    images: primary
      ? [
          primary,
          ...(child.galleryUrls || [])
            .map((u) => cleanImageUrl(u))
            .filter((u) => u && u !== primary),
        ]
      : (child.galleryUrls || []).map((u) => cleanImageUrl(u)).filter(Boolean),
    overview: child.description || '',
    overviewAr: child.descriptionAr || '',
    productOptions: (child.productOptions as ThemeProduct['productOptions']) || [],
    variations: (child.variations as ThemeProduct['variations']) || [],
    conditionalRules: (child.conditionalRules as ThemeProduct['conditionalRules']) || [],
    customFields: (child.customFields as ThemeProduct['customFields']) || [],
    selectorImageUrl: child.selectorImageUrl || null,
    purchasable: true,
    isGrouped: false,
  };
}

type StorefrontReviewRow = {
  id: string;
  author: string;
  city: string;
  cityEn: string;
  verified: boolean;
  rating: number;
  date: string;
  modelBought: string;
  modelBoughtAr: string;
  contentAr: string;
  contentEn: string;
  hasImage: boolean;
  likes: number;
  liked: boolean;
};

interface ProductBuyPageProps {
  isAdmin?: boolean;
}

export const ProductBuyPage: React.FC<ProductBuyPageProps> = ({ isAdmin = false }) => {
  const {
    selectedProduct,
    selectedProductId,
    productSelectionReady,
    addToCart,
    triggerFlyToCart,
    navigateTo,
    goBack,
    language,
    showToast,
    applyCoupon,
    removeCoupon,
    appliedCoupon,
    couponDiscount,
  } = useCart();
  const { activeStore } = useTenant();
  const parentProduct = selectedProduct;
  const [groupChildren, setGroupChildren] = useState<ThemeProduct[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  /** Real Tamara gateway: only show product-page widget when connected + logo toggle ON */
  const [showTamaraOnProduct, setShowTamaraOnProduct] = useState(false);
  const [showTabbyOnProduct, setShowTabbyOnProduct] = useState(false);

  const parentIsGrouped = Boolean(
    parentProduct?.isGrouped ||
      String(parentProduct?.productType || '').toLowerCase() === 'grouped' ||
      (parentProduct?.groupChildren && parentProduct.groupChildren.length > 0) ||
      groupChildren.length > 0,
  );

  // Keep URL on parent; commerce uses the selected independent child.
  const compareChildren = useMemo(() => {
    if (!parentIsGrouped) return [] as ThemeProduct[];
    return groupChildren.length > 0
      ? groupChildren
      : (parentProduct?.groupChildren || []);
  }, [parentIsGrouped, groupChildren, parentProduct?.groupChildren]);

  const product = useMemo(() => {
    if (!parentIsGrouped) return parentProduct;
    const pool = compareChildren;
    if (!pool.length) return parentProduct;
    const active =
      pool.find((c) => String(c.id) === String(activeChildId || '')) || pool[0];
    return active || parentProduct;
  }, [parentIsGrouped, parentProduct, compareChildren, activeChildId]);

  const buyPageReady = useMemo(() => {
    if (!productSelectionReady || !parentProduct || !product) return false;
    const targetId = String(selectedProductId || '').trim();
    if (!targetId) return true;
    if (!parentIsGrouped) return String(product.id) === targetId;
    // Parent SEO URL (/product/{parentId}) must open buy once children hydrate;
    // commerce still uses the selected child (activeChildId).
    if (!compareChildren.length) return false;
    const parentId = String(parentProduct.id || '');
    const targetIsParent = targetId === parentId;
    const targetIsChild = compareChildren.some((c) => String(c.id) === targetId);
    if (!targetIsParent && !targetIsChild) return false;
    const activeId = String(activeChildId || compareChildren[0]?.id || '');
    return Boolean(activeId) && String(product.id) === activeId;
  }, [
    productSelectionReady,
    parentProduct,
    product,
    parentIsGrouped,
    selectedProductId,
    compareChildren,
    activeChildId,
  ]);

  useEffect(() => {
    let cancelled = false;
    const storeId = activeStore?.id;
    if (!storeId) {
      setShowTamaraOnProduct(false);
      setShowTabbyOnProduct(false);
      return;
    }
    (async () => {
      try {
        const { methods } = await fetchStorefrontPaymentMethodsApi(storeId);
        if (cancelled) return;
        const tamara = methods.find((m) => m.id === 'tamara' && m.is_enabled !== false);
        const tabby = methods.find((m) => m.id === 'tabby' && m.is_enabled !== false);
        setShowTamaraOnProduct(Boolean(tamara && tamara.show_product_logo !== false));
        setShowTabbyOnProduct(Boolean(tabby));
      } catch {
        if (!cancelled) {
          setShowTamaraOnProduct(false);
          setShowTabbyOnProduct(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeStore?.id]);

  useEffect(() => {
    const urlPid = (() => {
      try {
        if (typeof window === 'undefined') return '';
        const q = new URLSearchParams(window.location.search);
        const fromQ = (q.get('product') || q.get('productId') || q.get('pid') || '').trim();
        if (fromQ) return fromQ;
        const path = String(window.location.pathname || '').replace(/\/$/, '') || '/';
        // Short SEO paths: /product/{id} and /buy/{id}
        const m = path.match(/(?:^|\/)(?:product|buy)\/([^/]+)$/i);
        return m ? decodeURIComponent(m[1]).trim() : '';
      } catch {
        return '';
      }
    })();
    const pickChildId = (kids: ThemeProduct[]) => {
      if (urlPid && kids.some((c) => String(c.id) === String(urlPid))) return String(urlPid);
      return kids[0]?.id != null ? String(kids[0].id) : null;
    };
    const seeded = parentProduct?.groupChildren || [];
    if (seeded.length > 0) {
      setGroupChildren(seeded);
      setActiveChildId((prev) =>
        prev && seeded.some((c) => String(c.id) === String(prev))
          ? String(prev)
          : pickChildId(seeded),
      );
      return;
    }
    const storeId = activeStore?.id;
    const parentId = parentProduct?.id;
    const isGrouped =
      Boolean(parentProduct?.isGrouped) ||
      String(parentProduct?.productType || '').toLowerCase() === 'grouped';
    if (!storeId || !parentId || !isGrouped) {
      setGroupChildren([]);
      setActiveChildId(null);
      return;
    }
    // Keep prior children while refetching — clearing caused buyPageReady spinner / “auto refresh”.
    let cancelled = false;
    void fetchProduct(storeId, parentId)
      .then((full) => {
        if (cancelled) return;
        const kids = (full.groupChildren || []).map(mapApiChildToThemeProduct);
        setGroupChildren(kids);
        setActiveChildId((prev) =>
          prev && kids.some((c) => String(c.id) === String(prev))
            ? String(prev)
            : pickChildId(kids),
        );
      })
      .catch(() => {
        /* keep last good children */
      });
    return () => {
      cancelled = true;
    };
  }, [
    activeStore?.id,
    parentProduct?.id,
    parentProduct?.isGrouped,
    parentProduct?.productType,
    parentProduct?.groupChildren,
  ]);

  const showCouponOnBuy = activeStore?.id
    ? resolveCoffeeThemeSettings(activeStore.id, activeStore).checkoutFields?.showCoupon !== false
    : true;
  const [couponCode, setCouponCode] = useState('');

  const listPricing = useMemo(() => {
    if (!product) {
      return { price: 0, compareAt: null as number | null, saleActive: false };
    }
    return effectiveProductPricing({
      price: Number((product as { price?: number }).price ?? product.basePrice) || 0,
      discountedPrice: (product as { discountedPrice?: number }).discountedPrice,
      originalPrice: product.originalPrice,
      discountStartAt: (product as { discountStartAt?: string }).discountStartAt,
      discountEndAt: (product as { discountEndAt?: string }).discountEndAt,
    });
  }, [product]);

  type BuyTabType = 'configure' | 'bundles' | 'features' | 'specs' | 'reviews' | 'faq';
  const [activeBuyTab, setActiveBuyTab] = useState<BuyTabType>('configure');

  const [selectedColor, setSelectedColor] = useState<ProductColor | undefined>(product?.colors?.[0]);
  const [selectedStorage, setSelectedStorage] = useState<StorageOption | undefined>(product?.storageOptions?.[0]);
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyOption | undefined>(undefined);
  const [selectedBundles, setSelectedBundles] = useState<BundleOption[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [optionPick, setOptionPick] = useState<Record<string, string>>({});
  const [fieldValues, setFieldValues] = useState<FieldValueMap>({});
  const [purchaseAttempted, setPurchaseAttempted] = useState(false);

  // Sync state whenever selected parent or active child changes — no URL navigation
  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors?.[0]);
      setSelectedStorage(product.storageOptions?.[0]);
      setSelectedBundles([]);
      setSelectedWarranty(undefined);
      setActiveImageIndex(0);
      setQuantity(1);
      setOptionPick(initialOptionSelection(product.productOptions as never, product.variations as never));
      setFieldValues({});
      setPurchaseAttempted(false);
    }
  }, [parentProduct?.id, product?.id]);

  // Glass Zoom Magnifier State (Screenshot 2)
  const buyStickyBarRef = useRef<HTMLDivElement | null>(null);
  const [buyStickyBarH, setBuyStickyBarH] = useState(56); // used for scroll offset / gallery top

  // Reviews System State (Screenshot 4)
  const [activeReviewTab, setActiveReviewTab] = useState<'all' | 'images'>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newAuthor, setNewAuthor] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showReviewSuccess, setShowReviewSuccess] = useState(false);

  const [reviewsList, setReviewsList] = useState<StorefrontReviewRow[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    const storeId = activeStore?.id;
    if (!storeId) {
      setReviewsList([]);
      return;
    }
    let cancelled = false;
    setReviewsLoading(true);
    void fetchStoreReviews(storeId, { productId: product?.id, approvedOnly: true })
      .then((rows) => {
        if (cancelled) return;
        const mapped: StorefrontReviewRow[] = (rows || [])
          .filter((r) => (r as { active?: boolean }).active === true)
          .filter((r) => {
            if (!product?.id && !product?.name) return true;
            const pid = String((r as { product_id?: string }).product_id || '');
            if (pid && product?.id) return pid === product.id;
            const prod = String((r as { product?: string }).product || '');
            const prodAr = String((r as { productAr?: string }).productAr || '');
            return (
              prod.includes(product.id) ||
              prod.includes(product.name || '') ||
              (!!product.nameAr && prodAr.includes(product.nameAr))
            );
          })
          .map((r) => ({
            id: String(r.id || `rev-${Math.random()}`),
            author: String(r.author || '—'),
            city: String((r as { city?: string }).city || ''),
            cityEn: String((r as { city?: string }).city || ''),
            verified: Boolean((r as { verified?: boolean }).verified),
            rating: Number(r.rating) || 5,
            date: String((r as { date?: string }).date || ''),
            modelBought: String((r as { product?: string }).product || ''),
            modelBoughtAr: String((r as { productAr?: string }).productAr || (r as { product?: string }).product || ''),
            contentAr: String(r.commentAr || r.comment || ''),
            contentEn: String(r.comment || r.commentAr || ''),
            hasImage: false,
            likes: Number((r as { likes?: number }).likes) || 0,
            liked: false,
          }));
        setReviewsList(mapped);
      })
      .catch(() => {
        if (!cancelled) setReviewsList([]);
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeStore?.id, product?.id, product?.name, product?.nameAr]);

  const reviewStats = useMemo(() => {
    const list = reviewsList;
    const total = list.length;
    if (total === 0) {
      return {
        avgDisplay: product?.rating != null ? Number(product.rating).toFixed(1) : '—',
        total: 0,
        breakdown: [5, 4, 3, 2, 1].map((star) => ({ star, count: 0, pct: 0 })),
        satisfaction: null as number | null,
      };
    }
    const sum = list.reduce((acc, r) => acc + r.rating, 0);
    const avg = sum / total;
    const breakdown = [5, 4, 3, 2, 1].map((star) => {
      const count = list.filter((r) => r.rating === star).length;
      return { star, count, pct: total ? Math.round((count / total) * 100) : 0 };
    });
    const satisfaction = Math.round((list.filter((r) => r.rating >= 4).length / total) * 1000) / 10;
    return { avgDisplay: avg.toFixed(1), total, breakdown, satisfaction };
  }, [reviewsList, product?.rating]);

  // Stable gallery images: all product colors first in fixed order, followed by product images
  const productColors = product?.colors || [];
  const productImages = product?.images || [];
  const imgMeta = {
    id: product?.id,
    sku: product?.sku,
    name: product?.name,
    nameAr: product?.nameAr,
  };
  const candidateImages = [
    ...productColors.map((c) => resolveBuyPageImage(c.image, imgMeta)),
    ...productImages
      .filter((img) => !productColors.some((col) => col.image === img))
      .map((img) => resolveBuyPageImage(img, imgMeta)),
  ].filter(Boolean) as string[];

  if (candidateImages.length === 0) {
    candidateImages.push(
      resolveBuyPageImage((product as { image?: string })?.image, imgMeta) ||
        COFFEE_STOREFRONT_IMAGE_FALLBACK,
    );
  }

  const allImages = Array.from(new Set(candidateImages));
  const displayThumbnails = allImages.slice(0, 8);

  const liveOptions = useMemo(
    () => visibleProductOptions(product?.productOptions as never),
    [product?.productOptions],
  );
  const useDynamicOptions = liveOptions.length > 0;
  const resolvedPick = useMemo(() => {
    if (!product || !useDynamicOptions) return null;
    return resolveSelectionPrice(
      Number(product.basePrice) || 0,
      liveOptions,
      optionPick,
      product.variations as never,
    );
  }, [product, useDynamicOptions, liveOptions, optionPick]);
  // Include Content + Divider so every Custom Field type can show on the buy page.
  // Price math still uses fillable types only (see customFieldsExtra / cart).
  const purchaseFields = (product?.customFields || []).filter(
    (field) =>
      field &&
      isPurchaseCustomField(field) &&
      !field.hidden &&
      !String(field.id || '').startsWith('catalog-spec-'),
  );
  const hasCustomFields = purchaseFields.length > 0;
  const hasCustomCareField = purchaseFields.some((field) => {
    const f = field as { name?: string; nameAr?: string; type?: string };
    return /care|warranty|protection|حماية|رعاية|ضمان|صيانة|عناية/i.test(
      `${f.name || ''} ${f.nameAr || ''} ${f.type || ''}`,
    );
  });
  const fieldExtra = useMemo(
    () =>
      customFieldsExtra(
        purchaseFields as never,
        fieldValues,
        product?.conditionalRules as never,
        optionPick,
      ),
    [purchaseFields, product?.conditionalRules, fieldValues, optionPick],
  );

  const currentDisplayImage =
    (useDynamicOptions && resolvedPick?.image) ||
    allImages[activeImageIndex] ||
    selectedColor?.image ||
    productImages[0];

  const colorOrImagePriceDelta = useDynamicOptions
    ? 0
    : activeImageIndex < productColors.length
      ? (selectedColor?.priceDelta ?? 0)
      : 0;

  const bundleExtra = selectedBundles.reduce((s, b) => s + b.price, 0);
  const warrantyExtra = selectedWarranty ? selectedWarranty.price : 0;
  const catalogExtra = useDynamicOptions ? 0 : colorOrImagePriceDelta + (selectedStorage?.priceDelta || 0);
  const catalogBase = listPricing.price || Number(product?.basePrice) || 0;
  const sellingBase = useDynamicOptions
    ? (resolvedPick?.selling ?? catalogBase)
    : catalogBase;
  const unitPrice = sellingBase + catalogExtra + warrantyExtra + bundleExtra + fieldExtra;
  const totalPrice = unitPrice * quantity;
  const listCompare = listPricing.compareAt;
  const originalUnitPrice = useDynamicOptions && resolvedPick?.mrp
    ? resolvedPick.mrp + warrantyExtra + bundleExtra + fieldExtra
    : listCompare != null && listCompare > sellingBase
      ? listCompare + catalogExtra + warrantyExtra + bundleExtra + fieldExtra
      : product?.originalPrice && product.originalPrice > unitPrice
        ? product.originalPrice + catalogExtra + warrantyExtra + bundleExtra + fieldExtra
        : unitPrice;
  const originalPrice = originalUnitPrice * quantity;
  const savingsSAR = originalPrice - totalPrice;
  const installmentSAR = Math.round(totalPrice / 4);

  const saleEndsAt = (product as { discountEndAt?: string })?.discountEndAt;
  const showSaleBanner = listPricing.saleActive && savingsSAR > 0 && !!saleEndsAt;
  const [timeLeft, setTimeLeft] = useState(() => saleCountdownParts(saleEndsAt) || { days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!showSaleBanner || !saleEndsAt) return;
    const tick = () => {
      const parts = saleCountdownParts(saleEndsAt);
      if (parts) setTimeLeft(parts);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [showSaleBanner, saleEndsAt]);

  // Dynamic Product Highlight Bullets (4 key specs per product - Image 1)
  const productBullets = useMemo(() => {
    const isAr = language === 'AR';
    if (!product) return [];
    if (isAr && product.heroBanner?.featuresAr && product.heroBanner.featuresAr.length > 0) {
      return product.heroBanner.featuresAr.slice(0, 4);
    }
    if (!isAr && product.heroBanner?.featuresEn && product.heroBanner.featuresEn.length > 0) {
      return product.heroBanner.featuresEn.slice(0, 4);
    }
    if (product.specs && product.specs.length > 0) {
      return product.specs
        .slice(0, 4)
        .map((s) => {
          if (isAr) {
            const label = (s.labelAr || '').trim();
            const value = (s.valueAr || '').trim();
            return [label, value].filter(Boolean).join(': ');
          }
          const label = (s.label || '').trim();
          const value = (s.value || '').trim();
          return [label, value].filter(Boolean).join(': ');
        })
        .filter(Boolean);
    }
    if (isAr && product.taglineAr) {
      return product.taglineAr.split('·').map(t => t.trim()).filter(Boolean).slice(0, 4);
    }
    if (product.tagline) {
      return product.tagline.split('·').map(t => t.trim()).filter(Boolean).slice(0, 4);
    }
    if (isAr && product.overviewAr) {
      return product.overviewAr.split(/\n|·/).map((t) => t.trim()).filter(Boolean).slice(0, 4);
    }
    if (product.overview) {
      return product.overview.split(/\n|·/).map((t) => t.trim()).filter(Boolean).slice(0, 4);
    }
    return [];
  }, [product, language]);

  const displayDiscount = useMemo(() => {
    if (!product || !listPricing.saleActive) return 0;
    if (savingsSAR > 0) return savingsSAR;
    return 0;
  }, [savingsSAR, product, listPricing.saleActive]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await applyCoupon(couponCode);
    showToast(res.message);
    if (res.success) setCouponCode('');
  };


  const handleThumbnailClick = (idx: number) => {
    setActiveImageIndex(idx);
    const clickedImg = allImages[idx];
    if (!clickedImg) return;
    const matchingColor = productColors.find(col => col.image === clickedImg) || (idx < productColors.length ? productColors[idx] : undefined);
    if (matchingColor) {
      setSelectedColor(matchingColor);
    }
  };

  const handlePrevImage = () => {
    const nextIdx = activeImageIndex === 0 ? allImages.length - 1 : activeImageIndex - 1;
    handleThumbnailClick(nextIdx);
  };

  const handleNextImage = () => {
    const nextIdx = activeImageIndex === allImages.length - 1 ? 0 : activeImageIndex + 1;
    handleThumbnailClick(nextIdx);
  };

  const handleColorChange = (c: ProductColor) => {
    setSelectedColor(c);
    const colorIdx = productColors.findIndex(col => col.name === c.name);
    const foundIdx = allImages.findIndex(img => img === c.image);
    if (foundIdx !== -1) {
      setActiveImageIndex(foundIdx);
    } else if (colorIdx !== -1) {
      setActiveImageIndex(colorIdx);
    }
  };

  const toggleBundle = (bundle: BundleOption) => {
    if (selectedBundles.some(b => b.id === bundle.id)) {
      setSelectedBundles(selectedBundles.filter(b => b.id !== bundle.id));
    } else {
      setSelectedBundles([...selectedBundles, bundle]);
    }
  };

  const effectiveSelectedColor: ProductColor | undefined = selectedColor
    ? {
        ...selectedColor,
        image: currentDisplayImage,
        priceDelta: colorOrImagePriceDelta,
      }
    : undefined;
  const hasLegacyColors = !useDynamicOptions && productColors.length > 0;
  const hasLegacyStorage = !useDynamicOptions && (product?.storageOptions?.length || 0) > 0;

  const optionSummary = liveOptions
    .map((opt) => {
      const picked = optionPick[opt.name];
      if (!picked) return '';
      const value = optionValuesList(opt.values).find((row) => row.label === picked);
      return language === 'AR' && value?.labelAr ? value.labelAr : picked;
    })
    .filter(Boolean)
    .join(' · ');
  const badgeLabel = useDynamicOptions && optionSummary
    ? optionSummary
    : selectedStorage
      ? (language === 'AR' && selectedStorage.capacityAr ? selectedStorage.capacityAr : selectedStorage.capacity)
      : (language === 'AR' ? (product?.badgeAr || product?.badge || '') : (product?.badge || ''));
  const requiredMissingIds = !product
    ? []
    : missingRequiredFieldIds(
        purchaseFields as never,
        fieldValues,
        product.conditionalRules as never,
        optionPick,
      );
  const requiredBlockedReason = !product
    ? null
    : missingRequiredField(
        purchaseFields as never,
        fieldValues,
        product.conditionalRules as never,
        optionPick,
        language === 'AR',
      );
  const outOfStockReason =
    useDynamicOptions && resolvedPick?.purchasable === false
      ? language === 'AR'
        ? 'هذا الخيار غير متوفر'
        : 'This option is out of stock'
      : null;
  const blockedReason = requiredBlockedReason || outOfStockReason;
  const invalidFieldIds = purchaseAttempted ? requiredMissingIds : [];

  const focusFirstInvalidField = (ids: string[]) => {
    const first = ids[0];
    if (!first) return;
    const el = document.getElementById(`cf-field-${first}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (!product) return;
    setPurchaseAttempted(true);
    if (blockedReason) {
      showToast(blockedReason);
      focusFirstInvalidField(requiredMissingIds);
      return;
    }
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      triggerFlyToCart(rect, currentDisplayImage || product.colors?.[0]?.image);
    }
    const notes = purchaseNotes(
      purchaseFields as never,
      fieldValues,
      product.conditionalRules as never,
      optionPick,
      language === 'AR',
    );
    const labels = optionSummary.split(' · ').filter(Boolean);
    const colorForCart = useDynamicOptions
      ? {
          name: labels[0] || effectiveSelectedColor?.name || '',
          nameAr: labels[0] || effectiveSelectedColor?.nameAr || '',
          hex: effectiveSelectedColor?.hex || '#1c1917',
          image: currentDisplayImage,
          priceDelta: 0,
        }
      : effectiveSelectedColor;
    const storageForCart = useDynamicOptions
      ? {
          capacity: labels.slice(1).join(' · '),
          capacityAr: labels.slice(1).join(' · '),
          ram: '',
          priceDelta: 0,
        }
      : selectedStorage;
    // Always snapshot selections so order admin sees what the customer picked.
    const extra = {
      unitPrice,
      image: currentDisplayImage,
      optionSummary: useDynamicOptions ? optionSummary || undefined : undefined,
      purchaseNotes: notes.length ? notes : undefined,
      variationId: useDynamicOptions ? resolvedPick?.variant?.id || null : null,
      selectedOptions: useDynamicOptions && Object.keys(optionPick).length ? { ...optionPick } : null,
    };
    for (let i = 0; i < quantity; i++) {
      addToCart(product, colorForCart, storageForCart, selectedWarranty, selectedBundles, false, extra);
    }
  };

  const handleInstantBuy = () => {
    if (!product) return;
    setPurchaseAttempted(true);
    if (blockedReason) {
      showToast(blockedReason);
      focusFirstInvalidField(requiredMissingIds);
      return;
    }
    const notes = purchaseNotes(
      purchaseFields as never,
      fieldValues,
      product.conditionalRules as never,
      optionPick,
      language === 'AR',
    );
    const labels = optionSummary.split(' · ').filter(Boolean);
    const colorForCart = useDynamicOptions
      ? {
          name: labels[0] || effectiveSelectedColor?.name || '',
          nameAr: labels[0] || effectiveSelectedColor?.nameAr || '',
          hex: effectiveSelectedColor?.hex || '#1c1917',
          image: currentDisplayImage,
          priceDelta: 0,
        }
      : effectiveSelectedColor;
    const storageForCart = useDynamicOptions
      ? {
          capacity: labels.slice(1).join(' · '),
          capacityAr: labels.slice(1).join(' · '),
          ram: '',
          priceDelta: 0,
        }
      : selectedStorage;
    const extra = {
      unitPrice,
      image: currentDisplayImage,
      optionSummary: useDynamicOptions ? optionSummary || undefined : undefined,
      purchaseNotes: notes.length ? notes : undefined,
      variationId: useDynamicOptions ? resolvedPick?.variant?.id || null : null,
      selectedOptions: useDynamicOptions && Object.keys(optionPick).length ? { ...optionPick } : null,
    };
    for (let i = 0; i < quantity; i++) {
      addToCart(product, colorForCart, storageForCart, selectedWarranty, selectedBundles, true, extra);
    }
    navigateTo('checkout');
  };

  /** Comparison column Buy: purchase that child at list price (no parent shell). */
  const handleCompareBuy = (child: ThemeProduct) => {
    if (!child?.id) return;
    setActiveChildId(child.id);
    const unit =
      Number(child.basePrice) > 0
        ? Number(child.basePrice)
        : Number(child.price) || 0;
    const img =
      child.selectorImageUrl ||
      child.images?.[0] ||
      child.image ||
      '';
    addToCart(
      child,
      {
        name: '',
        nameAr: '',
        hex: '#1c1917',
        image: img,
        priceDelta: 0,
      },
      undefined,
      undefined,
      [],
      true,
      {
        unitPrice: unit,
        image: img,
      },
    );
    navigateTo('checkout');
  };

  const toggleLikeReview = (id: string) => {
    setReviewsList(prev =>
      prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            liked: !r.liked,
            likes: r.liked ? r.likes - 1 : r.likes + 1
          };
        }
        return r;
      })
    );
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !product) return;
    const storeId = activeStore?.id;
    if (!storeId) {
      showToast(language === 'AR' ? 'المتجر غير جاهز' : 'Store is not ready');
      return;
    }
    const author = newAuthor.trim() || (language === 'AR' ? 'عميل' : 'Customer');
    try {
      await submitStoreReviewApi(storeId, {
        author,
        city: newCity.trim() || undefined,
        product: selectedColor?.name ? `${product.name} / ${selectedColor.name}` : product.name,
        productAr: selectedColor?.nameAr || selectedColor?.name
          ? `${product.nameAr || product.name} / ${selectedColor.nameAr || selectedColor.name}`
          : (product.nameAr || product.name),
        product_id: product.id,
        rating: newRating,
        comment: newComment.trim(),
        commentAr: newComment.trim(),
      } as never);
      setIsWritingReview(false);
      setNewComment('');
      setNewAuthor('');
      setNewCity('');
      setShowReviewSuccess(true);
      showToast(
        language === 'AR'
          ? 'تم إرسال التقييم للمراجعة — يظهر بعد الموافقة'
          : 'Review submitted for approval — it appears after merchant approval',
      );
      setTimeout(() => setShowReviewSuccess(false), 5000);
    } catch {
      showToast(language === 'AR' ? 'تعذر إرسال التقييم' : 'Could not submit review');
    }
  };

  const scrollToSection = (id: string, tab?: BuyTabType) => {
    if (tab) setActiveBuyTab(tab);
    if (id === 'buy-stage-section') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      // Site chrome + fixed Honor buy bar
      const chromeRaw = getComputedStyle(document.documentElement)
        .getPropertyValue('--theme-chrome-offset')
        .trim();
      const chromePx = Number.parseFloat(chromeRaw) || 64;
      const barRaw = getComputedStyle(document.documentElement)
        .getPropertyValue('--buy-sticky-bar-h')
        .trim();
      const barPx = Number.parseFloat(barRaw) || buyStickyBarH || 56;
      const yOffset = -(chromePx + barPx + 8);
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const measure = () => {
      const h = buyStickyBarRef.current?.getBoundingClientRect().height || 56;
      setBuyStickyBarH(Math.round(h));
      document.documentElement.style.setProperty('--buy-sticky-bar-h', `${Math.round(h)}px`);
      const root = buyStickyBarRef.current?.closest('.hibrew-theme-root') as HTMLElement | null;
      root?.style.setProperty('--buy-sticky-bar-h', `${Math.round(h)}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (buyStickyBarRef.current) ro.observe(buyStickyBarRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [language, product?.id]);

  useEffect(() => {
    const handleScroll = () => {
      const sections: { id: string; tab: BuyTabType }[] = [
        { id: 'faq-section', tab: 'faq' },
        { id: 'customer-reviews-section', tab: 'reviews' },
        { id: 'specs-comparison-section', tab: 'specs' },
        { id: 'overview-features', tab: 'features' },
        { id: 'bundle-offers-section', tab: 'bundles' },
        { id: 'buy-stage-section', tab: 'configure' },
      ];

      const chromeRaw = getComputedStyle(document.documentElement)
        .getPropertyValue('--theme-chrome-offset')
        .trim();
      const chromePx = Number.parseFloat(chromeRaw) || 64;
      const scrollPosition = window.scrollY + chromePx + buyStickyBarH + 8;
      for (const sec of sections) {
        const el = document.getElementById(sec.id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveBuyTab(sec.tab);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [buyStickyBarH]);

  const stickyProductName =
    language === 'AR' && product?.nameAr ? product.nameAr : product?.name || '';
  const honorNavItems: { id: string; tab: BuyTabType; labelAr: string; labelEn: string }[] = [
    { id: 'buy-stage-section', tab: 'configure', labelAr: 'نظرة عامة', labelEn: 'Overview' },
    { id: 'overview-features', tab: 'features', labelAr: 'المميزات', labelEn: 'Features' },
    { id: 'specs-comparison-section', tab: 'specs', labelAr: 'المواصفات', labelEn: 'Specs' },
    { id: 'customer-reviews-section', tab: 'reviews', labelAr: 'التقييمات', labelEn: 'Reviews' },
    { id: 'faq-section', tab: 'faq', labelAr: 'الأسئلة', labelEn: 'FAQ' },
  ];

  if (!product) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-white text-neutral-600 text-sm">
        {language === 'AR' ? 'جاري تحميل المنتج' : 'Loading product'}
      </div>
    );
  }

  // FAQ items
  const FAQS = [
    {
      qAr: 'هل الماكينة متوافقة مع الجهد الكهربائي ومقابس المملكة العربية السعودية (220V)؟',
      qEn: 'Is the machine compatible with Saudi Arabia 220V 50/60Hz electrical standards and UK 3-pin plug?',
      aAr: 'نعم بالتأكيد، جميع أجهزتنا مستوردة بمواصفات مطابقة 100% لهيئة المواصفات والمقاييس والجودة السعودية (SASO)، تعمل بتردد 50/60 هرتز وجهد 220-240 فولت مع قابس ثلاثي معتمد.',
      aEn: 'Yes absolutely. All our machines fully comply with Saudi Standards, Metrology and Quality Organization (SASO), operating at 220-240V 50/60Hz with official BS 1363 3-pin plugs.'
    },
    {
      qAr: 'ماذا يشمل الضمان الرسمي المعتمد لمدة سنتين؟',
      qEn: 'What is covered under the 2-Year Official Agency Warranty in Saudi Arabia?',
      aAr: 'يشمل الضمان استبدال وصيانة قطع الغيار الأصلية مجاناً ضد العيوب المصنعية، ومضخة الضغط الإيطالية، ونظام التحكم الحراري PID، مع خدمة الاستلام والتوصيل المجاني للمنزل في حال الحاجة للصيانة.',
      aEn: 'The warranty covers free genuine parts replacement, the Italian ULKA 20-bar pump, and PID thermal modules against manufacturing defects, including free pickup and doorstep return across KSA.'
    },
    {
      qAr: 'كم يستغرق التوصيل الفوري داخل مدن المملكة؟',
      qEn: 'How fast is express delivery across Saudi Arabia (Riyadh, Jeddah, Dammam, etc.)?',
      aAr: 'التوصيل يتم خلال 24 إلى 48 ساعة كحد أقصى في الرياض، جدة، الدمام، مكة، والمدينة المنورة. وباقي مدن ومحافظات المملكة خلال 2 إلى 3 أيام عمل مع رقم تتبع فوري عبر الرسائل النصية.',
      aEn: 'Express delivery arrives within 24 to 48 hours in Riyadh, Jeddah, Dammam, Makkah, and Madinah. Other KSA regions within 2-3 business days with live SMS tracking.'
    },
    {
      qAr: 'ما هي الهدايا والإكسسوارات المرفقة مع الماكينة عند الشراء؟',
      qEn: 'What free barista gifts and accessories are included in the box?',
      aAr: 'تحتوي العلبة مجاناً على: بورتافلتر احترافي 58 ملم من الفولاذ، تامبر ضغط موزون 30 باوند، موزع قهوة، ربلة تسوية سيليكون، إبريق تبخير الحليب ستانلس ستيل، ومكيال تنظيف.',
      aEn: 'Included free: 58mm commercial stainless steel portafilter, 30lb calibrated spring tamper, distribution tool, silicone tamping mat, stainless milk frothing pitcher, and cleaning accessories.'
    },
    {
      qAr: 'هل يمكن الدفع بنظام التقسيط المريح بدون فوائد؟',
      qEn: 'Can I pay in interest-free installments via Tabby or Tamara?',
      aAr: 'نعم، نوفر خيار الدفع على 4 دفعات ميسرة بدون أي فوائد أو رسوم إضافية عبر تابي (Tabby) أو تمارا (Tamara)، متوافقة مع الشريعة الإسلامية.',
      aEn: 'Yes, you can split your total into 4 interest-free installments through Tabby or Tamara with zero extra fees and instant approval at checkout.'
    }
  ];

  if (!buyPageReady) {
    return (
      <div
        className="min-h-[50vh] w-full flex items-center justify-center bg-white"
        aria-busy="true"
        role="status"
      >
        <div className="w-9 h-9 rounded-full border-2 border-neutral-200 border-t-[#8B5A2B] animate-spin" />
      </div>
    );
  }

  return (
    <div
      data-coffee-product-buy="1"
      className="min-h-screen bg-white text-neutral-900 text-start pb-28 lg:pb-24 selection:bg-neutral-900 selection:text-white w-full max-w-full"
    >
      {/* ========================================================================= */}
      {/* 1. HONOR sticky sub-bar — sticks under site header (NOT fixed: clip root) */}
      {/* ========================================================================= */}
      <div
        ref={buyStickyBarRef}
        data-buy-sticky-bar="1"
        className="sticky z-40 w-full border-b border-[#E5E5E5] shadow-none"
        style={{
          boxShadow: 'none',
          top: 'var(--theme-chrome-offset, 4rem)',
          // Solid only — never bg-white (portal glass remaps it to 72% frost)
          background: '#FFFFFF',
          backgroundColor: '#FFFFFF',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          opacity: 1,
        }}
      >
        <div className="max-w-[1200px] mx-auto px-3 sm:px-6 lg:px-8 min-h-12 sm:h-14 flex items-center gap-2 sm:gap-5 overflow-hidden">
          <button
            type="button"
            onClick={goBack}
            className="shrink-0 text-neutral-500 hover:text-black p-1 cursor-pointer"
            title={language === 'AR' ? 'رجوع' : 'Back'}
            aria-label={language === 'AR' ? 'رجوع' : 'Back'}
          >
            {language === 'AR' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          </button>

          <div className="min-w-0 flex-1 md:flex-none md:shrink truncate text-sm sm:text-base font-extrabold text-neutral-900 max-w-[40%] sm:max-w-[28%] md:max-w-[22%]">
            {stickyProductName}
          </div>

          <nav
            aria-label={language === 'AR' ? 'أقسام المنتج' : 'Product sections'}
            className="hidden md:flex flex-1 items-center justify-center gap-4 lg:gap-6 min-w-0 overflow-x-auto no-scrollbar"
          >
            {honorNavItems.map((item) => {
              const on = activeBuyTab === item.tab;
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => scrollToSection(item.id, item.tab)}
                  className={`text-[13px] whitespace-nowrap transition-colors cursor-pointer shrink-0 pb-0.5 border-b-2 ${
                    on
                      ? 'text-neutral-900 font-bold border-neutral-900'
                      : 'text-neutral-500 font-medium border-transparent hover:text-neutral-900'
                  }`}
                >
                  {language === 'AR' ? item.labelAr : item.labelEn}
                </button>
              );
            })}
          </nav>

          <div className="ms-auto flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-baseline gap-2 flex-wrap justify-end">
              {savingsSAR > 0 ? (
                <span className="text-red-600 font-bold text-xs whitespace-nowrap">
                  {language === 'AR'
                    ? `وفر ${savingsSAR.toLocaleString()}.00 ⃁`
                    : `Save SAR ${savingsSAR.toLocaleString()}.00`}
                </span>
              ) : null}
              {originalPrice ? (
                <span className="text-neutral-400 line-through text-xs font-sans whitespace-nowrap">
                  {language === 'AR'
                    ? `${originalPrice.toLocaleString()}.00 ⃁`
                    : `SAR ${originalPrice.toLocaleString()}.00`}
                </span>
              ) : null}
              <span className="text-sm sm:text-base font-black text-neutral-900 font-sans tracking-tight whitespace-nowrap">
                {language === 'AR'
                  ? `${totalPrice.toLocaleString()}.00 ⃁`
                  : `SAR ${totalPrice.toLocaleString()}.00`}
              </span>
            </div>
            <button
              type="button"
              onClick={handleInstantBuy}
              className="px-4 sm:px-5 py-1.5 sm:py-2 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-full transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-none"
              style={{ boxShadow: 'none' }}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{language === 'AR' ? 'شراء الآن' : 'Buy Now'}</span>
            </button>
          </div>
        </div>

        {/* Mobile section links under Honor bar */}
        <div className="md:hidden border-t border-neutral-100 px-3 overflow-x-auto no-scrollbar flex items-center gap-4 py-1.5">
          {honorNavItems.map((item) => {
            const on = activeBuyTab === item.tab;
            return (
              <button
                key={`m-${item.tab}`}
                type="button"
                onClick={() => scrollToSection(item.id, item.tab)}
                className={`text-[12px] whitespace-nowrap shrink-0 pb-0.5 border-b-2 cursor-pointer ${
                  on
                    ? 'text-neutral-900 font-bold border-neutral-900'
                    : 'text-neutral-500 font-medium border-transparent'
                }`}
              >
                {language === 'AR' ? item.labelAr : item.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* ========================================================================= */}
        {/* 2. SAVINGS CALLOUT BAR (Screenshot 2 Top Right Highlight)                 */}
        {/* ========================================================================= */}
        <div className="flex items-baseline justify-end gap-3 pb-6 border-b border-[#E5E5E5] flex-wrap">
          {savingsSAR > 0 && (
            <span className="text-red-600 font-bold text-sm sm:text-base">
              {language === 'AR' ? `وفر${savingsSAR.toLocaleString()}.00 ⃁` : `Save SAR ${savingsSAR.toLocaleString()}.00`}
            </span>
          )}
          {originalPrice && (
            <span className="text-neutral-400 line-through text-sm sm:text-base font-sans">
              {language === 'AR' ? `${originalPrice.toLocaleString()}.00 ⃁` : `⃁ ${originalPrice.toLocaleString()}.00`}
            </span>
          )}
          <span className="text-xl sm:text-3xl font-black text-neutral-900 font-sans tracking-tight">
            {language === 'AR' ? `${totalPrice.toLocaleString()}.00 ⃁` : `⃁ ${totalPrice.toLocaleString()}.00`}
          </span>
        </div>

        {/* ========================================================================= */}
        {/* 3. MAIN 2-COLUMN STAGE (Honor buy layout)                                  */}
        {/* ========================================================================= */}
        <div
          id="buy-stage-section"
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 pt-6 items-start relative overflow-visible"
          style={{ scrollMarginTop: 'calc(var(--theme-chrome-offset, 4rem) + 3.5rem)' }}
        >
          {/* ----------------------------------------------------------------------- */}
          {/* LEFT: sticky gallery (Honor) — image stays; right config scrolls past   */}
          {/* ----------------------------------------------------------------------- */}
          <div
            data-buy-gallery-sticky="1"
            className="lg:col-span-6 z-10 w-full self-start h-fit lg:sticky"
            style={{
              top: 'calc(var(--theme-chrome-offset, 4rem) + var(--buy-sticky-bar-h, 3.5rem) + 8px)',
            }}
          >
            <div className="space-y-3 flex flex-col items-center w-full">
            {/* Honor-style hero: image + side gift capsules + bottom price bar */}
            <div
              data-buy-hero-gallery="1"
              className="relative w-full select-none bg-[#FAFAFA] rounded-xl overflow-hidden border border-neutral-100"
              style={{ boxShadow: 'none' }}
            >
              <div className="relative w-full min-h-[360px] sm:min-h-[440px] lg:min-h-[500px] flex items-center justify-center px-2 pt-3 pb-16 sm:pb-[4.75rem]">
                {/* Top-start badge (Honor pill) */}
                {badgeLabel ? (
                  <div className="absolute top-3 start-3 z-20 pointer-events-none">
                    <span className="px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full border border-[#D2D2D7] bg-white/95 text-neutral-800 font-medium text-[12px] sm:text-[13px] tracking-wide inline-block">
                      {badgeLabel}
                    </span>
                  </div>
                ) : null}

                <img
                  src={resolveBuyPageImage(currentDisplayImage, imgMeta)}
                  alt={product.name}
                  className="relative z-0 w-full h-auto max-h-[320px] sm:max-h-[400px] lg:max-h-[460px] max-w-[92%] block object-contain object-center"
                  referrerPolicy="no-referrer"
                  onError={(e) => handleImageError(e, COFFEE_STOREFRONT_IMAGE_FALLBACK)}
                />

                {/* Right-side Honor gift capsules */}
                <div className="absolute end-2 sm:end-3 top-1/2 -translate-y-[58%] z-20 flex flex-col gap-2.5 sm:gap-3 pointer-events-none">
                  <div className="w-[72px] sm:w-[84px] rounded-2xl bg-white/95 border border-neutral-200/90 px-1.5 pt-2 pb-2 flex flex-col items-center text-center">
                    <span className="w-5 h-5 rounded-full bg-[#8B5A2B] text-white flex items-center justify-center mb-1">
                      <Gift className="w-3 h-3" />
                    </span>
                    <img
                      src={baristaKitImg}
                      alt=""
                      className="w-10 h-10 sm:w-12 sm:h-12 object-contain mix-blend-multiply"
                      referrerPolicy="no-referrer"
                    />
                    <span className="mt-1 text-[9px] sm:text-[10px] font-bold text-neutral-800 font-sans leading-tight">
                      {language === 'AR' ? '99 + 199 ⃁' : 'SAR 99 + 199'}
                    </span>
                    <span className="text-[8px] font-semibold text-emerald-700">
                      {language === 'AR' ? 'مجاناً' : 'Free'}
                    </span>
                  </div>
                  <div className="w-[72px] sm:w-[84px] rounded-2xl bg-white/95 border border-neutral-200/90 px-1.5 pt-2 pb-2 flex flex-col items-center text-center">
                    <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center mb-1">
                      <ShoppingBag className="w-3 h-3" />
                    </span>
                    <img
                      src={scaleImg}
                      alt=""
                      className="w-10 h-10 sm:w-12 sm:h-12 object-contain mix-blend-multiply"
                      referrerPolicy="no-referrer"
                    />
                    <span className="mt-1 text-[9px] sm:text-[10px] font-bold text-neutral-800 font-sans leading-tight">
                      {language === 'AR' ? '+ 79 ⃁' : '+ SAR 79'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Honor cream price / installment bar pinned to hero bottom */}
              <div className="absolute inset-x-2 sm:inset-x-3 bottom-2 sm:bottom-3 z-20">
                <div
                  className="w-full rounded-2xl bg-[#F3E7D4] border border-[#E8D5B8] px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2"
                  dir={language === 'AR' ? 'rtl' : 'ltr'}
                >
                  <div className="min-w-0 flex flex-col">
                    <span className="text-lg sm:text-2xl font-black text-neutral-900 font-sans tracking-tight leading-none">
                      {language === 'AR'
                        ? `${totalPrice.toLocaleString()} ⃁`
                        : `SAR ${totalPrice.toLocaleString()}`}
                    </span>
                    {savingsSAR > 0 ? (
                      <span className="text-[10px] sm:text-xs font-semibold text-red-600 mt-0.5">
                        {language === 'AR'
                          ? `وفر ${savingsSAR.toLocaleString()} ⃁`
                          : `Save SAR ${savingsSAR.toLocaleString()}`}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-end sm:text-start min-w-0">
                      <p className="text-[10px] sm:text-xs font-semibold text-neutral-800 leading-snug">
                        {language === 'AR'
                          ? `أو يبدأ من ${ (totalPrice / 12).toFixed(2) } ⃁ / شهر`
                          : `or starts from SAR ${(totalPrice / 12).toFixed(2)}/month`}
                      </p>
                      <p className="text-[9px] sm:text-[11px] text-neutral-600">
                        {language === 'AR' ? '(بدون فوائد)' : '(interest free)'}
                      </p>
                    </div>
                    <span className="hidden xs:flex w-9 h-9 rounded-xl bg-white border border-[#E8D5B8] items-center justify-center text-[#8B5A2B] shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Honor thumbs — ONE horizontal strip (group children OR gallery images) */}
            {(() => {
              const useGroupStrip = parentIsGrouped && compareChildren.length > 0;
              const stripCount = useGroupStrip ? compareChildren.length : displayThumbnails.length;
              if (stripCount < 1) return null;
              const fitThumbRow = stripCount <= 4;

              const scrollStrip = (dir: -1 | 1) => {
                const el = document.querySelector(
                  '[data-honor-thumb-scroll="1"]',
                ) as HTMLElement | null;
                if (el) el.scrollBy({ left: dir * 80, behavior: 'smooth' });
              };

              return (
                <div className="w-full space-y-1.5" data-honor-thumb-strip="1">
                  {useGroupStrip ? (
                    <p className="text-xs font-semibold text-neutral-600 text-center sm:text-start">
                      {language === 'AR' ? 'اختر المنتج داخل المجموعة' : 'Choose a product in this group'}
                    </p>
                  ) : null}
                  <div
                    className={`w-full flex flex-nowrap items-center gap-1.5 ${fitThumbRow ? 'justify-center' : ''}`}
                    dir="ltr"
                    style={{ flexWrap: 'nowrap' }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (useGroupStrip) {
                          const idx = compareChildren.findIndex(
                            (c) => String(c.id) === String(activeChildId),
                          );
                          const cur = idx < 0 ? 0 : idx;
                          const prev = compareChildren[Math.max(0, cur - 1)];
                          if (prev) setActiveChildId(String(prev.id));
                        } else {
                          handlePrevImage();
                        }
                        scrollStrip(-1);
                      }}
                      aria-label={language === 'AR' ? 'السابق' : 'Previous'}
                      className="shrink-0 grow-0 text-black hover:opacity-70 transition-opacity cursor-pointer p-0.5"
                    >
                      <ChevronLeft className="w-5 h-5 stroke-[2] text-black" />
                    </button>

                    <div
                      data-honor-thumb-scroll="1"
                      className={
                        fitThumbRow
                          ? 'flex-1 min-w-0 overflow-visible'
                          : 'flex-1 min-w-0 overflow-x-auto overflow-y-hidden no-scrollbar'
                      }
                      style={fitThumbRow ? undefined : { WebkitOverflowScrolling: 'touch' }}
                    >
                      <div
                        className={`flex flex-nowrap items-center gap-2 ${fitThumbRow ? 'w-full justify-center' : ''}`}
                        style={
                          fitThumbRow
                            ? {
                                display: 'flex',
                                flexWrap: 'nowrap',
                                flexDirection: 'row',
                                width: '100%',
                              }
                            : {
                                display: 'flex',
                                flexWrap: 'nowrap',
                                flexDirection: 'row',
                                width: 'max-content',
                                whiteSpace: 'nowrap',
                              }
                        }
                      >
                        {useGroupStrip
                          ? compareChildren.map((child, childIndex) => {
                              const thumb = resolveBuyPageImage(
                                child.selectorImageUrl ||
                                  child.images?.[0] ||
                                  child.image ||
                                  '',
                                {
                                  id: child.id,
                                  sku: child.sku,
                                  name: child.name,
                                  nameAr: child.nameAr,
                                },
                              );
                              const selected = activeChildId
                                ? String(activeChildId) === String(child.id)
                                : childIndex === 0;
                              return (
                                <button
                                  key={child.id}
                                  type="button"
                                  onClick={() => setActiveChildId(String(child.id))}
                                  className="relative rounded-[10px] overflow-hidden bg-white cursor-pointer shrink-0 grow-0 box-border"
                                  style={{
                                    width: fitThumbRow ? undefined : 72,
                                    height: fitThumbRow ? undefined : 72,
                                    minWidth: fitThumbRow ? 60 : 72,
                                    maxWidth: fitThumbRow ? 88 : 72,
                                    flex: fitThumbRow ? '1 1 0' : '0 0 72px',
                                    aspectRatio: '1',
                                    boxShadow: 'none',
                                    border: selected ? '2px solid #171717' : '1px solid #d4d4d4',
                                  }}
                                  aria-pressed={selected}
                                  title={
                                    language === 'AR' ? child.nameAr || child.name : child.name
                                  }
                                >
                                  <img
                                    src={thumb}
                                    alt={
                                      language === 'AR' ? child.nameAr || child.name : child.name
                                    }
                                    className="w-full h-full object-contain p-1 pointer-events-none"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => handleImageError(e, COFFEE_STOREFRONT_IMAGE_FALLBACK)}
                                  />
                                </button>
                              );
                            })
                          : displayThumbnails.map((img, idx) => {
                              const isActive = activeImageIndex === idx;
                              return (
                                <button
                                  key={`${img}-${idx}`}
                                  type="button"
                                  onClick={() => handleThumbnailClick(idx)}
                                  className="rounded-[10px] bg-white p-1 cursor-pointer shrink-0 grow-0 box-border"
                                  style={{
                                    width: fitThumbRow ? undefined : 72,
                                    height: fitThumbRow ? undefined : 72,
                                    minWidth: fitThumbRow ? 60 : 72,
                                    maxWidth: fitThumbRow ? 88 : 72,
                                    flex: fitThumbRow ? '1 1 0' : '0 0 72px',
                                    aspectRatio: '1',
                                    boxShadow: 'none',
                                    border: isActive ? '2px solid #171717' : '1px solid #d4d4d4',
                                  }}
                                >
                                  <img
                                    src={resolveBuyPageImage(img, imgMeta)}
                                    alt=""
                                    className="w-full h-full object-contain object-center pointer-events-none"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => handleImageError(e, COFFEE_STOREFRONT_IMAGE_FALLBACK)}
                                  />
                                </button>
                              );
                            })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (useGroupStrip) {
                          const idx = compareChildren.findIndex(
                            (c) => String(c.id) === String(activeChildId),
                          );
                          const cur = idx < 0 ? 0 : idx;
                          const next =
                            compareChildren[Math.min(compareChildren.length - 1, cur + 1)];
                          if (next) setActiveChildId(String(next.id));
                        } else {
                          handleNextImage();
                        }
                        scrollStrip(1);
                      }}
                      aria-label={language === 'AR' ? 'التالي' : 'Next'}
                      className="shrink-0 grow-0 text-black hover:opacity-70 transition-opacity cursor-pointer p-0.5"
                    >
                      <ChevronRight className="w-5 h-5 stroke-[2] text-black" />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Trust icons */}
            <div className="w-full pt-1">
              <div className="flex items-center justify-around max-w-xs mx-auto px-4">
                <div className="flex items-center justify-center text-neutral-800">
                  <Truck className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div className="flex items-center justify-center text-neutral-800">
                  <ShieldCheck className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div className="flex items-center justify-center text-neutral-800">
                  <Headphones className="w-5 h-5 stroke-[1.5]" />
                </div>
              </div>
              <div className="w-full border-t border-[#E5E5E7] mt-2.5 relative">
                <div className="absolute -top-[1.5px] left-1/2 -translate-x-1/2 w-14 sm:w-18 h-[3px] bg-neutral-900 rounded-full" />
              </div>
            </div>
            </div>
          </div>


          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT sideinfo — Honor: title free, each block its own border           */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-6 space-y-4 bg-white shadow-none" style={{ boxShadow: 'none' }}>
            {/* PRODUCT TITLE & STAR REVIEWS & SHARE ICON (Exact 1:1 Match with Reference Image 2) */}
            <div className="space-y-1.5 pb-1">
              <h1 className={`text-xl sm:text-2xl font-black text-neutral-900 ${
                language === 'AR' ? 'leading-[1.4] tracking-normal' : 'leading-snug tracking-[-0.01em]'
              }`}>
                {language === 'AR' && product.nameAr ? product.nameAr : product.name}
                {useDynamicOptions && optionSummary
                  ? ` ${optionSummary}`
                  : (
                    <>
                      {selectedStorage ? ` ${(language === 'AR' && selectedStorage.capacityAr ? selectedStorage.capacityAr : selectedStorage.capacity)}` : ''}
                      {selectedColor ? ` ${(language === 'AR' && selectedColor.nameAr ? selectedColor.nameAr : selectedColor.name)}` : ''}
                    </>
                  )}
              </h1>
              {(product.sku || typeof product.stock === 'number') && (
                <p className="text-[11px] sm:text-xs text-neutral-500 font-medium tracking-wide">
                  {product.sku ? (
                    <span>
                      {language === 'AR' ? 'رمز المنتج: ' : 'SKU: '}
                      {product.sku}
                    </span>
                  ) : null}
                  {product.sku && typeof product.stock === 'number' ? (
                    <span className="mx-2 text-neutral-300">·</span>
                  ) : null}
                  {typeof product.stock === 'number' ? (
                    <span>
                      {language === 'AR'
                        ? product.stock > 0
                          ? `المتوفر: ${product.stock}`
                          : 'غير متوفر'
                        : product.stock > 0
                          ? `In stock: ${product.stock}`
                          : 'Out of stock'}
                    </span>
                  ) : null}
                </p>
              )}

              {/* Star Rating, Total Reviews Link & Brown Paper Airplane Share Icon (Image 2) */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  {/* 5 Solid Black Stars */}
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-black text-black" />
                    ))}
                  </div>

                  {/* Rating Number */}
                  <span className="font-bold text-xs text-neutral-900">
                    {reviewStats.avgDisplay}
                  </span>

                  {/* Brown Clickable Reviews Link with Chevron */}
                  <button
                    type="button"
                    onClick={() => scrollToSection('customer-reviews-section')}
                    className="inline-flex items-center gap-0.5 text-xs text-[#8B5A2B] hover:text-[#6F4E37] hover:underline cursor-pointer font-normal transition-colors ml-1"
                  >
                    <span>
                      {language === 'AR'
                        ? `${product.reviewCount ?? reviewStats.total} تقييم إجمالي`
                        : `${product.reviewCount ?? reviewStats.total} reviews in total`}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 stroke-[2] rtl:rotate-180" />
                  </button>
                </div>

                {/* Brown Paper Airplane Share Icon (Matches Image 2) */}
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: product.name, url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                    }
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[#8B5A2B] hover:bg-[#8B5A2B]/10 transition-colors cursor-pointer"
                  title={language === 'AR' ? 'مشاركة' : 'Share'}
                  aria-label={language === 'AR' ? 'مشاركة' : 'Share'}
                >
                  <Send className="w-4 h-4 fill-[#8B5A2B] -rotate-45 ml-0.5 mb-0.5" />
                </button>
              </div>
            </div>

            {productBullets.length > 0 ? (
            <div className="space-y-2 pt-2.5 pb-2">
              {productBullets.map((bullet, bIdx) => (
                <div key={bIdx} className="flex items-center gap-2.5 text-xs sm:text-[13px] font-semibold text-neutral-800 leading-snug">
                  <span className="w-1.5 h-1.5 rounded-none bg-neutral-900 shrink-0" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
            ) : null}

            {showSaleBanner && displayDiscount > 0 ? (
            <div className="relative w-full rounded-2xl bg-gradient-to-r from-[#8B5A2B] via-[#986131] to-[#A46836] p-4 sm:p-4.5 text-white overflow-hidden select-none my-3">
              {/* Top Row: Title + Discount Text + Sparkling Star */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                    {language === 'AR' ? 'عرض لفترة محدودة' : 'Limited Time Offer'}
                  </h3>
                  <div className="text-xs sm:text-sm font-bold text-white/95 font-sans">
                    {language === 'AR'
                      ? `خصم${displayDiscount.toLocaleString()}⃁`
                      : `⃁ ${displayDiscount.toLocaleString()} OFF`}
                  </div>
                </div>

                {/* Decorative 4-point Sparkle Icon (Matches Image 1) */}
                <div className="relative shrink-0 p-1">
                  <svg className="w-7 h-7 text-white fill-white" viewBox="0 0 24 24">
                    <path d="M12 2L13.8 9.2L21 11L13.8 12.8L12 20L10.2 12.8L3 11L10.2 9.2L12 2Z" />
                  </svg>
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-white/90" />
                </div>
              </div>

              {/* Bottom Row: Clock/Timer Icon + Countdown Boxes (Matches Image 1) */}
              <div className="mt-3.5 flex items-center justify-between gap-2 pt-2.5 border-t border-white/25 flex-wrap sm:flex-nowrap">
                {/* Timer Icon */}
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 text-white stroke-[2.2]" />
                </div>

                {/* Countdown Tiles & Label */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-[11px] sm:text-xs font-bold text-white shrink-0">
                    {language === 'AR' ? 'ينتهي في' : 'Ends in'}
                  </span>

                  {/* Days */}
                  <div className="flex items-center gap-1">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-[#8B5A2B] font-black text-xs sm:text-sm font-sans flex items-center justify-center">
                      {timeLeft.days}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold text-white">
                      {language === 'AR' ? 'يوماً' : 'd'}
                    </span>
                  </div>

                  {/* Hours */}
                  <div className="flex items-center gap-1">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-[#8B5A2B] font-black text-xs sm:text-sm font-sans flex items-center justify-center">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold text-white">
                      {language === 'AR' ? 'س' : 'h'}
                    </span>
                  </div>

                  {/* Minutes */}
                  <div className="flex items-center gap-1">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-[#8B5A2B] font-black text-xs sm:text-sm font-sans flex items-center justify-center">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold text-white">
                      {language === 'AR' ? 'د' : 'm'}
                    </span>
                  </div>

                  {/* Seconds */}
                  <div className="flex items-center gap-1">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-[#8B5A2B] font-black text-xs sm:text-sm font-sans flex items-center justify-center">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold text-white">
                      {language === 'AR' ? 'ث' : 's'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            ) : null}

            {(useDynamicOptions || hasCustomFields) && product && (
              <ProductDynamicPurchase
                options={useDynamicOptions ? liveOptions : []}
                variations={product.variations as never}
                fields={purchaseFields as never}
                rules={product.conditionalRules as never}
                selected={optionPick}
                onSelect={setOptionPick}
                fieldValues={fieldValues}
                onFieldValues={setFieldValues}
                isAr={language === 'AR'}
                tone="coffee"
                basePrice={Number(product.basePrice) || 0}
                invalidFieldIds={invalidFieldIds}
              />
            )}
            {useDynamicOptions && resolvedPick?.purchasable === false && (
              <p className="text-xs font-bold text-rose-600">
                {language === 'AR' ? 'هذا الخيار غير متوفر' : 'This option is out of stock'}
              </p>
            )}

            {/* Honor Care box — product.warranties (when custom Care field is absent) */}
            {!hasCustomCareField && product.warranties && product.warranties.length > 0 ? (
              <div
                data-honor-care-panel="1"
                className="rounded-xl bg-white p-4 sm:p-5 space-y-3 shadow-none box-border"
                style={{
                  boxShadow: 'none',
                  border: '1px solid #000000',
                  outline: '1px solid #000000',
                  outlineOffset: '-1px',
                  borderRadius: '12px',
                }}
              >
                <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">
                  {language === 'AR' ? 'باقة رعاية هايبرو' : 'HiBrew Care Package'}
                </h2>
                <div className="space-y-1">
                  {product.warranties.map((w) => {
                    const on = selectedWarranty?.id === w.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setSelectedWarranty(on ? undefined : w)}
                        className="w-full flex items-center gap-3 py-3 text-start bg-transparent cursor-pointer shadow-none border-0"
                        style={{ boxShadow: 'none' }}
                      >
                        <span
                          className="w-[18px] h-[18px] rounded-[3px] flex items-center justify-center shrink-0 bg-white border border-solid border-neutral-900 box-border"
                          style={{ boxShadow: 'none', border: '1px solid #000000', borderColor: '#000000' }}
                          aria-hidden
                        >
                          {on ? <span className="w-2.5 h-2.5 bg-black block rounded-[1px]" /> : null}
                        </span>
                        <span
                          className="w-10 h-10 rounded-lg bg-[#E8F4FF] flex items-center justify-center shrink-0"
                          style={{ border: '1px solid #D2D2D7' }}
                          aria-hidden
                        >
                          <ShieldCheck className="w-5 h-5 text-[#2B7CD3]" />
                        </span>
                        <span className="flex-1 min-w-0 text-xs sm:text-sm font-bold text-neutral-900 leading-snug">
                          {language === 'AR' && w.nameAr ? w.nameAr : w.name}
                        </span>
                        <span className="shrink-0 text-xs sm:text-sm font-bold text-neutral-900 font-sans">
                          {language === 'AR'
                            ? `${Number(w.price || 0).toLocaleString()}⃁`
                            : `SAR ${Number(w.price || 0).toLocaleString()}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* 2. COLOR — Honor ring (one select) */}
            {hasLegacyColors && (
            <div className="space-y-3 pt-3 border-t border-neutral-100">
              <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">
                {language === 'AR' ? 'اللون' : 'Color'}
              </h2>
              <div className="flex items-center gap-3 flex-wrap" role="radiogroup" aria-label={language === 'AR' ? 'اللون' : 'Color'}>
                {productColors.map((c, idx) => {
                  const isSelected = selectedColor?.name === c.name;
                  const label = language === 'AR' && c.nameAr ? c.nameAr : c.name;
                  return (
                    <HonorColorSwatch
                      key={c.name || idx}
                      hex={c.hex}
                      selected={isSelected}
                      label={label}
                      onClick={() => handleColorChange(c)}
                    />
                  );
                })}
              </div>
              <div className="pt-1 space-y-1">
                <div className="text-sm font-bold text-neutral-900">
                  {language === 'AR' && selectedColor?.nameAr ? selectedColor.nameAr : selectedColor?.name}
                </div>
                <div className="inline-block px-2.5 py-1 rounded-md bg-[#2B7CD3] text-white text-xs font-bold font-sans">
                  {language === 'AR' ? `${unitPrice.toLocaleString()}.00 ⃁` : `SAR ${unitPrice.toLocaleString()}.00`}
                </div>
              </div>
            </div>
            )}

            {/* 3. Memory / edition — Honor card (selected = thick black border) */}
            {hasLegacyStorage && product.storageOptions && (
              <div className="space-y-3 pt-3 border-t border-neutral-100">
                <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">
                  {language === 'AR' ? 'الإصدار / المواصفات' : 'Specification / Edition'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup">
                  {product.storageOptions.map((opt, idx) => {
                    const isSelected = selectedStorage?.capacity === opt.capacity;
                    const optPrice = product.basePrice + colorOrImagePriceDelta + (opt.priceDelta || 0);
                    return (
                      <HonorMemoryCard
                        key={opt.capacity || idx}
                        selected={isSelected}
                        title={language === 'AR' && opt.capacityAr ? opt.capacityAr : opt.capacity}
                        subtitle={
                          opt.ramAr || opt.ram
                            ? language === 'AR' && opt.ramAr
                              ? opt.ramAr
                              : opt.ram
                            : undefined
                        }
                        priceLabel={
                          language === 'AR'
                            ? `${optPrice.toLocaleString()}.00 ⃁`
                            : `SAR ${optPrice.toLocaleString()}.00`
                        }
                        onClick={() => setSelectedStorage(opt)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. OPTIONAL BARISTA ADD-ONS / BUNDLES */}
            {product.bundles && product.bundles.length > 0 && (
              <div id="bundle-offers-section" className="space-y-3 pt-3 border-t border-neutral-100 scroll-mt-28">
                <h2 className="text-base font-extrabold text-neutral-900 tracking-tight flex items-center justify-between">
                  <span>{language === 'AR' ? 'إضافات وبكجات الباريستا الموصى بها' : 'Recommended Barista Kits'}</span>
                  <span className="text-xs font-normal text-emerald-600">
                    {language === 'AR' ? 'عرض خاص على البكج' : 'Special Bundle Offer'}
                  </span>
                </h2>

                {/* Honor Gift style — each bundle its own bordered card */}
                <div className="space-y-3">
                  {product.bundles.map(bundle => {
                    const isSelected = selectedBundles.some(b => b.id === bundle.id);
                    return (
                      <button
                        key={bundle.id}
                        type="button"
                        role="checkbox"
                        aria-checked={isSelected}
                        onClick={() => toggleBundle(bundle)}
                        className={`w-full px-4 py-3.5 flex items-center gap-3 transition-all cursor-pointer box-border ${
                          isSelected ? 'bg-neutral-50 font-bold' : 'bg-white'
                        }`}
                        data-honor-offer-row="1"
                        style={honorCardStyle(isSelected)}
                      >
                        <HonorSelectMark selected={isSelected} multiple />
                        <span className="flex-1 min-w-0 text-start font-bold text-xs sm:text-sm text-neutral-900">
                          {language === 'AR' && bundle.nameAr ? bundle.nameAr : bundle.name}
                        </span>
                        <span className="font-sans text-xs sm:text-sm font-bold text-neutral-900 shrink-0">
                          {language === 'AR' ? `+${bundle.price}⃁` : `+SAR ${bundle.price}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. QUANTITY STEPPER */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#F8F9FA] shadow-none border border-solid border-black box-border" style={{ boxShadow: 'none', border: '1px solid #000000' }}>
              <span className="text-xs font-bold text-neutral-800">
                {language === 'AR' ? 'الكمية المطلوبة:' : 'Quantity:'}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full bg-white hover:bg-neutral-200 border border-neutral-200 font-bold text-sm cursor-pointer flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <span className="font-mono font-black text-sm w-6 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-neutral-200 border border-neutral-200 font-bold text-sm cursor-pointer flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* 6. HONOR SUMMARY BOX (Exact 1:1 match with Reference Image 1) */}
            <div className="rounded-xl bg-[#F8F9FA] p-5 sm:p-6 space-y-4 shadow-none border border-solid border-black box-border" style={{ boxShadow: 'none', border: '1px solid #000000' }}>
              <h3 className="font-bold text-base sm:text-lg text-neutral-900 tracking-tight">
                {language === 'AR' ? 'ملخص الطلب' : 'Order Summary'}
              </h3>

              {/* Main Product Line */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-xs sm:text-sm text-neutral-900 leading-snug">
                      {language === 'AR' && product.nameAr ? product.nameAr : product.name}
                      {useDynamicOptions && optionSummary
                        ? ` — ${optionSummary}`
                        : `${selectedStorage ? ` (${language === 'AR' && selectedStorage.capacityAr ? selectedStorage.capacityAr : selectedStorage.capacity})` : ''}${selectedColor ? ` - ${language === 'AR' && selectedColor.nameAr ? selectedColor.nameAr : selectedColor.name}` : ''}`}
                    </h4>
                    {(useDynamicOptions && optionSummary) || selectedColor || selectedStorage ? (
                    <p className="text-xs text-neutral-500">
                      {useDynamicOptions && optionSummary
                        ? optionSummary
                        : (
                          <>
                            {selectedColor
                              ? `${language === 'AR' ? 'اللون:' : 'Color:'} ${language === 'AR' && selectedColor.nameAr ? selectedColor.nameAr : selectedColor.name}`
                              : null}
                            {selectedColor && selectedStorage ? ' · ' : null}
                            {selectedStorage
                              ? (language === 'AR' && selectedStorage.capacityAr ? selectedStorage.capacityAr : selectedStorage.capacity)
                              : null}
                          </>
                        )}
                    </p>
                    ) : null}
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-neutral-900 shrink-0 font-sans">
                    {language === 'AR' ? `${unitPrice.toLocaleString()}.00 ⃁` : `⃁ ${unitPrice.toLocaleString()}.00`}
                  </span>
                </div>
              </div>

              {hasCustomFields &&
              purchaseNotes(
                purchaseFields as never,
                fieldValues,
                product?.conditionalRules as never,
                optionPick,
                language === 'AR',
              ).length > 0 ? (
                <div className="space-y-1.5 pt-1 border-t border-neutral-200/70">
                  <p className="text-[11px] font-bold text-neutral-800">
                    {language === 'AR' ? 'الخيارات المخصصة' : 'Custom selections'}
                  </p>
                  {purchaseNotes(
                    purchaseFields as never,
                    fieldValues,
                    product?.conditionalRules as never,
                    optionPick,
                    language === 'AR',
                  ).map((line) => (
                    <div key={line} className="text-xs text-neutral-600 leading-snug">
                      {line}
                    </div>
                  ))}
                </div>
              ) : null}

              {savingsSAR > 0 ? (
              <div className="border-t border-neutral-200/70" />
              ) : null}

              {/* Total & Savings - Matching Image 1 */}
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-base text-neutral-900">
                    {language === 'AR' ? 'المجموع الكلي' : 'Total'}
                  </span>
                  <div className="text-end">
                    <div className="text-base sm:text-xl font-bold text-neutral-900 font-sans">
                      {language === 'AR' ? `${totalPrice.toLocaleString()}.00 ⃁` : `⃁ ${totalPrice.toLocaleString()}.00`}
                    </div>
                    {savingsSAR > 0 && (
                    <div className="flex items-center justify-end gap-2 mt-0.5">
                      <span className="text-xs font-semibold text-red-600 font-sans">
                        {language === 'AR' ? `وفرت${savingsSAR.toLocaleString()}.00 ⃁` : `Save SAR ${savingsSAR.toLocaleString()}.00`}
                      </span>
                      <span className="text-xs text-neutral-400 line-through font-sans">
                        {language === 'AR' ? `${originalPrice.toLocaleString()}.00 ⃁` : `⃁ ${originalPrice.toLocaleString()}.00`}
                      </span>
                    </div>
                    )}
                  </div>
                </div>
              </div>

              {showCouponOnBuy ? (
                <form onSubmit={handleApplyCoupon} className="pt-1" data-checkout-coupon="on">
                  <div className="flex gap-2">
                    <div className="relative flex-1 min-w-0">
                      <Tag className={`w-4 h-4 text-neutral-400 absolute ${language === 'AR' ? 'right-3' : 'left-3'} top-3`} />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder={language === 'AR' ? 'كود الخصم أو بطاقة الهدية' : 'Promo or gift code'}
                        className={`w-full ${language === 'AR' ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'} py-2.5 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden uppercase font-mono`}
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      {language === 'AR' ? 'تطبيق' : 'Apply'}
                    </button>
                  </div>
                  {appliedCoupon?.code ? (
                    <p className="text-[11px] text-emerald-700 mt-1.5 flex items-center justify-between gap-2">
                      <span>
                        {language === 'AR'
                          ? `مطبّق: ${appliedCoupon.code}`
                          : `Applied: ${appliedCoupon.code}`}
                      </span>
                      <button type="button" onClick={removeCoupon} className="underline text-neutral-500">
                        {language === 'AR' ? 'إزالة' : 'Remove'}
                      </button>
                    </p>
                  ) : null}
                  {couponDiscount > 0 ? (
                    <p className="text-[11px] text-emerald-700 mt-1">
                      {language === 'AR'
                        ? `خصم السلة: ${couponDiscount.toLocaleString()} ⃁`
                        : `Cart discount: SAR ${couponDiscount.toLocaleString()}`}
                    </p>
                  ) : null}
                </form>
              ) : null}

              {/* BUY NOW BUTTON (Inside Summary Box - Black Pill capsule matching Image 1) */}
              <div className="pt-2">
                <button
                  onClick={handleInstantBuy}
                  disabled={Boolean(outOfStockReason)}
                  className="w-full py-3.5 sm:py-4 px-8 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-sm sm:text-base flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{language === 'AR' ? 'شراء الآن' : 'Buy Now'}</span>
                </button>

                {/* Subtle Add to Bag option for store functionality */}
                <button
                  onClick={handleAddToCart}
                  className="w-full mt-2 text-center text-xs text-neutral-400 hover:text-neutral-900 font-medium py-1 cursor-pointer transition-colors"
                >
                  {language === 'AR' ? 'أو أضف إلى حقيبة التسوق' : 'or Add to Bag'}
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 7. SECOND SECTIONS: TABBY & TAMARA CARDS (Exact match with Image 1)       */}
            {/* ========================================================================= */}
            <div className="space-y-3">
              {/* Tabby Installment Card */}
              <div
                className="bg-white border border-neutral-200 rounded-xl p-4 hover:border-neutral-300 transition-all shadow-none"
                style={{ boxShadow: 'none' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-neutral-700 leading-relaxed">
                      {language === 'AR' ? (
                        <>
                          يبدأ من <span className="font-bold text-neutral-900">﷼ {(totalPrice / 12).toFixed(2)}/شهرياً</span> حتى 12 دفعة شهرية. متوافق مع الشريعة.
                        </>
                      ) : (
                        <>
                          From <span className="font-bold text-neutral-900">﷼ {(totalPrice / 12).toFixed(2)}/mo</span> with up to 12 monthly payments. Shariah-compliant.
                        </>
                      )}
                    </p>
                    <button
                      type="button"
                      className="mt-1 text-xs font-semibold text-[#8B5A2B] hover:text-[#6F4E37] hover:underline cursor-pointer block text-start"
                    >
                      {language === 'AR' ? 'اعرف المزيد' : 'Learn more'}
                    </button>
                  </div>
                  <div className="shrink-0 bg-[#38FF9C] text-black font-extrabold text-[12px] px-2.5 py-1 rounded-md tracking-tight select-none">
                    tabby
                  </div>
                </div>

                <div className="border-t border-neutral-200/80 my-3" />

                <div className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2 text-xs sm:text-[13px] font-semibold text-neutral-800">
                    <div className="w-4 h-4 rounded-full bg-[#8B5A2B] text-white flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-current">
                        <path d="M12 2l2.4 5.5 6 .5-4.5 4 1.3 5.8L12 15l-5.2 2.8 1.3-5.8-4.5-4 6-.5z"/>
                      </svg>
                    </div>
                    <span>
                      {language === 'AR'
                        ? '8 دفعات بدون أي فوائد على المنتجات المؤهلة'
                        : '8 Interest-free payments on eligible items'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 group-hover:translate-x-0.5 rtl:rotate-180 transition-all shrink-0" />
                </div>
              </div>

              {/* Tamara Installment Card — only when gateway connected + product logo toggle ON */}
              {showTamaraOnProduct ? (
                <div
                className="bg-white border border-neutral-200 rounded-xl p-4 hover:border-neutral-300 transition-all shadow-none"
                style={{ boxShadow: 'none' }}
              >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-neutral-700 leading-relaxed">
                        {language === 'AR' ? (
                          <>
                            أو قسّمها على{' '}
                            <span className="font-bold text-neutral-900">
                              4 دفعات × ﷼ {(totalPrice / 4).toFixed(2)}
                            </span>{' '}
                            بدون فوائد، متوافق مع الشريعة!
                          </>
                        ) : (
                          <>
                            Or split into{' '}
                            <span className="font-bold text-neutral-900">
                              4 × ﷼ {(totalPrice / 4).toFixed(2)}
                            </span>{' '}
                            interest-free, Sharia compliant!
                          </>
                        )}
                      </p>
                      <button
                        type="button"
                        className="mt-1 text-xs font-semibold text-neutral-900 underline hover:text-black cursor-pointer block text-start"
                      >
                        {language === 'AR' ? 'خيارات إضافية' : 'More options'}
                      </button>
                    </div>
                    <div className="shrink-0">
                      <TamaraIcon className="h-6" />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* APPROVED PAYMENT LOGOS — BNPL logos only when that gateway is connected */}
            <div className="pt-2 space-y-2">
              <span className="text-[11px] text-neutral-500 block text-center">
                {language === 'AR' ? 'وسائل الدفع المعتمدة والتقسيط بالمملكة:' : 'Approved Payment & Installment Methods:'}
              </span>
              <div className="flex items-center justify-center gap-3.5 flex-wrap">
                <MadaIcon className="h-4.5" />
                <ApplePayIcon className="h-4.5" />
                {showTabbyOnProduct ? <TabbyIcon className="h-4" /> : null}
                {showTamaraOnProduct ? <TamaraIcon className="h-4" /> : null}
                <VisaIcon className="h-4" />
                <MastercardIcon className="h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. BELOW STICKY SECTION: HIGH-RES FEATURE STORY BANNERS                   */}
        {/* ========================================================================= */}
        <section id="overview-features" className="mt-20 sm:mt-28 space-y-12 border-t border-[#E5E5E5] pt-16 scroll-mt-28">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-block text-xs font-bold text-neutral-600 uppercase tracking-widest bg-neutral-100 px-4 py-1.5 rounded-full">
              {language === 'AR' ? 'الهندسة والابتكار' : 'Flagship Architecture'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight text-center">
              {language === 'AR' ? `هندسة متطورة لتجربة باريستا حقيقية مع${product.nameAr || product.name}` : `Engineered for Specialty Coffee Masters · ${product.name}`}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl mx-auto">
              {language === 'AR'
                ? 'استخلاص متوازن بضغط فائق مع تقنيات تسخين متطورة وتحكم حراري رقمي دقيق لمذاق المقاهي المختصة.'
                : 'Commercial-grade engineering with calibrated extraction pressure and thermal stability for barista perfection.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#F8F9FA] rounded-[28px] p-6 sm:p-8 flex flex-col justify-between border border-neutral-100 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-6">
                <Gauge className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg sm:text-xl text-neutral-900 tracking-tight">
                  {language === 'AR' ? 'مضخة إيطالية 20 بار' : '20-Bar Italian ULKA Pump'}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {language === 'AR'
                    ? 'ضغط تدفق ثابت يضمن استخلاص أعمق الزيوت العطرية من البن وتشكيل طبقة كريمة ذهبية كثيفة.'
                    : 'Provides consistent high-pressure flow to extract aromatic espresso oils with signature dense crema.'}
                </p>
              </div>
            </div>

            <div className="bg-[#F8F9FA] rounded-[28px] p-6 sm:p-8 flex flex-col justify-between border border-neutral-100 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-6">
                <Flame className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg sm:text-xl text-neutral-900 tracking-tight">
                  {language === 'AR' ? 'نظام التحكم الحراري المزدوج' : 'Dual Thermo PID Control'}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {language === 'AR'
                    ? 'تحكم حراري رقمي مستقل للقهوة والتبخير بفارق ±0.5°م فقط لمنع احتراق نكهات القهوة.'
                    : 'Independent temperature equilibrium across brewing and steaming chambers within ±0.5°C accuracy.'}
                </p>
              </div>
            </div>

            <div className="bg-[#F8F9FA] rounded-[28px] p-6 sm:p-8 flex flex-col justify-between border border-neutral-100 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg sm:text-xl text-neutral-900 tracking-tight">
                  {language === 'AR' ? 'بورتافلتر تجاري 58 مم' : '58mm Commercial Group'}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {language === 'AR'
                    ? 'مقاس تجاري عالمي من الفولاذ المقاوم للصدأ يتيح استخدام باسكتات احترافية وتوزيع بن مثالي.'
                    : 'Full commercial stainless steel portafilter for uniform extraction bed saturation and barista ergonomics.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. GROUP CHILD COMPARISON + optional merchant comparison banner image     */}
        {/* ========================================================================= */}
        {parentIsGrouped && compareChildren.length >= 2 ? (
          <GroupChildrenComparison
            children={compareChildren}
            selectedId={activeChildId}
            language={language}
            onSelect={(id) => setActiveChildId(String(id))}
            onBuy={handleCompareBuy}
          />
        ) : null}
        <ProductComparisonSection
          currentProduct={parentProduct || product}
          language={language}
          anchorId={
            parentIsGrouped && compareChildren.length >= 2
              ? ''
              : 'specs-comparison-section'
          }
        />

        {/* ========================================================================= */}
        {/* 6. HONOR-STYLE CUSTOMER REVIEWS (Screenshot 4)                            */}
        {/* ========================================================================= */}
        <section id="customer-reviews-section" className="mt-20 sm:mt-28 space-y-10 border-t border-[#E5E5E5] pt-16 scroll-mt-28">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-bold uppercase tracking-wider mb-2">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{language === 'AR' ? 'تقييمات العملاء الموثقة بالمملكة' : 'Verified Customer Ratings'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                {language === 'AR' ? 'تجارب وآراء المشترين' : 'Customer Reviews & Feedback'}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                {language === 'AR'
                  ? 'جميع التقييمات صادرة عن مشترين تم التحقق من طلباتهم وتوصيلها داخل المملكة العربية السعودية'
                  : 'All reviews are submitted by verified buyers delivered within Saudi Arabia'}
              </p>
            </div>

            <button
              onClick={() => setIsWritingReview(!isWritingReview)}
              className="px-6 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <MessageSquare className="w-4 h-4" />
              <span>
                {isWritingReview
                  ? (language === 'AR' ? 'إلغاء' : 'Cancel')
                  : (language === 'AR' ? 'كتابة تقييم جديد' : 'Write a Review')}
              </span>
            </button>
          </div>

          {/* Rating Summary Card (Honor Style 5.0 Rating Box) */}
          <div className="bg-[#F8F9FA] rounded-[28px] p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center border border-neutral-100">
            {/* Score & Stars */}
            <div className="md:col-span-4 text-center md:text-start flex flex-col items-center md:items-start justify-center border-b md:border-b-0 md:border-r rtl:md:border-r-0 rtl:md:border-l border-neutral-200/70 pb-6 md:pb-0 md:pr-8 rtl:md:pl-8">
              <div className="text-5xl sm:text-6xl font-black text-neutral-950 font-mono tracking-tight">
                {reviewStats.avgDisplay}
              </div>
              <div className="flex items-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${
                      reviewStats.total > 0 && s <= Math.round(Number(reviewStats.avgDisplay) || 0)
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-neutral-200 text-neutral-200'
                    }`}
                  />
                ))}
              </div>
              <div className="text-xs sm:text-sm text-neutral-500 font-medium">
                {reviewStats.total > 0
                  ? language === 'AR'
                    ? `بناءً على ${reviewStats.total} تقييم معتمد`
                    : `Based on ${reviewStats.total} approved reviews`
                  : language === 'AR'
                    ? 'لا توجد تقييمات معتمدة بعد'
                    : 'No approved reviews yet'}
              </div>
              {reviewStats.satisfaction != null && reviewStats.total > 0 ? (
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {language === 'AR'
                      ? `نسبة رضا ${reviewStats.satisfaction}%`
                      : `${reviewStats.satisfaction}% satisfaction`}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Breakdown Bars */}
            <div className="md:col-span-8 space-y-2">
              {reviewStats.breakdown.map(row => (
                <div key={row.star} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-12 shrink-0 font-medium text-neutral-600">
                    <span>{row.star}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-neutral-400 text-end font-mono text-[11px] shrink-0">
                    {row.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Success Notification Alert */}
          {showReviewSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                {language === 'AR'
                  ? 'تم استلام تقييمك بنجاح! شكراً لمشاركتك رأيك القيم مع عائلة هاي برو.'
                  : 'Your review was submitted successfully! Thank you for sharing your experience.'}
              </span>
            </div>
          )}

          {/* Review Submission Form */}
          {isWritingReview && (
            <form
              onSubmit={handleSubmitReview}
              className="bg-white border border-neutral-200 rounded-[28px] p-6 sm:p-8 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <span className="font-extrabold text-sm sm:text-base text-neutral-900">
                  {language === 'AR' ? 'شارك رأيك في هذا المنتج' : 'Write Your Review'}
                </span>
                <span className="text-xs text-neutral-400">
                  {language === 'AR' ? 'يُنشر بعد موافقة المتجر' : 'Published after store approval'}
                </span>
              </div>

              {/* Star Rating Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700">
                  {language === 'AR' ? 'تقييمك للمنتج (بالنجوم):' : 'Your Rating:'}
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewRating(st)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          st <= newRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-neutral-300 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder={language === 'AR' ? 'اسمك الأول أو اللقب' : 'Your name / nickname'}
                  value={newAuthor}
                  onChange={e => setNewAuthor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-black"
                />
                <input
                  type="text"
                  placeholder={language === 'AR' ? 'المدينة (مثل: الرياض، جدة)' : 'City (e.g. Riyadh, Jeddah)'}
                  value={newCity}
                  onChange={e => setNewCity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-black"
                />
              </div>

              <textarea
                placeholder={language === 'AR' ? 'اكتب رأيك وتجربتك مع الماكينة واستخلاص القهوة...' : 'Write your detailed thoughts on extraction, build quality and steaming...'}
                rows={4}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:border-black"
              />

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-7 py-3 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{language === 'AR' ? 'نشر التقييم الآن' : 'Submit Review'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Reviews Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
            <button
              onClick={() => setActiveReviewTab('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                activeReviewTab === 'all'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {language === 'AR' ? `جميع التقييمات (${reviewsList.length})` : `All Reviews (${reviewsList.length})`}
            </button>
            <button
              onClick={() => setActiveReviewTab('images')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                activeReviewTab === 'images'
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {language === 'AR'
                ? `مع صور للمنتج (${reviewsList.filter((r) => r.hasImage).length})`
                : `With Photos (${reviewsList.filter((r) => r.hasImage).length})`}
            </button>
          </div>

          {/* Review Cards — real approved reviews only */}
          <div className="space-y-4">
            {reviewsLoading ? (
              <p className="text-sm text-neutral-500 py-6 text-center">
                {language === 'AR' ? 'جاري تحميل التقييمات…' : 'Loading reviews…'}
              </p>
            ) : null}
            {!reviewsLoading &&
            reviewsList.filter((r) => (activeReviewTab === 'images' ? r.hasImage : true)).length === 0 ? (
              <p className="text-sm text-neutral-500 py-8 text-center">
                {language === 'AR' ? 'لا توجد تقييمات معتمدة بعد' : 'No approved reviews yet'}
              </p>
            ) : null}
            {reviewsList
              .filter(r => (activeReviewTab === 'images' ? r.hasImage : true))
              .map(rev => (
                <div
                  key={rev.id}
                  className="bg-[#F8F9FA] rounded-[24px] p-6 border border-neutral-100/80 space-y-3"
                >
                  {/* Top user row */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-xs text-neutral-700">
                        {rev.author.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-neutral-900">{rev.author}</span>
                          <span className="text-[10px] text-neutral-400">({language === 'AR' ? rev.city : rev.cityEn})</span>
                          {rev.verified && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{language === 'AR' ? 'مشتري موثق بالمملكة' : 'Verified Buyer'}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] text-neutral-400 font-mono">{rev.date}</span>
                  </div>

                  {/* Model Purchased Badge */}
                  <div className="text-[11px] text-neutral-500 font-medium">
                    {language === 'AR' ? 'المنتج المشترى:' : 'Purchased Edition:'} <span className="text-neutral-700 font-semibold">{language === 'AR' && (rev as any).modelBoughtAr ? (rev as any).modelBoughtAr : rev.modelBought}</span>
                  </div>

                  {/* Content */}
                  <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed font-normal">
                    {language === 'AR' ? rev.contentAr : rev.contentEn}
                  </p>

                  {/* Helpful Button (Screenshot 4) */}
                  <div className="flex items-center justify-end pt-2">
                    <button
                      onClick={() => toggleLikeReview(rev.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                        rev.liked
                          ? 'bg-[#8B5A2B]/10 text-[#8B5A2B] font-bold'
                          : 'bg-white hover:bg-neutral-200/60 text-neutral-600'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{language === 'AR' ? 'مفيد' : 'Helpful'}</span>
                      <span className="font-mono text-[11px]">({rev.likes})</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. FAQ ACCORDION SECTION                                                  */}
        {/* ========================================================================= */}
        <section id="faq-section" className="mt-20 sm:mt-28 space-y-8 border-t border-[#E5E5E5] pt-16 max-w-4xl mx-auto scroll-mt-28">
          <div className="text-center space-y-3">
            <span className="inline-block text-xs font-bold text-neutral-600 uppercase tracking-widest bg-neutral-100 px-4 py-1.5 rounded-full">
              {language === 'AR' ? 'الأسئلة الشائعة والدعم' : 'Frequently Asked Questions'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight text-center">
              {language === 'AR' ? 'كل ما تود معرفته قبل الشراء' : 'Everything You Need to Know'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl mx-auto">
              {language === 'AR' ? 'إجابات شاملة لجميع تساؤلاتك حول الاستخدام، الضمان والشحن السريع.' : 'Answers to all your questions about features, agency warranty, and express delivery.'}
            </p>
          </div>

          <div className="divide-y divide-neutral-200">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-start gap-4 cursor-pointer group py-1"
                  >
                    <span className="font-bold text-sm sm:text-base text-neutral-900 group-hover:text-black">
                      {language === 'AR' ? faq.qAr : faq.qEn}
                    </span>
                    <span className="text-neutral-400 group-hover:text-neutral-700">
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="pt-3 text-xs sm:text-sm text-neutral-600 leading-relaxed pr-2">
                      {language === 'AR' ? faq.aAr : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 8. MOBILE FIXED BOTTOM BUY BAR (< lg screens)                             */}
      {/* ========================================================================= */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-neutral-200 py-2.5 px-4 safe-area-pb">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          {/* Price & savings */}
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-neutral-500 font-medium truncate">
              {language === 'AR' && product.nameAr ? product.nameAr : product.name}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-neutral-900 font-sans tracking-tight">
                {language === 'AR' ? `${totalPrice.toLocaleString()}⃁` : `⃁ ${totalPrice.toLocaleString()}`}
              </span>
              {savingsSAR > 0 && (
                <span className="text-[10px] text-red-600 font-bold font-sans">
                  {language === 'AR' ? `وفر${savingsSAR}⃁` : `Save SAR ${savingsSAR}`}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAddToCart}
              className="px-3.5 py-2.5 rounded-full border border-neutral-300 hover:border-black bg-white text-neutral-900 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              title={language === 'AR' ? 'أضف للسلة' : 'Add to Bag'}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden xs:inline">{language === 'AR' ? 'للسلة' : 'Bag'}</span>
            </button>
            <button
              onClick={handleInstantBuy}
              className="px-5 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <span>{language === 'AR' ? 'شراء الآن' : 'Buy Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
