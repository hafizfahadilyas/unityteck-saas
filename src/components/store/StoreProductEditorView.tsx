import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import type { Product, ProductVariation, ProductColorOption } from '../../types';
import { usePrefs } from '../../i18n/PrefsContext';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../common/ToastProvider';
import { MediaPickerModal } from '../common/MediaPickerModal';
import { handleImageError, FALLBACK_PRODUCT_IMAGE } from '../../utils/imageFallback';
import { optimizeImageFile } from '../../utils/mediaOptimizer';
import { RichTextEditor } from '../common/RichTextEditor';
import { getProductDisplayCategory } from '../../utils/storeLocalization';
import * as tenantApi from '../../api/tenantApi';
import { isApiEnabled } from '../../api/client';
import {
  Eye,
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
  Sliders,
  ImageIcon,
  UploadCloud,
  RotateCw,
  Package,
} from 'lucide-react';

export interface StoreProductEditorViewProps {
  product: Product;
  storeName: string;
  storeSlug?: string;
  storeId?: string;
  canMutate?: boolean;
  categories: string[];
  availableBrands?: string[];
  onBack: () => void;
  onSave: (updatedData: Partial<Product>) => void;
  onDelete: () => void;
  onDuplicate?: (product: Product) => void;
}

export interface CustomFieldItem {
  id: string;
  name: string;
  type?: 'Text' | 'File Upload' | 'Date' | 'Dropdown' | 'Number' | 'Time' | 'Multiple Choice' | string;
  required?: boolean;
  conditionalRule?: string;
  extraPrice?: number;
  options?: string[];
  value?: string;
}

export interface ProductOptionValueItem {
  id: string;
  label: string;
  colorHex?: string;
  selected: boolean;
}

export interface ProductOptionItem {
  id: string;
  name: string;
  type: 'color' | 'select' | 'text' | string;
  values: ProductOptionValueItem[];
}

export interface ConditionalRuleItem {
  id: string;
  optionName: string;
  operator: string;
  value: string;
  action: 'show' | 'hide';
  targetFieldNames: string[];
}

