import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Order } from '../../types';
import { usePrefs } from '../../i18n/PrefsContext';
import { useTenant } from '../../context/TenantContext';
import { useToast } from '../common/ToastProvider';
import { FloatingPopover } from '../common/FloatingPopover';
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
  RotateCcw,
  Check,
  X,
  Trash2,
  Building2,
} from 'lucide-react';
import { getOrderDate, parseOrderDate, statusChipStyle } from '../../utils/liveSeries';
import { formatRelativeTime } from '../../notification-system/utils/dateFilters';
import { OrderDetailsModal } from './orders/OrderDetailsModal';
import { OrderSourceIcon } from '../common/BrandIcons';
import {
  MadaIcon,
  ApplePayIcon,
  StcPayIcon,
  VisaIcon,
  MastercardIcon,
  CodIcon,
  TabbyIcon,
  TamaraIcon,
} from '../../themes/coffeeRoasters/components/PaymentIcons';
import { getCustomerDisplayName, getLocalizedItemName } from '../../utils/storeLocalization';
import { formatOrderRef } from '../../utils/orderDisplay';
import {
  localizeOrderStatus,
  localizePaymentMethod,
  localizeSalesChannel,
} from '../../utils/domainLabels';

interface DashboardOrdersTableProps {
  orders: Order[];
  onNavigateTab: (tab: string) => void;
  className?: string;
  onOpenCreateOrder?: () => void;
}

const PAGE_SIZE = 100;

type SortKey = 'date_desc' | 'date_asc' | 'total_desc' | 'total_asc' | 'id_desc' | 'id_asc';

