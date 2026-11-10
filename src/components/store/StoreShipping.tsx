import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  UserRound,
  Trash2,
  Loader2,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { commerceTerm } from '../../i18n/commerceTerms';
import { getLocalizedCity } from '../../utils/storeLocalization';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';
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
import {
  fetchDeliveryDriversApi,
  createDeliveryDriverApi,
  updateDeliveryDriverApi,
  deleteDeliveryDriverApi,
  EXAMPLE_SHIPPING_METHOD_PRESETS,
  type DeliveryDriverRow,
} from '../../api/tenantApi';
import { shippingMethodLogoSrc } from '../../utils/shippingMethodLogos';

const REGIONS = [
  'All',
  'Makkah Region',
  'Riyadh Region',
  'Madinah Region',
  'Eastern Province',
  'Asir Region',
  'Other',
] as const;

export type ShippingTab = 'shipments' | 'labels' | 'zones' | 'returns' | 'carriers' | 'methods' | 'drivers';

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
    if (currentShipping.length === 0) return '—';
    const parsed = currentShipping
      .map((z) => {
        const match = String(z.estimatedDelivery || '').match(/\d+/);
        return match ? parseFloat(match[0]) : NaN;
      })
      .filter((n) => Number.isFinite(n));
    if (parsed.length === 0) return '—';
    const sum = parsed.reduce((acc, n) => acc + n, 0);
    return (sum / parsed.length).toFixed(1);
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
  const [methodFulfillment, setMethodFulfillment] = useState<'own_delivery' | 'courier'>('own_delivery');
  const [methodCourierCode, setMethodCourierCode] = useState<string | null>(null);
  const [methodLogoUrl, setMethodLogoUrl] = useState('');
  const [methodVehicle, setMethodVehicle] = useState<'bike' | 'car' | 'van' | ''>('');
  const [methodBaseRate, setMethodBaseRate] = useState('25');
  const [methodPerKg, setMethodPerKg] = useState('0');
  const [methodPerKm, setMethodPerKm] = useState('0');
  const [methodFreeThreshold, setMethodFreeThreshold] = useState('250');
  const [methodEstimatedDays, setMethodEstimatedDays] = useState('1-3 Business Days');
  const [methodEtaType, setMethodEtaType] = useState<'same_day' | 'hours' | 'days'>('days');
  const [methodPayments, setMethodPayments] = useState<Array<'cod' | 'online' | 'bank_transfer'>>(['cod', 'online']);
  const [methodTracking, setMethodTracking] = useState(true);
  const [presetBusy, setPresetBusy] = useState(false);

  // Add City/Zone Modal States
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newCityRegion, setNewCityRegion] = useState('Makkah Region');
  const [newCityRate, setNewCityRate] = useState('20');
  const [newCityEta, setNewCityEta] = useState('Same Day');

  // Own Delivery Drivers
  const [drivers, setDrivers] = useState<DeliveryDriverRow[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [driversBusy, setDriversBusy] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DeliveryDriverRow | null>(null);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverCity, setDriverCity] = useState('');
  const [driverVehicle, setDriverVehicle] = useState('');
  const [driverBaseLocation, setDriverBaseLocation] = useState('');
  const [driverAreas, setDriverAreas] = useState<string[]>(['makkah']);
  const [driverRateMode, setDriverRateMode] = useState<'fixed' | 'per_kg' | 'per_km' | 'zone'>('fixed');
  const [driverFixedRate, setDriverFixedRate] = useState('25');
  const [driverPerKg, setDriverPerKg] = useState('0');
  const [driverPerKm, setDriverPerKm] = useState('0');
  const [driverSameDay, setDriverSameDay] = useState(false);
  const [driverEta, setDriverEta] = useState('Same Day');
  const [driverPayments, setDriverPayments] = useState<Array<'cod' | 'online' | 'bank_transfer'>>(['cod']);
  const [driverActive, setDriverActive] = useState(true);

  const SERVICE_AREA_OPTIONS = [
    { id: 'makkah', en: 'Makkah', ar: 'مكة المكرمة' },
    { id: 'makkah_outside', en: 'Outside Makkah', ar: 'خارج مكة' },
    { id: 'jeddah', en: 'Jeddah', ar: 'جدة' },
    { id: 'all_saudi', en: 'All Saudi Arabia', ar: 'كل السعودية' },
  ] as const;

  const loadDrivers = useCallback(async () => {
    if (!activeStore?.id) {
      setDrivers([]);
      return;
    }
    setDriversLoading(true);
    try {
      const rows = await fetchDeliveryDriversApi(activeStore.id, { all: true });
      setDrivers(rows);
    } catch {
      setDrivers([]);
      toast(isAr ? 'تعذر تحميل مندوبي التوصيل' : 'Could not load delivery drivers', 'error');
    } finally {
      setDriversLoading(false);
    }
  }, [activeStore?.id, isAr, toast]);

  useEffect(() => {
    void loadDrivers();
  }, [loadDrivers]);

  const openCreateDriver = () => {
    setEditingDriver(null);
    setDriverName('');
    setDriverPhone('');
    setDriverEmail('');
    setDriverCity('');
    setDriverVehicle('');
    setDriverBaseLocation('');
    setDriverAreas(['makkah']);
    setDriverRateMode('fixed');
    setDriverFixedRate('25');
    setDriverPerKg('0');
    setDriverPerKm('0');
    setDriverSameDay(false);
    setDriverEta('Same Day');
    setDriverPayments(['cod']);
    setDriverActive(true);
    setShowDriverModal(true);
  };

  const openEditDriver = (row: DeliveryDriverRow) => {
    setEditingDriver(row);
    setDriverName(row.name || '');
    setDriverPhone(row.phone || '');
    setDriverEmail(row.email || '');
    setDriverCity(row.city || '');
    setDriverVehicle(row.vehicle_type || '');
    setDriverBaseLocation(row.base_location || '');
    setDriverAreas(Array.isArray(row.service_areas) && row.service_areas.length ? row.service_areas : ['makkah']);
    setDriverRateMode((row.rate_mode as typeof driverRateMode) || 'fixed');
    setDriverFixedRate(String(row.fixed_rate ?? 25));
    setDriverPerKg(String(row.per_kg_rate ?? 0));
    setDriverPerKm(String(row.per_km_rate ?? 0));
    setDriverSameDay(Boolean(row.same_day));
    setDriverEta(row.eta_text || 'Same Day');
    setDriverPayments(
      Array.isArray(row.payment_options) && row.payment_options.length
        ? row.payment_options
        : ['cod'],
    );
    setDriverActive(row.is_active !== false);
    setShowDriverModal(true);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore?.id || !driverName.trim() || !driverPhone.trim()) return;
    setDriversBusy(true);
    try {
      const payload = {
        name: driverName.trim(),
        phone: driverPhone.trim(),
        email: driverEmail.trim() || null,
        city: driverCity.trim() || null,
        vehicle_type: driverVehicle.trim() || null,
        base_location: driverBaseLocation.trim() || null,
        service_areas: driverAreas,
        rate_mode: driverRateMode,
        fixed_rate: parseFloat(driverFixedRate) || 0,
        per_kg_rate: parseFloat(driverPerKg) || 0,
        per_km_rate: parseFloat(driverPerKm) || 0,
        same_day: driverSameDay,
        eta_text: driverEta.trim() || null,
        payment_options: driverPayments,
        is_active: driverActive,
      };
      if (editingDriver) {
        await updateDeliveryDriverApi(activeStore.id, editingDriver.id, payload);
        toast(isAr ? 'تم تحديث مندوب التوصيل' : 'Delivery driver updated', 'success');
      } else {
        await createDeliveryDriverApi(activeStore.id, payload);
        toast(isAr ? 'تمت إضافة مندوب التوصيل' : 'Delivery driver added', 'success');
      }
      setShowDriverModal(false);
      await loadDrivers();
    } catch (err: any) {
      toast(err?.message || (isAr ? 'تعذر حفظ مندوب التوصيل' : 'Could not save delivery driver'), 'error');
    } finally {
      setDriversBusy(false);
    }
  };

  const handleDeleteDriver = async (row: DeliveryDriverRow) => {
    if (!activeStore?.id) return;
    setDriversBusy(true);
    try {
      await deleteDeliveryDriverApi(activeStore.id, row.id);
      toast(isAr ? 'تم حذف مندوب التوصيل' : 'Delivery driver deleted', 'success');
      await loadDrivers();
    } catch (err: any) {
      toast(err?.message || (isAr ? 'تعذر حذف مندوب التوصيل' : 'Could not delete delivery driver'), 'error');
    } finally {
      setDriversBusy(false);
    }
  };

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
      toast(
        isAr
          ? `تم ضبط وربط شركة الشحن ${courierProvider.toUpperCase()} بنجاح`
          : `Successfully configured and connected ${courierProvider.toUpperCase()} carrier!`,
        'success'
      );
    } catch {
      toast(isAr ? 'تعذر حفظ بيانات اعتماد شركة الشحن' : 'Failed to save courier credentials', 'error');
    }
  };

  const handleTestCourier = async (provider: string) => {
    setIsTestingCourier(true);
    try {
      const res = await testCourier(provider);
      if (res.success) {
        toast(
          isAr
            ? `تم التحقق من اتصال ${provider.toUpperCase()} بنجاح. زمن الاستجابة: ${(res as any).ping_ms || 120} مللي ثانية`
            : `${provider.toUpperCase()} API connection verified successfully! Ping: ${(res as any).ping_ms || 120}ms`,
          'success'
        );
      } else {
        toast(
          isAr
            ? `فشل اختبار اتصال شركة الشحن:${res.message || 'بيانات الاعتماد غير صالحة'}`
            : `Carrier API test failed: ${res.message || 'Credentials invalid'}`,
          'error'
        );
      }
    } catch {
      toast(isAr ? 'تعذر التواصل مع خدمة شركة الشحن' : 'Could not contact courier API service', 'error');
    } finally {
      setIsTestingCourier(false);
    }
  };

  const handleSyncCourier = async (provider: string) => {
    try {
      await syncCourier(provider);
      toast(
        isAr
          ? `تمت مزامنة خدمات وأسعار شحن ${provider.toUpperCase()}`
          : `${provider.toUpperCase()} shipping services & rates synced!`,
        'success'
      );
    } catch {
      toast(isAr ? 'تعذر مزامنة إعدادات شركة الشحن' : 'Failed to sync carrier configuration', 'error');
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
        fulfillmentMode: methodFulfillment,
        baseRate: parseFloat(methodBaseRate) || 0,
        perKgRate: parseFloat(methodPerKg) || 0,
        perKmRate: parseFloat(methodPerKm) || 0,
        freeShippingThreshold: methodFreeThreshold ? parseFloat(methodFreeThreshold) : null,
        estimatedDelivery: methodEstimatedDays,
        etaType: methodEtaType,
        trackingEnabled: methodTracking,
        courierCode: methodFulfillment === 'courier' ? methodCourierCode : null,
        logoUrl: methodLogoUrl.trim() || null,
        vehicleType: methodVehicle || null,
        isCodAllowed: methodPayments.includes('cod'),
        allowOnline: methodPayments.includes('online'),
        allowBankTransfer: methodPayments.includes('bank_transfer'),
        paymentOptions: methodPayments,
        isActive: true,
      });
      setShowAddMethod(false);
      setMethodName('');
      setMethodNameAr('');
      setMethodCourierCode(null);
      setMethodLogoUrl('');
      setMethodVehicle('');
      toast(
        isAr ? 'تم إنشاء طريقة الشحن بنجاح' : 'Shipping method created successfully',
        'success',
      );
    } catch {
      toast(isAr ? 'تعذر إنشاء طريقة الشحن' : 'Failed to create shipping method', 'error');
    }
  };

  const togglePaymentOption = (
    list: Array<'cod' | 'online' | 'bank_transfer'>,
    setList: (v: Array<'cod' | 'online' | 'bank_transfer'>) => void,
    key: 'cod' | 'online' | 'bank_transfer',
  ) => {
    setList(list.includes(key) ? list.filter((x) => x !== key) : [...list, key]);
  };

  const optionBtnClass = (on: boolean) =>
    `px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer transition-all ${
      on
        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
    }`;

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
    <div className="u-page p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100 w-full min-w-0">
      {/* ── Main Module Navigation — 4 buttons per row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
        {(
          [
            {
              id: 'shipments' as ShippingTab,
              icon: Truck,
              label: isAr ? 'الشحنات والتتبع' : 'Shipments & Tracking',
              active: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900',
            },
            {
              id: 'labels' as ShippingTab,
              icon: Printer,
              label: isAr ? 'بوالص الشحن' : 'Shipping Labels',
              active: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900',
            },
            {
              id: 'zones' as ShippingTab,
              icon: MapPin,
              label: isAr ? `المناطق والأسعار (${currentShipping.length})` : `Zones & Rates (${currentShipping.length})`,
              active: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900',
            },
            {
              id: 'returns' as ShippingTab,
              icon: RotateCcw,
              label: isAr ? 'المرتجعات' : 'Returns & Exceptions',
              active: 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900',
            },
            {
              id: 'carriers' as ShippingTab,
              icon: ShieldCheck,
              label: isAr
                ? `شركات الشحن (${connectedCouriersCount})`
                : `Shipping Companies (${connectedCouriersCount})`,
              active: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900',
            },
            {
              id: 'methods' as ShippingTab,
              icon: Package,
              label: isAr
                ? `طرق الشحن (${currentShippingMethods.length})`
                : `Methods (${currentShippingMethods.length})`,
              active: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900',
            },
            {
              id: 'drivers' as ShippingTab,
              icon: UserRound,
              label: isAr
                ? `توصيل محلي داخل مدينة مكة (${drivers.length})`
                : `Local delivery within Makkah city (${drivers.length})`,
              active: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900',
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isOn = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isOn
                  ? tab.active + ' shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${tab.id === 'shipments' ? 'rtl:rotate-180' : ''}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
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
                {isAr ? 'خدمات الشحن السعودية والدولية الرسمية' : 'Official Saudi & International Courier Services'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'ربط مباشر لإصدار بوالص الشحن وأرقام التتبع وإشعارات التسليم تلقائياً.'
                  : 'Direct REST/SOAP API connections for auto AWB labels, tracking numbers, and delivery webhook webhooks.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConnectCourierModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? '+ ربط مزود' : '+ Connect Provider'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {[
              {
                code: 'redbox',
                name: isAr ? 'ريدبوكس' : 'RedBox',
                desc: isAr
                  ? 'شحن محلي اقتصادي مع نقاط استلام وتسليم في أنحاء المملكة.'
                  : 'Affordable domestic shipping with pickup points across Saudi Arabia.',
                badge: 'RBX',
                bg: 'bg-rose-600',
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
                code: 'aymakan',
                name: isAr ? 'أي مكان' : 'AyMakan',
                desc: isAr
                  ? 'حلول شحن سعودية مرنة مع تتبّع وتتويج للمدن الرئيسية.'
                  : 'Flexible Saudi courier solutions with tracking across major cities.',
                badge: 'AYM',
                bg: 'bg-teal-700',
              },
              {
                code: 'dhl',
                name: isAr ? 'دي إتش إل إكسبريس' : 'DHL Express',
                desc: isAr ? 'شحن دولي سريع ومميز مع تخليص جمركي معتمد.' : 'Worldwide premium express courier with international customs clearance.',
                badge: 'DHL',
                bg: 'bg-amber-600',
              },
              {
                code: 'jt',
                name: isAr ? 'جيه آند تي إكسبريس' : 'J&T Express',
                desc: isAr
                  ? 'شبكة توصيل سريعة للطرود المحلية مع أسعار تنافسية.'
                  : 'Fast domestic parcel network with competitive rates.',
                badge: 'J&T',
                bg: 'bg-orange-600',
              },
              {
                code: 'spl',
                name: isAr ? 'البريد السعودي (سبل)' : 'Saudi Post (SPL)',
                desc: isAr ? 'الناقل البريدي الوطني مع دعم العنوان الوطني السعودي وخدمة واصل.' : 'National postal courier with Saudi National Address & Wasel integration.',
                badge: 'SPL',
                bg: 'bg-emerald-700',
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
              const logoSrc = shippingMethodLogoSrc(prov.code);

              return (
                <div
                  key={prov.code}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {logoSrc ? (
                          <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1.5 shadow-2xs shrink-0">
                            <img
                              src={logoSrc}
                              alt=""
                              className="max-w-full max-h-full object-contain"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-xl ${prov.bg} text-white font-black text-xs flex items-center justify-center tracking-wider shadow-2xs`}
                          >
                            {prov.badge}
                          </div>
                        )}
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                            {prov.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {isConnected
                              ? isAr
                                ? `الحساب: ${conn?.accountNumber || 'نشط'}`
                                : `Account: ${conn?.accountNumber || 'Active'}`
                              : isAr
                                ? 'غير متصل'
                                : 'Not Connected'}
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
                        {isConnected
                          ? isAr
                            ? 'متصل ✓'
                            : 'Connected ✓'
                          : isAr
                            ? 'غير متصل'
                            : 'Not Connected'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {prov.desc}
                    </p>

                    {isConnected && conn?.maskedApiKey && (
                      <div className="text-[10px] font-mono text-slate-500 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span>{isAr ? 'المفتاح:' : 'Key:'} {conn.maskedApiKey}</span>
                        <span className="text-teal-600 font-bold uppercase">
                          {conn.isSandbox
                            ? isAr
                              ? 'تجريبي'
                              : 'Sandbox'
                            : isAr
                              ? 'ربط مباشر'
                              : 'Live API'}
                        </span>
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
                          {isAr ? 'فحص الاتصال' : 'Test API'}
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
                            const orderCity =
                              anyOrder.city ||
                              (typeof realOrder.shippingAddress === 'string'
                                ? realOrder.shippingAddress
                                : anyOrder.shippingAddress?.city) ||
                              realOrder.deliveryLocation ||
                              (isAr ? 'غير محدد' : 'Unknown');
                            const orderAddress =
                              typeof realOrder.shippingAddress === 'string'
                                ? realOrder.shippingAddress
                                : anyOrder.shippingAddress?.address ||
                                  realOrder.deliveryLocation ||
                                  (isAr ? 'غير محدد' : 'Unknown');
                            const orderTotal = Number(realOrder.total ?? anyOrder.totalAmount ?? 0);
                            const realTrk = String(realOrder.trackingNumber || '').trim();
                            const realAwb = String(anyOrder.awbNumber || realOrder.shippingLabelNumber || '').trim();
                            if (!realTrk && !realAwb) {
                              toast(
                                isAr
                                  ? 'لا يوجد رقم تتبع حقيقي لهذا الطلب. اربط شركة الشحن أولاً.'
                                  : 'No real tracking number on this order. Connect courier first.',
                                'info',
                              );
                              return;
                            }

                            setPreviewLabelData({
                              carrier: prov.code as CourierCarrierCode,
                              carrierName: prov.name,
                              carrierNameAr: prov.name,
                              trackingNumber: realTrk || realAwb,
                              awbNumber: realAwb || realTrk,
                              orderNumber: realOrder.orderNumber || `#${realOrder.id.slice(-8)}`,
                              orderDate: realOrder.createdAt ? realOrder.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
                              sender: {
                                name: activeStore.name || (isAr ? 'تاجر المتجر' : 'Store Merchant'),
                                nameAr: activeStore.nameAr || activeStore.name || '',
                                phone: anyStore.phone || '',
                                address: anyStore.address || (isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia'),
                                city: anyStore.city || (isAr ? 'غير محدد' : 'Unknown'),
                                country: isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia',
                              },
                              recipient: {
                                name: realOrder.customerName || (isAr ? 'عميل' : 'Customer'),
                                phone: realOrder.customerPhone || '',
                                address: orderAddress,
                                city: orderCity,
                                country: isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia',
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
                          {isAr ? 'مزامنة الأسعار' : 'Sync Rates'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCourierProvider(prov.code as any);
                            setShowConnectCourierModal(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                        >
                          {isAr ? 'الإعدادات' : 'Config'}
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
                        {isAr ? `ربط${prov.badge}←` : `Connect ${prov.badge} Provider →`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Own Delivery Drivers ── */}
      {activeTab === 'drivers' && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {commerceTerm('ownDelivery', isAr)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'إدارة مندوبي التوصيل التابعين للمتجر'
                  : 'Manage store-owned delivery drivers'}
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateDriver}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? 'إضافة مندوب' : 'Add Driver'}</span>
            </button>
          </div>

          {driversLoading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isAr ? 'جاري التحميل…' : 'Loading…'}</span>
            </div>
          ) : drivers.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              {isAr ? 'لا توجد سجلات' : 'No records found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 text-start">
                    <th className="py-3 px-4 font-medium text-start">{isAr ? 'الاسم' : 'Name'}</th>
                    <th className="py-3 px-4 font-medium text-start">{isAr ? 'الجوال' : 'Phone'}</th>
                    <th className="py-3 px-4 font-medium text-start">{isAr ? 'البريد الإلكتروني' : 'Email'}</th>
                    <th className="py-3 px-4 font-medium text-start">{isAr ? 'المدينة' : 'City'}</th>
                    <th className="py-3 px-4 font-medium text-start">{isAr ? 'المركبة' : 'Vehicle'}</th>
                    <th className="py-3 px-4 font-medium text-center">{isAr ? 'الحالة' : 'Active'}</th>
                    <th className="py-3 px-4 font-medium text-end">{isAr ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                  {drivers.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {(isAr && d.name_ar) || d.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">{d.phone}</td>
                      <td className="py-3.5 px-4 text-slate-500">{d.email || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {getLocalizedCity(d.city, locale) || d.city || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {d.vehicle_type === 'bike'
                          ? isAr
                            ? 'دراجة نارية'
                            : 'Bike'
                          : d.vehicle_type === 'car'
                            ? isAr
                              ? 'سيارة'
                              : 'Car'
                            : d.vehicle_type === 'van'
                              ? isAr
                                ? 'فان'
                                : 'Van'
                              : d.vehicle_type || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            d.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {d.is_active
                            ? isAr
                              ? 'نشط'
                              : 'Active'
                            : isAr
                              ? 'غير نشط'
                              : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-end">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditDriver(d)}
                            disabled={driversBusy}
                            className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteDriver(d)}
                            disabled={driversBusy}
                            className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                {isAr ? 'طرق شحن المتجر' : 'Store Shipping Methods'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'حسابات الشحن المضبوطة: سعر ثابت، شحن مجاني، حسب الوزن، في نفس اليوم، أو توصيل محلي.'
                  : 'Configured shipping calculations: Flat Rate, Free Shipping, Weight Based, Same-Day, or Local Delivery.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                disabled={presetBusy}
                onClick={async () => {
                  setPresetBusy(true);
                  try {
                    for (const preset of EXAMPLE_SHIPPING_METHOD_PRESETS) {
                      const exists = currentShippingMethods.some(
                        (m) =>
                          m.name === preset.name ||
                          (preset.courierCode && m.courierCode === preset.courierCode),
                      );
                      if (exists) continue;
                      await addShippingMethod({
                        name: preset.name,
                        nameAr: preset.nameAr,
                        type: preset.type,
                        fulfillmentMode: preset.fulfillmentMode,
                        baseRate: preset.baseRate,
                        estimatedDelivery: preset.estimatedDelivery,
                        etaType: 'etaType' in preset ? preset.etaType : 'days',
                        courierCode: preset.courierCode,
                        logoUrl: 'logoUrl' in preset ? preset.logoUrl ?? null : null,
                        isCodAllowed: preset.isCodAllowed,
                        allowOnline: preset.allowOnline,
                        allowBankTransfer: 'allowBankTransfer' in preset ? preset.allowBankTransfer : false,
                        paymentOptions: preset.paymentOptions,
                        isActive: true,
                      });
                    }
                    toast(
                      isAr
                        ? 'تمت إضافة شركات الشحن النموذجية مع الشعارات'
                        : 'Example couriers added with logos',
                      'success',
                    );
                  } catch {
                    toast(
                      isAr ? 'تعذر إضافة الطرق النموذجية' : 'Could not add example methods',
                      'error',
                    );
                  } finally {
                    setPresetBusy(false);
                  }
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {presetBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isAr ? 'إضافة شركات الشحن مع الشعارات' : 'Add couriers with logos'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddMethod(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة شركة / طريقة' : 'Add company / method'}</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isAr
              ? 'مثال الواجهة: ريدبوكس ٢٤ ر.س (٥–٧ أيام) · سمسا ٣٠ ر.س (٥–٨ أيام) · أرامكس ٣٠ ر.س · توصيل محلي داخل مكة ٢–٣ أيام. الوقت والرسوم يُؤكدان عند إتمام الشراء.'
              : 'UI example: RedBox SAR 24 (5–7 days) · SMSA SAR 30 (5–8 days) · Aramex SAR 30 · Local Makkah 2–3 days. Time & charges confirmed at checkout.'}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 text-start">
                  <th className="py-3 px-4 font-medium text-start">{isAr ? 'اسم الطريقة' : 'Method Name'}</th>
                  <th className="py-3 px-4 font-medium text-start">{isAr ? 'النوع' : 'Type'}</th>
                  <th className="py-3 px-4 font-medium text-end">{isAr ? 'السعر الأساسي' : 'Base Rate'}</th>
                  <th className="py-3 px-4 font-medium text-end">{isAr ? 'مجاني فوق' : 'Free Above'}</th>
                  <th className="py-3 px-4 font-medium text-center">{isAr ? 'الدفع عند الاستلام' : 'COD Allowed'}</th>
                  <th className="py-3 px-4 font-medium text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4 font-medium text-end">{isAr ? 'إجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                {currentShippingMethods.map((m) => {
                  const methodLogo =
                    m.logoUrl ||
                    shippingMethodLogoSrc(m.courierCode) ||
                    shippingMethodLogoSrc(m.name) ||
                    shippingMethodLogoSrc(m.nameAr);
                  return (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {methodLogo ? (
                          <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 shrink-0">
                            <img
                              src={methodLogo}
                              alt=""
                              className="max-w-full max-h-full object-contain"
                              loading="lazy"
                            />
                          </div>
                        ) : null}
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                            {m.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {m.nameAr || m.estimatedDelivery}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold uppercase">
                        {m.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-end font-black text-slate-900 dark:text-white tabular-nums">
                      {m.baseRate === 0 ? (isAr ? 'مجاني' : 'Free') : money(m.baseRate)}
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
                        {m.isCodAllowed
                          ? isAr
                            ? 'متاح عند الاستلام'
                            : 'COD Available'
                          : isAr
                            ? 'غير متاح عند الاستلام'
                            : 'No COD'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          updateShippingMethod(m.id, { isActive: !m.isActive });
                          toast(
                            isAr
                              ? m.isActive
                                ? 'تم تعطيل طريقة الشحن'
                                : 'تم تفعيل طريقة الشحن'
                              : `Shipping method ${m.isActive ? 'disabled' : 'activated'}!`,
                            'info'
                          );
                        }}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${
                          m.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {m.isActive ? (isAr ? 'نشط' : 'Active') : isAr ? 'غير نشط' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-end">
                      <button
                        type="button"
                        onClick={() => {
                          const newRate = window.prompt(
                            isAr
                              ? `حدّث السعر الأساسي لـ${m.name}(ر.س):`
                              : `Update base rate for ${m.name} (SAR):`,
                            m.baseRate.toString()
                          );
                          if (newRate !== null && !isNaN(parseFloat(newRate))) {
                            updateShippingMethod(m.id, { baseRate: parseFloat(newRate) });
                            toast(
                              isAr
                                ? `تم تحديث السعر الأساسي إلى${money(parseFloat(newRate))}`
                                : `Base rate updated to ${money(parseFloat(newRate))}`,
                              'success'
                            );
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        {isAr ? 'تعديل السعر' : 'Edit Rate'}
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Connect Courier Modal */}
      {showConnectCourierModal && (
        <GlobalModal
          onClose={() => setShowConnectCourierModal(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'ربط شركة الشحن' : 'Connect Shipping Company'}
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>{isAr ? 'ربط شركة الشحن' : 'Connect Official Courier API'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr
                    ? 'تكامل آمن من جهة الخادم. بيانات الاعتماد لا تُعرض للعملاء أبدًا.'
                    : 'Secure server-side API integration. Credentials are never exposed to customers.'}
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
                  {isAr ? 'شركة الشحن *' : 'Courier Provider *'}
                </label>
                <select
                  value={courierProvider}
                  onChange={(e) => setCourierProvider(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                >
                  <option value="spl">{isAr ? 'البريد السعودي (سبل) - الناقل الوطني الرسمي' : 'Saudi Post (SPL) - Official National Carrier'}</option>
                  <option value="smsa">{isAr ? 'سمسا إكسبريس - شحن محلي سريع' : 'SMSA Express - Domestic Saudi Express'}</option>
                  <option value="aramex">{isAr ? 'أرامكس - شحن إقليمي ودولي' : 'Aramex - Regional & International Courier'}</option>
                  <option value="dhl">{isAr ? 'دي إتش إل إكسبريس - شحن عالمي' : 'DHL Express - Worldwide Express'}</option>
                  <option value="fedex">{isAr ? 'فيدكس إكسبريس - لوجستيات أولوية' : 'FedEx Express - Priority Logistics'}</option>
                  <option value="ups">{isAr ? 'يو بي إس - شبكة شحن عالمية' : 'UPS - Global Shipping Network'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'رقم حساب الشحن / معرّف الشاحن *' : 'Courier Account Number / Shipper ID *'}
                </label>
                <input
                  type="text"
                  required
                  value={courierAccountNumber}
                  onChange={(e) => setCourierAccountNumber(e.target.value)}
                  placeholder={isAr ? 'مثال: سبل-ACC-99214 أو سمسا-SHP-001' : 'e.g. SPL-ACC-99214 or SMSA-SHP-001'}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'مفتاح الربط / معرّف العميل *' : 'API Key / Client ID *'}
                </label>
                <input
                  type="password"
                  required
                  value={courierApiKey}
                  onChange={(e) => setCourierApiKey(e.target.value)}
                  placeholder={isAr ? 'أدخل مفتاح الربط الرسمي' : 'Enter official API key'}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'السر / كلمة المرور (اختياري لبعض المزودين)' : 'API Secret / Password (Optional for some providers)'}
                </label>
                <input
                  type="password"
                  value={courierApiSecret}
                  onChange={(e) => setCourierApiSecret(e.target.value)}
                  placeholder={isAr ? 'أدخل السر أو الرمز' : 'Enter API secret / token'}
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
                  {isAr ? 'استخدام وضع الاختبار (بيئة آمنة للتجربة)' : 'Use Sandbox / Testing Mode (Safe test environment)'}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConnectCourierModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  {isAr ? 'تفويض وربط الناقل' : 'Authorize & Connect Carrier'}
                </button>
              </div>
            </form>
          </div>
        </GlobalModal>
      )}

      {/* Add Shipping Method Modal */}
      {showAddMethod && (
        <GlobalModal
          onClose={() => setShowAddMethod(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'إعداد طريقة الشحن' : 'Configure Shipping Method'}
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {isAr ? 'إعداد طريقة الشحن' : 'Configure Shipping Method'}
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
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  {isAr ? 'نوع التوصيل' : 'Fulfillment type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className={optionBtnClass(methodFulfillment === 'own_delivery')} onClick={() => setMethodFulfillment('own_delivery')}>
                    {isAr ? 'توصيل المتجر' : 'Our delivery'}
                  </button>
                  <button type="button" className={optionBtnClass(methodFulfillment === 'courier')} onClick={() => setMethodFulfillment('courier')}>
                    {isAr ? 'شركة شحن' : 'Shipping company'}
                  </button>
                </div>
              </div>

              {methodFulfillment === 'courier' ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                    {isAr ? 'شركة الشحن (يمكن إضافة المزيد لاحقاً)' : 'Courier company (more can be added later)'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(
                      [
                        { code: 'redbox', en: 'RedBox', ar: 'ريدبوكس', rate: '24', eta: '5–7 business days' },
                        { code: 'smsa', en: 'SMSA Express – Standard Shipping', ar: 'سمسا إكسبريس — الشحن القياسي', rate: '30', eta: '5–8 business days' },
                        { code: 'aramex', en: 'Aramex', ar: 'أرامكس', rate: '30', eta: '5–8 business days' },
                        { code: 'aymakan', en: 'AyMakan', ar: 'أي مكان', rate: '28', eta: '3–5 business days' },
                        { code: 'dhl', en: 'DHL Express', ar: 'دي إتش إل إكسبريس', rate: '55', eta: '2–4 business days' },
                        { code: 'jt', en: 'J&T Express', ar: 'جيه آند تي إكسبريس', rate: '22', eta: '3–6 business days' },
                      ] as const
                    ).map((c) => {
                      const logo = shippingMethodLogoSrc(c.code);
                      const selected =
                        methodCourierCode === c.code ||
                        methodName.toLowerCase().includes(c.code) ||
                        methodNameAr.includes(c.ar);
                      return (
                      <button
                        key={c.code}
                        type="button"
                        className={`${optionBtnClass(selected)} flex flex-col items-center gap-1.5 py-2.5`}
                        onClick={() => {
                          setMethodCourierCode(c.code);
                          setMethodName(c.en);
                          setMethodNameAr(c.ar);
                          setMethodBaseRate(c.rate);
                          setMethodEstimatedDays(c.eta);
                          setMethodLogoUrl(logo || '');
                          setMethodFulfillment('courier');
                          setMethodType('flat_rate');
                        }}
                      >
                        {logo ? (
                          <span className="w-full h-8 rounded-md bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center px-1.5">
                            <img src={logo} alt="" className="max-h-6 max-w-full object-contain" loading="lazy" />
                          </span>
                        ) : null}
                        <span className="text-[11px] font-bold">{isAr ? c.ar : c.en.split('–')[0].trim()}</span>
                      </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    className={optionBtnClass(true)}
                    onClick={() => {
                      setMethodCourierCode(null);
                      setMethodName('Local Delivery (Within Makkah City Limits)');
                      setMethodNameAr('توصيل محلي (داخل حدود مدينة مكة)');
                      setMethodType('same_day');
                      setMethodBaseRate('0');
                      setMethodEstimatedDays('2–3 days');
                      setMethodEtaType('days');
                    }}
                  >
                    {isAr ? 'تعبئة توصيل مكة المحلي' : 'Fill Local Makkah Delivery'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'اسم الطريقة (بالإنجليزية) *' : 'Method Name (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={methodName}
                    onChange={(e) => setMethodName(e.target.value)}
                    placeholder={isAr ? '' : 'e.g. Express Same-Day Delivery'}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'اسم الطريقة (بالعربية)' : 'Method Name (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={methodNameAr}
                    onChange={(e) => setMethodNameAr(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'رابط شعار الشركة' : 'Company logo URL'}
                  </label>
                  <input
                    type="url"
                    value={methodLogoUrl}
                    onChange={(e) => setMethodLogoUrl(e.target.value)}
                    placeholder="https://…"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'نوع المركبة' : 'Vehicle type'}
                  </label>
                  <select
                    value={methodVehicle}
                    onChange={(e) => setMethodVehicle((e.target.value as 'bike' | 'car' | 'van' | '') || '')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    <option value="">{isAr ? 'اختياري' : 'Optional'}</option>
                    <option value="bike">{isAr ? 'دراجة نارية' : 'Bike'}</option>
                    <option value="car">{isAr ? 'سيارة' : 'Car'}</option>
                    <option value="van">{isAr ? 'فان' : 'Van'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  {isAr ? 'طريقة حساب الرسوم' : 'Charge calculation'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'flat_rate' as const, en: 'Fixed', ar: 'ثابت' },
                      { id: 'weight_based' as const, en: 'Per kg', ar: 'حسب الكيلو' },
                      { id: 'zone_based' as const, en: 'Per km / zone', ar: 'حسب الكيلومتر' },
                      { id: 'same_day' as const, en: 'Same day', ar: 'نفس اليوم' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={optionBtnClass(methodType === opt.id)}
                      onClick={() => {
                        setMethodType(opt.id);
                        if (opt.id === 'same_day') setMethodEtaType('same_day');
                      }}
                    >
                      {isAr ? opt.ar : opt.en}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'أساسي (ر.س)' : 'Base (SAR)'}
                  </label>
                  <input type="number" min="0" step="0.01" value={methodBaseRate} onChange={(e) => setMethodBaseRate(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'للكل كجم' : 'Per kg'}
                  </label>
                  <input type="number" min="0" step="0.01" value={methodPerKg} onChange={(e) => setMethodPerKg(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'للكل كم' : 'Per km'}
                  </label>
                  <input type="number" min="0" step="0.01" value={methodPerKm} onChange={(e) => setMethodPerKm(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'مجاني فوق (ر.س)' : 'Free above (SAR)'}
                  </label>
                  <input type="number" value={methodFreeThreshold} onChange={(e) => setMethodFreeThreshold(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'نص الوقت المتوقع' : 'ETA text'}
                  </label>
                  <input type="text" value={methodEstimatedDays} onChange={(e) => setMethodEstimatedDays(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  {isAr ? 'وقت التوصيل' : 'Delivery timing'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'same_day' as const, en: 'Same day', ar: 'نفس اليوم' },
                      { id: 'hours' as const, en: 'Hours', ar: 'ساعات' },
                      { id: 'days' as const, en: 'Days', ar: 'أيام' },
                      { id: 'track' as const, en: 'Tracking', ar: 'تتبع' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={optionBtnClass(
                        opt.id === 'track' ? methodTracking : methodEtaType === opt.id,
                      )}
                      onClick={() => {
                        if (opt.id === 'track') setMethodTracking((v) => !v);
                        else setMethodEtaType(opt.id);
                      }}
                    >
                      {isAr ? opt.ar : opt.en}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  {isAr ? 'خيارات الدفع' : 'Payment options'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button type="button" className={optionBtnClass(methodPayments.includes('cod'))} onClick={() => togglePaymentOption(methodPayments, setMethodPayments, 'cod')}>
                    {isAr ? 'عند الاستلام' : 'COD'}
                  </button>
                  <button type="button" className={optionBtnClass(methodPayments.includes('online'))} onClick={() => togglePaymentOption(methodPayments, setMethodPayments, 'online')}>
                    {isAr ? 'دفع إلكتروني' : 'Online'}
                  </button>
                  <button type="button" className={optionBtnClass(methodPayments.includes('bank_transfer'))} onClick={() => togglePaymentOption(methodPayments, setMethodPayments, 'bank_transfer')}>
                    {isAr ? 'تحويل بنكي' : 'Bank transfer'}
                  </button>
                  <button type="button" className={optionBtnClass(methodType === 'free')} onClick={() => setMethodType(methodType === 'free' ? 'flat_rate' : 'free')}>
                    {isAr ? 'شحن مجاني' : 'Free shipping'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddMethod(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  {isAr ? 'حفظ الطريقة' : 'Save Method'}
                </button>
              </div>
            </form>
          </div>
        </GlobalModal>
      )}

      {/* Add City Modal */}
      {showAddCityModal && (
        <GlobalModal
          onClose={() => setShowAddCityModal(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'إضافة مدينة أو منطقة' : 'Add Saudi City / Zone'}
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {isAr ? 'إضافة مدينة أو منطقة' : 'Add Saudi City / Zone'}
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
                  {isAr ? 'اسم المدينة / المنطقة *' : 'City / Area Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  placeholder={isAr ? 'مثال: الطائف، تبوك، الأحساء' : 'e.g. Taif, Tabuk, Al Ahsa'}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'المنطقة / المحافظة' : 'Region / Province'}
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
                    {isAr ? 'رسوم التوصيل (ر.س)' : 'Delivery Fee (SAR)'}
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
                    {isAr ? 'الوقت المتوقع (مثال: ١–٢ يوم)' : 'ETA (e.g. 1-2 Days)'}
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
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  {isAr ? 'حفظ المدينة' : 'Save City'}
                </button>
              </div>
            </form>
          </div>
        </GlobalModal>
      )}

      {/* Delivery Driver Create / Edit Modal */}
      {showDriverModal && (
        <GlobalModal
          onClose={() => setShowDriverModal(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={editingDriver ? commerceTerm('deliveryDriver', isAr) : commerceTerm('ownDelivery', isAr)}
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserRound className="w-5 h-5 text-blue-600" />
                <span>
                  {editingDriver
                    ? isAr
                      ? 'تعديل مندوب التوصيل'
                      : 'Edit Delivery Driver'
                    : isAr
                      ? 'إضافة مندوب توصيل'
                      : 'Add Delivery Driver'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowDriverModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'الاسم *' : 'Name *'}
                  </label>
                  <input type="text" required value={driverName} onChange={(e) => setDriverName(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'الجوال *' : 'Phone *'}
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value.replace(/[^\d+\s]/g, ''))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input type="email" value={driverEmail} onChange={(e) => setDriverEmail(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'موقع الانطلاق' : 'Base location'}
                  </label>
                  <input type="text" value={driverBaseLocation} onChange={(e) => setDriverBaseLocation(e.target.value)} placeholder={isAr ? 'مثال: العزيزية، مكة' : 'e.g. Aziziyah, Makkah'} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'المدينة' : 'City'}
                  </label>
                  <input type="text" value={driverCity} onChange={(e) => setDriverCity(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {isAr ? 'المركبة' : 'Vehicle'}
                  </label>
                  <select
                    value={driverVehicle}
                    onChange={(e) => setDriverVehicle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                  >
                    <option value="">{isAr ? 'اختر المركبة' : 'Select vehicle'}</option>
                    <option value="bike">{isAr ? 'دراجة نارية' : 'Bike'}</option>
                    <option value="car">{isAr ? 'سيارة' : 'Car'}</option>
                    <option value="van">{isAr ? 'فان' : 'Van'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  {isAr ? 'مناطق التوصيل' : 'Delivery areas'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SERVICE_AREA_OPTIONS.map((area) => {
                    const on = driverAreas.includes(area.id);
                    return (
                      <button
                        key={area.id}
                        type="button"
                        className={optionBtnClass(on)}
                        onClick={() =>
                          setDriverAreas((prev) =>
                            on ? prev.filter((x) => x !== area.id) : [...prev, area.id],
                          )
                        }
                      >
                        {isAr ? area.ar : area.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  {isAr ? 'حساب أجرة التوصيل' : 'Delivery fee mode'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'fixed' as const, en: 'Fixed', ar: 'ثابت' },
                      { id: 'per_kg' as const, en: 'Per kg', ar: 'حسب الكيلو' },
                      { id: 'per_km' as const, en: 'Per km', ar: 'حسب الكيلومتر' },
                      { id: 'zone' as const, en: 'By zone', ar: 'حسب المنطقة' },
                    ] as const
                  ).map((opt) => (
                    <button key={opt.id} type="button" className={optionBtnClass(driverRateMode === opt.id)} onClick={() => setDriverRateMode(opt.id)}>
                      {isAr ? opt.ar : opt.en}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">{isAr ? 'ثابت' : 'Fixed'}</label>
                  <input type="number" min="0" step="0.01" value={driverFixedRate} onChange={(e) => setDriverFixedRate(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">{isAr ? 'للكل كجم' : 'Per kg'}</label>
                  <input type="number" min="0" step="0.01" value={driverPerKg} onChange={(e) => setDriverPerKg(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">{isAr ? 'للكل كم' : 'Per km'}</label>
                  <input type="number" min="0" step="0.01" value={driverPerKm} onChange={(e) => setDriverPerKm(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  {isAr ? 'الوقت والدفع' : 'Timing & payment'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button type="button" className={optionBtnClass(driverSameDay)} onClick={() => setDriverSameDay((v) => !v)}>
                    {isAr ? 'نفس اليوم' : 'Same day'}
                  </button>
                  <button type="button" className={optionBtnClass(driverPayments.includes('cod'))} onClick={() => togglePaymentOption(driverPayments, setDriverPayments, 'cod')}>
                    {isAr ? 'عند الاستلام' : 'COD'}
                  </button>
                  <button type="button" className={optionBtnClass(driverPayments.includes('online'))} onClick={() => togglePaymentOption(driverPayments, setDriverPayments, 'online')}>
                    {isAr ? 'إلكتروني' : 'Online'}
                  </button>
                  <button type="button" className={optionBtnClass(driverPayments.includes('bank_transfer'))} onClick={() => togglePaymentOption(driverPayments, setDriverPayments, 'bank_transfer')}>
                    {isAr ? 'تحويل بنكي' : 'Bank'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'الوقت المتوقع / التتبع' : 'ETA / tracking note'}
                </label>
                <input type="text" value={driverEta} onChange={(e) => setDriverEta(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button type="button" className={optionBtnClass(driverActive)} onClick={() => setDriverActive(true)}>
                  {isAr ? 'نشط' : 'Active'}
                </button>
                <button type="button" className={optionBtnClass(!driverActive)} onClick={() => setDriverActive(false)}>
                  {isAr ? 'غير نشط' : 'Inactive'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400"
                >
                  {commerceTerm('cancel', isAr)}
                </button>
                <button
                  type="submit"
                  disabled={driversBusy}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {driversBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{commerceTerm('saveChanges', isAr)}</span>
                </button>
              </div>
            </form>
          </div>
        </GlobalModal>
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
