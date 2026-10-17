import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  PackageX,
  ArrowUpDown,
  RefreshCw,
  Save,
  Plus,
  Minus,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { WindowedPagination } from '../common/WindowedPagination';
import { handleImageError, FALLBACK_PRODUCT_IMAGE } from '../../utils/imageFallback';
import { getProductDisplayCategory, getProductDisplayName } from '../../utils/storeLocalization';

export const StoreInventory: React.FC = () => {
  const { activeStore, currentProducts, updateProduct } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out' | 'in'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [stockMap, setStockMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    (currentProducts || []).forEach((p: any) => {
      map[p.id] = typeof p.stock === 'number' ? p.stock : typeof p.inventory === 'number' ? p.inventory : 25;
    });
    return map;
  });

  const productsList = useMemo(() => {
    return (currentProducts || []).map((p: any) => ({
      ...p,
      currentStock: stockMap[p.id] !== undefined ? stockMap[p.id] : (p.stock ?? p.inventory ?? 25),
    }));
  }, [currentProducts, stockMap]);

  const filteredProducts = useMemo(() => {
    return productsList.filter((p: any) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (filterStatus === 'low') return p.currentStock > 0 && p.currentStock <= 5;
      if (filterStatus === 'out') return p.currentStock <= 0;
      if (filterStatus === 'in') return p.currentStock > 5;
      return true;
    });
  }, [productsList, search, filterStatus]);

  // Pagination
  const totalCount = filteredProducts.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedProducts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, safePage, pageSize]);

  const stats = useMemo(() => {
    const total = productsList.length;
    const inStock = productsList.filter((p: any) => p.currentStock > 5).length;
    const lowStock = productsList.filter((p: any) => p.currentStock > 0 && p.currentStock <= 5).length;
    const outOfStock = productsList.filter((p: any) => p.currentStock <= 0).length;
    return { total, inStock, lowStock, outOfStock };
  }, [productsList]);

  const handleStockChange = (id: string, delta: number) => {
    setStockMap((prev) => {
      const current = prev[id] !== undefined ? prev[id] : 25;
      const next = Math.max(0, current + delta);
      updateProduct(id, { stock: next, badge: next === 0 ? 'out_of_stock' : undefined }, activeStore.id);
      return { ...prev, [id]: next };
    });
  };

  const handleDirectStockInput = (id: string, val: string) => {
    const num = parseInt(val, 10);
    const next = isNaN(num) ? 0 : Math.max(0, num);
    setStockMap((prev) => ({
      ...prev,
      [id]: next,
    }));
    updateProduct(id, { stock: next, badge: next === 0 ? 'out_of_stock' : undefined }, activeStore.id);
  };

  const handleSaveAll = () => {
    Object.entries(stockMap).forEach(([id, stock]) => {
      updateProduct(id, { stock, badge: stock === 0 ? 'out_of_stock' : undefined }, activeStore.id);
    });
    toast(isAr ? 'تم حفظ وتحديث مستويات المخزون بنجاح' : 'Inventory stock levels saved successfully', 'success');
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-emerald-600" />
            <span>{isAr ? 'إدارة المخزون والمستودع' : 'Inventory & Stock Management'}</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? 'متابعة كميات المنتجات، تنبيهات نفاد الكمية، وتحديث المخزون الفوري'
              : 'Monitor product quantities, low stock alerts, and quick inventory updates'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isAr ? 'حفظ التغييرات' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">{isAr ? 'إجمالي المنتجات' : 'Total Items'}</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{stats.total}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'متوفر بالمخزون' : 'In Stock'}</span>
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{stats.inStock}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isAr ? 'مخزون منخفض (≤ 5)' : 'Low Stock (≤ 5)'}</span>
          </span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">{stats.lowStock}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <PackageX className="w-3.5 h-3.5" />
            <span>{isAr ? 'نفد من المخزون' : 'Out of Stock'}</span>
          </span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">{stats.outOfStock}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث بالاسم، الباركود أو التصنيف...' : 'Search by name, SKU or category...'}
            className="w-full ps-9 pe-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {isAr ? 'الكل' : 'All'}
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('in')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'in'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {isAr ? 'متوفر' : 'In Stock'}
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('low')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'low'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {isAr ? 'منخفض' : 'Low Stock'}
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('out')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'out'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {isAr ? 'منتهي' : 'Out of Stock'}
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase">
              <tr>
                <th className="py-3.5 px-4 text-start">{isAr ? 'المنتج' : 'Product'}</th>
                <th className="py-3.5 px-4 text-start">{isAr ? 'التصنيف' : 'Category'}</th>
                <th className="py-3.5 px-4 text-start">{isAr ? 'السعر' : 'Price'}</th>
                <th className="py-3.5 px-4 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="py-3.5 px-4 text-center">{isAr ? 'الكمية المتوفرة' : 'Stock Qty'}</th>
                <th className="py-3.5 px-4 text-end">{isAr ? 'تعديل سريع' : 'Quick Adjust'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {isAr ? 'لا توجد منتجات مطابقة للبحث' : 'No matching products found'}
                  </td>
                </tr>
              ) : (
                pagedProducts.map((p: any) => {
                  const stock = p.currentStock;
                  const isOut = stock <= 0;
                  const isLow = stock > 0 && stock <= 5;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image || p.images?.[0] || FALLBACK_PRODUCT_IMAGE}
                            alt={getProductDisplayName(p, locale)}
                            onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{getProductDisplayName(p, locale)}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">SKU: {p.sku || `SKU-${p.id.slice(0, 6)}`}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {getProductDisplayCategory(p, locale) || (isAr ? 'عام' : 'General')}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white font-mono">
                        {p.price} SAR
                      </td>
                      <td className="py-3.5 px-4">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                            <PackageX className="w-3 h-3" />
                            <span>{isAr ? 'نفد المخزون' : 'Out of Stock'}</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{isAr ? 'مخزون حرج' : 'Low Stock'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isAr ? 'متوفر' : 'In Stock'}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          value={stock}
                          onChange={(e) => handleDirectStockInput(p.id, e.target.value)}
                          className="w-16 px-2 py-1 text-center font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleStockChange(p.id, -1)}
                            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
                            title={isAr ? 'إنقاص 1' : 'Decrease 1'}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStockChange(p.id, 1)}
                            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
                            title={isAr ? 'زيادة 1' : 'Increase 1'}
                          >
                            <Plus className="w-3.5 h-3.5" />
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

        <WindowedPagination
          currentPage={safePage}
          totalPages={pageCount}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          isAr={isAr}
          itemLabel={isAr ? 'منتج بالمستودع' : 'inventory items'}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
    </div>
  );
};
