import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { FloatingPopover } from '../common/FloatingPopover';
import { fetchProductsPage } from '../../api/tenantApi';
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
  GripVertical,
  Sliders,
  LayoutGrid,
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
import { ProductVariationsPanel } from './ProductVariationsPanel';
import type { ProductColorOption } from '../../types';
import { SEAT_COLORS, getProductColors } from '../../data/blecoStoreData';
import { getProductDisplayName, getProductDisplayCategory } from '../../utils/storeLocalization';
import { handleImageError, FALLBACK_PRODUCT_IMAGE } from '../../utils/imageFallback';
import {
  parseOrderDate,
  periodCountGrowth,
} from '../../utils/liveSeries';
import { StoreProductEditorView } from './StoreProductEditorView';
import {
  ProductEditDrawer,
  DEFAULT_PRODUCT_EDIT_SECTIONS,
  PRODUCT_EDIT_SECTION_OPTIONS,
  type ProductEditSectionKey,
} from './ProductEditDrawer';
import { ProductFiltersPanel, type ProductFilterCriteria } from './ProductFiltersPanel';

const EDIT_FIELDS_STORAGE_PREFIX = 'unityteck_product_edit_fields_';

function loadEditFieldVisibility(storeId: string): Record<ProductEditSectionKey, boolean> {
  try {
    const raw = localStorage.getItem(`${EDIT_FIELDS_STORAGE_PREFIX}${storeId}`);
    if (!raw) return { ...DEFAULT_PRODUCT_EDIT_SECTIONS };
    const parsed = JSON.parse(raw) as Partial<Record<ProductEditSectionKey, boolean>>;
    return { ...DEFAULT_PRODUCT_EDIT_SECTIONS, ...parsed };
  } catch {
    return { ...DEFAULT_PRODUCT_EDIT_SECTIONS };
  }
}

