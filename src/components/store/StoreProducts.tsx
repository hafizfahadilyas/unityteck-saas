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
} from 'lucide-react';
import { useToast } from '../common/ToastProvider';
import { canAddProduct, planInfoForStore } from '../../auth/plans';
import { resolveSubscription } from '../../auth/subscriptions';
import { ProductTypePicker } from './ProductTypePicker';
import { StoreBrandsView } from './StoreBrandsView';
import { MediaPickerModal } from '../common/MediaPickerModal';
import { BulkProductUploadModal } from './BulkProductUploadModal';

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
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchCat = p.category?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchCat) return false;
      }
      return true;
    });
  }, [currentProducts, selectedCategory, search]);

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
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Brand</label>
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
              >
                <option value="All">All Brands</option>
                <option value="Casablanca Blooms">Casablanca Blooms</option>
                <option value="Makkah Heritage">Makkah Heritage</option>
                <option value="Dutch Flora">Dutch Flora</option>
                <option value="Taif Rose Valley">Taif Rose Valley</option>
                <option value="Royal Petals">Royal Petals</option>
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
              {cat}
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
                            src={prod.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=150&q=80'}
                            alt={prod.name}
                            className="w-11 h-11 rounded-xl object-cover border shrink-0 bg-slate-100 dark:bg-slate-800"
                            style={{ borderColor: 'var(--border)' }}
                          />
                          <div className="min-w-0">
                            <span
                              onClick={() => handleOpenEdit(prod)}
                              className="font-bold block truncate max-w-[220px] cursor-pointer hover:underline"
                              style={{ color: 'var(--text)' }}
                            >
                              {prod.name}
                            </span>
                            <span className="text-[11px] font-mono block text-slate-400">
                              SKU: {prod.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-medium" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                        {prod.category}
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
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
            <div className="flex items-center gap-1.5">
              <span>{isAr ? 'عرض' : 'Show'}</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 rounded-lg border text-xs font-semibold cursor-pointer"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <span>
              {isAr ? `عرض ${totalCount > 0 ? (safePage - 1) * pageSize + 1 : 0}–${Math.min(safePage * pageSize, totalCount)} من أصل ${totalCount} منتج` : `Showing ${totalCount > 0 ? (safePage - 1) * pageSize + 1 : 0}–${Math.min(safePage * pageSize, totalCount)} of ${totalCount.toLocaleString()} products`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            {Array.from({ length: pageCount }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPage(idx + 1)}
                className="w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
                style={
                  safePage === idx + 1
                    ? { background: 'var(--portal-cta)', color: '#ffffff' }
                    : { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }
                }
              >
                {idx + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="p-1.5 rounded-lg border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
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
      : [
          product.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=600&q=80',
        ]
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'main' | 'gallery'>('gallery');

  const handleSelectMedia = (selected: any) => {
    const assets = Array.isArray(selected) ? selected : [selected];
    const newUrls = assets.map((a: any) => a.optimizedUrl || a.webpUrl || a.originalUrl).filter(Boolean);
    if (newUrls.length === 0) return;
    if (pickerMode === 'main') {
      const copy = [...gallery];
      copy[selectedImageIndex] = newUrls[0];
      setGallery(copy);
    } else {
      setGallery((prev) => [...prev, ...newUrls]);
      setSelectedImageIndex(gallery.length);
    }
  };

  // Profit calculation
  const calculatedProfit = useMemo(() => {
    const effPrice = discountedPrice > 0 ? discountedPrice : price;
    return Math.max(0, effPrice - costPrice);
  }, [price, discountedPrice, costPrice]);

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
      seoTitle: pageTitle,
      customUrl,
      seoDescription,
    });
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
                src={gallery[selectedImageIndex] || gallery[0]}
                alt="Product Preview"
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
                  <img src={url} alt={`thumb-${idx}`} className="w-full h-full object-contain" />
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
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Bouquets">Bouquets</option>
                  <option value="Vases">Vases</option>
                  <option value="Gifts">Gifts</option>
                  <option value="Chocolates">Chocolates</option>
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
