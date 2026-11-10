import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import type { Product, ProductVariation, ProductColorOption } from '../../types';
import { EditorModal } from './EditorModal';
import { ProductOptionModal, type OptionKind, type OptionValueDraft } from './ProductOptionModal';
import { usePrefs } from '../../i18n/PrefsContext';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../common/ToastProvider';
import { MediaPickerModal } from '../common/MediaPickerModal';
import { handleImageError, FALLBACK_PRODUCT_IMAGE } from '../../utils/imageFallback';
import { optimizeImageFile } from '../../utils/mediaOptimizer';
import { RichTextEditor, looksLikeHtml, PRODUCT_DESCRIPTION_PROSE_CLASS } from '../common/RichTextEditor';
import { getProductDisplayCategory } from '../../utils/storeLocalization';
import {
  CUSTOM_FIELD_TYPES,
  CONDITIONAL_OPERATORS,
  customFieldIsFillable,
  customFieldNeedsOptions,
  getCustomFieldTypeLabel,
  normalizeCustomFieldType,
} from '../../utils/customFieldTypes';
import { listAvailableProductChannels, normalizeProductSalesChannels } from '../../config/productChannels';
import {
  GOOGLE_PRODUCT_TAXONOMY,
  googleTaxonomyLabel,
  isKnownGoogleTaxonomy,
} from '../../config/googleProductTaxonomy';
import {
  findDuplicateBarcodes,
  findDuplicateOptionCombos,
  findDuplicateSkus,
  sumVariantStock,
  buildGeneratedVariants,
  optionValuesList,
  variantPriceParts,
} from '../../utils/productVariants';
import { seedExistingCommerce } from '../../utils/existingProductCommerce';
import { pickLocaleText } from '../../utils/localeLabel';
import * as tenantApi from '../../api/tenantApi';
import { isApiEnabled } from '../../api/client';
import { commerceTerm } from '../../i18n/commerceTerms';
import { buildStorefrontProductUrl } from '../../utils/storefrontLinks';
import type { ProductEditSectionKey } from './ProductEditDrawer';
import {
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Save,
  Trash2,
  Maximize2,
  Plus,
  Search,
  Tag,
  Box,
  Layers,
  Settings,
  Folder,
  FileText,
  FileSpreadsheet,
  GripVertical,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  X,
  Check,
  Sparkles,
  Pencil,
  SlidersHorizontal,
  Info,
  ImageIcon,
  UploadCloud,
  Package,
  Truck,
} from 'lucide-react';

type EditorSectionKey =
  | 'images'
  | 'basic'
  | 'pricing'
  | 'inventory'
  | 'variations'
  | 'options'
  | 'category_tags'
  | 'custom_fields'
  | 'seo';

const EDITOR_TO_FILTER_KEY: Partial<Record<EditorSectionKey, ProductEditSectionKey>> = {
  images: 'images',
  basic: 'basic',
  pricing: 'pricing',
  inventory: 'inventory',
  variations: 'variations',
  options: 'variations',
  category_tags: 'categoryTags',
  custom_fields: 'customFields',
  seo: 'seo',
};

type ProductShippingMode = 'store_default' | 'own_delivery' | 'shipping_company';

export interface StoreProductEditorViewProps {
  product: Product;
  /** create = blank manual add form; edit = existing product */
  mode?: 'create' | 'edit';
  storeName: string;
  storeSlug?: string;
  storeId?: string;
  canMutate?: boolean;
  categories: string[];
  /** Hierarchical labels (category + subcategory). Falls back to `categories`. */
  categoryOptions?: { value: string; label: string }[];
  availableBrands?: string[];
  onBack: () => void;
  onSave: (updatedData: Partial<Product>) => void;
  onDelete: () => void;
  onDuplicate?: (product: Product) => void;
  /** Open store admin tab (e.g. shipping) from product editor. */
  onNavigateTab?: (tab: string) => void;
  /** Shared with list Filter popover — hide/show editor cards. */
  visibleSections?: Partial<Record<ProductEditSectionKey, boolean>>;
  onVisibleSectionsChange?: (next: Record<ProductEditSectionKey, boolean>) => void;
}

export interface CustomFieldItem {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  contentEn?: string;
  contentAr?: string;
  hidden?: boolean;
  type?: string;
  required?: boolean;
  conditionalRule?: string;
  conditions?: Array<{ fieldId: string; operator: string; value?: string }>;
  conditionJoin?: 'AND' | 'OR';
  extraPrice?: number;
  options?: string[];
  value?: string;
}

export interface ProductOptionValueItem {
  id: string;
  label: string;
  labelAr?: string;
  colorHex?: string;
  imageUrl?: string;
  videoUrl?: string;
  selected: boolean;
  price?: number | null;
  salePrice?: number | null;
  stock?: number | null;
  sku?: string;
  weight?: number | null;
  weightUnit?: 'kg' | 'g' | string | null;
}

export interface ProductOptionItem {
  id: string;
  name: string;
  nameAr?: string;
  type: 'color' | 'select' | 'text' | 'image' | string;
  visible?: boolean;
  values: ProductOptionValueItem[];
}

function normalizeOptionType(
  raw: string | undefined,
  name: string,
): OptionKind {
  const t = String(raw || '').toLowerCase();
  if (t === 'color' || t === 'image' || t === 'text' || t === 'select' || t === 'video') return t;
  const n = name.toLowerCase();
  if (n.includes('color') || name.includes('لون')) return 'color';
  if (n.includes('video') || name.includes('فيديو')) return 'video';
  if (n.includes('image') || name.includes('صور')) return 'image';
  if (n.includes('size') || name.includes('مقاس') || name.includes('حجم')) return 'select';
  return 'text';
}

function toDraftValue(v: ProductOptionValueItem): OptionValueDraft {
  return {
    id: v.id,
    label: v.label,
    labelAr: v.labelAr || '',
    colorHex: v.colorHex,
    imageUrl: v.imageUrl,
    videoUrl: v.videoUrl,
    selected: v.selected !== false,
    price: v.price == null ? '' : String(v.price),
    salePrice: v.salePrice == null ? '' : String(v.salePrice),
    stock: v.stock == null ? '' : String(v.stock),
    sku: v.sku || '',
    weight: v.weight == null ? '' : String(v.weight),
    weightUnit: v.weightUnit === 'g' ? 'g' : 'kg',
  };
}

function fromDraftValue(v: OptionValueDraft): ProductOptionValueItem {
  const num = (raw: string) => {
    if (!raw.trim()) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };
  const ar = (v.labelAr || '').trim();
  const en = v.label.trim();
  return {
    id: v.id,
    label: en || ar,
    labelAr: ar || undefined,
    colorHex: v.colorHex,
    imageUrl: v.imageUrl,
    videoUrl: v.videoUrl,
    selected: v.selected !== false,
    price: num(v.price),
    salePrice: num(v.salePrice),
    stock: num(v.stock),
    sku: v.sku,
    weight: num(v.weight),
    weightUnit: v.weightUnit,
  };
}

export interface ConditionalRuleItem {
  id: string;
  optionName: string;
  operator: string;
  value: string;
  action: 'show' | 'hide';
  targetFieldNames: string[];
}