function saveEditFieldVisibility(storeId: string, value: Record<ProductEditSectionKey, boolean>) {
  try {
    localStorage.setItem(`${EDIT_FIELDS_STORAGE_PREFIX}${storeId}`, JSON.stringify(value));
  } catch {
    /* ignore quota / private mode */
  }
}

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
    revalidateResource,
    dataSource,
    apiError,
  } = useTenant();
  const { t, money, locale, dir } = usePrefs();
  const { toast, confirm } = useToast();
  const isAr = locale === 'ar';

  const [apiRows, setApiRows] = useState<Product[]>([]);
  const [apiTotal, setApiTotal] = useState(0);
  const [apiLastPage, setApiLastPage] = useState(1);
  const [catalogNonce, setCatalogNonce] = useState(0);
  const [apiCounts, setApiCounts] = useState<{ total: number; active: number; out_of_stock: number; draft: number } | null>(null);
  const planGate = canAddProduct(activeStore, dataSource === 'api' ? apiTotal : currentProducts.length);
  const planInfo = planInfoForStore(activeStore);
  const sub = resolveSubscription(activeStore.id);

  // Navigation / View State: 'list' | 'edit' | 'type-picker' | 'brands' | 'filters'
  const [currentView, setCurrentView] = useState<'list' | 'edit' | 'type-picker' | 'brands' | 'filters'>('list');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  /** Unsaved manual create draft — never persisted until user clicks Save */
  const [creatingProduct, setCreatingProduct] = useState<Product | null>(null);

  // List View Controls
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  /** Rows on screen. Starts at 20+ and grows when the list is scrolled. */
  const [visibleCount, setVisibleCount] = useState(20);
  const listScrollRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Makdah Flowers Catalog Table & Inline Edit State (Spec Section 6 & 9)
  const [isInlineEdit, setIsInlineEdit] = useState(false);
  const [showColumnsPopover, setShowColumnsPopover] = useState(false);
  const [showFieldsFilterPopover, setShowFieldsFilterPopover] = useState(false);
  const [columnSearch, setColumnSearch] = useState('');
  const [bulkAction, setBulkAction] = useState<string>('');
  const columnsBtnRef = useRef<HTMLButtonElement>(null);
  const fieldsBtnRef = useRef<HTMLButtonElement>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    image: true,
    name: true,
    sku: true,
    price: true,
    salePrice: true,
    stock: true,
    category: true,
    status: true,
    weight: true,
    shippingClass: true,
    actions: true,
  });

  // Edit-panel field visibility (Filter) — shared by Grid (Large Image) & List views
  const [visibleEditSections, setVisibleEditSections] = useState<Record<ProductEditSectionKey, boolean>>(
    () => loadEditFieldVisibility(activeStore.id)
  );

  const applyEditSectionVisibility = (next: Record<ProductEditSectionKey, boolean>) => {
    setVisibleEditSections(next);
    saveEditFieldVisibility(activeStore.id, next);
  };

  React.useEffect(() => {
    setVisibleEditSections(loadEditFieldVisibility(activeStore.id));
  }, [activeStore.id]);

  const openColumnsPopover = () => {
    setShowFieldsFilterPopover(false);
    setShowColumnsPopover((v) => !v);
  };

  const openFieldsFilterPopover = () => {
    setShowColumnsPopover(false);
    setShowFieldsFilterPopover((v) => !v);
  };

  const closeFloatingPopovers = () => {
    setShowColumnsPopover(false);
    setShowFieldsFilterPopover(false);
  };

  const [catalogBusy, setCatalogBusy] = useState(false);

  const rowCacheRef = useRef<Record<string, Product[]>>({});

  useEffect(() => {
    const cached = activeStore?.id ? rowCacheRef.current[activeStore.id] : undefined;
    setApiRows(cached ?? []);
    if (!cached?.length) {
      setApiTotal(0);
      setApiCounts(null);
    }
  }, [activeStore?.id]);

  const reloadCatalog = () => {
    if (!activeStore?.id) return;
    setPage(1);
    setCatalogNonce((n) => n + 1);
  };

  const emptyCatalogMessage = catalogBusy
    ? isAr
      ? 'جاري تحميل المنتجات…'
      : 'Loading products…'
    : currentProducts.length === 0
      ? apiError
        ? apiError
        : dataSource !== 'api'
          ? isAr
            ? 'الكتالوج غير متصل بواجهة البرمجة حالياً — سجّل الدخول من جديد لتحميل المنتجات الحقيقية.'
            : 'Catalog is not connected to the live API — sign in again to load real products.'
          : isAr
            ? 'لا توجد منتجات مسجلة في هذا المتجر حالياً.'
            : 'No records found for this store.'
      : isAr
        ? 'لا توجد منتجات مطابقة لخيارات البحث.'
        : 'No products found matching your criteria.';

  // Advanced Filters & Deleted Products (Mockup / Screenshot 4 & Filters Panel)
  const [filterCriteria, setFilterCriteria] = useState<ProductFilterCriteria>({
    channel: 'All',
    brand: 'All',
    search: '',
    productType: 'All',
    category: 'All',
    status: 'All',
  });

  useEffect(() => {
    if (dataSource !== 'api' || !activeStore?.id) return;
    let cancelled = false;
    setCatalogBusy(true);
    const status =
      filterCriteria.status === 'Draft'
        ? 'draft'
        : filterCriteria.status === 'Archived'
          ? 'archived'
          : filterCriteria.status === 'Active'
            ? 'published'
            : undefined;
    const q = (filterCriteria.search.trim() || search.trim()) || undefined;
    const category =
      filterCriteria.category !== 'All'
        ? filterCriteria.category
        : selectedCategory !== 'all'
          ? selectedCategory
          : undefined;
    const timer = window.setTimeout(() => {
      void fetchProductsPage(activeStore.id, {
        page,
        per_page: pageSize,
        q,
        status,
        category,
        stock:
          filterCriteria.status === 'Out of Stock'
            ? 'out'
            : filterCriteria.status === 'Low Stock'
              ? 'low'
              : undefined,
        sort: 'updated_at',
        dir: 'desc',
      })
        .then((res) => {
          if (cancelled) return;
          if (activeStore.id) rowCacheRef.current[activeStore.id] = res.data;
          setApiRows(res.data);
          setApiTotal(res.meta.total);
          setApiLastPage(res.meta.last_page);
          if (res.meta.counts) setApiCounts(res.meta.counts);
        })
        .catch(() => {
          if (cancelled) return;
          const cached = activeStore.id ? rowCacheRef.current[activeStore.id] : undefined;
          if (cached?.length) setApiRows(cached);
        })
        .finally(() => {
          if (!cancelled) setCatalogBusy(false);
        });
    }, q ? 250 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    dataSource,
    activeStore?.id,
    page,
    pageSize,
    search,
    selectedCategory,
    filterCriteria.status,
    filterCriteria.category,
    filterCriteria.search,
    catalogNonce,
  ]);

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

  // Current editing product (existing) or unsaved create draft
  const editingProduct = useMemo(() => {
    if (creatingProduct) return creatingProduct;
    if (!editingProductId) return null;
    return (
      apiRows.find((p) => p.id === editingProductId) ||
      currentProducts.find((p) => p.id === editingProductId) ||
      null
    );
  }, [creatingProduct, currentProducts, editingProductId, apiRows]);
  const isCreatingProduct = Boolean(creatingProduct);
  const editPanelOpen = isSideDrawerOpen && !!editingProduct && !creatingProduct;

  useEffect(() => {
    if (editPanelOpen) return;
    setShowFieldsFilterPopover(false);
  }, [editPanelOpen]);

  // ── 4 KPI Summary Cards matching Mockup 06 (Store Scoped) ──
  const kpi = useMemo(() => {
    if (dataSource === 'api' && apiCounts) {
      return {
        total: apiCounts.total,
        active: apiCounts.active,
        outOfStock: apiCounts.out_of_stock,
        draft: apiCounts.draft,
        totalGrowth: { pct: 0, current: 0, previous: 0, hasData: false },
        activeGrowth: { pct: 0, current: 0, previous: 0, hasData: false },
        outOfStockGrowth: { pct: 0, current: 0, previous: 0, hasData: false },
      };
    }
    const total = currentProducts.length;
    const active = currentProducts.filter(
      (p) => (p.status === 'published' || (p as any).status === 'active') && p.stock > 0
    ).length;
    const outOfStock = currentProducts.filter((p) => p.stock === 0).length;
    const draft = currentProducts.filter((p) => p.status === 'draft').length;

    const productDate = (p: (typeof currentProducts)[number]) =>
      parseOrderDate(p.publishedAt) || parseOrderDate((p as { createdAt?: string }).createdAt);

    const totalGrowth = periodCountGrowth(currentProducts, productDate);
    const activeGrowth = periodCountGrowth(
      currentProducts,
      productDate,
      (p) => (p.status === 'published' || (p as { status?: string }).status === 'active') && p.stock > 0,
    );
    const outOfStockGrowth = periodCountGrowth(currentProducts, productDate, (p) => p.stock === 0);

    return { total, active, outOfStock, draft, totalGrowth, activeGrowth, outOfStockGrowth };
  }, [currentProducts, dataSource, apiCounts]);

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
      // 1. Category filter
      const cat = filterCriteria.category !== 'All' ? filterCriteria.category : (selectedCategory !== 'all' ? selectedCategory : 'all');
      if (cat !== 'all') {
        const catLower = cat.toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        const pCatAr = (p.categoryAr || '').toLowerCase();
        const pCatEn = (p.categoryEn || '').toLowerCase();
        if (pCat !== catLower && !pCat.includes(catLower) && !pCatAr.includes(catLower) && !pCatEn.includes(catLower)) {
          return false;
        }
      }

      // 2. Brand filter
      if (filterCriteria.brand !== 'All') {
        const pBrand = ((p as any).brand || (p as any).brandName || '').toLowerCase();
        if (!pBrand.includes(filterCriteria.brand.toLowerCase())) return false;
      }

      // 3. Status filter
      if (filterCriteria.status !== 'All') {
        if (filterCriteria.status === 'Active') {
          const isActive = (p.status === 'published' || (p as any).status === 'active') && (p.stock > 0 || (p as any).trackInventory === false);
          if (!isActive) return false;
        } else if (filterCriteria.status === 'Out of Stock') {
          if (p.stock > 0) return false;
        } else if (filterCriteria.status === 'Low Stock') {
          if (p.stock <= 0 || p.stock > 5) return false;
        } else if (filterCriteria.status === 'Draft') {
          if (p.status !== 'draft') return false;
        } else if (filterCriteria.status === 'Archived') {
          if (p.status !== 'archived') return false;
        }
      }

      // 4. Product Type filter
      if (filterCriteria.productType !== 'All') {
        const pType = ((p as any).type || (p as any).productType || 'physical').toLowerCase();
        const targetType = filterCriteria.productType.toLowerCase();
        if (targetType.includes('physical') && !pType.includes('physical') && pType !== 'standard') return false;
        if (targetType.includes('service') && !pType.includes('service') && !pType.includes('custom')) return false;
        if (targetType.includes('digital') && !pType.includes('digital')) return false;
        if (targetType.includes('bundle') && !pType.includes('bundle')) return false;
      }

      // 5. Sales Channel filter
      if (filterCriteria.channel !== 'All') {
        const channels = (p as any).channels || (p as any).salesChannels || ['Online Store'];
        if (Array.isArray(channels)) {
          if (!channels.some((c: string) => c.toLowerCase().includes(filterCriteria.channel.toLowerCase()))) return false;
        }
      }

      // 6. Search query filter (combines top search input and filter panel search input)
      const q = (filterCriteria.search.trim() || search.trim()).toLowerCase();
      if (q) {
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
  }, [currentProducts, selectedCategory, filterCriteria, search, locale]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return list;
  }, [filteredProducts]);

  // First screen is at least 20. Scrolling appends the next page-size batch.
  const totalCount = dataSource === 'api' ? apiTotal : sortedProducts.length;
  const pageCount = dataSource === 'api' ? Math.max(1, apiLastPage) : Math.max(1, Math.ceil(totalCount / pageSize));
  const revealedCount = dataSource === 'api'
    ? apiRows.length
    : Math.min(totalCount, Math.max(pageSize, visibleCount, page * pageSize));
  const safePage = dataSource === 'api'
    ? Math.min(pageCount, Math.max(1, page))
    : Math.min(
        pageCount,
        Math.max(1, Math.ceil((totalCount === 0 ? 1 : Math.max(revealedCount, 1)) / pageSize)),
      );
  const pagedProducts = useMemo(() => {
    if (dataSource === 'api') {
      if (apiRows.length > 0) return apiRows;
      if (page <= 1 && currentProducts.length > 0 && !search.trim() && filterCriteria.search.trim() === '') {
        return currentProducts.slice(0, pageSize);
      }
      return apiRows;
    }
    return sortedProducts.slice(0, revealedCount);
  }, [
    dataSource,
    apiRows,
    sortedProducts,
    revealedCount,
    page,
    pageSize,
    currentProducts,
    search,
    filterCriteria.search,
  ]);

  useEffect(() => {
    setVisibleCount(pageSize);
    setPage(1);
  }, [
    pageSize,
    search,
    selectedCategory,
    activeStore.id,
    filterCriteria.channel,
    filterCriteria.brand,
    filterCriteria.search,
    filterCriteria.productType,
    filterCriteria.category,
    filterCriteria.status,
  ]);

  useEffect(() => {
    const node = loadMoreRef.current;
    const root = listScrollRef.current;
    if (!node || !root || dataSource === 'api' || visibleCount >= totalCount) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setVisibleCount((n) => (n >= totalCount ? n : Math.min(totalCount, n + pageSize)));
      },
      { root, rootMargin: '180px' },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [visibleCount, totalCount, pageSize, viewMode, dataSource]);

  // Bulk Actions Execution (Spec Section 11)
  const handleApplyBulkAction = async () => {
    if (selectedProductIds.length === 0) {
      toast(isAr ? 'يرجى تحديد منتجات أولاً' : 'Please select products first', 'info');
      return;
    }
    if (!bulkAction) {
      toast(isAr ? 'يرجى اختيار إجراء من القائمة' : 'Please select an action from the dropdown', 'info');
      return;
    }

    if (bulkAction === 'publish') {
      selectedProductIds.forEach((id) => {
        updateProduct(id, { status: 'published', isActive: true }, activeStore.id);
      });
      toast(isAr ? `تم نشر${selectedProductIds.length}منتج بنجاح` : `Published ${selectedProductIds.length} products successfully`, 'success');
      setSelectedProductIds([]);
    } else if (bulkAction === 'draft') {
      selectedProductIds.forEach((id) => {
        updateProduct(id, { status: 'draft', isActive: false }, activeStore.id);
      });
      toast(isAr ? `تم تحويل${selectedProductIds.length}منتج إلى مسودة` : `Moved ${selectedProductIds.length} products to draft`, 'success');
      setSelectedProductIds([]);
    } else if (bulkAction === 'delete') {
      const ok = await confirm({
        title: isAr ? 'حذف المنتجات المحددة' : 'Delete Selected Products',
        message: isAr
          ? `هل أنت متأكد من حذف${selectedProductIds.length}منتج محدد نهائياً؟`
          : `Are you sure you want to permanently delete ${selectedProductIds.length} selected products?`,
        confirmLabel: isAr ? 'حذف المنتجات' : 'Delete Products',
        danger: true,
      });
      if (ok) {
        selectedProductIds.forEach((id) => {
          deleteProduct(id, activeStore.id);
        });
        toast(isAr ? `تم حذف${selectedProductIds.length}منتج` : `Deleted ${selectedProductIds.length} products`, 'success');
        setSelectedProductIds([]);
      }
    }
  };

  // Inline field update handler (Spec Section 8)
  const handleInlineFieldChange = (productId: string, field: keyof Product, value: any) => {
    updateProduct(productId, { [field]: value }, activeStore.id);
  };

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

  // Open Edit Mode (Side Drawer or Full View)
  const handleOpenEdit = (product: Product, openAsFullPage = false) => {
    setCreatingProduct(null);
    setEditingProductId(product.id);
    if (openAsFullPage) {
      setCurrentView('edit');
      setIsSideDrawerOpen(false);
    } else {
      setIsSideDrawerOpen(true);
    }
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
    setCreatingProduct(null);
    setEditingProductId(null);
    setCurrentView('type-picker');
  };

  // Open blank product editor for selected type (manual fill — no auto fake create)
  const handleCreateProductWithType = (typeKey: string, typeTitle: string) => {
    if (!sub.writable) {
      toast(sub.message ?? t('subNotWritable'), 'error');
      return;
    }
    if (!planGate.ok) {
      toast(planGate.message, 'error');
      return;
    }

    const noShippingTypes = new Set([
      'digital-product',
      'gift-card',
      'custom-service',
      'booking',
      'template',
    ]);

    const draft: Product = {
      id: `draft-${Date.now()}`,
      storeId: activeStore.id,
      name: '',
      sku: '',
      category: categories[0] || 'General',
      price: 0,
      discountedPrice: 0,
      costPrice: 0,
      taxRate: 15,
      stock: 0,
      status: 'draft',
      isActive: true,
      isStale: false,
      publishedAt: '',
      image: '',
      galleryUrls: [],
      description: '',
      subtitle: '',
      productType: typeTitle,
      type: typeKey,
      brand: '',
      countryOfOrigin: 'Saudi Arabia',
      requiresShipping: !noShippingTypes.has(typeKey),
      trackInventory: typeKey !== 'digital-product' && typeKey !== 'gift-card',
      salesCount: 0,
      customUrl: '',
      seoTitle: '',
      seoDescription: '',
      tags: [],
      isFeatured: false,
    };

    setCreatingProduct(draft);
    setEditingProductId(null);
    setIsSideDrawerOpen(false);
    setCurrentView('edit');
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
      name: isAr ? `${product.name}(نسخة)` : `${product.name} (Copy)`,
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
        mode={isCreatingProduct ? 'create' : 'edit'}
        storeName={activeStore.name}
        storeSlug={activeStore.slug}
        storeId={activeStore.id}
        canMutate={sub.writable}
        categories={categories}
        availableBrands={availableStoreBrands.map((b: any) => (typeof b === 'string' ? b : (b.nameEn || b.nameAr || '')))}
        visibleSections={visibleEditSections}
        onVisibleSectionsChange={applyEditSectionVisibility}
        onBack={() => {
          if (isCreatingProduct) {
            setCreatingProduct(null);
            setCurrentView('type-picker');
            return;
          }
          setCurrentView('list');
          setEditingProductId(null);
        }}
        onSave={(updatedData) => {
          if (isCreatingProduct) {
            const { id: _id, storeId: _storeId, publishedAt: _publishedAt, isStale: _isStale, ...restDraft } =
              editingProduct;
            addProduct(
              {
                ...restDraft,
                ...updatedData,
                name: (updatedData.name ?? restDraft.name ?? '').trim(),
                sku: (updatedData.sku ?? restDraft.sku ?? '').trim(),
                status: updatedData.status ?? 'draft',
                isActive: updatedData.isActive ?? true,
                image: updatedData.image || FALLBACK_PRODUCT_IMAGE,
                galleryUrls: (updatedData.galleryUrls || []).filter(Boolean),
                salesCount: 0,
              },
              activeStore.id,
            );
            setCreatingProduct(null);
            setEditingProductId(null);
            setCurrentView('list');
            toast(t('productCreatedSuccess'), 'success');
            return;
          }
          updateProduct(editingProduct.id, updatedData, activeStore.id);
          toast(t('productSavedSuccess'), 'success');
        }}
        onDelete={() => {
          if (isCreatingProduct) {
            setCreatingProduct(null);
            setCurrentView('type-picker');
            return;
          }
          handleDeleteProduct(editingProduct);
        }}
        onDuplicate={
          isCreatingProduct
            ? undefined
            : (prod) => {
                const duplicateId = `prod_${Date.now()}`;
                const duplicateProduct: Product = {
                  ...prod,
                  id: duplicateId,
                  storeId: activeStore.id,
                  name: isAr ? `${prod.name}(نسخة)` : `${prod.name} (Copy)`,
                  sku: `${prod.sku}-COPY`,
                  publishedAt: new Date().toISOString(),
                  isStale: false,
                };
                addProduct(duplicateProduct, activeStore.id);
                setEditingProductId(duplicateId);
                toast(isAr ? 'تم نسخ المنتج بنجاح' : 'Product duplicated successfully', 'success');
              }
        }
      />
    );
  }

  // VIEW 3: PRODUCT TYPE PICKER (Image 4 Exact)
  if (currentView === 'type-picker') {
    return (
      <ProductTypePicker
        onSelectType={(key, title) => handleCreateProductWithType(key, title)}
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
          description: isAr ? `منتج مستعاد:${item.name}` : `Restored product: ${item.name}`,
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
              description: isAr ? `منتج مستعاد:${item.name}` : `Restored product: ${item.name}`,
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentView('list')}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-2 cursor-pointer"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{isAr ? 'المنتجات فقط' : 'Products Only'}</span>
          </button>
        </div>

        {/* ── 1. The Exact Filters Header & Card (100% Pixel-Perfect to Reference Screenshot) ── */}
        <ProductFiltersPanel
          storeId={activeStore.id}
          criteria={filterCriteria}
          onCriteriaChange={setFilterCriteria}
          onApply={() => {
            setCurrentView('list');
            toast(isAr ? 'تم تطبيق الفلاتر على قائمة المنتجات' : 'Filters applied to catalog', 'success');
          }}
          onClear={() => {
            setFilterCriteria({
              channel: 'All',
              brand: 'All',
              search: '',
              productType: 'All',
              category: 'All',
              status: 'All',
            });
            setSelectedCategory('all');
          }}
          availableBrands={availableStoreBrands}
          availableCategories={categories}
          showHeader={true}
          onNavigateBack={() => setCurrentView('list')}
        />


        {/* ── CARD 2: Deleted Products ── */}
        <div className="p-5 bg-white dark:bg-[#071E26] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {isAr ? 'المنتجات المحذوفة' : 'Deleted Products'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isAr
                    ? 'عرض واستعادة المنتجات المحذوفة من متجرك.'
                    : 'View and restore products that have been deleted from your store.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={isAr ? 'بحث في المنتجات المحذوفة...' : 'Search deleted products...'}
                  value={searchDeleted}
                  onChange={(e) => setSearchDeleted(e.target.value)}
                  className="ps-8 pe-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handlePermanentDeleteSelected}
                disabled={selectedDeletedIds.length === 0}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-rose-300 hover:text-rose-600 disabled:opacity-40 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'حذف نهائي' : 'Permanent Delete'}</span>
              </button>

              <button
                type="button"
                onClick={handleRestoreSelected}
                disabled={selectedDeletedIds.length === 0}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isAr ? 'استعادة المحدد' : 'Restore Selected'}</span>
              </button>
            </div>
          </div>

          {/* Deleted Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-[11px] bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={pagedDeleted.length > 0 && selectedDeletedIds.length === pagedDeleted.length}
                      onChange={handleToggleSelectAllDeleted}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 font-semibold">{isAr ? 'المنتج' : 'Product'}</th>
                  <th className="py-3 px-3 font-semibold">{isAr ? 'النوع' : 'Type'}</th>
                  <th className="py-3 px-3 font-semibold">{isAr ? 'السعر' : 'Price'}</th>
                  <th className="py-3 px-3 font-semibold">{isAr ? 'التصنيف' : 'Category'}</th>
                  <th className="py-3 px-3 font-semibold">{isAr ? 'تاريخ الحذف' : 'Deleted At'}</th>
                  <th className="py-3 px-4 text-center font-semibold">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {pagedDeleted.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                      {isAr ? 'لا توجد منتجات محذوفة' : 'No deleted products found in trash.'}
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
                              <div className="text-[10px] text-slate-400 font-mono">{isAr ? 'رمز المنتج' : 'SKU'}: {item.sku}</div>
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
                              <span>{isAr ? 'استعادة' : 'Restore'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeletedProducts((prev) => prev.filter((p) => p.id !== item.id));
                                toast(
                                  isAr ? 'تم الحذف النهائي للمنتج' : 'Product permanently deleted',
                                  'success',
                                );
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title={isAr ? 'حذف نهائي' : 'Delete permanently'}
                            >
                              <Trash2 className="w-4 h-4" />
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
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>{isAr ? 'عرض ١٠ عناصر' : 'Show 10 entries'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>
                {isAr
                  ? `عرض ١ –${pagedDeleted.length}من${deletedProducts.length}منتج محذوف`
                  : `Showing 1 – ${pagedDeleted.length} of ${deletedProducts.length} deleted products`}
              </span>
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
    <AdminPageShell className="max-w-[1600px] mx-auto flex flex-col -mb-16 pb-4">
      {/* All-Products subnav toolbar removed — navigation via sidebar + header actions */}
      <ConnectedWorkspaceBanner page="products" />

      {/* ── TOP HEADER — Title & Subtitle + Search + Bulk Upload + Add Product Button ── */}
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
          {/* Plan Limit Info Pill */}
          <div
            className="px-3 py-1.5 rounded-xl border text-[11px] font-bold"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--muted)',
            }}
          >
            {planInfo.name}: {currentProducts.length} / {planInfo.productLimit === Infinity ? '∞' : planInfo.productLimit}
          </div>

          {/* Search Input matching mockup 06 */}
          <div className="relative w-full sm:w-auto min-w-0 sm:min-w-[220px] md:min-w-[280px] grow sm:grow-0">
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

          <button
            type="button"
            onClick={() => setCurrentView('filters')}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-2 shadow-xs cursor-pointer transition-all hover:opacity-90 shrink-0"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            <Filter className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'الفلاتر' : 'Filters'}</span>
          </button>

          {/* Multiple Upload Google Sheet / CSV */}
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-2 shadow-xs cursor-pointer transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shrink-0"
            style={{ background: 'var(--surface)' }}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{isAr ? 'استيراد منتجات' : 'Import Products'}</span>
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

      {/* ── 4 KPI CARDS DEDICATED GRID (Mockup 06 - Soft Pastel Tints & High Contrast) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 min-w-0">
        {/* Card 1: Total Products (Soft Blue) */}
        <div className="bg-blue-50/70 hover:bg-blue-50/90 dark:bg-blue-950/30 p-3 sm:p-5 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 shadow-2xs flex flex-col justify-between transition-all min-w-0">
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
            {kpi.totalGrowth.hasData ? (
              <span className={`text-xs font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-md ${
                kpi.totalGrowth.pct >= 0
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/50'
                  : 'text-rose-700 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-950/50'
              }`}>
                {kpi.totalGrowth.pct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{Math.abs(kpi.totalGrowth.pct)}%</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Card 2: Active (Soft Emerald) */}
        <div className="bg-emerald-50/70 hover:bg-emerald-50/90 dark:bg-emerald-950/30 p-3 sm:p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs flex flex-col justify-between transition-all min-w-0">
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
            {kpi.activeGrowth.hasData ? (
              <span className={`text-xs font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-md ${
                kpi.activeGrowth.pct >= 0
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/50'
                  : 'text-rose-700 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-950/50'
              }`}>
                {kpi.activeGrowth.pct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{Math.abs(kpi.activeGrowth.pct)}%</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Card 3: Out of Stock (Soft Rose) */}
        <div className="bg-rose-50/70 hover:bg-rose-50/90 dark:bg-rose-950/30 p-3 sm:p-5 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 shadow-2xs flex flex-col justify-between transition-all min-w-0">
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
            {kpi.outOfStockGrowth.hasData ? (
              <span className={`text-xs font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-md ${
                kpi.outOfStockGrowth.pct >= 0
                  ? 'text-rose-700 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-950/50'
                  : 'text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/50'
              }`}>
                {kpi.outOfStockGrowth.pct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{Math.abs(kpi.outOfStockGrowth.pct)}%</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Card 4: Draft (Soft Purple) */}
        <div className="bg-purple-50/70 hover:bg-purple-50/90 dark:bg-purple-950/30 p-3 sm:p-5 rounded-2xl border border-purple-200/80 dark:border-purple-900/40 shadow-2xs flex flex-col justify-between transition-all min-w-0">
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

      {/* ── CATALOG CONTAINER (TABLE OR GRID) + SIDE DRAWER (Screenshot 2 Exact) ── */}
      <div className={isSideDrawerOpen && editingProduct ? 'flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-0' : 'flex-1 flex flex-col w-full min-h-0'}>
        {/* Main Catalog View (Left Column if Drawer Open) */}
        <div className={isSideDrawerOpen && editingProduct ? 'lg:col-span-7 xl:col-span-8 min-w-0 flex flex-col min-h-0' : 'w-full flex flex-col flex-1 min-h-0'}>
          {/* ── PRODUCTS TABLE / GRID CARD CONTAINER (Makdah Flowers Spec & Mockup 06 Exact) ── */}
          <div
            className="bg-white dark:bg-[#071E26] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-visible flex flex-col flex-1"
            style={{ minHeight: 'calc(100dvh - 18rem)' }}
          >
            {/* ── TABLE TOOLBAR (Spec Section 6 & 9) ── */}
            <div
              className="p-3 border-b border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-20 overflow-visible"
              style={{ background: 'var(--surface)' }}
            >
              {/* Left: Bulk Selection & Actions & Grid/List View Toggles */}
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pagedProducts.length > 0 && selectedProductIds.length === pagedProducts.length}
                    onChange={toggleSelectAll}
                    className="rounded cursor-pointer"
                  />
                  <span>{isAr ? 'تحديد الكل' : 'Select All'}</span>
                </label>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-xl border focus:outline-none"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  <option value="">{isAr ? 'عمليات تحديد' : 'Selection Operations'}</option>
                  <option value="publish">{isAr ? 'نشر المنتج' : 'Publish Product'}</option>
                  <option value="draft">{isAr ? 'تحويل إلى مسودة' : 'Convert to Draft'}</option>
                  <option value="delete">{isAr ? 'حذف المحدد' : 'Delete Selected'}</option>
                </select>
                <button
                  type="button"
                  onClick={handleApplyBulkAction}
                  disabled={selectedProductIds.length === 0}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer border"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  {isAr ? 'تطبيق' : 'Apply'}
                </button>

                {/* View Mode Switcher: Grid View & List View (matching Screenshot 2 & 3) */}
                <div className="flex items-center p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs ms-1">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('grid');
                      if (showColumnsPopover) closeFloatingPopovers();
                    }}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-[#0D7482] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title={isAr ? 'عرض شبكي' : 'Grid View'}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-[#0D7482] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title={isAr ? 'عرض جدولي' : 'List View'}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Edit Fields Filter — only while a product edit drawer is open */}
                {editPanelOpen && (
                <div className="relative shrink-0">
                  <button
                    ref={fieldsBtnRef}
                    type="button"
                    onClick={openFieldsFilterPopover}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors ${
                      showFieldsFilterPopover
                        ? 'bg-teal-50 border-teal-300 text-teal-700 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                    title={isAr ? 'تخصيص حقول التعديل الظاهرة' : 'Customize which edit fields are visible'}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تصفية الحقول' : 'Filter'}</span>
                  </button>
                </div>
                )}

                {selectedProductIds.length > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    {selectedProductIds.length} {isAr ? 'محدد' : 'selected'}
                  </span>
                )}
              </div>

              {/* Right: Inline Edit Switch (only in list view), Columns Popover */}
              <div className="flex items-center gap-2 flex-wrap justify-end relative z-30 min-w-0">
                {/* Inline Edit Switch (Spec Section 6 & 8) - only in table list view */}
                {viewMode === 'list' && (
                  <label
                    className="flex items-center gap-2 cursor-pointer px-2.5 py-1.5 rounded-xl border shadow-2xs"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? 'تعديل مباشر' : 'Inline Edit'}
                    </span>
                    <div className="relative inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={isInlineEdit}
                        onChange={(e) => setIsInlineEdit(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-teal-600"></div>
                    </div>
                    <div title={isAr ? 'تعديل حقول المنتجات مباشرة في الجدول مع الحفظ التلقائي' : 'Edit catalog fields inline with automatic persistence'} className="cursor-help">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </label>
                )}

                {/* Columns Customization — list/table view only (not grid) */}
                {viewMode === 'list' && (
                <div className="relative shrink-0">
                  <button
                    ref={columnsBtnRef}
                    type="button"
                    onClick={openColumnsPopover}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors ${
                      showColumnsPopover
                        ? 'bg-teal-50 border-teal-400 text-teal-800 dark:bg-teal-950/40 dark:border-teal-700 dark:text-teal-200'
                        : ''
                    }`}
                    style={
                      showColumnsPopover
                        ? undefined
                        : {
                            background: 'var(--surface)',
                            borderColor: 'var(--border)',
                            color: 'var(--text)',
                          }
                    }
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تخصيص الأعمدة' : 'Customize Columns'}</span>
                  </button>
                </div>
                )}

              </div>
            </div>

            {/* ── CONDITIONAL VIEW: GRID OR TABLE ── */}
            <div
              ref={listScrollRef}
              className="rounded-b-2xl relative z-0 flex-1 min-h-0 overflow-auto"
              style={{ maxHeight: 'calc(100dvh - 17rem)' }}
            >
            {viewMode === 'grid' ? (
              /* ── 1. GRID VIEW (Mockup 06 & Screenshot 2 Exact) ── */
              <div className="p-4 sm:p-5 flex-1">
                {pagedProducts.length === 0 ? (
                  <div className="py-16 text-center text-xs space-y-3" style={{ color: 'var(--muted)' }}>
                    <p>{emptyCatalogMessage}</p>
                    {(search.trim() ||
                      selectedCategory !== 'all' ||
                      filterCriteria.channel !== 'All' ||
                      filterCriteria.brand !== 'All' ||
                      filterCriteria.status !== 'All' ||
                      filterCriteria.productType !== 'All' ||
                      filterCriteria.category !== 'All' ||
                      filterCriteria.search.trim()) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch('');
                          setSelectedCategory('all');
                          setFilterCriteria({
                            channel: 'All',
                            brand: 'All',
                            search: '',
                            productType: 'All',
                            category: 'All',
                            status: 'All',
                          });
                          setPage(1);
                        }}
                        className="text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                      >
                        {isAr ? 'مسح عوامل التصفية' : 'Clear filters'}
                      </button>
                    )}
                    {currentProducts.length === 0 && (
                      <button
                        type="button"
                        onClick={reloadCatalog}
                        className="text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer block mx-auto"
                      >
                        {isAr ? 'إعادة تحميل المنتجات' : 'Reload products'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    className={`grid gap-4 sm:gap-5 ${
                      isSideDrawerOpen && editingProduct
                        ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                        : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4'
                    }`}
                  >
                    {pagedProducts.map((prod) => {
                      const isChecked = selectedProductIds.includes(prod.id);
                      const isPublished = prod.status === 'published' || (prod as any).status === 'active';
                      const isEditing = editingProductId === prod.id && isSideDrawerOpen;

                      return (
                        <div
                          key={prod.id}
                          className={`rounded-2xl border transition-all duration-150 p-3.5 flex flex-col justify-between group relative ${
                            isEditing
                              ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/10 dark:bg-teal-950/20 shadow-sm'
                              : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#071E26] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                          }`}
                        >
                          {/* Top Controls Row inside Card */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            {/* Checkbox */}
                            <label className="cursor-pointer p-0.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectProduct(prod.id)}
                                className="rounded cursor-pointer w-4 h-4 text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-700"
                              />
                            </label>

                            {/* Top-Right Action Buttons (Edit, Copy, Trash, More) */}
                            <div className="flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                              {/* Edit Pencil */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(prod)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-teal-600 cursor-pointer transition-colors"
                                title={t('editProduct')}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Copy Duplicate */}
                              <button
                                type="button"
                                onClick={() => handleDuplicateProduct(prod)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer transition-colors"
                                title={isAr ? 'نسخ المنتج' : 'Duplicate'}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Trash */}
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(prod)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 cursor-pointer transition-colors"
                                title={t('deleteProduct')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {/* More 3-dots */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setActiveActionMenuId(activeActionMenuId === prod.id ? null : prod.id)}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer transition-colors"
                                  title={isAr ? 'المزيد' : 'More'}
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>

                                {activeActionMenuId === prod.id && (
                                  <div
                                    className="absolute end-0 top-full mt-1 z-50 w-40 rounded-xl border p-1 shadow-lg text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 animate-in fade-in duration-100"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleOpenEdit(prod, true);
                                        setActiveActionMenuId(null);
                                      }}
                                      className="w-full text-start px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                                      <span>{t('viewProduct')}</span>
                                    </button>
                                    {!isPublished ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          updateProduct(prod.id, { status: 'published', isActive: true }, activeStore.id);
                                          setActiveActionMenuId(null);
                                          toast(isAr ? 'تم نشر المنتج' : 'Product published', 'success');
                                        }}
                                        className="w-full text-start px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>{isAr ? 'نشر المنتج' : 'Publish Product'}</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          updateProduct(prod.id, { status: 'draft', isActive: false }, activeStore.id);
                                          setActiveActionMenuId(null);
                                          toast(isAr ? 'تم تحويل المنتج إلى مسودة' : 'Converted to draft', 'success');
                                        }}
                                        className="w-full text-start px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                                        <span>{isAr ? 'تحويل إلى مسودة' : 'Convert to Draft'}</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Product Image */}
                          <div
                            onClick={() => handleOpenEdit(prod)}
                            className="aspect-square w-full rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-center p-3 cursor-pointer group-hover:scale-[1.01] transition-transform overflow-hidden mb-3"
                          >
                            <img
                              src={prod.image || FALLBACK_PRODUCT_IMAGE}
                              alt={getProductDisplayName(prod, locale)}
                              onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                              className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                            />
                          </div>

                          {/* Grid: heading + subheading (SKU) only */}
                          <div>
                            <h4
                              onClick={() => handleOpenEdit(prod)}
                              title={getProductDisplayName(prod, locale)}
                              className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 mb-1"
                            >
                              {getProductDisplayName(prod, locale)}
                            </h4>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono font-medium">
                              {isAr ? 'رمز المنتج' : 'SKU'}: {prod.sku}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* ── 2. TABLE VIEW (Spec Section 7 & 8 - Responsive 2-Line Title & Crisp Gaps) ── */
              <div className="min-w-0">
                <table className="w-full text-start text-xs border-separate border-spacing-0">
                  <thead className="sticky top-0 z-10" style={{ background: 'var(--surface)' }}>
                    <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                      {/* Selection Checkbox */}
                      <th className="py-3 px-2 w-8 text-center" style={{ borderBottom: '1px solid var(--border)' }}>
                        <input
                          type="checkbox"
                          checked={pagedProducts.length > 0 && selectedProductIds.length === pagedProducts.length}
                          onChange={toggleSelectAll}
                          className="rounded cursor-pointer"
                        />
                      </th>

                      {/* Drag Handle Column when Inline Edit is Active */}
                      {isInlineEdit && (
                        <th className="py-3 px-1.5 w-6 text-center" style={{ borderBottom: '1px solid var(--border)' }}>
                          <span className="sr-only">{isAr ? 'إعادة ترتيب' : 'Reorder'}</span>
                        </th>
                      )}

                      {/* Image */}
                      {visibleColumns.image && (
                        <th className="py-3 px-1.5 w-10 text-center font-bold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {isAr ? 'الصورة' : 'Image'}
                        </th>
                      )}

                      {/* Product Name */}
                      {visibleColumns.name && (
                        <th className="py-3 px-2 text-start font-bold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {t('product')}
                        </th>
                      )}

                      {/* SKU */}
                      {visibleColumns.sku && (
                        <th className="py-3 px-1.5 xl:px-2 text-start font-bold text-[11px] hidden sm:table-cell" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          SKU
                        </th>
                      )}

                      {/* Price */}
                      {visibleColumns.price && (
                        <th className="py-3 px-1.5 xl:px-2 text-start font-bold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {isAr ? 'السعر (ر.س)' : 'Price (SAR)'}
                        </th>
                      )}

                      {/* Discount Price */}
                      {visibleColumns.salePrice && (
                        <th className="py-3 px-1.5 xl:px-2 text-start font-bold text-[11px] hidden md:table-cell" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {isAr ? 'سعر الخصم' : 'Discount Price (SAR)'}
                        </th>
                      )}

                      {/* Stock */}
                      {visibleColumns.stock && (
                        <th className="py-3 px-1.5 xl:px-2 text-start font-bold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {t('stockCount')}
                        </th>
                      )}

                      {/* Category */}
                      {visibleColumns.category && (
                        <th className="py-3 px-1.5 xl:px-2 text-start font-bold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {t('categoryLabel')}
                        </th>
                      )}

                      {/* Status */}
                      {visibleColumns.status && (
                        <th className="py-3 px-1.5 xl:px-2 text-start font-bold text-[11px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {isAr ? 'الحالة' : 'Status'}
                        </th>
                      )}

                      {/* Weight */}
                      {visibleColumns.weight && (
                        <th className="py-3 px-1.5 xl:px-2 text-start font-bold text-[11px] hidden lg:table-cell" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {isAr ? 'الوزن (كجم)' : 'Weight (kg)'}
                        </th>
                      )}

                      {/* Shipping Class */}
                      {visibleColumns.shippingClass && (
                        <th className="py-3 px-1.5 xl:px-2 text-start font-bold text-[11px] hidden xl:table-cell" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {isAr ? 'فئة الشحن' : 'Shipping Class'}
                        </th>
                      )}

                      {/* Actions */}
                      {visibleColumns.actions && (
                        <th className="py-3 px-2 text-center font-bold text-[11px] w-36 min-w-[136px]" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {isAr ? 'إجراءات' : 'Actions'}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="py-12 text-center text-xs" style={{ color: 'var(--muted)' }}>
                          <div className="space-y-3">
                            <p>{emptyCatalogMessage}</p>
                            {(search.trim() ||
                              selectedCategory !== 'all' ||
                              filterCriteria.channel !== 'All' ||
                              filterCriteria.brand !== 'All' ||
                              filterCriteria.status !== 'All' ||
                              filterCriteria.productType !== 'All' ||
                              filterCriteria.category !== 'All' ||
                              filterCriteria.search.trim()) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSearch('');
                                  setSelectedCategory('all');
                                  setFilterCriteria({
                                    channel: 'All',
                                    brand: 'All',
                                    search: '',
                                    productType: 'All',
                                    category: 'All',
                                    status: 'All',
                                  });
                                  setPage(1);
                                }}
                                className="text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                              >
                                {isAr ? 'مسح عوامل التصفية' : 'Clear filters'}
                              </button>
                            )}
                            {currentProducts.length === 0 && (
                              <button
                                type="button"
                                onClick={reloadCatalog}
                                className="text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                              >
                                {isAr ? 'إعادة تحميل المنتجات' : 'Reload products'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pagedProducts.map((prod) => {
                        const isChecked = selectedProductIds.includes(prod.id);
                        const isPublished = prod.status === 'published' || (prod as any).status === 'active';
                        const shippingClassVal = (prod as any).shippingClass || '';

                        return (
                          <tr
                            key={prod.id}
                            className="border-b hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            {/* Checkbox */}
                            <td className="py-2.5 px-2 text-center" style={{ borderBottom: '1px solid var(--border)' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectProduct(prod.id)}
                                className="rounded cursor-pointer"
                              />
                            </td>

                            {/* Drag Handle if Inline Edit is ON */}
                            {isInlineEdit && (
                              <td className="py-2.5 px-1.5 text-center" style={{ borderBottom: '1px solid var(--border)' }}>
                                <GripVertical className="w-3.5 h-3.5 text-slate-400 mx-auto cursor-grab" />
                              </td>
                            )}

                            {/* Image Thumbnail */}
                            {visibleColumns.image && (
                              <td className="py-2 px-1.5 text-center" style={{ borderBottom: '1px solid var(--border)' }}>
                                <img
                                  src={prod.image || FALLBACK_PRODUCT_IMAGE}
                                  alt={getProductDisplayName(prod, locale)}
                                  onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                                  className="w-8 h-8 rounded-lg object-contain border mx-auto bg-slate-50 dark:bg-slate-800 p-0.5"
                                  style={{ borderColor: 'var(--border)' }}
                                />
                              </td>
                            )}

                            {/* Product Name (2 to 3 Lines Responsive Wrap) */}
                            {visibleColumns.name && (
                              <td className="py-2.5 px-2" style={{ borderBottom: '1px solid var(--border)' }}>
                                {isInlineEdit ? (
                                  <input
                                    type="text"
                                    defaultValue={getProductDisplayName(prod, locale)}
                                    onBlur={(e) => handleInlineFieldChange(prod.id, 'name', e.target.value)}
                                    className="w-full min-w-[120px] max-w-[200px] px-2 py-1 text-xs font-semibold rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                  />
                                ) : (
                                  <div className="min-w-0 max-w-[130px] md:max-w-[170px] xl:max-w-[210px]">
                                    <span
                                      onClick={() => handleOpenEdit(prod)}
                                      title={getProductDisplayName(prod, locale)}
                                      className="font-bold text-xs line-clamp-2 sm:line-clamp-3 leading-snug break-words cursor-pointer hover:underline hover:text-teal-600 dark:hover:text-teal-400 block"
                                      style={{ color: 'var(--text)' }}
                                    >
                                      {getProductDisplayName(prod, locale)}
                                    </span>
                                  </div>
                                )}
                              </td>
                            )}

                            {/* SKU */}
                            {visibleColumns.sku && (
                              <td className="py-2.5 px-1.5 xl:px-2 hidden sm:table-cell" style={{ borderBottom: '1px solid var(--border)' }}>
                                {isInlineEdit ? (
                                  <input
                                    type="text"
                                    defaultValue={prod.sku}
                                    onBlur={(e) => handleInlineFieldChange(prod.id, 'sku', e.target.value)}
                                    className="w-20 px-1.5 py-1 text-xs font-mono font-bold rounded-lg border bg-white dark:bg-slate-900 uppercase focus:outline-none"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                  />
                                ) : (
                                  <span className="text-[11px] font-mono text-slate-400 font-bold break-all leading-tight block max-w-[85px] xl:max-w-[105px]" title={prod.sku}>
                                    {prod.sku}
                                  </span>
                                )}
                              </td>
                            )}

                            {/* Price */}
                            {visibleColumns.price && (
                              <td className="py-2.5 px-1.5 xl:px-2 whitespace-nowrap font-bold text-xs" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                                {isInlineEdit ? (
                                  <input
                                    type="number"
                                    min="0"
                                    defaultValue={prod.price}
                                    onBlur={(e) => handleInlineFieldChange(prod.id, 'price', Number(e.target.value))}
                                    className="w-18 px-1.5 py-1 text-xs font-bold font-mono rounded-lg border bg-white dark:bg-slate-900 focus:outline-none"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                  />
                                ) : (
                                  money(prod.price)
                                )}
                              </td>
                            )}

                            {/* Sale Price */}
                            {visibleColumns.salePrice && (
                              <td className="py-2.5 px-1.5 xl:px-2 whitespace-nowrap font-bold text-xs hidden md:table-cell" style={{ borderBottom: '1px solid var(--border)' }}>
                                {isInlineEdit ? (
                                  <input
                                    type="number"
                                    min="0"
                                    defaultValue={prod.discountedPrice ?? ''}
                                    placeholder="-"
                                    onBlur={(e) =>
                                      handleInlineFieldChange(
                                        prod.id,
                                        'discountedPrice',
                                        e.target.value ? Number(e.target.value) : null
                                      )
                                    }
                                    className="w-18 px-1.5 py-1 text-xs font-bold font-mono rounded-lg border bg-white dark:bg-slate-900 focus:outline-none"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                  />
                                ) : prod.discountedPrice ? (
                                  <span className="text-emerald-600 dark:text-emerald-400">
                                    {money(prod.discountedPrice)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            )}

                            {/* Stock with colored dot */}
                            {visibleColumns.stock && (
                              <td className="py-2.5 px-1.5 xl:px-2 whitespace-nowrap text-xs" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      prod.stock === 0
                                        ? 'bg-rose-500'
                                        : prod.stock < 10
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-500'
                                    }`}
                                    title={
                                      prod.stock === 0
                                        ? isAr
                                          ? 'نفدت الكمية'
                                          : 'Out of stock'
                                        : prod.stock < 10
                                          ? isAr
                                            ? 'مخزون منخفض'
                                            : 'Low stock'
                                          : isAr
                                            ? 'متوفر'
                                            : 'In stock'
                                    }
                                  />
                                  {isInlineEdit ? (
                                    <input
                                      type="number"
                                      min="0"
                                      defaultValue={prod.stock}
                                      onBlur={(e) => handleInlineFieldChange(prod.id, 'stock', Number(e.target.value))}
                                      className="w-14 px-1.5 py-1 text-xs font-mono font-bold rounded-lg border bg-white dark:bg-slate-900 focus:outline-none"
                                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                    />
                                  ) : (
                                    <span className="font-medium font-mono">{prod.stock}</span>
                                  )}
                                </div>
                              </td>
                            )}

                            {/* Category */}
                            {visibleColumns.category && (
                              <td className="py-2.5 px-1.5 xl:px-2 whitespace-nowrap font-medium text-xs" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                                {isInlineEdit ? (
                                  <select
                                    defaultValue={prod.category}
                                    onChange={(e) => handleInlineFieldChange(prod.id, 'category', e.target.value)}
                                    className="px-2 py-1 text-xs rounded-lg border bg-white dark:bg-slate-900 focus:outline-none"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                  >
                                    {categories.map((c) => (
                                      <option key={c} value={c}>
                                        {getProductDisplayCategory(c, locale)}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="line-clamp-2 break-words leading-tight text-xs max-w-[100px] xl:max-w-[130px]" title={getProductDisplayCategory(prod, locale)}>
                                    {getProductDisplayCategory(prod, locale)}
                                  </div>
                                )}
                              </td>
                            )}

                            {/* Status */}
                            {visibleColumns.status && (
                              <td className="py-2.5 px-1.5 xl:px-2 whitespace-nowrap text-xs" style={{ borderBottom: '1px solid var(--border)' }}>
                                {isInlineEdit ? (
                                  <select
                                    defaultValue={prod.status}
                                    onChange={(e) => handleInlineFieldChange(prod.id, 'status', e.target.value as any)}
                                    className="px-2 py-1 text-xs font-bold rounded-lg border bg-white dark:bg-slate-900 focus:outline-none"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                  >
                                    <option value="published">{isAr ? 'منشور' : 'Published'}</option>
                                    <option value="draft">{isAr ? 'مسودة' : 'Draft'}</option>
                                  </select>
                                ) : (
                                  getStatusChip(prod.status, prod.stock)
                                )}
                              </td>
                            )}

                            {/* Weight (kg) */}
                            {visibleColumns.weight && (
                              <td className="py-2.5 px-1.5 xl:px-2 whitespace-nowrap text-xs hidden lg:table-cell" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                                {isInlineEdit ? (
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    defaultValue={prod.weightKg ?? 0.8}
                                    onBlur={(e) => handleInlineFieldChange(prod.id, 'weightKg', Number(e.target.value))}
                                    className="w-14 px-1.5 py-1 text-xs font-mono rounded-lg border bg-white dark:bg-slate-900 focus:outline-none"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                  />
                                ) : (
                                  <span className="font-mono text-slate-500">
                                    {prod.weightKg ?? 0.8} {isAr ? 'كجم' : 'kg'}
                                  </span>
                                )}
                              </td>
                            )}

                            {/* Shipping Class */}
                            {visibleColumns.shippingClass && (
                              <td className="py-2.5 px-1.5 xl:px-2 whitespace-nowrap text-xs hidden xl:table-cell" style={{ borderBottom: '1px solid var(--border)' }}>
                                {isInlineEdit ? (
                                  <select
                                    defaultValue={shippingClassVal}
                                    onChange={(e) => handleInlineFieldChange(prod.id, 'shippingClass' as any, e.target.value)}
                                    className="px-2 py-1 text-xs rounded-lg border bg-white dark:bg-slate-900 focus:outline-none"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                  >
                                    <option value="Shoes">{isAr ? 'أحذية' : 'Shoes'}</option>
                                    <option value="Small Items">{isAr ? 'قطع صغيرة' : 'Small Items'}</option>
                                    <option value="Medium Item">{isAr ? 'قطعة متوسطة' : 'Medium Item'}</option>
                                    <option value="Electronics">{isAr ? 'إلكترونيات' : 'Electronics'}</option>
                                    <option value="Flowers">{isAr ? 'ورود' : 'Flowers'}</option>
                                  </select>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 max-w-[85px] truncate block" title={shippingClassVal}>
                                    {isAr
                                      ? shippingClassVal === 'Shoes'
                                        ? 'أحذية'
                                        : shippingClassVal === 'Small Items'
                                          ? 'قطع صغيرة'
                                          : shippingClassVal === 'Medium Item'
                                            ? 'قطعة متوسطة'
                                            : shippingClassVal === 'Electronics'
                                              ? 'إلكترونيات'
                                              : shippingClassVal === 'Flowers'
                                                ? 'ورود'
                                                : shippingClassVal
                                      : shippingClassVal}
                                  </span>
                                )}
                              </td>
                            )}

                            {/* Actions */}
                            {visibleColumns.actions && (
                              <td className="py-2.5 px-2 text-center whitespace-nowrap relative w-36 min-w-[136px]" style={{ borderBottom: '1px solid var(--border)' }}>
                                <div className="inline-flex items-center justify-center gap-1.5 w-full">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(prod)}
                                    className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-xs transition-colors"
                                    style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}
                                    title={t('editProduct')}
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateProduct(prod)}
                                    className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-xs transition-colors"
                                    style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                                    title={isAr ? 'نسخ المنتج' : 'Duplicate Product'}
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(prod)}
                                    className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shadow-xs transition-colors"
                                    title={t('deleteProduct')}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => setActiveActionMenuId(activeActionMenuId === prod.id ? null : prod.id)}
                                      className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-xs transition-colors"
                                      style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                                      title={isAr ? 'المزيد' : 'More Options'}
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
                                            handleOpenEdit(prod, true);
                                            setActiveActionMenuId(null);
                                          }}
                                          className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                        >
                                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                                          <span>{t('viewProduct')}</span>
                                        </button>
                                        {!isPublished ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              updateProduct(prod.id, { status: 'published', isActive: true }, activeStore.id);
                                              setActiveActionMenuId(null);
                                              toast(isAr ? 'تم نشر المنتج' : 'Product published', 'success');
                                            }}
                                            className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                          >
                                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                                            <span>{isAr ? 'نشر المنتج' : 'Publish Product'}</span>
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              updateProduct(prod.id, { status: 'draft', isActive: false }, activeStore.id);
                                              setActiveActionMenuId(null);
                                              toast(isAr ? 'تم تحويل المنتج إلى مسودة' : 'Converted to draft', 'success');
                                            }}
                                            className="w-full text-start px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                          >
                                            <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                                            <span>{isAr ? 'تحويل إلى مسودة' : 'Convert to Draft'}</span>
                                          </button>
                                        )}
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
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {dataSource !== 'api' && revealedCount < totalCount ? <div ref={loadMoreRef} className="h-8" aria-hidden /> : null}
            </div>

            {/* ── PAGINATION CONTROLS MATCHING MOCKUP 06 ── */}
            <div className="mt-auto">
            <WindowedPagination
              currentPage={safePage}
              totalPages={pageCount}
              totalCount={totalCount}
              pageSize={pageSize}
              shownCount={revealedCount}
              onPageChange={(next) => {
                setPage(next);
                setVisibleCount(next * pageSize);
                listScrollRef.current?.scrollTo({ top: 0 });
              }}
              onPageSizeChange={setPageSize}
              isAr={isAr}
              itemLabel={isAr ? 'منتج' : 'products'}
              pageSizeOptions={[20, 50, 100]}
            />
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: PRODUCT EDIT DRAWER (MATCHING SCREENSHOT 2) ── */}
        {isSideDrawerOpen && editingProduct && (
          <div className="lg:col-span-5 xl:col-span-4 min-w-0">
            <ProductEditDrawer
              isOpen={isSideDrawerOpen}
              product={editingProduct}
              storeId={activeStore.id}
              categories={categories}
              availableBrands={availableStoreBrands}
              visibleSections={visibleEditSections}
              onClose={() => {
                setIsSideDrawerOpen(false);
                setEditingProductId(null);
              }}
              onSave={(updatedData) => {
                updateProduct(editingProduct.id, updatedData, activeStore.id);
                toast(t('productSavedSuccess'), 'success');
                setIsSideDrawerOpen(false);
                setEditingProductId(null);
              }}
              onExpandFullView={() => {
                setIsSideDrawerOpen(false);
                setCurrentView('edit');
              }}
              onDelete={() => {
                setIsSideDrawerOpen(false);
                handleDeleteProduct(editingProduct);
              }}
              onDuplicate={() => {
                handleDuplicateProduct(editingProduct);
              }}
            />
          </div>
        )}
      </div>

      {/* Body-portal menus — anchored to trigger (never mid-screen / clipped) */}
      <FloatingPopover
        open={showFieldsFilterPopover}
        anchorRef={fieldsBtnRef}
        onClose={closeFloatingPopovers}
        width={288}
        align="start"
        estimatedHeight={360}
        className="rounded-2xl border shadow-xl p-3 space-y-2.5"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="font-bold text-xs text-slate-900 dark:text-white block">
              {isAr ? 'تصفية حقول التعديل' : 'Filter Edit Fields'}
            </span>
            <span className="text-[10px] text-slate-500">
              {isAr
                ? 'إيقاف أي قسم يخفيه من لوحة التعديل فوراً'
                : 'Turn off a section to hide it from the edit panel'}
            </span>
          </div>
          <button
            type="button"
            onClick={closeFloatingPopovers}
            className="text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1 custom-scroll pe-1">
          {PRODUCT_EDIT_SECTION_OPTIONS.map((opt) => {
            const isOn = visibleEditSections[opt.id] !== false;
            return (
              <label
                key={opt.id}
                className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
              >
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {isAr ? opt.labelAr : opt.labelEn}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isOn}
                  onClick={(e) => {
                    e.preventDefault();
                    applyEditSectionVisibility({
                      ...visibleEditSections,
                      [opt.id]: !isOn,
                    });
                  }}
                  className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${
                    isOn ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full bg-white shadow block transition-transform transform ${
                      isOn ? 'translate-x-3.5 rtl:-translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>
            );
          })}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={() => applyEditSectionVisibility({ ...DEFAULT_PRODUCT_EDIT_SECTIONS })}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline cursor-pointer"
          >
            {isAr ? 'إظهار الكل' : 'Show All'}
          </button>
        </div>
      </FloatingPopover>

      <FloatingPopover
        open={showColumnsPopover}
        anchorRef={columnsBtnRef}
        onClose={closeFloatingPopovers}
        width={256}
        align="end"
        estimatedHeight={360}
        className="rounded-2xl border shadow-xl p-3 space-y-2.5"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="font-bold text-xs text-slate-900 dark:text-white">
            {isAr ? 'تخصيص الأعمدة' : 'Customize Columns'}
          </span>
          <button
            type="button"
            onClick={closeFloatingPopovers}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isAr ? 'بحث في الأعمدة...' : 'Search columns...'}
            value={columnSearch}
            onChange={(e) => setColumnSearch(e.target.value)}
            className="w-full ps-8 pe-2.5 py-1 text-xs rounded-lg border focus:outline-none"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          />
        </div>

        <div className="max-h-52 overflow-y-auto space-y-1.5 custom-scroll pe-1">
          {[
            { id: 'image', label: isAr ? 'الصورة' : 'Image' },
            { id: 'name', label: isAr ? 'اسم المنتج' : 'Product Name' },
            { id: 'sku', label: isAr ? 'رمز المنتج' : 'SKU' },
            { id: 'price', label: isAr ? 'السعر (ر.س)' : 'Price (SAR)' },
            { id: 'salePrice', label: isAr ? 'سعر الخصم' : 'Discount Price (SAR)' },
            { id: 'stock', label: isAr ? 'المخزون' : 'Stock' },
            { id: 'category', label: isAr ? 'التصنيف' : 'Category' },
            { id: 'status', label: isAr ? 'الحالة' : 'Status' },
            { id: 'weight', label: isAr ? 'الوزن (كجم)' : 'Weight (kg)' },
            { id: 'shippingClass', label: isAr ? 'فئة الشحن' : 'Shipping Class' },
            { id: 'actions', label: isAr ? 'إجراءات' : 'Actions' },
          ]
            .filter((c) => c.label.toLowerCase().includes(columnSearch.toLowerCase()))
            .map((col) => (
              <label
                key={col.id}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
              >
                <span className="text-slate-700 dark:text-slate-300 font-medium">{col.label}</span>
                <input
                  type="checkbox"
                  checked={visibleColumns[col.id] !== false}
                  onChange={(e) =>
                    setVisibleColumns((prev) => ({
                      ...prev,
                      [col.id]: e.target.checked,
                    }))
                  }
                  className="rounded cursor-pointer"
                />
              </label>
            ))}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setVisibleColumns({
                image: true,
                name: true,
                sku: true,
                price: true,
                salePrice: true,
                stock: true,
                category: true,
                status: true,
                weight: true,
                shippingClass: true,
                actions: true,
              });
              setColumnSearch('');
            }}
            className="text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
          >
            {isAr ? 'إعادة ضبط للافتراضي' : 'Reset to Default'}
          </button>
        </div>
      </FloatingPopover>

      {/* ── BULK PRODUCT UPLOAD & EXPORT MODAL ── */}
      <BulkProductUploadModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onImportProducts={handleBulkImport}
        currentProducts={currentProducts}
        storeName={activeStore.name}
        storeId={activeStore.id}
      />
    </AdminPageShell>
  );
};

