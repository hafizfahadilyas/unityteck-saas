import React, { useEffect, useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import type { ShippingZone } from '../../types';
import {
  Truck,
  Plus,
  MapPin,
  Clock,
  X,
  Coins,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Eye,
  Edit2,
  MoreHorizontal,
  Package,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ThermometerSnowflake,
  ShieldCheck,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  AdvancedDataTable,
  type AdvancedTableColumn,
} from '../common/AdvancedDataTable';
import { CourierShippingLabelModal } from './orders/CourierShippingLabelModal';
import type { ShippingLabelData, CourierCarrierCode } from '../../utils/courierBarcode';
import { ShipmentsTrackingView } from './shipping/ShipmentsTrackingView';
import { ShippingLabelsStudioView } from './shipping/ShippingLabelsStudioView';
import { ShippingZonesRatesView } from './shipping/ShippingZonesRatesView';
import { ReturnsExceptionsView } from './shipping/ReturnsExceptionsView';

const REGIONS = [
  'All',
  'Makkah Region',
  'Riyadh Region',
  'Madinah Region',
  'Eastern Province',
  'Asir Region',
  'Other',
] as const;

export type ShippingTab = 'shipments' | 'labels' | 'zones' | 'returns' | 'carriers' | 'methods';

interface CarrierItem {
  id: string;
  name: string;
  code: string;
  zones: string;
  baseRate: number;
  status: 'Active' | 'Inactive';
  logoBg: string;
  badge: string;
  notes: string;
}

export const StoreShipping: React.FC = () => {
  const {
    activeStore,
    currentOrders,
    currentShipping,
    updateShippingRate,
    addShippingCity,
    currentShippingMethods,
    addShippingMethod,
    updateShippingMethod,
    currentCouriers,
    currentShipments,
    connectCourier,
    testCourier,
    syncCourier,
  } = useTenant();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<ShippingTab>('shipments');
  const [dateRange, setDateRange] = useState(isAr ? '١ يناير - ٣١ يناير ٢٠٢٦' : 'Jan 1, 2026 - Jan 31, 2026');
  const [search, setSearch] = useState('');
  const [carrierSearch, setCarrierSearch] = useState('');

  useEffect(() => {
    const handleShippingView = (e: any) => {
      if (e?.detail) setActiveTab(e.detail);
    };
    window.addEventListener('unityteck-shipping-view', handleShippingView);
    const saved = sessionStorage.getItem('unityteck-shipping-view');
    if (saved) {
      setActiveTab(saved as any);
      sessionStorage.removeItem('unityteck-shipping-view');
    }
    return () => window.removeEventListener('unityteck-shipping-view', handleShippingView);
  }, []);

  // Real Computed KPIs from store shipments, orders & couriers
  const connectedCouriersCount = useMemo(() => {
    return currentCouriers.filter((c) => c.status === 'connected').length;
  }, [currentCouriers]);

  const avgDeliveryDaysCalc = useMemo(() => {
    if (currentShipping.length === 0) return '2.0';
    const sum = currentShipping.reduce((acc, z) => {
      const match = z.estimatedDelivery.match(/\d+/);
      return acc + (match ? parseFloat(match[0]) : 2);
    }, 0);
    return (sum / currentShipping.length).toFixed(1);
  }, [currentShipping]);

  const shippingRevenueCalc = useMemo(() => {
    return currentOrders.reduce((sum, o) => sum + (o.shippingFee || 0), 0);
  }, [currentOrders]);

  const pendingShipmentsCalc = useMemo(() => {
    const fromShipments = currentShipments.filter(
      (s) => s.status === 'pending' || s.status === 'created' || s.status === 'in_transit'
    ).length;
    if (fromShipments > 0) return fromShipments;
    return currentOrders.filter((o) => o.status === 'processing' || o.status === 'pending').length;
  }, [currentShipments, currentOrders]);

  const kpis = [
    {
      id: 'carriers',
      title: 'Active Carriers',
      value: connectedCouriersCount.toString(),
      change: connectedCouriersCount > 0 ? 'Verified' : 'Connect',
      isPositive: connectedCouriersCount > 0,
      icon: Truck,
      color: 'blue',
    },
    {
      id: 'delivery-days',
      title: 'Avg Delivery Days',
      value: `${avgDeliveryDaysCalc}d`,
      change: 'Calculated',
      isPositive: true,
      icon: Clock,
      color: 'amber',
    },
    {
      id: 'shipping-rev',
      title: 'Shipping Revenue',
      value: money(shippingRevenueCalc),
      change: 'Live Orders',
      isPositive: true,
      icon: Coins,
      color: 'purple',
    },
    {
      id: 'pending-shipments',
      title: 'Pending Shipments',
      value: pendingShipmentsCalc.toString(),
      change: pendingShipmentsCalc > 0 ? 'To Dispatch' : 'Clear',
      isPositive: pendingShipmentsCalc === 0,
      icon: Package,
      color: 'rose',
    },
  ];

  // Zones filters
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [kgFilter, setKgFilter] = useState<'all' | 'light' | 'heavy'>('all');
  const [sortKey, setSortKey] = useState<string | null>('cityName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Connect Courier Modal States
  const [showConnectCourierModal, setShowConnectCourierModal] = useState(false);
  const [courierProvider, setCourierProvider] = useState<'spl' | 'aramex' | 'smsa' | 'dhl' | 'fedex' | 'ups'>('spl');
  const [courierApiKey, setCourierApiKey] = useState('');
  const [courierApiSecret, setCourierApiSecret] = useState('');
  const [courierAccountNumber, setCourierAccountNumber] = useState('');
  const [courierIsSandbox, setCourierIsSandbox] = useState(false);
  const [isTestingCourier, setIsTestingCourier] = useState(false);
  const [previewLabelData, setPreviewLabelData] = useState<ShippingLabelData | null>(null);

  // Add Shipping Method Modal States
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [methodName, setMethodName] = useState('');
  const [methodNameAr, setMethodNameAr] = useState('');
  const [methodType, setMethodType] = useState<
    'free' | 'flat_rate' | 'zone_based' | 'weight_based' | 'value_based' | 'same_day' | 'scheduled' | 'local_pickup' | 'cod'
  >('flat_rate');
  const [methodBaseRate, setMethodBaseRate] = useState('25');
  const [methodFreeThreshold, setMethodFreeThreshold] = useState('250');
  const [methodEstimatedDays, setMethodEstimatedDays] = useState('1-3 Business Days');
  const [methodAllowCod, setMethodAllowCod] = useState(true);

  // Add City/Zone Modal States
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newCityRegion, setNewCityRegion] = useState('Makkah Region');
  const [newCityRate, setNewCityRate] = useState('20');
  const [newCityEta, setNewCityEta] = useState('Same Day');

  const filteredCouriers = useMemo(() => {
    const q = (carrierSearch || '').toLowerCase();
    return (currentCouriers || []).filter(
      (c) =>
        (c?.accountName ?? '').toLowerCase().includes(q) ||
        (c?.provider ?? '').toLowerCase().includes(q)
    );
  }, [currentCouriers, carrierSearch]);

  const handleConnectCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await connectCourier({
        provider: courierProvider as any,
        accountName: courierProvider.toUpperCase(),
        apiKey: courierApiKey,
        apiSecret: courierApiSecret,
        accountNumber: courierAccountNumber,
        isSandbox: courierIsSandbox,
      });
      setShowConnectCourierModal(false);
      setCourierApiKey('');
      setCourierApiSecret('');
      setCourierAccountNumber('');
      toast(`Successfully configured and connected ${courierProvider.toUpperCase()} carrier!`, 'success');
    } catch {
      toast('Failed to save courier credentials', 'error');
    }
  };

  const handleTestCourier = async (provider: string) => {
    setIsTestingCourier(true);
    try {
      const res = await testCourier(provider);
      if (res.success) {
        toast(`${provider.toUpperCase()} API connection verified successfully! Ping: ${(res as any).ping_ms || 120}ms`, 'success');
      } else {
        toast(`Carrier API test failed: ${res.message || 'Credentials invalid'}`, 'error');
      }
    } catch {
      toast('Could not contact courier API service', 'error');
    } finally {
      setIsTestingCourier(false);
    }
  };

  const handleSyncCourier = async (provider: string) => {
    try {
      await syncCourier(provider);
      toast(`${provider.toUpperCase()} shipping services & rates synced!`, 'success');
    } catch {
      toast('Failed to sync carrier configuration', 'error');
    }
  };

  const handleAddShippingMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodName.trim()) return;
    try {
      await addShippingMethod({
        name: methodName.trim(),
        nameAr: methodNameAr.trim() || methodName.trim(),
        type: methodType,
        baseRate: parseFloat(methodBaseRate) || 0,
        freeShippingThreshold: methodFreeThreshold ? parseFloat(methodFreeThreshold) : null,
        estimatedDelivery: methodEstimatedDays,
        isCodAllowed: methodAllowCod,
        isActive: true,
      });
      setShowAddMethod(false);
      setMethodName('');
      setMethodNameAr('');
      toast('Real shipping method created successfully!', 'success');
    } catch {
      toast('Failed to create shipping method', 'error');
    }
  };

  const handleAddCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim()) return;
    addShippingCity(
      newCityName.trim(),
      parseFloat(newCityRate) || 20,
      200,
      newCityEta,
      {
        region: newCityRegion,
        ratePerKg: 2,
      }
    );
    setShowAddCityModal(false);
    setNewCityName('');
    toast(`Added ${newCityName} to shipping zones matrix`, 'success');
  };

  // Filtered zones
  const filteredSortedZones = useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    let list = (currentShipping || []).filter((z) => {
      const regionLabel = z?.region || z?.province || '';
      const matchRegion = regionFilter === 'All' || regionLabel === regionFilter;
      const matchStatus = statusFilter === 'all' || z?.status === statusFilter;
      const maxW = z?.maxWeightKg ?? 99;
      const matchKg =
        kgFilter === 'all' ||
        (kgFilter === 'light' && maxW <= 15) ||
        (kgFilter === 'heavy' && maxW > 15);
      const matchSearch =
        !q ||
        (z?.cityName ?? '').toLowerCase().includes(q) ||
        (regionLabel ?? '').toLowerCase().includes(q) ||
        (z?.estimatedDelivery ?? '').toLowerCase().includes(q);
      return matchRegion && matchStatus && matchKg && matchSearch;
    });

    if (sortKey) {
      list = [...list].sort((a, b) => {
        const getter = (z: ShippingZone): string | number => {
          switch (sortKey) {
            case 'rate':
              return z.rate;
            case 'ratePerKg':
              return z.ratePerKg ?? 0;
            case 'cityName':
            default:
              return z.cityName;
          }
        };
        const aVal = getter(a);
        const bVal = getter(b);
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return sortDir === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }
    return list;
  }, [currentShipping, search, regionFilter, statusFilter, kgFilter, sortKey, sortDir]);

  const pageZoneRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSortedZones.slice(start, start + pageSize);
  }, [filteredSortedZones, page, pageSize]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100">
      {/* ── Main Module Navigation Bar ── */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-bold w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('shipments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'shipments'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4 rtl:rotate-180" />
          <span>{isAr ? 'الشحنات والتتبع' : 'Shipments & Tracking'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('labels')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'labels'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>{isAr ? 'بوالص الشحن والعمليات' : 'Shipping Labels'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('zones')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'zones'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>{isAr ? 'مناطق الشحن والأسعار' : `Zones & Rates (${currentShipping.length})`}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('returns')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'returns'
              ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>{isAr ? 'المرتجعات والحالات الخاصة' : 'Returns & Exceptions'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('carriers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'carriers'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isAr ? 'شركات الشحن (APIs)' : `Couriers (${connectedCouriersCount})`}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('methods')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'methods'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{isAr ? 'طرق الشحن' : `Methods (${currentShippingMethods.length})`}</span>
        </button>
      </div>

      {/* ── Active Tab 1: Shipments & Tracking (Pixel-Perfect Image 1 Top) ── */}
      {activeTab === 'shipments' && (
        <ShipmentsTrackingView onNavigateToLabels={() => setActiveTab('labels')} />
      )}

      {/* ── Active Tab 2: Shipping Labels & Operations (Pixel-Perfect Image 1 Bottom) ── */}
      {activeTab === 'labels' && (
        <ShippingLabelsStudioView />
      )}

      {/* ── Active Tab 3: Shipping Zones & Rates (Pixel-Perfect Image 2 Top) ── */}
      {activeTab === 'zones' && (
        <ShippingZonesRatesView />
      )}

      {/* ── Active Tab 4: Returns & Exceptions (Pixel-Perfect Image 2 Bottom) ── */}
      {activeTab === 'returns' && (
        <ReturnsExceptionsView />
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: Official Courier Integrations (APIs & AWB Dispatch)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'carriers' && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Official Saudi &amp; International Courier Services
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct REST/SOAP API connections for auto AWB labels, tracking numbers, and delivery webhook webhooks.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConnectCourierModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Connect Provider</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {[
              {
                code: 'spl',
                name: isAr ? 'البريد السعودي (سبل)' : 'Saudi Post (SPL)',
                desc: isAr ? 'الناقل البريدي الوطني مع دعم العنوان الوطني السعودي وخدمة واصل.' : 'National postal courier with Saudi National Address & Wasel integration.',
                badge: 'SPL',
                bg: 'bg-emerald-700',
              },
              {
                code: 'smsa',
                name: isAr ? 'سمسا إكسبريس' : 'SMSA Express',
                desc: isAr ? 'شحن محلي سريع لجميع مدن المملكة مع تتبع فوري والدفع عند الاستلام.' : 'Express domestic Saudi courier with door-to-door tracking & COD collection.',
                badge: 'SMSA',
                bg: 'bg-blue-600',
              },
              {
                code: 'aramex',
                name: isAr ? 'أرامكس' : 'Aramex',
                desc: isAr ? 'شبكة شحن إقليمية ودولية متكاملة مع جدولة استلام آلية.' : 'Middle East & Global courier network with automated dispatch & pickup.',
                badge: 'ARX',
                bg: 'bg-red-600',
              },
              {
                code: 'dhl',
                name: isAr ? 'دي إتش إل إكسبريس' : 'DHL Express',
                desc: isAr ? 'شحن دولي سريع ومميز مع تخليص جمركي معتمد.' : 'Worldwide premium express courier with international customs clearance.',
                badge: 'DHL',
                bg: 'bg-amber-600',
              },
              {
                code: 'fedex',
                name: isAr ? 'فيديكس إكسبريس' : 'FedEx Express',
                desc: isAr ? 'شحن جوي ذو أولوية مع تسعير آلي وتتبع للشحنات.' : 'Priority air courier with automated rate quote and package tracking.',
                badge: 'FDX',
                bg: 'bg-purple-700',
              },
              {
                code: 'ups',
                name: isAr ? 'يو بي إس' : 'UPS Worldwide',
                desc: isAr ? 'حلول لوجستية ونقل بري وجوي عالمية مع واجهة برمجة معتمدة.' : 'Global logistics and ground delivery solutions with certified API.',
                badge: 'UPS',
                bg: 'bg-amber-900',
              },
            ].map((prov) => {
              const conn = currentCouriers.find((c) => c.provider === prov.code);
              const isConnected = conn?.status === 'connected';

              return (
                <div
                  key={prov.code}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl ${prov.bg} text-white font-black text-xs flex items-center justify-center tracking-wider shadow-2xs`}
                        >
                          {prov.badge}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                            {prov.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {isConnected ? `Account: ${conn?.accountNumber || 'Active'}` : 'Not Connected'}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isConnected
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                      >
                        {isConnected ? 'Connected ✓' : 'Not Connected'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {prov.desc}
                    </p>

                    {isConnected && conn?.maskedApiKey && (
                      <div className="text-[10px] font-mono text-slate-500 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span>Key: {conn.maskedApiKey}</span>
                        <span className="text-teal-600 font-bold uppercase">{conn.isSandbox ? 'Sandbox' : 'Live API'}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    {isConnected ? (
                      <>
                        <button
                          type="button"
                          disabled={isTestingCourier}
                          onClick={() => handleTestCourier(prov.code)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          Test API
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const realOrder = currentOrders[0];
                            if (!realOrder) {
                              toast(isAr ? 'لا توجد طلبات في المتجر لإصدار بوليصة لها' : 'No store orders available to generate waybill', 'info');
                              return;
                            }
                            const anyOrder = realOrder as any;
                            const anyStore = activeStore as any;
                            const orderCity = anyOrder.city || (typeof realOrder.shippingAddress === 'string' ? realOrder.shippingAddress : anyOrder.shippingAddress?.city) || realOrder.deliveryLocation || 'Riyadh';
                            const orderAddress = typeof realOrder.shippingAddress === 'string' ? realOrder.shippingAddress : anyOrder.shippingAddress?.address || realOrder.deliveryLocation || 'Saudi Arabia';
                            const orderTotal = Number(realOrder.total ?? anyOrder.totalAmount ?? 0);

                            setPreviewLabelData({
                              carrier: prov.code as CourierCarrierCode,
                              carrierName: prov.name,
                              carrierNameAr: prov.name,
                              trackingNumber: realOrder.trackingNumber || `${prov.code.toUpperCase()}-TRK-${realOrder.id.slice(-6)}`,
                              awbNumber: anyOrder.awbNumber || realOrder.shippingLabelNumber || `${prov.code.toUpperCase()}-AWB-${realOrder.id.slice(-6)}`,
                              orderNumber: realOrder.orderNumber || `#${realOrder.id.slice(-8)}`,
                              orderDate: realOrder.createdAt ? realOrder.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
                              sender: {
                                name: activeStore.name || 'Store Merchant',
                                nameAr: activeStore.nameAr || 'تاجر المتجر',
                                phone: anyStore.phone || '+966 11 000 0000',
                                address: anyStore.address || 'Saudi Arabia',
                                city: anyStore.city || 'Riyadh',
                                country: 'Saudi Arabia',
                              },
                              recipient: {
                                name: realOrder.customerName || 'Customer',
                                phone: realOrder.customerPhone || '+966 500 000 000',
                                address: orderAddress,
                                city: orderCity,
                                country: 'Saudi Arabia',
                              },
                              packageDetails: {
                                weightKg: 1.5,
                                pieces: realOrder.items?.length || 1,
                                contentDescription: 'Store Parcel',
                                contentDescriptionAr: 'طرد متجر',
                                declaredValueSar: orderTotal || 100,
                              },
                              payment: {
                                method: realOrder.paymentMethod === 'COD' ? 'cod' : 'prepaid',
                                codAmountSar: realOrder.paymentMethod === 'COD' ? orderTotal : undefined,
                                currency: 'SAR',
                              },
                              routing: {
                                hubCode: `${orderCity.slice(0, 3).toUpperCase()}-HUB`,
                                serviceType: 'Standard Delivery',
                                routeCode: `KSA-${prov.code.toUpperCase()}`,
                              },
                            });
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 border border-sky-200 dark:border-sky-800 rounded-lg cursor-pointer"
                          title={isAr ? 'طباعة / معاينة باركود البوليصة' : 'Print / View Waybill Barcode'}
                        >
                          {isAr ? 'طباعة البوليصة' : 'Print AWB'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSyncCourier(prov.code)}
                          className="px-2.5 py-1 text-[11px] font-bold text-teal-600 hover:text-teal-500 cursor-pointer"
                        >
                          Sync Rates
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCourierProvider(prov.code as any);
                            setShowConnectCourierModal(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                        >
                          Config
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCourierProvider(prov.code as any);
                          setShowConnectCourierModal(true);
                        }}
                        className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-bold shadow-xs cursor-pointer text-center"
                      >
                        Connect {prov.badge} Provider →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: Configured Shipping Methods (Real Configurable Rules)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'methods' && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Store Shipping Methods
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configured shipping calculations: Flat Rate, Free Shipping, Weight Based, Same-Day, or Local Delivery.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddMethod(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Method</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 text-start">
                  <th className="py-3 px-4 font-medium text-start">Method Name</th>
                  <th className="py-3 px-4 font-medium text-start">Type</th>
                  <th className="py-3 px-4 font-medium text-end">Base Rate</th>
                  <th className="py-3 px-4 font-medium text-end">Free Above</th>
                  <th className="py-3 px-4 font-medium text-center">COD Allowed</th>
                  <th className="py-3 px-4 font-medium text-center">Status</th>
                  <th className="py-3 px-4 font-medium text-end">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                {currentShippingMethods.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white block">
                          {m.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {m.nameAr || m.estimatedDelivery}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold uppercase">
                        {m.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-end font-black text-slate-900 dark:text-white tabular-nums">
                      {m.baseRate === 0 ? 'Free' : money(m.baseRate)}
                    </td>
                    <td className="py-3.5 px-4 text-end text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                      {m.freeShippingThreshold ? money(m.freeShippingThreshold) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.isCodAllowed
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                        }`}
                      >
                        {m.isCodAllowed ? 'COD Available' : 'No COD'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          updateShippingMethod(m.id, { isActive: !m.isActive });
                          toast(`Shipping method ${m.isActive ? 'disabled' : 'activated'}!`, 'info');
                        }}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${
                          m.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {m.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-end">
                      <button
                        type="button"
                        onClick={() => {
                          const newRate = window.prompt(`Update base rate for ${m.name} (SAR):`, m.baseRate.toString());
                          if (newRate !== null && !isNaN(parseFloat(newRate))) {
                            updateShippingMethod(m.id, { baseRate: parseFloat(newRate) });
                            toast(`Base rate updated to ${money(parseFloat(newRate))}`, 'success');
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        Edit Rate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Connect Courier Modal */}
      {showConnectCourierModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Connect Official Courier API</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Secure server-side API integration. Credentials are never exposed to customers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowConnectCourierModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConnectCourier} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Courier Provider *
                </label>
                <select
                  value={courierProvider}
                  onChange={(e) => setCourierProvider(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="spl">{isAr ? 'البريد السعودي (سبل) - الناقل الوطني الرسمي' : 'Saudi Post (SPL) - Official National Carrier'}</option>
                  <option value="smsa">{isAr ? 'سمسا إكسبريس - شحن محلي سريع' : 'SMSA Express - Domestic Saudi Express'}</option>
                  <option value="aramex">{isAr ? 'أرامكس - شحن إقليمي ودولي' : 'Aramex - Regional & International Courier'}</option>
                  <option value="dhl">DHL Express - Worldwide Express</option>
                  <option value="fedex">FedEx Express - Priority Logistics</option>
                  <option value="ups">UPS - Global Shipping Network</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Courier Account Number / Shipper ID *
                </label>
                <input
                  type="text"
                  required
                  value={courierAccountNumber}
                  onChange={(e) => setCourierAccountNumber(e.target.value)}
                  placeholder="e.g. SPL-ACC-99214 or SMSA-SHP-001"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  API Key / Client ID *
                </label>
                <input
                  type="password"
                  required
                  value={courierApiKey}
                  onChange={(e) => setCourierApiKey(e.target.value)}
                  placeholder="Enter official API key"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  API Secret / Password (Optional for some providers)
                </label>
                <input
                  type="password"
                  value={courierApiSecret}
                  onChange={(e) => setCourierApiSecret(e.target.value)}
                  placeholder="Enter API secret / token"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="courierSandbox"
                  checked={courierIsSandbox}
                  onChange={(e) => setCourierIsSandbox(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="courierSandbox" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Use Sandbox / Testing Mode (Safe test environment)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConnectCourierModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Authorize &amp; Connect Carrier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Shipping Method Modal */}
      {showAddMethod && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Configure Shipping Method
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMethod(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddShippingMethod} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Method Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={methodName}
                  onChange={(e) => setMethodName(e.target.value)}
                  placeholder="e.g. Express Same-Day Delivery"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Method Name (Arabic)
                </label>
                <input
                  type="text"
                  value={methodNameAr}
                  onChange={(e) => setMethodNameAr(e.target.value)}
                  placeholder="e.g. التوصيل السريع خلال نفس اليوم"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-end"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Calculation Type
                  </label>
                  <select
                    value={methodType}
                    onChange={(e) => setMethodType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="flat_rate">Flat Rate</option>
                    <option value="free">Free Shipping</option>
                    <option value="zone_based">Area / Zone Based</option>
                    <option value="weight_based">Weight Based</option>
                    <option value="same_day">Same-Day Delivery</option>
                    <option value="scheduled">Scheduled Delivery</option>
                    <option value="local_pickup">Local Pickup</option>
                    <option value="cod">Cash on Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Base Fee (SAR)
                  </label>
                  <input
                    type="number"
                    value={methodBaseRate}
                    onChange={(e) => setMethodBaseRate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Free If Order Exceeds (SAR)
                  </label>
                  <input
                    type="number"
                    value={methodFreeThreshold}
                    onChange={(e) => setMethodFreeThreshold(e.target.value)}
                    placeholder="e.g. 250"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Estimated Time (ETA)
                  </label>
                  <input
                    type="text"
                    value={methodEstimatedDays}
                    onChange={(e) => setMethodEstimatedDays(e.target.value)}
                    placeholder="e.g. 1-2 Business Days"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="allowCodCheck"
                  checked={methodAllowCod}
                  onChange={(e) => setMethodAllowCod(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="allowCodCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Allow Cash on Delivery (COD) for this method
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddMethod(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add City Modal */}
      {showAddCityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Add Saudi City / Zone
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCityModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCity} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  City / Area Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  placeholder="e.g. Taif, Tabuk, Al Ahsa"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Region / Province
                </label>
                <select
                  value={newCityRegion}
                  onChange={(e) => setNewCityRegion(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  {REGIONS.filter((r) => r !== 'All').map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Delivery Fee (SAR)
                  </label>
                  <input
                    type="number"
                    value={newCityRate}
                    onChange={(e) => setNewCityRate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ETA (e.g. 1-2 Days)
                  </label>
                  <input
                    type="text"
                    value={newCityEta}
                    onChange={(e) => setNewCityEta(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCityModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Save City
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Courier Shipping Label Barcode Modal */}
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
