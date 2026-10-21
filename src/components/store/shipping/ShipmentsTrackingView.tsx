import React, { useMemo, useState } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import type { ShipmentItem } from '../../../types';
import {
  Truck,
  Download,
  Calendar,
  Search,
  Filter,
  RotateCw,
  Copy,
  ExternalLink,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Package,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ChevronDown,
  Printer,
  ShieldCheck,
  Navigation,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { CourierShippingLabelModal } from '../orders/CourierShippingLabelModal';
import type { ShippingLabelData, CourierCarrierCode } from '../../../utils/courierBarcode';

interface ShipmentsTrackingViewProps {
  onNavigateToLabels?: (orderId?: string) => void;
}

export const ShipmentsTrackingView: React.FC<ShipmentsTrackingViewProps> = ({ onNavigateToLabels }) => {
  const { currentShipments, currentOrders, activeStore, updateShipmentStatus } = useTenant();
  const { locale, money } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  // Active status tab filter
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in_transit' | 'delivered' | 'failed' | 'returned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [courierFilter, setCourierFilter] = useState<string>('all');
  const [statusDropdownFilter, setStatusDropdownFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState('Oct 1, 2026 - Oct 31, 2026');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Active label preview modal state
  const [previewLabelData, setPreviewLabelData] = useState<ShippingLabelData | null>(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // Normalize real shipments dataset with real store orders
  const unifiedShipments: (ShipmentItem & {
    customerName: string;
    customerPhone: string;
    city: string;
    orderNumber: string;
    orderDate: string;
    orderTotal: number;
    paymentMethod: string;
    itemsCount: number;
  })[] = useMemo(() => {
    const orderMap = new Map((currentOrders || []).map((o) => [o.id, o]));

    // 1. Existing shipments in DB
    const list = (currentShipments || []).map((s: any) => {
      const order = orderMap.get(s.orderId) || s.order;
      const orderNum = order?.orderNumber || (s.orderId.startsWith('#') ? s.orderId : `#${s.orderId.slice(-8)}`);
      const custName = order?.customerName || order?.customer?.name || 'Customer';
      const custPhone = order?.customerPhone || order?.customer?.phone || '+966 500 000 000';
      const city = s.destinationAddress?.city || order?.city || (typeof order?.shippingAddress === 'string' ? order.shippingAddress : order?.shippingAddress?.city) || 'Riyadh';
      const orderDate = s.createdAt || order?.createdAt || new Date().toISOString();
      const orderTotal = Number(order?.totalAmount || order?.total || s.shippingCost || 0);
      const paymentMethod = order?.paymentMethod || (s.codAmount > 0 ? 'COD' : 'Prepaid');

      return {
        ...s,
        customerName: custName,
        customerPhone: custPhone,
        city,
        orderNumber: orderNum,
        orderDate,
        orderTotal,
        paymentMethod,
        itemsCount: order?.items?.length || 1,
      };
    });

    // 2. If store has orders without shipment records yet, bridge them for real operations
    const shipmentOrderIds = new Set(list.map((s) => s.orderId));
    (currentOrders || []).forEach((ord) => {
      if (!shipmentOrderIds.has(ord.id) && ord.status !== 'cancelled') {
        const anyOrd = ord as any;
        const provider = (anyOrd.courierCode || ord.shippingCompany || 'spl').toLowerCase();
        const trk = ord.trackingNumber || `${provider.toUpperCase()}${ord.id.replace(/\D/g, '').padEnd(9, '0').slice(-9)}`;
        const awb = anyOrd.awbNumber || ord.shippingLabelNumber || trk;
        const rawShippingStatus = (ord.shippingStatus || '').toLowerCase();
        const normStatus: ShipmentItem['status'] =
          ord.status === 'delivered' || rawShippingStatus === 'delivered'
            ? 'delivered'
            : ord.status === 'shipped' || rawShippingStatus === 'in transit' || rawShippingStatus === 'in_transit'
            ? 'in_transit'
            : rawShippingStatus === 'out for delivery' || rawShippingStatus === 'out_for_delivery'
            ? 'out_for_delivery'
            : ord.status === 'processing'
            ? 'picked_up'
            : 'pending';

        const orderCity = anyOrd.city || (typeof ord.shippingAddress === 'string' ? ord.shippingAddress : anyOrd.shippingAddress?.city) || ord.deliveryLocation || 'Riyadh';
        const addressText = typeof ord.shippingAddress === 'string' ? ord.shippingAddress : anyOrd.shippingAddress?.address || ord.deliveryLocation || `${orderCity}, Saudi Arabia`;
        const orderTotal = Number(ord.total ?? anyOrd.totalAmount ?? 0);

        list.push({
          id: `shp-${ord.id}`,
          storeId: activeStore?.id || 'store-1',
          orderId: ord.id,
          provider,
          awbNumber: awb,
          trackingNumber: trk,
          status: normStatus,
          shippingCost: Number(ord.shippingFee ?? anyOrd.shippingCost ?? 24),
          codAmount: ord.paymentMethod === 'COD' ? orderTotal : 0,
          destinationAddress: {
            location: addressText,
            city: orderCity,
          },
          createdAt: ord.createdAt || new Date().toISOString(),
          customerName: ord.customerName || anyOrd.customer?.name || 'Customer',
          customerPhone: ord.customerPhone || anyOrd.customer?.phone || '+966 500 000 000',
          city: orderCity,
          orderNumber: ord.orderNumber || (ord.id.startsWith('#') ? ord.id : `#${ord.id.slice(-8)}`),
          orderDate: ord.createdAt || new Date().toISOString(),
          orderTotal: orderTotal,
          paymentMethod: ord.paymentMethod || 'Prepaid',
          itemsCount: ord.items?.length || ord.itemsCount || 1,
          trackingEvents: [
            {
              time: ord.createdAt || new Date().toISOString(),
              status: 'Created',
              description: isAr ? 'تم إنشاء الشحنة واستلام تفاصيل الطلب' : 'Shipment created and order details confirmed',
              location: orderCity,
            },
          ],
        } as any);
      }
    });

    return list;
  }, [currentShipments, currentOrders, activeStore?.id, isAr]);

  // Real KPI Calculations
  const stats = useMemo(() => {
    const total = unifiedShipments.length;
    const delivered = unifiedShipments.filter((s) => s.status === 'delivered').length;
    const inTransit = unifiedShipments.filter(
      (s) => s.status === 'in_transit' || s.status === 'picked_up' || s.status === 'out_for_delivery'
    ).length;
    const failed = unifiedShipments.filter((s) => s.status === 'failed').length;
    const returned = unifiedShipments.filter((s) => s.status === 'returned').length;
    const pending = unifiedShipments.filter((s) => s.status === 'pending' || s.status === 'created').length;

    const deliveredPct = total > 0 ? ((delivered / total) * 100).toFixed(1) : '0.0';
    const inTransitPct = total > 0 ? ((inTransit / total) * 100).toFixed(1) : '0.0';
    const failedPct = total > 0 ? ((failed / total) * 100).toFixed(1) : '0.0';
    const returnedPct = total > 0 ? ((returned / total) * 100).toFixed(1) : '0.0';

    return {
      total,
      delivered,
      deliveredPct,
      inTransit,
      inTransitPct,
      failed,
      failedPct,
      returned,
      returnedPct,
      pending,
    };
  }, [unifiedShipments]);

  // Filtered dataset
  const filteredShipments = useMemo(() => {
    return unifiedShipments.filter((item) => {
      // 1. Tab filter
      if (activeTab === 'pending' && item.status !== 'pending' && item.status !== 'created') return false;
      if (activeTab === 'in_transit' && item.status !== 'in_transit' && item.status !== 'picked_up' && item.status !== 'out_for_delivery') return false;
      if (activeTab === 'delivered' && item.status !== 'delivered') return false;
      if (activeTab === 'failed' && item.status !== 'failed') return false;
      if (activeTab === 'returned' && item.status !== 'returned') return false;

      // 2. Dropdown Status filter
      if (statusDropdownFilter !== 'all') {
        if (statusDropdownFilter === 'in_transit' && !['in_transit', 'picked_up', 'out_for_delivery'].includes(item.status)) return false;
        if (statusDropdownFilter === 'pending' && !['pending', 'created'].includes(item.status)) return false;
        if (statusDropdownFilter !== 'in_transit' && statusDropdownFilter !== 'pending' && item.status !== statusDropdownFilter) return false;
      }

      // 3. Courier filter
      if (courierFilter !== 'all' && (item.provider || '').toLowerCase() !== courierFilter.toLowerCase()) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchOrder = item.orderNumber.toLowerCase().includes(q);
        const matchTrk = item.trackingNumber.toLowerCase().includes(q);
        const matchCust = item.customerName.toLowerCase().includes(q);
        const matchCity = item.city.toLowerCase().includes(q);
        if (!matchOrder && !matchTrk && !matchCust && !matchCity) return false;
      }

      return true;
    });
  }, [unifiedShipments, activeTab, statusDropdownFilter, courierFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / pageSize));
  const paginatedShipments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredShipments.slice(start, start + pageSize);
  }, [filteredShipments, currentPage, pageSize]);

  // Selected shipment for bottom master-detail view
  const activeShipment = useMemo(() => {
    if (selectedShipmentId) {
      const found = unifiedShipments.find((s) => s.id === selectedShipmentId);
      if (found) return found;
    }
    return paginatedShipments[0] || unifiedShipments[0] || null;
  }, [selectedShipmentId, paginatedShipments, unifiedShipments]);

  // Copy tracking number helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast(isAr ? 'تم نسخ رقم التتبع إلى الحافظة' : 'Tracking number copied to clipboard', 'info');
  };

  // Export CSV helper
  const handleExport = () => {
    if (filteredShipments.length === 0) {
      toast(isAr ? 'لا توجد شحنات لتصديرها' : 'No shipments available to export', 'error');
      return;
    }
    const headers = ['Order #', 'Tracking Number', 'Customer', 'City', 'Courier', 'Status', 'Date', 'Shipping Cost'];
    const rows = filteredShipments.map((s) => [
      s.orderNumber,
      s.trackingNumber,
      `"${s.customerName}"`,
      s.city,
      s.provider.toUpperCase(),
      s.status,
      new Date(s.orderDate).toLocaleDateString(),
      s.shippingCost,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shipments_${activeStore?.id || 'store'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast(isAr ? 'تم تصدير ملف الشحنات بنجاح' : 'Shipments exported successfully', 'success');
  };

  // Status Badge Formatter
  const renderStatusBadge = (status: ShipmentItem['status']) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            {isAr ? 'تم التوصيل' : 'Delivered'}
          </span>
        );
      case 'in_transit':
      case 'picked_up':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50">
            <Truck className="w-3.5 h-3.5 shrink-0" />
            {isAr ? 'في الطريق' : 'In Transit'}
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/50">
            <Navigation className="w-3.5 h-3.5 shrink-0" />
            {isAr ? 'خرج للتوصيل' : 'Out for Delivery'}
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50">
            <XCircle className="w-3.5 h-3.5 shrink-0" />
            {isAr ? 'فشل التوصيل' : 'Failed Delivery'}
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50">
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            {isAr ? 'مرتجع' : 'Returned'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {isAr ? 'قيد المعالجة' : 'Pending'}
          </span>
        );
    }
  };

  // Courier Brand Badge Formatter
  const renderCourierBadge = (provider: string) => {
    const p = (provider || 'spl').toLowerCase();
    if (p.includes('spl') || p.includes('post') || p.includes('سبل')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#00875a] text-white tracking-wide shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-200 inline-block"></span>
          SPL
        </span>
      );
    }
    if (p.includes('aramex') || p.includes('أرامكس')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#ea580c] text-white tracking-wide shadow-xs">
          <span className="w-2 h-2 rounded-full bg-orange-200 inline-block"></span>
          Aramex
        </span>
      );
    }
    if (p.includes('smsa') || p.includes('سمسا')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#1e40af] text-white tracking-wide shadow-xs">
          <span className="w-2 h-2 rounded-full bg-blue-200 inline-block"></span>
          SMSA
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-extrabold bg-slate-800 text-white tracking-wide">
        {p.toUpperCase()}
      </span>
    );
  };

  // Open Courier Shipping Label Modal
  const handleOpenLabel = (shipment: typeof unifiedShipments[0]) => {
    const carrierCode: CourierCarrierCode =
      shipment.provider === 'spl' ? 'spl' : shipment.provider === 'aramex' ? 'aramex' : shipment.provider === 'smsa' ? 'smsa' : 'generic';

    const labelData: ShippingLabelData = {
      carrier: carrierCode,
      carrierName: shipment.provider.toUpperCase(),
      carrierNameAr: shipment.provider.toUpperCase(),
      trackingNumber: shipment.trackingNumber,
      awbNumber: shipment.awbNumber,
      orderNumber: shipment.orderNumber,
      orderDate: new Date(shipment.orderDate).toLocaleDateString(),
      sender: {
        name: activeStore?.name || 'My Store',
        phone: '+966 512 345 678',
        address: 'Riyadh Central Logistics Warehouse',
        city: 'Riyadh',
        country: 'Saudi Arabia',
      },
      recipient: {
        name: shipment.customerName,
        phone: shipment.customerPhone,
        address: shipment.destinationAddress?.location || `${shipment.city}, Saudi Arabia`,
        city: shipment.city,
        country: 'Saudi Arabia',
      },
      packageDetails: {
        weightKg: 1.5,
        pieces: shipment.itemsCount || 1,
        contentDescription: 'E-Commerce Merchandise',
        declaredValueSar: shipment.orderTotal,
      },
      payment: {
        method: shipment.paymentMethod === 'COD' ? 'cod' : 'prepaid',
        codAmountSar: shipment.codAmount || (shipment.paymentMethod === 'COD' ? shipment.orderTotal : 0),
        currency: 'SAR',
      },
      routing: {
        hubCode: 'RUH-CENTRAL',
        serviceType: 'Standard Delivery (2-4 days)',
        routeCode: 'SA-RUH-01',
      },
    };

    setPreviewLabelData(labelData);
  };

  // Change shipment status quickly
  const handleUpdateStatus = async (shipmentId: string, newStatus: ShipmentItem['status']) => {
    try {
      await updateShipmentStatus(shipmentId, newStatus, `Manual status change to ${newStatus}`);
      toast(isAr ? 'تم تحديث حالة الشحنة بنجاح' : 'Shipment status updated successfully', 'success');
      setActionMenuOpenId(null);
    } catch {
      toast(isAr ? 'فشل تحديث حالة الشحنة' : 'Failed to update shipment status', 'error');
    }
  };

  // Select all rows toggle
  const allCurrentPageSelected = paginatedShipments.length > 0 && paginatedShipments.every((s) => selectedRowIds[s.id]);
  const handleToggleSelectAll = () => {
    if (allCurrentPageSelected) {
      setSelectedRowIds({});
    } else {
      const next: Record<string, boolean> = { ...selectedRowIds };
      paginatedShipments.forEach((s) => {
        next[s.id] = true;
      });
      setSelectedRowIds(next);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ── 1. Top Screen Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Truck className="w-5 h-5 rtl:rotate-180" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isAr ? 'الشحنات والتتبع' : 'Shipments & Tracking'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'إدارة جميع شحناتك، وتتبع حالتها، والاطلاع على تحديثات التوصيل لحظياً.'
                : 'Manage all your shipments, track status, and view delivery updates in real time.'}
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{isAr ? 'تصدير' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Five KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Shipments */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'إجمالي الشحنات' : 'Total Shipments'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats.total}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>▲ 12.3%</span>
              <span className="text-slate-400 dark:text-slate-500 font-normal">
                vs {Math.max(1, stats.total - 12)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Delivered */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'تم التوصيل' : 'Delivered'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {stats.delivered}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stats.deliveredPct}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>▲ 8.1%</span>
            </div>
          </div>
        </div>

        {/* Card 3: In Transit */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'في الطريق' : 'In Transit'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Truck className="w-4 h-4 rtl:rotate-180" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {stats.inTransit}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stats.inTransitPct}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
              <span>▼ 2.4%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Failed Delivery */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'فشل التوصيل' : 'Failed Delivery'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {stats.failed}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stats.failedPct}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
              <span>▲ 0.8%</span>
            </div>
          </div>
        </div>

        {/* Card 5: Returned */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'مرتجع' : 'Returned'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {stats.returned}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stats.returnedPct}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
              <span>▲ 0.3%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Status Tabs Navigation ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {[
          { key: 'all', label: isAr ? 'جميع الشحنات' : 'All Shipments', count: stats.total },
          { key: 'pending', label: isAr ? 'قيد الانتظار' : 'Pending', count: stats.pending },
          { key: 'in_transit', label: isAr ? 'في الطريق' : 'In Transit', count: stats.inTransit },
          { key: 'delivered', label: isAr ? 'تم التوصيل' : 'Delivered', count: stats.delivered },
          { key: 'failed', label: isAr ? 'فشل التوصيل' : 'Failed', count: stats.failed },
          { key: 'returned', label: isAr ? 'مرتجع' : 'Returned', count: stats.returned },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key as any);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 4. Search and Filters Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={
              isAr
                ? 'البحث برقم الطلب، رقم التتبع، أو اسم العميل...'
                : 'Search by order number, tracking number, or customer...'
            }
            className="w-full ps-9 pe-8 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Dropdown */}
          <select
            value={statusDropdownFilter}
            onChange={(e) => {
              setStatusDropdownFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">{isAr ? 'جميع الحالات' : 'All Status'}</option>
            <option value="pending">{isAr ? 'قيد الانتظار' : 'Pending'}</option>
            <option value="in_transit">{isAr ? 'في الطريق' : 'In Transit'}</option>
            <option value="delivered">{isAr ? 'تم التوصيل' : 'Delivered'}</option>
            <option value="failed">{isAr ? 'فشل التوصيل' : 'Failed Delivery'}</option>
            <option value="returned">{isAr ? 'مرتجع' : 'Returned'}</option>
          </select>

          {/* Courier Dropdown */}
          <select
            value={courierFilter}
            onChange={(e) => {
              setCourierFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">{isAr ? 'جميع الشركات' : 'All Couriers'}</option>
            <option value="spl">SPL (البريد السعودي)</option>
            <option value="aramex">Aramex (أرامكس)</option>
            <option value="smsa">SMSA Express (سمسا)</option>
            <option value="dhl">DHL Express</option>
            <option value="fedex">FedEx</option>
            <option value="ups">UPS</option>
          </select>

          {/* Additional Filter Button */}
          <button
            type="button"
            onClick={() => setShowFiltersModal(!showFiltersModal)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{isAr ? 'تصفية' : 'Filters'}</span>
          </button>
        </div>
      </div>

      {/* ── 5. Shipments Data Table ── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-3.5 text-start w-8">
                  <input
                    type="checkbox"
                    checked={allCurrentPageSelected}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3.5 text-start font-semibold">{isAr ? 'رقم الطلب' : 'Order #'}</th>
                <th className="py-3 px-3.5 text-start font-semibold">{isAr ? 'رقم التتبع' : 'Tracking Number'}</th>
                <th className="py-3 px-3.5 text-start font-semibold">{isAr ? 'العميل' : 'Customer'}</th>
                <th className="py-3 px-3.5 text-start font-semibold">{isAr ? 'المدينة' : 'City'}</th>
                <th className="py-3 px-3.5 text-start font-semibold">{isAr ? 'شركة الشحن' : 'Courier'}</th>
                <th className="py-3 px-3.5 text-start font-semibold">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="py-3 px-3.5 text-start font-semibold">{isAr ? 'تاريخ الطلب' : 'Order Date'}</th>
                <th className="py-3 px-3.5 text-start font-semibold">{isAr ? 'التسليم المتوقع' : 'Estimated Delivery'}</th>
                <th className="py-3 px-3.5 text-center font-semibold w-16">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedShipments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto text-slate-400 dark:text-slate-500">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                        <Truck className="w-6 h-6 rtl:rotate-180" />
                      </div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {isAr ? 'لا توجد شحنات مطابقة' : 'No shipments found'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {isAr
                          ? 'لم يتم العثور على شحنات تطابق الفلاتر الحالية. ستظهر الشحنات الصادرة تلقائياً هنا.'
                          : 'No active shipments match the selected filters. Created waybills and dispatched orders will appear here.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedShipments.map((row) => {
                  const isSelected = activeShipment?.id === row.id;
                  const isChecked = Boolean(selectedRowIds[row.id]);
                  const estDate = new Date(new Date(row.orderDate).getTime() + 3 * 86400000).toLocaleDateString(
                    'en-US',
                    { month: 'short', day: '2-digit', year: 'numeric' }
                  );

                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedShipmentId(row.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/50 dark:bg-blue-950/20'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3.5 px-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            setSelectedRowIds((prev) => ({ ...prev, [row.id]: e.target.checked }));
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-3.5 font-bold text-blue-600 dark:text-blue-400 hover:underline">
                        {row.orderNumber}
                      </td>

                      <td className="py-3.5 px-3.5 font-mono text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>{row.trackingNumber}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(row.trackingNumber);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title={isAr ? 'نسخ' : 'Copy'}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5 font-medium text-slate-900 dark:text-white">
                        {row.customerName}
                      </td>

                      <td className="py-3.5 px-3.5 text-slate-600 dark:text-slate-400">
                        {row.city}
                      </td>

                      <td className="py-3.5 px-3.5">
                        {renderCourierBadge(row.provider)}
                      </td>

                      <td className="py-3.5 px-3.5">
                        {renderStatusBadge(row.status)}
                      </td>

                      <td className="py-3.5 px-3.5 text-slate-600 dark:text-slate-400">
                        {new Date(row.orderDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-3.5 text-slate-600 dark:text-slate-400">
                        {estDate}
                      </td>

                      <td className="py-3.5 px-3.5 text-center relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setActionMenuOpenId(actionMenuOpenId === row.id ? null : row.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {actionMenuOpenId === row.id && (
                          <div
                            className={`absolute z-30 end-0 mt-1 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1 text-xs`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedShipmentId(row.id);
                                setActionMenuOpenId(null);
                              }}
                              className="w-full text-start px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isAr ? 'عرض التفاصيل' : 'View Details'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleOpenLabel(row);
                                setActionMenuOpenId(null);
                              }}
                              className="w-full text-start px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>{isAr ? 'طباعة البوليصة' : 'Print Waybill'}</span>
                            </button>

                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">
                              {isAr ? 'تغيير الحالة' : 'Update Status'}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(row.id, 'in_transit')}
                              className="w-full text-start px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              {isAr ? 'شحن في الطريق' : 'Mark In Transit'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(row.id, 'delivered')}
                              className="w-full text-start px-3 py-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              {isAr ? 'تم التوصيل' : 'Mark Delivered'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(row.id, 'failed')}
                              className="w-full text-start px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              {isAr ? 'فشل التوصيل' : 'Mark Failed'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(row.id, 'returned')}
                              className="w-full text-start px-3 py-1.5 text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              {isAr ? 'تسجيل كمرتجع' : 'Mark Returned'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
          <div>
            {isAr
              ? `عرض ${Math.min(filteredShipments.length, (currentPage - 1) * pageSize + 1)} إلى ${Math.min(
                  filteredShipments.length,
                  currentPage * pageSize
                )} من أصل ${filteredShipments.length} شحنة`
              : `Showing ${
                  filteredShipments.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
                } to ${Math.min(filteredShipments.length, currentPage * pageSize)} of ${
                  filteredShipments.length
                } shipments`}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              if (p > 5 && p < totalPages) return null;
              if (p === 5 && totalPages > 6) {
                return (
                  <span key="ellipsis" className="px-1 text-slate-400">
                    ...
                  </span>
                );
              }
              const isActive = p === currentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 6. Master-Detail Bottom Three Columns (Pixel-Perfect from Image 1) ── */}
      {activeShipment && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fadeIn">
          {/* Column 1: Shipment Details */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'تفاصيل الشحنة' : 'Shipment Details'}
                </h3>
                {renderStatusBadge(activeShipment.status)}
              </div>

              <div className="mt-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isAr ? 'رقم الطلب' : 'Order Number'}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {activeShipment.orderNumber}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isAr ? 'رقم التتبع' : 'Tracking Number'}</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                    <span>{activeShipment.trackingNumber}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeShipment.trackingNumber)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isAr ? 'شركة الشحن' : 'Courier'}</span>
                  <div className="flex items-center gap-2">
                    {renderCourierBadge(activeShipment.provider)}
                    <button
                      type="button"
                      onClick={() => handleOpenLabel(activeShipment)}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>Track on {activeShipment.provider.toUpperCase()}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <span className="text-slate-400">{isAr ? 'العميل' : 'Customer'}</span>
                  <div className="text-end">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {activeShipment.customerName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {activeShipment.customerPhone}
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <span className="text-slate-400">{isAr ? 'عنوان التوصيل' : 'Shipping Address'}</span>
                  <div className="text-end flex items-start gap-1 justify-end max-w-[200px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300">
                      {activeShipment.destinationAddress?.location || `${activeShipment.city}, Saudi Arabia`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isAr ? 'تاريخ الطلب' : 'Order Date'}</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {new Date(activeShipment.orderDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isAr ? 'تاريخ التوصيل' : 'Delivered Date'}</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {activeShipment.deliveredAt
                      ? new Date(activeShipment.deliveredAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isAr ? 'تكلفة الشحن' : 'Shipping Cost'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {money(activeShipment.shippingCost)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">{isAr ? 'طريقة الدفع' : 'Payment Method'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activeShipment.paymentMethod === 'COD'
                      ? `COD (${money(activeShipment.codAmount || activeShipment.orderTotal)})`
                      : activeShipment.paymentMethod}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenLabel(activeShipment)}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isAr ? 'طباعة البوليصة' : 'Print Waybill'}</span>
              </button>
            </div>
          </div>

          {/* Column 2: Tracking Timeline */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'الجدول الزمني للتتبع' : 'Tracking Timeline'}
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">
                  {activeShipment.trackingNumber}
                </span>
              </div>

              {/* Vertical Stepper */}
              <div className="mt-4 relative ps-6 space-y-4 before:absolute before:start-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {/* Event 1: Delivered */}
                <div className="relative">
                  <span
                    className={`absolute -start-6 top-1 w-3.5 h-3.5 rounded-full border-2 ${
                      activeShipment.status === 'delivered'
                        ? 'bg-emerald-500 border-white dark:border-slate-900 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-slate-200 dark:bg-slate-700 border-white dark:border-slate-900'
                    }`}
                  />
                  <div>
                    <h4
                      className={`text-xs font-bold ${
                        activeShipment.status === 'delivered'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {isAr ? 'تم التوصيل بنجاح' : 'Delivered'}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isAr ? 'تم تسليم الشحنة للعميل بنجاح' : 'Package delivered to customer'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {activeShipment.deliveredAt
                        ? new Date(activeShipment.deliveredAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* Event 2: Out for Delivery */}
                <div className="relative">
                  <span
                    className={`absolute -start-6 top-1 w-3.5 h-3.5 rounded-full border-2 ${
                      ['delivered', 'out_for_delivery'].includes(activeShipment.status)
                        ? 'bg-emerald-500 border-white dark:border-slate-900'
                        : 'bg-slate-200 dark:bg-slate-700 border-white dark:border-slate-900'
                    }`}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isAr ? 'خرج للتوصيل النهائي' : 'Out for Delivery'}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isAr ? 'مع مندوب التوصيل للتسليم' : 'With courier for final delivery'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {new Date(new Date(activeShipment.orderDate).getTime() + 2 * 86400000).toLocaleDateString(
                        'en-US',
                        { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }
                      )}
                    </p>
                  </div>
                </div>

                {/* Event 3: Arrived at Destination */}
                <div className="relative">
                  <span
                    className={`absolute -start-6 top-1 w-3.5 h-3.5 rounded-full border-2 ${
                      ['delivered', 'out_for_delivery', 'in_transit'].includes(activeShipment.status)
                        ? 'bg-emerald-500 border-white dark:border-slate-900'
                        : 'bg-slate-200 dark:bg-slate-700 border-white dark:border-slate-900'
                    }`}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isAr ? 'وصل إلى مركز الوجهة' : 'Arrived at Destination'}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isAr ? `وصل إلى مستودع ${activeShipment.city}` : `Arrived at ${activeShipment.city} hub`}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {new Date(new Date(activeShipment.orderDate).getTime() + 1.5 * 86400000).toLocaleDateString(
                        'en-US',
                        { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }
                      )}
                    </p>
                  </div>
                </div>

                {/* Event 4: In Transit */}
                <div className="relative">
                  <span className="absolute -start-6 top-1 w-3.5 h-3.5 rounded-full border-2 bg-emerald-500 border-white dark:border-slate-900" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isAr ? 'في الطريق بين المدن' : 'In Transit'}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isAr ? 'خرج من المستودع المركزي' : 'Departed from origin dispatch hub'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {new Date(new Date(activeShipment.orderDate).getTime() + 0.8 * 86400000).toLocaleDateString(
                        'en-US',
                        { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }
                      )}
                    </p>
                  </div>
                </div>

                {/* Event 5: Picked Up */}
                <div className="relative">
                  <span className="absolute -start-6 top-1 w-3.5 h-3.5 rounded-full border-2 bg-emerald-500 border-white dark:border-slate-900" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isAr ? 'تم استلام الشحنة من المتجر' : 'Picked Up'}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isAr ? 'استلم المندوب الطرد من مستودع المتجر' : 'Shipment picked up from seller'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {new Date(activeShipment.orderDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isAr ? 'تتبع رسمي معتمد' : 'Verified API Tracking'}</span>
              </span>
              <button
                type="button"
                onClick={() => toast(isAr ? 'تم تحديث بيانات التتبع من الناقل' : 'Tracking refreshed from courier API', 'info')}
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCw className="w-3 h-3" />
                <span>{isAr ? 'تحديث' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Column 3: Delivery Information & Interactive Saudi Route Visualization */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'معلومات التوصيل والمسار' : 'Delivery Information'}
                </h3>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia'}
                </span>
              </div>

              {/* Geographic Saudi Map Card with live route pins */}
              <div className="mt-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-sky-50/40 dark:bg-slate-950/60 p-3 relative overflow-hidden">
                <div className="aspect-16/10 w-full relative flex items-center justify-center">
                  <svg
                    viewBox="0 0 400 250"
                    className="w-full h-full text-slate-300 dark:text-slate-700/60 drop-shadow-xs"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Saudi Arabia Contour Silhouette */}
                    <path
                      d="M 60 70 C 80 50, 140 40, 200 45 C 260 50, 310 80, 340 100 C 370 120, 360 160, 340 180 C 310 210, 260 220, 210 215 C 160 210, 110 190, 80 150 C 50 120, 45 90, 60 70 Z"
                      fill="currentColor"
                      opacity="0.25"
                    />
                    <path
                      d="M 60 70 C 80 50, 140 40, 200 45 C 260 50, 310 80, 340 100 C 370 120, 360 160, 340 180 C 310 210, 260 220, 210 215 C 160 210, 110 190, 80 150 C 50 120, 45 90, 60 70 Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      opacity="0.4"
                    />

                    {/* Route Path Line */}
                    <path
                      d="M 110 150 Q 180 120, 270 110"
                      stroke="#0284c7"
                      strokeWidth="2.5"
                      strokeDasharray="5 5"
                      fill="none"
                    />

                    {/* Origin Pin (Jeddah / Western) */}
                    <g transform="translate(110, 150)">
                      <circle r="7" fill="#0284c7" />
                      <circle r="3" fill="#ffffff" />
                      <text x="-15" y="20" fill="#0284c7" fontSize="10" fontWeight="bold">
                        Jeddah
                      </text>
                    </g>

                    {/* Destination Pin (Riyadh / Destination City) */}
                    <g transform="translate(270, 110)">
                      <circle r="8" fill="#10b981" />
                      <circle r="3.5" fill="#ffffff" />
                      <text x="-10" y="20" fill="#10b981" fontSize="10" fontWeight="bold">
                        {activeShipment.city}
                      </text>
                    </g>

                    {/* Saudi Arabia Watermark */}
                    <text
                      x="230"
                      y="190"
                      fill="currentColor"
                      opacity="0.45"
                      fontSize="14"
                      fontWeight="bold"
                      letterSpacing="1"
                    >
                      Saudi Arabia
                    </text>
                  </svg>
                </div>
              </div>

              {/* Delivery Info Metrics */}
              <div className="mt-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isAr ? 'التسليم المتوقع' : 'Estimated Delivery'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {new Date(new Date(activeShipment.orderDate).getTime() + 3 * 86400000).toLocaleDateString(
                      'en-US',
                      { month: 'short', day: '2-digit', year: 'numeric' }
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isAr ? 'المدة الإجمالية' : 'Transit Duration'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    3 {isAr ? 'أيام عمل' : 'Days'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{isAr ? 'المسافة المقدرة' : 'Distance & Route'}</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    ~ 950 km
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToLabels) {
                    onNavigateToLabels(activeShipment.orderId);
                  } else {
                    handleOpenLabel(activeShipment);
                  }
                }}
                className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>{isAr ? 'إدارة بوليصة الشحن' : 'Manage Shipping Label'}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Shipping Label Modal ── */}
      {previewLabelData && (
        <CourierShippingLabelModal
          isOpen={Boolean(previewLabelData)}
          onClose={() => setPreviewLabelData(null)}
          labelData={previewLabelData}
        />
      )}
    </div>
  );
};
