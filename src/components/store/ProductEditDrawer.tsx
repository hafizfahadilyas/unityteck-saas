import React, { useState, useEffect, useRef } from 'react';
import type { Product } from '../../types';
import { usePrefs } from '../../i18n/PrefsContext';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../common/ToastProvider';
import { MediaPickerModal } from '../common/MediaPickerModal';
import { handleImageError, FALLBACK_PRODUCT_IMAGE } from '../../utils/imageFallback';
import { optimizeImageFile } from '../../utils/mediaOptimizer';
import { RichTextEditor } from '../common/RichTextEditor';
import {
  X,
  Maximize2,
  Save,
  ImageIcon,
  FileText,
  Tag,
  Box,
  Layers,
  Settings,
  FileSpreadsheet,
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Edit,
  Check,
  UploadCloud,
  RotateCw,
  Star,
} from 'lucide-react';

export interface ProductEditDrawerProps {
  isOpen: boolean;
  product: Product | null;
  storeId: string;
  categories: string[];
  availableBrands?: { id: string; name: string }[];
  onClose: () => void;
  onSave: (updatedData: Partial<Product>) => void;
  onExpandFullView?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export const ProductEditDrawer: React.FC<ProductEditDrawerProps> = ({
  isOpen,
  product,
  storeId,
  categories,
  availableBrands = [],
  onClose,
  onSave,
  onExpandFullView,
  onDelete,
  onDuplicate,
}) => {
  const { t, locale, money } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  // Section Open/Close States (accordions)
  const [sectionsOpen, setSectionsOpen] = useState<Record<string, boolean>>({
    images: true,
    basic: true,
    pricing: true,
    inventory: true,
    variations: false,
    variationInventory: false,
    customFields: false,
    seo: false,
  });

  // Section Enabled (toggles)
  const [sectionsEnabled, setSectionsEnabled] = useState<Record<string, boolean>>({
    images: true,
    basic: true,
    pricing: true,
    inventory: true,
    variations: true,
    variationInventory: true,
    customFields: true,
    seo: true,
  });

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [badge, setBadge] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);

