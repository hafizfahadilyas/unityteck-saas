import React, { useMemo, useState } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import type { ShippingZone } from '../../../types';
import {
  Truck,
  Plus,
  HelpCircle,
  MapPin,
  CheckCircle2,
  Settings,
  MoreVertical,
  Globe,
  Edit2,
  Package,
  Layers,
  Scale,
  DollarSign,
  ShieldCheck,
  ChevronDown,
  X,
  Trash2,
} from 'lucide-react';

interface ZoneRegionItem {
  id: string;
  nameEn: string;
  nameAr: string;
  cities: string[];
  cityCount: number;
  baseRate: number;
  baseWeightKg: number;
  additionalRate: number;
  additionalWeightKg: number;
  isActive: boolean;
  color: string;
}

interface RegionDefinition {
  id: string;
  nameEn: string;
  nameAr: string;
  sampleCities: string[];
  defaultBaseRate: number;
  defaultRatePerKg: number;
  color: string;
}

const SAUDI_REGION_DEFS: RegionDefinition[] = [
  {
    id: 'central',
    nameEn: 'Central Region',
    nameAr: 'المنطقة الوسطى',
    sampleCities: ['Riyadh', 'Al Kharj', 'Al Majmaah', 'Al Zulfi', 'Diriyah', 'Shaqra'],
    defaultBaseRate: 24.0,
    defaultRatePerKg: 6.0,
    color: '#34d399',
  },
  {
    id: 'western',
    nameEn: 'Western Region',
    nameAr: 'المنطقة الغربية',
    sampleCities: ['Jeddah', 'Makkah', 'Taif', 'Yanbu', 'Rabigh', 'Medina'],
    defaultBaseRate: 25.0,
    defaultRatePerKg: 6.0,
    color: '#a78bfa',
  },
  {
    id: 'eastern',
    nameEn: 'Eastern Region',
    nameAr: 'المنطقة الشرقية',
    sampleCities: ['Dammam', 'Khobar', 'Dhahran', 'Al Ahsa', 'Jubail', 'Qatif'],
    defaultBaseRate: 26.0,
    defaultRatePerKg: 6.0,
    color: '#38bdf8',
  },
  {
    id: 'northern',
    nameEn: 'Northern Region',
    nameAr: 'المنطقة الشمالية',
    sampleCities: ['Tabuk', 'Arar', 'Sakaka', 'Al Qurayyat', 'Turaif', 'Rafha'],
    defaultBaseRate: 28.0,
    defaultRatePerKg: 8.0,
    color: '#60a5fa',
  },
  {
    id: 'southern',
    nameEn: 'Southern Region',
    nameAr: 'المنطقة الجنوبية',
    sampleCities: ['Abha', 'Khamis Mushait', 'Najran', 'Jazan', 'Bisha', 'Al Bahah'],
    defaultBaseRate: 30.0,
    defaultRatePerKg: 8.0,
    color: '#f87171',
  },
  {
    id: 'qassim',
    nameEn: 'Qassim Region',
    nameAr: 'منطقة القصيم',
    sampleCities: ['Buraidah', 'Unaizah', 'Al Rass', 'Al Mithnab', 'Al Bukayriyah'],
    defaultBaseRate: 25.0,
    defaultRatePerKg: 6.0,
    color: '#fbbf24',
  },
  {
    id: 'other',
    nameEn: 'Other Areas',
    nameAr: 'المناطق الأخرى',
    sampleCities: ['Sharurah', 'Wadi Fatima', 'Tayma', 'Farasan Islands'],
    defaultBaseRate: 40.0,
    defaultRatePerKg: 10.0,
    color: '#94a3b8',
  },
];