export const DashboardOrdersTable: React.FC<DashboardOrdersTableProps> = ({
  orders,
  onNavigateTab,
  className = '',
  onOpenCreateOrder,
}) => {
  const { t, money, locale, dir } = usePrefs();
  const isAr = locale === 'ar';
  const { permanentDeleteOrder, currentProducts } = useTenant();
  const { toast, confirmWithReason } = useToast();
  const [inspectOrder, setInspectOrder] = useState<Order | null>(null);

  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date_desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter + Sort use body portal so page/shell overflow never clips the panel.
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const sortBtnRef = useRef<HTMLButtonElement>(null);

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

  const getLocalizedStatus = (status: string) => localizeOrderStatus(status, locale);

  const getUntouchedLabel = (ord: Order): string | null => {
    const s = String(ord.status || '').toLowerCase().replace(/[\s-]+/g, '_');
    if (s !== 'pending' && s !== 'awaiting_payment') return null;
    let created: Date | null = null;
    if (ord.createdAt) created = parseOrderDate(ord.createdAt);
    if (!created && ord.date && ord.time) created = parseOrderDate(`${ord.date} ${ord.time}`);
    if (!created) created = getOrderDate(ord);
    if (!created) return null;
    const relative = formatRelativeTime(created.toISOString(), locale);
    return `${t('untouchedLabel')} · ${relative}`;
  };

  const getChannelBadge = (source?: string) => {
    const label = localizeSalesChannel(source, locale);
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
        <OrderSourceIcon source={source || 'Direct'} className="w-3 h-3 shrink-0" />
        <span>{label}</span>
      </span>
    );
  };

  const getPaymentBadge = (method?: string) => {
    const pm = (method || '').toLowerCase();
    const label = localizePaymentMethod(method, locale);
    let icon = <VisaIcon className="h-5 w-auto shrink-0" />;
    if (pm.includes('cash') || pm.includes('استلام') || pm.includes('cod')) {
      icon = <CodIcon className="h-5 w-auto shrink-0" />;
    } else if (pm.includes('apple')) {
      icon = <ApplePayIcon className="h-5 w-auto shrink-0" />;
    } else if (pm.includes('mada') || pm.includes('مدى')) {
      icon = <MadaIcon className="h-5 w-auto shrink-0" />;
    } else if (pm.includes('stc')) {
      icon = <StcPayIcon className="h-5 w-auto shrink-0" />;
    } else if (pm.includes('tamara') || pm.includes('تمارا')) {
      icon = <TamaraIcon className="h-5 w-auto shrink-0" />;
    } else if (pm.includes('tabby') || pm.includes('تابي')) {
      icon = <TabbyIcon className="h-5 w-auto shrink-0" />;
    } else if (pm.includes('bank')) {
      icon = <Building2 className="h-4 w-4 shrink-0 text-teal-600" />;
    } else if (pm.includes('visa') || pm.includes('master') || pm.includes('card')) {
      icon = (
        <span className="inline-flex items-center gap-0.5 shrink-0">
          <VisaIcon className="h-5 w-auto" />
          <MastercardIcon className="h-5 w-auto" />
        </span>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
        {icon}
        <span className="text-xs truncate">{label}</span>
      </div>
    );
  };

  const startRange = totalCount === 0 ? 0 : (validPage - 1) * PAGE_SIZE + 1;
  const endRange = Math.min(validPage * PAGE_SIZE, totalCount);

  const handleDeleteOrder = async (ord: Order) => {
    const reason = await confirmWithReason({
      title: t('permanentDeleteOrderConfirmTitle') || (isAr ? 'حذف الطلب' : 'Delete Order'),
      message: (
        t('permanentDeleteOrderConfirmMsg') ||
        (isAr
          ? 'هل أنت متأكد من حذف الطلب {number}؟ اكتب سبب الحذف للمتابعة.'
          : 'Are you sure you want to delete order {number}? Enter a reason to continue.')
      ).replace('{number}', String(ord.orderNumber || ord.id)),
      confirmLabel: t('permanentDeleteOrder') || (isAr ? 'حذف' : 'Delete'),
      cancelLabel: isAr ? 'إلغاء' : 'Cancel',
      danger: true,
      reasonRequired: true,
      reasonLabel: isAr ? 'سبب الحذف' : 'Reason for deletion',
      reasonPlaceholder: isAr
        ? 'مثال: طلب مكرر، خطأ في البيانات، طلب تجريبي…'
        : 'e.g. Duplicate order, data error, test order…',
    });
    if (reason == null) return;
    const ok = await permanentDeleteOrder(ord.id, ord.storeId, reason);
    if (!ok) {
      toast(
        isAr ? 'تعذر حذف الطلب. تحقق من الصلاحيات أو حاول مرة أخرى.' : 'Could not delete the order. Check permissions or try again.',
        'error',
      );
      return;
    }
    if (inspectOrder?.id === ord.id) setInspectOrder(null);
    toast(
      t('permanentDeleteOrderSuccess') || (isAr ? 'تم حذف الطلب بنجاح' : 'Order deleted successfully'),
      'success',
    );
  };

  return (
    <div
      className={`u-panel rounded-2xl shadow-xs border transition-all duration-200 overflow-visible ${className}`}
      data-panel="dashboard-orders-table"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* ── Top Header Toolbar (Exact Match to Image 1) ── */}
      <div
        className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-3.5 p-4 sm:p-5 border-b rounded-t-2xl"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        {/* Title side (Right in RTL, Left in LTR) */}
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40">
            <ShoppingCart className="w-4 h-4" />
          </span>
          <h3 className="font-extrabold text-base sm:text-lg tracking-tight" style={{ color: 'var(--text)' }}>
            {t('recentOrders')}
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
              placeholder={t('searchInOrders')}
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

          {/* Filter Button — body portal panel (never clipped by shell / table) */}
          <button
            type="button"
            ref={filterBtnRef}
            onClick={() => {
              setShowFilterMenu((v) => !v);
              setShowSortMenu(false);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              showFilterMenu || hasActiveFilters
                ? 'border-teal-500 text-teal-700 bg-teal-50/70 dark:bg-teal-950/40 dark:text-teal-300'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            style={!showFilterMenu && !hasActiveFilters ? { borderColor: 'var(--border)', color: 'var(--text)' } : undefined}
            aria-expanded={showFilterMenu}
            aria-haspopup="listbox"
          >
            <Filter className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{t('filters')}</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
            )}
          </button>

          {/* Sort Button — body portal so shell overflow never clips */}
          <button
            type="button"
            ref={sortBtnRef}
            onClick={() => {
              setShowSortMenu((v) => !v);
              setShowFilterMenu(false);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs ${
              showSortMenu
                ? 'border-teal-500 text-teal-700 bg-teal-50/70 dark:bg-teal-950/40 dark:text-teal-300'
                : ''
            }`}
            style={!showSortMenu ? { borderColor: 'var(--border)', color: 'var(--text)' } : undefined}
            aria-expanded={showSortMenu}
            aria-haspopup="listbox"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('sort')}</span>
          </button>

          <FloatingPopover
            open={showSortMenu}
            anchorRef={sortBtnRef}
            onClose={() => setShowSortMenu(false)}
            width={192}
            align="end"
            estimatedHeight={280}
            className="py-1 rounded-xl border shadow-lg text-xs"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            {[
              { id: 'date_desc' as const, labelKey: 'sortDateNewest' as const },
              { id: 'date_asc' as const, labelKey: 'sortDateOldest' as const },
              { id: 'total_desc' as const, labelKey: 'sortTotalHighest' as const },
              { id: 'total_asc' as const, labelKey: 'sortTotalLowest' as const },
              { id: 'id_desc' as const, labelKey: 'sortOrderHighest' as const },
              { id: 'id_asc' as const, labelKey: 'sortOrderLowest' as const },
            ].map((s) => {
              const active = sortKey === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setSortKey(s.id);
                    setShowSortMenu(false);
                  }}
                  className="w-full px-3.5 py-2 text-start flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span className={active ? 'font-bold text-teal-600 dark:text-teal-400' : ''}>
                    {t(s.labelKey)}
                  </span>
                  {active && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                </button>
              );
            })}
          </FloatingPopover>

          {/* Manage Orders Button */}
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
            <span>{t('manageOrders')}</span>
          </button>
        </div>
      </div>

      {/* ── Filter dropdown pinned to Filters button ── */}
      <FloatingPopover
        open={showFilterMenu}
        anchorRef={filterBtnRef}
        onClose={() => setShowFilterMenu(false)}
        width={340}
        align="end"
        estimatedHeight={360}
        className="p-4 rounded-xl border shadow-lg space-y-3.5"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-xs sm:text-sm" style={{ color: 'var(--text)' }}>
            {t('filterOrders')}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[11px] text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('resetLabel')}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              {t('statusCol')}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
            >
              <option value="all">{t('allStatuses')}</option>
              <option value="completed">{t('completed')}</option>
              <option value="pending">{t('pendingStatus')}</option>
              <option value="processing">{t('processingStatus')}</option>
              <option value="shipped">{t('shippedStatus')}</option>
              <option value="cancelled">{t('cancelledStatus')}</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              {t('paymentMethod')}
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
            >
              <option value="all">{t('allPaymentMethods')}</option>
              <option value="mada">{t('mada')}</option>
              <option value="apple">{t('applePay')}</option>
              <option value="tamara">{t('tamara')}</option>
              <option value="tabby">{t('tabby')}</option>
              <option value="cash">{t('cashOnDelivery')}</option>
              <option value="bank">{isAr ? 'تحويل بنكي' : 'Bank Transfer'}</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              {t('salesChannel')}
            </label>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--input-fg)' }}
            >
              <option value="all">{t('allChannels')}</option>
              <option value="Direct">{localizeSalesChannel('Direct', locale)}</option>
              <option value="TikTok">{localizeSalesChannel('TikTok', locale)}</option>
              <option value="Snapchat">{localizeSalesChannel('Snapchat', locale)}</option>
              <option value="Instagram">{localizeSalesChannel('Instagram', locale)}</option>
              <option value="WhatsApp">{localizeSalesChannel('WhatsApp', locale)}</option>
              <option value="Facebook">{localizeSalesChannel('Facebook', locale)}</option>
              <option value="Google">{localizeSalesChannel('Google Ads', locale)}</option>
            </select>
          </div>
        </div>
      </FloatingPopover>

      {/* ── Active Filters Indicators ── */}
      {hasActiveFilters && (
        <div
          className="px-4 py-2 bg-slate-50/70 dark:bg-slate-900/50 border-b flex items-center gap-2 flex-wrap text-xs"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-[11px] font-semibold text-slate-500">{t('activeFilters')}</span>
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
              <span>{localizePaymentMethod(paymentFilter, locale)}</span>
              <button type="button" onClick={() => setPaymentFilter('all')} className="cursor-pointer text-slate-400 hover:text-slate-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {channelFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border text-[11px]">
              <span>{localizeSalesChannel(channelFilter, locale)}</span>
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
            {t('clearAll')}
          </button>
        </div>
      )}

      {/* ── Table Content ── */}
      {processedOrders.length === 0 ? (
        <div className="py-14 px-4 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm mb-1 text-slate-600 dark:text-slate-300">
            {hasActiveFilters ? t('noOrdersMatchFilter') : t('noOrdersYetHint')}
          </h4>
          {!hasActiveFilters && (
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              {t('realOrdersOnlyHint')}
            </p>
          )}
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-semibold border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              {t('resetFilters')}
            </button>
          ) : onOpenCreateOrder ? (
            <button
              type="button"
              onClick={onOpenCreateOrder}
              className="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer"
              style={{ background: '#007b83' }}
            >
              {t('createManualOrder')}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="relative z-0 overflow-x-auto min-w-0 rounded-b-none">
          <table className="w-full text-start text-xs border-collapse min-w-[680px] lg:min-w-full">
            <thead>
              <tr
                className="border-b text-xs font-black text-slate-950 dark:text-slate-100 select-none bg-slate-100/90 dark:bg-slate-800/80"
                style={{ borderColor: 'var(--border)' }}
              >
                <th className="py-3 px-4 text-start font-black whitespace-nowrap">{t('orderIdCol')}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap">{t('customerCol')}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap hidden sm:table-cell">{t('salesChannel')}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap hidden md:table-cell">{t('paymentMethod')}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap hidden lg:table-cell">{t('productsCol')}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap">{t('total')}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap">{t('statusCol')}</th>
                <th className="py-3 px-4 text-start font-black whitespace-nowrap hidden sm:table-cell">{t('dateCol')}</th>
                <th className="py-3 px-4 text-center font-black whitespace-nowrap">{t('actionsCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {paginatedOrders.map((ord) => {
                const statusStyle = statusChipStyle(ord.status);
                const firstItem = ord.items?.[0];
                const summaryName = ord.itemsSummary?.split(/[,|·]/)[0]?.trim() || '';
                // Lean order lists often omit line items — localize items_summary too (EN must not show AR).
                const catalogMatch = firstItem
                  ? (currentProducts || []).find(
                      (p) =>
                        (firstItem.sku && p.sku && p.sku === firstItem.sku) ||
                        (firstItem.id && p.id === firstItem.id) ||
                        (firstItem.name &&
                          (p.nameAr === firstItem.name ||
                            p.name === firstItem.name ||
                            p.nameEn === firstItem.name)),
                    )
                  : summaryName
                    ? (currentProducts || []).find(
                        (p) =>
                          p.nameAr === summaryName ||
                          p.name === summaryName ||
                          p.nameEn === summaryName ||
                          (p.nameAr && summaryName.includes(p.nameAr)) ||
                          (p.nameAr && p.nameAr.includes(summaryName)),
                      )
                    : undefined;
                const firstItemName =
                  (catalogMatch
                    ? getLocalizedItemName(
                        {
                          name: catalogMatch.name,
                          nameAr: catalogMatch.nameAr,
                          nameEn: catalogMatch.nameEn || catalogMatch.name,
                          sku: catalogMatch.sku,
                        },
                        locale,
                      )
                    : '') ||
                  (firstItem ? getLocalizedItemName(firstItem, locale) : '') ||
                  (summaryName ? getLocalizedItemName({ name: summaryName }, locale) : '') ||
                  t('standardItem');
                const itemsCount = ord.items?.length || ord.itemsCount || 0;

                return (
                  <tr
                    key={ord.id}
                    className="relative z-0 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors align-top"
                  >
                    {/* 1. Order Number */}
                    <td className="py-3.5 px-4 font-black tracking-tight whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onNavigateTab('orders')}
                        className="font-mono text-xs font-black text-teal-700 hover:text-teal-900 dark:text-teal-400 hover:underline cursor-pointer text-start"
                      >
                        {formatOrderRef(ord.orderNumber, ord.id)}
                      </button>
                    </td>

                    {/* 2. Customer */}
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="font-black text-xs text-slate-950 dark:text-white truncate">
                        {getCustomerDisplayName(ord.customerName, locale)}
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
                          + {itemsCount - 1} {t('items')}
                        </div>
                      )}
                    </td>

                    {/* 6. Total Amount */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-black tabular-nums text-xs text-slate-950 dark:text-white">
                      {money(Number(ord.total) || 0)}
                    </td>

                    {/* 7. Status Badge */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shadow-2xs shrink-0"
                          style={statusStyle}
                        >
                          {getStatusIcon(ord.status)}
                          <span>{getLocalizedStatus(ord.status)}</span>
                        </span>
                        {(() => {
                          const untouched = getUntouchedLabel(ord);
                          if (!untouched) return null;
                          return (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap">
                              <Clock className="w-3 h-3 shrink-0" />
                              {untouched}
                            </span>
                          );
                        })()}
                      </div>
                    </td>

                    {/* 8. Date */}
                    <td className="py-3.5 px-4 hidden sm:table-cell whitespace-nowrap text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                      {ord.date || '—'}
                    </td>

                    {/* 9. Actions — view + delete (reason required) */}
                    <td className="py-3.5 px-3 sm:px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-1.5 flex-nowrap">
                        <button
                          type="button"
                          onClick={() => setInspectOrder(ord)}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 hover:text-teal-700 dark:text-slate-200 dark:hover:text-teal-400 transition-colors cursor-pointer inline-flex items-center justify-center shadow-2xs"
                          title={t('viewOrder')}
                          aria-label={t('viewOrder')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteOrder(ord)}
                          className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer inline-flex items-center justify-center shadow-2xs"
                          title={t('permanentDeleteOrder') || (isAr ? 'حذف' : 'Delete')}
                          aria-label={t('permanentDeleteOrder') || (isAr ? 'حذف' : 'Delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
            aria-label={t('previousPage')}
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
            aria-label={t('nextPage')}
          >
            {dir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Counter Info */}
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {t('showingOrdersRange')
            .replace('{from}', String(startRange))
            .replace('{to}', String(endRange))
            .replace('{total}', String(totalCount))}
        </div>
      </div>

      {inspectOrder && (
        <OrderDetailsModal
          isOpen={Boolean(inspectOrder)}
          onClose={() => setInspectOrder(null)}
          order={inspectOrder}
          onPrintInvoice={() => onNavigateTab('orders')}
          onEditOrder={() => onNavigateTab('orders')}
        />
      )}
    </div>
  );
};
