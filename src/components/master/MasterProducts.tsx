import React, { useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import type { Product, Store } from '../../types';
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
  Store as StoreIcon,
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
} from 'lucide-react';
import { useToast } from '../common/ToastProvider';

/**
 * MasterProducts — Master Admin Products & Catalog Directory & Editor
 * 100% Pixel Perfect to Mockup 06 (Products List) and Mockup 07 (Product Edit)
 * Reference 06: designs/Master_Admin_UIUX/06_Products_List/mockup_consistent/06_products_list.png
 * Reference 07: designs/Master_Admin_UIUX/07_Product_Edit/mockup_consistent/07_product_edit.png
 */
export const MasterProducts: React.FC = () => {
  const { allProducts, stores, addProduct, updateProduct, deleteProduct, togglePublishProduct } = useTenant();
  const { t, money, locale, dir } = usePrefs();
  const { toast, confirm } = useToast();
  const isAr = locale === 'ar';

  // Navigation / View State: 'list' | 'edit'
  const [currentView, setCurrentView] = useState<'list' | 'edit'>('list');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // List View Controls
  const [search, setSearch] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Flatten All Cross-Store Products ──
  const flatProducts = useMemo(() => {
    return Object.values(allProducts).flat();
  }, [allProducts]);

  // Current editing product
  const editingProduct = useMemo(() => {
    if (!editingProductId) return null;
    return flatProducts.find((p) => p.id === editingProductId) || null;
  }, [flatProducts, editingProductId]);

  // ── KPI Summary Cards matching Mockup 06 (All Stores Aggregated) ──
  const kpi = useMemo(() => {
    const total = flatProducts.length;
    const active = flatProducts.filter((p) => (p.status === 'published' || (p as any).status === 'active') && p.stock > 0).length;
    const outOfStock = flatProducts.filter((p) => p.stock === 0).length;
    const draft = flatProducts.filter((p) => p.status === 'draft').length;

    return { total, active, outOfStock, draft };
  }, [flatProducts]);

  // Unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    flatProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [flatProducts]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return flatProducts.filter((p) => {
      if (selectedStoreId !== 'all' && p.storeId !== selectedStoreId) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchCat = p.category?.toLowerCase().includes(q);
        const store = stores.find((s) => s.id === p.storeId);
        const matchStore = store?.name.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchCat && !matchStore) return false;
      }
      return true;
    });
  }, [flatProducts, selectedStoreId, selectedCategory, search, stores]);

  // Pagination
  const totalCount = filteredProducts.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedProducts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, safePage, pageSize]);

  // Select all checkbox handler
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
  const handleOpenNewProduct = () => {
    const defaultStore = stores[0]?.id || 'store-1';
    const newId = `prod-${Date.now()}`;
    const newProduct: Product = {
      id: newId,
      storeId: selectedStoreId !== 'all' ? selectedStoreId : defaultStore,
      name: isAr ? 'منتج جديد' : 'New Product',
      subtitle: isAr ? 'وصف مختصر للمنتج' : 'Premium catalog item',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: categories[0] || 'Electronics',
      price: 199,
      discountedPrice: 149,
      costPrice: 85,
      taxRate: 15,
      stock: 25,
      status: 'draft',
      isActive: true,
      isStale: false,
      publishedAt: new Date().toISOString(),
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80',
      ],
      description: isAr
        ? 'يوفر هذا المنتج أعلى معايير الجودة والتصميم العصري مع ضمان شامل وراحة لا مثيل لها.'
        : 'Delivers all-day comfort with a modern aesthetic, crafted with top-tier materials.',
      productType: 'Physical Product',
      brand: 'Unityteck',
      countryOfOrigin: 'Saudi Arabia',
      requiresShipping: true,
      trackInventory: true,
      salesCount: 0,
      customUrl: `product-${Date.now().toString().slice(-4)}`,
      seoTitle: isAr ? 'منتج جديد فاخر | المتجر' : 'New Premium Product | Store',
      seoDescription: isAr ? 'تسوق أفضل المنتجات بأفضل الأسعار.' : 'Shop top rated products with fast delivery.',
    };

    addProduct(newProduct, newProduct.storeId);
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
      deleteProduct(product.id, product.storeId);
      if (editingProductId === product.id) {
        setCurrentView('list');
        setEditingProductId(null);
      }
      toast(t('productDeletedSuccess'), 'success');
    }
  };

  // Duplicate product handler
  const handleDuplicateProduct = (product: Product) => {
    const dup: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      name: `${product.name} (Copy)`,
      sku: `${product.sku}-COPY`,
      salesCount: 0,
      status: 'draft',
    };
    addProduct(dup, product.storeId);
    toast(isAr ? 'تم نسخ المنتج بنجاح كمسودة' : 'Product duplicated as draft', 'success');
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
      <ProductEditorView
        product={editingProduct}
        stores={stores}
        categories={categories}
        onBack={() => {
          setCurrentView('list');
          setEditingProductId(null);
        }}
        onSave={(updatedData) => {
          updateProduct(editingProduct.id, updatedData, editingProduct.storeId);
          toast(t('productSavedSuccess'), 'success');
        }}
        onDelete={() => handleDeleteProduct(editingProduct)}
      />
    );
  }

  // ────────────────────────────────────────────────
  //  VIEW 1: PRODUCTS LIST DIRECTORY (Mockup 06 Exact)
  // ────────────────────────────────────────────────
  return (
    <AdminPageShell className="pb-16 max-w-[1600px] mx-auto space-y-5">
      {/* ── TOP HEADER — Title & Subtitle + Search + Filters + Add Product Button ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight" style={{ color: 'var(--text)' }}>
            {t('productsTitle')}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            {t('productsSubtitle')}
          </p>
        </div>

        {/* Action Controls on the Right */}
        <div className="flex items-center gap-2.5 flex-wrap">
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

          {/* Master Store Selector */}
          <select
            value={selectedStoreId}
            onChange={(e) => {
              setSelectedStoreId(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-bold rounded-xl border shadow-xs cursor-pointer"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <option value="all">{t('allStores')}</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

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

      {/* ── EXPANDABLE CATEGORY & ATTRIBUTE FILTER BAR ── */}
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
          {(selectedCategory !== 'all' || selectedStoreId !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedStoreId('all');
              }}
              className="text-rose-500 font-bold hover:underline ms-auto cursor-pointer"
            >
              {isAr ? 'إعادة ضبط' : 'Reset'}
            </button>
          )}
        </div>
      )}

      {/* ── 4 KPI CARDS DEDICATED GRID (Mockup 06 - 100% UNIFORM NO 3+1 WRAP) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Products */}
        <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
            {t('totalProductsCard')}
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
              {kpi.total.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>12%</span>
            </span>
          </div>
        </div>

        {/* Card 2: Active */}
        <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
            {t('activeProducts')}
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
              {kpi.active.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>8%</span>
            </span>
          </div>
        </div>

        {/* Card 3: Out of Stock */}
        <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
            {t('outOfStock')}
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
              {kpi.outOfStock.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-rose-600 flex items-center gap-0.5">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>2%</span>
            </span>
          </div>
        </div>

        {/* Card 4: Draft */}
        <div className="bg-white dark:bg-[#071E26] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
            {t('draftProducts')}
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
              {kpi.draft.toLocaleString()}
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
                  {isAr ? 'المتجر' : 'Store'}
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
                  <td colSpan={9} className="py-12 text-center text-xs" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'لا توجد منتجات مطابقة لخيارات البحث.' : 'No products found matching your criteria.'}
                  </td>
                </tr>
              ) : (
                pagedProducts.map((prod) => {
                  const isChecked = selectedProductIds.includes(prod.id);
                  const store = stores.find((s) => s.id === prod.storeId);
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
                            src={prod.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=150&q=80'}
                            alt={prod.name}
                            className="w-11 h-11 rounded-xl object-cover border shrink-0 bg-slate-100 dark:bg-slate-800"
                            style={{ borderColor: 'var(--border)' }}
                          />
                          <div className="min-w-0">
                            <span
                              onClick={() => handleOpenEdit(prod)}
                              className="font-bold block truncate max-w-[200px] cursor-pointer hover:underline"
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

                      {/* Store Badge (Master Cross-tenant parity) */}
                      <td className="py-3.5 px-3 whitespace-nowrap" style={{ borderBottom: '1px solid var(--border)' }}>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 inline-flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                          <StoreIcon className="w-3 h-3 text-cyan-600" />
                          <span>{store?.name || prod.storeId}</span>
                        </span>
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
                                    togglePublishProduct(prod.id, prod.storeId);
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
    </AdminPageShell>
  );
};

/**
 * ────────────────────────────────────────────────
 *  3-COLUMN PRODUCT EDITOR (Mockup 07 Pixel Perfect)
 * ────────────────────────────────────────────────
 */
interface ProductEditorViewProps {
  product: Product;
  stores: Store[];
  categories: string[];
  onBack: () => void;
  onSave: (updatedData: Partial<Product>) => void;
  onDelete: () => void;
}

const ProductEditorView: React.FC<ProductEditorViewProps> = ({
  product,
  stores,
  categories,
  onBack,
  onSave,
  onDelete,
}) => {
  const { t, locale, money } = usePrefs();
  const isAr = locale === 'ar';

  // Form State initialized from product
  const [name, setName] = useState(product.name || '');
  const [subtitle, setSubtitle] = useState(product.subtitle || '');
  const [description, setDescription] = useState(product.description || '');
  const [productType, setProductType] = useState(product.productType || 'Physical Product');
  const [brand, setBrand] = useState(product.brand || 'Nike');
  const [category, setCategory] = useState(product.category || 'Sneakers');

  // Inventory & Shipping
  const [stock, setStock] = useState(product.stock ?? 48);
  const [sku, setSku] = useState(product.sku || 'NK-AIR270-BLK-001');
  const [weightKg, setWeightKg] = useState(product.weightKg ?? 1.2);
  const [countryOfOrigin, setCountryOfOrigin] = useState(product.countryOfOrigin || 'Vietnam');
  const [requiresShipping, setRequiresShipping] = useState(product.requiresShipping !== false);
  const [trackInventory, setTrackInventory] = useState(product.trackInventory !== false);

  // Pricing
  const [price, setPrice] = useState(product.price ?? 129);
  const [discountedPrice, setDiscountedPrice] = useState(product.discountedPrice ?? 99);
  const [costPrice, setCostPrice] = useState(product.costPrice ?? 70);
  const [taxRate, setTaxRate] = useState(product.taxRate ?? 15);

  // SEO Settings
  const [pageTitle, setPageTitle] = useState(
    product.seoTitle || `${name} | Comfortable Sneakers | My Store`
  );
  const [customUrl, setCustomUrl] = useState(product.customUrl || 'nike-air-max-270');
  const [seoDescription, setSeoDescription] = useState(
    product.seoDescription ||
      'Shop Nike Air Max 270 sneakers, Experience all-day comfort, modern design, and unbeatable cushioning.'
  );

  // Gallery images
  const [gallery, setGallery] = useState<string[]>(
    product.galleryUrls && product.galleryUrls.length > 0
      ? product.galleryUrls
      : [
          product.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80',
        ]
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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
            {isAr ? 'حدّث معلومات المنتج، الصور، التسعير، وإعدادات السيو.' : 'Update your product information, images, pricing, and more.'}
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
                const url = prompt(
                  isAr ? 'أدخل رابط الصورة الجديدة:' : 'Enter new image URL to add to gallery:',
                  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'
                );
                if (url) {
                  setGallery([...gallery, url]);
                  setSelectedImageIndex(gallery.length);
                }
              }}
              className="p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 text-center cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center mx-auto mb-2">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="font-bold text-xs" style={{ color: 'var(--text)' }}>
                {t('uploadImages')}
              </div>
              <p className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
                {t('uploadImagesSub')}
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
                placeholder="e.g. Nike Air Max 270"
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
                placeholder="e.g. Modern athletic footwear"
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
                  <option value="Nike">Nike</option>
                  <option value="Apple">Apple</option>
                  <option value="Samsung">Samsung</option>
                  <option value="Sony">Sony</option>
                  <option value="Unityteck">Unityteck</option>
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
                  <option value="Sneakers">Sneakers</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Home">Home</option>
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
                  <option value="Vietnam">Vietnam</option>
                  <option value="China">China</option>
                  <option value="UAE">United Arab Emirates</option>
                  <option value="USA">United States</option>
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
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                    SAR
                  </span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full ps-12 pe-3 py-2.5 rounded-xl border text-xs font-bold font-mono"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                  {t('discountedPriceLabel')}
                </label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                    SAR
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={discountedPrice}
                    onChange={(e) => setDiscountedPrice(Number(e.target.value))}
                    className="w-full ps-12 pe-3 py-2.5 rounded-xl border text-xs font-bold font-mono"
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
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-400">
                    SAR
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full ps-12 pe-3 py-2.5 rounded-xl border text-xs font-bold font-mono"
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
                  my-store.com/products/
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
      </form>
    </AdminPageShell>
  );
};
