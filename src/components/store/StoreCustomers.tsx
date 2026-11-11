import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  Plus,
  Trash2,
  X,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Eye,
  Star,
  Heart,
  ShoppingBag,
  Gem,
  Tags,
  Maximize2,
  LucideIcon,
} from 'lucide-react';
import { CustomerDetails } from './CustomerDetails';
import { getArabCustomerAvatar, getCustomerSeoAlt } from '../../utils/customerAvatars';
import { handleImageError } from '../../utils/imageFallback';
import { parseOrderDate, periodCountGrowth } from '../../utils/liveSeries';
import { ORDER_SOURCE_OPTIONS, OrderSourceIcon, WhatsAppBrandIcon } from '../common/BrandIcons';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';
import { FloatingPopover } from '../common/FloatingPopover';
import { WindowedPagination } from '../common/WindowedPagination';
import { downloadCsv } from '../../utils/exportSpreadsheet';
import { CUSTOMER_GENDER_OPTIONS, normalizeSaudiCityId, saudiCitiesEquivalent } from '../../data/saudiCities';
import { useSaudiCityOptions } from '../../hooks/useSaudiCityOptions';
import { SaudiCitySelect } from '../common/SaudiCitySelect';
import { PortalSelect } from '../common/PortalSelect';
import { DateCalendarField } from '../common/DateCalendarField';
import { AddCustomerModal } from './AddCustomerModal';
import { getCustomerDisplayName, getLocalizedCity } from '../../utils/storeLocalization';

type CustomerGroupDef = { id: string; name: string; icon: string };

const GROUP_ICON_OPTIONS: { key: string; Icon: LucideIcon }[] = [
  { key: 'Users', Icon: Users },
  { key: 'Crown', Icon: Crown },
  { key: 'Award', Icon: Award },
  { key: 'Star', Icon: Star },
  { key: 'Heart', Icon: Heart },
  { key: 'ShoppingBag', Icon: ShoppingBag },
  { key: 'Gem', Icon: Gem },
  { key: 'Tags', Icon: Tags },
];

function customerGroupsStorageKey(storeId: string) {
  return `unityteck_customer_groups_${storeId}`;
}

function renderGroupIcon(iconKey: string, className = 'w-4 h-4') {
  const opt = GROUP_ICON_OPTIONS.find((o) => o.key === iconKey);
  const Icon = opt?.Icon ?? Users;
  return <Icon className={className} />;
}

