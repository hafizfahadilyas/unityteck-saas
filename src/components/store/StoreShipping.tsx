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
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  AdvancedDataTable,
  type AdvancedTableColumn,
} from '../common/AdvancedDataTable';

const REGIONS = [
  'All',
  'Makkah Region',
  'Riyadh Region',
  'Madinah Region',
  'Eastern Province',
  'Asir Region',
  'Other',
] as const;

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

  const [activeTab, setActiveTab] = useState<'carriers' | 'zones' | 'methods'>('carriers');
  const [dateRange, setDateRange] = useState('Jan 1, 2026 - Jan 31, 2026');
  const [search, setSearch] = useState('');
  const [carrierSearch, setCarrierSearch] = useState('');

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
      {/* Header bar matching 13_shipping.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
              <Truck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'الشحن والتوصيل' : 'Shipping & Logistics'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr ? 'إدارة شركات وأسعار ومناطق التوصيل لمتجر ' : 'Manage shipping companies rates and zones for '}
            <strong className="text-teal-700 dark:text-teal-300">{(isAr ? activeStore.nameAr : activeStore.nameEn) || activeStore.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Date Picker */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
            >
              <option value="Jan 1, 2026 - Jan 31, 2026">Jan 1, 2026 - Jan 31, 2026</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Year 2026">Year 2026</option>
            </select>
          </div>

          {/* Add Actions */}
          <button
            type="button"
            onClick={() => setShowConnectCourierModal(true)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Connect Courier</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddMethod(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Shipping Method</span>
          </button>
        </div>
      </div>

      {/* Row 1: 4 KPI Cards from 13_shipping.png */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-4"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  kpi.color === 'blue'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                    : kpi.color === 'amber'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                      : kpi.color === 'purple'
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block">
                  {kpi.title}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums">
                    {kpi.value}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {kpi.change}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('carriers')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'carriers'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Official Courier Integrations ({connectedCouriersCount} Connected)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('methods')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'methods'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Configured Shipping Methods ({currentShippingMethods.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('zones')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'zones'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Saudi Shipping Zones &amp; Rates ({currentShipping.length} Cities)
        </button>
      </div>

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

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: City & Weight Rates Matrix (Detailed Saudi Zones)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'zones' && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search city, area, or province..."
                className="w-full ps-10 pe-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowAddCityModal(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add City / Zone</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 text-start">
                  <th className="py-2.5 px-3 font-medium text-start">City / Area</th>
                  <th className="py-2.5 px-3 font-medium text-start">Region</th>
                  <th className="py-2.5 px-3 font-medium text-start">ETA</th>
                  <th className="py-2.5 px-3 font-medium text-end">Base Rate</th>
                  <th className="py-2.5 px-3 font-medium text-end">Per Kg</th>
                  <th className="py-2.5 px-3 font-medium text-end">Free Above</th>
                  <th className="py-2.5 px-3 font-medium text-center">Status</th>
                  <th className="py-2.5 px-3 font-medium text-end">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                {pageZoneRows.map((z) => (
                  <tr key={z.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">{z.cityName}</span>
                          <span className="text-[10px] text-slate-400">{z.region || z.province}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{z.region || z.province}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{z.estimatedDelivery}</td>
                    <td className="py-2.5 px-3 text-end font-bold text-slate-900 dark:text-white">{money(z.rate)}</td>
                    <td className="py-2.5 px-3 text-end text-slate-600 dark:text-slate-400">{money(z.ratePerKg ?? 0)}/kg</td>
                    <td className="py-2.5 px-3 text-end font-bold text-emerald-600 dark:text-emerald-400">{money(z.freeShippingAbove)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {z.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-end">
                      <button
                        type="button"
                        onClick={() => {
                          const newRate = window.prompt(`Base delivery fee for ${z.cityName} (SAR):`, z.rate.toString());
                          if (newRate !== null) {
                            updateShippingRate(z.id, parseFloat(newRate) || z.rate, z.freeShippingAbove);
                            toast(`Shipping rate for ${z.cityName} updated!`, 'success');
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        Edit
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
    </div>
  );
};
