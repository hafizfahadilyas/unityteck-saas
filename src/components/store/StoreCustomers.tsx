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
  ChevronLeft,
  ChevronRight,
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
  LucideIcon,
} from 'lucide-react';
import { CustomerDetails } from './CustomerDetails';
import { getArabCustomerAvatar, getCustomerSeoAlt } from '../../utils/customerAvatars';
import { handleImageError } from '../../utils/imageFallback';
import { parseOrderDate, periodCountGrowth } from '../../utils/liveSeries';
import { ORDER_SOURCE_OPTIONS, OrderSourceIcon, WhatsAppBrandIcon } from '../common/BrandIcons';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';

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

function escapeCsvCell(value: string | number | undefined): string {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
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
  const lines = [
    headers.join(','),
    ...customers.map((c) =>
      [
        escapeCsvCell(c.name),
        escapeCsvCell(c.phone),
        escapeCsvCell(c.email),
        escapeCsvCell(c.city),
        escapeCsvCell(c.country),
        escapeCsvCell(c.status),
        escapeCsvCell(c.gender),
        escapeCsvCell(c.source),
        escapeCsvCell(c.group),
        escapeCsvCell(c.registeredDate),
        escapeCsvCell(c.totalOrders),
        escapeCsvCell(c.totalSpending),
        escapeCsvCell(c.avgOrderValue),
        escapeCsvCell(c.lastOrderDate),
      ].join(','),
    ),
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = storeName.replace(/[^\w\-]+/g, '_').slice(0, 40);
  a.href = url;
  a.download = `customers_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const [customGroups, setCustomGroups] = useState<CustomerGroupDef[]>([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('Users');

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

  useEffect(() => {
    if (!showHeaderMenu) return;
    const onDoc = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setShowHeaderMenu(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [showHeaderMenu]);

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

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newGroupName.trim();
    if (!name) return;
    if (customGroups.some((g) => g.name.toLowerCase() === name.toLowerCase())) {
      toast(isAr ? 'المجموعة موجودة مسبقاً' : 'Group already exists', 'warning');
      return;
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
  };

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
        ? `تم تعيين${selectedIds.length}عميل للمجموعة`
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
      for (let i = 1; i < lines.length; i++) {
        const cells = parseCsvLine(lines[i]);
        const name =
          nameIdx >= 0 ? cells[nameIdx]?.trim() : cells[0]?.trim();
        const phone =
          phoneIdx >= 0 ? cells[phoneIdx]?.trim() : cells[1]?.trim();
        if (!name || !phone) continue;
        const email = emailIdx >= 0 ? cells[emailIdx]?.trim() : '';
        const city = cityIdx >= 0 ? cells[cityIdx]?.trim() : '';
        const sourceRaw = sourceIdx >= 0 ? cells[sourceIdx]?.trim() : 'Direct';
        const group = groupIdx >= 0 ? cells[groupIdx]?.trim() : 'Regular';
        const source = (ORDER_SOURCE_OPTIONS.some((o) => o.value === sourceRaw)
          ? sourceRaw
          : 'Direct') as CustomerSource;

        addCustomer({
          name,
          phone,
          email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@import.local`,
          status: 'New',
          city: city || (isAr ? 'غير محدد' : 'Unspecified'),
          country: 'Saudi Arabia',
          gender: 'Other',
          source,
          group: group || 'Regular',
          totalOrders: 0,
          totalSpending: 0,
          avgOrderValue: 0,
          lastOrderDate: '—',
          avatar: getArabCustomerAvatar({ name, gender: 'Other' }),
        });
        imported++;
      }
      if (imported === 0) {
        toast(isAr ? 'لم يُستورد أي عميل (يتطلب الاسم والهاتف)' : 'No customers imported (name + phone required)', 'warning');
      } else {
        toast(
          isAr ? `تم استيراد${imported}عميل` : `Imported ${imported} customer(s)`,
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
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {isAr ? 'العملاء' : 'Customers'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
                className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Award className="w-4 h-4" />
                <span>{isAr ? 'نقاط الولاء' : 'Loyalty Points'}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('cashback')}
                className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Gem className="w-4 h-4" />
                <span>{isAr ? 'الكاش باك' : 'Cashback'}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowCreateGroupModal(true)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Tags className="w-4 h-4" />
            <span>{isAr ? 'إنشاء مجموعة' : 'Create Group'}</span>
          </button>

          <div className="relative" ref={headerMenuRef}>
            <button
              type="button"
              onClick={() => setShowHeaderMenu((v) => !v)}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
              aria-label={isAr ? 'المزيد' : 'More options'}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showHeaderMenu && (
              <div className="absolute end-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-40 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowExportModal(true);
                    setShowHeaderMenu(false);
                  }}
                  className="w-full px-3 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-start"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'تصدير العملاء' : 'Export Customers'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(true);
                    setShowHeaderMenu(false);
                  }}
                  className="w-full px-3 py-2 hover:bg-blue-50 dark:hover:bg-sky-950/40 flex items-center gap-2 text-blue-800 dark:text-sky-300 font-semibold text-start"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isAr ? 'استيراد العملاء' : 'Import Customers'}</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="self-start sm:self-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة عميل جديد' : 'Add New Customer'}</span>
          </button>
        </div>
      </div>

      {/* Metric cards — full width */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Total Customers */}
          <div className="p-4 bg-blue-50/70 hover:bg-blue-50/90 dark:bg-sky-950/40 rounded-2xl border border-blue-200/80 dark:border-sky-900/60 shadow-xs flex flex-col justify-between transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAr ? 'إجمالي العملاء' : 'Total Customers'}
              </span>
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
                {isAr ? 'جدد هذا الشهر' : 'New This Month'}{' '}
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              </span>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-xl shadow-2xs">
                <UserPlus className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {newThisMonth}
              </span>
              {newCustomersGrowth.hasData ? (
                <span className={`text-xs font-bold flex items-center ${
                  newCustomersGrowth.pct >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}>
                  {newCustomersGrowth.pct >= 0
                    ? <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" />
                    : <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" />}
                  <span>{Math.abs(newCustomersGrowth.pct)}%</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Active Customers */}
          <div className="p-4 bg-amber-50/70 hover:bg-amber-50/90 dark:bg-amber-950/40 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 shadow-xs flex flex-col justify-between transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                {isAr ? 'العملاء النشطون' : 'Active Customers'}{' '}
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
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
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAr ? 'كبار العملاء' : 'VIP Customers'}
              </span>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-xl shadow-2xs">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
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
                <option value="Male">{isAr ? 'ذكر' : 'Male'}</option>
                <option value="Female">{isAr ? 'أنثى' : 'Female'}</option>
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
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
              >
                <option value="All">{isAr ? 'الكل' : 'All'}</option>
                <option value="Jeddah">{isAr ? 'جدة' : 'Jeddah'}</option>
                <option value="Riyadh">{isAr ? 'الرياض' : 'Riyadh'}</option>
                <option value="Makkah">{isAr ? 'مكة' : 'Makkah'}</option>
                <option value="Taif">{isAr ? 'الطائف' : 'Taif'}</option>
                <option value="Dammam">{isAr ? 'الدمام' : 'Dammam'}</option>
                <option value="Madinah">{isAr ? 'المدينة' : 'Madinah'}</option>
                <option value="Al-Khobar">{isAr ? 'الخبر' : 'Al-Khobar'}</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isAr ? 'مصدر العميل' : 'Source'}
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
              >
                <option value="All">{isAr ? 'الكل' : 'All'}</option>
                {ORDER_SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {isAr ? o.labelAr : o.labelEn}
                  </option>
                ))}
              </select>
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
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
                />
                <span className="text-slate-400 text-xs">{isAr ? 'إلى' : 'to'}</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
                />
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
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
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
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 rounded-lg text-xs font-medium transition-colors"
            >
              {isAr ? 'تطبيق' : 'Apply'}
            </button>
          </div>

          <div className="text-xs text-slate-500">
            {isAr
              ? `عرض${fromRow}–${toRow}من${filteredCustomers.length.toLocaleString()}عميل${
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
                    {isAr ? 'لا يوجد عملاء مطابقون للتصفية.' : 'No customers found matching filters.'}
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
                      <td className="py-3 px-2 text-right tabular-nums text-slate-500">
                        {cust.registeredDate}
                      </td>

                      {/* Avg Order Value */}
                      <td className="py-3 px-2 text-right tabular-nums text-slate-600">
                        {money(cust.avgOrderValue)}
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
                              <span>{isAr ? 'الملف والمكافآت' : 'View Profile & Rewards'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAssignGroupCustomerId(cust.id);
                                setAssignGroupValue(cust.group || '');
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5 text-slate-700"
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
                              className="w-full px-3 py-1.5 hover:bg-rose-50 flex items-center gap-1.5 text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{isAr ? 'حذف' : 'Delete'}</span>
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
        <GlobalModal
          onClose={() => setShowAddModal(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'إضافة عميل' : 'Add Customer'}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0b1b36] px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">{isAr ? 'إضافة عميل' : 'Add New Customer'}</h3>
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
                <label className="block font-semibold mb-1">{isAr ? 'الاسم الكامل *' : 'Customer Full Name *'}</label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: فيصل العتيبي' : 'e.g. Faisal Al-Otaibi'}
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{isAr ? 'رقم الجوال' : 'Phone Number'}</label>
                  <input
                    type="text"
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{isAr ? 'المدينة' : 'City'}</label>
                  <select
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="Riyadh">{isAr ? 'الرياض' : 'Riyadh'}</option>
                    <option value="Jeddah">{isAr ? 'جدة' : 'Jeddah'}</option>
                    <option value="Dammam">{isAr ? 'الدمام' : 'Dammam'}</option>
                    <option value="Makkah">{isAr ? 'مكة' : 'Makkah'}</option>
                    <option value="Madinah">{isAr ? 'المدينة' : 'Madinah'}</option>
                    <option value="Taif">{isAr ? 'الطائف' : 'Taif'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{isAr ? 'مصدر الاكتساب' : 'Acquisition Source'}</label>
                  <select
                    value={newCustSource}
                    onChange={(e) => setNewCustSource(e.target.value as CustomerSource)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="Instagram">{isAr ? 'إنستغرام' : 'Instagram'}</option>
                    <option value="Google Ads">{isAr ? 'إعلانات جوجل' : 'Google Ads'}</option>
                    <option value="TikTok">{isAr ? 'تيك توك' : 'TikTok'}</option>
                    <option value="Direct">{isAr ? 'مباشر' : 'Direct'}</option>
                    <option value="Referral">{isAr ? 'إحالة' : 'Referral'}</option>
                    <option value="Snapchat">{isAr ? 'سناب شات' : 'Snapchat'}</option>
                    <option value="Other">{isAr ? 'أخرى' : 'Other'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">{isAr ? 'الحالة الأولية' : 'Initial Status'}</label>
                  <select
                    value={newCustStatus}
                    onChange={(e) => setNewCustStatus(e.target.value as CustomerStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="Active">{isAr ? 'نشط' : 'Active'}</option>
                    <option value="VIP">{isAr ? 'عميل مميز' : 'VIP'}</option>
                    <option value="New">{isAr ? 'جديد' : 'New'}</option>
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
                      placeholder={isAr ? 'https://... أو صورة تلقائية' : 'https://... or auto-assigned Arab portrait'}
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
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isAr ? 'حفظ' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </GlobalModal>
      )}

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
                      ? `تم تنزيل${filteredCustomers.length}عميل`
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'إنشاء مجموعة عملاء' : 'Create Customer Group'}
              </h3>
              <button type="button" onClick={() => setShowCreateGroupModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateGroupSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                  {isAr ? 'اسم المجموعة' : 'Group Name'}
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2 text-slate-700 dark:text-slate-200">
                  {isAr ? 'أيقونة المجموعة' : 'Group Icon'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {GROUP_ICON_OPTIONS.map(({ key, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewGroupIcon(key)}
                      className={`p-2.5 rounded-xl border transition-colors ${
                        newGroupIcon === key
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700'
                          : 'border-slate-200 dark:border-slate-600 text-slate-600'
                      }`}
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
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold">
                  {isAr ? 'حفظ المجموعة' : 'Save Group'}
                </button>
              </div>
            </form>
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
              {isAr ? 'تعيين مجموعة' : 'Assign to Group'}
            </h3>
            <select
              value={assignGroupValue}
              onChange={(e) => setAssignGroupValue(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg mb-4 bg-white dark:bg-slate-800"
            >
              <option value="">{isAr ? '— اختر —' : '— Select —'}</option>
              {groupFilterOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
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
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleAssignGroupSubmit}
                disabled={!assignGroupValue.trim()}
                className="flex-1 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg"
              >
                {isAr ? 'حفظ' : 'Save'}
              </button>
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
              {isAr ? 'تعيين مجموعة جماعي' : 'Bulk Assign Group'}
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              {isAr
                ? `${selectedIds.length}عميل محدد`
                : `${selectedIds.length} customer(s) selected`}
            </p>
            <select
              value={bulkGroupValue}
              onChange={(e) => setBulkGroupValue(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg mb-4 bg-white dark:bg-slate-800"
            >
              <option value="">{isAr ? '— اختر —' : '— Select —'}</option>
              {groupFilterOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
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
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleBulkAssignGroupSubmit}
                disabled={!bulkGroupValue.trim()}
                className="flex-1 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg"
              >
                {isAr ? 'تطبيق' : 'Apply'}
              </button>
            </div>
          </div>
        </GlobalModal>
      )}
    </div>
  );
};