export const StoreProductEditorView: React.FC<StoreProductEditorViewProps> = ({
  product,
  mode = 'edit',
  storeName,
  storeSlug = 'store',
  storeId = '',
  canMutate = true,
  onNavigateTab,
  categories,
  categoryOptions,
  availableBrands = [],
  onBack,
  onSave,
  onDelete,
  onDuplicate,
  visibleSections,
  onVisibleSectionsChange,
}) => {
  const { t, locale, currency, money } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';
  const isCreateMode = mode === 'create';

  // ── Form State ──
  const [name, setName] = useState(product.name || '');
  const [sku, setSku] = useState(product.sku || '');
  const [category, setCategory] = useState(product.category || (categories[0] || 'General'));
  const [brand, setBrand] = useState(product.brand || availableBrands[0] || storeName);
  const [productType, setProductType] = useState(product.productType || 'Physical Product');
  const [subtitle, setSubtitle] = useState(product.subtitle || '');
  const [googleTaxonomy, setGoogleTaxonomy] = useState(product.googleTaxonomy || '');
  const [description, setDescription] = useState(product.description || '');
  const [isFeatured, setIsFeatured] = useState(
    Boolean(
      product.isFeatured ||
        product.badge === 'featured' ||
        (Array.isArray(product.tags) && product.tags.includes('featured')),
    ),
  );
  const [discountStartAt, setDiscountStartAt] = useState(product.discountStartAt || '');
  const [discountEndAt, setDiscountEndAt] = useState(product.discountEndAt || '');
  const [salesChannels, setSalesChannels] = useState<string[]>(() =>
    normalizeProductSalesChannels(product.salesChannels),
  );
  const [optionsEnabled, setOptionsEnabled] = useState(true);
  const [variantSearch, setVariantSearch] = useState('');
  const [expandedVariantIds, setExpandedVariantIds] = useState<string[]>([]);

  // ── Pricing State (regular + optional sale; synced with API original_price) ──
  const [price, setPrice] = useState<number>(() => {
    if (product.originalPrice && product.originalPrice > (product.price ?? 0)) {
      return product.originalPrice;
    }
    return product.price ?? 0;
  });
  const [discountedPrice, setDiscountedPrice] = useState<number>(() => {
    if (product.discountedPrice && product.discountedPrice > 0) {
      return product.discountedPrice;
    }
    if (product.originalPrice && product.originalPrice > (product.price ?? 0)) {
      return product.price ?? 0;
    }
    return 0;
  });
  const [taxRate, setTaxRate] = useState<number>(product.taxRate ?? 15);

  // ── Inventory & Shipping State ──
  const [stock, setStock] = useState<number>(product.stock ?? 0);
  const [lowStockAlert, setLowStockAlert] = useState<number>(product.lowStockAlert ?? 5);
  const [stockStatus, setStockStatus] = useState<string>(() => {
    if (product.stockStatus) return product.stockStatus;
    if (product.stock === 0) return 'out_of_stock';
    if (product.stock <= 5) return 'low_stock';
    return 'in_stock';
  });
  const [weightKg, setWeightKg] = useState<number>(product.weightKg ?? 0.8);
  const [shippingMode, setShippingMode] = useState<ProductShippingMode>(() => {
    const mode = product.shippingMode;
    if (mode === 'own_delivery' || mode === 'shipping_company' || mode === 'store_default') {
      return mode;
    }
    return 'store_default';
  });
  const [deliveryFee, setDeliveryFee] = useState<number>(
    product.deliveryFee != null && Number.isFinite(Number(product.deliveryFee))
      ? Number(product.deliveryFee)
      : 0,
  );
  const [estimatedDeliveryText, setEstimatedDeliveryText] = useState<string>(
    product.estimatedDeliveryText || '',
  );
  const [requiresOwnDriver, setRequiresOwnDriver] = useState<boolean>(
    Boolean(product.requiresOwnDriver),
  );
  const [allowOwnDelivery, setAllowOwnDelivery] = useState<boolean>(
    product.allowOwnDelivery !== false,
  );
  const [allowShippingCompany, setAllowShippingCompany] = useState<boolean>(
    product.allowShippingCompany !== false,
  );
  const [shippingRateMode, setShippingRateMode] = useState<'fixed' | 'per_kg' | 'per_km' | 'zone'>(
    (product.shippingRateMode as 'fixed' | 'per_kg' | 'per_km' | 'zone') || 'fixed',
  );
  const [shippingPerKgRate, setShippingPerKgRate] = useState<number>(
    Number(product.shippingPerKgRate ?? 0) || 0,
  );
  const [shippingPerKmRate, setShippingPerKmRate] = useState<number>(
    Number(product.shippingPerKmRate ?? 0) || 0,
  );
  const [shippingPaymentOptions, setShippingPaymentOptions] = useState<
    Array<'cod' | 'online' | 'bank_transfer'>
  >(
    Array.isArray(product.shippingPaymentOptions) && product.shippingPaymentOptions.length
      ? product.shippingPaymentOptions
      : ['cod', 'online'],
  );

  // Dimensions (L, W, H)
  const initialDims = useMemo(() => {
    if (product.dimensions && typeof product.dimensions === 'object') {
      return {
        length: product.dimensions.length ?? 30,
        width: product.dimensions.width ?? 20,
        height: product.dimensions.height ?? 12,
      };
    }
    return { length: 30, width: 20, height: 12 };
  }, [product.dimensions]);

  const [dimensions, setDimensions] = useState(initialDims);

  // ── Images State ──
  const [gallery, setGallery] = useState<string[]>(() => {
    const list: string[] = [];
    if (product.image) list.push(product.image);
    if (product.galleryUrls && Array.isArray(product.galleryUrls)) {
      product.galleryUrls.forEach((u) => {
        if (u && !list.includes(u)) list.push(u);
      });
    }
    if (product.additionalImages && Array.isArray(product.additionalImages)) {
      product.additionalImages.forEach((u) => {
        if (u && !list.includes(u)) list.push(u);
      });
    }
    return list.length > 0 ? list : [product.image || ''];
  });

  const { updateProduct } = useTenant();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'main' | 'gallery' | 'variant' | 'thumbnail' | 'optionValue'>('gallery');
  const [optionValueMediaId, setOptionValueMediaId] = useState<string | null>(null);
  const [targetThumbIndex, setTargetThumbIndex] = useState<number | null>(null);
  const [variantMediaTargetIndex, setVariantMediaTargetIndex] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Hidden File Inputs for Instant Device Selection (Ultra Fast)
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const thumbFileInputRef = useRef<HTMLInputElement>(null);
  const addFilesInputRef = useRef<HTMLInputElement>(null);
  const variantImageInputRef = useRef<HTMLInputElement>(null);
  const optionValueImageInputRef = useRef<HTMLInputElement>(null);
  const [pendingVariantImageId, setPendingVariantImageId] = useState<string | null>(null);
  const [pendingOptionImage, setPendingOptionImage] = useState<{ optionId: string; valueId: string } | null>(null);

  // ── Product Options State ──
  const [options, setOptions] = useState<ProductOptionItem[]>(() => {
    const seeded = seedExistingCommerce(product, storeId).options;
    if (seeded.length > 0) {
      return seeded.map((opt) => ({
        id: opt.id,
        name: opt.name,
        nameAr: opt.nameAr,
        type: normalizeOptionType(opt.type, opt.name),
        visible: opt.visible !== false,
        values: optionValuesList(opt.values).map((v) => ({
          id: v.id,
          label: v.label,
          labelAr: v.labelAr,
          colorHex: v.colorHex,
          imageUrl: v.imageUrl,
          videoUrl: v.videoUrl,
          selected: v.selected !== false,
          price: v.price ?? null,
          salePrice: v.salePrice ?? null,
          stock: v.stock ?? null,
          sku: v.sku,
          weight: v.weight ?? null,
          weightUnit: v.weightUnit === 'g' ? 'g' : 'kg',
        })),
      }));
    }

    const initialOpts: ProductOptionItem[] = [];
    if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
      initialOpts.push({
        id: 'color',
        name: 'Color',
        nameAr: 'اللون',
        type: 'color',
        values: product.colors.map((c) => ({
          id: c.id || c.nameEn.toLowerCase().replace(/\s+/g, '_'),
          label: c.nameEn || c.nameAr,
          labelAr: c.nameAr,
          colorHex: c.hex,
          imageUrl: c.image,
          selected: true,
        })),
      });
    }
    if (product.storageOptions && Array.isArray(product.storageOptions) && product.storageOptions.length > 0) {
      initialOpts.push({
        id: 'edition',
        name: 'Edition',
        nameAr: 'الإصدار',
        type: 'select',
        values: product.storageOptions.map((s, idx) => ({
          id: s.capacity ? s.capacity.toLowerCase().replace(/\s+/g, '_') : `kit_${idx}`,
          label: s.capacity,
          labelAr: s.capacityAr,
          selected: true,
          price: s.priceDelta ? Number(s.priceDelta) : null,
          salePrice: s.priceDelta ? Number(s.priceDelta) : null,
        })),
      });
    }
    return initialOpts;
  });

  // Helper function for color hexes
  function getColorHex(label: string): string {
    const l = (label || '').toLowerCase();
    if (l.includes('red') || l.includes('احمر') || l.includes('أحمر')) return '#ef4444';
    if (l.includes('white') || l.includes('ابيض') || l.includes('أبيض')) return '#ffffff';
    if (l.includes('pink') || l.includes('وردي') || l.includes('زهري')) return '#f472b6';
    if (l.includes('black') || l.includes('اسود') || l.includes('أسود')) return '#18181b';
    if (l.includes('blue') || l.includes('ازرق') || l.includes('أزرق')) return '#3b82f6';
    if (l.includes('green') || l.includes('اخضر') || l.includes('أخضر')) return '#22c55e';
    if (l.includes('yellow') || l.includes('اصفر') || l.includes('أصفر')) return '#eab308';
    if (l.includes('orange') || l.includes('برتقالي')) return '#f97316';
    if (l.includes('silver') || l.includes('فضي')) return '#94a3b8';
    return '#64748b';
  }

  // ── Variations State (Loaded from API or Product - ZERO DUMMY DATA) ──
  const [variations, setVariations] = useState<ProductVariation[]>(() => {
    if (product.variations && Array.isArray(product.variations) && product.variations.length > 0) {
      return product.variations;
    }
    const seeded = seedExistingCommerce(product, storeId).options;
    if (seeded.length === 0) return [];
    const regular = Number(product.price) || 0;
    const sale = Number(product.discountedPrice) || 0;
    const selling = sale > 0 && sale < regular ? sale : regular;
    return buildGeneratedVariants({
      options: seeded,
      previous: [],
      storeId,
      productId: product.id,
      baseSku: product.sku || 'SKU',
      basePrice: selling,
      baseCompareAt: regular > selling ? regular : null,
      baseWeight: product.weightKg ?? null,
      sharedStock: Number(product.stock) || 0,
    });
  });
  const variantQuantityTotal = useMemo(() => {
    if (!variations.length) return 0;
    const shared =
      variations.every(
        (row) => row.isActive === false || row.unlimitedStock || Number(row.stock) === Number(stock),
      );
    return shared ? Number(stock) || 0 : sumVariantStock(variations);
  }, [variations, stock]);
  const [loadingVariations, setLoadingVariations] = useState(false);
  const [selectedVariationIds, setSelectedVariationIds] = useState<string[]>([]);
  const [editingVariant, setEditingVariant] = useState<ProductVariation | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [newOptionValueInput, setNewOptionValueInput] = useState('');

  const loadVariations = useCallback(async () => {
    if (!storeId || !product.id) return;
    setLoadingVariations(true);
    try {
      if (isApiEnabled()) {
        const list = await tenantApi.fetchVariations(storeId, product.id);
        if (list && list.length > 0) {
          setVariations(list);
        } else if (product.variations && product.variations.length > 0) {
          setVariations(product.variations);
        }
      } else if (product.variations && product.variations.length > 0) {
        setVariations(product.variations);
      }
    } catch {
      if (product.variations && product.variations.length > 0) {
        setVariations(product.variations);
      }
    } finally {
      setLoadingVariations(false);
    }
  }, [storeId, product.id, product.variations]);

  useEffect(() => {
    loadVariations();
  }, [loadVariations]);

  // ── Categories & Tags State ──
  const [productCategories, setProductCategories] = useState<string[]>(() => {
    if (Array.isArray(product.categories) && product.categories.length > 0) {
      return product.categories;
    }
    return product.category ? [product.category] : categories.slice(0, 1);
  });
  const [tags, setTags] = useState<string[]>(() => {
    if (product.tags && Array.isArray(product.tags) && product.tags.length > 0) {
      return product.tags;
    }
    return [];
  });
  const [newTagInput, setNewTagInput] = useState('');

  // ── Custom Fields State (Strictly Real Product Specs / Fields - ZERO DUMMY FIELDS) ──
  const [customFields, setCustomFields] = useState<CustomFieldItem[]>(() => {
    const mapField = (f: any, i: number): CustomFieldItem => ({
      id: f.id || `field_${i}`,
      name: f.name || '',
      nameAr: f.nameAr || '',
      description: f.description || '',
      type: normalizeCustomFieldType(f.type),
      required: f.required ?? false,
      conditionalRule: f.conditionalRule || '—',
      conditions: Array.isArray(f.conditions) ? f.conditions : [],
      conditionJoin: f.conditionJoin === 'OR' ? 'OR' : 'AND',
      extraPrice: f.extraPrice ?? 0,
      options: Array.isArray(f.options) ? f.options : [],
      imageUrl: f.imageUrl || '',
      videoUrl: f.videoUrl || '',
      contentEn: f.contentEn || '',
      contentAr: f.contentAr || '',
      hidden: !!f.hidden,
      value: f.value || '',
    });
    if (product.customFields && Array.isArray(product.customFields) && product.customFields.length > 0) {
      return product.customFields.map(mapField);
    }
    const seeded = seedExistingCommerce(product, storeId).fields;
    if (seeded.length > 0) return seeded.map(mapField);
    if (product.specs && Array.isArray(product.specs) && product.specs.length > 0) {
      return product.specs.map((s, i) => ({
        id: `catalog-spec-${i}`,
        name: s.label || s.labelAr || '',
        nameAr: s.labelAr || '',
        type: 'Content',
        required: false,
        conditionalRule: '—',
        extraPrice: 0,
        options: [],
        contentEn: s.value || '',
        contentAr: s.valueAr || s.value || '',
      }));
    }
    return [];
  });

  // ── Conditional Rules State ──
  const [conditionalRule, setConditionalRule] = useState<ConditionalRuleItem | null>(() => {
    if (product.conditionalRules && Array.isArray(product.conditionalRules) && product.conditionalRules.length > 0) {
      const r = product.conditionalRules[0];
      return {
        id: r.id || 'rule_1',
        optionName: r.optionName || '',
        operator: r.operator || '=',
        value: r.value || '',
        action: (r.action as 'show' | 'hide') || 'show',
        targetFieldNames: r.targetFieldNames || [],
      };
    }
    return null;
  });

  // Modal and expand states
  const [expandedOptionIds, setExpandedOptionIds] = useState<string[]>([]);
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [optionModalMode, setOptionModalMode] = useState<'add' | 'edit'>('add');
  const [editingOption, setEditingOption] = useState<ProductOptionItem | null>(null);
  const [optNameInput, setOptNameInput] = useState('');
  const [optTypeInput, setOptTypeInput] = useState<OptionKind>('text');
  const [optValuesDraft, setOptValuesDraft] = useState<OptionValueDraft[]>([]);

  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [fieldModalMode, setFieldModalMode] = useState<'add' | 'edit'>('add');
  const [editingField, setEditingField] = useState<CustomFieldItem | null>(null);
  const [fldNameInput, setFldNameInput] = useState('');
  const [fldDescriptionInput, setFldDescriptionInput] = useState('');
  const [fldTypeInput, setFldTypeInput] = useState<string>('Short Text');
  const [fldRequiredInput, setFldRequiredInput] = useState(false);
  const [fldExtraPriceInput, setFldExtraPriceInput] = useState<number>(0);
  const [fldConditionalRuleInput, setFldConditionalRuleInput] = useState('');
  const [fldConditionJoin, setFldConditionJoin] = useState<'AND' | 'OR'>('AND');
  const [fldConditions, setFldConditions] = useState<
    Array<{ fieldId: string; operator: string; value?: string }>
  >([]);
  const [fldOptionsInput, setFldOptionsInput] = useState<string[]>([]);
  const [fldOptionDraft, setFldOptionDraft] = useState('');
  const [fldImageUrl, setFldImageUrl] = useState('');
  const [fldVideoUrl, setFldVideoUrl] = useState('');
  const [fldContentEn, setFldContentEn] = useState('');
  const [fldContentAr, setFldContentAr] = useState('');

  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleOptionName, setRuleOptionName] = useState(conditionalRule?.optionName || (options[0]?.name ?? ''));
  const [ruleOptionVal, setRuleOptionVal] = useState(conditionalRule?.value || (options[0]?.values[0]?.label ?? ''));
  const [ruleTargetFields, setRuleTargetFields] = useState<string[]>(conditionalRule?.targetFieldNames || []);

  // ── SEO Settings State ──
  const [seoTitle, setSeoTitle] = useState(
    product.seoTitle || `${product.name || 'Product'} | ${storeName}`
  );
  const [seoDescription, setSeoDescription] = useState(
    product.seoDescription ||
      product.description ||
      (isAr ? `تسوق${product.name || 'المنتج'}بجودة عالية وسرعة توصيل بالمملكة العربية السعودية.` : `Buy ${product.name || 'this product'} with top quality and fast shipping in Saudi Arabia.`)
  );
  const [urlSlug, setUrlSlug] = useState(
    product.customUrl || (product.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  );

  // ── Section Visibility (card header toggles + list Filter popover) ──
  const [localSectionVisibility, setLocalSectionVisibility] = useState<Record<EditorSectionKey, boolean>>({
    images: true,
    basic: true,
    pricing: true,
    inventory: true,
    variations: true,
    options: true,
    category_tags: true,
    custom_fields: true,
    seo: true,
  });

  useEffect(() => {
    if (!visibleSections) return;
    setLocalSectionVisibility((prev) => ({
      ...prev,
      images: visibleSections.images !== false,
      basic: visibleSections.basic !== false,
      pricing: visibleSections.pricing !== false,
      inventory: visibleSections.inventory !== false,
      variations: visibleSections.variations !== false,
      options: visibleSections.variations !== false,
      category_tags: visibleSections.categoryTags !== false,
      custom_fields: visibleSections.customFields !== false,
      seo: visibleSections.seo !== false,
    }));
  }, [visibleSections]);

  const sectionVisibility = localSectionVisibility;

  const toggleEditorSection = (key: EditorSectionKey) => {
    const nextOn = !sectionVisibility[key];
    setLocalSectionVisibility((prev) => {
      const next = { ...prev, [key]: nextOn };
      if (key === 'variations' || key === 'options') {
        next.variations = nextOn;
        next.options = nextOn;
      }
      return next;
    });
    if (onVisibleSectionsChange) {
      const filterKey = EDITOR_TO_FILTER_KEY[key];
      const base: Record<ProductEditSectionKey, boolean> = {
        images: sectionVisibility.images,
        basic: sectionVisibility.basic,
        pricing: sectionVisibility.pricing,
        inventory: sectionVisibility.inventory,
        variations: sectionVisibility.variations,
        variationInventory: visibleSections?.variationInventory !== false,
        customFields: sectionVisibility.custom_fields,
        seo: sectionVisibility.seo,
        categoryTags: sectionVisibility.category_tags,
        ...(visibleSections || {}),
      };
      if (filterKey) base[filterKey] = nextOn;
      onVisibleSectionsChange(base);
    }
  };

  const showAllEditorSections = () => {
    const allOn: Record<EditorSectionKey, boolean> = {
      images: true,
      basic: true,
      pricing: true,
      inventory: true,
      variations: true,
      options: true,
      category_tags: true,
      custom_fields: true,
      seo: true,
    };
    setLocalSectionVisibility(allOn);
    onVisibleSectionsChange?.({
      images: true,
      basic: true,
      pricing: true,
      inventory: true,
      variations: true,
      variationInventory: true,
      customFields: true,
      seo: true,
      categoryTags: true,
    });
  };

  const hiddenSectionKeys = (
    [
      ['images', isAr ? 'صور المنتج' : 'Product Images'],
      ['basic', isAr ? 'المعلومات الأساسية' : 'Basic Information'],
      ['pricing', isAr ? 'التسعير' : 'Pricing'],
      ['inventory', isAr ? 'المخزون والشحن' : 'Inventory & Shipping'],
      ['variations', isAr ? 'الخيارات والتنوعات' : 'Options & Variations'],
      ['category_tags', isAr ? 'التصنيف والوسوم' : 'Category & Tags'],
      ['custom_fields', isAr ? 'الحقول المخصصة' : 'Custom Fields'],
      ['seo', isAr ? 'إعدادات تحسين محركات البحث' : 'SEO Settings'],
    ] as Array<[EditorSectionKey, string]>
  ).filter(([key]) => !sectionVisibility[key]);

  // ── Handlers ──
  const handleMainFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const opt = await optimizeImageFile(file, 1200, 200 * 1024);
      const url = opt.webpUrl || URL.createObjectURL(opt.file);
      const copy = [...gallery];
      copy[selectedImageIndex] = url;
      setGallery(copy);
      if (updateProduct && product?.id && storeId) {
        updateProduct(product.id, { image: copy[0] || url, galleryUrls: copy }, storeId);
      }
      toast(isAr ? `تم ضغط الصورة وتحسينها بنجاح (${opt.savingsPct}% وفر)` : `Optimized & saved (${opt.savingsPct}% smaller)`, 'success');
    } catch {
      const url = URL.createObjectURL(file);
      const copy = [...gallery];
      copy[selectedImageIndex] = url;
      setGallery(copy);
      if (updateProduct && product?.id && storeId) {
        updateProduct(product.id, { image: copy[0] || url, galleryUrls: copy }, storeId);
      }
      toast(isAr ? 'تم استبدال الصورة الرئيسية' : 'Main image updated', 'success');
    }
    e.target.value = '';
  };

  const handleThumbFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || targetThumbIndex === null) return;
    try {
      const opt = await optimizeImageFile(file, 1200, 200 * 1024);
      const url = opt.webpUrl || URL.createObjectURL(opt.file);
      const copy = [...gallery];
      copy[targetThumbIndex] = url;
      setGallery(copy);
      if (updateProduct && product?.id && storeId) {
        updateProduct(product.id, { image: copy[0] || url, galleryUrls: copy }, storeId);
      }
      toast(isAr ? `تم تحسين الصورة بنجاح (${opt.savingsPct}% وفر)` : `Image optimized (${opt.savingsPct}% smaller)`, 'success');
    } catch {
      const url = URL.createObjectURL(file);
      const copy = [...gallery];
      copy[targetThumbIndex] = url;
      setGallery(copy);
      if (updateProduct && product?.id && storeId) {
        updateProduct(product.id, { image: copy[0] || url, galleryUrls: copy }, storeId);
      }
    }
    setTargetThumbIndex(null);
    e.target.value = '';
  };

  const handleAddMultipleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const optimizedUrls = await Promise.all(
        files.map(async (f) => {
          try {
            const opt = await optimizeImageFile(f, 1200, 200 * 1024);
            return opt.webpUrl || URL.createObjectURL(opt.file);
          } catch {
            return URL.createObjectURL(f);
          }
        })
      );
      const updated = [...gallery, ...optimizedUrls];
      setGallery(updated);
      if (updateProduct && product?.id && storeId) {
        updateProduct(product.id, { galleryUrls: updated }, storeId);
      }
      toast(isAr ? `تم ضغط وإضافة${optimizedUrls.length}صور في أجزاء من الثانية` : `Added & optimized ${optimizedUrls.length} images instantly`, 'success');
    } catch {
      const newUrls = files.map((f) => URL.createObjectURL(f));
      const updated = [...gallery, ...newUrls];
      setGallery(updated);
      if (updateProduct && product?.id && storeId) {
        updateProduct(product.id, { galleryUrls: updated }, storeId);
      }
    }
    e.target.value = '';
  };

  const handleSelectMedia = (selected: any) => {
    const assets = Array.isArray(selected) ? selected : [selected];
    const newUrls = assets
      .map((a: any) => (typeof a === 'string' ? a : a.optimizedUrl || a.webpUrl || a.originalUrl || a.thumbnailUrl || a.url))
      .filter(Boolean);
    if (newUrls.length === 0) return;

    if (mediaPickerTarget === 'main') {
      const copy = [...gallery];
      copy[selectedImageIndex] = newUrls[0];
      setGallery(copy);
      if (updateProduct && product?.id && storeId) {
        updateProduct(product.id, { image: copy[0] || newUrls[0], galleryUrls: copy }, storeId);
      }
      toast(isAr ? 'تم استبدال الصورة الرئيسية' : 'Main image replaced', 'success');
    } else if (mediaPickerTarget === 'thumbnail' && targetThumbIndex !== null) {
      const copy = [...gallery];
      copy[targetThumbIndex] = newUrls[0];
      setGallery(copy);
      if (updateProduct && product?.id && storeId) {
        updateProduct(product.id, { image: copy[0] || newUrls[0], galleryUrls: copy }, storeId);
      }
      toast(isAr ? 'تم استبدال الصورة بنجاح' : 'Image replaced successfully', 'success');
      setTargetThumbIndex(null);
    } else if (mediaPickerTarget === 'gallery') {
      const updated = [...gallery, ...newUrls];
      setGallery(updated);
      setSelectedImageIndex(gallery.length);
      if (updateProduct && product?.id && storeId) {
        updateProduct(product.id, { galleryUrls: updated }, storeId);
      }
      toast(isAr ? `تمت إضافة${newUrls.length}صور للمعرض` : `Added ${newUrls.length} images to gallery`, 'success');
    } else if (mediaPickerTarget === 'variant' && variantMediaTargetIndex !== null) {
      const copy = [...variations];
      if (copy[variantMediaTargetIndex]) {
        copy[variantMediaTargetIndex] = {
          ...copy[variantMediaTargetIndex],
          imageUrl: newUrls[0],
        };
        setVariations(copy);
      }
      setVariantMediaTargetIndex(null);
    } else if (mediaPickerTarget === 'optionValue' && optionValueMediaId) {
      const url = newUrls[0];
      setOptValuesDraft((prev) =>
        prev.map((row) => (row.id === optionValueMediaId ? { ...row, imageUrl: url } : row)),
      );
      setOptionValueMediaId(null);
    }
    setIsMediaPickerOpen(false);
  };

  const handleRemoveMainImage = () => {
    if (gallery.length <= 1) {
      toast(isAr ? 'يجب أن يحتوي المنتج على صورة واحدة على الأقل' : 'Product must have at least one image', 'error');
      return;
    }
    const next = gallery.filter((_, idx) => idx !== selectedImageIndex);
    setGallery(next);
    setSelectedImageIndex(Math.max(0, selectedImageIndex - 1));
    if (updateProduct && product?.id && storeId) {
      updateProduct(product.id, { image: next[0] || '', galleryUrls: next }, storeId);
    }
    toast(isAr ? 'تم حذف الصورة' : 'Image removed', 'info');
  };

  const handleRemoveThumbnail = (idxToRemove: number) => {
    if (gallery.length <= 1) {
      toast(isAr ? 'يجب أن يحتوي المنتج على صورة واحدة على الأقل' : 'Product must have at least one image', 'error');
      return;
    }
    const next = gallery.filter((_, idx) => idx !== idxToRemove);
    setGallery(next);
    if (selectedImageIndex >= next.length) {
      setSelectedImageIndex(Math.max(0, next.length - 1));
    }
    if (updateProduct && product?.id && storeId) {
      updateProduct(product.id, { image: next[0] || '', galleryUrls: next }, storeId);
    }
    toast(isAr ? 'تم حذف الصورة' : 'Image removed', 'info');
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(newTagInput.trim())) {
        setTags([...tags, newTagInput.trim()]);
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Custom Fields handlers
  const handleToggleFieldRequired = (id: string) => {
    setCustomFields(
      customFields.map((f) => (f.id === id ? { ...f, required: !f.required } : f))
    );
  };

  const handleUpdateFieldType = (id: string, newType: string) => {
    setCustomFields(
      customFields.map((f) => (f.id === id ? { ...f, type: newType } : f))
    );
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
    toast(isAr ? 'تم حذف الحقل المخصص' : 'Custom field removed', 'info');
  };

  const handleAddCustomField = () => {
    setCustomFields([
      ...customFields,
      {
        id: `field_${Date.now()}`,
        name: isAr ? 'خاصية جديدة' : 'New Feature',
        value: '',
      },
    ]);
  };

  const handleUpdateCustomField = (id: string, key: 'name' | 'value', val: string) => {
    setCustomFields(customFields.map((f) => (f.id === id ? { ...f, [key]: val } : f)));
  };

  const handleOpenAddField = () => {
    setFieldModalMode('add');
    setEditingField(null);
    setFldNameInput('');
    setFldDescriptionInput('');
    setFldTypeInput('Short Text');
    setFldRequiredInput(false);
    setFldExtraPriceInput(0);
    setFldConditionalRuleInput('');
    setFldConditionJoin('AND');
    setFldConditions([]);
    setFldOptionsInput([]);
    setFldOptionDraft('');
    setFldImageUrl('');
    setFldVideoUrl('');
    setFldContentEn('');
    setFldContentAr('');
    setIsFieldModalOpen(true);
  };

  const handleOpenEditField = (field: CustomFieldItem) => {
    setFieldModalMode('edit');
    setEditingField(field);
    setFldNameInput(field.name);
    setFldDescriptionInput(field.description || '');
    setFldTypeInput(normalizeCustomFieldType(field.type));
    setFldRequiredInput(field.required ?? false);
    setFldExtraPriceInput(field.extraPrice || 0);
    setFldConditionalRuleInput(field.conditionalRule && field.conditionalRule !== '—' ? field.conditionalRule : '');
    setFldConditionJoin(field.conditionJoin || 'AND');
    setFldConditions(Array.isArray(field.conditions) ? [...field.conditions] : []);
    setFldOptionsInput(Array.isArray(field.options) ? [...field.options] : []);
    setFldOptionDraft('');
    setFldImageUrl(field.imageUrl || '');
    setFldVideoUrl(field.videoUrl || '');
    setFldContentEn(field.contentEn || '');
    setFldContentAr(field.contentAr || '');
    setIsFieldModalOpen(true);
  };

  const handleAddFldOption = () => {
    const val = fldOptionDraft.trim();
    if (!val) return;
    if (fldOptionsInput.includes(val)) {
      toast(isAr ? 'هذه القيمة موجودة مسبقاً' : 'This option already exists', 'error');
      return;
    }
    setFldOptionsInput([...fldOptionsInput, val]);
    setFldOptionDraft('');
  };

  const handleSaveField = () => {
    if (!fldNameInput.trim()) {
      toast(isAr ? 'يرجى إدخال اسم الحقل' : 'Please enter field name', 'error');
      return;
    }
    const normalizedType = normalizeCustomFieldType(fldTypeInput);
    if (customFieldNeedsOptions(normalizedType) && fldOptionsInput.length === 0) {
      toast(
        isAr ? 'أضف خياراً واحداً على الأقل لهذا النوع من الحقول' : 'Add at least one option for this field type',
        'error'
      );
      return;
    }
    const fillable = customFieldIsFillable(normalizedType);
    const cleanRule = fldConditionalRuleInput.trim() || '—';
    const options = customFieldNeedsOptions(normalizedType) ? fldOptionsInput : [];
    const payload = {
      name: fldNameInput.trim(),
      description: fldDescriptionInput.trim(),
      type: normalizedType,
      required: fillable ? fldRequiredInput : false,
      conditionalRule: cleanRule,
      conditions: fldConditions.filter((c) => c.fieldId && c.operator),
      conditionJoin: fldConditionJoin,
      extraPrice: fillable ? Number(fldExtraPriceInput) || 0 : 0,
      options,
      imageUrl: fldImageUrl.trim(),
      videoUrl: fldVideoUrl.trim(),
      contentEn: fldContentEn.trim(),
      contentAr: fldContentAr.trim(),
    };
    if (fieldModalMode === 'add') {
      const newFld: CustomFieldItem = {
        id: `field_${Date.now()}`,
        ...payload,
      };
      setCustomFields([...customFields, newFld]);
      toast(isAr ? 'تمت إضافة الحقل بنجاح' : 'Custom field added', 'success');
    } else if (editingField) {
      setCustomFields(
        customFields.map((f) =>
          f.id === editingField.id
            ? {
                ...f,
                ...payload,
              }
            : f
        )
      );
      toast(isAr ? 'تم تحديث الحقل بنجاح' : 'Custom field updated', 'success');
    }
    setIsFieldModalOpen(false);
  };

  const applyVariantMatrix = (
    nextOptions: ProductOptionItem[],
    prevRows: ProductVariation[] = variations,
    enabled = optionsEnabled,
  ) => {
    setOptions(nextOptions);
    if (!enabled) return;
    const selectedValues = nextOptions.reduce(
      (n, opt) => n + opt.values.filter((v) => v.selected && v.label.trim()).length,
      0,
    );
    if (selectedValues === 0) {
      setVariations([]);
      return;
    }
    const next = buildGeneratedVariants({
      options: nextOptions,
      previous: prevRows,
      storeId,
      productId: product.id,
      baseSku: sku.trim() || 'SKU',
      basePrice: Number(discountedPrice > 0 ? discountedPrice : price) || 0,
      baseCompareAt: Number(price) > Number(discountedPrice > 0 ? discountedPrice : price) ? Number(price) : null,
      baseWeight: Number(weightKg) || null,
      lowStockAlert: Number(lowStockAlert) || null,
      sharedStock: Number(stock) || 0,
    });
    if (next.length > 100) {
      toast(
        isAr
          ? 'الحد ١٠٠ تنويع. قلّل القيم ثم أعد المحاولة.'
          : 'Limit is 100 variants. Reduce values, then try again.',
        'error',
      );
      return;
    }
    setVariations(next);
    setStock(sumVariantStock(next));
  };

  // Option handlers
  const toggleOptionExpand = (optId: string) => {
    setExpandedOptionIds((prev) =>
      prev.includes(optId) ? prev.filter((id) => id !== optId) : [...prev, optId]
    );
  };

  const handleRemoveOption = (optId: string) => {
    applyVariantMatrix(options.filter((o) => o.id !== optId));
    toast(isAr ? 'تم حذف الخيار' : 'Option removed', 'info');
  };

  const handleCopyOption = (opt: ProductOptionItem) => {
    const stamp = Date.now().toString().slice(-4);
    const copy: ProductOptionItem = {
      ...opt,
      id: `opt_${Date.now()}`,
      name: isAr ? `${opt.name}نسخة` : `${opt.name} copy`,
      values: opt.values.map((v) => ({ ...v, id: `${v.id}_${stamp}` })),
    };
    applyVariantMatrix([...options, copy]);
    toast(isAr ? 'تم نسخ الخيار' : 'Option copied', 'success');
  };

  const handleToggleOptionVisible = (optId: string) => {
    setOptions(
      options.map((opt) =>
        opt.id === optId ? { ...opt, visible: opt.visible === false } : opt,
      ),
    );
  };

  const handleRemoveOptionValue = (optId: string, valId: string) => {
    applyVariantMatrix(
      options.map((opt) =>
        opt.id === optId
          ? { ...opt, values: opt.values.filter((v) => v.id !== valId) }
          : opt,
      ),
    );
  };

  const handleOpenAddOption = () => {
    setOptionModalMode('add');
    setEditingOption(null);
    setOptNameInput('');
    setOptTypeInput('select');
    setOptValuesDraft([]);
    setIsOptionModalOpen(true);
  };

  const handleOpenEditOption = (opt: ProductOptionItem) => {
    setOptionModalMode('edit');
    setEditingOption(opt);
    setOptNameInput(opt.name);
    setOptTypeInput(normalizeOptionType(opt.type, opt.name));
    setOptValuesDraft(opt.values.map(toDraftValue));
    setIsOptionModalOpen(true);
  };

  const handleSaveOptionModal = (result: { name: string; nameAr?: string; type: OptionKind; values: OptionValueDraft[] }) => {
    if (!result.name) {
      toast(isAr ? 'يرجى إدخال اسم الخيار' : 'Please enter option name', 'error');
      return;
    }
    if (result.values.length === 0) {
      toast(isAr ? 'أضف قيمة واحدة على الأقل' : 'Add at least one value', 'error');
      return;
    }
    const finalValues = result.values.map(fromDraftValue);

    if (optionModalMode === 'add') {
      const newOpt: ProductOptionItem = {
        id: `opt_${Date.now()}`,
        name: result.name,
        nameAr: result.nameAr,
        type: result.type,
        visible: true,
        values: finalValues,
      };
      applyVariantMatrix([...options, newOpt]);
      toast(isAr ? 'تمت إضافة الخيار بنجاح' : 'Option added successfully', 'success');
    } else if (editingOption) {
      applyVariantMatrix(
        options.map((o) =>
          o.id === editingOption.id
            ? { ...o, name: result.name, nameAr: result.nameAr, type: result.type, values: finalValues }
            : o,
        ),
      );
      toast(isAr ? 'تم تحديث الخيار بنجاح' : 'Option updated successfully', 'success');
    }
    setIsOptionModalOpen(false);
  };

  // Rule Modal Handlers
  const handleOpenRuleModal = () => {
    setRuleOptionName(conditionalRule?.optionName || (options[0]?.name ?? ''));
    setRuleOptionVal(conditionalRule?.value || (options[0]?.values[0]?.label ?? ''));
    setRuleTargetFields(conditionalRule?.targetFieldNames ? [...conditionalRule.targetFieldNames] : []);
    setIsRuleModalOpen(true);
  };

  const handleSaveRuleModal = () => {
    const updatedRule: ConditionalRuleItem = {
      id: conditionalRule?.id || `rule_${Date.now()}`,
      optionName: ruleOptionName,
      operator: '=',
      value: ruleOptionVal,
      action: 'show',
      targetFieldNames: ruleTargetFields,
    };
    setConditionalRule(updatedRule);

    // Sync conditionalRule text to target fields
    const ruleText = isAr
      ? `إذا كان${ruleOptionName}=${ruleOptionVal}`
      : `If ${ruleOptionName} = ${ruleOptionVal}`;

    setCustomFields(
      customFields.map((f) => {
        if (ruleTargetFields.includes(f.name)) {
          return { ...f, conditionalRule: ruleText };
        }
        return f;
      })
    );
    setIsRuleModalOpen(false);
    toast(isAr ? 'تم تحديث قاعدة الاشتراط' : 'Conditional rule updated', 'success');
  };

  // Toggle option value selection
  const handleToggleOptionValue = (optionId: string, valueId: string) => {
    applyVariantMatrix(
      options.map((opt) => {
        if (opt.id !== optionId) return opt;
        return {
          ...opt,
          values: opt.values.map((v) => (v.id === valueId ? { ...v, selected: !v.selected } : v)),
        };
      }),
    );
  };

  // ── Dynamic Option Columns for Variant Table ──
  const variantOptionKeys = useMemo(() => {
    const keysMap = new Map<string, string>(); // normalizedKey -> Display Label
    // Add active options
    options.forEach((opt) => {
      if (opt.values.some((v) => v.selected)) {
        keysMap.set(opt.name, pickLocaleText(isAr, opt.name, opt.nameAr));
      }
    });
    // Add any options found in existing variations
    variations.forEach((v) => {
      if (v.options) {
        Object.keys(v.options).forEach((k) => {
          if (!keysMap.has(k)) {
            const foundOpt = options.find(
              (o) => o.id.toLowerCase() === k.toLowerCase() || o.name.toLowerCase() === k.toLowerCase()
            );
            keysMap.set(
              k,
              foundOpt
                ? pickLocaleText(isAr, foundOpt.name, foundOpt.nameAr)
                : k.charAt(0).toUpperCase() + k.slice(1).replace('_', ' '),
            );
          }
        });
      }
    });
    return Array.from(keysMap.entries()).map(([key, label]) => ({ key, label }));
  }, [options, variations, isAr]);

  const handleUpdateVariation = (id: string, patch: Partial<ProductVariation>) => {
    const next = variations.map((v) => (v.id === id ? { ...v, ...patch } : v));
    setVariations(next);
    if (patch.stock !== undefined || patch.unlimitedStock !== undefined) {
      setStock(sumVariantStock(next));
    }
    if (editingVariant?.id === id) setEditingVariant({ ...editingVariant, ...patch });
  };

  const handleOptionValueColor = (optionId: string, valueId: string, hex: string) => {
    setOptions((prev) =>
      prev.map((opt) =>
        opt.id === optionId
          ? { ...opt, values: opt.values.map((v) => (v.id === valueId ? { ...v, colorHex: hex } : v)) }
          : opt,
      ),
    );
  };

  const colorHexForLabel = (optionName: string, label: string): string => {
    const opt = options.find((o) => o.name === optionName || o.id === optionName);
    const val = opt?.values.find((v) => v.label === label);
    return val?.colorHex || getColorHex(label);
  };

  const optionKind = (optionName: string): string => {
    const opt = options.find((o) => o.name === optionName || o.id === optionName);
    return String(opt?.type || '');
  };

  const readImageFile = async (file: File): Promise<string> => {
    try {
      const opt = await optimizeImageFile(file, 1200, 200 * 1024);
      return opt.webpUrl || URL.createObjectURL(opt.file);
    } catch {
      return URL.createObjectURL(file);
    }
  };

  const handleVariantImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = pendingVariantImageId;
    e.target.value = '';
    if (!file || !id) return;
    const url = await readImageFile(file);
    handleUpdateVariation(id, { imageUrl: url });
    setPendingVariantImageId(null);
  };

  const handleOptionValueImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = pendingOptionImage;
    e.target.value = '';
    if (!file || !target) return;
    const url = await readImageFile(file);
    setOptions((prev) =>
      prev.map((opt) =>
        opt.id === target.optionId
          ? {
              ...opt,
              values: opt.values.map((v) => (v.id === target.valueId ? { ...v, imageUrl: url } : v)),
            }
          : opt,
      ),
    );
    setOptValuesDraft((prev) => prev.map((v) => (v.id === target.valueId ? { ...v, imageUrl: url } : v)));
    setPendingOptionImage(null);
  };

  const handleSaveEditedVariant = () => {
    if (!editingVariant) return;
    if (!editingVariant.sku.trim()) {
      toast(isAr ? 'رمز المنتج مطلوب' : 'SKU is required', 'error');
      return;
    }
    if (editingVariant.price != null && Number(editingVariant.price) < 0) {
      toast(isAr ? 'السعر غير صالح' : 'Invalid price', 'error');
      return;
    }
    if (!editingVariant.unlimitedStock && Number(editingVariant.stock) < 0) {
      toast(isAr ? 'الكمية غير صالحة' : 'Invalid quantity', 'error');
      return;
    }
    const next = variations.map((v) => (v.id === editingVariant.id ? editingVariant : v));
    const dupSku = findDuplicateSkus(next);
    const dupBar = findDuplicateBarcodes(next);
    if (dupSku.length || dupBar.length) {
      toast(
        isAr ? 'رمز منتج أو باركود مكرر داخل التنويعات' : 'Duplicate SKU or barcode among variants',
        'error',
      );
      return;
    }
    setVariations(next);
    setStock(sumVariantStock(next));
    if (isApiEnabled() && storeId && product.id) {
      void tenantApi.updateVariation(storeId, product.id, editingVariant.id, {
        sku: editingVariant.sku,
        barcode: editingVariant.barcode ?? null,
        price: editingVariant.price,
        compare_at_price: editingVariant.compareAtPrice ?? null,
        stock: editingVariant.stock,
        weight: editingVariant.weight ?? null,
        weight_unit: editingVariant.weightUnit ?? 'kg',
        low_stock_alert: editingVariant.lowStockAlert ?? null,
        unlimited_stock: !!editingVariant.unlimitedStock,
        image_url: editingVariant.imageUrl,
        options: editingVariant.options,
        is_active: editingVariant.isActive,
      }).catch(() => {});
    }
    setEditingVariant(null);
    toast(isAr ? 'تم تحديث بيانات التنويع بنجاح' : 'Variant updated successfully', 'success');
  };

  const handleDeleteVariation = async (id: string) => {
    setVariations(variations.filter((v) => v.id !== id));
    setSelectedVariationIds((prev) => prev.filter((item) => item !== id));
    if (isApiEnabled() && storeId && product.id) {
      try {
        await tenantApi.deleteVariation(storeId, product.id, id);
      } catch {
        // quiet ignore
      }
    }
    toast(isAr ? 'تم حذف التنويع' : 'Variant deleted', 'info');
  };

  // Bulk handlers
  const handleBulkSetPrice = () => {
    const val = prompt(isAr ? 'أدخل السعر الجديد للتنويعات المحددة (ر.س):' : 'Enter new price for selected variants (SAR):');
    if (val === null) return;
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) {
      toast(isAr ? 'يرجى إدخال سعر صحيح' : 'Please enter a valid price', 'error');
      return;
    }
    setVariations(
      variations.map((v) => (selectedVariationIds.includes(v.id) ? { ...v, price: num } : v))
    );
    toast(isAr ? 'تم تحديث الأسعار بنجاح' : 'Prices updated for selected variants', 'success');
  };

  const handleBulkSetStock = () => {
    const val = prompt(isAr ? 'أدخل كمية المخزون الجديدة للتنويعات المحددة:' : 'Enter new stock for selected variants:');
    if (val === null) return;
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 0) {
      toast(isAr ? 'يرجى إدخال كمية صحيحة' : 'Please enter a valid stock quantity', 'error');
      return;
    }
    setVariations(
      variations.map((v) => (selectedVariationIds.includes(v.id) ? { ...v, stock: num } : v))
    );
    toast(isAr ? 'تم تحديث المخزون بنجاح' : 'Stock updated for selected variants', 'success');
  };

  const handleBulkDelete = () => {
    if (!window.confirm(isAr ? `هل أنت متأكد من حذف${selectedVariationIds.length}تنويع؟` : `Delete ${selectedVariationIds.length} selected variants?`)) {
      return;
    }
    setVariations(variations.filter((v) => !selectedVariationIds.includes(v.id)));
    setSelectedVariationIds([]);
    toast(isAr ? 'تم حذف التنويعات المحددة' : 'Selected variants deleted', 'success');
  };

  // Save changes
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      toast(isAr ? 'يرجى إدخال اسم المنتج' : 'Please enter product name', 'error');
      return;
    }

    if (!sku.trim()) {
      toast(isAr ? 'يرجى إدخال رمز المنتج' : 'Please enter product SKU', 'error');
      return;
    }

    const regular = Number(price) || 0;
    const sale = Number(discountedPrice) || 0;
    const onSale = sale > 0 && sale < regular;

    if (optionsEnabled) {
      const dupSku = findDuplicateSkus(variations);
      const dupBar = findDuplicateBarcodes(variations);
      const dupCombo = findDuplicateOptionCombos(variations);
      if (dupSku.length || dupBar.length || dupCombo.length) {
        toast(
          isAr
            ? 'تنويعات مكررة (رمز المنتج / الرمز الشريطي / الخيارات) — أصلحها قبل الحفظ'
            : 'Duplicate variants (SKU / barcode / options) — fix before saving',
          'error',
        );
        return;
      }
    }

    const primaryCategory = productCategories[0] || category;
    const tracksVariantStock =
      optionsEnabled && variations.some((row) => row.isActive !== false && !row.unlimitedStock);
    const mirroredStock =
      variations.length > 0 &&
      variations.every((row) => row.isActive === false || row.unlimitedStock || Number(row.stock) === Number(stock));
    const computedStock = tracksVariantStock && !mirroredStock ? sumVariantStock(variations) : Number(stock);
    const payload: Partial<Product> = {
      name,
      sku,
      category: primaryCategory,
      categories: productCategories,
      brand,
      productType,
      subtitle: subtitle.trim() || null,
      googleTaxonomy: googleTaxonomy.trim() || null,
      description,
      isFeatured,
      price: regular,
      discountedPrice: onSale ? sale : 0,
      originalPrice: onSale ? regular : null,
      discountStartAt: onSale && discountStartAt ? discountStartAt : null,
      discountEndAt: onSale && discountEndAt ? discountEndAt : null,
      taxRate: Number(taxRate),
      stock: computedStock,
      lowStockAlert: Number(lowStockAlert),
      stockStatus,
      weightKg: Number(weightKg),
      shippingMode,
      deliveryFee: Number(deliveryFee) || 0,
      estimatedDeliveryText: estimatedDeliveryText.trim() || null,
      requiresOwnDriver,
      allowOwnDelivery,
      allowShippingCompany,
      shippingRateMode,
      shippingPerKgRate: Number(shippingPerKgRate) || 0,
      shippingPerKmRate: Number(shippingPerKmRate) || 0,
      shippingPaymentOptions,
      dimensions,
      image: gallery[selectedImageIndex] || gallery[0] || product.image,
      galleryUrls: gallery,
      additionalImages: gallery.slice(1),
      salesChannels: normalizeProductSalesChannels(salesChannels),
      tags,
      customFields: customFields.map((f, i) => ({
        id: f.id || `cf_${i}`,
        name: f.name,
        nameAr: f.nameAr || '',
        description: f.description || '',
        type: normalizeCustomFieldType(f.type),
        required: customFieldIsFillable(f.type) ? !!f.required : false,
        conditionalRule: f.conditionalRule,
        conditions: f.conditions || [],
        conditionJoin: f.conditionJoin || 'AND',
        extraPrice: customFieldIsFillable(f.type) ? (f.extraPrice ?? 0) : 0,
        options: customFieldNeedsOptions(f.type) ? f.options || [] : [],
        imageUrl: f.imageUrl || '',
        videoUrl: f.videoUrl || '',
        contentEn: f.contentEn || '',
        contentAr: f.contentAr || '',
        hidden: !!f.hidden,
        value: f.value ?? '',
      })),
      productOptions: optionsEnabled
        ? options.map((opt) => ({
            id: opt.id,
            name: opt.name,
            nameAr: opt.nameAr,
            type: opt.type,
            visible: opt.visible !== false,
            values: opt.values.map((v) => ({
              id: v.id,
              label: v.label,
              labelAr: v.labelAr,
              colorHex: v.colorHex,
              imageUrl: v.imageUrl,
              videoUrl: v.videoUrl,
              selected: v.selected,
              price: v.price ?? null,
              salePrice: v.salePrice ?? null,
              stock: v.stock ?? null,
              sku: v.sku || '',
              weight: v.weight ?? null,
              weightUnit: v.weightUnit || 'kg',
            })),
          }))
        : [],
      conditionalRules: conditionalRule ? [conditionalRule] : [],
      variations: optionsEnabled ? variations : [],
      seoTitle,
      seoDescription,
      customUrl: urlSlug,
    };

    onSave(payload);
  };

  return (
    <div className="u-page p-4 sm:p-6 pb-16 max-w-[1600px] mx-auto space-y-5 w-full min-w-0">
      {/* ── HEADER ROW (Pixel-Perfect Matching Mockup 07) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Green vertical indicator bar & Title */}
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-teal-600 rounded-full shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
              {isCreateMode
                ? isAr
                  ? 'إضافة منتج جديد'
                  : 'Add New Product'
                : isAr
                  ? 'تعديل المنتج'
                  : 'Edit Product'}
            </h1>
          </div>

          {/* Breadcrumbs: < Products > Add/Edit Product */}
          <div className="flex items-center gap-1.5 text-xs mt-1.5 ps-4 font-semibold" style={{ color: 'var(--muted)' }}>
            <button
              type="button"
              onClick={onBack}
              className="hover:underline flex items-center gap-1 cursor-pointer transition-colors"
              style={{ color: 'var(--muted)' }}
            >
              <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{isAr ? 'المنتجات' : 'Products'}</span>
            </button>
            <span>&gt;</span>
            <span className="font-bold" style={{ color: 'var(--text)' }}>
              {isCreateMode
                ? isAr
                  ? 'إضافة منتج'
                  : 'Add Product'
                : isAr
                  ? 'تعديل المنتج'
                  : 'Edit Product'}
            </span>
            {product.productType ? (
              <>
                <span>&gt;</span>
                <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                  {product.productType}
                </span>
              </>
            ) : null}
          </div>
        </div>

        {/* Top Right Action Buttons: Preview, Duplicate, View on Store, Save */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Preview Button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>{isAr ? 'معاينة' : 'Preview'}</span>
          </button>

          {/* Duplicate Button — edit only */}
          {!isCreateMode && (
            <button
              type="button"
              onClick={() => {
                if (onDuplicate) {
                  onDuplicate(product);
                } else {
                  toast(
                    isAr ? 'تم نسخ بيانات المنتج لتكراره' : 'Duplicated product draft created',
                    'success'
                  );
                }
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Copy className="w-4 h-4 text-slate-500" />
              <span>{isAr ? 'نسخ' : 'Duplicate'}</span>
            </button>
          )}

          {/* View on Store Button — edit only */}
          {!isCreateMode && (
            <button
              type="button"
              onClick={() => {
                window.open(
                  buildStorefrontProductUrl({ storeSlug, productId: product.id }),
                  '_blank',
                  'noopener,noreferrer',
                );
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span>{isAr ? 'عرض في المتجر' : 'View on Store'}</span>
            </button>
          )}

          {/* Save / Create Solid Teal Button */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!canMutate}
            className="px-5 py-2 text-xs font-bold text-white rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all hover:opacity-95 bg-teal-700 hover:bg-teal-800 disabled:opacity-50"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>
              {isCreateMode
                ? isAr
                  ? 'إنشاء المنتج'
                  : 'Create Product'
                : isAr
                  ? 'حفظ التغييرات'
                  : 'Save Changes'}
            </span>
          </button>
        </div>
      </div>

      {/* ── MAIN GRID (100% Mockup 07 Layout) ── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {hiddenSectionKeys.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
              {isAr ? 'أقسام مخفية:' : 'Hidden sections:'}
            </span>
            {hiddenSectionKeys.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleEditorSection(key)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-200 cursor-pointer hover:bg-amber-100/80 dark:hover:bg-amber-900/40"
              >
                {isAr ? `إظهار ·${label}` : `Show · ${label}`}
              </button>
            ))}
            <button
              type="button"
              onClick={showAllEditorSections}
              className="ms-auto text-[11px] font-bold text-amber-800 dark:text-amber-200 underline cursor-pointer"
            >
              {isAr ? 'إظهار الكل' : 'Show All'}
            </button>
          </div>
        )}

        {/* ROW 1: Product Images + Basic Information */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* CARD 1: PRODUCT IMAGES */}
          {sectionVisibility.images && (
            <div className="lg:col-span-5 h-full flex flex-col bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                      {isAr ? 'صور المنتج' : 'Product Images'}
                    </h3>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'أضف صوراً عالية الجودة لعرض منتجك.' : 'Add high-quality images to showcase your product.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hidden File Inputs for Instant Selection */}
              <input
                ref={mainFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleMainFileChange}
              />
              <input
                ref={thumbFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbFileChange}
              />
              <input
                ref={variantImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleVariantImageFile}
              />
              <input
                ref={optionValueImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleOptionValueImageFile}
              />
              <input
                ref={addFilesInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleAddMultipleFiles}
              />

              {/* Main Image & Thumbnails side-by-side or stacked */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* Large Main Preview (approx 7 cols) */}
                <div className="sm:col-span-8 relative rounded-2xl overflow-hidden bg-slate-900 aspect-square flex items-center justify-center p-4 group border border-slate-200 dark:border-slate-800">
                  {/* Action Buttons top-end */}
                  <div className="absolute top-3 end-3 flex items-center gap-1.5 z-10">
                    {/* Upload & Replace from Device */}
                    <button
                      type="button"
                      onClick={() => mainFileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-md transition-all cursor-pointer text-xs font-bold"
                      title={isAr ? 'تغيير واستبدال الصورة فوراً من جهازك' : 'Upload & replace from device'}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isAr ? 'تغيير من الجهاز' : 'Change'}</span>
                    </button>
                    {/* Choose from Media Library */}
                    <button
                      type="button"
                      onClick={() => {
                        setMediaPickerTarget('main');
                        setIsMediaPickerOpen(true);
                      }}
                      className="p-2 rounded-xl bg-white/95 hover:bg-white dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-md transition-all cursor-pointer"
                      title={isAr ? 'اختيار من مكتبة الوسائط' : 'Choose from Media Library'}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                    {/* Trash */}
                    <button
                      type="button"
                      onClick={handleRemoveMainImage}
                      className="p-2 rounded-xl bg-white/95 hover:bg-white text-rose-600 flex items-center justify-center shadow-md transition-all cursor-pointer"
                      title={isAr ? 'حذف الصورة' : 'Remove image'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Main Image Badge bottom-start */}
                  <div className="absolute bottom-3 start-3 px-3 py-1 rounded-full bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold z-10 flex items-center gap-1.5 shadow-md">
                    <Check className="w-3 h-3 text-teal-400" />
                    <span>{isAr ? 'الصورة الرئيسية' : 'Main Image'}</span>
                  </div>

                  {/* Expand Fullscreen Icon bottom-end */}
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="absolute bottom-3 end-3 w-8 h-8 rounded-xl bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-md transition-all cursor-pointer z-10"
                    title={isAr ? 'تكبير الصورة' : 'Expand full image'}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Actual Main Image Preview */}
                  <img
                    src={gallery[selectedImageIndex] || gallery[0] || FALLBACK_PRODUCT_IMAGE}
                    alt={name}
                    onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                    className="w-full h-full object-contain filter drop-shadow-xl transition-transform duration-200 group-hover:scale-102"
                  />
                </div>

                {/* Thumbnails strip & Add button (approx 4 cols) */}
                <div className="sm:col-span-4 flex flex-col gap-2.5 max-h-[460px] overflow-y-auto custom-scroll pe-1">
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between px-0.5">
                    <span>{isAr ? `الصور (${gallery.length})` : `All Images (${gallery.length})`}</span>
                    <span className="text-[10px]">{isAr ? 'تعديل أو استبدال' : 'Edit / Replace'}</span>
                  </div>

                  {gallery.map((url, idx) => (
                    <div
                      key={idx}
                      className={`group/thumb relative aspect-square rounded-xl overflow-hidden border-2 transition-all p-1 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center ${
                        selectedImageIndex === idx
                          ? 'border-teal-600 ring-2 ring-teal-500/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                      }`}
                    >
                      <img
                        src={url || FALLBACK_PRODUCT_IMAGE}
                        alt={`thumb-${idx}`}
                        onClick={() => setSelectedImageIndex(idx)}
                        onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                        className="w-full h-full object-contain cursor-pointer"
                        title={isAr ? 'اضغط للعرض كصورة رئيسية' : 'Click to preview as main image'}
                      />

                      {/* Main Image tag */}
                      {selectedImageIndex === idx && (
                        <span className="absolute bottom-1 start-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-600 text-white leading-none z-10">
                          {isAr ? 'معروضة' : 'Active'}
                        </span>
                      )}

                      {/* Hover action overlay */}
                      <div className="absolute top-1 end-1 flex items-center gap-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity bg-black/75 backdrop-blur-xs p-1 rounded-lg z-20">
                        {/* Replace from Device */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTargetThumbIndex(idx);
                            thumbFileInputRef.current?.click();
                          }}
                          className="p-1 rounded text-white hover:text-teal-300 transition-colors cursor-pointer"
                          title={isAr ? 'استبدال من جهازك فوراً' : 'Replace from Device'}
                        >
                          <UploadCloud className="w-3 h-3" />
                        </button>

                        {/* Replace from Media Library */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMediaPickerTarget('thumbnail');
                            setTargetThumbIndex(idx);
                            setIsMediaPickerOpen(true);
                          }}
                          className="p-1 rounded text-white hover:text-teal-300 transition-colors cursor-pointer"
                          title={isAr ? 'استبدال من مكتبة الوسائط' : 'Replace from Media Library'}
                        >
                          <ImageIcon className="w-3 h-3" />
                        </button>

                        {/* Delete Thumbnail */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveThumbnail(idx);
                          }}
                          className="p-1 rounded text-white hover:text-rose-400 transition-colors cursor-pointer"
                          title={isAr ? 'حذف هذه الصورة' : 'Delete image'}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Images action buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => addFilesInputRef.current?.click()}
                      className="p-2.5 rounded-xl border-2 border-dashed border-teal-500 hover:border-teal-600 hover:bg-teal-50/50 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-300 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                      title={isAr ? 'رفع صور جديدة من جهازك' : 'Upload new images from device'}
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span className="text-[10px] font-bold text-center leading-tight">
                        {isAr ? '+ رفع' : '+ Upload'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMediaPickerTarget('gallery');
                        setIsMediaPickerOpen(true);
                      }}
                      className="p-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                      title={isAr ? 'اختيار من مكتبة الوسائط' : 'Choose from Media Library'}
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-[10px] font-bold text-center leading-tight">
                        {isAr ? 'المكتبة' : 'Library'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CARD 2: BASIC INFORMATION */}
          {sectionVisibility.basic && (
            <div className="lg:col-span-7 h-full flex flex-col bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                      {isAr ? 'المعلومات الأساسية' : 'Basic Information'}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Form Row 1: Product Name * and SKU * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'اسم المنتج' : 'Product Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isAr ? 'مثال: اسم المنتج' : 'e.g. Product name'}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'رمز المنتج' : 'SKU'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder={isAr ? 'مثال: SHOE-RED-001' : 'e.g. SHOE-RED-001'}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>
              </div>

              {/* Form Row 2: Category, Brand, Product Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const next = e.target.value;
                      setCategory(next);
                      if (next && !productCategories.includes(next)) {
                        setProductCategories([next, ...productCategories.filter((c) => c !== next)]);
                      }
                    }}
                    className="w-full px-2.5 py-2 rounded-xl border text-xs font-medium cursor-pointer focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  >
                    {(categoryOptions && categoryOptions.length > 0
                      ? categoryOptions
                      : categories.map((c) => ({
                          value: c,
                          label: getProductDisplayCategory(c, locale),
                        }))
                    ).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                    {category &&
                      !(categoryOptions ?? []).some((o) => o.value === category) &&
                      !categories.includes(category) && (
                        <option value={category}>{category}</option>
                      )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'العلامة التجارية' : 'Brand'}
                  </label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border text-xs font-medium cursor-pointer focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  >
                    <option value={storeName}>{storeName}</option>
                    {availableBrands.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="Nike">Nike</option>
                    <option value="Adidas">Adidas</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'نوع المنتج' : 'Product Type'}
                  </label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border text-xs font-medium cursor-pointer focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  >
                    <option value="Physical Product">{isAr ? 'منتج ملموس' : 'Physical Product'}</option>
                    <option value="Digital Product">{isAr ? 'منتج رقمي' : 'Digital Product'}</option>
                    <option value="Service">{isAr ? 'خدمة' : 'Service'}</option>
                  </select>
                </div>
              </div>

              {/* Subtitle + Google Taxonomy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'العنوان الفرعي' : 'Subtitle'}
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    maxLength={200}
                    placeholder={
                      isAr
                        ? 'سطر قصير يظهر تحت اسم المنتج...'
                        : 'Short line under the product name...'
                    }
                    className="w-full px-2.5 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                  <p className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--muted)' }}>
                    {subtitle.length}/200
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'تصنيف جوجل' : 'Google Taxonomy'}
                  </label>
                  <select
                    value={googleTaxonomy}
                    onChange={(e) => setGoogleTaxonomy(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  >
                    <option value="">
                      {isAr ? 'اختر تصنيف جوجل' : 'Select a Google category'}
                    </option>
                    {googleTaxonomy.trim() && !isKnownGoogleTaxonomy(googleTaxonomy) && (
                      <option value={googleTaxonomy}>{googleTaxonomy}</option>
                    )}
                    {GOOGLE_PRODUCT_TAXONOMY.map((row) => (
                      <option key={row.id} value={row.path}>
                        {googleTaxonomyLabel(row, isAr)}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'قائمة التصنيف الرسمية من جوجل' : 'Official Google list'}
                  </p>
                </div>
              </div>

              {/* Sales channels — from central registry */}
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text)' }}>
                  {isAr ? 'قنوات البيع' : 'Sales Channels'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {listAvailableProductChannels().map((ch) => {
                    const on = salesChannels.includes(ch.value);
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          setSalesChannels((prev) =>
                            on ? prev.filter((v) => v !== ch.value) : [...prev, ch.value],
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-all ${
                          on
                            ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-300'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {isAr ? ch.labelAr : ch.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {sectionVisibility.basic && (
          <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <RichTextEditor
              label={isAr ? 'الوصف الكامل (عناوين، صور، فيديو)' : 'Full Description (headings, images, video)'}
              value={description}
              onChange={setDescription}
              placeholder={
                isAr
                  ? 'اكتب وصف المنتج مع عناوين وصور وفيديو...'
                  : 'Write product details with headings, images, and video...'
              }
              isAr={isAr}
              enableHeadings
              enableMedia
              minHeight={220}
            />
          </div>
        )}

        {/* ROW 2: Pricing (left) + Inventory & Shipping (center/right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CARD 4: PRICING */}
          {sectionVisibility.pricing && (
            <div className="lg:col-span-5 bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    {isAr ? 'التسعير' : 'Pricing'}
                  </h3>
                </div>
              </div>

              {/* 3-Column Inputs: Regular Price, Sale Price, Tax Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'السعر الأساسي (ر.س)' : 'Regular Price (SAR)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'سعر الخصم (ر.س)' : 'Discount Price (SAR)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountedPrice}
                    onChange={(e) => setDiscountedPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'نسبة الضريبة' : 'Tax Rate'}
                  </label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-xl border text-xs font-medium cursor-pointer focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  >
                    <option value={15}>15% (KSA VAT)</option>
                    <option value={5}>5% (Reduced Tax)</option>
                    <option value={0}>0% (Tax Exempt)</option>
                  </select>
                </div>
              </div>

              {/* Discount Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'بداية الخصم' : 'Discount Start'}
                  </label>
                  <input
                    type="date"
                    value={discountStartAt ? String(discountStartAt).slice(0, 10) : ''}
                    onChange={(e) => setDiscountStartAt(e.target.value)}
                    disabled={!discountedPrice || discountedPrice <= 0}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none disabled:opacity-50"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'نهاية الخصم' : 'Discount End'}
                  </label>
                  <input
                    type="date"
                    value={discountEndAt ? String(discountEndAt).slice(0, 10) : ''}
                    onChange={(e) => setDiscountEndAt(e.target.value)}
                    disabled={!discountedPrice || discountedPrice <= 0}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none disabled:opacity-50"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* CARD 5: INVENTORY & SHIPPING */}
          {sectionVisibility.inventory && (
            <div className="lg:col-span-7 bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <Box className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    {isAr ? 'المخزون والشحن' : 'Inventory & Shipping'}
                  </h3>
                </div>
              </div>

              {/* Row 1: Stock Quantity *, Low Stock Alert, Stock Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'كمية المخزون' : 'Stock Quantity'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'تنبيه انخفاض المخزون' : 'Low Stock Alert'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={lowStockAlert}
                    onChange={(e) => setLowStockAlert(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'حالة المخزون' : 'Stock Status'}
                  </label>
                  <div className="relative">
                    <select
                      value={stockStatus}
                      onChange={(e) => setStockStatus(e.target.value)}
                      className="w-full ps-8 pe-3 py-2 rounded-xl border text-xs font-medium cursor-pointer focus:outline-none"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                    >
                      <option value="in_stock">{isAr ? 'متوفر' : 'In Stock'}</option>
                      <option value="low_stock">{isAr ? 'منخفض' : 'Low Stock'}</option>
                      <option value="out_of_stock">{isAr ? 'نفذ المخزون' : 'Out of Stock'}</option>
                    </select>
                    <span
                      className={`absolute start-2.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${
                        stockStatus === 'in_stock'
                          ? 'bg-emerald-500'
                          : stockStatus === 'low_stock'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Weight (kg), Dimensions (cm) — Shipping Category removed per product spec */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'الوزن (كجم)' : 'Weight (kg)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>

                <div className="sm:col-span-8">
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'الأبعاد (سم)' : 'Dimensions (cm)'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      min="0"
                      value={dimensions.length}
                      onChange={(e) => setDimensions({ ...dimensions, length: Number(e.target.value) })}
                      placeholder={isAr ? 'ط' : 'L'}
                      className="w-full px-2 py-2 rounded-xl border text-xs text-center font-mono focus:outline-none"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                    />
                    <input
                      type="number"
                      min="0"
                      value={dimensions.width}
                      onChange={(e) => setDimensions({ ...dimensions, width: Number(e.target.value) })}
                      placeholder={isAr ? 'ع' : 'W'}
                      className="w-full px-2 py-2 rounded-xl border text-xs text-center font-mono focus:outline-none"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                    />
                    <input
                      type="number"
                      min="0"
                      value={dimensions.height}
                      onChange={(e) => setDimensions({ ...dimensions, height: Number(e.target.value) })}
                      placeholder={isAr ? 'ا' : 'H'}
                      className="w-full px-2 py-2 rounded-xl border text-xs text-center font-mono focus:outline-none"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Product shipping channels — rates / ETA / payments live on Shipping page */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <h4 className="font-bold text-xs" style={{ color: 'var(--text)' }}>
                    {commerceTerm('shipping', isAr)}
                  </h4>
                </div>

                <div>
                  <label className="text-xs font-bold block mb-2" style={{ color: 'var(--text)' }}>
                    {isAr ? 'خيارات التوصيل للمنتج' : 'Product delivery options'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next = !allowOwnDelivery;
                        setAllowOwnDelivery(next);
                        setRequiresOwnDriver(next);
                        if (next) setShippingMode('own_delivery');
                        else if (allowShippingCompany) setShippingMode('shipping_company');
                        else setShippingMode('store_default');
                      }}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                        allowOwnDelivery
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {commerceTerm('ownDelivery', isAr)}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !allowShippingCompany;
                        setAllowShippingCompany(next);
                        if (next && !allowOwnDelivery) setShippingMode('shipping_company');
                        else if (!next && allowOwnDelivery) setShippingMode('own_delivery');
                        else if (!next && !allowOwnDelivery) setShippingMode('store_default');
                      }}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                        allowShippingCompany
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {commerceTerm('shippingCompany', isAr)}
                    </button>
                  </div>
                </div>

                <div
                  className="rounded-xl border p-3 space-y-2"
                  style={{ borderColor: 'var(--border)', background: 'var(--hover-bg)' }}
                >
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                    {isAr
                      ? 'أسعار الشحن والوقت المتوقع وخيارات الدفع تُدار من صفحة الشحن.'
                      : 'Shipping rates, ETA, and payment options are managed on the Shipping page.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        sessionStorage.setItem('unityteck-shipping-view', 'methods');
                      } catch {
                        /* storage may be unavailable */
                      }
                      onNavigateTab?.('shipping');
                      window.setTimeout(() => {
                        window.dispatchEvent(
                          new CustomEvent('unityteck-shipping-view', { detail: 'methods' }),
                        );
                      }, 60);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-bold border cursor-pointer inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white border-teal-600"
                  >
                    <Truck className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isAr ? 'فتح صفحة الشحن' : 'Open Shipping page'}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-90" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ROW 3: Product Options & Variants (Full Width, 100% Pixel-Perfect to Reference Screenshot) */}
        {(sectionVisibility.options || sectionVisibility.variations) && (
          <div className="bg-white dark:bg-[#071E26] p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
            {/* Header matching reference screenshot */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 leading-tight">
                    {isAr ? 'خيارات المنتج' : 'Product Options'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? 'تفعيل الخيارات ثم إضافة القيم — تُنشأ التنويعات تلقائياً.'
                      : 'Enable options, add values — variants generate automatically.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (!optionsEnabled) {
                      setOptionsEnabled(true);
                      if (variations.length === 0) applyVariantMatrix(options, variations, true);
                    }
                    handleOpenAddOption();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-blue-500/50 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إضافة خيار' : '+ Add Option'}</span>
                </button>
              </div>
            </div>

            <>

            {/* Options List (Grip, Name, Value Pills with Colors, Expand, Edit, Delete) */}
            <div className="space-y-3">
              {options.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr
                    ? 'أضف خياراً: لون، مقاس، أو صورة. كل قيمة تنشئ تنويعاً بسعره وصورته ومخزونه.'
                    : 'Add an option: color, size, or image. Each value becomes a variant with its own price, image, and stock.'}
                </p>
              )}
              {options.map((opt) => {
                const isExpanded = expandedOptionIds.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs overflow-hidden"
                  >
                    {/* Main Option Row (Matches Reference Screenshot) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-4 sm:py-3.5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-slate-400 dark:text-slate-500 cursor-grab shrink-0" title={isAr ? 'إعادة الترتيب' : 'Drag to reorder'}>
                          <GripVertical className="w-4 h-4" />
                        </span>
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 min-w-[70px]">
                          {pickLocaleText(isAr, opt.name, opt.nameAr)}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {opt.type === 'color'
                            ? isAr ? 'لون' : 'Color'
                            : opt.type === 'image'
                            ? isAr ? 'صورة' : 'Image'
                            : opt.type === 'select'
                            ? isAr ? 'أزرار' : 'Buttons'
                            : isAr ? 'نص' : 'Text'}
                        </span>
                        {opt.visible === false && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                            {isAr ? 'مخفي' : 'Hidden'}
                          </span>
                        )}
                        {/* Option Value Pills with Color Circles or Text Badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {opt.values.map((val) => (
                            <span
                              key={val.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs"
                            >
                              {val.colorHex && (
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                                  style={{ backgroundColor: val.colorHex }}
                                />
                              )}
                              {val.imageUrl && (
                                <img src={val.imageUrl} alt="" className="w-4 h-4 rounded object-cover" />
                              )}
                              <span>{pickLocaleText(isAr, val.label, val.labelAr)}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions: Expand/Collapse, Edit, Delete */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleOptionExpand(opt.id)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title={isExpanded ? (isAr ? 'طي' : 'Collapse') : (isAr ? 'توسيع' : 'Expand')}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleOptionVisible(opt.id)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title={opt.visible === false ? (isAr ? 'إظهار في المتجر' : 'Show on store') : (isAr ? 'إخفاء من المتجر' : 'Hide on store')}
                        >
                          {opt.visible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyOption(opt)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                          title={isAr ? 'نسخ الخيار' : 'Copy option'}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditOption(opt)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                          title={isAr ? 'تعديل الخيار' : 'Edit option'}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(opt.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title={isAr ? 'حذف الخيار' : 'Delete option'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Inline Value Management */}
                    {isExpanded && (
                      <div className="border-t border-slate-200/70 dark:border-slate-800/80 p-3.5 bg-white dark:bg-slate-900/60 space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {isAr ? 'القيم التي تصنع التنويعات' : 'Values that build the variants'}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {opt.values.map((val) => (
                            <div
                              key={val.id}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-xs"
                            >
                              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={val.selected}
                                  onChange={() => handleToggleOptionValue(opt.id, val.id)}
                                  className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer"
                                />
                                {opt.type === 'color' ? (
                                  <input
                                    type="color"
                                    value={val.colorHex || '#64748b'}
                                    onChange={(e) => handleOptionValueColor(opt.id, val.id, e.target.value)}
                                    className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer"
                                    title={isAr ? 'اختيار اللون' : 'Pick color'}
                                  />
                                ) : val.colorHex ? (
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                                    style={{ backgroundColor: val.colorHex }}
                                  />
                                ) : null}
                                {opt.type === 'image' && (
                                  <button
                                    type="button"
                                    className="text-blue-600 cursor-pointer"
                                    title={isAr ? 'رفع صورة القيمة' : 'Upload value image'}
                                    onClick={() => {
                                      setPendingOptionImage({ optionId: opt.id, valueId: val.id });
                                      optionValueImageInputRef.current?.click();
                                    }}
                                  >
                                    {val.imageUrl ? (
                                      <img src={val.imageUrl} alt="" className="w-6 h-6 rounded object-cover" />
                                    ) : (
                                      <ImageIcon className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{pickLocaleText(isAr, val.label, val.labelAr)}</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => handleRemoveOptionValue(opt.id, val.id)}
                                className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                title={isAr ? 'حذف القيمة' : 'Remove value'}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* VARIANT INVENTORY SECTION */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {isAr ? 'مخزون التنويعات المولدة' : 'Generated Variant Inventory'} ({variations.length})
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? `إجمالي الكمية:${variantQuantityTotal}· عدد التنويعات:${variations.length}`
                      : `Total quantity: ${variantQuantityTotal} · Variants: ${variations.length}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={variantSearch}
                      onChange={(e) => setVariantSearch(e.target.value)}
                      placeholder={isAr ? 'بحث تنويع / رمز...' : 'Search variant / SKU...'}
                      className="ps-8 pe-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs w-44 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bulk Action Bar when rows are selected */}
              {selectedVariationIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      {selectedVariationIds.length} {isAr ? 'تنويعات محددة' : 'variants selected'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedVariationIds([])}
                      className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
                    >
                      {isAr ? 'إلغاء التحديد' : 'Deselect all'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleBulkSetPrice}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-2xs cursor-pointer"
                    >
                      {isAr ? 'تعديل السعر' : 'Set Price'}
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkSetStock}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-2xs cursor-pointer"
                    >
                      {isAr ? 'تعديل المخزون' : 'Set Stock'}
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 cursor-pointer"
                    >
                      {isAr ? 'حذف المحدد' : 'Delete Selected'}
                    </button>
                  </div>
                </div>
              )}

              {/* Variant Table matching reference screenshot */}
              <div className="overflow-x-auto border border-slate-200/90 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/40">
                <table className="w-full text-xs text-start">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      <th className="py-3 px-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={variations.length > 0 && selectedVariationIds.length === variations.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVariationIds(variations.map((v) => v.id));
                            } else {
                              setSelectedVariationIds([]);
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 accent-blue-600 cursor-pointer"
                        />
                      </th>
                      {variantOptionKeys.map((opt) => (
                        <th key={opt.key} className="py-3 px-3.5 text-start font-semibold">
                          {opt.label}
                        </th>
                      ))}
                      <th className="py-3 px-3.5 text-start font-semibold">{isAr ? 'رمز المنتج' : 'SKU'}</th>
                      <th className="py-3 px-3.5 text-start font-semibold">{isAr ? 'السعر' : 'Price'}</th>
                      <th className="py-3 px-3.5 text-start font-semibold">{isAr ? 'المخزون' : 'Stock'}</th>
                      <th className="py-3 px-3.5 text-center font-semibold w-16">{isAr ? 'الصورة' : 'Image'}</th>
                      <th className="py-3 px-3.5 text-center font-semibold w-20">{isAr ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {loadingVariations ? (
                      <tr>
                        <td colSpan={variantOptionKeys.length + 6} className="py-8 text-center text-slate-400">
                          {isAr ? 'جاري تحميل التنويعات...' : 'Loading variations...'}
                        </td>
                      </tr>
                    ) : variations.length === 0 ? (
                      <tr>
                        <td colSpan={variantOptionKeys.length + 6} className="py-8 text-center text-slate-400">
                          {isAr
                            ? 'لا توجد تنويعات بعد. أضف خياراً مثل اللون أو المقاس أو الصورة مع قيمه، فتُنشأ التنويعات تلقائياً.'
                            : 'No variants yet. Add an option such as color, size, or image with values and the variants are created automatically.'}
                        </td>
                      </tr>
                    ) : (
                      variations
                        .filter((v) => {
                          const q = variantSearch.trim().toLowerCase();
                          if (!q) return true;
                          const opts = Object.values(v.options || {}).join(' ').toLowerCase();
                          return (
                            v.sku.toLowerCase().includes(q) ||
                            opts.includes(q) ||
                            String(v.barcode || '')
                              .toLowerCase()
                              .includes(q)
                          );
                        })
                        .map((v, vIdx) => {
                        const isChecked = selectedVariationIds.includes(v.id);
                        const isExpanded = expandedVariantIds.includes(v.id);

                        return (
                          <React.Fragment key={v.id}>
                          <tr
                            className={`border-b border-slate-100 dark:border-slate-800/80 transition-colors ${
                              !v.isActive ? 'opacity-50' : ''
                            } ${
                              isChecked
                                ? 'bg-blue-50/50 dark:bg-blue-950/20'
                                : 'hover:bg-slate-50/60 dark:hover:bg-slate-900/30'
                            }`}
                          >
                            <td className="py-3 px-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedVariationIds(selectedVariationIds.filter((id) => id !== v.id));
                                  } else {
                                    setSelectedVariationIds([...selectedVariationIds, v.id]);
                                  }
                                }}
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 accent-blue-600 cursor-pointer"
                              />
                            </td>

                            {/* Dynamic Option Columns */}
                            {variantOptionKeys.map((opt) => {
                              const raw = v.options[opt.key] || v.options[opt.label] || '—';
                              const matchedOptRow = options.find(
                                (o) =>
                                  o.name === opt.key ||
                                  o.name === opt.label ||
                                  o.nameAr === opt.label ||
                                  o.id === opt.key,
                              );
                              const matchedForLabel = matchedOptRow?.values.find(
                                (item) => item.label === raw || item.labelAr === raw,
                              );
                              const val = pickLocaleText(
                                isAr,
                                raw === '—' ? '' : raw,
                                matchedForLabel?.labelAr,
                              ) || raw;
                              const kind = optionKind(opt.key) || optionKind(opt.label);
                              const isColor =
                                kind === 'color' ||
                                opt.key.toLowerCase().includes('color') ||
                                opt.label.toLowerCase().includes('color') ||
                                opt.key.toLowerCase().includes('لون') ||
                                opt.label.toLowerCase().includes('اللون');

                              if (isColor) {
                                const matchedOpt = options.find((o) => o.name === opt.key || o.name === opt.label);
                                const matchedVal = matchedOpt?.values.find((item) => item.label === raw);
                                const hex = colorHexForLabel(opt.key, raw);
                                return (
                                  <td key={opt.key} className="py-3 px-3.5">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="color"
                                        value={hex}
                                        disabled={!matchedVal || !matchedOpt}
                                        onChange={(e) => {
                                          if (matchedOpt && matchedVal) {
                                            handleOptionValueColor(matchedOpt.id, matchedVal.id, e.target.value);
                                          }
                                        }}
                                        className="w-7 h-7 p-0 border-0 bg-transparent cursor-pointer"
                                        title={isAr ? 'نموذج اللون' : 'Color picker'}
                                      />
                                      <span className="font-medium text-slate-800 dark:text-slate-100 text-xs">
                                        {val}
                                      </span>
                                    </label>
                                  </td>
                                );
                              }

                              return (
                                <td key={opt.key} className="py-3 px-3.5">
                                  <span className="font-medium text-slate-700 dark:text-slate-200 text-xs">
                                    {val}
                                  </span>
                                </td>
                              );
                            })}

                            {/* SKU */}
                            <td className="py-3 px-3.5">
                              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 text-xs">
                                {v.sku}
                              </span>
                            </td>

                            {/* Price */}
                            <td className="py-3 px-3.5">
                              <label className="inline-flex items-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={v.price ?? ''}
                                  onChange={(e) =>
                                    handleUpdateVariation(v.id, {
                                      price: e.target.value === '' ? null : Number(e.target.value),
                                    })
                                  }
                                  className="w-20 px-1.5 py-1 rounded-lg border text-xs font-mono tabular-nums"
                                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                                  aria-label={isAr ? 'سعر التنويع' : 'Variant price'}
                                />
                                <span className="text-[10px] font-bold text-slate-500">{isAr ? 'ر.س' : 'SAR'}</span>
                              </label>
                            </td>

                            {/* Stock inline +/- */}
                            <td className="py-3 px-3.5">
                              {v.unlimitedStock ? (
                                <span className="text-[11px] font-bold text-emerald-600">
                                  {isAr ? 'غير محدود' : 'Unlimited'}
                                </span>
                              ) : (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    className="w-6 h-6 rounded-lg border text-xs font-bold cursor-pointer"
                                    onClick={() =>
                                      handleUpdateVariation(v.id, {
                                        stock: Math.max(0, (Number(v.stock) || 0) - 1),
                                      })
                                    }
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    min={0}
                                    value={v.stock}
                                    onChange={(e) =>
                                      handleUpdateVariation(v.id, {
                                        stock: Math.max(0, parseInt(e.target.value, 10) || 0),
                                      })
                                    }
                                    className="w-14 px-1 py-0.5 rounded-lg border text-xs font-mono text-center"
                                  />
                                  <button
                                    type="button"
                                    className="w-6 h-6 rounded-lg border text-xs font-bold cursor-pointer"
                                    onClick={() =>
                                      handleUpdateVariation(v.id, {
                                        stock: (Number(v.stock) || 0) + 1,
                                      })
                                    }
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* Image Thumbnail with Click-to-Change */}
                            <td className="py-2.5 px-3.5 text-center">
                              <div className="flex flex-col items-center gap-1">
                              <div
                                onClick={() => {
                                  const realIdx = variations.findIndex((x) => x.id === v.id);
                                  setVariantMediaTargetIndex(realIdx >= 0 ? realIdx : vIdx);
                                  setMediaPickerTarget('variant');
                                  setIsMediaPickerOpen(true);
                                }}
                                className="w-10 h-10 mx-auto rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900 cursor-pointer hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20 transition-all flex items-center justify-center p-0.5 relative group shadow-2xs"
                                title={isAr ? 'مكتبة الصور' : 'Media library'}
                              >
                                <img
                                  src={v.imageUrl || gallery[0] || product.image || FALLBACK_PRODUCT_IMAGE}
                                  alt={v.sku}
                                  onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                                  className="w-full h-full object-cover rounded-md"
                                />
                              </div>
                              <button
                                type="button"
                                className="text-[10px] font-bold text-blue-600 cursor-pointer"
                                onClick={() => {
                                  setPendingVariantImageId(v.id);
                                  variantImageInputRef.current?.click();
                                }}
                              >
                                {isAr ? 'رفع' : 'Upload'}
                              </button>
                              </div>
                            </td>

                            {/* Actions (expand, pencil, trash) */}
                            <td className="py-3 px-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedVariantIds((prev) =>
                                      prev.includes(v.id)
                                        ? prev.filter((id) => id !== v.id)
                                        : [...prev, v.id],
                                    )
                                  }
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                                  title={isExpanded ? (isAr ? 'طي' : 'Collapse') : (isAr ? 'توسيع' : 'Expand')}
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateVariation(v.id, { isActive: !v.isActive })}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                                  title={v.isActive ? (isAr ? 'إخفاء التنويع' : 'Hide variant') : (isAr ? 'إظهار التنويع' : 'Show variant')}
                                >
                                  {v.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingVariant({ ...v })}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                                  title={isAr ? 'تعديل التنويع' : 'Edit variant'}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVariation(v.id)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title={isAr ? 'حذف التنويع' : 'Delete variant'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-50/80 dark:bg-slate-900/40">
                              <td colSpan={variantOptionKeys.length + 6} className="px-4 py-3">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                  {(() => {
                                    const parts = variantPriceParts(v);
                                    return (
                                      <>
                                        <div>
                                          <span className="font-bold block mb-1">{isAr ? 'رمز المنتج' : 'SKU'}</span>
                                          <input
                                            type="text"
                                            value={v.sku}
                                            onChange={(e) => handleUpdateVariation(v.id, { sku: e.target.value })}
                                            className="w-full px-2 py-1.5 rounded-lg border font-mono"
                                          />
                                        </div>
                                        <div>
                                          <span className="font-bold block mb-1">{isAr ? 'سعر التجزئة' : 'MRP'}</span>
                                          <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={v.compareAtPrice ?? ''}
                                            onChange={(e) =>
                                              handleUpdateVariation(v.id, {
                                                compareAtPrice: e.target.value === '' ? null : Number(e.target.value),
                                              })
                                            }
                                            className="w-full px-2 py-1.5 rounded-lg border font-mono"
                                          />
                                        </div>
                                        <div>
                                          <span className="font-bold block mb-1">{isAr ? 'سعر البيع' : 'Selling price'}</span>
                                          <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={v.price ?? ''}
                                            onChange={(e) =>
                                              handleUpdateVariation(v.id, {
                                                price: e.target.value === '' ? null : Number(e.target.value),
                                              })
                                            }
                                            className="w-full px-2 py-1.5 rounded-lg border font-mono"
                                          />
                                        </div>
                                        <div>
                                          <span className="font-bold block mb-1">{isAr ? 'الخصم' : 'Discount'}</span>
                                          <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={parts.discount || ''}
                                            onChange={(e) => {
                                              const cut = Math.max(0, Number(e.target.value) || 0);
                                              const mrp = Number(v.compareAtPrice) || Number(v.price) || 0;
                                              handleUpdateVariation(v.id, {
                                                compareAtPrice: mrp,
                                                price: Math.max(0, Math.round((mrp - cut) * 100) / 100),
                                              });
                                            }}
                                            className="w-full px-2 py-1.5 rounded-lg border font-mono"
                                          />
                                          {parts.percent > 0 && (
                                            <span className="text-[10px] font-bold text-rose-600">
                                              {isAr ? `خصم${parts.percent}٪` : `${parts.percent}% off`}
                                            </span>
                                          )}
                                        </div>
                                      </>
                                    );
                                  })()}
                                  <div>
                                    <span className="font-bold block mb-1">{isAr ? 'الباركود' : 'Barcode'}</span>
                                    <input
                                      type="text"
                                      value={v.barcode || ''}
                                      onChange={(e) => handleUpdateVariation(v.id, { barcode: e.target.value })}
                                      className="w-full px-2 py-1.5 rounded-lg border font-mono"
                                    />
                                  </div>
                                  <div>
                                    <span className="font-bold block mb-1">{isAr ? 'الوزن' : 'Weight'}</span>
                                    <div className="flex gap-1">
                                      <input
                                        type="number"
                                        min={0}
                                        step="0.001"
                                        value={v.weight ?? ''}
                                        onChange={(e) =>
                                          handleUpdateVariation(v.id, {
                                            weight: e.target.value === '' ? null : Number(e.target.value),
                                          })
                                        }
                                        className="flex-1 px-2 py-1.5 rounded-lg border font-mono"
                                      />
                                      <select
                                        value={v.weightUnit || 'kg'}
                                        onChange={(e) => handleUpdateVariation(v.id, { weightUnit: e.target.value })}
                                        className="px-2 py-1.5 rounded-lg border"
                                      >
                                        <option value="kg">{isAr ? 'كجم' : 'kg'}</option>
                                        <option value="g">{isAr ? 'جم' : 'g'}</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-bold block mb-1">{isAr ? 'تنبيه المخزون' : 'Low stock alert'}</span>
                                    <input
                                      type="number"
                                      min={0}
                                      value={v.lowStockAlert ?? 5}
                                      onChange={(e) =>
                                        handleUpdateVariation(v.id, {
                                          lowStockAlert: parseInt(e.target.value, 10) || 0,
                                        })
                                      }
                                      className="w-full px-2 py-1.5 rounded-lg border font-mono"
                                    />
                                  </div>
                                  <div className="flex items-end pb-1">
                                    <label className="inline-flex items-center gap-2 cursor-pointer font-bold">
                                      <input
                                        type="checkbox"
                                        checked={!!v.unlimitedStock}
                                        onChange={(e) =>
                                          handleUpdateVariation(v.id, { unlimitedStock: e.target.checked })
                                        }
                                      />
                                      {isAr ? 'كمية غير محدودة' : 'Unlimited quantity'}
                                    </label>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </>
          </div>
        )}

        {/* ROW 4: Custom Fields (Full Width, 100% Pixel-Perfect to Reference Screenshot) */}
        {sectionVisibility.custom_fields && (
          <div className="bg-white dark:bg-[#071E26] p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
            {/* Header matching reference screenshot */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 leading-tight">
                    {isAr ? 'الحقول المخصصة' : 'Custom Fields'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? 'حقول الشراء ومحتوى صفحة التفاصيل خاص بهذا المنتج: صورة ونص وفيديو.'
                      : 'Purchase fields and the details page content for this product: image, text, and video.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={handleOpenAddField}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-blue-500/50 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إضافة حقل' : 'Add Field'}</span>
                </button>
              </div>
            </div>

            {/* Custom Fields Table (Matches Reference Screenshot) */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4 text-start">{isAr ? 'اسم الحقل' : 'Field Name'}</th>
                    <th className="py-3 px-4 text-start w-36">{isAr ? 'نوع الحقل' : 'Field Type'}</th>
                    <th className="py-3 px-4 text-center w-24">{isAr ? 'مطلوب' : 'Required'}</th>
                    <th className="py-3 px-4 text-start">{isAr ? 'القاعدة الشرطية' : 'Conditional Rule'}</th>
                    <th className="py-3 px-4 text-start w-28">{isAr ? 'سعر إضافي' : 'Extra Price'}</th>
                    <th className="py-3 px-4 text-end w-24">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {customFields.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        {isAr
                          ? 'لا توجد حقول مخصصة مضافة لهذا المنتج بعد.'
                          : 'No custom fields added yet. Click "+ Add Field" above.'}
                      </td>
                    </tr>
                  ) : (
                    customFields.map((field) => (
                      <tr
                        key={field.id}
                        className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/30"
                      >
                        {/* Field Name */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {isAr && field.nameAr ? field.nameAr : field.name}
                          </span>
                        </td>

                        {/* Field Type Badge */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                            {getCustomFieldTypeLabel(field.type, isAr)}
                          </span>
                        </td>

                        {/* Required Toggle Switch */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleFieldRequired(field.id)}
                            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer p-0.5 inline-flex items-center ${
                              field.required ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                            title={field.required ? (isAr ? 'حقل إلزامي' : 'Required field') : (isAr ? 'حقل اختياري' : 'Optional field')}
                          >
                            <span
                              className={`w-4 h-4 rounded-full bg-white shadow-xs block transition-transform ${
                                field.required ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>

                        {/* Conditional Rule */}
                        <td className="py-3 px-4">
                          {field.conditionalRule && field.conditionalRule !== '—' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/50">
                              {field.conditionalRule}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-xs">—</span>
                          )}
                        </td>

                        {/* Extra Price */}
                        <td className="py-3 px-4">
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                            SAR {field.extraPrice || 0}
                          </span>
                        </td>

                        {/* Actions: Edit, Delete */}
                        <td className="py-3 px-4 text-end">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const i = customFields.findIndex((f) => f.id === field.id);
                                if (i < 1) return;
                                const next = customFields.slice();
                                const [item] = next.splice(i, 1);
                                next.splice(i - 1, 0, item);
                                setCustomFields(next);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                              title={isAr ? 'تحريك' : 'Move'}
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setCustomFields(
                                  customFields.map((f) => (f.id === field.id ? { ...f, hidden: !f.hidden } : f)),
                                )
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 cursor-pointer"
                              title={field.hidden ? (isAr ? 'إظهار' : 'Show') : isAr ? 'إخفاء' : 'Hide'}
                            >
                              {field.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setCustomFields([
                                  ...customFields,
                                  { ...field, id: `field_${Date.now()}`, name: `${field.name} ${isAr ? 'نسخة' : 'copy'}` },
                                ])
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 cursor-pointer"
                              title={isAr ? 'نسخ' : 'Copy'}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditField(field)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                              title={isAr ? 'تعديل الحقل' : 'Edit field'}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomField(field.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title={isAr ? 'حذف الحقل' : 'Delete field'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Info Box: Conditional Rules (100% Matches Reference Screenshot) */}
            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200 leading-tight">
                    {isAr ? 'القواعد الشرطية' : 'Conditional Rules'}
                  </h4>
                  <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                    {isAr
                      ? 'يمكنك إظهار أو إخفاء حقول العملاء بناءً على الخيارات المحددة.'
                      : 'You can show or hide customers fields based on selected options.'}
                  </p>
                  {/* Rule Badge Flow matching reference specification */}
                  {conditionalRule && conditionalRule.targetFieldNames && conditionalRule.targetFieldNames.length > 0 ? (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-slate-500 font-medium">{isAr ? 'إذا كان' : 'If'}</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-100 font-bold text-[11px]">
                        {conditionalRule.optionName}
                      </span>
                      <span className="text-slate-500 font-medium">{conditionalRule.operator || '='}</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-100 font-bold text-[11px]">
                        {conditionalRule.value}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mx-0.5 rtl:rotate-180" />
                      <span className="text-slate-500 font-medium">{isAr ? 'إظهار' : 'show'}</span>
                      {conditionalRule.targetFieldNames.map((fn, idx) => (
                        <React.Fragment key={fn}>
                          {idx > 0 && <span className="text-slate-500 font-medium">{isAr ? 'و' : 'and'}</span>}
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold text-[11px]">
                            {fn}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500 italic">
                      {isAr ? 'لم يتم إعداد قاعدة شرطية بعد.' : 'No conditional rule configured yet.'}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRuleModalOpen(true)}
                className="self-start sm:self-center px-3.5 py-1.5 rounded-xl border border-blue-400/60 text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-xs font-bold transition-colors shadow-2xs cursor-pointer shrink-0"
              >
                {isAr ? 'تعديل القاعدة' : 'Configure Rule'}
              </button>
            </div>
          </div>
        )}

        {/* ROW 5: Category & Tags (col-span-6) + SEO Settings (col-span-6) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CARD 8: CATEGORY & TAGS */}
          {sectionVisibility.category_tags && (
            <div className="lg:col-span-6 bg-white dark:bg-[#071E26] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <Folder className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    {isAr ? 'التصنيف والوسوم' : 'Category & Tags'}
                  </h3>
                </div>
              </div>

              {/* Multi-category assignment */}
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'التصنيفات (متعدد)' : 'Categories (multiple)'}
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border min-h-[42px] mb-2" style={{ borderColor: 'var(--border)' }}>
                  {productCategories.map((cat) => (
                    <span
                      key={cat}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 text-xs font-semibold flex items-center gap-1"
                    >
                      <span>{getProductDisplayCategory(cat, locale)}</span>
                      {productCategories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setProductCategories(productCategories.filter((c) => c !== cat))}
                          className="hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <select
                  value=""
                  onChange={(e) => {
                    const next = e.target.value;
                    if (!next) return;
                    if (!productCategories.includes(next)) {
                      setProductCategories([...productCategories, next]);
                      setCategory(productCategories[0] || next);
                    }
                  }}
                  className="w-full px-2.5 py-2 rounded-xl border text-xs font-medium cursor-pointer focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                >
                  <option value="">{isAr ? 'إضافة تصنيف...' : 'Add category...'}</option>
                  {(categoryOptions && categoryOptions.length > 0
                    ? categoryOptions
                    : categories.map((c) => ({
                        value: c,
                        label: getProductDisplayCategory(c, locale),
                      }))
                  )
                    .filter((c) => !productCategories.includes(c.value))
                    .map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                </select>
              </div>

              {/* Feature / highlight product */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 mb-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    {isAr ? 'تمييز / إبراز المنتج' : 'Highlight / Feature product'}
                  </p>
                  <p className="text-[10px] text-amber-700/80 dark:text-amber-300/70 mt-0.5">
                    {isAr
                      ? 'يظهر في أقسام المنتجات المميزة والمجموعات المميزة'
                      : 'Appears in Featured homepage sections and collections'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isFeatured}
                  onClick={() => setIsFeatured(!isFeatured)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                    isFeatured ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      isFeatured ? 'start-5' : 'start-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Tags with removable pills */}
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'الوسوم المخصصة' : 'Custom Tags'}
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border min-h-[42px] mb-2" style={{ borderColor: 'var(--border)' }}>
                  {tags.map((tg) => (
                    <span
                      key={tg}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1"
                    >
                      <span>{tg}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tg)}
                        className="hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder={isAr ? 'اكتب واضغط إدخال...' : 'Type and press Enter...'}
                    className="flex-1 min-w-[120px] bg-transparent text-xs focus:outline-none px-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CARD 9: SEO SETTINGS */}
          {sectionVisibility.seo && (
            <div className="lg:col-span-6 bg-white dark:bg-[#071E26] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <Search className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    {isAr ? 'إعدادات تحسين محركات البحث' : 'SEO Settings'}
                  </h3>
                </div>
              </div>

              {/* SEO Title */}
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'عنوان الصفحة' : 'SEO Title'}
                </label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
              </div>

              {/* Meta Description with live 0/160 counter */}
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'الوصف التعريفي' : 'Meta Description'}
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    maxLength={160}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    className="w-full p-3 pb-6 rounded-xl border text-xs leading-relaxed focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                  <span className="absolute bottom-2 end-3 text-[10px] font-mono text-slate-400">
                    {seoDescription.length}/160
                  </span>
                </div>
              </div>

              {/* URL Slug with domain prefix */}
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'رابط المنتج' : 'URL Slug'}
                </label>
                <div className="flex items-center rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  <span className="px-2.5 py-2 text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0 border-e border-slate-200 dark:border-slate-700">
                    {storeSlug || 'giftshop'}-sa.com/products/
                  </span>
                  <input
                    type="text"
                    value={urlSlug}
                    onChange={(e) => setUrlSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]+/g, ''))}
                    className="w-full px-2.5 py-2 text-xs font-mono focus:outline-none"
                    style={{ background: 'var(--input-bg)', color: 'var(--input-fg)' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* ── CENTRAL MEDIA PICKER MODAL ── */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleSelectMedia}
        multiple={mediaPickerTarget === 'gallery'}
        allowedTypes={['image', 'gif']}
        initialFolder="products"
        title={
          mediaPickerTarget === 'main'
            ? isAr
              ? 'اختيار الصورة الرئيسية'
              : 'Choose Main Image'
            : mediaPickerTarget === 'thumbnail'
            ? isAr
              ? 'استبدال صورة المنتج'
              : 'Replace Product Image'
            : mediaPickerTarget === 'variant'
            ? isAr
              ? 'اختيار صورة التنويع'
              : 'Choose Variation Image'
            : mediaPickerTarget === 'optionValue'
            ? isAr
              ? 'اختيار صورة القيمة'
              : 'Choose Value Image'
            : isAr
            ? 'إضافة صور إلى معرض المنتج'
            : 'Add Images to Product Gallery'
        }
      />

      {/* ── LIGHTBOX / PREVIEW MODAL ── */}
      {isLightboxOpen && (
        <EditorModal onClose={() => setIsLightboxOpen(false)}>
          <div className="relative max-w-4xl w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl p-6">
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 end-4 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2 aspect-square rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <img
                  src={gallery[selectedImageIndex] || gallery[0] || FALLBACK_PRODUCT_IMAGE}
                  alt={name}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="md:w-1/2 space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono uppercase text-teal-600 font-bold">{sku}</span>
                  <h2 className="text-2xl font-bold mt-1" style={{ color: 'var(--text)' }}>
                    {name}
                  </h2>
                  {subtitle && (
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                      {subtitle}
                    </p>
                  )}
                  {looksLikeHtml(description) ? (
                    <div
                      className={`text-xs text-slate-500 mt-2 ${PRODUCT_DESCRIPTION_PROSE_CLASS}`}
                      dangerouslySetInnerHTML={{ __html: description }}
                    />
                  ) : (
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed whitespace-pre-line">
                      {description || (isAr ? 'لا يوجد وصف.' : 'No description provided.')}
                    </p>
                  )}

                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="text-2xl font-black text-teal-700 dark:text-teal-400">
                      {money(discountedPrice > 0 ? discountedPrice : price)}
                    </span>
                    {discountedPrice > 0 && discountedPrice < price && (
                      <span className="text-sm line-through text-slate-400">
                        {money(price)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLightboxOpen(false);
                      window.open(
                        buildStorefrontProductUrl({ storeSlug, productId: product.id }),
                        '_blank',
                        'noopener,noreferrer',
                      );
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-teal-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{isAr ? 'عرض في المتجر مباشرة' : 'View on Storefront'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                  >
                    {isAr ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </EditorModal>
      )}

      {/* ── EDIT VARIANT MODAL ── */}
      {editingVariant && (
        <EditorModal onClose={() => setEditingVariant(null)}>
          <div className="bg-white dark:bg-[#071E26] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Box className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {isAr ? 'تعديل بيانات التنويع' : 'Edit Variant Details'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">{editingVariant.sku}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingVariant(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'رمز المنتج' : 'SKU'}
                </label>
                <input
                  type="text"
                  value={editingVariant.sku}
                  onChange={(e) => setEditingVariant({ ...editingVariant, sku: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الباركود' : 'Barcode'}
                </label>
                <input
                  type="text"
                  value={editingVariant.barcode || ''}
                  onChange={(e) => setEditingVariant({ ...editingVariant, barcode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'سعر التجزئة' : 'MRP'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingVariant.compareAtPrice ?? ''}
                    onChange={(e) =>
                      setEditingVariant({
                        ...editingVariant,
                        compareAtPrice: e.target.value === '' ? null : parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'سعر البيع' : 'Selling price'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingVariant.price ?? ''}
                    onChange={(e) =>
                      setEditingVariant({ ...editingVariant, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الخصم' : 'Discount'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={variantPriceParts(editingVariant).discount || ''}
                    onChange={(e) => {
                      const cut = Math.max(0, parseFloat(e.target.value) || 0);
                      const mrp = Number(editingVariant.compareAtPrice) || Number(editingVariant.price) || 0;
                      setEditingVariant({
                        ...editingVariant,
                        compareAtPrice: mrp,
                        price: Math.max(0, Math.round((mrp - cut) * 100) / 100),
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'المخزون' : 'Stock'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={!!editingVariant.unlimitedStock}
                    value={editingVariant.stock}
                    onChange={(e) =>
                      setEditingVariant({ ...editingVariant, stock: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-800 dark:text-slate-100 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الوزن' : 'Weight'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={editingVariant.weight ?? ''}
                      onChange={(e) =>
                        setEditingVariant({
                          ...editingVariant,
                          weight: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                    />
                    <select
                      value={editingVariant.weightUnit || 'kg'}
                      onChange={(e) => setEditingVariant({ ...editingVariant, weightUnit: e.target.value })}
                      className="px-2 py-2 rounded-xl border text-xs"
                    >
                      <option value="kg">{isAr ? 'كجم' : 'kg'}</option>
                      <option value="g">{isAr ? 'جم' : 'g'}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'تنبيه انخفاض المخزون' : 'Low stock alert'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingVariant.lowStockAlert ?? 5}
                    onChange={(e) =>
                      setEditingVariant({
                        ...editingVariant,
                        lowStockAlert: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!editingVariant.unlimitedStock}
                  onChange={(e) =>
                    setEditingVariant({ ...editingVariant, unlimitedStock: e.target.checked })
                  }
                />
                {isAr ? 'كمية غير محدودة' : 'Unlimited quantity'}
              </label>

              {/* Dynamic Option Values */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 space-y-2.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  {isAr ? 'قيم الخيارات' : 'Option Values'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(editingVariant.options).map(([k, val]) => {
                    const kind = optionKind(k);
                    const matchedOpt = options.find((o) => o.name === k || o.id === k);
                    const matchedVal = matchedOpt?.values.find((item) => item.label === val);
                    const isColor = kind === 'color' || k.toLowerCase().includes('color') || k.includes('لون');
                    return (
                    <div key={k}>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        {k}
                      </label>
                      <div className="flex items-center gap-2">
                        {isColor && matchedOpt && matchedVal && (
                          <input
                            type="color"
                            value={matchedVal.colorHex || '#64748b'}
                            onChange={(e) => handleOptionValueColor(matchedOpt.id, matchedVal.id, e.target.value)}
                            className="w-9 h-9 p-0.5 rounded-lg border cursor-pointer"
                            title={isAr ? 'نموذج اللون' : 'Color picker'}
                          />
                        )}
                        <input
                          type="text"
                          value={val}
                          onChange={(e) =>
                            setEditingVariant({
                              ...editingVariant,
                              options: { ...editingVariant.options, [k]: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* Variant Image */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'صورة التنويع' : 'Variant Image'}
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0 p-0.5 shadow-2xs">
                    <img
                      src={editingVariant.imageUrl || FALLBACK_PRODUCT_IMAGE}
                      alt={editingVariant.sku}
                      onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      placeholder={isAr ? 'رابط الصورة' : 'Image URL'}
                      value={editingVariant.imageUrl || ''}
                      onChange={(e) => setEditingVariant({ ...editingVariant, imageUrl: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPendingVariantImageId(editingVariant.id);
                          variantImageInputRef.current?.click();
                        }}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                      >
                        {isAr ? 'رفع صورة' : 'Upload image'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const vIdx = variations.findIndex((x) => x.id === editingVariant.id);
                          if (vIdx !== -1) {
                            setVariantMediaTargetIndex(vIdx);
                            setMediaPickerTarget('variant');
                            setIsMediaPickerOpen(true);
                          }
                        }}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                      >
                        {isAr ? 'مكتبة الوسائط' : 'Media library'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editingVariant.isActive}
                  onChange={(e) => setEditingVariant({ ...editingVariant, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? 'نشط في المتجر' : 'Active in Store'}
                </span>
              </label>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingVariant(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveEditedVariant}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
              >
                {isAr ? 'حفظ التعديلات' : 'Save Changes'}
              </button>
            </div>
          </div>
        </EditorModal>
      )}

      {isOptionModalOpen && (
        <ProductOptionModal
          isAr={isAr}
          mode={optionModalMode}
          initialName={optNameInput}
          initialNameAr={editingOption?.nameAr || ''}
          initialType={optTypeInput}
          initialValues={optValuesDraft}
          onClose={() => setIsOptionModalOpen(false)}
          onSave={handleSaveOptionModal}
        />
      )}


      {/* ── CUSTOM FIELD MODAL (Add / Edit Custom Field) ── */}
      {isFieldModalOpen && (
        <EditorModal onClose={() => setIsFieldModalOpen(false)}>
          <div className="bg-white dark:bg-[#071E26] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>
                  {fieldModalMode === 'add'
                    ? isAr
                      ? 'إضافة حقل مخصص جديد'
                      : 'Add Custom Field'
                    : isAr
                    ? 'تعديل الحقل المخصص'
                    : 'Edit Custom Field'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFieldModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'اسم الحقل' : 'Field Name'}
                </label>
                <input
                  type="text"
                  value={fldNameInput}
                  onChange={(e) => setFldNameInput(e.target.value)}
                  placeholder={isAr ? 'مثال: نص الرسالة، رفع صورة الهدية...' : 'e.g. Gift Message, Upload Image'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'الوصف / التعليمات' : 'Description / Instructions'}
                </label>
                <textarea
                  value={fldDescriptionInput}
                  onChange={(e) => setFldDescriptionInput(e.target.value)}
                  rows={2}
                  placeholder={
                    isAr
                      ? 'تعليمات اختيارية تظهر للعميل...'
                      : 'Optional instructions shown to the customer...'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'صورة صفحة التفاصيل' : 'Details page image'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 block w-full text-[11px]"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      void optimizeImageFile(file, 1200, 200 * 1024)
                        .then((opt) => setFldImageUrl(opt.webpUrl || URL.createObjectURL(opt.file)))
                        .catch(() => setFldImageUrl(URL.createObjectURL(file)));
                    }}
                  />
                  {fldImageUrl ? (
                    <img src={fldImageUrl} alt="" className="mt-2 h-16 w-16 rounded-lg object-cover" />
                  ) : null}
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'رابط الفيديو' : 'Video URL'}
                  </span>
                  <input
                    type="text"
                    value={fldVideoUrl}
                    onChange={(e) => setFldVideoUrl(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    placeholder="https://"
                  />
                </label>
                <textarea
                  value={fldContentEn}
                  onChange={(e) => setFldContentEn(e.target.value)}
                  rows={2}
                  dir="ltr"
                  placeholder={isAr ? 'النص الإنجليزي' : 'English text'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
                <textarea
                  value={fldContentAr}
                  onChange={(e) => setFldContentAr(e.target.value)}
                  rows={2}
                  dir="rtl"
                  placeholder={isAr ? 'النص العربي' : 'Arabic text'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'نوع الحقل' : 'Field Type'}
                </label>
                <select
                  value={normalizeCustomFieldType(fldTypeInput)}
                  onChange={(e) => {
                    const next = normalizeCustomFieldType(e.target.value);
                    setFldTypeInput(next);
                    if (!customFieldNeedsOptions(next)) {
                      setFldOptionsInput([]);
                      setFldOptionDraft('');
                    }
                    if (!customFieldIsFillable(next)) {
                      setFldRequiredInput(false);
                      setFldExtraPriceInput(0);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  {CUSTOM_FIELD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {getCustomFieldTypeLabel(type, isAr)}
                    </option>
                  ))}
                </select>
              </div>

              {customFieldNeedsOptions(fldTypeInput) && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {normalizeCustomFieldType(fldTypeInput) === 'Color Selector'
                      ? isAr
                        ? 'ألوان الاختيار'
                        : 'Color Options'
                      : isAr
                      ? 'خيارات الحقل'
                      : 'Field Options'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type={normalizeCustomFieldType(fldTypeInput) === 'Color Selector' ? 'color' : 'text'}
                      value={
                        normalizeCustomFieldType(fldTypeInput) === 'Color Selector' && !fldOptionDraft
                          ? '#ef4444'
                          : fldOptionDraft
                      }
                      onChange={(e) => setFldOptionDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFldOption();
                        }
                      }}
                      placeholder={
                        normalizeCustomFieldType(fldTypeInput) === 'Color Selector'
                          ? isAr
                            ? 'أو اكتب اسم لون / رمز HEX'
                            : 'Or type a color name / HEX'
                          : isAr
                          ? 'أضف خياراً ثم اضغط إضافة'
                          : 'Add an option then press Add'
                      }
                      className={`px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 ${
                        normalizeCustomFieldType(fldTypeInput) === 'Color Selector' ? 'w-14 h-10 p-1' : 'flex-1'
                      }`}
                    />
                    {normalizeCustomFieldType(fldTypeInput) === 'Color Selector' && (
                      <input
                        type="text"
                        value={fldOptionDraft}
                        onChange={(e) => setFldOptionDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddFldOption();
                          }
                        }}
                        placeholder={isAr ? 'مثال: أحمر أو #ef4444' : 'e.g. Red or #ef4444'}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleAddFldOption}
                      className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 cursor-pointer shrink-0"
                    >
                      {isAr ? 'إضافة' : 'Add'}
                    </button>
                  </div>
                  {fldOptionsInput.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {fldOptionsInput.map((opt) => (
                        <span
                          key={opt}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                        >
                          {normalizeCustomFieldType(fldTypeInput) === 'Color Selector' &&
                            /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(opt) && (
                              <span
                                className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 shrink-0"
                                style={{ backgroundColor: opt }}
                              />
                            )}
                          {opt}
                          <button
                            type="button"
                            onClick={() => setFldOptionsInput(fldOptionsInput.filter((o) => o !== opt))}
                            className="text-slate-400 hover:text-rose-500 cursor-pointer"
                            title={isAr ? 'حذف' : 'Remove'}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      {isAr ? 'لا توجد خيارات بعد.' : 'No options yet.'}
                    </p>
                  )}
                </div>
              )}

              {customFieldIsFillable(fldTypeInput) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {isAr ? 'سعر إضافي (ر.س)' : 'Extra Price (SAR)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={fldExtraPriceInput}
                      onChange={(e) => setFldExtraPriceInput(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {isAr ? 'إلزامية الحقل' : 'Requirement'}
                    </label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fldRequiredInput}
                        onChange={(e) => setFldRequiredInput(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {isAr ? 'حقل إلزامي' : 'Required field'}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {normalizeCustomFieldType(fldTypeInput) === 'Divider' && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 px-3 py-2">
                  {isAr
                    ? 'الفاصل عنصر عرض فقط على صفحة المنتج — لا يطلب إدخال من العميل.'
                    : 'Divider is display-only on the product page — customers do not fill it in.'}
                </p>
              )}

              <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'الظهور الشرطي' : 'Conditional Visibility'}
                  </label>
                  <select
                    value={fldConditionJoin}
                    onChange={(e) => setFldConditionJoin(e.target.value as 'AND' | 'OR')}
                    className="px-2 py-1 rounded-lg border text-[11px] font-bold cursor-pointer"
                  >
                    <option value="AND">{isAr ? 'و' : 'AND'}</option>
                    <option value="OR">{isAr ? 'أو' : 'OR'}</option>
                  </select>
                </div>
                {fldConditions.map((c, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                    <select
                      value={c.fieldId}
                      onChange={(e) => {
                        const next = [...fldConditions];
                        next[idx] = { ...next[idx], fieldId: e.target.value };
                        setFldConditions(next);
                      }}
                      className="col-span-4 px-1.5 py-1.5 rounded-lg border text-[11px]"
                    >
                      <option value="">{isAr ? 'حقل...' : 'Field...'}</option>
                      {customFields
                        .filter((f) => f.id !== editingField?.id)
                        .map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                    </select>
                    <select
                      value={c.operator}
                      onChange={(e) => {
                        const next = [...fldConditions];
                        next[idx] = { ...next[idx], operator: e.target.value };
                        setFldConditions(next);
                      }}
                      className="col-span-4 px-1.5 py-1.5 rounded-lg border text-[11px]"
                    >
                      {CONDITIONAL_OPERATORS.map((op) => (
                        <option key={op.id} value={op.id}>
                          {isAr ? op.labelAr : op.labelEn}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={c.value || ''}
                      onChange={(e) => {
                        const next = [...fldConditions];
                        next[idx] = { ...next[idx], value: e.target.value };
                        setFldConditions(next);
                      }}
                      placeholder={isAr ? 'قيمة' : 'Value'}
                      className="col-span-3 px-1.5 py-1.5 rounded-lg border text-[11px]"
                    />
                    <button
                      type="button"
                      className="col-span-1 text-rose-500 cursor-pointer"
                      onClick={() => setFldConditions(fldConditions.filter((_, i) => i !== idx))}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setFldConditions([
                      ...fldConditions,
                      { fieldId: '', operator: 'equals', value: '' },
                    ])
                  }
                  className="text-[11px] font-bold text-blue-600 cursor-pointer"
                >
                  {isAr ? '+ إضافة شرط' : '+ Add condition'}
                </button>
                <input
                  type="text"
                  value={fldConditionalRuleInput}
                  onChange={(e) => setFldConditionalRuleInput(e.target.value)}
                  placeholder={
                    isAr ? 'ملاحظة نصية اختيارية للقاعدة' : 'Optional text note for the rule'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsFieldModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveField}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
              >
                {isAr ? 'حفظ الحقل' : 'Save Field'}
              </button>
            </div>
          </div>
        </EditorModal>
      )}

      {/* ── CONDITIONAL RULE MODAL (Configure Rule) ── */}
      {isRuleModalOpen && (
        <EditorModal onClose={() => setIsRuleModalOpen(false)}>
          <div className="bg-white dark:bg-[#071E26] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span>{isAr ? 'إعداد القاعدة الشرطية' : 'Configure Conditional Rule'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRuleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'إذا تم اختيار الخيار' : 'If Option'}
                  </label>
                  <select
                    value={ruleOptionName}
                    onChange={(e) => {
                      setRuleOptionName(e.target.value);
                      const opt = options.find((o) => o.name === e.target.value);
                      if (opt && opt.values.length > 0) {
                        setRuleOptionVal(opt.values[0].label);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    {options.map((o) => (
                      <option key={o.id} value={o.name}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'القيمة المطلوبة' : 'Equals Value'}
                  </label>
                  <select
                    value={ruleOptionVal}
                    onChange={(e) => setRuleOptionVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    {(options.find((o) => o.name === ruleOptionName)?.values || []).map((v) => (
                      <option key={v.id} value={v.label}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {isAr ? 'إظهار الحقول المخصصة التالية:' : 'Show the following custom fields:'}
                </label>
                <div className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 max-h-48 overflow-y-auto">
                  {customFields.map((f) => {
                    const isChecked = ruleTargetFields.includes(f.name);
                    return (
                      <label key={f.id} className="flex items-center gap-2 cursor-pointer select-none text-xs">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setRuleTargetFields(ruleTargetFields.filter((fn: string) => fn !== f.name));
                            } else {
                              setRuleTargetFields([...ruleTargetFields, f.name]);
                            }
                          }}
                          className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{f.name}</span>
                        <span className="text-[10px] text-slate-400">({f.type})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsRuleModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveRuleModal}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
              >
                {isAr ? 'تطبيق وحفظ القاعدة' : 'Apply & Save Rule'}
              </button>
            </div>
          </div>
        </EditorModal>
      )}
    </div>
  );
};