  // Pricing
  const [price, setPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number | string>('');
  const [taxRate, setTaxRate] = useState<number>(15);

  // Inventory & Shipping
  const [stock, setStock] = useState<number>(0);
  const [stockStatus, setStockStatus] = useState<string>('In Stock');
  const [weightKg, setWeightKg] = useState<number>(0.8);
  const [shippingClass, setShippingClass] = useState<string>('Shoes');

  // Images
  const { updateProduct } = useTenant();
  const [mainImage, setMainImage] = useState<string>('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'main' | 'gallery' | 'thumbnail'>('gallery');
  const [targetThumbnailIndex, setTargetThumbnailIndex] = useState<number | null>(null);

  // Hidden File Inputs for Instant Device Selection (Ultra Fast)
  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const thumbFileInputRef = useRef<HTMLInputElement>(null);
  const addFilesInputRef = useRef<HTMLInputElement>(null);

  // Custom Fields
  const [customFields, setCustomFields] = useState<{ id: string; name: string; value: string }[]>([]);

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  // Populate from active product
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setSku(product.sku || '');
      setShortDescription(product.subtitle || (typeof product.description === 'string' ? product.description.slice(0, 200) : ''));
      setCategory(product.category || (categories[0] || ''));
      setBrand(product.brand || '');
      setBadge(product.badge || '');
      setTags(Array.isArray(product.tags) ? product.tags : []);

      setPrice(product.price ?? 0);
      setSalePrice(product.discountedPrice ?? '');
      setTaxRate(product.taxRate ?? 15);

      setStock(product.stock ?? 0);
      setStockStatus(product.stockStatus || (product.stock > 0 ? 'In Stock' : 'Out of Stock'));
      setWeightKg(product.weightKg ?? 0.8);
      setShippingClass((product as any).shippingClass || (product.category === 'Shoes' ? 'Shoes' : 'Standard'));

      setMainImage(product.image || '');
      const list = [...(product.galleryUrls || [])];
      if (product.image && !list.includes(product.image)) {
        list.unshift(product.image);
      }
      setGallery(list.filter(Boolean));

      setCustomFields(
        Array.isArray((product as any).customFields)
          ? (product as any).customFields
          : []
      );

      setSeoTitle(product.seoTitle || product.name || '');
      setSeoDescription(product.seoDescription || '');
      setCustomUrl(product.customUrl || (product as any).slug || '');
    }
  }, [product, categories]);

  if (!isOpen || !product) return null;

  const toggleAccordion = (secKey: string) => {
    setSectionsOpen((prev) => ({ ...prev, [secKey]: !prev[secKey] }));
  };

  const toggleSectionSwitch = (secKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSectionsEnabled((prev) => ({ ...prev, [secKey]: !prev[secKey] }));
  };

  // Instant direct file upload from computer for Main Image (Auto-Optimized to WebP in KB)
  const handleMainFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const opt = await optimizeImageFile(file, 1200, 200 * 1024);
      const url = opt.webpUrl || URL.createObjectURL(opt.file);
      setMainImage(url);
      const updatedGallery = [url, ...gallery.filter((u) => u !== url)];
      setGallery(updatedGallery);
      if (updateProduct && product?.id) {
        updateProduct(product.id, { image: url, galleryUrls: updatedGallery }, storeId);
      }
      toast(isAr ? `تم ضغط وتحسين الصورة بنجاح (${opt.savingsPct}% وفر)` : `Main image optimized (${opt.savingsPct}% smaller)`, 'success');
    } catch {
      const url = URL.createObjectURL(file);
      setMainImage(url);
      const updatedGallery = [url, ...gallery.filter((u) => u !== url)];
      setGallery(updatedGallery);
      if (updateProduct && product?.id) {
        updateProduct(product.id, { image: url, galleryUrls: updatedGallery }, storeId);
      }
      toast(isAr ? 'تم تغيير وتحديث الصورة الرئيسية فوراً' : 'Main image updated instantly', 'success');
    }
    e.target.value = '';
  };

  // Instant direct file upload from computer for a specific thumbnail (Auto-Optimized to WebP)
  const handleThumbFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || targetThumbnailIndex === null) return;
    try {
      const opt = await optimizeImageFile(file, 1200, 200 * 1024);
      const url = opt.webpUrl || URL.createObjectURL(opt.file);
      const updated = [...gallery];
      const oldUrl = updated[targetThumbnailIndex];
      updated[targetThumbnailIndex] = url;
      setGallery(updated);
      const isTargetMain = mainImage === oldUrl || targetThumbnailIndex === 0;
      if (isTargetMain) {
        setMainImage(url);
      }
      if (updateProduct && product?.id) {
        updateProduct(
          product.id,
          {
            galleryUrls: updated,
            ...(isTargetMain ? { image: url } : {}),
          },
          storeId
        );
      }
      toast(isAr ? `تم تحسين الصورة بنجاح (${opt.savingsPct}% وفر)` : `Image optimized (${opt.savingsPct}% smaller)`, 'success');
    } catch {
      const url = URL.createObjectURL(file);
      const updated = [...gallery];
      const oldUrl = updated[targetThumbnailIndex];
      updated[targetThumbnailIndex] = url;
      setGallery(updated);
      const isTargetMain = mainImage === oldUrl || targetThumbnailIndex === 0;
      if (isTargetMain) {
        setMainImage(url);
      }
      if (updateProduct && product?.id) {
        updateProduct(
          product.id,
          {
            galleryUrls: updated,
            ...(isTargetMain ? { image: url } : {}),
          },
          storeId
        );
      }
      toast(isAr ? 'تم استبدال الصورة بنجاح' : 'Image replaced successfully', 'success');
    }
    setTargetThumbnailIndex(null);
    e.target.value = '';
  };

  // Instant direct file upload for adding multiple new gallery images (Auto-Optimized to WebP)
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
      if (!mainImage && optimizedUrls[0]) {
        setMainImage(optimizedUrls[0]);
      }
      if (updateProduct && product?.id) {
        updateProduct(
          product.id,
          {
            galleryUrls: updated,
            ...(mainImage ? {} : { image: optimizedUrls[0] }),
          },
          storeId
        );
      }
      toast(isAr ? `تم ضغط وإضافة ${optimizedUrls.length} صور في أجزاء من الثانية` : `Added & optimized ${optimizedUrls.length} images instantly`, 'success');
    } catch {
      const newUrls = files.map((f) => URL.createObjectURL(f));
      const updated = [...gallery, ...newUrls];
      setGallery(updated);
      if (!mainImage && newUrls[0]) {
        setMainImage(newUrls[0]);
      }
      if (updateProduct && product?.id) {
        updateProduct(
          product.id,
          {
            galleryUrls: updated,
            ...(mainImage ? {} : { image: newUrls[0] }),
          },
          storeId
        );
      }
      toast(isAr ? `تمت إضافة ${newUrls.length} صور فوراً` : `Added ${newUrls.length} images instantly`, 'success');
    }
    e.target.value = '';
  };

  // Safe and robust Media Picker selection handler
  const handleMediaSelect = (selected: any) => {
    const extractUrl = (item: any): string => {
      if (!item) return '';
      if (typeof item === 'string') return item;
      return (
        item.optimizedUrl ||
        item.webpUrl ||
        item.originalUrl ||
        item.thumbnailUrl ||
        item.url ||
        item.previewUrl ||
        ''
      );
    };

    if (pickerTarget === 'main') {
      const url = extractUrl(selected);
      if (!url) return;
      setMainImage(url);
      const updatedGallery = [url, ...gallery.filter((u) => u !== url)];
      setGallery(updatedGallery);
      if (updateProduct && product?.id) {
        updateProduct(product.id, { image: url, galleryUrls: updatedGallery }, storeId);
      }
      toast(isAr ? 'تم تغيير الصورة الرئيسية بنجاح' : 'Main image changed successfully', 'success');
    } else if (pickerTarget === 'thumbnail' && targetThumbnailIndex !== null) {
      const url = extractUrl(selected);
      if (!url) return;
      const updated = [...gallery];
      const oldUrl = updated[targetThumbnailIndex];
      updated[targetThumbnailIndex] = url;
      setGallery(updated);
      const isTargetMain = mainImage === oldUrl || targetThumbnailIndex === 0;
      if (isTargetMain) {
        setMainImage(url);
      }
      if (updateProduct && product?.id) {
        updateProduct(
          product.id,
          {
            galleryUrls: updated,
            ...(isTargetMain ? { image: url } : {}),
          },
          storeId
        );
      }
      toast(isAr ? 'تم استبدال الصورة بنجاح' : 'Image replaced successfully', 'success');
      setTargetThumbnailIndex(null);
    } else {
      const items = Array.isArray(selected) ? selected : [selected];
      const urls = items.map(extractUrl).filter(Boolean);
      if (urls.length > 0) {
        const updated = Array.from(new Set([...gallery, ...urls]));
        setGallery(updated);
        if (!mainImage && urls[0]) {
          setMainImage(urls[0]);
        }
        if (updateProduct && product?.id) {
          updateProduct(
            product.id,
            {
              galleryUrls: updated,
              ...(mainImage ? {} : { image: urls[0] }),
            },
            storeId
          );
        }
        toast(isAr ? `تمت إضافة ${urls.length} صور للمعرض` : `Added ${urls.length} images to gallery`, 'success');
      }
    }
    setIsMediaPickerOpen(false);
  };

  const handleRemoveImage = (imgUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = gallery.filter((u) => u !== imgUrl);
    setGallery(updated);
    let nextMain = mainImage;
    if (mainImage === imgUrl) {
      nextMain = updated[0] || '';
      setMainImage(nextMain);
    }
    if (updateProduct && product?.id) {
      updateProduct(product.id, { image: nextMain, galleryUrls: updated }, storeId);
    }
    toast(isAr ? 'تم حذف الصورة' : 'Image removed', 'info');
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast(isAr ? 'يرجى إدخال اسم المنتج' : 'Product name is required', 'error');
      return;
    }

    const updatedData: Partial<Product> = {
      name,
      sku,
      subtitle: shortDescription,
      description: shortDescription,
      category,
      brand,
      badge: badge || undefined,
      tags,
      price: Number(price) || 0,
      discountedPrice: salePrice !== '' ? Number(salePrice) : undefined,
      taxRate: Number(taxRate) || 15,
      stock: Number(stock) || 0,
      stockStatus,
      weightKg: Number(weightKg) || 0.8,
      shippingClass: shippingClass as any,
      image: mainImage || gallery[0] || FALLBACK_PRODUCT_IMAGE,
      galleryUrls: gallery,
      customFields: customFields as any,
      seoTitle,
      seoDescription,
      customUrl,
    };

    onSave(updatedData);
  };

  return (
    <>
      <div className="bg-white dark:bg-[#071E26] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md flex flex-col h-full max-h-[calc(100vh-140px)] sticky top-24 overflow-hidden animate-in fade-in slide-in-from-end-4 duration-150">
        {/* ── Top Header Bar ── */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-900/40 shrink-0">
          <div className="min-w-0">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-1">
              {isAr ? 'تعديل المنتج' : 'Edit Product'} — {name || product.name}
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">
              SKU: {sku || product.sku}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onExpandFullView && (
              <button
                type="button"
                onClick={onExpandFullView}
                title={isAr ? 'توسيع إلى ملء الشاشة' : 'Expand to Full Page'}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 cursor-pointer shadow-2xs"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              title={isAr ? 'إغلاق' : 'Close'}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-rose-600 cursor-pointer shadow-2xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Accordion Sections List (Scrollable Area) ── */}
        <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-3.5">
          {/* 1. Product Images */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
            <div
              onClick={() => toggleAccordion('images')}
              className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {isAr ? 'صور المنتج' : 'Product Images'}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {isAr ? 'أضف صوراً عالية الجودة لعرض منتجك.' : 'Add high-quality images to showcase your product.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => toggleSectionSwitch('images', e)}
                  className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    sectionsEnabled.images ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full bg-white shadow block transition-transform transform ${
                      sectionsEnabled.images ? 'translate-x-3.5 rtl:-translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </button>
                {sectionsOpen.images ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {sectionsOpen.images && sectionsEnabled.images && (
              <div className="p-3.5 pt-0 space-y-3 border-t border-slate-100 dark:border-slate-800/80">
                {/* Hidden File Inputs for Zero-lag Instant Selection */}
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

                {/* Main Image Large Preview */}
                <div className="relative aspect-[4/3] w-full rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center group">
                  <img
                    src={mainImage || FALLBACK_PRODUCT_IMAGE}
                    alt={name}
                    onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                    className="w-full h-full object-contain p-2 transition-transform duration-200 group-hover:scale-102"
                  />
                  
                  {/* Badge */}
                  <span className="absolute top-2.5 start-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/85 text-white shadow-xs">
                    {isAr ? 'الصورة الرئيسية' : 'Main Image'}
                  </span>

                  {/* Top-end actions: Instant replace from device, media library, and delete */}
                  <div className="absolute top-2.5 end-2.5 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => mainFileInputRef.current?.click()}
                      className="px-2 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1 text-[11px] font-bold shadow-xs cursor-pointer transition-colors"
                      title={isAr ? 'تغيير من جهازك فوراً' : 'Upload & replace from device'}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isAr ? 'تغيير' : 'Change'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerTarget('main');
                        setIsMediaPickerOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 hover:text-teal-600 shadow-xs cursor-pointer transition-colors"
                      title={isAr ? 'اختيار من مكتبة الوسائط' : 'Choose from Media Library'}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                    {mainImage && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveImage(mainImage, e)}
                        className="p-1.5 rounded-lg bg-white/95 dark:bg-slate-800/95 text-rose-600 hover:bg-rose-50 shadow-xs cursor-pointer transition-colors"
                        title={isAr ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Quick Bottom Hint */}
                  <div className="absolute bottom-2 start-2 end-2 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/75 text-white backdrop-blur-xs">
                      {isAr ? 'يمكنك استبدال أي صورة بالضغط على أزرار التعديل' : 'You can replace any image instantly using the edit buttons'}
                    </span>
                  </div>
                </div>

                {/* Thumbnails Strip & Multi-Action Per Image */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-0.5">
                    <span>{isAr ? `معرض الصور (${gallery.length})` : `Gallery Images (${gallery.length})`}</span>
                    <span>{isAr ? 'اضغط لتحديد الرئيسية أو استبدل أي صورة' : 'Click to set main or replace any image'}</span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto custom-scroll pb-1 pt-0.5">
                    {gallery.map((imgUrl, idx) => {
                      const isMain = mainImage === imgUrl;
                      return (
                        <div
                          key={idx}
                          className={`group/thumb relative w-16 h-16 rounded-xl border-2 cursor-pointer shrink-0 overflow-hidden p-1 bg-white dark:bg-slate-800 transition-all ${
                            isMain
                              ? 'border-teal-600 ring-2 ring-teal-500/25 shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                          }`}
                          onClick={() => setMainImage(imgUrl)}
                          title={isAr ? 'اضغط لتعيينها كصورة رئيسية' : 'Click to set as main image'}
                        >
                          <img
                            src={imgUrl}
                            alt={`thumb-${idx}`}
                            onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                            className="w-full h-full object-contain"
                          />

                          {/* Main Star Indicator */}
                          {isMain && (
                            <span className="absolute bottom-0.5 start-0.5 px-1 py-0.2 rounded text-[8px] font-bold bg-teal-600 text-white">
                              {isAr ? 'رئيسية' : 'Main'}
                            </span>
                          )}

                          {/* Hover Actions: Replace From Device, Replace From Library, Delete */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col justify-between p-1">
                            <div className="flex items-center justify-between w-full">
                              {/* Replace from Device */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTargetThumbnailIndex(idx);
                                  thumbFileInputRef.current?.click();
                                }}
                                className="p-0.5 rounded bg-teal-600 hover:bg-teal-500 text-white transition-colors cursor-pointer"
                                title={isAr ? 'استبدال من جهازك فوراً' : 'Replace from device'}
                              >
                                <UploadCloud className="w-2.5 h-2.5" />
                              </button>

                              {/* Delete Thumbnail */}
                              <button
                                type="button"
                                onClick={(e) => handleRemoveImage(imgUrl, e)}
                                className="p-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                                title={isAr ? 'حذف هذه الصورة' : 'Delete this image'}
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            <div className="flex items-center justify-center w-full">
                              {/* Replace from Media Library */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPickerTarget('thumbnail');
                                  setTargetThumbnailIndex(idx);
                                  setIsMediaPickerOpen(true);
                                }}
                                className="px-1 py-0.5 rounded bg-white/90 text-slate-800 hover:bg-white text-[8px] font-bold transition-colors cursor-pointer"
                                title={isAr ? 'استبدال من المكتبة' : 'Replace from Library'}
                              >
                                {isAr ? 'تغيير' : 'Change'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Direct Upload from Device Button */}
                    <button
                      type="button"
                      onClick={() => addFilesInputRef.current?.click()}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-teal-500 hover:border-teal-600 hover:bg-teal-50/60 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-300 flex flex-col items-center justify-center shrink-0 cursor-pointer transition-all"
                      title={isAr ? 'رفع صور جديدة من جهازك فوراً' : 'Upload new images from device'}
                    >
                      <UploadCloud className="w-4 h-4 mb-0.5" />
                      <span className="text-[8px] font-bold leading-tight">{isAr ? '+ رفع' : '+ Upload'}</span>
                    </button>

                    {/* Media Library Add Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setPickerTarget('gallery');
                        setIsMediaPickerOpen(true);
                      }}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 flex flex-col items-center justify-center shrink-0 cursor-pointer transition-all"
                      title={isAr ? 'اختيار من مكتبة الوسائط' : 'Choose from Media Library'}
                    >
                      <ImageIcon className="w-4 h-4 mb-0.5" />
                      <span className="text-[8px] font-bold leading-tight">{isAr ? 'المكتبة' : 'Library'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Basic Information */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
            <div
              onClick={() => toggleAccordion('basic')}
              className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {isAr ? 'المعلومات الأساسية' : 'Basic Information'}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {isAr ? 'أدخل التفاصيل الرئيسية لمنتجك.' : 'Enter the main details of your product.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => toggleSectionSwitch('basic', e)}
                  className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    sectionsEnabled.basic ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full bg-white shadow block transition-transform transform ${
                      sectionsEnabled.basic ? 'translate-x-3.5 rtl:-translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </button>
                {sectionsOpen.basic ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {sectionsOpen.basic && sectionsEnabled.basic && (
              <div className="p-3.5 pt-0 space-y-3 border-t border-slate-100 dark:border-slate-800/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold block mb-1 text-slate-700 dark:text-slate-300">
                      {isAr ? 'اسم المنتج' : 'Product Name'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. HiBrew Barista Pro"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold block mb-1 text-slate-700 dark:text-slate-300">
                      SKU <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. HB-H10A-SILVER"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <RichTextEditor
                    label={isAr ? 'الوصف' : 'Description'}
                    value={shortDescription}
                    onChange={setShortDescription}
                    placeholder="Product description..."
                    minHeight={90}
                    isAr={isAr}
                    maxLength={200}
                    showCodeToggle={false}
                  />
                </div>

                {/* Highlight Badge */}
                <div>
                  <label className="text-[11px] font-bold block mb-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'شارة تميز المنتج (Homepage Ribbon)' : 'Product Highlight Ribbon'}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: '', labelAr: 'بدون شارة', labelEn: 'None' },
                      { id: 'trending', labelAr: 'الأكثر رواجاً 🔥', labelEn: 'Top Trending' },
                      { id: 'best_sellers', labelAr: 'الأكثر مبيعاً ⭐', labelEn: 'Best Seller' },
                      { id: 'best_products', labelAr: 'أفضل المنتجات 👑', labelEn: 'Top Product' },
                      { id: 'featured', labelAr: 'منتج مميز ✨', labelEn: 'Featured' },
                      { id: 'new', labelAr: 'وصل حديثاً 🆕', labelEn: 'New Arrival' },
                    ].map((bItem) => {
                      const isSel = badge === bItem.id;
                      return (
                        <button
                          key={bItem.id}
                          type="button"
                          onClick={() => setBadge(bItem.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all text-start flex items-center justify-between cursor-pointer ${
                            isSel
                              ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-300 shadow-xs'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          <span className="truncate">{isAr ? bItem.labelAr : bItem.labelEn}</span>
                          {isSel && <Check className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Occasions & Collections Tags */}
                <div>
                  <label className="text-[11px] font-bold block mb-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'المناسبات والأقسام الموسمية (للفلترة بالصفحة الرئيسية)' : 'Occasions & Collections (Homepage Filters)'}
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: 'trending', labelAr: 'الأكثر رواجاً', labelEn: 'Trending' },
                      { id: 'best_sellers', labelAr: 'الأكثر مبيعاً', labelEn: 'Best Sellers' },
                      { id: 'best_products', labelAr: 'أفضل المنتجات', labelEn: 'Best Products' },
                      { id: 'women', labelAr: 'هدايا نسائية', labelEn: 'Women' },
                      { id: 'valentines', labelAr: 'عيد الحب', labelEn: 'Valentine' },
                      { id: 'eid', labelAr: 'الأعياد', labelEn: 'Eid' },
                      { id: 'birthday', labelAr: 'أعياد ميلاد', labelEn: 'Birthday' },
                      { id: 'luxury', labelAr: 'VIP فاخر', labelEn: 'Luxury VIP' },
                    ].map((tItem) => {
                      const isT = tags.includes(tItem.id);
                      return (
                        <button
                          key={tItem.id}
                          type="button"
                          onClick={() => {
                            if (isT) setTags(tags.filter((t) => t !== tItem.id));
                            else setTags([...tags, tItem.id]);
                          }}
                          className={`px-2 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                            isT
                              ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-300'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <span>{isAr ? tItem.labelAr : tItem.labelEn}</span>
                          {isT && <Check className="w-2.5 h-2.5 text-teal-600 dark:text-teal-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Pricing */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
            <div
              onClick={() => toggleAccordion('pricing')}
              className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {isAr ? 'التسعير' : 'Pricing'}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {isAr ? 'حدد السعر والضريبة لمنتجك.' : 'Set the pricing and tax for your product.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => toggleSectionSwitch('pricing', e)}
                  className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    sectionsEnabled.pricing ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full bg-white shadow block transition-transform transform ${
                      sectionsEnabled.pricing ? 'translate-x-3.5 rtl:-translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </button>
                {sectionsOpen.pricing ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {sectionsOpen.pricing && sectionsEnabled.pricing && (
              <div className="p-3.5 pt-0 grid grid-cols-1 sm:grid-cols-3 gap-2.5 border-t border-slate-100 dark:border-slate-800/80">
                <div>
                  <label className="text-[11px] font-bold block mb-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'السعر الأساسي (SAR)' : 'Regular Price (SAR)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold block mb-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'سعر العرض (SAR)' : 'Sale Price (SAR)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="-"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold block mb-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'نسبة الضريبة' : 'Tax Rate'}
                  </label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value={15}>15% (KSA VAT)</option>
                    <option value={5}>5% (Reduced Tax)</option>
                    <option value={0}>0% (Tax Exempt)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 4. Inventory & Shipping */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
            <div
              onClick={() => toggleAccordion('inventory')}
              className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {isAr ? 'المخزون والشحن' : 'Inventory & Shipping'}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {isAr ? 'إدارة المخزون والوزن وفئات الشحن.' : 'Manage stock, weight and shipping details.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => toggleSectionSwitch('inventory', e)}
                  className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    sectionsEnabled.inventory ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full bg-white shadow block transition-transform transform ${
                      sectionsEnabled.inventory ? 'translate-x-3.5 rtl:-translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </button>
                {sectionsOpen.inventory ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {sectionsOpen.inventory && sectionsEnabled.inventory && (
              <div className="p-3.5 pt-0 space-y-2.5 border-t border-slate-100 dark:border-slate-800/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold block mb-1 text-slate-700 dark:text-slate-300">
                      {isAr ? 'كمية المخزون' : 'Stock Quantity'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stock}
                      onChange={(e) => setStock(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold block mb-1 text-slate-700 dark:text-slate-300">
                      {isAr ? 'حالة المخزون' : 'Stock Status'}
                    </label>
                    <select
                      value={stockStatus}
                      onChange={(e) => setStockStatus(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                    >
                      <option value="In Stock">{isAr ? 'متوفر' : 'In Stock'}</option>
                      <option value="Low Stock">{isAr ? 'مخزون منخفض' : 'Low Stock'}</option>
                      <option value="Out of Stock">{isAr ? 'نفذ المخزون' : 'Out of Stock'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold block mb-1 text-slate-700 dark:text-slate-300">
                      {isAr ? 'الوزن (كجم)' : 'Weight (kg)'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold block mb-1 text-slate-700 dark:text-slate-300">
                      {isAr ? 'فئة الشحن' : 'Shipping Class'}
                    </label>
                    <select
                      value={shippingClass}
                      onChange={(e) => setShippingClass(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                    >
                      <option value="Shoes">Shoes</option>
                      <option value="Small Items">Small Items</option>
                      <option value="Medium Item">Medium Item</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Standard">Standard</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. Product Options & Variations */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
            <div
              onClick={() => toggleAccordion('variations')}
              className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {isAr ? 'خيارات وتنوعات المنتج' : 'Product Options & Variations'}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => toggleSectionSwitch('variations', e)}
                  className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    sectionsEnabled.variations ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full bg-white shadow block transition-transform transform ${
                      sectionsEnabled.variations ? 'translate-x-3.5 rtl:-translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </button>
                {sectionsOpen.variations ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {sectionsOpen.variations && sectionsEnabled.variations && (
              <div className="p-3.5 pt-0 border-t border-slate-100 dark:border-slate-800/80">
                <p className="text-[11px] text-slate-500 mb-2">
                  {isAr ? 'إدارة الألوان والمقاسات والخيارات المتعددة.' : 'Configure sizes, colors, and options for this catalog item.'}
                </p>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {isAr ? 'التنوعات النشطة' : 'Active Variations'}: {Array.isArray((product as any).variations) ? (product as any).variations.length : 0}
                  </span>
                  <button
                    type="button"
                    onClick={onExpandFullView}
                    className="text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer text-xs"
                  >
                    {isAr ? 'إدارة تفصيلية' : 'Manage in Full Editor'} &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 6. Variation Inventory */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
            <div
              onClick={() => toggleAccordion('variationInventory')}
              className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {isAr ? 'مخزون التنوعات' : 'Variation Inventory'}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => toggleSectionSwitch('variationInventory', e)}
                  className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    sectionsEnabled.variationInventory ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full bg-white shadow block transition-transform transform ${
                      sectionsEnabled.variationInventory ? 'translate-x-3.5 rtl:-translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </button>
                {sectionsOpen.variationInventory ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {sectionsOpen.variationInventory && sectionsEnabled.variationInventory && (
              <div className="p-3.5 pt-0 border-t border-slate-100 dark:border-slate-800/80">
                <p className="text-[11px] text-slate-500">
                  {isAr ? 'تتبع المخزون والأسعار الخاصة بكل لون أو مقاس.' : 'Track stock levels and custom prices per SKU variation.'}
                </p>
              </div>
            )}
          </div>

          {/* 7. Custom Fields */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
            <div
              onClick={() => toggleAccordion('customFields')}
              className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {isAr ? 'الحقول المخصصة' : 'Custom Fields'}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => toggleSectionSwitch('customFields', e)}
                  className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    sectionsEnabled.customFields ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full bg-white shadow block transition-transform transform ${
                      sectionsEnabled.customFields ? 'translate-x-3.5 rtl:-translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </button>
                {sectionsOpen.customFields ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {sectionsOpen.customFields && sectionsEnabled.customFields && (
              <div className="p-3.5 pt-0 space-y-2 border-t border-slate-100 dark:border-slate-800/80">
                {customFields.map((f, idx) => (
                  <div key={f.id || idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Field name"
                      value={f.name}
                      onChange={(e) => {
                        const updated = [...customFields];
                        updated[idx].name = e.target.value;
                        setCustomFields(updated);
                      }}
                      className="w-1/2 px-2.5 py-1 text-xs rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={f.value}
                      onChange={(e) => {
                        const updated = [...customFields];
                        updated[idx].value = e.target.value;
                        setCustomFields(updated);
                      }}
                      className="w-1/2 px-2.5 py-1 text-xs rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomFields([...customFields, { id: `cf_${Date.now()}`, name: '', value: '' }])}
                  className="text-xs text-teal-600 font-bold hover:underline flex items-center gap-1 cursor-pointer pt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إضافة حقل جديد' : '+ Add Custom Field'}</span>
                </button>
              </div>
            )}
          </div>

          {/* 8. SEO Settings */}
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
            <div
              onClick={() => toggleAccordion('seo')}
              className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {isAr ? 'إعدادات تحسين محركات البحث (SEO)' : 'SEO Settings'}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => toggleSectionSwitch('seo', e)}
                  className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    sectionsEnabled.seo ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full bg-white shadow block transition-transform transform ${
                      sectionsEnabled.seo ? 'translate-x-3.5 rtl:-translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </button>
                {sectionsOpen.seo ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {sectionsOpen.seo && sectionsEnabled.seo && (
              <div className="p-3.5 pt-0 space-y-2.5 border-t border-slate-100 dark:border-slate-800/80">
                <div>
                  <label className="text-[11px] font-bold block mb-1 text-slate-700 dark:text-slate-300">
                    SEO Meta Title
                  </label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1 text-slate-700 dark:text-slate-300">
                    SEO Meta Description
                  </label>
                  <textarea
                    rows={2}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Fixed Bottom Actions Footer ── */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#071E26] flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0D7482] hover:bg-[#0a5d69] flex items-center gap-2 shadow-xs cursor-pointer transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        multiple={pickerTarget === 'gallery'}
        allowedTypes={['image', 'gif']}
      />
    </>
  );
};
