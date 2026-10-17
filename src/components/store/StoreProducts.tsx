import React, { useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import type { Product } from '../../types';
import { usePrefs } from '../../i18n/PrefsContext';
import { AdminPageShell } from '../common/AdminPageHeader';
import {
  Package,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Save,
  UploadCloud,
  Check,
  TrendingUp,
  TrendingDown,
  X,
  Tag,
  Folder,
  Box,
  Info,
  Globe,
  SlidersHorizontal,
  Layers,
  ShoppingBag,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  ExternalLink,
  ShieldAlert,
  RotateCcw,
  Bookmark,
  AlertTriangle,
  FolderSearch,
  FileSpreadsheet,
  Palette,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useToast } from '../common/ToastProvider';
import { canAddProduct, planInfoForStore } from '../../auth/plans';
import { resolveSubscription } from '../../auth/subscriptions';
import { ProductTypePicker } from './ProductTypePicker';
import { StoreBrandsView, getStoreBrands } from './StoreBrandsView';
import { MediaPickerModal } from '../common/MediaPickerModal';
import { BulkProductUploadModal } from './BulkProductUploadModal';
import { ConnectedWorkspaceBanner } from '../common/ConnectedWorkspaceBanner';
import { WindowedPagination } from '../common/WindowedPagination';
import type { ProductColorOption } from '../../types';
import { SEAT_COLORS, getProductColors } from '../../data/blecoStoreData';
import { getProductDisplayName, getProductDisplayCategory } from '../../utils/storeLocalization';
import { handleImageError, FALLBACK_PRODUCT_IMAGE } from '../../utils/imageFallback';

/**
 * StoreProducts — Store Admin Products & Catalog Directory & Editor
 * 100% Pixel Perfect to Mockup 06 (Products List) and Mockup 07 (Product Edit)
 * Scoped strictly to activeStore.id with plan limits and zero stale state.
 */
export const StoreProducts: React.FC = () => {
  const {
    activeStore,
    currentProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    togglePublishProduct,
  } = useTenant();
  const { t, money, locale, dir } = usePrefs();
  const { toast, confirm } = useToast();
  const isAr = locale === 'ar';

  const planGate = canAddProduct(activeStore, currentProducts.length);
  const planInfo = planInfoForStore(activeStore);
  const sub = resolveSubscription(activeStore.id);

  // Navigation / View State: 'list' | 'edit' | 'type-picker' | 'brands' | 'filters'
  const [currentView, setCurrentView] = useState<'list' | 'edit' | 'type-picker' | 'brands' | 'filters'>('list');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // List View Controls
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Advanced Filters & Deleted Products (Mockup / Screenshot 4)
  const [filterBrand, setFilterBrand] = useState('All');
  const [filterChannel, setFilterChannel] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCat, setFilterCat] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [searchDeleted, setSearchDeleted] = useState('');
  const [selectedDeletedIds, setSelectedDeletedIds] = useState<string[]>([]);
  const [deletedPage, setDeletedPage] = useState(1);
  const [deletedProducts, setDeletedProducts] = useState<any[]>([]);

  // Dynamically load brands for active store
  const [availableStoreBrands, setAvailableStoreBrands] = useState(() => getStoreBrands(activeStore.id));
  React.useEffect(() => {
    setAvailableStoreBrands(getStoreBrands(activeStore.id));
    const handleBrandsUpdate = (e: any) => {
      if (!e.detail || e.detail.storeId === activeStore.id) {
        setAvailableStoreBrands(getStoreBrands(activeStore.id));
      }
    };
    window.addEventListener('unityteck-brands-updated', handleBrandsUpdate);
    return () => window.removeEventListener('unityteck-brands-updated', handleBrandsUpdate);
  }, [activeStore.id]);

  React.useEffect(() => {
    const handleSubView = (e: any) => {
      if (e.detail) {
        setCurrentView(e.detail);
      }
    };
    window.addEventListener('unityteck-product-view', handleSubView);
    return () => window.removeEventListener('unityteck-product-view', handleSubView);
  }, []);

  // Current editing product
  const editingProduct = useMemo(() => {
    if (!editingProductId) return null;
    return currentProducts.find((p) => p.id === editingProductId) || null;
  }, [currentProducts, editingProductId]);

  // ── 4 KPI Summary Cards matching Mockup 06 (Store Scoped) ──
  const kpi = useMemo(() => {
    const total = currentProducts.length;
    const active = currentProducts.filter(
      (p) => (p.status === 'published' || (p as any).status === 'active') && p.stock > 0
    ).length;
    const outOfStock = currentProducts.filter((p) => p.stock === 0).length;
    const draft = currentProducts.filter((p) => p.status === 'draft').length;

    return { total, active, outOfStock, draft };
  }, [currentProducts]);

  // Unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    currentProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [currentProducts]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return currentProducts.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName =
          p.name?.toLowerCase().includes(q) ||
          p.nameAr?.toLowerCase().includes(q) ||
          p.nameEn?.toLowerCase().includes(q) ||
          getProductDisplayName(p, locale).toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        const matchCat =
          p.category?.toLowerCase().includes(q) ||
          p.categoryAr?.toLowerCase().includes(q) ||
          p.categoryEn?.toLowerCase().includes(q) ||
          getProductDisplayCategory(p, locale).toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchCat) return false;
      }
      return true;
    });
  }, [currentProducts, selectedCategory, search, locale]);

  // Pagination
  const totalCount = filteredProducts.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedProducts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, safePage, pageSize]);

  // Checkbox handlers
  const toggleSelectAll = () => {
    if (selectedProductIds.length === pagedProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(pagedProducts.map((p) => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Edit Mode
  const handleOpenEdit = (product: Product) => {
    setEditingProductId(product.id);
    setCurrentView('edit');
  };

  // Open New Product
  // Open Image 4 Product Type Picker
  const handleOpenNewProduct = () => {
    if (!sub.writable) {
      toast(sub.message ?? t('subNotWritable'), 'error');
      return;
    }
    if (!planGate.ok) {
      toast(planGate.message, 'error');
      return;
    }
    setCurrentView('type-picker');
  };

  // Create Product with selected type (from Image 4 -> Image 3)
  const handleCreateProductWithType = (typeTitle: string) => {
    if (!sub.writable) {
      toast(sub.message ?? t('subNotWritable'), 'error');
      return;
    }
    if (!planGate.ok) {
      toast(planGate.message, 'error');
      return;
    }

    const newId = `prod-${Date.now()}`;
    const newProduct: Product = {
      id: newId,
      storeId: activeStore.id,
      name: isAr ? `${typeTitle} جديد` : `New ${typeTitle}`,
      subtitle: isAr ? 'منتج مميز عالي الجودة' : 'Premium catalog item',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: categories[0] || 'Bouquets',
      price: 199,
      discountedPrice: 149,
      costPrice: 85,
      taxRate: 15,
      stock: 25,
      status: 'draft',
      isActive: true,
      isStale: false,
      publishedAt: new Date().toISOString(),
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80',
      ],
      description: isAr
        ? 'يوفر هذا المنتج أعلى معايير الجودة والتصميم العصري مع ضمان شامل وراحة لا مثيل لها.'
        : 'Delivers all-day comfort with a modern aesthetic, crafted with top-tier materials.',
      productType: typeTitle,
      brand: activeStore.name,
      countryOfOrigin: 'Saudi Arabia',
      requiresShipping: typeTitle !== 'Digital Product' && typeTitle !== 'Gift Card',
      trackInventory: true,
      salesCount: 0,
      customUrl: `product-${Date.now().toString().slice(-4)}`,
      seoTitle: isAr ? `${typeTitle} فاخر | ${activeStore.name}` : `New ${typeTitle} | ${activeStore.name}`,
      seoDescription: isAr ? 'تسوق أفضل المنتجات بأفضل الأسعار.' : 'Shop top rated products with fast delivery.',
    };

    addProduct(newProduct, activeStore.id);
    setEditingProductId(newId);
    setCurrentView('edit');
    toast(t('productCreatedSuccess'), 'success');
  };

  // Delete product handler
  const handleDeleteProduct = async (product: Product) => {
    const ok = await confirm({
      title: t('confirmDeleteProductTitle'),
      message: `${t('confirmDeleteProductMsg')} (${product.name})`,
      confirmLabel: t('deleteProduct'),
      danger: true,
    });
    if (ok) {
      setDeletedProducts(prev => [
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          productType: product.productType || 'Physical',
          price: product.price,
          category: product.category,
          deletedAt: new Date().toLocaleString(),
          image: product.image,
        },
        ...prev
      ]);
      deleteProduct(product.id, activeStore.id);
      if (editingProductId === product.id) {
        setCurrentView('list');
        setEditingProductId(null);
      }
      toast(t('productDeletedSuccess'), 'success');
    }
  };

  // Duplicate product handler
  const handleDuplicateProduct = (product: Product) => {
    if (!sub.writable) {
      toast(sub.message ?? t('subNotWritable'), 'error');
      return;
    }
    const dup: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      name: `${product.name} (Copy)`,
      sku: `${product.sku}-COPY`,
      salesCount: 0,
      status: 'draft',
    };
    addProduct(dup, activeStore.id);
    toast(isAr ? 'تم نسخ المنتج بنجاح كمسودة' : 'Product duplicated as draft', 'success');
  };

  const handleBulkImport = (newProducts: Omit<Product, 'id' | 'storeId' | 'publishedAt' | 'isStale'>[]) => {
    newProducts.forEach((p) => {
      addProduct(p, activeStore.id);
    });
  };

  // Status Badge Component
  const getStatusChip = (status: string, stock: number) => {
    if (stock === 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>{t('outOfStock')}</span>
        </span>
      );
    }
    if (status === 'published' || status === 'active') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{t('activeProducts')}</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        <span>{t('draftProducts')}</span>
      </span>
    );
  };

  // ────────────────────────────────────────────────
  //  VIEW 2: 3-COLUMN PRODUCT EDITOR (Mockup 07 Exact)
  // ────────────────────────────────────────────────
  if (currentView === 'edit' && editingProduct) {
    return (
      <StoreProductEditorView
        product={editingProduct}
        storeName={activeStore.name}
        storeSlug={activeStore.slug}
        categories={categories}
        onBack={() => {
          setCurrentView('list');
          setEditingProductId(null);
        }}
        onSave={(updatedData) => {
          updateProduct(editingProduct.id, updatedData, activeStore.id);
          toast(t('productSavedSuccess'), 'success');
        }}
        onDelete={() => handleDeleteProduct(editingProduct)}
      />
    );
  }

  // VIEW 3: PRODUCT TYPE PICKER (Image 4 Exact)
  if (currentView === 'type-picker') {
    return (
      <ProductTypePicker
        onSelectType={(_key, title) => handleCreateProductWithType(title)}
        onBack={() => setCurrentView('list')}
      />
    );
  }

  // VIEW 5: ADVANCED FILTERS & DELETED PRODUCTS (Screenshot 4 Exact)
  if (currentView === 'filters') {
    const pagedDeleted = deletedProducts.filter((p) => {
      if (!searchDeleted.trim()) return true;
      const q = searchDeleted.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    });

    const handleToggleSelectAllDeleted = () => {
      if (selectedDeletedIds.length === pagedDeleted.length) {
        setSelectedDeletedIds([]);
      } else {
        setSelectedDeletedIds(pagedDeleted.map((p) => p.id));
      }
    };

    const handleRestoreItem = (item: any) => {
      if (item.rawProduct) {
        addProduct(item.rawProduct, activeStore.id);
      } else {
        addProduct({
          name: item.name,
          sku: item.sku,
          price: item.price,
          category: item.category,
          productType: item.productType || 'Physical Product',
          stock: 15,
          salesCount: 0,
          status: 'published',
          isActive: true,
          image: item.image,
          galleryUrls: [item.image],
          description: `Restored product: ${item.name}`,
        }, activeStore.id);
      }
      setDeletedProducts((prev) => prev.filter((p) => p.id !== item.id));
      toast(isAr ? 'تم استرجاع المنتج بنجاح' : 'Product restored successfully', 'success');
    };

    const handleRestoreSelected = () => {
      if (selectedDeletedIds.length === 0) return;
      selectedDeletedIds.forEach((delId) => {
        const item = deletedProducts.find((p) => p.id === delId);
        if (item) {
          if (item.rawProduct) {
            addProduct(item.rawProduct, activeStore.id);
          } else {
            addProduct({
              name: item.name,
              sku: item.sku,
              price: item.price,
              category: item.category,
              productType: item.productType || 'Physical Product',
              stock: 15,
              salesCount: 0,
              status: 'published',
              isActive: true,
              image: item.image,
              galleryUrls: [item.image],
              description: `Restored product: ${item.name}`,
            }, activeStore.id);
          }
        }
      });
      setDeletedProducts((prev) => prev.filter((p) => !selectedDeletedIds.includes(p.id)));
      setSelectedDeletedIds([]);
      toast(isAr ? 'تم استرجاع المنتجات المحددة بنجاح' : 'Selected products restored successfully', 'success');
    };

    const handlePermanentDeleteSelected = () => {
      if (selectedDeletedIds.length === 0) return;
      setDeletedProducts((prev) => prev.filter((p) => !selectedDeletedIds.includes(p.id)));
      setSelectedDeletedIds([]);
      toast(isAr ? 'تم الحذف النهائي للمنتجات المحددة' : 'Selected products permanently deleted', 'success');
    };

    return (
      <AdminPageShell className="pb-16 max-w-[1600px] mx-auto space-y-6">
        {/* ── Subnav Tabs Bar ── */}
        <div
          className="flex items-center gap-1.5 p-1.5 rounded-2xl border shadow-xs overflow-x-auto custom-scroll"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <button
            type="button"
            onClick={() => setCurrentView('list')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
            style={{
              background: (currentView as string) === 'list' ? 'var(--active-bg)' : 'transparent',
              color: (currentView as string) === 'list' ? 'var(--active-fg)' : 'var(--text)',
            }}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{isAr ? 'جميع المنتجات' : 'All Products'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('brands')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
            style={{
              background: (currentView as string) === 'brands' ? 'var(--active-bg)' : 'transparent',
              color: (currentView as string) === 'brands' ? 'var(--active-fg)' : 'var(--text)',
            }}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>{isAr ? 'العلامات التجارية والحقول المخصصة' : 'Brands & Custom Fields'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('type-picker')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
            style={{
              background: (currentView as string) === 'type-picker' ? 'var(--active-bg)' : 'transparent',
              color: (currentView as string) === 'type-picker' ? 'var(--active-fg)' : 'var(--text)',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'اختيار نوع المنتج' : 'Choose Product Type (8 Types)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('filters')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
            style={{
              background: currentView === 'filters' ? 'var(--active-bg)' : 'transparent',
              color: currentView === 'filters' ? 'var(--active-fg)' : 'var(--text)',
            }}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isAr ? 'الفلاتر والمنتجات المحذوفة' : 'Filters & Deleted Products'}</span>
          </button>
        </div>

        {/* ── Breadcrumb & Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <button
                type="button"
                onClick={() => setCurrentView('list')}
                className="hover:underline flex items-center gap-1 text-blue-600 font-bold cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>Products</span>
              </button>
              <span>&gt;</span>
              <span className="font-bold text-slate-800">Filters</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Filters
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter your products and save filters for quick access.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => toast('Saved filter preset template created', 'info')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 text-slate-500" />
              <span>Saved Filters</span>
            </button>
            <button
              type="button"
              onClick={() => toast('Create custom filter preset modal opened', 'info')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Filter</span>
            </button>
          </div>
        </div>

        {/* ── CARD 1: Filter Products ── */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Filter Products
                </h3>
                <p className="text-[11px] text-slate-500">
                  Use the filters below to find specific products in your store.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setFilterBrand('All');
                  setFilterChannel('All');
                  setFilterStatus('All');
                  setFilterCat('All');
                  setFilterType('All');
                  toast('Filters cleared', 'info');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Clear All</span>
              </button>
              <button
                type="button"
                onClick={() => toast('Filters applied to catalog', 'success')}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Apply Filters</span>
              </button>
            </div>
          </div>

          {/* Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
            {/* Search Products */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Search Products</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by product name, SKU, or keywords..."
                  className="w-full ps-9 pe-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {isAr ? 'العلامة التجارية' : 'Brand'}
              </label>
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
              >
                <option value="All">{isAr ? 'جميع العلامات التجارية' : 'All Brands'}</option>
                {availableStoreBrands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Channels */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Product Channels</label>
              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
              >
                <option value="All">All Channels</option>
                <option value="Online Store">Online Storefront</option>
                <option value="POS">Point of Sale (POS)</option>
                <option value="Instagram">Instagram Shopping</option>
              </select>
            </div>

            {/* Product Status */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Product Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Luxury Hand Bouquets">Luxury Hand Bouquets</option>
                <option value="Luxury Vases">Luxury Vases</option>
                <option value="Haram & Hotel Gifts">Haram & Hotel Gifts</option>
                <option value="Seasonal Specials">Seasonal Specials</option>
                <option value="Chocolates & Flowers">Chocolates & Flowers</option>
                <option value="Bridal Bouquets">Bridal Bouquets</option>
              </select>
            </div>

            {/* Product Type */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Product Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
              >
                <option value="All">All Product Types</option>
                <option value="Physical Product">Physical Product (Ready Delivery)</option>
                <option value="Custom Service">Custom Service (Bouquet Styling)</option>
                <option value="Digital Product">Digital Gift Voucher</option>
                <option value="Product Bundle">Luxury Combo Bundle</option>
              </select>
            </div>
          </div>

          {/* Saved Filters Chips Row */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 me-2">
              <Bookmark className="w-3.5 h-3.5 text-slate-400" />
              <span>Saved Filters:</span>
            </div>
            <button
              type="button"
              onClick={() => toast('Filter preset: Low Stock applied', 'info')}
              className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Low Stock
            </button>
            <button
              type="button"
              onClick={() => toast('Filter preset: Out of Stock applied', 'info')}
              className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              Out of Stock
            </button>
            <button
              type="button"
              onClick={() => toast('Filter preset: Luxury Flowers applied', 'info')}
              className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
            >
              Luxury Flowers
            </button>
            <button
              type="button"
              onClick={() => toast('Filter preset: Active Products applied', 'info')}
              className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Active Products
            </button>
            <button
              type="button"
              onClick={() => toast('Current filter saved to favorites', 'success')}
              className="px-3 py-1 rounded-full text-xs font-bold border border-dashed border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              + Save Current Filter
            </button>
          </div>
        </div>

        {/* ── CARD 2: Deleted Products ── */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Deleted Products
                </h3>
                <p className="text-[11px] text-slate-500">
                  View and restore products that have been deleted from your store.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search deleted products..."
                  value={searchDeleted}
                  onChange={(e) => setSearchDeleted(e.target.value)}
                  className="ps-8 pe-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handlePermanentDeleteSelected}
                disabled={selectedDeletedIds.length === 0}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:border-rose-300 hover:text-rose-600 disabled:opacity-40 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanent Delete</span>
              </button>

              <button
                type="button"
                onClick={handleRestoreSelected}
                disabled={selectedDeletedIds.length === 0}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Selected</span>
              </button>
            </div>
          </div>

          {/* Deleted Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px] bg-slate-50/50">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={pagedDeleted.length > 0 && selectedDeletedIds.length === pagedDeleted.length}
                      onChange={handleToggleSelectAllDeleted}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 font-semibold">Product</th>
                  <th className="py-3 px-3 font-semibold">Type</th>
                  <th className="py-3 px-3 font-semibold">Price</th>
                  <th className="py-3 px-3 font-semibold">Category</th>
                  <th className="py-3 px-3 font-semibold">Deleted At</th>
                  <th className="py-3 px-4 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pagedDeleted.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                      No deleted products found in trash.
                    </td>
                  </tr>
                ) : (
                  pagedDeleted.map((item) => {
                    const isChecked = selectedDeletedIds.includes(item.id);
                    return (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedDeletedIds((prev) =>
                                prev.includes(item.id) ? prev.filter((i) => i !== item.id) : [...prev, item.id]
                              );
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-slate-400" />
                              </span>
                            )}
                            <div>
                              <div className="font-bold text-slate-900">{item.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-600">{item.productType}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 tabular-nums">
                          {money(item.price)}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-600">{item.category}</td>
                        <td className="py-3 px-3 text-[11px] font-mono text-slate-500">{item.deletedAt}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRestoreItem(item)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Restore</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => toast(`Options for ${item.name}`, 'info')}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4" />
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

          {/* Table Bottom Pagination */}
          <div className="p-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Show 10 entries</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Showing 1 – {pagedDeleted.length} of {deletedProducts.length} deleted products</span>
              <button
                type="button"
                className="w-6 h-6 rounded bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs"
              >
                1
              </button>
            </div>
          </div>
        </div>
      </AdminPageShell>
    );
  }

  // ────────────────────────────────────────────────
  //  VIEW 1: PRODUCTS LIST DIRECTORY (Mockup 06 Exact)
  // ────────────────────────────────────────────────
  return (
    <AdminPageShell className="pb-16 max-w-[1600px] mx-auto space-y-5">
      {/* ── SUBNAV TABS: All Products · Add Product (Types) · Brands & Custom Fields ── */}
      <div
        className="flex items-center gap-1.5 p-1.5 rounded-2xl border shadow-xs overflow-x-auto custom-scroll"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <button
          type="button"
          onClick={() => setCurrentView('list')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
          style={{
            background: currentView === 'list' ? 'var(--active-bg)' : 'transparent',
            color: currentView === 'list' ? 'var(--active-fg)' : 'var(--text)',
          }}
        >
          <Package className="w-3.5 h-3.5" />
          <span>{isAr ? 'جميع المنتجات' : 'All Products'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('brands')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
          style={{
            background: currentView === 'brands' ? 'var(--active-bg)' : 'transparent',
            color: currentView === 'brands' ? 'var(--active-fg)' : 'var(--text)',
          }}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>{isAr ? 'العلامات التجارية والحقول المخصصة' : 'Brands & Custom Fields'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('type-picker')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
          style={{
            background: (currentView as string) === 'type-picker' ? 'var(--active-bg)' : 'transparent',
            color: (currentView as string) === 'type-picker' ? 'var(--active-fg)' : 'var(--text)',
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAr ? 'اختيار نوع المنتج' : 'Choose Product Type (8 Types)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('filters')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
          style={{
            background: (currentView as string) === 'filters' ? 'var(--active-bg)' : 'transparent',
            color: (currentView as string) === 'filters' ? 'var(--active-fg)' : 'var(--text)',
          }}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>{isAr ? 'الفلاتر والمنتجات المحذوفة' : 'Filters & Deleted Products'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowBulkModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{isAr ? 'رفع بالجملة (Google Sheets / CSV)' : 'Bulk Upload (Google Sheet/CSV)'}</span>
        </button>
      </div>

      {/* ── Connected Local Project Workspace Banner ── */}
      <ConnectedWorkspaceBanner page="products" />

      {/* ── TOP HEADER — Title & Subtitle + Search + Filters + Add Product Button ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight" style={{ color: 'var(--text)' }}>
            {t('productsTitle')}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            {t('productsSubtitle')} · <strong style={{ color: 'var(--text)' }}>{(isAr ? activeStore.nameAr : activeStore.nameEn) || activeStore.name}</strong>
          </p>
        </div>

        {/* Action Controls on the Right */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Plan Limit Info Pill */}
          <div className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            {planInfo.name}: {currentProducts.length} / {planInfo.productLimit === Infinity ? '∞' : planInfo.productLimit}
          </div>

          {/* Search Input matching mockup 06 */}
          <div className="relative min-w-[220px] sm:min-w-[280px]">
            <Search
              className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--muted)' }}
            />
            <input
              type="text"
              placeholder={t('searchProductsPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full ps-10 pe-4 py-2 text-xs rounded-xl border focus:outline-none transition-shadow"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            style={{
              background: showFilterDrawer ? 'var(--hover-bg)' : 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('filterLabel')}</span>
          </button>

          {/* Bulk Upload Google Sheet / CSV Button */}
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-2 shadow-xs cursor-pointer transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shrink-0 bg-white dark:bg-slate-900"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{isAr ? 'رفع بالجملة (50+)' : 'Bulk Upload (50+)'}</span>
          </button>

          {/* + Add Product Primary CTA Button */}
          <button
            type="button"
            onClick={handleOpenNewProduct}
            className="px-4 py-2 text-xs font-bold text-white rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all hover:opacity-95 shrink-0"
            style={{ background: 'var(--portal-cta, #0284c7)' }}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{t('addProduct')}</span>
          </button>
        </div>
      </div>

      {/* ── EXPANDABLE CATEGORY FILTER BAR ── */}
      {showFilterDrawer && (
        <div className="bg-white dark:bg-[#071E26] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3 flex-wrap text-xs animate-in fade-in duration-100">
          <span className="font-bold text-slate-500">{t('categoryLabel')}:</span>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-400'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {isAr ? 'الكل' : 'All'}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-400'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {getProductDisplayCategory(cat, locale)}
            </button>
          ))}
          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="text-rose-500 font-bold hover:underline ms-auto cursor-pointer"
            >
              {isAr ? 'إعادة ضبط' : 'Reset'}
            </button>
          )}
        </div>
      )}

      {/* ── 4 KPI CARDS DEDICATED GRID (Mockup 06 - Soft Pastel Tints & High Contrast) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Products (Soft Blue) */}
        <div className="bg-blue-50/70 hover:bg-blue-50/90 dark:bg-blue-950/30 p-5 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 shadow-2xs flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-blue-200">
              {t('totalProductsCard')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {kpi.total.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5 bg-emerald-100/70 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>12%</span>
            </span>
          </div>
        </div>

        {/* Card 2: Active (Soft Emerald) */}
        <div className="bg-emerald-50/70 hover:bg-emerald-50/90 dark:bg-emerald-950/30 p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-emerald-200">
              {t('activeProducts')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {kpi.active.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5 bg-emerald-100/70 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>8%</span>
            </span>
          </div>
        </div>

        {/* Card 3: Out of Stock (Soft Rose) */}
        <div className="bg-rose-50/70 hover:bg-rose-50/90 dark:bg-rose-950/30 p-5 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 shadow-2xs flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-rose-200">
              {t('outOfStock')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {kpi.outOfStock.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-0.5 bg-rose-100/70 dark:bg-rose-950/50 px-2 py-0.5 rounded-md">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>2%</span>
            </span>
          </div>
        </div>

        {/* Card 4: Draft (Soft Purple) */}
        <div className="bg-purple-50/70 hover:bg-purple-50/90 dark:bg-purple-950/30 p-5 rounded-2xl border border-purple-200/80 dark:border-purple-900/40 shadow-2xs flex flex-col justify-between transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-purple-200">
              {t('draftProducts')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {kpi.draft.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950/50 px-2 py-0.5 rounded-md">
              {isAr ? 'مسودات' : 'Draft'}
            </span>
          </div>
        </div>
      </div>

      {/* ── PRODUCTS TABLE CARD CONTAINER (Mockup 06) ── */}
      <div className="bg-white dark:bg-[#071E26] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-separate border-spacing-0">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                <th className="py-4 px-4 w-10 text-start" style={{ borderBottom: '1px solid var(--border)' }}>
                  <input
                    type="checkbox"
                    checked={pagedProducts.length > 0 && selectedProductIds.length === pagedProducts.length}
                    onChange={toggleSelectAll}
                    className="rounded cursor-pointer"
                  />
                </th>
                <th className="py-4 px-3 text-start font-bold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {t('product')}
                </th>
                <th className="py-4 px-3 text-start font-bold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {t('categoryLabel')}
                </th>
                <th className="py-4 px-3 text-start font-bold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {isAr ? 'السعر (ر.س)' : 'Price (SAR)'}
                </th>
                <th className="py-4 px-3 text-start font-bold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {t('stockCount')}
                </th>
                <th className="py-4 px-3 text-start font-bold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {isAr ? 'الحالة' : 'Status'}
                </th>
                <th className="py-4 px-3 text-start font-bold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {t('salesCount')}
                </th>
                <th className="py-4 px-4 text-center font-bold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {isAr ? 'إجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'لا توجد منتجات مطابقة لخيارات البحث.' : 'No products found matching your criteria.'}
                  </td>
                </tr>
              ) : (
                pagedProducts.map((prod) => {
                  const isChecked = selectedProductIds.includes(prod.id);
                  return (
                    <tr
                      key={prod.id}
                      className="border-b hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4" style={{ borderBottom: '1px solid var(--border)' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectProduct(prod.id)}
                          className="rounded cursor-pointer"
                        />
                      </td>

                      {/* Product Thumbnail + Name + SKU */}
                      <td className="py-3.5 px-3" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.image || FALLBACK_PRODUCT_IMAGE}
                            alt={getProductDisplayName(prod, locale)}
                            onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                            className="w-11 h-11 rounded-xl object-cover border shrink-0 bg-slate-100 dark:bg-slate-800"
                            style={{ borderColor: 'var(--border)' }}
                          />
                          <div className="min-w-0">
                            <span
                              onClick={() => handleOpenEdit(prod)}
                              className="font-bold block truncate max-w-[220px] cursor-pointer hover:underline"
                              style={{ color: 'var(--text)' }}
                            >
                              {getProductDisplayName(prod, locale)}
                            </span>
                            <span className="text-[11px] font-mono block text-slate-400">
                              SKU: {prod.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-medium" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                        {getProductDisplayCategory(prod, locale)}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-bold" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                        {money(prod.price)}
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-medium" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                        {prod.stock}
                      </td>

                      {/* Status Chip */}
                      <td className="py-3.5 px-3 whitespace-nowrap" style={{ borderBottom: '1px solid var(--border)' }}>
                        {getStatusChip(prod.status, prod.stock)}
                      </td>

                      {/* Sales Count */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-medium font-mono" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                        {(prod.salesCount ?? (prod.price > 100 ? 1200 : 450)).toLocaleString()}
                      </td>

                      {/* Actions: Eye & Popover */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap relative" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-xs transition-colors"
                            style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}
                            title="Edit Product"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveActionMenuId(activeActionMenuId === prod.id ? null : prod.id)}
                              className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-xs transition-colors"
                              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                              title="More Options"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Action Popover */}
                            {activeActionMenuId === prod.id && (
                              <div
                                className="absolute end-0 top-8 z-50 w-44 rounded-xl border p-1 shadow-lg text-xs font-semibold animate-in fade-in duration-100"
                                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleOpenEdit(prod);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5 text-blue-500" />
                                  <span>{t('editProduct')}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDuplicateProduct(prod);
                                    setActiveActionMenuId(null);
                                  }}
                                  className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{isAr ? 'نسخ المنتج' : 'Duplicate Product'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    togglePublishProduct(prod.id);
                                    setActiveActionMenuId(null);
                                    toast(isAr ? 'تم تغيير حالة نشر المنتج' : 'Product status updated', 'success');
                                  }}
                                  className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>{isAr ? 'تبديل النشر' : 'Toggle Status'}</span>
                                </button>
                                <div className="h-[1px] my-1" style={{ background: 'var(--border)' }} />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    handleDeleteProduct(prod);
                                  }}
                                  className="w-full text-start px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>{t('deleteProduct')}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION CONTROLS MATCHING MOCKUP 06 ── */}
        <WindowedPagination
          currentPage={safePage}
          totalPages={pageCount}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          isAr={isAr}
          itemLabel={isAr ? 'منتج' : 'products'}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>

      {/* ── BULK PRODUCT UPLOAD & EXPORT MODAL ── */}
      <BulkProductUploadModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onImportProducts={handleBulkImport}
        currentProducts={currentProducts}
        storeName={activeStore.name}
      />
    </AdminPageShell>
  );
};

/**
 * ────────────────────────────────────────────────
 *  3-COLUMN STORE PRODUCT EDITOR (Mockup 07 Pixel Perfect)
 * ────────────────────────────────────────────────
 */
interface StoreProductEditorViewProps {
  product: Product;
  storeName: string;
  storeSlug?: string;
  categories: string[];
  onBack: () => void;
  onSave: (updatedData: Partial<Product>) => void;
  onDelete: () => void;
}

const StoreProductEditorView: React.FC<StoreProductEditorViewProps> = ({
  product,
  storeName,
  storeSlug,
  categories,
  onBack,
  onSave,
  onDelete,
}) => {
  const { t, locale, currency, money } = usePrefs();
  const isAr = locale === 'ar';

  // Form State initialized from product
  const [name, setName] = useState(product.name || '');
  const [subtitle, setSubtitle] = useState(product.subtitle || '');
  const [description, setDescription] = useState(product.description || '');
  const [productType, setProductType] = useState(product.productType || 'Physical Product');
  const [brand, setBrand] = useState(product.brand || storeName);
  const [category, setCategory] = useState(product.category || 'Bouquets');

  // Inventory & Shipping
  const [stock, setStock] = useState(product.stock ?? 25);
  const [sku, setSku] = useState(product.sku || 'SKU-001');
  const [weightKg, setWeightKg] = useState(product.weightKg ?? 1.5);
  const [countryOfOrigin, setCountryOfOrigin] = useState(product.countryOfOrigin || 'Saudi Arabia');
  const [requiresShipping, setRequiresShipping] = useState(product.requiresShipping !== false);
  const [trackInventory, setTrackInventory] = useState(product.trackInventory !== false);

  // Pricing
  const [price, setPrice] = useState(product.price ?? 199);
  const [discountedPrice, setDiscountedPrice] = useState(product.discountedPrice ?? 149);
  const [costPrice, setCostPrice] = useState(product.costPrice ?? 85);
  const [taxRate, setTaxRate] = useState(product.taxRate ?? 15);

  // SEO Settings
  const [pageTitle, setPageTitle] = useState(
    product.seoTitle || `${name} | ${storeName}`
  );
  const [customUrl, setCustomUrl] = useState(product.customUrl || 'product-item');
  const [seoDescription, setSeoDescription] = useState(
    product.seoDescription ||
      'Experience premium quality, fresh selection and guaranteed satisfaction.'
  );

  // Gallery images
  const [gallery, setGallery] = useState<string[]>(
    product.galleryUrls && product.galleryUrls.length > 0
      ? product.galleryUrls
      : product.additionalImages && product.additionalImages.length > 0
        ? [product.image, ...product.additionalImages].filter(Boolean)
        : [
            product.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=600&q=80',
          ]
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'main' | 'gallery' | 'color' | 'comparison'>('gallery');
  const [colorPickerTargetIdx, setColorPickerTargetIdx] = useState<number | null>(null);
  const [showAiColorPopover, setShowAiColorPopover] = useState(false);

  // Specifications & Model Comparison Infographic Image (per product)
  const [specComparisonImage, setSpecComparisonImage] = useState(product.specComparisonImage || '');
  const [specComparisonImageAr, setSpecComparisonImageAr] = useState(product.specComparisonImageAr || '');

  // Dynamic Product Colors (3 by default, expandable/editable by admin with AI assistant)
  const [colors, setColors] = useState<ProductColorOption[]>(() => {
    if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
      return product.colors;
    }
    return getProductColors(product);
  });

  const handleSelectMedia = (selected: any) => {
    const assets = Array.isArray(selected) ? selected : [selected];
    const newUrls = assets.map((a: any) => a.optimizedUrl || a.webpUrl || a.originalUrl).filter(Boolean);
    if (newUrls.length === 0) return;
    if (pickerMode === 'main') {
      const copy = [...gallery];
      copy[selectedImageIndex] = newUrls[0];
      setGallery(copy);
    } else if (pickerMode === 'gallery') {
      setGallery((prev) => [...prev, ...newUrls]);
      setSelectedImageIndex(gallery.length);
    } else if (pickerMode === 'color' && colorPickerTargetIdx !== null) {
      const updated = [...colors];
      if (updated[colorPickerTargetIdx]) {
        updated[colorPickerTargetIdx] = {
          ...updated[colorPickerTargetIdx],
          image: newUrls[0]
        };
        setColors(updated);
      }
      setColorPickerTargetIdx(null);
    } else if (pickerMode === 'comparison') {
      setSpecComparisonImage(newUrls[0]);
    }
  };

  // Profit calculation
  const calculatedProfit = useMemo(() => {
    const effPrice = discountedPrice > 0 ? discountedPrice : price;
    return Math.max(0, effPrice - costPrice);
  }, [price, discountedPrice, costPrice]);

  // AI Smart Automotive Seat Palettes
  const AI_SEAT_PALETTES = [
    {
      id: 'oem_triad',
      titleAr: 'طقم الوكالة الثلاثي المعتمد (3 ألوان)',
      titleEn: 'Triple OEM Certified Palette (3 Colors)',
      descAr: 'بيج وكالة، جملي رويال، رمادي ألماني',
      colors: [
        {
          id: 'beige',
          nameAr: 'بيج وكالة',
          nameEn: 'OEM Beige',
          hex: '#d8c8b4',
          image: 'https://cdn.salla.sa/wYYVD/abf29eff-f124-4ceb-80f1-dca55d161546-750x1000-oUBcGKNNeCBsZcKewMV0170NkVrlqXwTYbVPQRMn.jpg',
        },
        {
          id: 'camel',
          nameAr: 'جملي رويال',
          nameEn: 'Royal Camel',
          hex: '#b87b44',
          image: 'https://cdn.salla.sa/wYYVD/cVdD2fv4M7tFxKEr2Qolzcq9zgQXE4UhGUEOuvAF.png',
        },
        {
          id: 'grey',
          nameAr: 'رمادي ألماني',
          nameEn: 'German Grey',
          hex: '#7e848d',
          image: 'https://cdn.salla.sa/wYYVD/zYsjiTRpFRCgzbPdxlwaBsYZhpPR5oUFlr9EmDov.png',
        },
      ]
    },
    {
      id: 'vip_luxury',
      titleAr: 'طقم VIP كبار الشخصيات (3 ألوان)',
      titleEn: 'VIP Luxury Interior Palette (3 Colors)',
      descAr: 'أسود ملكي، عنابي فاخر، جملي رويال',
      colors: [
        {
          id: 'black',
          nameAr: 'أسود ملكي',
          nameEn: 'Royal Black',
          hex: '#1e2124',
          image: 'https://cdn.salla.sa/wYYVD/eb50919f-da35-472e-820f-1319588bde31-750x1000-u2z52ESAtM9kL2R62p0rVycVUA7RhJQe4jwOsVtR.jpg',
        },
        {
          id: 'maroon',
          nameAr: 'عنابي فاخر',
          nameEn: 'Luxury Maroon',
          hex: '#641525',
          image: 'https://cdn.salla.sa/wYYVD/mxvpwbKs7HgjOvroP6zPnwVB6cO56TkZrasW0GPv.png',
        },
        {
          id: 'camel',
          nameAr: 'جملي رويال',
          nameEn: 'Royal Camel',
          hex: '#b87b44',
          image: 'https://cdn.salla.sa/wYYVD/cVdD2fv4M7tFxKEr2Qolzcq9zgQXE4UhGUEOuvAF.png',
        },
      ]
    },
    {
      id: 'sport_cruise',
      titleAr: 'طقم سبورت وأناقة عصرية (3 ألوان)',
      titleEn: 'Modern Sport Cruise (3 Colors)',
      descAr: 'كحلي داكن، رمادي ألماني، أسود ملكي',
      colors: [
        {
          id: 'navy',
          nameAr: 'كحلي داكن',
          nameEn: 'Navy Blue',
          hex: '#18273d',
          image: 'https://cdn.salla.sa/wYYVD/533e5580-b807-4d5d-8cdc-c88113841be2-750x1000-cusHPAMBUcXmtMSKkL7sqO6fPXmDqp4Vw5NtTOAy.jpg',
        },
        {
          id: 'grey',
          nameAr: 'رمادي ألماني',
          nameEn: 'German Grey',
          hex: '#7e848d',
          image: 'https://cdn.salla.sa/wYYVD/zYsjiTRpFRCgzbPdxlwaBsYZhpPR5oUFlr9EmDov.png',
        },
        {
          id: 'black',
          nameAr: 'أسود ملكي',
          nameEn: 'Royal Black',
          hex: '#1e2124',
          image: 'https://cdn.salla.sa/wYYVD/eb50919f-da35-472e-820f-1319588bde31-750x1000-u2z52ESAtM9kL2R62p0rVycVUA7RhJQe4jwOsVtR.jpg',
        },
      ]
    },
    {
      id: 'desert_safari',
      titleAr: 'طقم صحراوي وسفاري (3 ألوان)',
      titleEn: 'Desert & Safari Edition (3 Colors)',
      descAr: 'زيتوني صحراوي، بيج وكالة، جملي رويال',
      colors: [
        {
          id: 'olive',
          nameAr: 'زيتوني صحراوي',
          nameEn: 'Desert Olive',
          hex: '#556b2f',
          image: 'https://cdn.salla.sa/wYYVD/Upqo30iNth6s16xuqENbWsTXwgkffli1i49LHjHs.png',
        },
        {
          id: 'beige',
          nameAr: 'بيج وكالة',
          nameEn: 'OEM Beige',
          hex: '#d8c8b4',
          image: 'https://cdn.salla.sa/wYYVD/abf29eff-f124-4ceb-80f1-dca55d161546-750x1000-oUBcGKNNeCBsZcKewMV0170NkVrlqXwTYbVPQRMn.jpg',
        },
        {
          id: 'camel',
          nameAr: 'جملي رويال',
          nameEn: 'Royal Camel',
          hex: '#b87b44',
          image: 'https://cdn.salla.sa/wYYVD/cVdD2fv4M7tFxKEr2Qolzcq9zgQXE4UhGUEOuvAF.png',
        },
      ]
    }
  ];

  const handleApplyAiPalette = (pal: typeof AI_SEAT_PALETTES[0]) => {
    setColors(pal.colors);
    setShowAiColorPopover(false);
  };

  const handleSmartAiAutoSuggest = () => {
    const text = (name + ' ' + (brand || '') + ' ' + (description || '')).toLowerCase();
    let selectedPalette = AI_SEAT_PALETTES[0]; // default OEM
    if (text.includes('يوكن') || text.includes('yukon') || text.includes('لاندكروزر') || text.includes('land cruiser') || text.includes('safari') || text.includes('باترول')) {
      selectedPalette = AI_SEAT_PALETTES[3]; // Desert
    } else if (text.includes('vip') || text.includes('لكزس') || text.includes('lexus') || text.includes('فاخر')) {
      selectedPalette = AI_SEAT_PALETTES[1]; // VIP
    } else if (text.includes('سبورت') || text.includes('sport') || text.includes('كحلي') || text.includes('تورس')) {
      selectedPalette = AI_SEAT_PALETTES[2]; // Sport
    }
    setColors(selectedPalette.colors);
    setShowAiColorPopover(false);
  };

  const handleAddColor = () => {
    const newIdx = colors.length + 1;
    const defaultAvailable = SEAT_COLORS.find(sc => !colors.some(c => c.id === sc.id)) || {
      id: `custom-color-${Date.now()}`,
      nameAr: `لون إضافي ${newIdx}`,
      nameEn: `Custom Color ${newIdx}`,
      hex: '#3e0f77',
      image: gallery[0] || 'https://cdn.salla.sa/wYYVD/cVdD2fv4M7tFxKEr2Qolzcq9zgQXE4UhGUEOuvAF.png',
    };
    setColors([...colors, {
      id: defaultAvailable.id,
      nameAr: defaultAvailable.nameAr,
      nameEn: defaultAvailable.nameEn,
      hex: defaultAvailable.hex,
      image: defaultAvailable.image,
    }]);
  };

  const handleRemoveColor = (idx: number) => {
    if (colors.length <= 1) return;
    setColors(colors.filter((_, i) => i !== idx));
  };

  const handleUpdateColor = (idx: number, patch: Partial<ProductColorOption>) => {
    setColors(colors.map((c, i) => i === idx ? { ...c, ...patch } : c));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSave({
      name,
      subtitle,
      description,
      productType,
      brand,
      category,
      stock: Number(stock),
      sku,
      weightKg: Number(weightKg),
      countryOfOrigin,
      requiresShipping,
      trackInventory,
      price: Number(price),
      discountedPrice: Number(discountedPrice),
      costPrice: Number(costPrice),
      taxRate: Number(taxRate),
      image: gallery[selectedImageIndex] || gallery[0],
      galleryUrls: gallery,
      additionalImages: gallery.slice(1),
      seoTitle: pageTitle,
      customUrl,
      seoDescription,
      colors,
      specComparisonImage,
      specComparisonImageAr,
    });
    if (typeof window !== 'undefined' && product.id) {
      if (specComparisonImage) {
        localStorage.setItem(`unityteck_coffee_spec_img_${product.id}`, specComparisonImage);
      } else {
        localStorage.removeItem(`unityteck_coffee_spec_img_${product.id}`);
      }
    }
  };

  return (
    <AdminPageShell className="pb-16 max-w-[1600px] mx-auto space-y-5">
      {/* ── BREADCRUMBS & TOP HEADER ROW ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Breadcrumbs matching mockup 07: < Products > Edit Product */}
          <div className="flex items-center gap-2 text-xs mb-1 font-semibold" style={{ color: 'var(--muted)' }}>
            <button
              type="button"
              onClick={onBack}
              className="hover:underline flex items-center gap-1 cursor-pointer transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{t('productsTitle')}</span>
            </button>
            <span>/</span>
            <span className="font-bold" style={{ color: 'var(--text)' }}>
              {t('editProduct')}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
            {t('editProduct')}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            {isAr ? `حدّث معلومات المنتج، الصور، التسعير، وإعدادات السيو لمتجر ${storeName}.` : `Update your product information, images, pricing, and more for ${storeName}.`}
          </p>
        </div>

        {/* Action buttons matching mockup 07 (View, Delete, Save) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => window.open(gallery[selectedImageIndex] || '#', '_blank')}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>{t('viewProduct')}</span>
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-rose-200 text-rose-600 bg-rose-50/60 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400 flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-rose-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('deleteProduct')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit()}
            className="px-5 py-2 text-xs font-bold text-white rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all hover:opacity-95"
            style={{ background: 'var(--portal-cta, #0284c7)' }}
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>{t('saveChanges')}</span>
          </button>
        </div>
      </div>

      {/* ── 3-COLUMN LAYOUT MATCHING MOCKUP 07 ── */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── COLUMN 1: PRODUCT IMAGES (approx 3 cols / 26% width) ── */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Box className="w-4 h-4 text-cyan-600" />
                <span>{t('productImages')}</span>
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                {t('productImagesSub')}
              </p>
            </div>

            {/* Main Image Box */}
            <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-900/50 aspect-square flex items-center justify-center">
              <span className="absolute top-3 start-3 px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-600 text-white z-10 shadow-xs">
                {t('mainImage')}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (gallery.length > 1) {
                    const next = gallery.filter((_, idx) => idx !== selectedImageIndex);
                    setGallery(next);
                    setSelectedImageIndex(0);
                  }
                }}
                className="absolute top-3 end-3 p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 z-10 cursor-pointer shadow-xs"
                title="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setPickerMode('main');
                  setIsMediaPickerOpen(true);
                }}
                className="absolute bottom-3 end-3 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 text-white text-[10px] font-bold z-10 cursor-pointer shadow-xs flex items-center gap-1 backdrop-blur-xs"
                title={isAr ? 'تغيير الصورة من مكتبة الوسائط' : 'Change image from Media Library'}
              >
                <FolderSearch className="w-3 h-3" />
                <span>{isAr ? 'تغيير' : 'Change'}</span>
              </button>
              <img
                src={gallery[selectedImageIndex] || gallery[0] || FALLBACK_PRODUCT_IMAGE}
                alt="Product Preview"
                onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                className="w-full h-full object-contain p-4"
              />
            </div>

            {/* 4 Thumbnails Strip */}
            <div className="grid grid-cols-4 gap-2">
              {gallery.slice(0, 4).map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`aspect-square rounded-xl border overflow-hidden p-1 transition-all cursor-pointer bg-slate-50 dark:bg-slate-900/50 ${
                    selectedImageIndex === idx
                      ? 'border-blue-600 ring-2 ring-blue-600/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                  }`}
                >
                  <img
                    src={url || FALLBACK_PRODUCT_IMAGE}
                    alt={`thumb-${idx}`}
                    onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>

            {/* Dropzone Upload Box */}
            <div
              onClick={() => {
                setPickerMode('gallery');
                setIsMediaPickerOpen(true);
              }}
              className="p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-center cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center mx-auto mb-2">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="font-bold text-xs" style={{ color: 'var(--text)' }}>
                {isAr ? 'إضافة صور من مكتبة الوسائط' : 'Add Images from Media Library'}
              </div>
              <p className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'رفع ملفات جديدة، الاختيار من المكتبة، أو الاستيراد من Google Drive'
                  : 'Upload new, choose from Media Library, or import from Google Drive'}
              </p>
            </div>

            {/* Specifications & Model Comparison Infographic Card */}
            <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#071E26] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isAr ? 'مخطط مقارنة المواصفات' : 'Specifications & Comparison Image'}</span>
                  </h4>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'صورة جدول مقارنة المواصفات الفنية المعتمدة لهذا المنتج' : 'Comparison infographic image displayed on product page'}
                  </p>
                </div>
              </div>

              {specComparisonImage ? (
                <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-900 group">
                  <img
                    src={specComparisonImage}
                    alt="Specs Comparison"
                    onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                    className="w-full h-36 object-contain p-2"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSpecComparisonImage('')}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                    >
                      {isAr ? 'حذف' : 'Remove'}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={specComparisonImage}
                  onChange={(e) => setSpecComparisonImage(e.target.value)}
                  placeholder={isAr ? 'رابط صورة المقارنة...' : 'Comparison image URL...'}
                  className="flex-1 px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setPickerMode('comparison');
                    setIsMediaPickerOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 text-xs font-bold shrink-0 hover:bg-blue-100 cursor-pointer"
                >
                  {isAr ? 'المكتبة' : 'Media'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── COLUMN 2: BASIC INFO + INVENTORY & SHIPPING (approx 5 cols / 42% width) ── */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Basic Information */}
          <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Box className="w-4 h-4 text-blue-600" />
                <span>{t('basicInformation')}</span>
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                {t('basicInfoSub')}
              </p>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                {t('productName')} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Luxury Hand Bouquet"
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                {t('productSubtitle')}
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Fresh Dutch Roses with Eucalyptus"
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                {t('productDescription')} *
              </label>
              {/* Rich text mock toolbar */}
              <div className="flex items-center gap-1 p-1.5 rounded-t-xl border border-b-0 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <button type="button" className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button type="button" className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button type="button" className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <div className="w-[1px] h-3.5 bg-slate-300 dark:bg-slate-700 mx-1" />
                <button type="button" className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <List className="w-3.5 h-3.5" />
                </button>
                <button type="button" className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button type="button" className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <Link2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3.5 rounded-b-xl border text-xs focus:outline-none leading-relaxed"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              />
            </div>

            {/* 3-Column Select Row: Type, Brand, Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold block mb-1 text-slate-500">
                  {t('productType')}
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                >
                  <option value="Physical Product">Physical Product</option>
                  <option value="Digital Product">Digital Product</option>
                  <option value="Service">Service</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1 text-slate-500">
                  {t('brandLabel')}
                </label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                >
                  <option value={storeName}>{storeName}</option>
                  <option value="Artisan">Artisan</option>
                  <option value="Imported">Imported</option>
                  <option value="Custom Made">Custom Made</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1 text-slate-500">
                  {t('categoryLabel')}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{getProductDisplayCategory(c, locale)}</option>
                  ))}
                  <option value="Bouquets">{isAr ? 'باقات' : 'Bouquets'}</option>
                  <option value="Vases">{isAr ? 'فازات' : 'Vases'}</option>
                  <option value="Gifts">{isAr ? 'هدايا' : 'Gifts'}</option>
                  <option value="Chocolates">{isAr ? 'شوكولاتة' : 'Chocolates'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Inventory & Shipping */}
          <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Box className="w-4 h-4 text-blue-600" />
                <span>{t('inventoryShipping')}</span>
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                {t('inventoryShippingSub')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                  {t('currentQuantity')} *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold font-mono"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                  {t('sku')} *
                </label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold uppercase"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                  {t('weightKgLabel')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                  {t('countryOfOrigin')}
                </label>
                <select
                  value={countryOfOrigin}
                  onChange={(e) => setCountryOfOrigin(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                >
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="Netherlands">Netherlands (Holland)</option>
                  <option value="Ecuador">Ecuador</option>
                  <option value="Kenya">Kenya</option>
                  <option value="UAE">United Arab Emirates</option>
                </select>
              </div>
            </div>

            {/* 2 Toggle Switches */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold block" style={{ color: 'var(--text)' }}>
                    {t('requiresShipping')}
                  </span>
                  <span className="text-[11px] block" style={{ color: 'var(--muted)' }}>
                    {t('requiresShippingSub')}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={requiresShipping}
                  onChange={(e) => setRequiresShipping(e.target.checked)}
                  className="w-5 h-5 rounded cursor-pointer accent-blue-600"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold block" style={{ color: 'var(--text)' }}>
                    {t('trackInventory')}
                  </span>
                  <span className="text-[11px] block" style={{ color: 'var(--muted)' }}>
                    {t('trackInventorySub')}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={trackInventory}
                  onChange={(e) => setTrackInventory(e.target.checked)}
                  className="w-5 h-5 rounded cursor-pointer accent-blue-600"
                />
              </label>
            </div>
          </div>

          {/* Card 3: Dynamic Product Colors & AI Assistant (خارطة ألوان المنتج والذكاء الاصطناعي) */}
          <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Palette className="w-4 h-4 text-purple-600" />
                  <span>{isAr ? 'ألوان وخيارات المقاعد والتلابيس' : 'Seat Colors & Variants'}</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                    {colors.length} {isAr ? 'ألوان' : 'Colors'}
                  </span>
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                  {isAr 
                    ? '3 خيارات ألوان افتراضية لكل منتج مع صور حقيقية. أضف أو عدل الألوان لتتحدث فوراً في المتجر.' 
                    : 'Exactly 3 real colors per product by default. Add or edit to update the storefront dynamically.'}
                </p>
              </div>

              {/* Action Buttons: AI Assistant + Add Color */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAiColorPopover(!showAiColorPopover)}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center gap-1.5 cursor-pointer shadow-xs hover:opacity-95 transition-opacity"
                    title={isAr ? 'مساعد الذكاء الاصطناعي لاختيار الألوان' : 'AI Color Assistant'}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAr ? '✨ مساعد الألوان الذكي' : '✨ AI Colors'}</span>
                  </button>

                  {/* AI Palettes Popover */}
                  {showAiColorPopover && (
                    <div className="absolute end-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-30 space-y-2.5 animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Wand2 className="w-4 h-4 text-purple-600" />
                          <span className="font-bold text-xs" style={{ color: 'var(--text)' }}>
                            {isAr ? 'توليد ألوان ذكية للمقاعد' : 'Generate Seat Colors'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAiColorPopover(false)}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Smart Auto-Suggest Button */}
                      <button
                        type="button"
                        onClick={handleSmartAiAutoSuggest}
                        className="w-full p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-bold text-xs flex items-center justify-between cursor-pointer hover:bg-purple-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <div className="text-start">
                            <span className="block font-black">{isAr ? 'اقتراح ذكي حسب السيارة' : 'Auto-Match by Car Model'}</span>
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-normal">
                              {isAr ? `توليد 3 ألوان متناسقة لـ "${brand || 'السيارة'}"` : `Best 3 colors for ${brand || 'Vehicle'}`}
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* Curated AI Palettes */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 block px-1">
                          {isAr ? 'أو اختر باقة ألوان معتمدة (3 ألوان):' : 'Or select a curated 3-color palette:'}
                        </span>
                        {AI_SEAT_PALETTES.map(pal => (
                          <div
                            key={pal.id}
                            onClick={() => handleApplyAiPalette(pal)}
                            className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all flex items-center justify-between"
                          >
                            <div>
                              <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                                {isAr ? pal.titleAr : pal.titleEn}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {isAr ? pal.descAr : pal.titleEn}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {pal.colors.map((c, ci) => (
                                <span
                                  key={ci}
                                  className="w-4 h-4 rounded-full border border-black/20 shadow-xs"
                                  style={{ backgroundColor: c.hex }}
                                  title={c.nameAr}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddColor}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إضافة لون' : 'Add Color'}</span>
                </button>
              </div>
            </div>

            {/* List of Colors */}
            <div className="space-y-2.5">
              {colors.map((col, idx) => (
                <div
                  key={col.id || idx}
                  className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-600 dark:text-slate-300">
                        {idx + 1}
                      </span>
                      {/* Color Preview & Native Color Picker */}
                      <label className="relative cursor-pointer flex items-center gap-2">
                        <span
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 shadow-md inline-block shrink-0"
                          style={{ backgroundColor: col.hex }}
                        />
                        <input
                          type="color"
                          value={col.hex}
                          onChange={(e) => handleUpdateColor(idx, { hex: e.target.value })}
                          className="sr-only"
                        />
                        <input
                          type="text"
                          value={col.hex}
                          onChange={(e) => handleUpdateColor(idx, { hex: e.target.value })}
                          className="w-20 px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                        />
                      </label>
                    </div>

                    {/* Delete button if more than 1 color */}
                    {colors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(idx)}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                        title={isAr ? 'حذف هذا اللون' : 'Delete Color'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Names & Image Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                        {isAr ? 'الاسم بالعربية:' : 'Arabic Name:'}
                      </label>
                      <input
                        type="text"
                        value={col.nameAr}
                        onChange={(e) => handleUpdateColor(idx, { nameAr: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        placeholder="مثال: بيج وكالة"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                        {isAr ? 'الاسم بالإنجليزية:' : 'English Name:'}
                      </label>
                      <input
                        type="text"
                        value={col.nameEn}
                        onChange={(e) => handleUpdateColor(idx, { nameEn: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        placeholder="e.g. OEM Beige"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                        {isAr ? 'صورة المقعد الحقيقية:' : 'Real Seat Image:'}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <img
                          src={col.image || gallery[0]}
                          alt={col.nameAr}
                          className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-white"
                        />
                        <input
                          type="text"
                          value={col.image}
                          onChange={(e) => handleUpdateColor(idx, { image: e.target.value })}
                          className="flex-1 px-2 py-1.5 text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl truncate"
                          placeholder="https://..."
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setColorPickerTargetIdx(idx);
                            setPickerMode('color');
                            setIsMediaPickerOpen(true);
                          }}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer shrink-0"
                          title={isAr ? 'اختيار من مكتبة الوسائط' : 'Pick from Media Library'}
                        >
                          <FolderSearch className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Hint Notice */}
            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-start gap-2 text-[11px] text-blue-900 dark:text-blue-300">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                {isAr
                  ? 'يتم عرض أول 3 ألوان كخيارات أساسية في بطاقة المنتج ومتجر السعيدي، مع تحديث صورة المقعد فوراً عند نقر المستهلك على اللون.'
                  : 'The top 3 colors are displayed as primary swatches in the storefront, dynamically updating the car seat photo on click.'}
              </span>
            </div>
          </div>
        </div>

        {/* ── COLUMN 3: PRICING + SEO SETTINGS (approx 4 cols / 32% width) ── */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Pricing */}
          <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Info className="w-4 h-4 text-blue-600" />
                <span>{t('pricing')}</span>
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                {t('pricingSub')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                  {t('priceLabel')} *
                </label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400 font-mono">
                    {currency}
                  </span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full ps-14 pe-3 py-2.5 rounded-xl border text-xs font-bold font-mono"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                  {t('discountedPriceLabel')}
                </label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400 font-mono">
                    {currency}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={discountedPrice}
                    onChange={(e) => setDiscountedPrice(Number(e.target.value))}
                    className="w-full ps-14 pe-3 py-2.5 rounded-xl border text-xs font-bold font-mono"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                  {t('costPriceLabel')}
                </label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400 font-mono">
                    {currency}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full ps-14 pe-3 py-2.5 rounded-xl border text-xs font-bold font-mono"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                  {t('taxLabel')}
                </label>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                >
                  <option value={15}>15% (KSA Standard VAT)</option>
                  <option value={5}>5% (Reduced Tax)</option>
                  <option value={0}>0% (Tax Exempt)</option>
                </select>
              </div>
            </div>

            {/* Profit Per Item Callout matching Mockup 07 */}
            <div className="p-3.5 rounded-xl bg-blue-50/80 text-blue-900 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900/60 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-black">
                  {t('profitPerItem')}: {money(calculatedProfit)}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  {t('profitBasedOn')}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: SEO Settings */}
          <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Search className="w-4 h-4 text-blue-600" />
                <span>{t('seoSettings')}</span>
              </h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                {t('seoSettingsSub')}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                  {t('pageTitleLabel')}
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {pageTitle.length}/70
                </span>
              </div>
              <input
                type="text"
                maxLength={70}
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none font-medium"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                  {t('customUrlLabel')}
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {customUrl.length}/100
                </span>
              </div>
              <div className="flex items-center rounded-xl border overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20" style={{ borderColor: 'var(--border)' }}>
                <span className="px-3 py-2 text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0 border-e border-slate-200 dark:border-slate-700">
                  {storeSlug || 'my-store'}.com/products/
                </span>
                <input
                  type="text"
                  maxLength={100}
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className="w-full px-3 py-2 text-xs font-mono focus:outline-none"
                  style={{ background: 'var(--input-bg)', color: 'var(--input-fg)' }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                  {t('pageDescriptionLabel')}
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {seoDescription.length}/160
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={160}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                className="w-full p-3 rounded-xl border text-xs focus:outline-none leading-relaxed"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
              />
            </div>
          </div>
        </div>

        {/* Central Media Picker Modal for Product */}
        <MediaPickerModal
          isOpen={isMediaPickerOpen}
          onClose={() => setIsMediaPickerOpen(false)}
          onSelect={handleSelectMedia}
          multiple={pickerMode === 'gallery'}
          allowedTypes={['image', 'gif']}
          initialFolder="products"
          title={
            pickerMode === 'main'
              ? isAr
                ? 'اختيار الصورة الرئيسية للمنتج'
                : 'Choose Main Product Image'
              : isAr
                ? 'إضافة صور إلى معرض المنتج'
                : 'Add Images to Product Gallery'
          }
        />
      </form>
    </AdminPageShell>
  );
};