interface SectionConfig {
  id: string;
  titleKey: string;
  titleEn: string;
  titleAr: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SECTIONS: SectionConfig[] = [
  { id: 'images', titleKey: 'productImages', titleEn: 'Product Images', titleAr: 'صور المنتج', icon: ImageIcon },
  { id: 'basic', titleKey: 'basicInformation', titleEn: 'Basic Information', titleAr: 'المعلومات الأساسية', icon: FileText },
  { id: 'pricing', titleKey: 'pricing', titleEn: 'Pricing', titleAr: 'التسعير', icon: Tag },
  { id: 'inventory', titleKey: 'inventoryShipping', titleEn: 'Inventory & Shipping', titleAr: 'المخزون والشحن', icon: Box },
  { id: 'options', titleKey: 'productOptionsVariants', titleEn: 'Product Options & Variants', titleAr: 'خيارات وتنوعات المنتج', icon: Package },
  { id: 'custom_fields', titleKey: 'customFields', titleEn: 'Custom Fields', titleAr: 'الحقول المخصصة', icon: Package },
  { id: 'category_tags', titleKey: 'categoryAndTags', titleEn: 'Category & Tags', titleAr: 'التصنيف والوسوم', icon: Folder },
  { id: 'seo', titleKey: 'seoSettings', titleEn: 'SEO Settings', titleAr: 'إعدادات تحسين محركات البحث (SEO)', icon: Search },
];

export const StoreProductEditorView: React.FC<StoreProductEditorViewProps> = ({
  product,
  storeName,
  storeSlug = 'store',
  storeId = '',
  canMutate = true,
  categories,
  availableBrands = [],
  onBack,
  onSave,
  onDelete,
  onDuplicate,
}) => {
  const { t, locale, currency, money } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  // ── Form State ──
  const [name, setName] = useState(product.name || '');
  const [sku, setSku] = useState(product.sku || '');
  const [category, setCategory] = useState(product.category || (categories[0] || 'General'));
  const [brand, setBrand] = useState(product.brand || availableBrands[0] || storeName);
  const [productType, setProductType] = useState(product.productType || 'Physical Product');
  const [description, setDescription] = useState(product.description || product.subtitle || '');

  // ── Pricing State ──
  const [price, setPrice] = useState<number>(product.price ?? 0);
  const [discountedPrice, setDiscountedPrice] = useState<number>(product.discountedPrice ?? product.price ?? 0);
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
  const [shippingClass, setShippingClass] = useState<string>(product.shippingClass || 'Standard');

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
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'main' | 'gallery' | 'variant' | 'thumbnail'>('gallery');
  const [targetThumbIndex, setTargetThumbIndex] = useState<number | null>(null);
  const [variantMediaTargetIndex, setVariantMediaTargetIndex] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Hidden File Inputs for Instant Device Selection (Ultra Fast)
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const thumbFileInputRef = useRef<HTMLInputElement>(null);
  const addFilesInputRef = useRef<HTMLInputElement>(null);

  // ── Product Options State ──
  const [options, setOptions] = useState<ProductOptionItem[]>(() => {
    if (product.productOptions && Array.isArray(product.productOptions) && product.productOptions.length > 0) {
      return product.productOptions.map((opt) => ({
        id: opt.id || opt.name.toLowerCase().replace(/\s+/g, '_'),
        name: opt.name,
        type: (opt.name.toLowerCase().includes('color') ? 'color' : 'select') as 'color' | 'select' | 'text',
        values: opt.values.map((v) => {
          const valLabel = typeof v === 'string' ? v : v.label;
          const valId = typeof v === 'string' ? v.toLowerCase().replace(/\s+/g, '_') : v.id;
          const valHex = typeof v === 'object' && v.colorHex ? v.colorHex : (opt.name.toLowerCase().includes('color') ? getColorHex(valLabel) : undefined);
          return {
            id: valId,
            label: valLabel,
            colorHex: valHex,
            selected: true,
          };
        }),
      }));
    }

    // Real options populated strictly from genuine product data (NO DUMMY / MOCK OPTIONS)
    const initialOpts: ProductOptionItem[] = [];

    if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
      initialOpts.push({
        id: 'color',
        name: isAr ? 'اللون' : 'Color',
        type: 'color',
        values: product.colors.map((c) => ({
          id: c.id || c.nameEn.toLowerCase().replace(/\s+/g, '_'),
          label: isAr ? c.nameAr || c.nameEn : c.nameEn || c.nameAr,
          colorHex: c.hex || getColorHex(c.nameEn),
          selected: true,
        })),
      });
    }

    if (product.storageOptions && Array.isArray(product.storageOptions) && product.storageOptions.length > 0) {
      initialOpts.push({
        id: 'edition_kit',
        name: isAr ? 'الباقة / الطراز' : 'Edition / Kit',
        type: 'select',
        values: product.storageOptions.map((s, idx) => ({
          id: `kit_${idx}`,
          label: s.capacity,
          selected: true,
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
    return [];
  });
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
        } else {
          setVariations([]);
        }
      } else if (product.variations && product.variations.length > 0) {
        setVariations(product.variations);
      } else {
        setVariations([]);
      }
    } catch {
      if (product.variations && product.variations.length > 0) {
        setVariations(product.variations);
      } else {
        setVariations([]);
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
    return product.category ? [product.category] : categories.slice(0, 1);
  });
  const [tags, setTags] = useState<string[]>(() => {
    if (product.tags && Array.isArray(product.tags) && product.tags.length > 0) {
      return product.tags;
    }
    return [];
  });
  const [badge, setBadge] = useState<string>(() => product.badge || '');
  const [newTagInput, setNewTagInput] = useState('');

  const QUICK_OCCASION_TAGS = [
    { id: 'trending', labelAr: 'الأكثر رواجاً', labelEn: 'Top Trending' },
    { id: 'best_sellers', labelAr: 'الأكثر مبيعاً', labelEn: 'Best Sellers' },
    { id: 'best_products', labelAr: 'أفضل المنتجات', labelEn: 'Best Products' },
    { id: 'featured', labelAr: 'منتج مميز', labelEn: 'Featured' },
    { id: 'women', labelAr: 'هدايا نسائية', labelEn: 'Women' },
    { id: 'valentines', labelAr: 'عيد الحب والرومانسية', labelEn: "Valentine's Day" },
    { id: 'eid', labelAr: 'الأعياد والاحتفالات', labelEn: 'Eid' },
    { id: 'birthday', labelAr: 'أعياد الميلاد', labelEn: 'Birthday' },
    { id: 'luxury', labelAr: 'تشكيلة فاخرة VIP', labelEn: 'Luxury VIP' },
  ];

  const toggleQuickTag = (tagId: string) => {
    if (tags.includes(tagId)) {
      setTags(tags.filter((t) => t !== tagId));
    } else {
      setTags([...tags, tagId]);
    }
  };

  // ── Custom Fields State (Strictly Real Product Specs / Fields - ZERO DUMMY FIELDS) ──
  const [customFields, setCustomFields] = useState<CustomFieldItem[]>(() => {
    if (product.customFields && Array.isArray(product.customFields) && product.customFields.length > 0) {
      return (product.customFields as any[]).map((f, i) => ({
        id: f.id || `field_${i}`,
        name: f.name || '',
        type: f.type || 'Text',
        required: f.required ?? false,
        conditionalRule: f.conditionalRule || '—',
        extraPrice: f.extraPrice ?? 0,
        options: f.options || [],
        value: f.value || '',
      }));
    }
    if (product.specs && Array.isArray(product.specs) && product.specs.length > 0) {
      return product.specs.map((s, i) => ({
        id: `spec_${i}`,
        name: isAr ? (s.labelAr || s.label) : (s.label || s.labelAr),
        type: 'Text',
        required: false,
        conditionalRule: '—',
        extraPrice: 0,
        value: isAr ? (s.valueAr || s.value) : (s.value || s.valueAr),
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
  const [optTypeInput, setOptTypeInput] = useState<'color' | 'select'>('select');
  const [optValuesDraft, setOptValuesDraft] = useState<Array<{ id: string; label: string; colorHex?: string }>>([]);
  const [optNewValueInput, setOptNewValueInput] = useState('');
  const [optNewColorHex, setOptNewColorHex] = useState('#ef4444');

  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [fieldModalMode, setFieldModalMode] = useState<'add' | 'edit'>('add');
  const [editingField, setEditingField] = useState<CustomFieldItem | null>(null);
  const [fldNameInput, setFldNameInput] = useState('');
  const [fldTypeInput, setFldTypeInput] = useState<string>('Text');
  const [fldRequiredInput, setFldRequiredInput] = useState(false);
  const [fldExtraPriceInput, setFldExtraPriceInput] = useState<number>(0);
  const [fldConditionalRuleInput, setFldConditionalRuleInput] = useState('');

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
      (isAr ? `تسوق ${product.name || 'المنتج'} بجودة عالية وسرعة توصيل بالمملكة العربية السعودية.` : `Buy ${product.name || 'this product'} with top quality and fast shipping in Saudi Arabia.`)
  );
  const [urlSlug, setUrlSlug] = useState(
    product.customUrl || (product.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  );

  // ── Section Visibility State (sync with right sidebar and card toggles) ──
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({
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

  const toggleSection = (id: string) => {
    setSectionVisibility((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
      toast(isAr ? `تم ضغط وإضافة ${optimizedUrls.length} صور في أجزاء من الثانية` : `Added & optimized ${optimizedUrls.length} images instantly`, 'success');
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
      toast(isAr ? `تمت إضافة ${newUrls.length} صور للمعرض` : `Added ${newUrls.length} images to gallery`, 'success');
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
    setFldTypeInput('Text');
    setFldRequiredInput(false);
    setFldExtraPriceInput(0);
    setFldConditionalRuleInput('');
    setIsFieldModalOpen(true);
  };

  const handleOpenEditField = (field: CustomFieldItem) => {
    setFieldModalMode('edit');
    setEditingField(field);
    setFldNameInput(field.name);
    setFldTypeInput(field.type || 'Text');
    setFldRequiredInput(field.required ?? false);
    setFldExtraPriceInput(field.extraPrice || 0);
    setFldConditionalRuleInput(field.conditionalRule && field.conditionalRule !== '—' ? field.conditionalRule : '');
    setIsFieldModalOpen(true);
  };

  const handleSaveField = () => {
    if (!fldNameInput.trim()) {
      toast(isAr ? 'يرجى إدخال اسم الحقل' : 'Please enter field name', 'error');
      return;
    }
    const cleanRule = fldConditionalRuleInput.trim() || '—';
    if (fieldModalMode === 'add') {
      const newFld: CustomFieldItem = {
        id: `field_${Date.now()}`,
        name: fldNameInput.trim(),
        type: fldTypeInput,
        required: fldRequiredInput,
        conditionalRule: cleanRule,
        extraPrice: Number(fldExtraPriceInput) || 0,
      };
      setCustomFields([...customFields, newFld]);
      toast(isAr ? 'تمت إضافة الحقل بنجاح' : 'Custom field added', 'success');
    } else if (editingField) {
      setCustomFields(
        customFields.map((f) =>
          f.id === editingField.id
            ? {
                ...f,
                name: fldNameInput.trim(),
                type: fldTypeInput,
                required: fldRequiredInput,
                conditionalRule: cleanRule,
                extraPrice: Number(fldExtraPriceInput) || 0,
              }
            : f
        )
      );
      toast(isAr ? 'تم تحديث الحقل بنجاح' : 'Custom field updated', 'success');
    }
    setIsFieldModalOpen(false);
  };

  // Option handlers
  const toggleOptionExpand = (optId: string) => {
    setExpandedOptionIds((prev) =>
      prev.includes(optId) ? prev.filter((id) => id !== optId) : [...prev, optId]
    );
  };

  const handleRemoveOption = (optId: string) => {
    setOptions(options.filter((o) => o.id !== optId));
    toast(isAr ? 'تم حذف الخيار' : 'Option removed', 'info');
  };

  const handleRemoveOptionValue = (optId: string, valId: string) => {
    setOptions(
      options.map((opt) =>
        opt.id === optId
          ? { ...opt, values: opt.values.filter((v) => v.id !== valId) }
          : opt
      )
    );
  };

  const handlePromptAddValue = (optId: string) => {
    const opt = options.find((o) => o.id === optId);
    if (!opt) return;
    const label = prompt(isAr ? `إضافة قيمة لـ ${opt.name}:` : `Add value to ${opt.name}:`);
    if (!label || !label.trim()) return;
    const cleanLabel = label.trim();
    const isColor = opt.type === 'color' || opt.name.toLowerCase().includes('color') || opt.name.toLowerCase().includes('لون');
    const colorHex = isColor ? getColorHex(cleanLabel) : undefined;
    setOptions(
      options.map((o) =>
        o.id === optId
          ? {
              ...o,
              values: [
                ...o.values,
                {
                  id: cleanLabel.toLowerCase().replace(/\s+/g, '_'),
                  label: cleanLabel,
                  colorHex,
                  selected: true,
                },
              ],
            }
          : o
      )
    );
    toast(isAr ? 'تمت إضافة القيمة بنجاح' : 'Option value added', 'success');
  };

  const handleOpenAddOption = () => {
    setOptionModalMode('add');
    setEditingOption(null);
    setOptNameInput('');
    setOptTypeInput('select');
    setOptValuesDraft([]);
    setOptNewValueInput('');
    setIsOptionModalOpen(true);
  };

  const handleOpenEditOption = (opt: ProductOptionItem) => {
    setOptionModalMode('edit');
    setEditingOption(opt);
    setOptNameInput(opt.name);
    setOptTypeInput(opt.type === 'color' ? 'color' : 'select');
    setOptValuesDraft(opt.values.map((v) => ({ id: v.id, label: v.label, colorHex: v.colorHex })));
    setOptNewValueInput('');
    setIsOptionModalOpen(true);
  };

  const handleAddDraftOptionValue = () => {
    if (!optNewValueInput.trim()) return;
    const label = optNewValueInput.trim();
    const isColor = optTypeInput === 'color' || optNameInput.toLowerCase().includes('color') || optNameInput.toLowerCase().includes('لون');
    const colorHex = isColor ? optNewColorHex || getColorHex(label) : undefined;
    setOptValuesDraft([
      ...optValuesDraft,
      {
        id: label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4),
        label,
        colorHex,
      },
    ]);
    setOptNewValueInput('');
  };

  const handleSaveOptionModal = () => {
    if (!optNameInput.trim()) {
      toast(isAr ? 'يرجى إدخال اسم الخيار' : 'Please enter option name', 'error');
      return;
    }
    const finalValues = optValuesDraft.map((v) => ({
      ...v,
      selected: true,
    }));
    if (finalValues.length === 0) {
      finalValues.push({
        id: 'val_default',
        label: isAr ? 'افتراضي' : 'Default',
        selected: true,
      });
    }

    if (optionModalMode === 'add') {
      const newOpt: ProductOptionItem = {
        id: `opt_${Date.now()}`,
        name: optNameInput.trim(),
        type: optTypeInput,
        values: finalValues,
      };
      setOptions([...options, newOpt]);
      toast(isAr ? 'تمت إضافة الخيار بنجاح' : 'Option added successfully', 'success');
    } else if (editingOption) {
      setOptions(
        options.map((o) =>
          o.id === editingOption.id
            ? {
                ...o,
                name: optNameInput.trim(),
                type: optTypeInput,
                values: finalValues,
              }
            : o
        )
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
      ? `إذا كان ${ruleOptionName} = ${ruleOptionVal}`
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
    setOptions(
      options.map((opt) => {
        if (opt.id !== optionId) return opt;
        return {
          ...opt,
          values: opt.values.map((v) => (v.id === valueId ? { ...v, selected: !v.selected } : v)),
        };
      })
    );
  };

  // ── Dynamic Option Columns for Variant Table ──
  const variantOptionKeys = useMemo(() => {
    const keysMap = new Map<string, string>(); // normalizedKey -> Display Label
    // Add active options
    options.forEach((opt) => {
      if (opt.values.some((v) => v.selected)) {
        keysMap.set(opt.name, opt.name);
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
            keysMap.set(k, foundOpt ? foundOpt.name : k.charAt(0).toUpperCase() + k.slice(1).replace('_', ' '));
          }
        });
      }
    });
    return Array.from(keysMap.entries()).map(([key, label]) => ({ key, label }));
  }, [options, variations]);

  // Helper for option value abbreviation in SKU
  const getOptionAbbreviation = (label: string): string => {
    const l = (label || '').trim().toLowerCase();
    if (l === 'red' || l === 'أحمر') return 'RED';
    if (l === 'white' || l === 'أبيض') return 'WHT';
    if (l === 'pink' || l === 'وردي' || l === 'زهري') return 'PNK';
    if (l === 'black' || l === 'أسود') return 'BLK';
    if (l === 'blue' || l === 'أزرق') return 'BLU';
    if (l === 'green' || l === 'أخضر') return 'GRN';
    if (l === 'yellow' || l === 'أصفر') return 'YLW';
    if (l === 'standard' || l === 'قياسي') return 'STD';
    if (l === 'premium' || l === 'فاخر') return 'PRE';
    if (l === 'gift box' || l === 'صندوق هدايا') return 'GBX';
    if (l === 's' || l === 'صغير') return 'S';
    if (l === 'm' || l === 'متوسط') return 'M';
    if (l === 'l' || l === 'كبير') return 'L';
    if (l === 'xl' || l === 'كبير جدا') return 'XL';
    const clean = label.replace(/[^a-zA-Z0-9]/g, '');
    return clean.slice(0, 3).toUpperCase() || 'OPT';
  };

  // Helper for images based on color
  // Helper for images based on color from real product data
  const getImageForColor = (colorName: string): string => {
    const l = (colorName || '').toLowerCase().trim();
    if (product.colors && Array.isArray(product.colors)) {
      const matched = product.colors.find(
        (c) =>
          c.nameEn?.toLowerCase() === l ||
          c.nameAr?.toLowerCase() === l ||
          c.nameEn?.toLowerCase().includes(l) ||
          c.nameAr?.toLowerCase().includes(l)
      );
      if (matched?.image) return matched.image;
    }
    return gallery[0] || product.image || FALLBACK_PRODUCT_IMAGE;
  };

  // Generate Variations from selected options (Cartesian Product)
  const handleGenerateVariations = async () => {
    const activeOptions = options
      .map((opt) => ({
        key: opt.name,
        id: opt.id,
        name: opt.name,
        type: opt.type,
        values: opt.values.filter((v) => v.selected),
      }))
      .filter((opt) => opt.values.length > 0);

    if (activeOptions.length === 0) {
      toast(isAr ? 'يرجى تحديد خيار واحد على الأقل' : 'Please select at least one option value', 'error');
      return;
    }

    // Cartesian product
    let combos: Array<Record<string, string>> = [{}];
    for (const opt of activeOptions) {
      const next: Array<Record<string, string>> = [];
      for (const c of combos) {
        for (const v of opt.values) {
          next.push({
            ...c,
            [opt.name]: v.label,
          });
        }
      }
      combos = next;
    }

    const basePrice = Number(discountedPrice > 0 ? discountedPrice : price) || 0;
    const baseSkuPrefix = sku && sku.trim() ? sku.trim() : 'SKU';

    const generated: ProductVariation[] = combos.map((combo, idx) => {
      const abbrs = activeOptions.map((opt) => getOptionAbbreviation(combo[opt.name] || ''));
      const variantSku = `${baseSkuPrefix}-${abbrs.join('-')}`;

      // Adjust price from real storage/edition options if applicable
      let varPrice = basePrice;
      if (product.storageOptions && Array.isArray(product.storageOptions)) {
        const matchingStorage = product.storageOptions.find(
          (s) => Object.values(combo).some((v) => v === s.capacity)
        );
        if (matchingStorage?.priceDelta) {
          varPrice = basePrice + Number(matchingStorage.priceDelta);
        }
      }

      // Stock from real product stock split or minimum 1
      const totalStock = Number(stock) > 0 ? Number(stock) : 10;
      const varStock = Math.max(1, Math.floor(totalStock / Math.max(1, combos.length)));

      // Image
      const colorVal = Object.entries(combo).find(
        ([k]) => k.toLowerCase().includes('color') || k.toLowerCase().includes('لون')
      )?.[1] || '';
      const varImg = colorVal ? getImageForColor(colorVal) : (gallery[0] || product.image || FALLBACK_PRODUCT_IMAGE);

      return {
        id: `var_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        storeId,
        productId: product.id,
        sku: variantSku,
        options: combo,
        price: varPrice,
        stock: varStock,
        imageUrl: varImg,
        isActive: true,
      };
    });

    setVariations(generated);
    setSelectedVariationIds([]);
    toast(
      isAr
        ? `تم إعادة توليد ${generated.length} تنويع بناءً على الخيارات المحددة`
        : `Successfully regenerated ${generated.length} variants from selected options`,
      'success'
    );
  };

  // Add a single variation manually
  const handleAddVariation = () => {
    const defaultOpts: Record<string, string> = {};
    options.forEach((opt) => {
      const sel = opt.values.find((v) => v.selected) || opt.values[0];
      if (sel) defaultOpts[opt.name] = sel.label;
    });

    const abbrs = Object.values(defaultOpts).map(getOptionAbbreviation);
    const varSku = `${sku || 'SKU'}-${abbrs.join('-') || `VAR-${variations.length + 1}`}`;

    const newVar: ProductVariation = {
      id: `var_${Date.now()}`,
      storeId,
      productId: product.id,
      sku: varSku,
      options: defaultOpts,
      price: discountedPrice > 0 ? discountedPrice : price,
      stock: 10,
      imageUrl: gallery[0] || product.image || FALLBACK_PRODUCT_IMAGE,
      isActive: true,
    };
    setVariations([...variations, newVar]);
    toast(isAr ? 'تمت إضافة تنويع جديد' : 'New variant added', 'success');
  };

  const handleUpdateVariation = (id: string, patch: Partial<ProductVariation>) => {
    setVariations(variations.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  const handleSaveEditedVariant = () => {
    if (!editingVariant) return;
    setVariations(variations.map((v) => (v.id === editingVariant.id ? editingVariant : v)));
    if (isApiEnabled() && storeId && product.id) {
      void tenantApi.updateVariation(storeId, product.id, editingVariant.id, {
        sku: editingVariant.sku,
        price: editingVariant.price,
        stock: editingVariant.stock,
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
    const val = prompt(isAr ? 'أدخل السعر الجديد للتنويعات المحددة (SAR):' : 'Enter new price for selected variants (SAR):');
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
    if (!window.confirm(isAr ? `هل أنت متأكد من حذف ${selectedVariationIds.length} تنويع؟` : `Delete ${selectedVariationIds.length} selected variants?`)) {
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
      toast(isAr ? 'يرجى إدخال رمز SKU' : 'Please enter product SKU', 'error');
      return;
    }

    const payload: Partial<Product> = {
      name,
      sku,
      category,
      brand,
      productType,
      description,
      price: Number(price),
      discountedPrice: Number(discountedPrice),
      taxRate: Number(taxRate),
      stock: Number(stock),
      lowStockAlert: Number(lowStockAlert),
      stockStatus,
      weightKg: Number(weightKg),
      shippingClass,
      dimensions,
      image: gallery[selectedImageIndex] || gallery[0] || product.image,
      galleryUrls: gallery,
      additionalImages: gallery.slice(1),
      badge: badge || undefined,
      tags,
      customFields: customFields.map((f, i) => ({
        id: f.id || `cf_${i}`,
        name: f.name,
        type: f.type,
        required: f.required,
        conditionalRule: f.conditionalRule,
        extraPrice: f.extraPrice,
        options: f.options,
        value: f.value ?? '',
      })),
      productOptions: options.map((opt) => ({
        id: opt.id,
        name: opt.name,
        type: opt.type,
        values: opt.values.map((v) => ({
          id: v.id,
          label: v.label,
          colorHex: v.colorHex,
          selected: v.selected,
        })),
      })),
      conditionalRules: conditionalRule ? [conditionalRule] : [],
      variations,
      seoTitle,
      seoDescription,
      customUrl: urlSlug,
    };

    onSave(payload);
  };

  return (
    <div className="p-4 sm:p-6 pb-16 max-w-[1600px] mx-auto space-y-5">
      {/* ── HEADER ROW (Pixel-Perfect Matching Mockup 07) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Green vertical indicator bar & Title */}
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-teal-600 rounded-full shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
              {isAr ? 'تعديل المنتج' : 'Edit Product'}
            </h1>
          </div>

          {/* Breadcrumbs: < Products > Edit Product */}
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
              {isAr ? 'تعديل المنتج' : 'Edit Product'}
            </span>
          </div>
        </div>

        {/* Top Right Action Buttons: Preview, Duplicate, View on Store, Save Changes */}
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

          {/* Duplicate Button */}
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

          {/* View on Store Button */}
          <button
            type="button"
            onClick={() => {
              const url = `/store/${storeSlug}?product=${product.id}`;
              window.open(url, '_blank');
            }}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-slate-500" />
            <span>{isAr ? 'عرض في المتجر' : 'View on Store'}</span>
          </button>

          {/* Save Changes Solid Teal Button */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!canMutate}
            className="px-5 py-2 text-xs font-bold text-white rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all hover:opacity-95 bg-teal-700 hover:bg-teal-800 disabled:opacity-50"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'حفظ التغييرات' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* ── MAIN GRID (100% Mockup 07 Layout) ── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ROW 1: Product Images + Basic Information + Product Edit Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CARD 1: PRODUCT IMAGES */}
          {sectionVisibility.images && (
            <div className="lg:col-span-5 bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                      {isAr ? 'صور المنتج' : 'Product Images'}
                    </h3>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'أضف صوراً عالية الجودة لعرض منتجك.' : 'Add high-quality images to showcase your product.'}
                    </p>
                  </div>
                </div>

                {/* Teal Toggle Switch */}
                <button
                  type="button"
                  onClick={() => toggleSection('images')}
                  className="w-11 h-6 rounded-full bg-teal-600 transition-colors relative cursor-pointer p-0.5"
                  title="Toggle section"
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-md block transition-transform transform translate-x-5 rtl:-translate-x-5" />
                </button>
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
            <div className="lg:col-span-4 bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                      {isAr ? 'المعلومات الأساسية' : 'Basic Information'}
                    </h3>
                  </div>
                </div>

                {/* Teal Toggle Switch */}
                <button
                  type="button"
                  onClick={() => toggleSection('basic')}
                  className="w-11 h-6 rounded-full bg-teal-600 transition-colors relative cursor-pointer p-0.5"
                  title="Toggle section"
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-md block transition-transform transform translate-x-5 rtl:-translate-x-5" />
                </button>
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
                    placeholder="e.g. Red Sports Shoes"
                    className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'رمز SKU' : 'SKU'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. SHOE-RED-001"
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
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border text-xs font-medium cursor-pointer focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {getProductDisplayCategory(c, locale)}
                      </option>
                    ))}
                    {!categories.includes(category) && (
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
                    <option value="HiBrew">HiBrew</option>
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

              {/* Form Row 3: Short Description with 0/200 Counter */}
              <div>
                <RichTextEditor
                  label={isAr ? 'الوصف والتفاصيل' : 'Description'}
                  value={description}
                  onChange={setDescription}
                  placeholder={isAr ? 'اكتب وصف المنتج ومواصفاته الفنية...' : 'High-quality product details and specifications...'}
                  isAr={isAr}
                />
              </div>
            </div>
          )}

          {/* CARD 3: PRODUCT EDIT SECTIONS MANAGER (Right Column) */}
          <div className="lg:col-span-3 bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                  {isAr ? 'أقسام تعديل المنتج' : 'Product Edit Sections'}
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'إظهار أو إخفاء أقسام هذه الصفحة.' : 'Show or hide sections on this page.'}
                </p>
              </div>
            </div>

            {/* List of 9 Draggable / Toggleable Section Items */}
            <div className="space-y-1 pt-1">
              {SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isVisible = sectionVisibility[sec.id] !== false;
                return (
                  <div
                    key={sec.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600 cursor-grab" />
                      <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                        {isAr ? sec.titleAr : sec.titleEn}
                      </span>
                    </div>

                    {/* Teal Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleSection(sec.id)}
                      className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                        isVisible ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white shadow-md block transition-transform transform ${
                          isVisible ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ROW 2: Pricing (left) + Inventory & Shipping (center/right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CARD 4: PRICING */}
          {sectionVisibility.pricing && (
            <div className="lg:col-span-5 bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    {isAr ? 'التسعير' : 'Pricing'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSection('pricing')}
                  className="w-11 h-6 rounded-full bg-teal-600 transition-colors relative cursor-pointer p-0.5"
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-md block transition-transform transform translate-x-5 rtl:-translate-x-5" />
                </button>
              </div>

              {/* 3-Column Inputs: Regular Price, Sale Price, Tax Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'السعر الأساسي (SAR)' : 'Regular Price (SAR)'} <span className="text-rose-500">*</span>
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
                    {isAr ? 'سعر الخصم (SAR)' : 'Sale Price (SAR)'}
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
            </div>
          )}

          {/* CARD 5: INVENTORY & SHIPPING */}
          {sectionVisibility.inventory && (
            <div className="lg:col-span-7 bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <Box className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    {isAr ? 'المخزون والشحن' : 'Inventory & Shipping'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSection('inventory')}
                  className="w-11 h-6 rounded-full bg-teal-600 transition-colors relative cursor-pointer p-0.5"
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-md block transition-transform transform translate-x-5 rtl:-translate-x-5" />
                </button>
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

              {/* Row 2: Weight (kg), Shipping Class, Dimensions (cm) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-3">
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'الوزن (kg)' : 'Weight (kg)'}
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

                <div className="sm:col-span-4">
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'فئة الشحن' : 'Shipping Class'}
                  </label>
                  <select
                    value={shippingClass}
                    onChange={(e) => setShippingClass(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border text-xs font-medium cursor-pointer focus:outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  >
                    <option value="Standard">{isAr ? 'شحن عادي' : 'Standard'}</option>
                    <option value="Express">{isAr ? 'شحن سريع' : 'Express'}</option>
                    <option value="Shoes">{isAr ? 'أحذية' : 'Shoes'}</option>
                    <option value="Coffee Machines">{isAr ? 'مكائن قهوة' : 'Coffee Machines'}</option>
                    <option value="Heavy">{isAr ? 'ثقيل' : 'Heavy'}</option>
                    <option value="Fragile">{isAr ? 'قابل للكسر' : 'Fragile'}</option>
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                    {isAr ? 'الأبعاد (cm)' : 'Dimensions (cm)'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      min="0"
                      value={dimensions.length}
                      onChange={(e) => setDimensions({ ...dimensions, length: Number(e.target.value) })}
                      placeholder="L"
                      className="w-full px-2 py-2 rounded-xl border text-xs text-center font-mono focus:outline-none"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                    />
                    <input
                      type="number"
                      min="0"
                      value={dimensions.width}
                      onChange={(e) => setDimensions({ ...dimensions, width: Number(e.target.value) })}
                      placeholder="W"
                      className="w-full px-2 py-2 rounded-xl border text-xs text-center font-mono focus:outline-none"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                    />
                    <input
                      type="number"
                      min="0"
                      value={dimensions.height}
                      onChange={(e) => setDimensions({ ...dimensions, height: Number(e.target.value) })}
                      placeholder="H"
                      className="w-full px-2 py-2 rounded-xl border text-xs text-center font-mono focus:outline-none"
                      style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                    />
                  </div>
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
                    {isAr ? 'خيارات المنتج والتنويعات' : 'Product Options & Variants'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? 'إضافة خيارات المنتج مثل اللون والمقاس والنوع. سيتم إنشاء المتغيرات تلقائيًا.'
                      : 'Add product options like color, size, and type. Variants will be generated automatically.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={handleOpenAddOption}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-blue-500/50 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إضافة خيار' : '+ Add Option'}</span>
                </button>
              </div>
            </div>

            {/* Options List (Grip, Name, Value Pills with Colors, Expand, Edit, Delete) */}
            <div className="space-y-3">
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
                          {opt.name}
                        </span>
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
                              <span>{val.label}</span>
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
                            {isAr ? 'القيم المحددة لتوليد التنويعات:' : 'Active values for variants generation:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handlePromptAddValue(opt.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{isAr ? 'إضافة قيمة سريعة' : '+ Add Value'}</span>
                          </button>
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
                                {val.colorHex && (
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                                    style={{ backgroundColor: val.colorHex }}
                                  />
                                )}
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{val.label}</span>
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
                      ? 'إدارة تفاصيل الأسعار والمخزون والصور لكل تنويع.'
                      : 'Manage price, stock, SKU, and image for each generated variant.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={handleGenerateVariations}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-blue-500/40 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{isAr ? 'إعادة توليد التنويعات' : 'Regenerate Variants'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddVariation}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                    title={isAr ? 'إضافة تنويع يدوياً' : 'Add custom variant'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isAr ? 'إضافة تنويع' : 'Add Variant'}</span>
                  </button>
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
                      <th className="py-3 px-3.5 text-start font-semibold">SKU</th>
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
                            ? 'لا توجد تنويعات بعد. حدد الخيارات ثم انقر على "إعادة توليد التنويعات".'
                            : 'No variations yet. Select options and click "Regenerate Variants".'}
                        </td>
                      </tr>
                    ) : (
                      variations.map((v, vIdx) => {
                        const isChecked = selectedVariationIds.includes(v.id);

                        return (
                          <tr
                            key={v.id}
                            className={`border-b border-slate-100 dark:border-slate-800/80 transition-colors ${
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
                              const val = v.options[opt.key] || v.options[opt.label] || '—';
                              const isColor =
                                opt.key.toLowerCase().includes('color') ||
                                opt.label.toLowerCase().includes('color') ||
                                opt.key.toLowerCase().includes('لون') ||
                                opt.label.toLowerCase().includes('اللون');

                              if (isColor) {
                                const hex = getColorHex(val);
                                return (
                                  <td key={opt.key} className="py-3 px-3.5">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/15 shadow-2xs"
                                        style={{ backgroundColor: hex }}
                                      />
                                      <span className="font-medium text-slate-800 dark:text-slate-100 text-xs">
                                        {val}
                                      </span>
                                    </div>
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
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-xs tabular-nums">
                                {isAr ? `${v.price ?? price} ر.س` : `SAR ${v.price ?? price}`}
                              </span>
                            </td>

                            {/* Stock */}
                            <td className="py-3 px-3.5">
                              <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs tabular-nums">
                                {v.stock}
                              </span>
                            </td>

                            {/* Image Thumbnail with Click-to-Change */}
                            <td className="py-2.5 px-3.5 text-center">
                              <div
                                onClick={() => {
                                  setVariantMediaTargetIndex(vIdx);
                                  setMediaPickerTarget('variant');
                                  setIsMediaPickerOpen(true);
                                }}
                                className="w-10 h-10 mx-auto rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900 cursor-pointer hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20 transition-all flex items-center justify-center p-0.5 relative group shadow-2xs"
                                title={isAr ? 'انقر لتغيير الصورة' : 'Click to change image'}
                              >
                                <img
                                  src={v.imageUrl || gallery[0] || product.image || FALLBACK_PRODUCT_IMAGE}
                                  alt={v.sku}
                                  onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                                  className="w-full h-full object-cover rounded-md"
                                />
                              </div>
                            </td>

                            {/* Actions (Pencil & Trash) */}
                            <td className="py-3 px-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
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
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ROW 4: Custom Fields (Full Width, 100% Pixel-Perfect to Reference Screenshot) */}
        {sectionVisibility.custom_fields && (
          <div className="bg-white dark:bg-[#071E26] p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
            {/* Header matching reference screenshot */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 leading-tight">
                    {isAr ? 'الحقول المخصصة' : 'Custom Fields'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr
                      ? 'إضافة حقول مخصصة للعملاء لتعبئتها عند شراء هذا المنتج.'
                      : 'Add custom fields for customers to fill when purchasing this product.'}
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
                  <span>{isAr ? 'إضافة حقل' : '+ Add Field'}</span>
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
                            {field.name}
                          </span>
                        </td>

                        {/* Field Type Badge */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                            {field.type || 'Text'}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <Folder className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    {isAr ? 'التصنيف والوسوم' : 'Category & Tags'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSection('category_tags')}
                  className="w-11 h-6 rounded-full bg-teal-600 transition-colors relative cursor-pointer p-0.5"
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-md block transition-transform transform translate-x-5 rtl:-translate-x-5" />
                </button>
              </div>

              {/* Categories multi-select / pill */}
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'التصنيفات' : 'Categories'}
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border min-h-[42px]" style={{ borderColor: 'var(--border)' }}>
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
              </div>

              {/* Product Badge / Highlight Ribbon */}
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text)' }}>
                  {isAr ? 'شارة تميز المنتج (Homepage Ribbon)' : 'Product Highlight Badge'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {[
                    { id: '', labelAr: 'بدون شارة', labelEn: 'None' },
                    { id: 'trending', labelAr: 'الأكثر رواجاً 🔥', labelEn: 'Top Trending' },
                    { id: 'best_sellers', labelAr: 'الأكثر مبيعاً ⭐', labelEn: 'Best Seller' },
                    { id: 'best_products', labelAr: 'أفضل المنتجات 👑', labelEn: 'Top Product' },
                    { id: 'featured', labelAr: 'منتج مميز ✨', labelEn: 'Featured' },
                    { id: 'new', labelAr: 'وصل حديثاً 🆕', labelEn: 'New Arrival' },
                    { id: 'discount', labelAr: 'عرض خاص 🏷️', labelEn: 'Special Offer' },
                  ].map((bItem) => {
                    const isSelected = badge === bItem.id;
                    return (
                      <button
                        key={bItem.id}
                        type="button"
                        onClick={() => setBadge(bItem.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-start flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <span>{isAr ? bItem.labelAr : bItem.labelEn}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Occasions & Dynamic Collections */}
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text)' }}>
                  {isAr ? 'الأقسام الموسمية والمناسبات (تظهر في أقسام الصفحة الرئيسية)' : 'Occasions & Dynamic Collections (Show on Homepage)'}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {QUICK_OCCASION_TAGS.map((qTag) => {
                    const isTagged = tags.includes(qTag.id);
                    return (
                      <button
                        key={qTag.id}
                        type="button"
                        onClick={() => toggleQuickTag(qTag.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                          isTagged
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <span>{isAr ? qTag.labelAr : qTag.labelEn}</span>
                        {isTagged && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
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
                    placeholder={isAr ? 'اكتب واضغط Enter...' : 'Type and press Enter...'}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <Search className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    {isAr ? 'إعدادات SEO' : 'SEO Settings'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSection('seo')}
                  className="w-11 h-6 rounded-full bg-teal-600 transition-colors relative cursor-pointer p-0.5"
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-md block transition-transform transform translate-x-5 rtl:-translate-x-5" />
                </button>
              </div>

              {/* SEO Title */}
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'عنوان الصفحة (SEO Title)' : 'SEO Title'}
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
                  {isAr ? 'الوصف التعريفي (Meta Description)' : 'Meta Description'}
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
                  {isAr ? 'رابط المنتج (URL Slug)' : 'URL Slug'}
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
            : isAr
            ? 'إضافة صور إلى معرض المنتج'
            : 'Add Images to Product Gallery'
        }
      />

      {/* ── LIGHTBOX / PREVIEW MODAL ── */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
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
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {description || 'No description provided.'}
                  </p>

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
                      const url = `/store/${storeSlug}?product=${product.id}`;
                      window.open(url, '_blank');
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
        </div>
      )}

      {/* ── EDIT VARIANT MODAL ── */}
      {editingVariant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
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
                  {isAr ? 'رمز SKU' : 'SKU'}
                </label>
                <input
                  type="text"
                  value={editingVariant.sku}
                  onChange={(e) => setEditingVariant({ ...editingVariant, sku: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'السعر (SAR)' : 'Price (SAR)'}
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
                    {isAr ? 'المخزون' : 'Stock'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingVariant.stock}
                    onChange={(e) =>
                      setEditingVariant({ ...editingVariant, stock: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Dynamic Option Values */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 space-y-2.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  {isAr ? 'قيم الخيارات' : 'Option Values'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(editingVariant.options).map(([k, val]) => (
                    <div key={k}>
                      <label className="block text-[11px] font-semibold text-slate-500 capitalize mb-1">
                        {k.replace('_', ' ')}
                      </label>
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
                  ))}
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
                      placeholder="Image URL"
                      value={editingVariant.imageUrl || ''}
                      onChange={(e) => setEditingVariant({ ...editingVariant, imageUrl: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
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
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer block"
                    >
                      {isAr ? 'اختيار من مكتبة الوسائط' : 'Choose from Media Library'}
                    </button>
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
        </div>
      )}

      {/* ── OPTION MODAL (Add / Edit Option) ── */}
      {isOptionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#071E26] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" />
                <span>
                  {optionModalMode === 'add'
                    ? isAr
                      ? 'إضافة خيار منتج جديد'
                      : 'Add Product Option'
                    : isAr
                    ? 'تعديل خيار المنتج'
                    : 'Edit Product Option'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsOptionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'اسم الخيار (مثال: اللون، الحجم، التغليف)' : 'Option Name (e.g. Color, Size, Gift Wrap)'}
                </label>
                <input
                  type="text"
                  value={optNameInput}
                  onChange={(e) => setOptNameInput(e.target.value)}
                  placeholder={isAr ? 'أدخل اسم الخيار...' : 'e.g. Color, Size, Gift Wrap'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'نوع الخيار' : 'Option Type'}
                </label>
                <select
                  value={optTypeInput}
                  onChange={(e) => setOptTypeInput(e.target.value as 'select' | 'color')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="select">{isAr ? 'قائمة منسدلة / أزرار (Dropdown / Buttons)' : 'Select / Buttons'}</option>
                  <option value="color">{isAr ? 'ألوان مع عينات لونية (Color Swatches)' : 'Color Swatches'}</option>
                </select>
              </div>

              {/* Values Management */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'قيم الخيار' : 'Option Values'}
                </label>

                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={optNewValueInput}
                    onChange={(e) => setOptNewValueInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDraftOptionValue();
                      }
                    }}
                    placeholder={isAr ? 'أدخل قيمة (مثال: أحمر، كبير)...' : 'Enter value (e.g. Red, Large)...'}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  {optTypeInput === 'color' && (
                    <input
                      type="color"
                      value={optNewColorHex}
                      onChange={(e) => setOptNewColorHex(e.target.value)}
                      className="w-9 h-9 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
                      title={isAr ? 'اختر اللون' : 'Pick color'}
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleAddDraftOptionValue}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    {isAr ? 'إضافة' : 'Add'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 min-h-[44px]">
                  {optValuesDraft.length === 0 ? (
                    <span className="text-[11px] text-slate-400 p-1">
                      {isAr ? 'لم تتم إضافة قيم بعد' : 'No values added yet'}
                    </span>
                  ) : (
                    optValuesDraft.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs"
                      >
                        {v.colorHex && (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: v.colorHex }}
                          />
                        )}
                        <span>{v.label}</span>
                        <button
                          type="button"
                          onClick={() => setOptValuesDraft(optValuesDraft.filter((x) => x.id !== v.id))}
                          className="text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsOptionModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveOptionModal}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
              >
                {isAr ? 'حفظ الخيار' : 'Save Option'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOM FIELD MODAL (Add / Edit Custom Field) ── */}
      {isFieldModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#071E26] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
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
                  {isAr ? 'نوع الحقل' : 'Field Type'}
                </label>
                <select
                  value={fldTypeInput}
                  onChange={(e) => setFldTypeInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="Text">Text (نص قصير)</option>
                  <option value="Textarea">Textarea (نص متعدد الأسطر)</option>
                  <option value="File Upload">File Upload (رفع ملف/صورة)</option>
                  <option value="Date">Date (تاريخ)</option>
                  <option value="Dropdown">Dropdown (قائمة منسدلة)</option>
                  <option value="Checkbox">Checkbox (مربع اختيار)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'سعر إضافي (SAR)' : 'Extra Price (SAR)'}
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

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'القاعدة الشرطية (اختياري)' : 'Conditional Rule (Optional)'}
                </label>
                <input
                  type="text"
                  value={fldConditionalRuleInput}
                  onChange={(e) => setFldConditionalRuleInput(e.target.value)}
                  placeholder={isAr ? 'مثال: If Gift Wrap = Premium' : 'e.g. If Gift Wrap = Premium'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
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
        </div>
      )}

      {/* ── CONDITIONAL RULE MODAL (Configure Rule) ── */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
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
                    {isAr ? 'إذا تم اختيار الخيار (If Option)' : 'If Option'}
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
                    {isAr ? 'القيمة المطلوبة (= Value)' : 'Equals Value'}
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
                  {isAr ? 'إظهار الحقول المخصصة التالية (Show Fields):' : 'Show the following custom fields:'}
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
        </div>
      )}
    </div>
  );
};