export const ShippingZonesRatesView: React.FC = () => {
  const {
    currentShipping,
    updateShippingRate,
    addShippingCity,
    deleteShippingCity,
    currentShippingMethods,
    addShippingMethod,
    deleteShippingMethod,
  } = useTenant();
  const { locale, money } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<
    'zones' | 'pricing' | 'free_shipping' | 'courier' | 'weight' | 'settings'
  >('zones');

  // Real Regions derived from database shipping zones
  const regions: ZoneRegionItem[] = useMemo(() => {
    return SAUDI_REGION_DEFS.map((def) => {
      const matchingZones = (currentShipping || []).filter((z) => {
        const reg = (z.region || z.province || '').toLowerCase();
        const city = (z.cityName || '').toLowerCase();
        return (
          reg.includes(def.id) ||
          reg.includes(def.nameEn.toLowerCase()) ||
          reg.includes(def.nameAr) ||
          def.sampleCities.some((c) => c.toLowerCase() === city)
        );
      });

      const cities = matchingZones.map((z) => z.cityName);
      const avgRate =
        matchingZones.length > 0
          ? matchingZones.reduce((sum, z) => sum + z.rate, 0) / matchingZones.length
          : def.defaultBaseRate;
      const ratePerKg =
        matchingZones.length > 0 ? (matchingZones[0].ratePerKg ?? def.defaultRatePerKg) : def.defaultRatePerKg;

      return {
        id: def.id,
        nameEn: def.nameEn,
        nameAr: def.nameAr,
        cities: cities.length > 0 ? cities : def.sampleCities.slice(0, 3),
        cityCount: matchingZones.length > 0 ? matchingZones.length : (currentShipping.length > 0 ? 0 : def.sampleCities.length),
        baseRate: Math.round(avgRate * 100) / 100,
        baseWeightKg: 1,
        additionalRate: ratePerKg,
        additionalWeightKg: 1,
        isActive: matchingZones.length > 0 ? matchingZones.some((z) => z.status === 'active') : true,
        color: def.color,
      };
    });
  }, [currentShipping]);

  // Selected Zone for Details Pane
  const [selectedZoneId, setSelectedZoneId] = useState<string>('central');
  const activeZone = useMemo(() => {
    return regions.find((r) => r.id === selectedZoneId) || regions[0];
  }, [regions, selectedZoneId]);

  // Real Summary Metrics
  const totalZonesCount = currentShipping.length > 0 ? currentShipping.length : regions.length;
  const totalCitiesCovered = useMemo(() => {
    if (currentShipping.length > 0) {
      return new Set(currentShipping.map((z) => z.cityName.toLowerCase())).size;
    }
    return regions.reduce((sum, r) => sum + r.cityCount, 0);
  }, [currentShipping, regions]);

  // Free Shipping Rules derived from real methods & zones
  const freeRulesList = useMemo(() => {
    const list: { id: string; name: string; condition: string; appliesTo: string; status: string }[] = [];
    (currentShippingMethods || []).forEach((m) => {
      if (m.type === 'free' || Boolean(m.freeShippingThreshold && m.freeShippingThreshold > 0)) {
        list.push({
          id: `free-meth-${m.id}`,
          name: m.name,
          condition: m.freeShippingThreshold ? `Order Value ≥ SAR ${m.freeShippingThreshold}` : 'Free on all orders',
          appliesTo: m.courierCode ? m.courierCode.toUpperCase() : 'All Zones',
          status: m.isActive ? 'Active' : 'Inactive',
        });
      }
    });

    (currentShipping || []).forEach((z) => {
      if (z.freeShippingAbove && z.freeShippingAbove > 0) {
        list.push({
          id: `free-zone-${z.id}`,
          name: `${z.cityName} Delivery Waiver`,
          condition: `Order Value ≥ SAR ${z.freeShippingAbove}`,
          appliesTo: z.cityName,
          status: z.status === 'active' ? 'Active' : 'Inactive',
        });
      }
    });

    return list;
  }, [currentShippingMethods, currentShipping]);

  // Modals
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [showAddFreeRuleModal, setShowAddFreeRuleModal] = useState(false);
  const [showManageCitiesModal, setShowManageCitiesModal] = useState(false);

  // New Zone Form
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneNameAr, setNewZoneNameAr] = useState('');
  const [newZoneBaseRate, setNewZoneBaseRate] = useState('25');

  // New Pricing Rule Form
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleCondition, setNewRuleCondition] = useState('flat_rate');
  const [newRulePrice, setNewRulePrice] = useState('25');
  const [newRuleCourier, setNewRuleCourier] = useState('spl');

  // New Free Rule Form
  const [newFreeName, setNewFreeName] = useState('');
  const [newFreeThreshold, setNewFreeThreshold] = useState('200');

  // Handle Rate Update (Real API write)
  const handleRateChange = async (field: keyof ZoneRegionItem, value: any) => {
    const matching = (currentShipping || []).filter((z) => {
      const reg = (z.region || z.province || '').toLowerCase();
      return reg.includes(activeZone.id) || reg.includes(activeZone.nameEn.toLowerCase());
    });

    try {
      if (matching.length > 0) {
        for (const z of matching) {
          if (field === 'baseRate') {
            await updateShippingRate(z.id, Number(value), z.freeShippingAbove);
          } else if (field === 'additionalRate') {
            await updateShippingRate(z.id, z.rate, z.freeShippingAbove, { ratePerKg: Number(value) });
          }
        }
      } else {
        await addShippingCity(
          activeZone.cities[0] || activeZone.nameEn,
          field === 'baseRate' ? Number(value) : activeZone.baseRate,
          200,
          '1-2 Days',
          {
            region: activeZone.nameEn,
            ratePerKg: field === 'additionalRate' ? Number(value) : activeZone.additionalRate,
          }
        );
      }
      toast(isAr ? 'تم تحديث أسعار الشحن وحفظها في قاعدة البيانات' : 'Shipping zone rates updated and saved to database', 'success');
    } catch {
      toast(isAr ? 'فشل حفظ الأسعار' : 'Failed to update rates in database', 'error');
    }
  };

  // Handle Add Zone (Real API write)
  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    try {
      await addShippingCity(
        newZoneName.trim(),
        parseFloat(newZoneBaseRate) || 25,
        200,
        '1-2 Days',
        {
          region: activeZone.nameEn,
          ratePerKg: 6,
        }
      );
      setShowAddZoneModal(false);
      setNewZoneName('');
      setNewZoneNameAr('');
      toast(isAr ? 'تم إضافة منطقة الشحن وحفظها بالخادم بنجاح' : 'New shipping zone created in database', 'success');
    } catch {
      toast(isAr ? 'فشل حفظ المنطقة' : 'Failed to create zone in database', 'error');
    }
  };

  // Handle Add Pricing Rule (Real API write to shipping methods)
  const handleAddPricingRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;
    try {
      await addShippingMethod({
        name: newRuleName.trim(),
        nameAr: newRuleName.trim(),
        type: newRuleCondition as any,
        baseRate: parseFloat(newRulePrice) || 25,
        courierCode: newRuleCourier,
        estimatedDelivery: '1-3 Business Days',
        isCodAllowed: true,
        isActive: true,
      });
      setShowAddRuleModal(false);
      setNewRuleName('');
      toast(isAr ? 'تم إضافة طريقة التسعير وحفظها بالخادم' : 'Pricing method saved to database', 'success');
    } catch {
      toast(isAr ? 'فشل حفظ طريقة التسعير' : 'Failed to save pricing rule', 'error');
    }
  };

  // Handle Add Free Shipping Rule (Real API write to shipping methods)
  const handleAddFreeRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFreeName.trim()) return;
    try {
      await addShippingMethod({
        name: newFreeName.trim(),
        nameAr: newFreeName.trim(),
        type: 'free',
        baseRate: 0,
        freeShippingThreshold: parseFloat(newFreeThreshold) || 200,
        estimatedDelivery: '2-4 Business Days',
        isCodAllowed: false,
        isActive: true,
      });
      setShowAddFreeRuleModal(false);
      setNewFreeName('');
      toast(isAr ? 'تم إضافة قاعدة الشحن المجاني وحفظها بالخادم' : 'Free shipping rule saved to database', 'success');
    } catch {
      toast(isAr ? 'فشل حفظ قاعدة الشحن المجاني' : 'Failed to save free shipping rule', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ── 1. Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Truck className="w-5 h-5 rtl:rotate-180" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isAr ? 'مناطق الشحن والأسعار' : 'Shipping Zones & Rates'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'تخصيص مناطق الشحن، وتحديد أسعار التوصيل، وإدارة خيارات الشحن لمتجرك.'
                : 'Configure shipping zones, set rates, and manage delivery options for your store.'}
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs">
            <span className="text-base">🇸🇦</span>
            <span>{isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <button
            type="button"
            onClick={() =>
              toast(
                isAr
                  ? 'دليل المناطق: يتم احتساب تكلفة الشحن آلياً في صفحة الدفع حسب مدينة العميل والوزن الإجمالي.'
                  : 'Zone Guide: Shipping cost is calculated dynamically at checkout based on customer destination and parcel weight.',
                'info'
              )
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{isAr ? 'دليل المساعدة' : 'Help Guide'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Navigation Sub-tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {[
          { key: 'zones', label: isAr ? 'المناطق والمدن' : 'Zones & Areas' },
          { key: 'pricing', label: isAr ? 'قواعد الأسعار' : 'Pricing Rules' },
          { key: 'free_shipping', label: isAr ? 'الشحن المجاني' : 'Free Shipping' },
          { key: 'courier', label: isAr ? 'اختيار شركات الشحن' : 'Courier Selection' },
          { key: 'weight', label: isAr ? 'الوزن الحجمي' : 'Dimensional Weight' },
          { key: 'settings', label: isAr ? 'إعدادات إضافية' : 'Additional Settings' },
        ].map((tab) => {
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── 3. Four Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Zones */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              {isAr ? 'إجمالي المناطق' : 'Total Zones'}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {totalZonesCount}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {isAr ? 'مسجلة بالخادم' : 'Stored in DB'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Cities Covered */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              {isAr ? 'المدن المغطاة' : 'Cities Covered'}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {totalCitiesCovered}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                100% KSA
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Active Shipping Methods */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              {isAr ? 'طرق الشحن النشطة' : 'Active Shipping Methods'}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {currentShippingMethods.filter((m) => m.isActive).length}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 truncate max-w-[130px]">
                {currentShippingMethods.length} {isAr ? 'متاحة' : 'configured'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Free Shipping Rules */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
              {isAr ? 'قواعد الشحن المجاني' : 'Free Shipping Rules'}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {freeRulesList.length}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {isAr ? 'حسب الشروط' : 'Active rules'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Main 3-Column Studio Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── Column 1: Shipping Zones List (4 cols) ── */}
        <div className="lg:col-span-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'مناطق الشحن' : 'Shipping Zones'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddZoneModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة منطقة' : 'Add Zone'}</span>
              </button>
            </div>

            {/* List of Regions */}
            <div className="mt-3 space-y-1.5">
              {regions.map((reg) => {
                const isSelected = selectedZoneId === reg.id;
                return (
                  <div
                    key={reg.id}
                    onClick={() => setSelectedZoneId(reg.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-blue-500/80 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                        : 'border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: reg.color }}
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {isAr ? reg.nameAr : reg.nameEn}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                          {reg.cities.slice(0, 3).join(', ')} {reg.cityCount > 3 ? `+${reg.cityCount - 3}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {reg.cityCount} {isAr ? 'مدينة' : 'cities'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50">
                        {isAr ? 'نشط' : 'Active'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedZoneId(reg.id);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Column 2: Saudi Arabia Interactive Regional Map (4 cols) ── */}
        <div className="lg:col-span-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'خريطة مناطق الشحن بالمملكة' : 'Saudi Arabia Shipping Zones'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isAr ? 'انقر على أي منطقة لعرض مدنها وأسعارها' : 'Click on a region to view cities and settings'}
              </p>
            </div>

            {/* Interactive Saudi Vector Map */}
            <div className="mt-4 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 p-2 relative flex items-center justify-center">
              <svg
                viewBox="0 0 400 320"
                className="w-full h-auto max-h-[300px] drop-shadow-xs select-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* 1. Northern Region Polygon */}
                <path
                  d="M 60 50 L 220 30 L 290 80 L 210 100 L 90 95 Z"
                  fill="#93c5fd"
                  opacity={selectedZoneId === 'northern' ? 0.95 : 0.65}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                  onClick={() => setSelectedZoneId('northern')}
                />

                {/* 2. Central Region Polygon */}
                <path
                  d="M 170 105 L 280 85 L 300 180 L 190 190 L 140 140 Z"
                  fill="#86efac"
                  opacity={selectedZoneId === 'central' ? 0.95 : 0.65}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                  onClick={() => setSelectedZoneId('central')}
                />

                {/* 3. Western Region Polygon */}
                <path
                  d="M 60 90 L 150 110 L 140 210 L 80 180 Z"
                  fill="#c4b5fd"
                  opacity={selectedZoneId === 'western' ? 0.95 : 0.65}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                  onClick={() => setSelectedZoneId('western')}
                />

                {/* 4. Eastern Region Polygon */}
                <path
                  d="M 285 85 L 370 120 L 380 200 L 305 210 L 285 140 Z"
                  fill="#7dd3fc"
                  opacity={selectedZoneId === 'eastern' ? 0.95 : 0.65}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                  onClick={() => setSelectedZoneId('eastern')}
                />

                {/* 5. Southern Region Polygon */}
                <path
                  d="M 120 210 L 230 200 L 260 270 L 130 260 Z"
                  fill="#fca5a5"
                  opacity={selectedZoneId === 'southern' ? 0.95 : 0.65}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                  onClick={() => setSelectedZoneId('southern')}
                />

                {/* Northern Pin */}
                <g transform="translate(180, 55)" className="cursor-pointer" onClick={() => setSelectedZoneId('northern')}>
                  <rect x="-42" y="-12" width="84" height="24" rx="12" fill="#ffffff" stroke="#60a5fa" strokeWidth="1.5" />
                  <circle cx="-28" cy="0" r="4" fill="#60a5fa" />
                  <text x="-18" y="4" fontSize="9" fontWeight="bold" fill="#1e293b">Northern</text>
                  <text x="-32" y="19" fontSize="8" fontWeight="bold" fill="#60a5fa">SAR {regions.find(r => r.id === 'northern')?.baseRate || 28}</text>
                </g>

                {/* Central Pin */}
                <g transform="translate(220, 130)" className="cursor-pointer" onClick={() => setSelectedZoneId('central')}>
                  <rect x="-40" y="-12" width="80" height="24" rx="12" fill="#ffffff" stroke="#10b981" strokeWidth="1.5" />
                  <circle cx="-26" cy="0" r="4" fill="#10b981" />
                  <text x="-16" y="4" fontSize="9" fontWeight="bold" fill="#1e293b">Central</text>
                  <text x="-30" y="19" fontSize="8" fontWeight="bold" fill="#10b981">SAR {regions.find(r => r.id === 'central')?.baseRate || 24}</text>
                </g>

                {/* Western Pin */}
                <g transform="translate(100, 160)" className="cursor-pointer" onClick={() => setSelectedZoneId('western')}>
                  <rect x="-40" y="-12" width="80" height="24" rx="12" fill="#ffffff" stroke="#8b5cf6" strokeWidth="1.5" />
                  <circle cx="-26" cy="0" r="4" fill="#8b5cf6" />
                  <text x="-16" y="4" fontSize="9" fontWeight="bold" fill="#1e293b">Western</text>
                  <text x="-30" y="19" fontSize="8" fontWeight="bold" fill="#8b5cf6">SAR {regions.find(r => r.id === 'western')?.baseRate || 25}</text>
                </g>

                {/* Eastern Pin */}
                <g transform="translate(330, 150)" className="cursor-pointer" onClick={() => setSelectedZoneId('eastern')}>
                  <rect x="-40" y="-12" width="80" height="24" rx="12" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
                  <circle cx="-26" cy="0" r="4" fill="#0284c7" />
                  <text x="-16" y="4" fontSize="9" fontWeight="bold" fill="#1e293b">Eastern</text>
                  <text x="-30" y="19" fontSize="8" fontWeight="bold" fill="#0284c7">SAR {regions.find(r => r.id === 'eastern')?.baseRate || 26}</text>
                </g>

                {/* Southern Pin */}
                <g transform="translate(200, 240)" className="cursor-pointer" onClick={() => setSelectedZoneId('southern')}>
                  <rect x="-42" y="-12" width="84" height="24" rx="12" fill="#ffffff" stroke="#ef4444" strokeWidth="1.5" />
                  <circle cx="-28" cy="0" r="4" fill="#ef4444" />
                  <text x="-18" y="4" fontSize="9" fontWeight="bold" fill="#1e293b">Southern</text>
                  <text x="-32" y="19" fontSize="8" fontWeight="bold" fill="#ef4444">SAR {regions.find(r => r.id === 'southern')?.baseRate || 30}</text>
                </g>
              </svg>
            </div>
          </div>

          <div className="pt-2 text-center text-[11px] text-slate-400">
            {isAr ? 'انقر على أي منطقة لتحديد أسعارها ومدنها' : 'Click on a region to view cities and settings'}
          </div>
        </div>

        {/* ── Column 3: Zone Details Panel (4 cols) ── */}
        <div className="lg:col-span-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'تفاصيل المنطقة' : 'Zone Details'}
              </h3>
              <button
                type="button"
                onClick={() => setShowManageCitiesModal(true)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {isAr ? 'إدارة' : 'Manage'}
              </button>
            </div>

            {/* Zone Selector */}
            <div className="mt-3.5">
              <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: activeZone.color }}
                />
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full bg-transparent font-bold text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {isAr ? r.nameAr : r.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cities in this Zone */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isAr ? `المدن في هذه المنطقة (${activeZone.cityCount})` : `Cities in this zone (${activeZone.cityCount})`}
                </span>
                <button
                  type="button"
                  onClick={() => setShowManageCitiesModal(true)}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {isAr ? 'إدارة المدن' : 'Manage Cities'}
                </button>
              </div>

              {/* City Tag Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeZone.cities.map((city, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    {city}
                  </span>
                ))}
              </div>
            </div>

            {/* Default Shipping Rate Form */}
            <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {isAr ? 'سعر الشحن الأساسي للمنطقة' : 'Zone Base Delivery Fee'}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">
                    {isAr ? 'الرسوم الأساسية (SAR)' : 'Base Rate (SAR)'}
                  </label>
                  <input
                    type="number"
                    value={activeZone.baseRate}
                    onChange={(e) => handleRateChange('baseRate', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">
                    {isAr ? 'رسوم لكل كجم إضافي' : 'Per extra KG (SAR)'}
                  </label>
                  <input
                    type="number"
                    value={activeZone.additionalRate}
                    onChange={(e) => handleRateChange('additionalRate', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Bottom Two Tables (Real Pricing Rules & Free Shipping Rules) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Table 1: Pricing Rules from currentShippingMethods */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'طرق وقواعد التسعير المسجلة' : 'Configured Shipping Methods'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isAr
                    ? 'الأسعار وطرق الحساب المعتمدة في متجرك من قاعدة البيانات.'
                    : 'Real shipping methods and pricing rules configured in the database.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddRuleModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة قاعدة' : 'Add Rule'}</span>
              </button>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs text-start">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2 px-2 text-start font-semibold">{isAr ? 'اسم الطريقة' : 'Method Name'}</th>
                    <th className="py-2 px-2 text-start font-semibold">{isAr ? 'النوع' : 'Type'}</th>
                    <th className="py-2 px-2 text-start font-semibold">{isAr ? 'الناقل' : 'Courier'}</th>
                    <th className="py-2 px-2 text-start font-semibold">{isAr ? 'السعر' : 'Price'}</th>
                    <th className="py-2 px-2 text-start font-semibold">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="py-2 px-2 text-end font-semibold">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {currentShippingMethods.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <Package className="w-8 h-8 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">
                          {isAr ? 'لا توجد طرق تسعير مضافة حالياً' : 'No shipping methods configured yet'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    currentShippingMethods.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-2 font-bold text-blue-600 dark:text-blue-400">
                          {m.name}
                        </td>
                        <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          {m.type.replace('_', ' ').toUpperCase()}
                        </td>
                        <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300">
                          {m.courierCode ? m.courierCode.toUpperCase() : 'All Couriers'}
                        </td>
                        <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-white">
                          {m.baseRate === 0 ? 'Free' : money(m.baseRate)}
                        </td>
                        <td className="py-2.5 px-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              m.isActive
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/50'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {m.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-end">
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(`Delete method ${m.name}?`)) {
                                await deleteShippingMethod(m.id);
                                toast(isAr ? 'تم حذف طريقة الشحن' : 'Shipping method deleted', 'info');
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Table 2: Free Shipping Rules */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'قواعد الشحن المجاني' : 'Free Shipping Rules'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isAr
                    ? 'إعفاء العملاء من رسوم الشحن عند تجاوز الحد الأدنى للطلب.'
                    : 'Waive shipping fees when minimum order value threshold is reached.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddFreeRuleModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة قاعدة' : 'Add Rule'}</span>
              </button>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs text-start">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2 px-2 text-start font-semibold">{isAr ? 'اسم القاعدة' : 'Rule Name'}</th>
                    <th className="py-2 px-2 text-start font-semibold">{isAr ? 'الشرط' : 'Condition'}</th>
                    <th className="py-2 px-2 text-start font-semibold">{isAr ? 'ينطبق على' : 'Applies To'}</th>
                    <th className="py-2 px-2 text-start font-semibold">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {freeRulesList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        <DollarSign className="w-8 h-8 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">
                          {isAr ? 'لا توجد قواعد شحن مجاني مضافة حالياً' : 'No free shipping rules configured yet'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    freeRulesList.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-white">
                          {rule.name}
                        </td>
                        <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300">
                          {rule.condition}
                        </td>
                        <td className="py-2.5 px-2 text-slate-600 dark:text-slate-300">
                          {rule.appliesTo}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50">
                            {rule.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal: Add New Zone ── */}
      {showAddZoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'إضافة مدينة / منطقة شحن جديدة' : 'Add New Shipping Zone'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddZoneModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddZone} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">
                  {isAr ? 'اسم المدينة أو المنطقة *' : 'City or Zone Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al Kharj, Yanbu, Qatif"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">
                  {isAr ? 'المنطقة الإقليمية' : 'Region'}
                </label>
                <select
                  value={activeZone.id}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                >
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nameEn} ({r.nameAr})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-1">
                  {isAr ? 'تكلفة التوصيل الأساسية (SAR) *' : 'Base Rate (SAR) *'}
                </label>
                <input
                  type="number"
                  required
                  value={newZoneBaseRate}
                  onChange={(e) => setNewZoneBaseRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddZoneModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  {isAr ? 'حفظ المنطقة' : 'Save Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Add Pricing Rule ── */}
      {showAddRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'إضافة طريقة تسعير جديدة' : 'Add Shipping Method Rule'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRuleModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddPricingRule} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">
                  {isAr ? 'اسم الطريقة *' : 'Method Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Express Courier Delivery"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">{isAr ? 'النوع' : 'Type'}</label>
                  <select
                    value={newRuleCondition}
                    onChange={(e) => setNewRuleCondition(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                  >
                    <option value="flat_rate">Flat Rate</option>
                    <option value="weight_based">Weight Based</option>
                    <option value="same_day">Same Day Express</option>
                    <option value="zone_based">Zone Based</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">{isAr ? 'الناقل' : 'Carrier'}</label>
                  <select
                    value={newRuleCourier}
                    onChange={(e) => setNewRuleCourier(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold uppercase"
                  >
                    <option value="spl">SPL</option>
                    <option value="aramex">Aramex</option>
                    <option value="smsa">SMSA</option>
                    <option value="dhl">DHL</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">{isAr ? 'السعر (SAR)' : 'Base Rate (SAR)'}</label>
                <input
                  type="number"
                  value={newRulePrice}
                  onChange={(e) => setNewRulePrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddRuleModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  {isAr ? 'حفظ' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Add Free Rule ── */}
      {showAddFreeRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'إضافة قاعدة شحن مجاني' : 'Add Free Shipping Rule'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddFreeRuleModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddFreeRule} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">{isAr ? 'اسم القاعدة' : 'Rule Name'}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Delivery Above SAR 200"
                  value={newFreeName}
                  onChange={(e) => setNewFreeName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">
                  {isAr ? 'الحد الأدنى لقيمة الطلب (SAR)' : 'Minimum Order Threshold (SAR)'}
                </label>
                <input
                  type="number"
                  required
                  value={newFreeThreshold}
                  onChange={(e) => setNewFreeThreshold(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddFreeRuleModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  {isAr ? 'حفظ' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Manage Cities ── */}
      {showManageCitiesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? `إدارة مدن: ${activeZone.nameAr}` : `Manage Cities: ${activeZone.nameEn}`}
              </h3>
              <button
                type="button"
                onClick={() => setShowManageCitiesModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <p className="text-slate-500">
                {isAr
                  ? 'المدن المسجلة لهذه المنطقة في قاعدة البيانات:'
                  : 'Covered delivery cities assigned to this zone:'}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 max-h-48 overflow-y-auto">
                {activeZone.cities.map((c, i) => {
                  const matchingZoneRecord = (currentShipping || []).find(
                    (z) => z.cityName.toLowerCase() === c.toLowerCase()
                  );
                  return (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs font-semibold"
                    >
                      <span>{c}</span>
                      {matchingZoneRecord && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`Delete ${c} from shipping zones?`)) {
                              await deleteShippingCity(matchingZoneRecord.id);
                              toast(`Deleted ${c}`, 'info');
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
              <div className="flex items-center justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowManageCitiesModal(false)}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold cursor-pointer"
                >
                  {isAr ? 'تم' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
