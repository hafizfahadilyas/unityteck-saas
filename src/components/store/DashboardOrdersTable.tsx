import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Order } from '../../types';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Package,
  CreditCard,
  Banknote,
  RotateCcw,
  Check,
  X,
  ExternalLink,
  Smartphone,
  Globe,
  Store,
  Layers,
} from 'lucide-react';
import { statusChipStyle } from '../../utils/liveSeries';

const OrderDetailsModal = React.lazy(() =>
  import('./orders/OrderDetailsModal').then((m) => ({ default: m.OrderDetailsModal })),
);

interface DashboardOrdersTableProps {
  orders: Order[];
  onNavigateTab: (tab: string) => void;
  className?: string;
  onOpenCreateOrder?: () => void;
}

const PAGE_SIZE = 5;

type SortKey = 'date_desc' | 'date_asc' | 'total_desc' | 'total_asc' | 'id_desc' | 'id_asc';

export const DashboardOrdersTable: React.FC<DashboardOrdersTableProps> = React.memo(({
  orders,
  onNavigateTab,
  className = '',
  onOpenCreateOrder,
}) => {
  const { money, locale, dir } = usePrefs();
  const isAr = locale === 'ar';
  const [inspectOrder, setInspectOrder] = useState<Order | null>(null);

  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date_desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Popover menus state
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Filtered & Sorted orders
  const processedOrders = useMemo(() => {
    let list = orders.filter((ord) => !ord.isArchived);

    // 1. Search Query (order number, customer name, phone, email, payment, channel, items)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((ord) => {
        const orderNum = (ord.orderNumber || ord.id || '').toLowerCase();
        const custName = (ord.customerName || '').toLowerCase();
        const custPhone = (ord.customerPhone || '').toLowerCase();
        const custEmail = (ord.customerEmail || '').toLowerCase();
        const payment = (ord.paymentMethod || '').toLowerCase();
        const source = (ord.source || '').toLowerCase();
        const itemNames = (ord.items || []).map((it) => it.name.toLowerCase()).join(' ');
        return (
          orderNum.includes(q) ||
          custName.includes(q) ||
          custPhone.includes(q) ||
          custEmail.includes(q) ||
          payment.includes(q) ||
          source.includes(q) ||
          itemNames.includes(q)
        );
      });
    }

    // 2. Status filter
    if (statusFilter !== 'all') {
      list = list.filter((ord) => ord.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    // 3. Payment filter
    if (paymentFilter !== 'all') {
      list = list.filter((ord) => {
        const pm = (ord.paymentMethod || '').toLowerCase();
        return pm.includes(paymentFilter.toLowerCase());
      });
    }

    // 4. Channel filter
    if (channelFilter !== 'all') {
      list = list.filter((ord) => {
        const src = (ord.source || 'Storefront').toLowerCase();
        return src.includes(channelFilter.toLowerCase());
      });
    }

    // 5. Sorting
    list.sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      const totalA = Number(a.total) || 0;
      const totalB = Number(b.total) || 0;
      const idA = String(a.orderNumber || a.id);
      const idB = String(b.orderNumber || b.id);

      switch (sortKey) {
        case 'date_asc':
          return dateA - dateB;
        case 'total_desc':
          return totalB - totalA;
        case 'total_asc':
          return totalA - totalB;
        case 'id_desc':
          return idB.localeCompare(idA);
        case 'id_asc':
          return idA.localeCompare(idB);
        case 'date_desc':
        default:
          return dateB - dateA;
      }
    });

    return list;
  }, [orders, searchQuery, statusFilter, paymentFilter, channelFilter, sortKey]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, paymentFilter, channelFilter, sortKey]);

  // Total pages
  const totalCount = processedOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const validPage = Math.min(currentPage, totalPages);

  // Paginated slice
  const paginatedOrders = useMemo(() => {
    const start = (validPage - 1) * PAGE_SIZE;
    return processedOrders.slice(start, start + PAGE_SIZE);
  }, [processedOrders, validPage]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    statusFilter !== 'all' ||
    paymentFilter !== 'all' ||
    channelFilter !== 'all';

  const resetAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setChannelFilter('all');
    setSortKey('date_desc');
  };

  const getStatusIcon = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'delivered') return <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />;
    if (s === 'pending') return <Clock className="w-3.5 h-3.5 shrink-0" />;
    if (s === 'shipped' || s === 'processing') return <Truck className="w-3.5 h-3.5 shrink-0" />;
    if (s === 'cancelled') return <XCircle className="w-3.5 h-3.5 shrink-0" />;
    return <Package className="w-3.5 h-3.5 shrink-0" />;
  };

  const getLocalizedStatus = (status: string) => {
    const s = (status || '').toLowerCase();
    if (isAr) {
      if (s === 'completed') return 'مكتمل';
      if (s === 'pending') return 'قيد الانتظار';
      if (s === 'processing') return 'جاري التجهيز';
      if (s === 'shipped') return 'تم الشحن';
      if (s === 'delivered') return 'تم التوصيل';
      if (s === 'cancelled') return 'ملغي';
      return status;
    }
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
  };

  const getChannelBadge = (source?: string) => {
    const src = (source || 'Storefront').toLowerCase();
    if (src.includes('salla') || src.includes('سلة')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
          {isAr ? 'سلة' : 'Salla'}
        </span>
      );
    }
    if (src.includes('woo') || src.includes('ووكومرس')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
          {isAr ? 'ووكومرس' : 'WooCommerce'}
        </span>
      );
    }
    if (src.includes('app') || src.includes('تطبيق') || src.includes('mobile')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40">
          <Smartphone className="w-2.5 h-2.5" />
          {isAr ? 'تطبيق الجوال' : 'Mobile App'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <Store className="w-2.5 h-2.5" />
        {isAr ? 'المتجر الإلكتروني' : 'Online Store'}
      </span>
    );
  };

  const getPaymentBadge = (method?: string) => {
    const pm = (method || 'Online').toLowerCase();
    if (pm.includes('cash') || pm.includes('استلام') || pm.includes('cod')) {
      return (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="text-xs truncate">{isAr ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</span>
        </div>
      );
    }
    if (pm.includes('apple')) {
      return (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <CreditCard className="w-3.5 h-3.5 text-slate-900 dark:text-white shrink-0" />
          <span className="text-xs truncate">Apple Pay</span>
        </div>
      );
    }
    if (pm.includes('mada') || pm.includes('مدى')) {
      return (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="text-xs truncate">{isAr ? 'مدى' : 'Mada'}</span>
        </div>
      );
    }
    if (pm.includes('tamara') || pm.includes('تمارا')) {
      return (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <CreditCard className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="text-xs truncate">{isAr ? 'تمارا' : 'Tamara'}</span>
        </div>
      );
    }
    if (pm.includes('tabby') || pm.includes('تابي')) {
      return (
        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
          <CreditCard className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="text-xs truncate">{isAr ? 'تابي' : 'Tabby'}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
        <CreditCard className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        <span className="text-xs truncate">{method || (isAr ? 'بطاقة بنكية' : 'Credit Card')}</span>
      </div>
    );
  };

  const startRange = totalCount === 0 ? 0 : (validPage - 1) * PAGE_SIZE + 1;
  const endRange = Math.min(validPage * PAGE_SIZE, totalCount);

  return (
    <div
      className={`u-panel rounded-2xl shadow-xs border transition-all duration-200 overflow-hidden ${className}`}
      data-panel="dashboard-orders-table"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* ── Top Header Toolbar (Exact Match to Image 1) ── */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 p-4 sm:p-5 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Title side (Right in RTL, Left in LTR) */}
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40">
            <ShoppingCart className="w-4 h-4" />
          </span>
          <h3 className="font-extrabold text-base sm:text-lg tracking-tight" style={{ color: 'var(--text)' }}>
            {isAr ? 'أحدث الطلبات' : 'Recent Orders'}
          </h3>
        </div>

        {/* Controls Toolbar (Search, Filter, Sort, Add Order Action) */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Search Box */}
          <div className="relative min-w-[160px] sm:min-w-[200px] flex-1 sm:flex-initial">
            <Search
              className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
              aria-hidden
            />
            <input
              type="text"
              placeholder={isAr ? 'بحث في الطلبات...' : 'Search in orders...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-8 pe-3 py-1.5 text-xs rounded-xl border outline-none transition-all focus:border-teal-500"
              style={{
                background: 'var(--input-bg)',
                borderColor: 'var(--border)',
                color: 'var(--input-fg)',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Button & Popover */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setShowFilterMenu((v) => !v)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                hasActiveFilters
                  ? 'border-teal-500 text-teal-700 bg-teal-50/70 dark:bg-teal-950/40 dark:text-teal-300'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              style={!hasActiveFilters ? { borderColor: 'var(--border)', color: 'var(--text)' } : undefined}
            >
              <Filter className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{isAr ? 'تصفية' : 'Filter'}</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
              )}
            </button>

            {showFilterMenu && (
              <div
                className="absolute end-0 mt-2 w-64 p-3 rounded-2xl border shadow-xl z-40 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="font-bold text-xs">{isAr ? 'تصفية الطلبات' : 'Filter Orders'}</span>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="text-[11px] text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    {isAr ? 'الحالة' : 'Status'}
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  >
                    <option value="all">{isAr ? 'كافة الحالات' : 'All Statuses'}</option>
                    <option value="completed">{isAr ? 'مكتمل' : 'Completed'}</option>
                    <option value="pending">{isAr ? 'قيد الانتظار' : 'Pending'}</option>
                    <option value="processing">{isAr ? 'جاري التجهيز' : 'Processing'}</option>
                    <option value="shipped">{isAr ? 'تم الشحن' : 'Shipped'}</option>
                    <option value="cancelled">{isAr ? 'ملغي' : 'Cancelled'}</option>
                  </select>
                </div>

                {/* Payment Filter */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    {isAr ? 'طريقة الدفع' : 'Payment Method'}
                  </label>
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  >
                    <option value="all">{isAr ? 'كافة طرق الدفع' : 'All Payment Methods'}</option>
                    <option value="mada">{isAr ? 'مدى' : 'Mada'}</option>
                    <option value="apple">{isAr ? 'أبل باي' : 'Apple Pay'}</option>
                    <option value="tamara">{isAr ? 'تمارا' : 'Tamara'}</option>
                    <option value="tabby">{isAr ? 'تابي' : 'Tabby'}</option>
                    <option value="cash">{isAr ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</option>
                  </select>
                </div>

                {/* Channel Filter */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    {isAr ? 'قناة البيع' : 'Sales Channel'}
                  </label>
                  <select
                    value={channelFilter}
                    onChange={(e) => setChannelFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
                  >
                    <option value="all">{isAr ? 'كافة القنوات' : 'All Channels'}</option>
                    <option value="store">{isAr ? 'المتجر الإلكتروني' : 'Online Store'}</option>
                    <option value="salla">{isAr ? 'سلة' : 'Salla'}</option>
                    <option value="woo">{isAr ? 'ووكومرس' : 'WooCommerce'}</option>
                    <option value="app">{isAr ? 'تطبيق الجوال' : 'Mobile App'}</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Sort Button & Popover */}
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setShowSortMenu((v) => !v)}
              className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'ترتيب' : 'Sort'}</span>
            </button>

            {showSortMenu && (
              <div
                className="absolute end-0 mt-2 w-48 py-1 rounded-2xl border shadow-xl z-40 text-xs animate-in fade-in zoom-in-95 duration-150"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                {[
                  { id: 'date_desc' as const, labelEn: 'Date: Newest First', labelAr: 'التاريخ: الأحدث أولاً' },
                  { id: 'date_asc' as const, labelEn: 'Date: Oldest First', labelAr: 'التاريخ: الأقدم أولاً' },
                  { id: 'total_desc' as const, labelEn: 'Total: Highest First', labelAr: 'المبلغ: الأعلى أولاً' },
                  { id: 'total_asc' as const, labelEn: 'Total: Lowest First', labelAr: 'المبلغ: الأقل أولاً' },
                  { id: 'id_desc' as const, labelEn: 'Order #: Highest First', labelAr: 'رقم الطلب: تنازلي' },
                  { id: 'id_asc' as const, labelEn: 'Order #: Lowest First', labelAr: 'رقم الطلب: تصاعدي' },
                ].map((s) => {
                  const active = sortKey === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSortKey(s.id);
                        setShowSortMenu(false);
                      }}
                      className="w-full px-3.5 py-2 text-start flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <span className={active ? 'font-bold text-teal-600 dark:text-teal-400' : ''}>
                        {isAr ? s.labelAr : s.labelEn}
                      </span>
                      {active && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Manage Orders Button (+ إدارة الطلبات) */}
          <button
            type="button"
            onClick={() => {
              if (onOpenCreateOrder) {
                onOpenCreateOrder();
              } else {
                onNavigateTab('orders');
              }
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-xs transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{ background: '#007b83' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إدارة الطلبات' : 'Manage Orders'}</span>
          </button>
        </div>
      </div>

      {/* ── Active Filters Indicators ── */}
      {hasActiveFilters && (
        <div
          className="px-4 py-2 bg-slate-50/70 dark:bg-slate-900/50 border-b flex items-center gap-2 flex-wrap text-xs"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-[11px] font-semibold text-slate-500">{isAr ? 'الفلاتر النشطة:' : 'Active Filters:'}</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border text-[11px]">
              <span>&quot;{searchQuery}&quot;</span>
              <button type="button" onClick={() => setSearchQuery('')} className="cursor-pointer text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border text-[11px]">
              <span>{getLocalizedStatus(statusFilter)}</span>
              <button type="button" onClick={() => setStatusFilter('all')} className="cursor-pointer text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {paymentFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border text-[11px]">
              <span>{paymentFilter}</span>
              <button type="button" onClick={() => setPaymentFilter('all')} className="cursor-pointer text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {channelFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border text-[11px]">
              <span>{channelFilter}</span>
              <button type="button" onClick={() => setChannelFilter('all')} className="cursor-pointer text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={resetAllFilters}
            className="text-[11px] text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer ms-auto"
          >
            {isAr ? 'مسح الكل' : 'Clear all'}
          </button>
        </div>
      )}

      {/* ── Table Content ── */}
      {processedOrders.length === 0 ? (
        /* Empty State Matching Image 1 */
        <div className="py-14 px-4 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm mb-1 text-slate-600 dark:text-slate-300">
            {isAr ? 'لا توجد طلبات تطابق الفلتر المحدد' : 'No orders match the selected filter'}
          </h4>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-semibold border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              {isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto min-w-0">
          <table className="w-full text-start text-xs border-collapse min-w-[680px] lg:min-w-full">
            <thead>
              <tr
                className="border-b text-xs font-black text-slate-950 dark:text-slate-100 select-none bg-slate-100/90 dark:bg-slate-800/80"
                style={{ borderColor: 'var(--border)' }}
              >
                <th className="py-3 px-4 text-start font-black whitespace-nowrap">{isAr ? 'رقم الطلب' : 'Order ID'}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap">{isAr ? 'العميل' : 'Customer'}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap hidden sm:table-cell">{isAr ? 'قناة البيع' : 'Sales Channel'}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap hidden md:table-cell">{isAr ? 'طريقة الدفع' : 'Payment Method'}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap hidden lg:table-cell">{isAr ? 'المنتجات' : 'Products'}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap">{isAr ? 'الإجمالي' : 'Total'}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap hidden sm:table-cell">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="py-3 px-4 text-center font-black whitespace-nowrap">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {paginatedOrders.map((ord) => {
                const statusStyle = statusChipStyle(ord.status);
                const firstItem = ord.items?.[0];
                const rawItemName = firstItem ? (isAr ? (firstItem.nameAr || firstItem.name) : (firstItem.nameEn || firstItem.name)) : '';
                const firstItemName = rawItemName || (isAr ? 'باقة منتجات' : 'Standard Item');
                const itemsCount = ord.items?.length || 0;

                return (
                  <tr
                    key={ord.id}
                    className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* 1. Order Number */}
                    <td className="py-3.5 px-4 font-black tracking-tight whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onNavigateTab('orders')}
                        className="font-mono text-xs font-black text-teal-700 hover:text-teal-900 dark:text-teal-400 hover:underline cursor-pointer text-start"
                      >
                        #{ord.orderNumber || ord.id.slice(0, 8)}
                      </button>
                    </td>

                    {/* 2. Customer */}
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="font-black text-xs text-slate-950 dark:text-white truncate">
                        {ord.customerName || (isAr ? 'عميل المتجر' : 'Store Customer')}
                      </div>
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate mt-0.5">
                        {ord.customerPhone || ord.customerEmail || '—'}
                      </div>
                    </td>

                    {/* 3. Sales Channel */}
                    <td className="py-3.5 px-4 hidden sm:table-cell whitespace-nowrap">
                      {getChannelBadge(ord.source)}
                    </td>

                    {/* 4. Payment Method */}
                    <td className="py-3.5 px-4 hidden md:table-cell whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                      {getPaymentBadge(ord.paymentMethod)}
                    </td>

                    {/* 5. Products */}
                    <td className="py-3.5 px-4 hidden lg:table-cell whitespace-nowrap max-w-[160px]">
                      <div className="truncate text-slate-900 dark:text-slate-100 font-bold text-xs" title={firstItemName}>
                        {firstItemName}
                      </div>
                      {itemsCount > 1 && (
                        <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                          {isAr ? `+ ${itemsCount - 1} منتجات إضافية` : `+ ${itemsCount - 1} more items`}
                        </div>
                      )}
                    </td>

                    {/* 6. Total Amount */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-black tabular-nums text-xs text-slate-950 dark:text-white">
                      {money(Number(ord.total) || 0)}
                    </td>

                    {/* 7. Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shadow-2xs shrink-0"
                        style={statusStyle}
                      >
                        {getStatusIcon(ord.status)}
                        <span>{getLocalizedStatus(ord.status)}</span>
                      </span>
                    </td>

                    {/* 8. Date */}
                    <td className="py-3.5 px-4 hidden sm:table-cell whitespace-nowrap text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                      {ord.date || '—'}
                    </td>

                    {/* 9. Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setInspectOrder(ord)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 hover:text-teal-700 dark:text-slate-200 dark:hover:text-teal-400 transition-colors cursor-pointer inline-flex items-center justify-center shadow-2xs"
                        title={isAr ? 'عرض تفاصيل الطلب السريعة' : 'Inspect order details'}
                        aria-label="View order"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination Bar (Matching Image 1: < [ 1 ] > and counter) ── */}
      <div
        className="flex items-center justify-between px-4 py-3 border-t text-xs select-none"
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Pagination navigation (< [1] [2] >) */}
        <div className="flex items-center gap-1.5">
          {/* Prev Button */}
          <button
            type="button"
            disabled={validPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            aria-label="Previous Page"
          >
            {dir === 'rtl' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Page Numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const isActive = p === validPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`min-w-[28px] h-7 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'border hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                style={
                  !isActive
                    ? {
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                      }
                    : undefined
                }
              >
                {p}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            type="button"
            disabled={validPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            aria-label="Next Page"
          >
            {dir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Counter Info: عرض 1-5 من أصل 12 طلب */}
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {isAr
            ? `عرض ${startRange}-${endRange} من أصل ${totalCount} طلب`
            : `Showing ${startRange}-${endRange} of ${totalCount} orders`}
        </div>
      </div>

      {inspectOrder && (
        <React.Suspense fallback={null}>
          <OrderDetailsModal
            isOpen={Boolean(inspectOrder)}
            onClose={() => setInspectOrder(null)}
            order={inspectOrder}
            onPrintInvoice={() => onNavigateTab('orders')}
            onEditOrder={() => onNavigateTab('orders')}
          />
        </React.Suspense>
      )}
    </div>
  );
});

DashboardOrdersTable.displayName = 'DashboardOrdersTable';
