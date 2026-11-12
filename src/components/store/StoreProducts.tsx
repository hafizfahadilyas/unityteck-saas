import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { FloatingPopover } from '../common/FloatingPopover';
import {
  fetchProductsPage,
  fetchStorefrontCatalogPage,
  fetchCategories,
  restoreProduct as restoreProductApi,
  forceDeleteProduct as forceDeleteProductApi,
} from '../../api/tenantApi';
import { isApiEnabled } from '../../api/client';
import type { Product, StoreCategory } from '../../types';
import { usePrefs } from '../../i18n/PrefsContext';
import { AdminPageShell } from '../common/AdminPageHeader';
import { GlobalModal } from '../common/GlobalModal';
import { productCategoryPickerOptions } from '../../utils/categoryHierarchy';
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
} from './ProductEditDrawer';
import { ProductFiltersPanel, type ProductFilterCriteria } from './ProductFiltersPanel';
import { getProductChannelLabel } from '../../config/productChannels';
import { resolveGoogleTaxonomyLabel } from '../../config/googleProductTaxonomy';
import { mergeProductCatalogExtras } from '../../utils/productCatalogExtras';

/**
 * StoreProducts — Store Admin Products & Catalog Directory & Editor
 * 100% Pixel Perfect to Mockup 06 (Products List) and Mockup 07 (Product Edit)
 * Scoped strictly to activeStore.id with plan limits and zero stale state.
 */
export interface StoreProductsProps {
  onNavigateTab?: (tab: string) => void;
}