function downloadCustomersCsv(customers: Customer[], storeName: string) {
  const headers = [
    'name',
    'phone',
    'email',
    'city',
    'country',
    'status',
    'gender',
    'source',
    'group',
    'registeredDate',
    'totalOrders',
    'totalSpending',
    'avgOrderValue',
    'lastOrderDate',
  ];
  const rows = customers.map((c) => [
    String(c.name ?? ''),
    String(c.phone ?? ''),
    String(c.email ?? ''),
    String(c.city ?? ''),
    String(c.country ?? ''),
    String(c.status ?? ''),
    String(c.gender ?? ''),
    String(c.source ?? ''),
    String(c.group ?? ''),
    String(c.registeredDate ?? ''),
    String(c.totalOrders ?? ''),
    String(c.totalSpending ?? ''),
    String(c.avgOrderValue ?? ''),
    String(c.lastOrderDate ?? ''),
  ]);
  const safeName = storeName.replace(/[^\w\-]+/g, '_').slice(0, 40);
  downloadCsv(`customers_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`, [headers, ...rows]);
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

type StoreCustomersProps = {
  onNavigateTab?: (tab: string) => void;
};

export const StoreCustomers: React.FC<StoreCustomersProps> = ({ onNavigateTab }) => {
  const {
    activeStore,
    currentCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    bulkDeleteCustomers,
    bulkSetCustomerStatus,
  } = useTenant();
  const { money, locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';
  const {
    cities: saudiCities,
    addCity: addSaudiCity,
    removeCity: removeSaudiCity,
  } = useSaudiCityOptions(activeStore.id);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const headerMenuBtnRef = useRef<HTMLButtonElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const [customGroups, setCustomGroups] = useState<CustomerGroupDef[]>([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupsFullView, setShowGroupsFullView] = useState(false);
  const [groupsFullViewTab, setGroupsFullViewTab] = useState<'new' | 'groups' | 'customers'>('groups');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('Users');

  const openGroupsFullView = (tab: 'new' | 'groups' | 'customers' = 'groups') => {
    setGroupsFullViewTab(tab);
    setShowCreateGroupModal(false);
    setShowGroupsFullView(true);
  };

  const [assignGroupCustomerId, setAssignGroupCustomerId] = useState<string | null>(null);
  const [assignGroupValue, setAssignGroupValue] = useState('');
  const [showBulkGroupModal, setShowBulkGroupModal] = useState(false);
  const [bulkGroupValue, setBulkGroupValue] = useState('');

  const loadCustomGroups = useCallback(() => {
    try {
      const raw = localStorage.getItem(customerGroupsStorageKey(activeStore.id));
      if (!raw) {
        setCustomGroups([]);
        return;
      }
      const parsed = JSON.parse(raw) as CustomerGroupDef[];
      setCustomGroups(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCustomGroups([]);
    }
  }, [activeStore.id]);

  useEffect(() => {
    loadCustomGroups();
  }, [loadCustomGroups]);

  const groupFilterOptions = useMemo(() => {
    const names = new Set<string>();
    customGroups.forEach((g) => names.add(g.name));
    currentCustomers.forEach((c) => {
      if (c.group?.trim()) names.add(c.group.trim());
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [customGroups, currentCustomers]);

  const persistCustomGroups = (groups: CustomerGroupDef[]) => {
    setCustomGroups(groups);
    try {
      localStorage.setItem(customerGroupsStorageKey(activeStore.id), JSON.stringify(groups));
    } catch {
      /* ignore quota errors */
    }
  };

  const handleCreateGroupSubmit = (e: React.FormEvent): boolean => {
    e.preventDefault();
    const name = newGroupName.trim();
    if (!name) return false;
    if (customGroups.some((g) => g.name.toLowerCase() === name.toLowerCase())) {
      toast(isAr ? 'المجموعة موجودة مسبقاً' : 'Group already exists', 'warning');
      return false;
    }
    const next: CustomerGroupDef = {
      id: `grp-${Date.now()}`,
      name,
      icon: newGroupIcon,
    };
    persistCustomGroups([...customGroups, next]);
    setNewGroupName('');
    setNewGroupIcon('Users');
    setShowCreateGroupModal(false);
    toast(isAr ? 'تم إنشاء المجموعة' : 'Group created', 'success');
    return true;
  };

  const handleDeleteCustomGroup = (groupId: string) => {
    const target = customGroups.find((g) => g.id === groupId);
    if (!target) return;
    persistCustomGroups(customGroups.filter((g) => g.id !== groupId));
    toast(isAr ? 'تم حذف المجموعة' : 'Group deleted', 'success');
  };

  const groupCustomerCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of currentCustomers) {
      const key = (c.group || '').trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [currentCustomers]);

  const handleAssignGroupSubmit = () => {
    if (!assignGroupValue.trim()) return;
    if (assignGroupCustomerId) {
      updateCustomer(assignGroupCustomerId, { group: assignGroupValue });
      toast(isAr ? 'تم تحديث المجموعة' : 'Group updated', 'success');
    }
    setAssignGroupCustomerId(null);
    setAssignGroupValue('');
  };

  const handleBulkAssignGroupSubmit = () => {
    if (!bulkGroupValue.trim() || selectedIds.length === 0) return;
    selectedIds.forEach((id) => updateCustomer(id, { group: bulkGroupValue }));
    toast(
      isAr
        ? `تم تعيين ${selectedIds.length} عميل للمجموعة`
        : `Assigned ${selectedIds.length} customer(s) to group`,
      'success',
    );
    setSelectedIds([]);
    setBulkGroupValue('');
    setShowBulkGroupModal(false);
    setBulkAction('');
  };

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
  const actionMenuBtnRef = useRef<HTMLButtonElement>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const builtinGroups = useMemo(
    () => [
      { id: 'Regular', nameEn: 'Regular', nameAr: 'عادي' },
      { id: 'VIP', nameEn: 'VIP', nameAr: 'عميل مميز' },
      { id: 'Wholesale', nameEn: 'Wholesale', nameAr: 'جملة' },
    ],
    [],
  );

  const addCustomerGroupOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: Array<{ value: string; label: string }> = [];
    for (const g of builtinGroups) {
      seen.add(g.id.toLowerCase());
      opts.push({ value: g.id, label: isAr ? g.nameAr : g.nameEn });
    }
    for (const g of customGroups) {
      const key = g.name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      opts.push({ value: g.name, label: g.name });
    }
    return opts;
  }, [builtinGroups, customGroups, isAr]);

  const acquisitionSourceFilterOptions = useMemo(
    () => [
      { value: 'All', label: isAr ? 'الكل' : 'All' },
      ...ORDER_SOURCE_OPTIONS.map((o) => ({
        value: o.value,
        label: isAr ? o.labelAr : o.labelEn,
        icon: <OrderSourceIcon source={o.value} className="w-3.5 h-3.5" />,
      })),
    ],
    [isAr],
  );

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

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return currentCustomers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
        c.phone.includes(filterSearch) ||
        c.email.toLowerCase().includes(filterSearch.toLowerCase());
      const matchGender = genderFilter === 'All' || c.gender === genderFilter;
      const matchCountry = countryFilter === 'All' || c.country === countryFilter;
      const matchCity =
        cityFilter === 'All' || saudiCitiesEquivalent(c.city, cityFilter, saudiCities);
      const matchSource = sourceFilter === 'All' || c.source === sourceFilter;
      const matchGroup = groupFilter === 'All' || c.group === groupFilter;

      let matchDate = true;
      if (fromDate || toDate) {
        const d = parseOrderDate(c.registeredDate);
        if (!d) {
          matchDate = false;
        } else {
          if (fromDate) {
            const from = new Date(fromDate);
            from.setHours(0, 0, 0, 0);
            if (d < from) matchDate = false;
          }
          if (matchDate && toDate) {
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            if (d > to) matchDate = false;
          }
        }
      }

      return matchSearch && matchGender && matchCountry && matchCity && matchSource && matchGroup && matchDate;
    });
  }, [
    currentCustomers,
    filterSearch,
    genderFilter,
    countryFilter,
    cityFilter,
    sourceFilter,
    groupFilter,
    fromDate,
    toDate,
    saudiCities,
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
    fromDate,
    toDate,
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
      setBulkAction('');
    } else if (bulkAction === 'assign_group') {
      setShowBulkGroupModal(true);
    } else if (bulkAction === 'make_active') {
      bulkSetCustomerStatus(selectedIds, 'Active');
      setSelectedIds([]);
      setBulkAction('');
    }
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        toast(isAr ? 'الملف فارغ أو غير صالح' : 'File is empty or invalid', 'error');
        return;
      }
      const headerCells = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ''));
      const nameIdx = headerCells.findIndex((h) => h === 'name' || h === 'fullname' || h === 'customername');
      const phoneIdx = headerCells.findIndex((h) => h === 'phone' || h === 'phonenumber' || h === 'mobile');
      const emailIdx = headerCells.findIndex((h) => h === 'email');
      const cityIdx = headerCells.findIndex((h) => h === 'city');
      const sourceIdx = headerCells.findIndex((h) => h === 'source' || h === 'acquisitionsource');
      const groupIdx = headerCells.findIndex((h) => h === 'group' || h === 'customergroup');

      let imported = 0;
      let skipped = 0;
      for (let i = 1; i < lines.length; i++) {
        const cells = parseCsvLine(lines[i]);
        const name =
          nameIdx >= 0 ? cells[nameIdx]?.trim() : cells[0]?.trim();
        const phone =
          phoneIdx >= 0 ? cells[phoneIdx]?.trim() : cells[1]?.trim();
        const email = emailIdx >= 0 ? cells[emailIdx]?.trim() : '';
        // API requires real email — never invent @import.local
        if (!name || !phone || !email) {
          skipped += 1;
          continue;
        }
        const cityRaw = cityIdx >= 0 ? cells[cityIdx]?.trim() : '';
        const city = cityRaw
          ? normalizeSaudiCityId(cityRaw, saudiCities) || cityRaw
          : isAr
            ? 'غير محدد'
            : 'Unspecified';
        const sourceRaw = sourceIdx >= 0 ? cells[sourceIdx]?.trim() : 'Direct';
        const group = groupIdx >= 0 ? cells[groupIdx]?.trim() : 'Regular';
        const source = (ORDER_SOURCE_OPTIONS.some((o) => o.value === sourceRaw)
          ? sourceRaw
          : 'Direct') as CustomerSource;

        void Promise.resolve(
          addCustomer({
            name,
            phone,
            email,
            status: 'New',
            city,
            country: 'Saudi Arabia',
            gender: 'Other',
            source,
            group: group || 'Regular',
            totalOrders: 0,
            totalSpending: 0,
            avgOrderValue: 0,
            lastOrderDate: '—',
            avatar: getArabCustomerAvatar({ name, gender: 'Other' }),
          }),
        );
        imported++;
      }
      if (imported === 0) {
        toast(
          isAr
            ? 'لم يُستورد أي عميل (يتطلب الاسم والهاتف والبريد الإلكتروني)'
            : 'No customers imported (name + phone + email required)',
          'warning',
        );
      } else {
        toast(
          isAr
            ? `تم استيراد ${imported} عميل${skipped ? ` · تخطي ${skipped}` : ''}`
            : `Imported ${imported} customer(s)${skipped ? ` · skipped ${skipped}` : ''}`,
          'success',
        );
        setShowImportModal(false);
      }
    };
    reader.onerror = () => {
      toast(isAr ? 'تعذر قراءة الملف' : 'Could not read file', 'error');
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Real brand icons + locale-consistent labels (no EN/AR mix)
  const renderSourceIcon = (source: CustomerSource) => {
    const opt = ORDER_SOURCE_OPTIONS.find((o) => o.value === source);
    const label = opt
      ? locale === 'ar'
        ? opt.labelAr
        : opt.labelEn
      : source || (locale === 'ar' ? 'أخرى' : 'Other');
    const isWa = source === 'WhatsApp';
    return (
      <div className="flex items-center gap-1.5 font-medium text-xs text-slate-700 dark:text-slate-200">
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center ${
            isWa ? 'bg-[#25D366]/15 text-[#25D366]' : 'bg-slate-100 dark:bg-slate-800'
          }`}
        >
          {isWa ? (
            <WhatsAppBrandIcon className="w-3 h-3" title="WhatsApp" />
          ) : (
            <OrderSourceIcon source={source || 'Direct'} className="w-3 h-3" />
          )}
        </span>
        <span>{label}</span>
      </div>
    );
  };

  // Status Badge Helper — localized
  const renderStatusBadge = (status: CustomerStatus) => {
    const isAr = locale === 'ar';
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
            {isAr ? 'نشط' : 'Active'}
          </span>
        );
      case 'New':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {isAr ? 'جديد' : 'New'}
          </span>
        );
      case 'Inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {isAr ? 'غير نشط' : 'Inactive'}
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            {isAr ? 'ملغي' : 'Cancelled'}
          </span>
        );
    }
  };

  // Real dynamic counts for store customers (no fake inflated numbers)
  const totalCount = currentCustomers.length;
  const newThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return currentCustomers.filter((c) => {
      const d = parseOrderDate(c.registeredDate);
      if (d) return d >= monthStart;
      return c.status === 'New';
    }).length;
  }, [currentCustomers]);
  const newCustomersGrowth = useMemo(
    () => periodCountGrowth(currentCustomers, (c) => parseOrderDate(c.registeredDate)),
    [currentCustomers],
  );
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
    <div className="u-page p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto w-full min-w-0" style={{ color: 'var(--text)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
            {isAr ? 'العملاء' : 'Customers'}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'إدارة العملاء، التصفية، الاستيراد، التصدير والمزيد'
              : 'Manage your customers, filter, import, export and more'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateTab && (
            <>
              <button
                type="button"
                onClick={() => onNavigateTab('loyalty')}
                className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-90 border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                <Award className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>{isAr ? 'نقاط الولاء' : 'Loyalty Points'}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('cashback')}
                className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-90 border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                <Gem className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>{isAr ? 'الكاش باك' : 'Cashback'}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowCreateGroupModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-90 border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <Tags className="w-4 h-4" />
            <span>{isAr ? 'إنشاء مجموعة' : 'Create Group'}</span>
          </button>

          <button
            type="button"
            onClick={() => openGroupsFullView('groups')}
            className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-90 border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <Maximize2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span>{isAr ? 'العرض الكامل' : 'Full View'}</span>
          </button>

          <div>
            <button
              type="button"
              ref={headerMenuBtnRef}
              onClick={() => setShowHeaderMenu((v) => !v)}
              className="p-2 rounded-xl transition-opacity hover:opacity-90 border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              aria-label={isAr ? 'المزيد' : 'More options'}
              aria-expanded={showHeaderMenu}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <FloatingPopover
              open={showHeaderMenu}
              anchorRef={headerMenuBtnRef}
              onClose={() => setShowHeaderMenu(false)}
              width={192}
              align="end"
              estimatedHeight={200}
              className="rounded-xl shadow-xl py-1 text-xs"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowExportModal(true);
                  setShowHeaderMenu(false);
                }}
                className="w-full px-3 py-2 flex items-center gap-2 font-semibold text-start hover:opacity-80"
                style={{ color: 'var(--text)' }}
              >
                <Download className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>{isAr ? 'تصدير العملاء' : 'Export Customers'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(true);
                  setShowHeaderMenu(false);
                }}
                className="w-full px-3 py-2 flex items-center gap-2 font-semibold text-start hover:opacity-80"
                style={{ color: 'var(--text)' }}
              >
                <Upload className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>{isAr ? 'استيراد العملاء' : 'Import Customers'}</span>
              </button>
            </FloatingPopover>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="self-start sm:self-auto px-4 py-2 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer unity-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة عميل جديد' : 'Add New Customer'}</span>
          </button>
        </div>
      </div>

      {/* Metric cards — full width */}
      <div className="u-equal-sections grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total Customers */}
          <div
            className="p-4 rounded-2xl border shadow-xs flex flex-col justify-between transition-all"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                {isAr ? 'إجمالي العملاء' : 'Total Customers'}
              </span>
              <div
                className="p-2 rounded-xl shadow-2xs"
                style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}
              >
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums" style={{ color: 'var(--text)' }}>
              {totalCount.toLocaleString()}
            </div>
          </div>

          {/* New This Month */}
          <div
            className="p-4 rounded-2xl border shadow-xs flex flex-col justify-between transition-all"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                {isAr ? 'جدد هذا الشهر' : 'New This Month'}{' '}
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--accent)' }} />
              </span>
              <div
                className="p-2 rounded-xl shadow-2xs"
                style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}
              >
                <UserPlus className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black tabular-nums" style={{ color: 'var(--text)' }}>
                {newThisMonth}
              </span>
              {newCustomersGrowth.hasData ? (
                <span className="text-xs font-bold flex items-center" style={{ color: 'var(--muted)' }}>
                  {newCustomersGrowth.pct >= 0
                    ? <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" />
                    : <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" />}
                  <span>{Math.abs(newCustomersGrowth.pct)}%</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Active Customers */}
          <div
            className="p-4 rounded-2xl border shadow-xs flex flex-col justify-between transition-all"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                {isAr ? 'العملاء النشطون' : 'Active Customers'}{' '}
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--accent)' }} />
              </span>
              <div
                className="p-2 rounded-xl shadow-2xs"
                style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}
              >
                <Crown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums" style={{ color: 'var(--text)' }}>
              {activeCount.toLocaleString()}
            </div>
          </div>

          {/* VIP Customers */}
          <div
            className="p-4 rounded-2xl border shadow-xs flex flex-col justify-between transition-all"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                {isAr ? 'كبار العملاء' : 'VIP Customers'}
              </span>
              <div
                className="p-2 rounded-xl shadow-2xs"
                style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}
              >
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums" style={{ color: 'var(--text)' }}>
              {vipCount}
            </div>
          </div>
      </div>

      {/* Search + filter toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            placeholder={
              isAr ? 'اسم العميل أو الهاتف أو البريد...' : 'Customer name, phone, or email...'
            }
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className={`w-full py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-colors ${
            filtersOpen
              ? 'bg-[#0b3b82] text-white border-[#0b3b82]'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>{isAr ? 'تصفية' : 'Filter'}</span>
        </button>
      </div>

      {filtersOpen && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isAr ? 'الجنس' : 'Gender'}
              </label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
              >
                <option value="All">{isAr ? 'الكل' : 'All'}</option>
                {CUSTOMER_GENDER_OPTIONS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {isAr ? g.nameAr : g.nameEn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isAr ? 'الدولة' : 'Country'}
              </label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
              >
                <option value="All">{isAr ? 'الكل' : 'All'}</option>
                <option value="Saudi Arabia">{isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia'}</option>
                <option value="UAE">{isAr ? 'الإمارات' : 'United Arab Emirates'}</option>
                <option value="Kuwait">{isAr ? 'الكويت' : 'Kuwait'}</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isAr ? 'المدينة' : 'City'}
              </label>
              <SaudiCitySelect
                value={cityFilter}
                onChange={setCityFilter}
                cities={saudiCities}
                isAr={isAr}
                includeAllOption
                preferBelow
                manageEnabled
                onAddCity={(nameEn, nameAr) => {
                  const ok = addSaudiCity({ nameEn, nameAr });
                  toast(
                    ok
                      ? isAr
                        ? 'تمت إضافة المدينة'
                        : 'City added'
                      : isAr
                        ? 'المدينة موجودة مسبقاً'
                        : 'City already exists',
                    ok ? 'success' : 'warning',
                  );
                  return ok;
                }}
                onRemoveCity={(id) => {
                  removeSaudiCity(id);
                  toast(isAr ? 'تم حذف المدينة من القائمة' : 'City removed from list', 'success');
                }}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--input-fg)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isAr ? 'مصدر جلب العميل' : 'Acquisition Source'}
              </label>
              <PortalSelect
                value={sourceFilter}
                onChange={setSourceFilter}
                options={acquisitionSourceFilterOptions}
                preferBelow
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isAr ? 'مجموعة العميل' : 'Group'}
              </label>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
              >
                <option value="All">{isAr ? 'الكل' : 'All'}</option>
                {groupFilterOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isAr ? 'تاريخ التسجيل' : 'Registration date'}
              </label>
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex-1 min-w-0">
                  <DateCalendarField
                    value={fromDate}
                    onChange={setFromDate}
                    isAr={isAr}
                    showIcon={false}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
                  />
                </div>
                <span className="text-slate-400 text-xs shrink-0">{isAr ? 'إلى' : 'to'}</span>
                <div className="flex-1 min-w-0">
                  <DateCalendarField
                    value={toDate}
                    onChange={setToDate}
                    isAr={isAr}
                    showIcon={false}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'إعادة التصفية' : 'Reset'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Customer Data Table matching 08_customers.png */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-visible">
        {/* Table Top Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-t-2xl">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none min-h-[2.25rem]"
            >
              <option value="">{isAr ? 'إجراءات جماعية' : 'Bulk Actions'}</option>
              <option value="assign_group">{isAr ? 'تعيين مجموعة' : 'Assign to Group'}</option>
              <option value="make_active">{isAr ? 'تفعيل' : 'Mark Active'}</option>
              <option value="delete">{isAr ? 'حذف المحدد' : 'Delete Selected'}</option>
            </select>

            <button
              type="button"
              onClick={handleApplyBulk}
              disabled={!bulkAction || selectedIds.length === 0}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-medium transition-colors min-h-[2.25rem]"
            >
              {isAr ? 'تطبيق' : 'Apply'}
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
            {isAr
              ? `عرض ${fromRow}–${toRow} من ${filteredCustomers.length.toLocaleString()} عميل${
                  filteredCustomers.length !== totalCount
                    ? ` (من ${totalCount.toLocaleString()} إجمالاً)`
                    : ''
                }`
              : `Showing ${fromRow} – ${toRow} of ${filteredCustomers.length.toLocaleString()} customers${
                  filteredCustomers.length !== totalCount
                    ? ` (filtered from ${totalCount.toLocaleString()})`
                    : ''
                }`}
          </div>
        </div>

        {/* Table Grid — no forced min-width scrollbar on laptop; secondary cols hide */}
        <div className="w-full overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full text-start text-xs table-auto">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-[11px] bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-3 sm:px-4 w-10">
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
                <th className="py-3 pr-2 sm:pr-3 font-semibold">{isAr ? 'العميل' : 'Customer'}</th>
                <th className="py-3 px-2 font-semibold">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="py-3 px-2 font-semibold hidden sm:table-cell">{isAr ? 'المدينة' : 'City'}</th>
                <th className="py-3 px-2 font-semibold hidden md:table-cell">{isAr ? 'المصدر' : 'Source'}</th>
                <th className="py-3 px-2 font-semibold text-center">
                  {isAr ? 'الطلبات' : 'Orders'}
                </th>
                <th className="py-3 px-2 font-semibold text-end">
                  {isAr ? 'الإنفاق' : 'Spending'}
                </th>
                <th className="py-3 px-2 font-semibold text-end hidden xl:table-cell">
                  {isAr ? 'تاريخ التسجيل' : 'Registered'}
                </th>
                <th className="py-3 px-2 font-semibold text-end hidden lg:table-cell">
                  {isAr ? 'متوسط الطلب' : 'Avg. Order'}
                </th>
                <th className="py-3 px-2 font-semibold text-end hidden lg:table-cell">
                  {isAr ? 'آخر طلب' : 'Last Order'}
                </th>
                <th className="py-3 px-3 sm:px-4 text-center w-12">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {pageCustomers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    {isAr ? 'لا يوجد عملاء مطابقون للتصفية.' : 'No customers found matching filters.'}
                  </td>
                </tr>
              ) : (
                pageCustomers.map((cust, custIdx) => {
                  const isSelected = selectedIds.includes(cust.id);
                  const displayName =
                    getCustomerDisplayName(cust.name, locale) ||
                    (isAr ? 'بدون اسم' : 'Unnamed');
                  const displayCity = getLocalizedCity(cust.city, locale) || '—';

                  return (
                    <tr
                      key={cust.id || cust.email || `cust-${custIdx}`}
                      className={`hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 sm:px-4 align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(cust.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      <td className="py-3 pr-2 sm:pr-3 align-middle min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0">
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
                              <span>{displayName.substring(0, 2).toUpperCase()}</span>
                            )}
                          </button>
                          <div className="text-start min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => handleSelectCustomer(cust.id)}
                              className="font-bold text-slate-900 dark:text-slate-100 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-start block cursor-pointer truncate max-w-[9rem] sm:max-w-[12rem] lg:max-w-[16rem]"
                              title={isAr ? 'عرض تفاصيل العميل' : 'View Customer Details'}
                            >
                              {displayName}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectCustomer(cust.id)}
                              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 font-mono transition-colors text-start block cursor-pointer mt-0.5 tracking-tight truncate"
                              title={isAr ? 'عرض تفاصيل العميل' : 'View Customer Details'}
                              dir="ltr"
                            >
                              {cust.phone}
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-2 align-middle">{renderStatusBadge(cust.status)}</td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-300 font-medium align-middle hidden sm:table-cell">
                        {displayCity}
                      </td>
                      <td className="py-3 px-2 align-middle hidden md:table-cell">
                        {renderSourceIcon(cust.source)}
                      </td>
                      <td className="py-3 px-2 text-center font-bold tabular-nums text-slate-900 dark:text-white align-middle">
                        {cust.totalOrders}
                      </td>
                      <td className="py-3 px-2 text-end font-extrabold tabular-nums text-slate-900 dark:text-white align-middle whitespace-nowrap">
                        {money(cust.totalSpending)}
                      </td>
                      <td className="py-3 px-2 text-end tabular-nums text-slate-500 align-middle hidden xl:table-cell whitespace-nowrap">
                        {cust.registeredDate || '—'}
                      </td>
                      <td className="py-3 px-2 text-end tabular-nums text-slate-600 dark:text-slate-300 align-middle hidden lg:table-cell whitespace-nowrap">
                        {money(cust.avgOrderValue)}
                      </td>
                      <td className="py-3 px-2 text-end tabular-nums text-slate-500 align-middle hidden lg:table-cell whitespace-nowrap">
                        {cust.lastOrderDate || '—'}
                      </td>

                      <td className="py-3 px-3 sm:px-4 text-center align-middle">
                        <button
                          type="button"
                          ref={activeMenuId === cust.id ? actionMenuBtnRef : undefined}
                          data-customer-actions-trigger
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeMenuId === cust.id) {
                              setActiveMenuId(null);
                              return;
                            }
                            actionMenuBtnRef.current = e.currentTarget;
                            setActiveMenuId(cust.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          aria-label={isAr ? 'الإجراءات' : 'Actions'}
                          aria-expanded={activeMenuId === cust.id}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <WindowedPagination
          currentPage={page}
          totalPages={Math.max(1, lastPage)}
          totalCount={filteredCustomers.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          isAr={isAr}
          itemLabel={isAr ? 'عميل' : 'customers'}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      <FloatingPopover
        open={!!activeMenuId}
        anchorRef={actionMenuBtnRef}
        onClose={() => setActiveMenuId(null)}
        width={200}
        align="end"
        estimatedHeight={140}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 text-xs"
      >
        {(() => {
          const cust =
            pageCustomers.find((c) => c.id === activeMenuId) ||
            filteredCustomers.find((c) => c.id === activeMenuId);
          if (!cust) return null;
          return (
            <>
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomerId(cust.id);
                  setActiveMenuId(null);
                }}
                className="w-full px-3 py-2 hover:bg-teal-50 dark:hover:bg-teal-950/40 flex items-center gap-1.5 text-teal-700 dark:text-teal-300 font-semibold text-start"
              >
                <Eye className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAr ? 'الملف والمكافآت' : 'View Profile & Rewards'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssignGroupCustomerId(cust.id);
                  setAssignGroupValue(cust.group || '');
                  setActiveMenuId(null);
                }}
                className="w-full px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 text-slate-700 dark:text-slate-200 text-start"
              >
                <Tags className="w-3.5 h-3.5 text-indigo-500" />
                <span>{isAr ? 'إضافة إلى مجموعة' : 'Add to Groups'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCustomer(cust.id);
                  setActiveMenuId(null);
                }}
                className="w-full px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 text-rose-600 text-start"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'حذف' : 'Delete'}</span>
              </button>
            </>
          );
        })()}
      </FloatingPopover>

      {/* Add Customer Modal — isolated so form typing does not re-render the table */}
      {showAddModal ? (
        <AddCustomerModal
          isAr={isAr}
          storeId={activeStore.id}
          storeName={activeStore.name}
          groupOptions={addCustomerGroupOptions}
          customGroupsEmpty={customGroups.length === 0}
          onClose={() => setShowAddModal(false)}
          onSave={(payload) => {
            addCustomer(payload);
            setShowAddModal(false);
          }}
        />
      ) : null}

      {/* Export Modal */}
      {showExportModal && (
        <GlobalModal
          onClose={() => setShowExportModal(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'تصدير بيانات العملاء' : 'Export Customer Dataset'}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {isAr ? 'تصدير بيانات العملاء' : 'Export Customer Dataset'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
              {isAr ? (
                <>
                  تصدير{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{activeStore.name}</span>{' '}
                  — {filteredCustomers.length} سجل بصيغة جداول.
                </>
              ) : (
                <>
                  Export for{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{activeStore.name}</span>{' '}
                  — {filteredCustomers.length} records as CSV.
                </>
              )}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadCustomersCsv(filteredCustomers, activeStore.name);
                  toast(
                    isAr
                      ? `تم تنزيل ${filteredCustomers.length} عميل`
                      : `Downloaded ${filteredCustomers.length} customer(s)`,
                    'success',
                  );
                  setShowExportModal(false);
                }}
                className="flex-1 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
              >
                {isAr ? 'تنزيل الملف' : 'Download CSV'}
              </button>
            </div>
          </div>
        </GlobalModal>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <GlobalModal
          onClose={() => setShowImportModal(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'استيراد العملاء' : 'Import Customers'}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {isAr ? 'استيراد العملاء' : 'Import Customers'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
              {isAr
                ? 'ملف جداول بأعمدة: الاسم، الهاتف (مطلوب)، البريد، المدينة، المصدر، المجموعة.'
                : 'CSV with columns: Name, Phone (required), Email, City, Source, Group.'}
            </p>
            <input
              ref={importFileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => importFileRef.current?.click()}
              className="w-full p-4 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl mb-4 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs hover:border-blue-400 transition-colors"
            >
              {isAr ? 'اختر ملف الجداول' : 'Choose CSV file'}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </GlobalModal>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <GlobalModal
          onClose={() => setShowCreateGroupModal(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'إنشاء مجموعة عملاء' : 'Create Customer Group'}
        >
          <div
            className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <div className="unity-modal-header px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tags className="w-5 h-5 unity-modal-icon" />
                <h3 className="font-bold text-base">
                  {isAr ? 'إنشاء مجموعة عملاء' : 'Create Customer Group'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openGroupsFullView('new')}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white/90 hover:text-white hover:bg-white/10 border border-white/25"
                >
                  {isAr ? 'العرض الكامل' : 'Full View'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateGroupSubmit} className="p-5 space-y-4 text-xs" style={{ color: 'var(--text)' }}>
              <div>
                <label className="unity-modal-label block font-semibold mb-1">
                  {isAr ? 'اسم المجموعة' : 'Group Name'}
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--input-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
              <div>
                <label className="unity-modal-label block font-semibold mb-2">
                  {isAr ? 'أيقونة المجموعة' : 'Group Icon'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {GROUP_ICON_OPTIONS.map(({ key, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewGroupIcon(key)}
                      className="p-2.5 rounded-xl border transition-colors"
                      style={
                        newGroupIcon === key
                          ? {
                              borderColor: 'var(--accent)',
                              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                              color: 'var(--accent)',
                            }
                          : { borderColor: 'var(--border)', color: 'var(--muted)' }
                      }
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 rounded-lg hover:opacity-80"
                  style={{ color: 'var(--muted)' }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded-lg font-semibold unity-btn-primary"
                >
                  {isAr ? 'حفظ المجموعة' : 'Save Group'}
                </button>
              </div>
            </form>
          </div>
        </GlobalModal>
      )}

      {/* Groups Full View */}
      {showGroupsFullView && (
        <GlobalModal
          onClose={() => setShowGroupsFullView(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'العرض الكامل لمجموعات العملاء' : 'Customer Groups Full View'}
          contentClassName="w-full max-w-4xl"
        >
          <div
            className="rounded-2xl shadow-2xl w-full overflow-hidden border max-h-[90vh] flex flex-col"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <div className="unity-modal-header px-5 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Tags className="w-5 h-5 unity-modal-icon" />
                <h3 className="font-bold text-base">
                  {isAr ? 'مجموعات العملاء — العرض الكامل' : 'Customer Groups — Full View'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGroupsFullView(false)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="px-5 py-3 border-b flex flex-wrap items-center gap-2 shrink-0"
              style={{ borderColor: 'var(--border)' }}
            >
              {(
                [
                  { id: 'new' as const, labelAr: 'مجموعة جديدة', labelEn: 'New Group', Icon: Plus },
                  { id: 'groups' as const, labelAr: 'كل المجموعات', labelEn: 'All Groups', Icon: Tags },
                  { id: 'customers' as const, labelAr: 'كل العملاء', labelEn: 'All Customers', Icon: Users },
                ] as const
              ).map(({ id, labelAr, labelEn, Icon }) => {
                const active = groupsFullViewTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setGroupsFullViewTab(id)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-opacity hover:opacity-90"
                    style={
                      active
                        ? {
                            background: 'var(--portal-cta)',
                            borderColor: 'var(--portal-cta)',
                            color: '#fff',
                          }
                        : {
                            background: 'var(--surface)',
                            borderColor: 'var(--border)',
                            color: 'var(--text)',
                          }
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{isAr ? labelAr : labelEn}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 text-xs">
              {groupsFullViewTab === 'new' && (
                <form
                  onSubmit={(e) => {
                    if (handleCreateGroupSubmit(e)) setGroupsFullViewTab('groups');
                  }}
                  className="rounded-xl border p-4 space-y-3"
                  style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--accent) 4%, transparent)' }}
                >
                  <h4 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    {isAr ? 'إنشاء مجموعة جديدة' : 'Create New Group'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                    <div>
                      <label className="unity-modal-label block font-semibold mb-1">
                        {isAr ? 'اسم المجموعة' : 'Group Name'}
                      </label>
                      <input
                        type="text"
                        required
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--input-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white rounded-lg font-semibold unity-btn-primary whitespace-nowrap"
                    >
                      {isAr ? 'حفظ المجموعة' : 'Save Group'}
                    </button>
                  </div>
                  <div>
                    <label className="unity-modal-label block font-semibold mb-2">
                      {isAr ? 'أيقونة المجموعة' : 'Group Icon'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {GROUP_ICON_OPTIONS.map(({ key, Icon }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setNewGroupIcon(key)}
                          className="p-2.5 rounded-xl border transition-colors"
                          style={
                            newGroupIcon === key
                              ? {
                                  borderColor: 'var(--accent)',
                                  background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                                  color: 'var(--accent)',
                                }
                              : { borderColor: 'var(--border)', color: 'var(--muted)' }
                          }
                        >
                          <Icon className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              )}

              {groupsFullViewTab === 'groups' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                      {isAr ? 'كل المجموعات' : 'All Groups'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setGroupsFullViewTab('new')}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white unity-btn-primary flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {isAr ? 'مجموعة جديدة' : 'New Group'}
                    </button>
                  </div>

                  {builtinGroups.map((g) => {
                    const count = groupCustomerCounts.get(g.id) || 0;
                    return (
                      <div
                        key={g.id}
                        className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5"
                        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                              color: 'var(--accent)',
                            }}
                          >
                            <Users className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{isAr ? g.nameAr : g.nameEn}</p>
                            <p style={{ color: 'var(--muted)' }}>
                              {isAr ? 'مجموعة أساسية' : 'Built-in group'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold tabular-nums shrink-0" style={{ color: 'var(--muted)' }}>
                          {count} {isAr ? 'عميل' : count === 1 ? 'customer' : 'customers'}
                        </span>
                      </div>
                    );
                  })}

                  {customGroups.length === 0 ? (
                    <div
                      className="rounded-xl border border-dashed px-4 py-6 text-center"
                      style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                    >
                      {isAr ? 'لا توجد مجموعات مخصصة بعد' : 'No custom groups yet'}
                    </div>
                  ) : (
                    customGroups.map((g) => {
                      const count = groupCustomerCounts.get(g.name) || 0;
                      return (
                        <div
                          key={g.id}
                          className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5"
                          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                                color: 'var(--accent)',
                              }}
                            >
                              {renderGroupIcon(g.icon)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold truncate">{g.name}</p>
                              <p style={{ color: 'var(--muted)' }}>
                                {isAr ? 'مجموعة مخصصة' : 'Custom group'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-bold tabular-nums" style={{ color: 'var(--muted)' }}>
                              {count} {isAr ? 'عميل' : count === 1 ? 'customer' : 'customers'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomGroup(g.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              aria-label={isAr ? 'حذف المجموعة' : 'Delete group'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {groupsFullViewTab === 'customers' && (
                <div className="space-y-2">
                  <h4 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                    {isAr ? 'كل العملاء' : 'All Customers'}
                    <span className="ms-2 font-medium" style={{ color: 'var(--muted)' }}>
                      ({currentCustomers.length})
                    </span>
                  </h4>

                  {currentCustomers.length === 0 ? (
                    <div
                      className="rounded-xl border border-dashed px-4 py-6 text-center"
                      style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                    >
                      {isAr ? 'لا توجد سجلات' : 'No records found'}
                    </div>
                  ) : (
                    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                      <div className="max-h-[50vh] overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead
                            className="sticky top-0"
                            style={{ background: 'var(--surface)', color: 'var(--muted)' }}
                          >
                            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                              <th className="text-start font-semibold px-3 py-2">{isAr ? 'العميل' : 'Customer'}</th>
                              <th className="text-start font-semibold px-3 py-2">{isAr ? 'الهاتف' : 'Phone'}</th>
                              <th className="text-start font-semibold px-3 py-2">{isAr ? 'المجموعة' : 'Group'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentCustomers.map((cust) => (
                              <tr
                                key={cust.id}
                                className="border-b last:border-b-0"
                                style={{ borderColor: 'var(--border)' }}
                              >
                                <td className="px-3 py-2 font-semibold" style={{ color: 'var(--text)' }}>
                                  {getCustomerDisplayName(cust, isAr)}
                                </td>
                                <td className="px-3 py-2" style={{ color: 'var(--muted)' }}>
                                  {cust.phone || '—'}
                                </td>
                                <td className="px-3 py-2" style={{ color: 'var(--text)' }}>
                                  {cust.group?.trim() || (isAr ? '—' : '—')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </GlobalModal>
      )}

      {/* Assign Group (single customer) */}
      {assignGroupCustomerId && (
        <GlobalModal
          onClose={() => {
            setAssignGroupCustomerId(null);
            setAssignGroupValue('');
          }}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'تعيين مجموعة' : 'Assign to Group'}
        >
          <div
            className="rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <div className="unity-modal-header px-5 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {isAr ? 'تعيين مجموعة' : 'Assign to Group'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setAssignGroupCustomerId(null);
                  setAssignGroupValue('');
                }}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <select
                value={assignGroupValue}
                onChange={(e) => setAssignGroupValue(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg mb-4 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">{isAr ? '— اختر —' : '— Select —'}</option>
                {addCustomerGroupOptions.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              {assignGroupValue && customGroups.find((g) => g.name === assignGroupValue) && (
                <div className="flex items-center gap-2 mb-4 text-slate-600">
                  {renderGroupIcon(customGroups.find((g) => g.name === assignGroupValue)!.icon)}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAssignGroupCustomerId(null);
                    setAssignGroupValue('');
                  }}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleAssignGroupSubmit}
                  disabled={!assignGroupValue.trim()}
                  className="flex-1 py-2 text-xs font-semibold disabled:opacity-40 text-white rounded-lg unity-btn-primary"
                >
                  {isAr ? 'حفظ' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </GlobalModal>
      )}

      {/* Bulk assign group */}
      {showBulkGroupModal && (
        <GlobalModal
          onClose={() => {
            setShowBulkGroupModal(false);
            setBulkGroupValue('');
          }}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'تعيين مجموعة جماعي' : 'Bulk Assign Group'}
        >
          <div
            className="rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <div className="unity-modal-header px-5 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {isAr ? 'تعيين مجموعة جماعي' : 'Bulk Assign Group'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowBulkGroupModal(false);
                  setBulkGroupValue('');
                }}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-[11px] text-slate-500 mb-3">
                {isAr
                  ? `${selectedIds.length} عميل محدد`
                  : `${selectedIds.length} customer(s) selected`}
              </p>
              <select
                value={bulkGroupValue}
                onChange={(e) => setBulkGroupValue(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg mb-4 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">{isAr ? '— اختر —' : '— Select —'}</option>
                {addCustomerGroupOptions.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkGroupModal(false);
                    setBulkGroupValue('');
                  }}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleBulkAssignGroupSubmit}
                  disabled={!bulkGroupValue.trim()}
                  className="flex-1 py-2 text-xs font-semibold disabled:opacity-40 text-white rounded-lg unity-btn-primary"
                >
                  {isAr ? 'تطبيق' : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        </GlobalModal>
      )}
    </div>
  );
};
