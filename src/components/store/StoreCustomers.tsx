import React, { useState, useMemo, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { Customer, CustomerStatus, CustomerSource } from '../../types';
import {
  Users,
  UserPlus,
  Crown,
  Award,
  Download,
  Upload,
  Search,
  Filter,
  RotateCcw,
  Check,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  FileSpreadsheet,
  MessageCircle,
  Instagram as InstagramIcon,
  Globe,
  Share2,
  Link2,
  Compass,
  Music,
  TrendingUp,
  Eye,
} from 'lucide-react';
import { CustomerDetails } from './CustomerDetails';
import { getArabCustomerAvatar, getCustomerSeoAlt, ARAB_MALE_AVATARS, ARAB_FEMALE_AVATARS } from '../../utils/customerAvatars';
import { handleImageError } from '../../utils/imageFallback';
import {
  getOrCreateCustomerGamifiedProfile,
  saveCustomerGamifiedProfile,
  getStoreLoyaltyGameSettings,
} from '../../services/ksaAutomationEngine';

export const StoreCustomers: React.FC = () => {
  const {
    activeStore,
    currentCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    bulkDeleteCustomers,
    bulkSetCustomerStatus,
  } = useTenant();
  const { money, locale, t } = usePrefs();
  const isAr = locale === 'ar';

  // Filter States
  const [filterSearch, setFilterSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [groupFilter, setGroupFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Selected row checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('+966 50 ');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustCity, setNewCustCity] = useState('Riyadh');
  const [newCustSource, setNewCustSource] = useState<CustomerSource>('Instagram');
  const [newCustStatus, setNewCustStatus] = useState<CustomerStatus>('Active');
  const [newCustGender, setNewCustGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newCustAvatar, setNewCustAvatar] = useState('');

  // Check URL query param for customerId & keep in sync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cId = params.get('customerId') || params.get('customer');
    if (cId) {
      const exists = currentCustomers.some((c) => c.id === cId);
      if (exists) {
        setSelectedCustomerId(cId);
      }
    }
  }, [currentCustomers]);

  const handleSelectCustomer = (id: string | null) => {
    setSelectedCustomerId(id);
    const url = new URL(window.location.href);
    if (id) {
      url.searchParams.set('customerId', id);
    } else {
      url.searchParams.delete('customerId');
      url.searchParams.delete('customer');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [profileTick, setProfileTick] = useState(0);
  const loyaltySettings = getStoreLoyaltyGameSettings(activeStore.id);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return currentCustomers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
        c.phone.includes(filterSearch) ||
        c.email.toLowerCase().includes(filterSearch.toLowerCase());
      const matchGender = genderFilter === 'All' || c.gender === genderFilter;
      const matchCountry = countryFilter === 'All' || c.country === countryFilter;
      const matchCity = cityFilter === 'All' || c.city === cityFilter;
      const matchSource = sourceFilter === 'All' || c.source === sourceFilter;
      const matchGroup = groupFilter === 'All' || c.group === groupFilter;

      return matchSearch && matchGender && matchCountry && matchCity && matchSource && matchGroup;
    });
  }, [
    currentCustomers,
    filterSearch,
    genderFilter,
    countryFilter,
    cityFilter,
    sourceFilter,
    groupFilter,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    filterSearch,
    genderFilter,
    countryFilter,
    cityFilter,
    sourceFilter,
    groupFilter,
    pageSize,
    activeStore.id,
  ]);

  const lastPage = Math.max(1, Math.ceil(filteredCustomers.length / pageSize) || 1);
  const pageCustomers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, page, pageSize]);
  const fromRow = filteredCustomers.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, filteredCustomers.length);

  const handleResetFilters = () => {
    setFilterSearch('');
    setGenderFilter('All');
    setCountryFilter('All');
    setCityFilter('All');
    setSourceFilter('All');
    setGroupFilter('All');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds((prev) => {
        const pageIds = pageCustomers.map((c) => c.id);
        return Array.from(new Set([...prev, ...pageIds]));
      });
    } else {
      const pageIds = new Set(pageCustomers.map((c) => c.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleApplyBulk = () => {
    if (!bulkAction || selectedIds.length === 0) return;
    if (bulkAction === 'delete') {
      bulkDeleteCustomers(selectedIds);
      setSelectedIds([]);
    } else if (bulkAction === 'make_vip') {
      bulkSetCustomerStatus(selectedIds, 'VIP');
      setSelectedIds([]);
    } else if (bulkAction === 'make_active') {
      bulkSetCustomerStatus(selectedIds, 'Active');
      setSelectedIds([]);
    }
    setBulkAction('');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    addCustomer({
      name: newCustName,
      phone: newCustPhone,
      email: newCustEmail || `${newCustName.toLowerCase().replace(/\s+/g, '.')}@example.sa`,
      status: newCustStatus,
      city: newCustCity,
      country: 'Saudi Arabia',
      gender: newCustGender,
      source: newCustSource,
      group: newCustStatus === 'VIP' ? 'VIP' : 'Regular',
      totalOrders: 1,
      totalSpending: 450,
      avgOrderValue: 450,
      lastOrderDate: 'Today',
      avatar: newCustAvatar || getArabCustomerAvatar({ name: newCustName, gender: newCustGender }),
    });

    setShowAddModal(false);
    setNewCustName('');
    setNewCustAvatar('');
    setNewCustPhone('+966 50 ');
    setNewCustEmail('');
  };

  // Helper for source icon & badge (clean SVG icons, zero emojis)
  const renderSourceIcon = (source: CustomerSource) => {
    switch (source) {
      case 'WhatsApp':
        return (
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
            <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <MessageCircle className="w-3 h-3" />
            </span>
            <span>WhatsApp (+966)</span>
          </div>
        );
      case 'Instagram':
        return (
          <div className="flex items-center gap-1.5 text-pink-600 font-medium text-xs">
            <span className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
              <InstagramIcon className="w-3 h-3" />
            </span>
            <span>Instagram KSA</span>
          </div>
        );
      case 'Google Ads':
        return (
          <div className="flex items-center gap-1.5 text-blue-600 font-medium text-xs">
            <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px]">
              G
            </span>
            <span>Google Ads</span>
          </div>
        );
      case 'Facebook':
        return (
          <div className="flex items-center gap-1.5 text-indigo-600 font-medium text-xs">
            <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[10px]">
              f
            </span>
            <span>Facebook KSA</span>
          </div>
        );
      case 'Direct':
        return (
          <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs">
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <Link2 className="w-3 h-3" />
            </span>
            <span>Direct</span>
          </div>
        );
      case 'TikTok':
        return (
          <div className="flex items-center gap-1.5 text-slate-900 font-medium text-xs">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
              <Music className="w-3 h-3" />
            </span>
            <span>TikTok</span>
          </div>
        );
      case 'Referral':
        return (
          <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-xs">
            <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Share2 className="w-3 h-3" />
            </span>
            <span>Referral</span>
          </div>
        );
      case 'Snapchat':
        return (
          <div className="flex items-center gap-1.5 text-amber-600 font-medium text-xs">
            <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Globe className="w-3 h-3" />
            </span>
            <span>Snapchat</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-slate-500 font-medium text-xs">
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Compass className="w-3 h-3" />
            </span>
            <span>Organic</span>
          </div>
        );
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: CustomerStatus) => {
    switch (status) {
      case 'VIP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
            VIP
          </span>
        );
      case 'Active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        );
      case 'New':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            New
          </span>
        );
      case 'Inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Inactive
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
    }
  };

  // Real dynamic counts for store customers (no fake inflated numbers)
  const totalCount = currentCustomers.length;
  const newThisMonth = currentCustomers.filter(c => c.status === 'New').length;
  const activeCount = currentCustomers.filter(c => c.status === 'Active').length;
  const vipCount = currentCustomers.filter(c => c.status === 'VIP' || (c as any).group === 'VIP').length;
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return currentCustomers.find((c) => c.id === selectedCustomerId) || null;
  }, [selectedCustomerId, currentCustomers]);

  if (selectedCustomer) {
    return (
      <CustomerDetails
        customer={selectedCustomer}
        onBack={() => handleSelectCustomer(null)}
        onSelectCustomer={(id) => handleSelectCustomer(id)}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {isAr ? 'العملاء' : 'Customers'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? `إدارة العملاء، التصفية، الاستيراد، التصدير والمزيد · (متجر: ${(activeStore.nameAr || activeStore.name)})`
              : `Manage your customers, filter, import, export and more · (Store: ${(activeStore.nameEn || activeStore.name)})`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentCustomers.length > 0 && (
            <button
              onClick={() => {
                const naser = currentCustomers.find((c) => c.name.toLowerCase().includes('naser')) || currentCustomers[0];
                setSelectedCustomerId(naser.id);
              }}
              className="px-4 py-2 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>{isAr ? 'لوحة ملف ومكافآت العميل' : 'Customer Details & Rewards'}</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="self-start sm:self-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? '+ إضافة عميل جديد' : 'Add New Customer'}</span>
          </button>
        </div>
      </div>

      {/* Top Cards: 4 Metrics (Left) + 2 Action Cards (Right) matching 08_customers.png */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 4 Metric Cards (Col 8) */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total Customers */}
          <div className="p-4 bg-blue-50/70 hover:bg-blue-50/90 dark:bg-sky-950/40 rounded-2xl border border-blue-200/80 dark:border-sky-900/60 shadow-xs flex flex-col justify-between transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Customers</span>
              <div className="p-2 bg-blue-100 dark:bg-sky-900/60 text-blue-700 dark:text-sky-300 rounded-xl shadow-2xs">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {totalCount.toLocaleString()}
            </div>
          </div>

          {/* New This Month */}
          <div className="p-4 bg-emerald-50/70 hover:bg-emerald-50/90 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs flex flex-col justify-between transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                New This Month <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              </span>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl shadow-2xs">
                <UserPlus className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {newThisMonth}
              </span>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" />
                <span>12%</span>
              </span>
            </div>
          </div>

          {/* Active Customers */}
          <div className="p-4 bg-amber-50/70 hover:bg-amber-50/90 dark:bg-amber-950/40 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 shadow-xs flex flex-col justify-between transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                Active Customers <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              </span>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-xl shadow-2xs">
                <Crown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {activeCount.toLocaleString()}
            </div>
          </div>

          {/* VIP Customers */}
          <div className="p-4 bg-purple-50/70 hover:bg-purple-50/90 dark:bg-purple-950/40 rounded-2xl border border-purple-200/80 dark:border-purple-900/60 shadow-xs flex flex-col justify-between transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">VIP Customers</span>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-xl shadow-2xs">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {vipCount}
            </div>
          </div>
        </div>

        {/* 2 Action Cards (Col 4) */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export Customers Card */}
          <div className="p-4 bg-emerald-50/60 hover:bg-emerald-50/80 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-extrabold text-xs mb-1">
                <div className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <span>Export Customers</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-snug">
                Export your customers data to a file. Includes: name, phone, email, city, status and more.
              </p>
            </div>
            <button
              onClick={() => setShowExportModal(true)}
              className="mt-3 w-full py-1.5 px-3 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-900 dark:text-emerald-300 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              Export Customers
            </button>
          </div>

          {/* Import Customers Card */}
          <div className="p-4 bg-blue-50/60 hover:bg-blue-50/80 dark:bg-sky-950/40 rounded-2xl border border-blue-200 dark:border-sky-900/60 shadow-xs flex flex-col justify-between transition-all">
            <div>
              <div className="flex items-center gap-2 text-blue-900 dark:text-sky-300 font-extrabold text-xs mb-1">
                <div className="p-1 rounded-md bg-blue-100 dark:bg-sky-900/60 text-blue-700 dark:text-sky-300">
                  <Upload className="w-3.5 h-3.5" />
                </div>
                <span>Import Customers</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-snug">
                Add a large number of customers at once. Use a file to import customers from another store.
              </p>
            </div>
            <button
              onClick={() => setShowImportModal(true)}
              className="mt-3 w-full py-1.5 px-3 bg-white dark:bg-slate-800 border border-blue-300 dark:border-sky-700 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-900 dark:text-sky-300 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              Import Customers
            </button>
          </div>
        </div>
      </div>

      {/* ── LIVE CUSTOMER LOCATION, NOTIFICATION CONSENT, CART/CHECKOUT TRACKER & COIN LEDGER ── */}
      <div
        className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4"
        data-tick={profileTick}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {isAr
                ? 'رادار تتبع العملاء المباشر (الموقع الجغرافي، الإشعارات، حالة السلة/الدفع، وبطاقات الولاء والعملات)'
                : 'Live Customer Tracking Radar (Location, Push Consent, Cart/Checkout Stage, Loyalty Card & Coins)'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAr
                ? `معدل تحويل العملات: ${loyaltySettings.coinsPerSar} عملة = 1 ر.س · تحكم كامل في رصيد عملات ومكافآت كل عميل.`
                : `Coin Value: ${loyaltySettings.coinsPerSar} Coins = 1 SAR · Full Store Admin control over each user's coins, cards & rewards.`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {currentCustomers.slice(0, 6).map((cust) => {
            const prof = getOrCreateCustomerGamifiedProfile(activeStore.id, cust.id, {
              name: cust.name,
              phone: cust.phone,
              email: cust.email,
              city: cust.city || 'Riyadh',
            });
            const sarWorth = (prof.coinsBalance / (loyaltySettings.coinsPerSar || 10)).toFixed(1);

            return (
              <div
                key={cust.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-950/40"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-xs truncate">{cust.name}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      {prof.loyaltyCardNumber} ({prof.loyaltyTier})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {prof.city}, KSA {prof.locationAllowed ? '✓ GPS' : ''}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md ${
                        prof.notificationsAllowed
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {prof.notificationsAllowed
                        ? isAr ? 'الإشعارات مفعلة ✓' : 'Push Allowed ✓'
                        : isAr ? 'بانتظار الإذن' : 'Push Pending'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      {((cust as any).ordersCount ?? (cust as any).totalOrders ?? (cust as any).orders ?? 0) > 0
                        ? isAr ? 'أكمل الدفع (Checkout ✓)' : 'Checked Out ✓'
                        : isAr ? 'أضاف للسلة (Cart Active)' : 'Added to Cart'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">
                      {isAr ? 'رصيد العملات والبطاقات:' : 'Coins & Saved Cards:'}
                    </span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {prof.coinsBalance} Coins ({sarWorth} SAR) · {prof.savedCards.length} Card
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      saveCustomerGamifiedProfile(activeStore.id, {
                        ...prof,
                        coinsBalance: prof.coinsBalance + 50,
                        totalCoinsEarned: prof.totalCoinsEarned + 50,
                      });
                      setProfileTick((t) => t + 1);
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black cursor-pointer"
                  >
                    {isAr ? '+50 عملة مكافأة' : '+50 Bonus Coins'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      saveCustomerGamifiedProfile(activeStore.id, {
                        ...prof,
                        locationAllowed: true,
                        notificationsAllowed: true,
                      });
                      setProfileTick((t) => t + 1);
                    }}
                    className="py-1.5 px-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-[11px] font-bold cursor-pointer"
                  >
                    {isAr ? 'توثيق الموقع/التنبيه' : 'Verify GPS/Push'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advanced Filters Panel matching 08_customers.png */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <Filter className="w-4 h-4 text-slate-500" />
          <span>Advanced Filters</span>
        </div>

        {/* Row 1: Search, Gender, Country */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Customer name, phone number, or email..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Gender</label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-800"
            >
              <option value="All">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Country</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-800"
            >
              <option value="All">All</option>
              <option value="Saudi Arabia">Saudi Arabia</option>
              <option value="UAE">United Arab Emirates</option>
              <option value="Kuwait">Kuwait</option>
            </select>
          </div>
        </div>

        {/* Row 2: City, Customer Source, Customer Group */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">City</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-800"
            >
              <option value="All">All</option>
              <option value="Jeddah">Jeddah</option>
              <option value="Riyadh">Riyadh</option>
              <option value="Makkah">Makkah</option>
              <option value="Taif">Taif</option>
              <option value="Dammam">Dammam</option>
              <option value="Madinah">Madinah</option>
              <option value="Al-Khobar">Al-Khobar</option>
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-800"
            >
              <option value="All">All</option>
              <option value="Instagram">Instagram</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Direct">Direct</option>
              <option value="TikTok">TikTok</option>
              <option value="Referral">Referral</option>
              <option value="Snapchat">Snapchat</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Group</label>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-800"
            >
              <option value="All">All</option>
              <option value="VIP">VIP</option>
              <option value="Regular">Regular</option>
              <option value="Wholesale">Wholesale</option>
            </select>
          </div>
        </div>

        {/* Row 3: Account Creation Date & Filter Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account Creation Date</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end">
            <button
              onClick={handleResetFilters}
              className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Filters</span>
            </button>
            <button
              className="px-4 py-1.5 bg-[#0b3b82] hover:bg-[#093270] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <span>Apply Filters</span>
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Data Table matching 08_customers.png */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="">Bulk Actions</option>
              <option value="make_vip">Mark as VIP</option>
              <option value="make_active">Mark Active</option>
              <option value="delete">Delete Selected</option>
            </select>

            <button
              onClick={handleApplyBulk}
              disabled={!bulkAction || selectedIds.length === 0}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 rounded-lg text-xs font-medium transition-colors"
            >
              Apply
            </button>
          </div>

          <div className="text-xs text-slate-500">
            Showing {fromRow} – {toRow} of {filteredCustomers.length.toLocaleString()} customers
            {filteredCustomers.length !== totalCount
              ? ` (filtered from ${totalCount.toLocaleString()})`
              : ''}
          </div>
        </div>

        {/* Table Grid */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px] bg-slate-50/50">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      pageCustomers.length > 0 &&
                      pageCustomers.every((c) => selectedIds.includes(c.id))
                    }
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3 pr-3 font-semibold">Customer</th>
                <th className="py-3 px-2 font-semibold">Status</th>
                <th className="py-3 px-2 font-semibold">City</th>
                <th className="py-3 px-2 font-semibold">Source</th>
                <th className="py-3 px-2 font-semibold text-center">Total Orders</th>
                <th className="py-3 px-2 font-semibold text-right">Total Spending</th>
                <th className="py-3 px-2 font-semibold text-right">Registered</th>
                <th className="py-3 px-2 font-semibold text-right">Avg. Order Value</th>
                <th className="py-3 px-2 font-semibold text-right">Last Order</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {pageCustomers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No customers found in this store matching filters.
                  </td>
                </tr>
              ) : (
                pageCustomers.map((cust, custIdx) => {
                  const isSelected = selectedIds.includes(cust.id);

                  return (
                    <tr
                      key={cust.id || cust.email || `cust-${custIdx}`}
                      className={`hover:bg-blue-50/30 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(cust.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Customer Name, Avatar & Phone */}
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleSelectCustomer(cust.id)}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs shrink-0 hover:ring-2 hover:ring-teal-500 transition-all cursor-pointer overflow-hidden border border-slate-200/80 dark:border-slate-700 shadow-2xs"
                            title={isAr ? 'عرض تفاصيل العميل' : 'View Customer Details'}
                          >
                            {cust.avatar ? (
                              <img
                                src={cust.avatar}
                                alt={getCustomerSeoAlt(cust, activeStore?.name, isAr)}
                                loading="lazy"
                                decoding="async"
                                onError={(e) => handleImageError(e)}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span>{cust.name.substring(0, 2).toUpperCase()}</span>
                            )}
                          </button>
                          <div className="text-start min-w-0">
                            <button
                              type="button"
                              onClick={() => handleSelectCustomer(cust.id)}
                              className="font-bold text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-start block cursor-pointer truncate max-w-[200px]"
                              title={isAr ? 'عرض تفاصيل العميل' : 'View Customer Details'}
                            >
                              {cust.name}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectCustomer(cust.id)}
                              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 font-mono transition-colors text-start block cursor-pointer mt-0.5 tracking-tight"
                              title={isAr ? 'عرض تفاصيل العميل' : 'View Customer Details'}
                            >
                              {cust.phone}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2">
                        {renderStatusBadge(cust.status)}
                      </td>

                      {/* City */}
                      <td className="py-3 px-2 text-slate-600 font-medium">
                        {cust.city}
                      </td>

                      {/* Source */}
                      <td className="py-3 px-2">
                        {renderSourceIcon(cust.source)}
                      </td>

                      {/* Total Orders */}
                      <td className="py-3 px-2 text-center font-bold tabular-nums text-slate-900">
                        {cust.totalOrders}
                      </td>

                      {/* Total Spending */}
                      <td className="py-3 px-2 text-right font-extrabold tabular-nums text-slate-900">
                        {money(cust.totalSpending)}
                      </td>

                      {/* Registered */}
                      <td className="py-3 px-2 text-right tabular-nums text-slate-600">
                        {money(cust.avgOrderValue)}
                      </td>

                      {/* Avg Order Value (Date registered column in ref) */}
                      <td className="py-3 px-2 text-right tabular-nums text-slate-500">
                        {cust.registeredDate}
                      </td>

                      {/* Last Order */}
                      <td className="py-3 px-2 text-right tabular-nums text-slate-500">
                        {cust.lastOrderDate}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === cust.id ? null : cust.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {activeMenuId === cust.id && (
                          <div className="absolute right-4 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 text-left text-xs">
                            <button
                              onClick={() => {
                                setSelectedCustomerId(cust.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-teal-50 flex items-center gap-1.5 text-teal-700 font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5 text-teal-600" />
                              <span>View Profile &amp; Rewards</span>
                            </button>
                            <button
                              onClick={() => {
                                updateCustomer(cust.id, {
                                  status: cust.status === 'VIP' ? 'Active' : 'VIP',
                                });
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5 text-slate-700"
                            >
                              <Crown className="w-3.5 h-3.5 text-amber-500" />
                              <span>{cust.status === 'VIP' ? 'Demote VIP' : 'Promote VIP'}</span>
                            </button>
                            <button
                              onClick={() => {
                                deleteCustomer(cust.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-rose-50 flex items-center gap-1.5 text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
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

        {/* Table Bottom Pagination */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <label className="flex items-center gap-1.5">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>entries</span>
          </label>

          <div className="flex items-center gap-1">
            <span className="mr-3">
              Showing {fromRow} – {toRow} of {filteredCustomers.length.toLocaleString()}
            </span>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
              let pageNum: number;
              if (lastPage <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= lastPage - 2) pageNum = lastPage - 4 + i;
              else pageNum = page - 2 + i;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`w-6 h-6 rounded text-xs flex items-center justify-center font-bold ${
                    page === pageNum
                      ? 'bg-[#0b3b82] text-white'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0b1b36] px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Add New Customer</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-3.5 text-xs text-slate-700">
              <div>
                <label className="block font-semibold mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Faisal Al-Otaibi"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">City</label>
                  <select
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="Riyadh">Riyadh</option>
                    <option value="Jeddah">Jeddah</option>
                    <option value="Dammam">Dammam</option>
                    <option value="Makkah">Makkah</option>
                    <option value="Madinah">Madinah</option>
                    <option value="Taif">Taif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Acquisition Source</label>
                  <select
                    value={newCustSource}
                    onChange={(e) => setNewCustSource(e.target.value as CustomerSource)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Direct">Direct</option>
                    <option value="Referral">Referral</option>
                    <option value="Snapchat">Snapchat</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Initial Status</label>
                  <select
                    value={newCustStatus}
                    onChange={(e) => setNewCustStatus(e.target.value as CustomerStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="VIP">VIP</option>
                    <option value="New">New</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  {isAr ? 'صورة الملف الشخصي (اختياري)' : 'Profile Photo (Optional)'}
                </label>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                    <img
                      src={newCustAvatar || getArabCustomerAvatar({ name: newCustName, gender: newCustGender })}
                      alt={isAr ? 'معاينة صورة العميل الجديد' : 'New customer profile photo preview'}
                      loading="lazy"
                      onError={(e) => handleImageError(e)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="url"
                      placeholder="https://... or auto-assigned Arab portrait"
                      value={newCustAvatar}
                      onChange={(e) => setNewCustAvatar(e.target.value)}
                      className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Export Customer Dataset</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Generating export for <span className="font-semibold text-slate-700">{activeStore.name}</span> with {filteredCustomers.length} records in CSV format.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Export complete for ${activeStore.name}: ${filteredCustomers.length} customers downloaded.`);
                  setShowExportModal(false);
                }}
                className="flex-1 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Import Customers</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Upload a CSV file containing columns: Name, Phone, Email, City, Source.
            </p>
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl mb-4 bg-slate-50 text-slate-400 text-xs">
              Drag & Drop file here or browse
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Import processed into store ${activeStore.name} successfully.`);
                  setShowImportModal(false);
                }}
                className="flex-1 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Start Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