export const StoreProducts: React.FC<StoreProductsProps> = ({ onNavigateTab }) => {
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

  // Navigation / View State: 'list' | 'edit' | 'brands' | 'filters'
  const [currentView, setCurrentView] = useState<'list' | 'edit' | 'brands' | 'filters'>('list');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  /** Grid density: products per row on large screens (3–6). */
  const [gridCols, setGridCols] = useState<3 | 4 | 5 | 6>(3);
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
  /** Admin catalog: up to 100 rows per page, then next page. */
  const [pageSize, setPageSize] = useState(100);
  const listScrollRef = useRef<HTMLDivElement | null>(null);

  // Makdah Flowers Catalog Table & Inline Edit State (Spec Section 6 & 9)
  const [isInlineEdit, setIsInlineEdit] = useState(false);
  const [showColumnsPopover, setShowColumnsPopover] = useState(false);
  const [columnSearch, setColumnSearch] = useState('');
  const [bulkAction, setBulkAction] = useState<string>('');
  const columnsBtnRef = useRef<HTMLButtonElement>(null);
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
    brand: true,
    productType: true,
    googleCategories: true,
    salesChannels: true,
    discountStartDate: true,
    discountEndDate: true,
    actions: true,
  });

  const formatProductDate = (value: string | null | undefined) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return raw.slice(0, 10);
  };

  /** All edit sections stay visible — no Filter toggles on product edit. */
  const visibleEditSections = DEFAULT_PRODUCT_EDIT_SECTIONS;

  const openColumnsPopover = () => {
    setShowColumnsPopover((v) => !v);
  };

  const closeFloatingPopovers = () => {
    setShowColumnsPopover(false);
  };

  const [catalogBusy, setCatalogBusy] = useState(false);

  const rowCacheRef = useRef<Record<string, Product[]>>({});
  const catalogReqSeqRef = useRef(0);

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

  /** Side-edit open → hide secondary cols so the list pane stays readable. */
  const tableCompact = Boolean(isSideDrawerOpen && editingProductId);

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
    const reqId = (catalogReqSeqRef.current += 1);
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
    const applyPage = (res: {
      data: Product[];
      meta: { total: number; last_page: number; counts?: Record<string, number> | null };
    }) => {
      if (cancelled || reqId !== catalogReqSeqRef.current) return;
      const enriched = (res.data || []).map((row) =>
        mergeProductCatalogExtras(activeStore.id, row),
      );
      rowCacheRef.current[activeStore.id] = enriched;
      setApiRows(enriched);
      setApiTotal(res.meta.total);
      setApiLastPage(res.meta.last_page);
      if (res.meta.counts) setApiCounts(res.meta.counts as any);
    };
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
        .then((res) => applyPage(res))
        .catch(async () => {
          if (cancelled || reqId !== catalogReqSeqRef.current) return;
          try {
            // Admin /products timed out or aborted — public catalog keeps the table usable.
            const catalog = await fetchStorefrontCatalogPage(activeStore.id, page, pageSize);
            applyPage({
              data: catalog.data,
              meta: {
                total: catalog.total,
                last_page: catalog.lastPage,
              },
            });
            return;
          } catch {
            /* fall through to cache */
          }
          const cached = rowCacheRef.current[activeStore.id];
          if (cached?.length) {
            setApiRows(cached.map((row) => mergeProductCatalogExtras(activeStore.id, row)));
          }
        })
        .finally(() => {
          // Clear busy for this request generation only — never leave "Loading…" stuck.
          if (reqId === catalogReqSeqRef.current) setCatalogBusy(false);
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
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [recycleBusy, setRecycleBusy] = useState(false);

  type TrashRow = {
    id: string;
    name: string;
    sku: string;
    productType: string;
    price: number;
    category: string;
    deletedAt: string;
    image?: string;
    rawProduct?: Product;
  };

  const toTrashRow = useCallback(
    (p: Product, deletedAt?: string): TrashRow => ({
      id: p.id,
      name: getProductDisplayName(p, locale) || p.name || '',
      sku: p.sku || '',
      productType: p.productType || (p as { type?: string }).type || (isAr ? 'منتج' : 'Product'),
      price: Number(p.price) || 0,
      category: getProductDisplayCategory(p, locale) || p.category || '',
      deletedAt: deletedAt || new Date().toLocaleString(isAr ? 'ar-SA' : 'en-US'),
      image: p.image || '',
      rawProduct: p,
    }),
    [locale, isAr],
  );

  const refreshRecycleBin = useCallback(async () => {
    if (!activeStore?.id || dataSource !== 'api' || !isApiEnabled()) return;
    try {
      const page = await fetchProductsPage(activeStore.id, {
        status: 'archived',
        per_page: 100,
        page: 1,
      });
      const rows = (page.data || []).map((p) =>
        toTrashRow(p, p.publishedAt || new Date().toISOString()),
      );
      setDeletedProducts(rows);
    } catch {
      /* keep last trash list */
    }
  }, [activeStore?.id, dataSource, toTrashRow]);

  useEffect(() => {
    setDeletedProducts([]);
    setSelectedDeletedIds([]);
    void refreshRecycleBin();
  }, [activeStore?.id, refreshRecycleBin]);

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

  // Store taxonomy (roots + subcategories) — not only categories already used on products
  const [storeCategoryRows, setStoreCategoryRows] = useState<StoreCategory[]>([]);

  const reloadStoreCategories = useCallback(async () => {
    const sid = activeStore?.id;
    if (!sid) {
      setStoreCategoryRows([]);
      return;
    }
    try {
      if (isApiEnabled()) {
        const list = await fetchCategories(sid, { all: true });
        setStoreCategoryRows(Array.isArray(list) ? list : []);
        return;
      }
      const raw = localStorage.getItem(`unityteck_store_categories_${sid}`);
      if (raw) {
        const parsed = JSON.parse(raw) as StoreCategory[];
        setStoreCategoryRows(Array.isArray(parsed) ? parsed : []);
      } else {
        setStoreCategoryRows([]);
      }
    } catch {
      setStoreCategoryRows([]);
    }
  }, [activeStore?.id]);

  useEffect(() => {
    void reloadStoreCategories();
    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { storeId?: string; categories?: StoreCategory[] }
        | undefined;
      if (detail?.storeId && detail.storeId !== activeStore.id) return;
      if (Array.isArray(detail?.categories)) {
        setStoreCategoryRows(detail.categories);
        return;
      }
      void reloadStoreCategories();
    };
    window.addEventListener('unityteck-categories-updated', onUpdated as EventListener);
    window.addEventListener('unityteck-data', onUpdated as EventListener);
    return () => {
      window.removeEventListener('unityteck-categories-updated', onUpdated as EventListener);
      window.removeEventListener('unityteck-data', onUpdated as EventListener);
    };
  }, [activeStore.id, reloadStoreCategories]);

  const categoryOptions = useMemo(
    () => productCategoryPickerOptions(storeCategoryRows, isAr),
    [storeCategoryRows, isAr],
  );

  // Unique category values for filters / pickers (taxonomy first, then any product-only leftovers)
  const categories = useMemo(() => {
    const set = new Set<string>();
    categoryOptions.forEach((o) => {
      if (o.value) set.add(o.value);
    });
    currentProducts.forEach((p) => {
      if (p.category) set.add(p.category);
      if (p.categoryEn) set.add(p.categoryEn);
      if (p.categoryAr) set.add(p.categoryAr);
    });
    return Array.from(set);
  }, [categoryOptions, currentProducts]);

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

      // Recycle-bin products stay out of the main catalog (open Recycle Bin modal instead).
      if (p.status === 'archived' && filterCriteria.status !== 'Archived') return false;

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

  // True page windows: Show 100 → rows 1–100 on page 1, 101–200 on page 2, etc.
  const totalCount = dataSource === 'api' ? apiTotal : sortedProducts.length;
  const pageCount =
    dataSource === 'api'
      ? Math.max(1, apiLastPage)
      : Math.max(1, Math.ceil((totalCount || 0) / pageSize) || 1);
  const safePage = Math.min(pageCount, Math.max(1, page));
  const pagedProducts = useMemo(() => {
    if (dataSource === 'api') {
      if (apiRows.length > 0) return apiRows;
      if (safePage <= 1 && currentProducts.length > 0 && !search.trim() && filterCriteria.search.trim() === '') {
        return currentProducts
          .slice(0, pageSize)
          .map((p) => mergeProductCatalogExtras(activeStore.id, p));
      }
      return apiRows;
    }
    const start = (safePage - 1) * pageSize;
    return sortedProducts.slice(start, start + pageSize);
  }, [
    dataSource,
    apiRows,
    sortedProducts,
    safePage,
    pageSize,
    currentProducts,
    search,
    filterCriteria.search,
  ]);

  useEffect(() => {
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
        title: isAr ? 'نقل إلى سلة المحذوفات' : 'Move to Recycle Bin',
        message: isAr
          ? `سيتم نقل ${selectedProductIds.length} منتج إلى سلة المحذوفات. يمكنك استعادتها لاحقاً.`
          : `${selectedProductIds.length} products will move to the Recycle Bin. You can restore them later.`,
        confirmLabel: isAr ? 'نقل إلى السلة' : 'Move to Bin',
        danger: true,
      });
      if (ok) {
        const moving = pagedProducts.filter((p) => selectedProductIds.includes(p.id));
        moving.forEach((p) => {
          setDeletedProducts((prev) => [toTrashRow(p), ...prev.filter((x) => x.id !== p.id)]);
          deleteProduct(p.id, activeStore.id);
        });
        toast(
          isAr
            ? `تم نقل ${selectedProductIds.length} منتج إلى سلة المحذوفات`
            : `Moved ${selectedProductIds.length} products to Recycle Bin`,
          'success',
        );
        setSelectedProductIds([]);
        void refreshRecycleBin();
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

  // Open New Product — straight into full editor (default: ready / physical product)
  const handleOpenNewProduct = useCallback(() => {
    if (!sub.writable) {
      toast(sub.message ?? t('subNotWritable'), 'error');
      return;
    }
    if (!planGate.ok) {
      toast(planGate.message, 'error');
      return;
    }
    const readyTypeTitle = isAr ? 'منتج جاهز' : 'Ready Product';
    const draft: Product = {
      id: `draft-${Date.now()}`,
      storeId: activeStore.id,
      name: '',
      sku: '',
      category: categories[0] || 'General',
      categories: categories[0] ? [categories[0]] : [],
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
      productType: readyTypeTitle,
      type: 'ready-product',
      brand: '',
      countryOfOrigin: 'Saudi Arabia',
      requiresShipping: true,
      trackInventory: true,
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
  }, [activeStore.id, categories, isAr, planGate, sub, t, toast]);

  useEffect(() => {
    const handleSubView = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === 'type-picker') {
        handleOpenNewProduct();
        return;
      }
      if (!detail || detail === 'list') {
        setCurrentView('list');
        return;
      }
      if (detail === 'edit' || detail === 'brands' || detail === 'filters') {
        setCurrentView(detail);
      }
    };
    window.addEventListener('unityteck-product-view', handleSubView);
    return () => window.removeEventListener('unityteck-product-view', handleSubView);
  }, [handleOpenNewProduct]);

  // Soft-delete → Recycle Bin (store-scoped, restoreable)
  const handleDeleteProduct = async (product: Product) => {
    const ok = await confirm({
      title: isAr ? 'نقل إلى سلة المحذوفات' : 'Move to Recycle Bin',
      message: isAr
        ? `سيتم نقل «${getProductDisplayName(product, locale) || product.name}» إلى سلة المحذوفات.`
        : `“${getProductDisplayName(product, locale) || product.name}” will move to the Recycle Bin.`,
      confirmLabel: isAr ? 'نقل إلى السلة' : 'Move to Bin',
      danger: true,
    });
    if (ok) {
      setDeletedProducts((prev) => [toTrashRow(product), ...prev.filter((x) => x.id !== product.id)]);
      deleteProduct(product.id, activeStore.id);
      if (editingProductId === product.id) {
        setCurrentView('list');
        setEditingProductId(null);
        setIsSideDrawerOpen(false);
      }
      toast(
        isAr ? 'تم نقل المنتج إلى سلة المحذوفات' : 'Product moved to Recycle Bin',
        'success',
      );
      void refreshRecycleBin();
    }
  };

  const handleRestoreTrashItem = async (item: TrashRow) => {
    setRecycleBusy(true);
    try {
      if (dataSource === 'api' && isApiEnabled()) {
        await restoreProductApi(activeStore.id, item.id);
        await revalidateResource(activeStore.id, 'products');
        setCatalogNonce((n) => n + 1);
      } else if (item.rawProduct) {
        addProduct({ ...item.rawProduct, status: 'draft', isActive: false }, activeStore.id);
      }
      setDeletedProducts((prev) => prev.filter((p) => p.id !== item.id));
      setSelectedDeletedIds((prev) => prev.filter((id) => id !== item.id));
      toast(isAr ? 'تم استرجاع المنتج بنجاح' : 'Product restored successfully', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : isAr ? 'تعذر الاسترجاع' : 'Restore failed', 'error');
    } finally {
      setRecycleBusy(false);
    }
  };

  const handleForceDeleteTrashItem = async (item: TrashRow) => {
    const ok = await confirm({
      title: isAr ? 'حذف نهائي' : 'Permanent Delete',
      message: isAr
        ? `حذف «${item.name}» نهائياً؟ لا يمكن التراجع.`
        : `Permanently delete “${item.name}”? This cannot be undone.`,
      confirmLabel: isAr ? 'حذف نهائي' : 'Delete Forever',
      danger: true,
    });
    if (!ok) return;
    setRecycleBusy(true);
    try {
      if (dataSource === 'api' && isApiEnabled()) {
        await forceDeleteProductApi(activeStore.id, item.id);
      }
      setDeletedProducts((prev) => prev.filter((p) => p.id !== item.id));
      setSelectedDeletedIds((prev) => prev.filter((id) => id !== item.id));
      toast(isAr ? 'تم الحذف النهائي للمنتج' : 'Product permanently deleted', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : isAr ? 'تعذر الحذف' : 'Delete failed', 'error');
    } finally {
      setRecycleBusy(false);
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
        onNavigateTab={onNavigateTab}
        categories={categories}
        categoryOptions={categoryOptions.map((o) => ({ value: o.value, label: o.label }))}
        availableBrands={availableStoreBrands.map((b: any) => (typeof b === 'string' ? b : (b.nameEn || b.nameAr || '')))}
        visibleSections={visibleEditSections}
        onBack={() => {
          setCreatingProduct(null);
          setEditingProductId(null);
          setCurrentView('list');
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
            setEditingProductId(null);
            setCurrentView('list');
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

    const handleRestoreItem = (item: TrashRow) => {
      void handleRestoreTrashItem(item);
    };

    const handleRestoreSelected = () => {
      if (selectedDeletedIds.length === 0) return;
      selectedDeletedIds.forEach((delId) => {
        const item = deletedProducts.find((p) => p.id === delId);
        if (item) void handleRestoreTrashItem(item);
      });
    };

    const handlePermanentDeleteSelected = () => {
      if (selectedDeletedIds.length === 0) return;
      selectedDeletedIds.forEach((delId) => {
        const item = deletedProducts.find((p) => p.id === delId);
        if (item) void handleForceDeleteTrashItem(item);
      });
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
                              onClick={() => void handleForceDeleteTrashItem(item)}
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
            style={{ background: 'var(--portal-cta)' }}
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
        <div className={isSideDrawerOpen && editingProduct ? 'lg:col-span-5 xl:col-span-6 min-w-0 flex flex-col min-h-0' : 'w-full flex flex-col flex-1 min-h-0'}>
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
                        ? 'bg-[var(--accent)] text-white shadow-xs'
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
                        ? 'bg-[var(--accent)] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title={isAr ? 'عرض جدولي' : 'List View'}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Grid density: items per row (next to grid toggle) */}
                {viewMode === 'grid' && (
                  <div
                    className="flex items-center p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs"
                    role="group"
                    aria-label={isAr ? 'عدد المنتجات في الصف' : 'Items per row'}
                    title={isAr ? 'عدد المنتجات في الصف' : 'Items per row'}
                  >
                    {([3, 4, 5, 6] as const).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setGridCols(n)}
                        className={`min-w-[1.75rem] px-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          gridCols === n
                            ? 'bg-[var(--accent)] text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                        title={isAr ? `${n} في الصف` : `${n} per row`}
                        aria-pressed={gridCols === n}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}

                {/* Recycle Bin — count badge opens deleted-products modal */}
                <button
                  type="button"
                  onClick={() => {
                    void refreshRecycleBin();
                    setShowRecycleBin(true);
                  }}
                  className="relative ms-1 p-1.5 rounded-xl border shadow-2xs cursor-pointer transition-colors"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                  title={isAr ? 'سلة المحذوفات' : 'Recycle Bin'}
                  aria-label={isAr ? 'سلة المحذوفات' : 'Recycle Bin'}
                >
                  <Trash2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  {deletedProducts.length > 0 ? (
                    <span
                      className="absolute -top-1.5 -end-1.5 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full text-[10px] font-black text-white flex items-center justify-center shadow-xs"
                      style={{ background: 'var(--accent)' }}
                    >
                      {deletedProducts.length > 99 ? '99+' : deletedProducts.length}
                    </span>
                  ) : null}
                </button>

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
              className="rounded-b-2xl relative z-0 flex-1 min-h-0 overflow-x-auto overflow-y-auto overscroll-contain"
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
                        ? /* Edit open: max 2/row so side editor stays wider on every laptop */
                          'grid-cols-1 sm:grid-cols-2'
                        : gridCols === 6
                          ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                          : gridCols === 5
                            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
                            : gridCols === 4
                              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    }`}
                  >
                    {pagedProducts.map((prod) => {
                      const isChecked = selectedProductIds.includes(prod.id);
                      const isPublished = prod.status === 'published' || (prod as any).status === 'active';
                      const isEditing = editingProductId === prod.id && isSideDrawerOpen;

                      return (
                        <div
                          key={prod.id}
                          className={`h-full min-h-[280px] rounded-2xl border transition-all duration-150 p-3.5 flex flex-col justify-between group relative ${
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

                          {/* Grid: heading + subheading (SKU) — fixed title block for equal card heights */}
                          <div className="mt-auto min-h-[3.25rem]">
                            <h4
                              onClick={() => handleOpenEdit(prod)}
                              title={getProductDisplayName(prod, locale)}
                              className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 mb-1 min-h-[2.5rem]"
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
              /* ── 2. TABLE VIEW — fixed column mins + horizontal scroll (no column squash) ── */
              <div className="min-w-0 w-full">
                <table className="w-max min-w-full text-start text-xs border-separate border-spacing-0">
                  <thead className="sticky top-0 z-20" style={{ background: 'var(--surface)' }}>
                    <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                      {/* Selection Checkbox */}
                      <th className="py-3 px-2 w-10 min-w-[40px] text-center whitespace-nowrap" style={{ borderBottom: '1px solid var(--border)' }}>
                        <input
                          type="checkbox"
                          checked={pagedProducts.length > 0 && selectedProductIds.length === pagedProducts.length}
                          onChange={toggleSelectAll}
                          className="rounded cursor-pointer"
                        />
                      </th>

                      {/* Drag Handle Column when Inline Edit is Active */}
                      {isInlineEdit && (
                        <th className="py-3 px-1.5 w-8 min-w-[32px] text-center" style={{ borderBottom: '1px solid var(--border)' }}>
                          <span className="sr-only">{isAr ? 'إعادة ترتيب' : 'Reorder'}</span>
                        </th>
                      )}

                      {/* Image */}
                      {visibleColumns.image && (
                        <th className="py-3 px-2 w-14 min-w-[56px] text-center font-bold text-[11px] whitespace-nowrap" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {isAr ? 'الصورة' : 'Image'}
                        </th>
                      )}

                      {/* Product Name */}
                      {visibleColumns.name && (
                        <th className="py-3 px-2 min-w-[180px] w-[200px] text-start font-bold text-[11px] whitespace-nowrap" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {t('product')}
                        </th>
                      )}

                      {/* SKU */}
                      {visibleColumns.sku && (
                        <th className="py-3 px-2 min-w-[120px] text-start font-bold text-[11px] whitespace-nowrap hidden sm:table-cell" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {isAr ? 'رمز المنتج' : 'SKU'}
                        </th>
                      )}

                      {/* Price */}
                      {visibleColumns.price && (
                        <th className="py-3 px-2 min-w-[96px] text-start font-bold text-[11px] whitespace-nowrap" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {isAr ? 'السعر (ر.س)' : 'Price (SAR)'}
                        </th>
                      )}

                      {/* Discount Price */}
                      {visibleColumns.salePrice && (
                        <th className="py-3 px-2 min-w-[120px] text-start font-bold text-[11px] whitespace-nowrap hidden md:table-cell" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {isAr ? 'سعر الخصم' : 'Discount Price (SAR)'}
                        </th>
                      )}

                      {/* Stock */}
                      {visibleColumns.stock && (
                        <th className="py-3 px-2 min-w-[72px] text-start font-bold text-[11px] whitespace-nowrap" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {t('stockCount')}
                        </th>
                      )}

                      {/* Category */}
                      {visibleColumns.category && (
                        <th className="py-3 px-2 min-w-[130px] text-start font-bold text-[11px] whitespace-nowrap" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {t('categoryLabel')}
                        </th>
                      )}

                      {/* Status */}
                      {visibleColumns.status && (
                        <th className="py-3 px-2 min-w-[100px] text-start font-bold text-[11px] whitespace-nowrap" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {isAr ? 'الحالة' : 'Status'}
                        </th>
                      )}

                      {/* Weight */}
                      {visibleColumns.weight && !tableCompact && (
                        <th className="py-3 px-2 min-w-[96px] text-start font-bold text-[11px] whitespace-nowrap hidden lg:table-cell" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {isAr ? 'الوزن (كجم)' : 'Weight (kg)'}
                        </th>
                      )}

                      {/* Brand */}
                      {visibleColumns.brand && !tableCompact && (
                        <th className="py-3 px-2 min-w-[110px] text-start font-bold text-[11px] whitespace-nowrap hidden lg:table-cell" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {isAr ? 'العلامة التجارية' : 'Brand'}
                        </th>
                      )}

                      {/* Product Type */}
                      {visibleColumns.productType && !tableCompact && (
                        <th className="py-3 px-2 min-w-[120px] text-start font-bold text-[11px] whitespace-nowrap hidden lg:table-cell" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {isAr ? 'نوع المنتج' : 'Product Type'}
                        </th>
                      )}

                      {/* Google Categories */}
                      {visibleColumns.googleCategories && !tableCompact && (
                        <th className="py-3 px-2 min-w-[180px] text-start font-bold text-[11px] whitespace-nowrap hidden xl:table-cell" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {isAr ? 'تصنيفات جوجل' : 'Google Categories'}
                        </th>
                      )}

                      {/* Sales Channels */}
                      {visibleColumns.salesChannels && !tableCompact && (
                        <th className="py-3 px-2 min-w-[140px] text-start font-bold text-[11px] whitespace-nowrap hidden xl:table-cell" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {isAr ? 'قنوات البيع' : 'Sales Channels'}
                        </th>
                      )}

                      {/* Discount Start Date */}
                      {visibleColumns.discountStartDate && !tableCompact && (
                        <th className="py-3 px-2 min-w-[130px] text-start font-bold text-[11px] whitespace-nowrap hidden xl:table-cell" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {isAr ? 'بداية الخصم' : 'Discount Start Date'}
                        </th>
                      )}

                      {/* Discount End Date */}
                      {visibleColumns.discountEndDate && !tableCompact && (
                        <th className="py-3 px-2 min-w-[130px] text-start font-bold text-[11px] whitespace-nowrap hidden xl:table-cell" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {isAr ? 'نهاية الخصم' : 'Discount End Date'}
                        </th>
                      )}

                      {/* Actions — sticky end so controls stay visible while scrolling */}
                      {visibleColumns.actions && (
                        <th
                          className="py-3 px-2 text-center font-bold text-[11px] w-36 min-w-[148px] whitespace-nowrap sticky end-0 z-30 shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.08)]"
                          style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
                        >
                          {isAr ? 'إجراءات' : 'Actions'}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={24} className="py-12 text-center text-xs" style={{ color: 'var(--muted)' }}>
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
                        const brandVal = String(prod.brand || (prod as any).brandName || '').trim();
                        const productTypeVal = String(prod.productType || prod.type || '').trim();
                        const googleCategoryVal = resolveGoogleTaxonomyLabel(prod.googleTaxonomy, isAr);
                        const salesChannelVals = Array.isArray(prod.salesChannels)
                          ? prod.salesChannels
                          : Array.isArray((prod as any).channels)
                            ? (prod as any).channels
                            : [];
                        const discountStartVal = formatProductDate(prod.discountStartAt);
                        const discountEndVal = formatProductDate(prod.discountEndAt);

                        return (
                          <tr
                            key={prod.id}
                            className="border-b hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            {/* Checkbox */}
                            <td className="py-2.5 px-2 w-10 min-w-[40px] text-center align-middle" style={{ borderBottom: '1px solid var(--border)' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectProduct(prod.id)}
                                className="rounded cursor-pointer"
                              />
                            </td>

                            {/* Drag Handle if Inline Edit is ON */}
                            {isInlineEdit && (
                              <td className="py-2.5 px-1.5 w-8 min-w-[32px] text-center align-middle" style={{ borderBottom: '1px solid var(--border)' }}>
                                <GripVertical className="w-3.5 h-3.5 text-slate-400 mx-auto cursor-grab" />
                              </td>
                            )}

                            {/* Image Thumbnail */}
                            {visibleColumns.image && (
                              <td className="py-2 px-2 w-14 min-w-[56px] text-center align-middle" style={{ borderBottom: '1px solid var(--border)' }}>
                                <img
                                  src={prod.image || FALLBACK_PRODUCT_IMAGE}
                                  alt={getProductDisplayName(prod, locale)}
                                  onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                                  className="w-8 h-8 rounded-lg object-contain border mx-auto bg-slate-50 dark:bg-slate-800 p-0.5"
                                  style={{ borderColor: 'var(--border)' }}
                                />
                              </td>
                            )}

                            {/* Product Name */}
                            {visibleColumns.name && (
                              <td className="py-2.5 px-2 min-w-[180px] w-[200px] align-middle" style={{ borderBottom: '1px solid var(--border)' }}>
                                {isInlineEdit ? (
                                  <input
                                    type="text"
                                    defaultValue={getProductDisplayName(prod, locale)}
                                    onBlur={(e) => handleInlineFieldChange(prod.id, 'name', e.target.value)}
                                    className="w-full min-w-0 px-2 py-1 text-xs font-semibold rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                  />
                                ) : (
                                  <span
                                    onClick={() => handleOpenEdit(prod)}
                                    title={getProductDisplayName(prod, locale)}
                                    className="font-bold text-xs line-clamp-2 leading-snug cursor-pointer hover:underline hover:text-[var(--accent)] block max-w-[184px]"
                                    style={{ color: 'var(--text)', overflowWrap: 'anywhere' }}
                                  >
                                    {getProductDisplayName(prod, locale)}
                                  </span>
                                )}
                              </td>
                            )}

                            {/* SKU — never break character-by-character */}
                            {visibleColumns.sku && (
                              <td className="py-2.5 px-2 min-w-[120px] hidden sm:table-cell align-middle" style={{ borderBottom: '1px solid var(--border)' }}>
                                {isInlineEdit ? (
                                  <input
                                    type="text"
                                    defaultValue={prod.sku}
                                    onBlur={(e) => handleInlineFieldChange(prod.id, 'sku', e.target.value)}
                                    className="w-full min-w-[100px] px-1.5 py-1 text-xs font-mono font-bold rounded-lg border bg-white dark:bg-slate-900 uppercase focus:outline-none"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                  />
                                ) : (
                                  <span className="text-[11px] font-mono text-slate-400 font-bold whitespace-nowrap truncate block max-w-[140px]" title={prod.sku}>
                                    {prod.sku}
                                  </span>
                                )}
                              </td>
                            )}

                            {/* Price */}
                            {visibleColumns.price && (
                              <td className="py-2.5 px-2 min-w-[96px] whitespace-nowrap font-bold text-xs align-middle" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                                {isInlineEdit ? (
                                  <input
                                    type="number"
                                    min="0"
                                    defaultValue={prod.price}
                                    onBlur={(e) => handleInlineFieldChange(prod.id, 'price', Number(e.target.value))}
                                    className="w-[4.5rem] px-1.5 py-1 text-xs font-bold font-mono rounded-lg border bg-white dark:bg-slate-900 focus:outline-none"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                  />
                                ) : (
                                  money(prod.price)
                                )}
                              </td>
                            )}

                            {/* Sale Price */}
                            {visibleColumns.salePrice && (
                              <td className="py-2.5 px-2 min-w-[120px] whitespace-nowrap font-bold text-xs hidden md:table-cell align-middle" style={{ borderBottom: '1px solid var(--border)' }}>
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
                                    className="w-[4.5rem] px-1.5 py-1 text-xs font-bold font-mono rounded-lg border bg-white dark:bg-slate-900 focus:outline-none"
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
                              <td className="py-2.5 px-2 min-w-[72px] whitespace-nowrap text-xs align-middle" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
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
                              <td className="py-2.5 px-2 min-w-[130px] font-medium text-xs align-middle" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                                {isInlineEdit ? (
                                  <select
                                    defaultValue={prod.category}
                                    onChange={(e) => handleInlineFieldChange(prod.id, 'category', e.target.value)}
                                    className="max-w-[140px] px-2 py-1 text-xs rounded-lg border bg-white dark:bg-slate-900 focus:outline-none"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                  >
                                    {(categoryOptions.length > 0
                                      ? categoryOptions
                                      : categories.map((c) => ({
                                          value: c,
                                          label: getProductDisplayCategory(c, locale),
                                        }))
                                    ).map((c) => (
                                      <option key={c.value} value={c.value}>
                                        {c.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="truncate block max-w-[140px] whitespace-nowrap" title={getProductDisplayCategory(prod, locale)}>
                                    {getProductDisplayCategory(prod, locale)}
                                  </span>
                                )}
                              </td>
                            )}

                            {/* Status */}
                            {visibleColumns.status && (
                              <td className="py-2.5 px-2 min-w-[100px] whitespace-nowrap text-xs align-middle" style={{ borderBottom: '1px solid var(--border)' }}>
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
                            {visibleColumns.weight && !tableCompact && (
                              <td className="py-2.5 px-2 min-w-[96px] whitespace-nowrap text-xs hidden lg:table-cell align-middle" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
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

                            {/* Brand */}
                            {visibleColumns.brand && !tableCompact && (
                              <td className="py-2.5 px-2 min-w-[110px] whitespace-nowrap text-xs hidden lg:table-cell align-middle" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                                {isInlineEdit ? (
                                  <input
                                    type="text"
                                    defaultValue={brandVal}
                                    onBlur={(e) => handleInlineFieldChange(prod.id, 'brand', e.target.value)}
                                    className="w-24 px-1.5 py-1 text-xs rounded-lg border bg-white dark:bg-slate-900 focus:outline-none"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                  />
                                ) : brandVal ? (
                                  <span className="max-w-[120px] truncate block" title={brandVal}>{brandVal}</span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            )}

                            {/* Product Type */}
                            {visibleColumns.productType && !tableCompact && (
                              <td className="py-2.5 px-2 min-w-[120px] whitespace-nowrap text-xs hidden lg:table-cell align-middle" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                                {isInlineEdit ? (
                                  <input
                                    type="text"
                                    defaultValue={productTypeVal}
                                    onBlur={(e) => handleInlineFieldChange(prod.id, 'productType', e.target.value)}
                                    className="w-24 px-1.5 py-1 text-xs rounded-lg border bg-white dark:bg-slate-900 focus:outline-none"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                  />
                                ) : productTypeVal ? (
                                  <span className="max-w-[130px] truncate block" title={productTypeVal}>{productTypeVal}</span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            )}

                            {/* Google Categories — ellipsis, no vertical letter stack */}
                            {visibleColumns.googleCategories && !tableCompact && (
                              <td className="py-2.5 px-2 min-w-[180px] text-xs hidden xl:table-cell align-middle" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                                {googleCategoryVal ? (
                                  <span className="max-w-[220px] truncate whitespace-nowrap block" title={googleCategoryVal}>
                                    {googleCategoryVal}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            )}

                            {/* Sales Channels */}
                            {visibleColumns.salesChannels && !tableCompact && (
                              <td className="py-2.5 px-2 min-w-[140px] text-xs hidden xl:table-cell align-middle" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                                {salesChannelVals.length > 0 ? (
                                  <span
                                    className="max-w-[160px] truncate whitespace-nowrap block"
                                    title={salesChannelVals.map((c: string) => getProductChannelLabel(c, isAr)).join(', ')}
                                  >
                                    {salesChannelVals.map((c: string) => getProductChannelLabel(c, isAr)).join(', ')}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            )}

                            {/* Discount Start Date */}
                            {visibleColumns.discountStartDate && !tableCompact && (
                              <td className="py-2.5 px-2 min-w-[130px] whitespace-nowrap text-xs hidden xl:table-cell align-middle" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                                {isInlineEdit ? (
                                  <input
                                    type="date"
                                    defaultValue={discountStartVal}
                                    onBlur={(e) =>
                                      handleInlineFieldChange(
                                        prod.id,
                                        'discountStartAt',
                                        e.target.value || null,
                                      )
                                    }
                                    className="px-1.5 py-1 text-xs rounded-lg border bg-white dark:bg-slate-900 focus:outline-none"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                  />
                                ) : discountStartVal ? (
                                  <span className="font-mono text-slate-500">{discountStartVal}</span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            )}

                            {/* Discount End Date */}
                            {visibleColumns.discountEndDate && !tableCompact && (
                              <td className="py-2.5 px-2 min-w-[130px] whitespace-nowrap text-xs hidden xl:table-cell align-middle" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
                                {isInlineEdit ? (
                                  <input
                                    type="date"
                                    defaultValue={discountEndVal}
                                    onBlur={(e) =>
                                      handleInlineFieldChange(
                                        prod.id,
                                        'discountEndAt',
                                        e.target.value || null,
                                      )
                                    }
                                    className="px-1.5 py-1 text-xs rounded-lg border bg-white dark:bg-slate-900 focus:outline-none"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                  />
                                ) : discountEndVal ? (
                                  <span className="font-mono text-slate-500">{discountEndVal}</span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            )}

                            {/* Actions — sticky end */}
                            {visibleColumns.actions && (
                              <td
                                className="py-2.5 px-2 text-center whitespace-nowrap relative w-36 min-w-[148px] align-middle sticky end-0 z-10 shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.08)]"
                                style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
                              >
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
            </div>

            {/* ── PAGINATION CONTROLS MATCHING MOCKUP 06 ── */}
            <div className="mt-auto">
            <WindowedPagination
              currentPage={safePage}
              totalPages={pageCount}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={(next) => {
                setPage(next);
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
          <div className="lg:col-span-7 xl:col-span-6 min-w-0">
            <ProductEditDrawer
              isOpen={isSideDrawerOpen}
              product={editingProduct}
              storeId={activeStore.id}
              categories={categories}
              categoryOptions={categoryOptions.map((o) => ({ value: o.value, label: o.label }))}
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

        <div className="max-h-80 overflow-y-auto space-y-1.5 custom-scroll pe-1">
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
            { id: 'brand', label: isAr ? 'العلامة التجارية' : 'Brand' },
            { id: 'productType', label: isAr ? 'نوع المنتج' : 'Product Type' },
            { id: 'googleCategories', label: isAr ? 'تصنيفات جوجل' : 'Google Categories' },
            { id: 'salesChannels', label: isAr ? 'قنوات البيع' : 'Sales Channels' },
            { id: 'discountStartDate', label: isAr ? 'بداية الخصم' : 'Discount Start Date' },
            { id: 'discountEndDate', label: isAr ? 'نهاية الخصم' : 'Discount End Date' },
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
                brand: true,
                productType: true,
                googleCategories: true,
                salesChannels: true,
                discountStartDate: true,
                discountEndDate: true,
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

      {/* ── RECYCLE BIN MODAL (deleted / archived products for this store only) ── */}
      <GlobalModal
        isOpen={showRecycleBin}
        onClose={() => setShowRecycleBin(false)}
        dir={dir}
        aria-label={isAr ? 'سلة المحذوفات' : 'Recycle Bin'}
        contentClassName="w-full max-w-4xl mx-4"
      >
        <div
          data-global-modal
          className="rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[min(88vh,720px)]"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
            fontFamily: 'var(--font-ui)',
          }}
        >
          <div
            className="flex items-center justify-between gap-3 px-5 py-4 border-b shrink-0"
            style={{ background: 'var(--portal-950)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'color-mix(in srgb, var(--portal-400) 22%, transparent)' }}
              >
                <Trash2 className="w-5 h-5" style={{ color: 'var(--portal-400)' }} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black text-white truncate">
                  {isAr ? 'سلة المحذوفات' : 'Recycle Bin'}
                </h2>
                <p className="text-[11px] text-white/70">
                  {isAr
                    ? `${deletedProducts.length} منتج محذوف · استعادة أو حذف نهائي`
                    : `${deletedProducts.length} deleted · restore or delete forever`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowRecycleBin(false)}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-3 border-b flex flex-wrap items-center gap-2 shrink-0" style={{ borderColor: 'var(--border)' }}>
            <div className="relative flex-1 min-w-[12rem]">
              <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                type="text"
                value={searchDeleted}
                onChange={(e) => setSearchDeleted(e.target.value)}
                placeholder={isAr ? 'بحث في المنتجات المحذوفة...' : 'Search deleted products...'}
                className="w-full ps-8 pe-3 py-2 text-xs rounded-xl border focus:outline-none"
                style={{ background: 'var(--input-bg, var(--bg))', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
            <button
              type="button"
              disabled={selectedDeletedIds.length === 0 || recycleBusy}
              onClick={async () => {
                const ids = [...selectedDeletedIds];
                for (const id of ids) {
                  const item = deletedProducts.find((p) => p.id === id);
                  if (item) await handleRestoreTrashItem(item);
                }
              }}
              className="px-3 py-2 text-xs font-bold rounded-xl text-white disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
              style={{ background: 'var(--portal-cta)' }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isAr ? 'استعادة المحدد' : 'Restore Selected'}
            </button>
            <button
              type="button"
              disabled={selectedDeletedIds.length === 0 || recycleBusy}
              onClick={async () => {
                const ids = [...selectedDeletedIds];
                for (const id of ids) {
                  const item = deletedProducts.find((p) => p.id === id);
                  if (item) await handleForceDeleteTrashItem(item);
                }
              }}
              className="px-3 py-2 text-xs font-bold rounded-xl border disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
              style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isAr ? 'حذف نهائي' : 'Delete Forever'}
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {deletedProducts.filter((p) => {
              if (!searchDeleted.trim()) return true;
              const q = searchDeleted.toLowerCase();
              return (
                String(p.name || '').toLowerCase().includes(q) ||
                String(p.sku || '').toLowerCase().includes(q) ||
                String(p.category || '').toLowerCase().includes(q)
              );
            }).length === 0 ? (
              <div className="py-16 text-center text-xs opacity-60">
                {isAr ? 'لا توجد منتجات في سلة المحذوفات' : 'Recycle Bin is empty'}
              </div>
            ) : (
              <table className="w-full text-start text-xs">
                <thead className="sticky top-0 z-10" style={{ background: 'var(--bg)' }}>
                  <tr className="border-b text-[11px] font-bold opacity-70" style={{ borderColor: 'var(--border)' }}>
                    <th className="py-2.5 px-4 w-10">
                      <input
                        type="checkbox"
                        className="rounded cursor-pointer"
                        checked={
                          deletedProducts.length > 0 &&
                          selectedDeletedIds.length ===
                            deletedProducts.filter((p) => {
                              if (!searchDeleted.trim()) return true;
                              const q = searchDeleted.toLowerCase();
                              return (
                                String(p.name || '').toLowerCase().includes(q) ||
                                String(p.sku || '').toLowerCase().includes(q)
                              );
                            }).length
                        }
                        onChange={() => {
                          const visible = deletedProducts.filter((p) => {
                            if (!searchDeleted.trim()) return true;
                            const q = searchDeleted.toLowerCase();
                            return (
                              String(p.name || '').toLowerCase().includes(q) ||
                              String(p.sku || '').toLowerCase().includes(q) ||
                              String(p.category || '').toLowerCase().includes(q)
                            );
                          });
                          setSelectedDeletedIds((prev) =>
                            prev.length === visible.length ? [] : visible.map((p) => p.id),
                          );
                        }}
                      />
                    </th>
                    <th className="py-2.5 px-3">{isAr ? 'المنتج' : 'Product'}</th>
                    <th className="py-2.5 px-3 hidden sm:table-cell">{isAr ? 'السعر' : 'Price'}</th>
                    <th className="py-2.5 px-3 hidden md:table-cell">{isAr ? 'تاريخ الحذف' : 'Deleted'}</th>
                    <th className="py-2.5 px-4 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedProducts
                    .filter((p) => {
                      if (!searchDeleted.trim()) return true;
                      const q = searchDeleted.toLowerCase();
                      return (
                        String(p.name || '').toLowerCase().includes(q) ||
                        String(p.sku || '').toLowerCase().includes(q) ||
                        String(p.category || '').toLowerCase().includes(q)
                      );
                    })
                    .map((item) => (
                      <tr key={item.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            className="rounded cursor-pointer"
                            checked={selectedDeletedIds.includes(item.id)}
                            onChange={() =>
                              setSelectedDeletedIds((prev) =>
                                prev.includes(item.id) ? prev.filter((i) => i !== item.id) : [...prev, item.id],
                              )
                            }
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt=""
                                className="w-9 h-9 rounded-xl object-cover border shrink-0"
                                style={{ borderColor: 'var(--border)' }}
                                onError={handleImageError}
                              />
                            ) : (
                              <span
                                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: 'var(--bg)' }}
                              >
                                <Package className="w-4 h-4 opacity-40" />
                              </span>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold truncate">{item.name}</div>
                              <div className="text-[10px] opacity-55 font-mono truncate">
                                {isAr ? 'رمز المنتج' : 'SKU'}: {item.sku || '—'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-bold tabular-nums hidden sm:table-cell">{money(item.price)}</td>
                        <td className="py-3 px-3 text-[11px] opacity-60 hidden md:table-cell whitespace-nowrap">
                          {item.deletedAt}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              disabled={recycleBusy}
                              onClick={() => void handleRestoreTrashItem(item)}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-white cursor-pointer disabled:opacity-40 flex items-center gap-1"
                              style={{ background: 'var(--portal-cta)' }}
                            >
                              <RotateCcw className="w-3 h-3" />
                              {isAr ? 'استعادة' : 'Restore'}
                            </button>
                            <button
                              type="button"
                              disabled={recycleBusy}
                              onClick={() => void handleForceDeleteTrashItem(item)}
                              className="p-1.5 rounded-lg cursor-pointer disabled:opacity-40"
                              style={{ color: '#e11d48' }}
                              title={isAr ? 'حذف نهائي' : 'Delete forever'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </GlobalModal>

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

