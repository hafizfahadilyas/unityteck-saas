import React, { useEffect, useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { Store as StoreType } from '../../types';
import {
  Store,
  Search,
  Plus,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  Trash2,
  Globe,
  Database,
  ArrowUpRight,
  Flower2,
  Crown,
  Coffee,
  Car,
  RefreshCw,
  MessageSquare,
  Save,
  X,
  Mail,
  Pencil,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Server,
  Package,
  ShoppingBag,
  Ban,
  CheckSquare,
  Square,
} from 'lucide-react';

import { usePrefs } from '../../i18n/PrefsContext';
import { OverviewStatCard } from '../common/OverviewStatCard';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';
import { MasterMetaLine, masterGhostBtnClass } from './MasterUiKit';
import {
  getStoreDisplayName,
  getStoreDisplayCategory,
  getStoreDisplayOwner,
} from '../../utils/storeLocalization';
import { readAuthSession } from '../../auth/session';
import { canDeleteEntities } from '../../auth/roles';
import {
  findRegisteredMerchantByEmail,
  listRegisteredMerchants,
} from '../../auth/api';
import {
  isStoreLoginEmailActive,
  setStoreLoginEmailActive,
  setStoreLoginEmailOverride,
} from '../../auth/storeEmailAccess';
import { updateStore as updateStoreApi } from '../../api/tenantApi';
import { isApiEnabled } from '../../api/client';
import { fetchMasterWhatsAppQuotas, updateMasterWhatsAppQuotaApi } from '../../services/whatsappManagerService';
import { MasterStoreWhatsAppQuota } from '../../types/whatsapp';

interface MasterStoresProps {
  onOpenCreateStore: () => void;
}

type ViewMode = 'table' | 'cards';
type SortKey =
  | 'name'
  | 'status'
  | 'plan'
  | 'products'
  | 'orders'
  | 'revenue'
  | 'domain'
  | 'createdAt';
type SortDir = 'asc' | 'desc';
type HostingFilter = 'All' | 'flowers' | 'central';
type GrantFilter = 'All' | 'granted' | 'none';
type LangFilter = 'All' | 'en' | 'ar' | 'both';

type StoreMetrics = {
  productsCount: number;
  ordersCount: number;
  revenue: number;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const selectCls =
  'px-2.5 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 min-w-0';
const selectStyle: React.CSSProperties = {
  background: 'var(--surface)',
  borderColor: 'var(--border)',
  color: 'var(--text)',
  fontFamily: 'var(--font-ui)',
};

const chipBase =
  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border cursor-pointer transition-colors whitespace-nowrap';

function hostingOf(store: StoreType): 'flowers' | 'central' {
  return store.id === 'store-1' ? 'flowers' : 'central';
}

function resolveDomain(store: StoreType): string {
  return (store.custom_domain || store.domain || store.demo_domain || '').trim();
}

export const MasterStores: React.FC<MasterStoresProps> = ({ onOpenCreateStore }) => {
  const {
    stores,
    switchToStore,
    toggleMasterGrant,
    toggleStoreStatus,
    updateCanvaTemplatesPerCategory,
    updateStoreLanguages,
    updateStoreOwnerEmail,
    deleteStore,
    addAuditLog,
    allProducts,
    allOrders,
    cacheEpoch,
    softRefreshTenantData,
  } = useTenant();
  const { t, money, amount, locale } = usePrefs();
  const { toast, confirm: confirmDialog } = useToast();
  const isAr = locale === 'ar';
  const session = readAuthSession();
  const userCanDelete = canDeleteEntities(session?.user?.role);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterHosting, setFilterHosting] = useState<HostingFilter>('All');
  const [filterGrant, setFilterGrant] = useState<GrantFilter>('All');
  const [filterLang, setFilterLang] = useState<LangFilter>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [emailAccessEpoch, setEmailAccessEpoch] = useState(0);
  const [editingEmailStoreId, setEditingEmailStoreId] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState('');
  const [showWhatsAppQuotasModal, setShowWhatsAppQuotasModal] = useState(false);
  const [quotasLoading, setQuotasLoading] = useState(false);
  const [storeQuotas, setStoreQuotas] = useState<MasterStoreWhatsAppQuota[]>([]);
  const [editingQuotas, setEditingQuotas] = useState<
    Record<string, { daily_limit: number; monthly_limit: number }>
  >({});
  const [savingQuotaStoreId, setSavingQuotaStoreId] = useState<string | null>(null);

  const statusLabel = (status: string) => {
    if (status === 'active') return isAr ? 'نشط' : 'Active';
    if (status === 'pending') return isAr ? 'معلق' : 'Pending';
    if (status === 'suspended') return isAr ? 'موقوف' : 'Suspended';
    if (status === 'inactive') return isAr ? 'غير نشط' : 'Inactive';
    return status;
  };

  const deploymentLabel = (status?: string) => {
    if (status === 'live' || !status) return isAr ? 'منشور' : 'Live';
    if (status === 'building' || status === 'deploying') return isAr ? 'قيد التجهيز' : 'Building';
    if (status === 'failed') return isAr ? 'فشل' : 'Failed';
    if (status === 'pending') return isAr ? 'معلق' : 'Pending';
    return status;
  };

  const planLabel = (plan: string) => {
    if (plan === 'premium') return isAr ? 'مميزة' : 'Premium';
    if (plan === 'pro' || plan === 'paid') return isAr ? 'احترافية' : 'Pro';
    if (plan === 'custom') return isAr ? 'مخصصة' : 'Custom';
    return isAr ? 'مجانية' : 'Free';
  };

  const resolveStoreLoginEmail = (store: StoreType): string => {
    const registered = listRegisteredMerchants().find((m) => m.storeId === store.id);
    if (registered?.email) return registered.email;
    const fromOwner = (store.ownerEmail || store.email || '').trim().toLowerCase();
    if (fromOwner.includes('@')) {
      const merchant = findRegisteredMerchantByEmail(fromOwner);
      if (merchant) return merchant.email;
      return fromOwner;
    }
    return '—';
  };

  const getMetrics = (store: StoreType): StoreMetrics => {
    const hasProductRows = Object.prototype.hasOwnProperty.call(allProducts || {}, store.id);
    const hasOrderRows = Object.prototype.hasOwnProperty.call(allOrders || {}, store.id);
    const storeProducts = allProducts[store.id] || [];
    const storeOrders = allOrders[store.id] || [];
    return {
      productsCount: hasProductRows ? storeProducts.length : Number(store.productsCount) || 0,
      ordersCount: hasOrderRows ? storeOrders.length : Number(store.ordersCount) || 0,
      revenue: hasOrderRows
        ? storeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
        : Number(store.revenue) || 0,
    };
  };

  const handleToggleStoreLanguage = (store: StoreType, lang: 'english' | 'arabic') => {
    const current = store.languages || { english: true, arabic: true };
    const next = { ...current, [lang]: !current[lang] };
    if (!next.english && !next.arabic) {
      toast(
        isAr
          ? 'يجب أن تظل لغة واحدة على الأقل مفعلة للمتجر.'
          : 'At least one language must remain enabled for the store.',
        'error',
      );
      return;
    }
    const storeDisplayName = getStoreDisplayName(store, locale);
    updateStoreLanguages(store.id, next);
    addAuditLog({
      adminId: 'master-admin-01',
      adminName: 'Souq Platform SuperAdmin',
      storeId: store.id,
      action: 'store_update',
      resource: `Store: ${storeDisplayName}`,
      details: `Language availability: English ${next.english ? 'ON' : 'OFF'}, Arabic ${next.arabic ? 'ON' : 'OFF'}`,
      status: 'success',
      ipAddress: 'master-console',
    });
    toast(
      isAr
        ? `تم تحديث لغات المتجر «${storeDisplayName}» (الإنجليزية: ${next.english ? 'مفعّلة' : 'معطّلة'}، العربية: ${next.arabic ? 'مفعّلة' : 'معطّلة'})`
        : `Language updated for ${storeDisplayName}: English ${next.english ? 'ON' : 'OFF'}, Arabic ${next.arabic ? 'ON' : 'OFF'}`,
      'success',
    );
  };

  const handleToggleLoginEmail = async (store: StoreType) => {
    const next = !isStoreLoginEmailActive(store.id);
    setStoreLoginEmailActive(store.id, next);
    setEmailAccessEpoch((n) => n + 1);
    const storeDisplayName = getStoreDisplayName(store, locale);
    const loginEmail = resolveStoreLoginEmail(store);
    if (isApiEnabled()) {
      try {
        await updateStoreApi(store.id, { login_email_active: next });
      } catch (err) {
        setStoreLoginEmailActive(store.id, !next);
        setEmailAccessEpoch((n) => n + 1);
        toast(
          err instanceof Error
            ? err.message
            : isAr
              ? 'تعذر حفظ حالة بريد الدخول على الخادم'
              : 'Could not save login email status on server',
          'error',
        );
        return;
      }
    }
    addAuditLog({
      adminId: 'master-admin-01',
      adminName: 'Souq Platform SuperAdmin',
      storeId: store.id,
      action: 'store_update',
      resource: `Store login email: ${loginEmail}`,
      details: `Login email set to ${next ? 'Active' : 'Inactive'} for ${storeDisplayName}`,
      status: 'success',
      ipAddress: 'master-console',
    });
    toast(
      next
        ? isAr
          ? `تم تفعيل بريد الدخول لـ «${storeDisplayName}» (${loginEmail})`
          : `Login email Activated for ${storeDisplayName} (${loginEmail})`
        : isAr
          ? `تم تعطيل بريد الدخول لـ «${storeDisplayName}» — لن يفتح تسجيل الدخول`
          : `Login email Inactive for ${storeDisplayName} — login blocked`,
      'success',
    );
  };

  const startEditLoginEmail = (store: StoreType) => {
    setEditingEmailStoreId(store.id);
    setEmailDraft(resolveStoreLoginEmail(store) === '—' ? '' : resolveStoreLoginEmail(store));
  };

  const cancelEditLoginEmail = () => {
    setEditingEmailStoreId(null);
    setEmailDraft('');
  };

  const saveLoginEmailChange = (store: StoreType) => {
    const nextEmail = emailDraft.trim().toLowerCase();
    if (!nextEmail.includes('@') || !nextEmail.includes('.')) {
      toast(isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address', 'error');
      return;
    }
    const taken = findRegisteredMerchantByEmail(nextEmail);
    if (taken && taken.storeId !== store.id) {
      toast(
        isAr
          ? 'هذا البريد مسجّل لمتجر آخر. اختر بريداً مختلفاً.'
          : 'This email is already registered to another store. Choose a different one.',
        'error',
      );
      return;
    }
    try {
      const saved = setStoreLoginEmailOverride(store.id, nextEmail);
      updateStoreOwnerEmail(store.id, saved);
      setEmailAccessEpoch((n) => n + 1);
      setEditingEmailStoreId(null);
      setEmailDraft('');
      const storeDisplayName = getStoreDisplayName(store, locale);
      addAuditLog({
        adminId: 'master-admin-01',
        adminName: 'Souq Platform SuperAdmin',
        storeId: store.id,
        action: 'store_update',
        resource: `Store login email: ${saved}`,
        details: `Changed login email for ${storeDisplayName} to ${saved}`,
        status: 'success',
        ipAddress: 'master-console',
      });
      toast(
        isAr
          ? `تم تغيير بريد الدخول لـ «${storeDisplayName}» إلى ${saved}`
          : `Login email for ${storeDisplayName} changed to ${saved}`,
        'success',
      );
    } catch {
      toast(isAr ? 'تعذر حفظ بريد الدخول' : 'Could not save login email', 'error');
    }
  };

  const handleOpenQuotasModal = async () => {
    setShowWhatsAppQuotasModal(true);
    setQuotasLoading(true);
    try {
      const list = await fetchMasterWhatsAppQuotas();
      setStoreQuotas(list);
      const initialEdits: Record<string, { daily_limit: number; monthly_limit: number }> = {};
      list.forEach((q) => {
        initialEdits[q.store_id] = {
          daily_limit: q.daily_limit ?? 10,
          monthly_limit: q.monthly_limit ?? 50,
        };
      });
      setEditingQuotas(initialEdits);
    } catch {
      toast(isAr ? 'تعذر جلب حصص واتساب للمتاجر' : 'Failed to load store WhatsApp quotas', 'error');
    } finally {
      setQuotasLoading(false);
    }
  };

  const handleSaveStoreQuota = async (storeId: string) => {
    const current = editingQuotas[storeId];
    if (!current) return;
    setSavingQuotaStoreId(storeId);
    try {
      const res = await updateMasterWhatsAppQuotaApi(storeId, {
        daily_limit: Math.max(1, Number(current.daily_limit) || 10),
        monthly_limit: Math.max(1, Number(current.monthly_limit) || 50),
      });
      if (res.success) {
        toast(isAr ? 'تم تحديث حصة واتساب بنجاح' : 'Store WhatsApp quota updated successfully', 'success');
        setStoreQuotas((prev) =>
          prev.map((item) =>
            item.store_id === storeId
              ? {
                  ...item,
                  daily_limit: Math.max(1, Number(current.daily_limit) || 10),
                  monthly_limit: Math.max(1, Number(current.monthly_limit) || 50),
                }
              : item,
          ),
        );
      }
    } catch {
      toast(isAr ? 'فشل حفظ حصة واتساب' : 'Failed to save store quota', 'error');
    } finally {
      setSavingQuotaStoreId(null);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    stores.forEach((s) => {
      const c = getStoreDisplayCategory(s, locale).trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [stores, locale]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return stores.filter((s) => {
      const displayName = getStoreDisplayName(s, locale).toLowerCase();
      const displayCategory = getStoreDisplayCategory(s, locale).toLowerCase();
      const displayOwner = getStoreDisplayOwner(s, locale).toLowerCase();
      const domain = resolveDomain(s).toLowerCase();
      const loginEmail = resolveStoreLoginEmail(s).toLowerCase();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.nameEn && s.nameEn.toLowerCase().includes(q)) ||
        (s.nameAr && s.nameAr.toLowerCase().includes(q)) ||
        displayName.includes(q) ||
        displayCategory.includes(q) ||
        displayOwner.includes(q) ||
        s.owner.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        domain.includes(q) ||
        loginEmail.includes(q) ||
        s.id.toLowerCase().includes(q);
      const matchPlan =
        filterPlan === 'All' ||
        s.plan === filterPlan ||
        (filterPlan === 'pro' && (s.plan === 'pro' || s.plan === 'paid' || s.plan === 'premium'));
      const matchStatus = filterStatus === 'All' || s.status === filterStatus;
      const matchHosting = filterHosting === 'All' || hostingOf(s) === filterHosting;
      const matchGrant =
        filterGrant === 'All' ||
        (filterGrant === 'granted' ? !!s.masterGrantedPro : !s.masterGrantedPro);
      const enOn = s.languages?.english ?? true;
      const arOn = s.languages?.arabic ?? true;
      const matchLang =
        filterLang === 'All' ||
        (filterLang === 'en' && enOn) ||
        (filterLang === 'ar' && arOn) ||
        (filterLang === 'both' && enOn && arOn);
      const matchCategory =
        filterCategory === 'All' || getStoreDisplayCategory(s, locale) === filterCategory;
      return (
        matchSearch &&
        matchPlan &&
        matchStatus &&
        matchHosting &&
        matchGrant &&
        matchLang &&
        matchCategory
      );
    });
  }, [
    stores,
    searchTerm,
    filterPlan,
    filterStatus,
    filterHosting,
    filterGrant,
    filterLang,
    filterCategory,
    locale,
    emailAccessEpoch,
  ]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const ma = getMetrics(a);
      const mb = getMetrics(b);
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = getStoreDisplayName(a, locale).localeCompare(getStoreDisplayName(b, locale));
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'plan':
          cmp = String(a.plan).localeCompare(String(b.plan));
          break;
        case 'products':
          cmp = ma.productsCount - mb.productsCount;
          break;
        case 'orders':
          cmp = ma.ordersCount - mb.ordersCount;
          break;
        case 'revenue':
          cmp = ma.revenue - mb.revenue;
          break;
        case 'domain':
          cmp = resolveDomain(a).localeCompare(resolveDomain(b));
          break;
        case 'createdAt':
          cmp = String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
          break;
        default:
          cmp = 0;
      }
      return cmp * dir;
    });
    return rows;
  }, [filtered, sortKey, sortDir, locale, allProducts, allOrders, cacheEpoch]);

  const totalCount = sorted.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    filterPlan,
    filterStatus,
    filterHosting,
    filterGrant,
    filterLang,
    filterCategory,
    pageSize,
    viewMode,
  ]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => stores.some((s) => s.id === id)));
  }, [stores]);

  const totalGMV = useMemo(() => {
    const orderMaps = allOrders || {};
    const hasOrderMaps = Object.keys(orderMaps).length > 0;
    if (hasOrderMaps) {
      return Object.values(orderMaps)
        .flat()
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    }
    return stores.reduce((sum, s) => sum + (Number(s.revenue) || 0), 0);
  }, [allOrders, stores, cacheEpoch]);

  const totalOrdersPlatform = useMemo(() => {
    const orderMaps = allOrders || {};
    if (Object.keys(orderMaps).length > 0) {
      return Object.values(orderMaps).flat().length;
    }
    return stores.reduce((sum, s) => sum + (Number(s.ordersCount) || 0), 0);
  }, [allOrders, stores, cacheEpoch]);

  const activeStoresCount = stores.filter((s) => s.status === 'active').length;
  const suspendedStoresCount = stores.filter(
    (s) => s.status === 'suspended' || (s.status as string) === 'inactive',
  ).length;
  const proStoresCount = stores.filter(
    (s) => s.plan === 'pro' || s.plan === 'premium' || s.plan === 'paid' || s.masterGrantedPro,
  ).length;
  const grantedCount = stores.filter((s) => s.masterGrantedPro).length;

  const activeFilterCount = [
    filterPlan !== 'All',
    filterStatus !== 'All',
    filterHosting !== 'All',
    filterGrant !== 'All',
    filterLang !== 'All',
    filterCategory !== 'All',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm('');
    setFilterPlan('All');
    setFilterStatus('All');
    setFilterHosting('All');
    setFilterGrant('All');
    setFilterLang('All');
    setFilterCategory('All');
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const pageIds = paged.map((s) => s.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllPage = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectedStores = useMemo(
    () => stores.filter((s) => selectedIds.includes(s.id)),
    [stores, selectedIds],
  );

  const runBulkStatus = async (target: 'active' | 'suspended') => {
    if (selectedStores.length === 0) return;
    const ok = await confirmDialog({
      title: isAr ? 'تحديث جماعي للحالة' : 'Bulk status update',
      message: isAr
        ? `تطبيق الحالة «${statusLabel(target)}» على ${selectedStores.length} متجر؟`
        : `Set ${selectedStores.length} stores to ${statusLabel(target)}?`,
      confirmLabel: isAr ? 'تطبيق' : 'Apply',
      cancelLabel: isAr ? 'إلغاء' : 'Cancel',
    });
    if (!ok) return;
    let changed = 0;
    selectedStores.forEach((s) => {
      if (target === 'active' && s.status !== 'active') {
        toggleStoreStatus(s.id);
        changed += 1;
      } else if (target === 'suspended' && s.status === 'active') {
        toggleStoreStatus(s.id);
        changed += 1;
      }
    });
    toast(
      isAr
        ? `تم تحديث حالة ${changed} متجر`
        : `Updated status for ${changed} store(s)`,
      'success',
    );
    setSelectedIds([]);
  };

  const runBulkGrant = async (grant: boolean) => {
    if (selectedStores.length === 0) return;
    const ok = await confirmDialog({
      title: grant
        ? isAr
          ? 'منح جماعي للباقة الاحترافية'
          : 'Bulk grant Pro'
        : isAr
          ? 'إلغاء جماعي للمنح'
          : 'Bulk revoke grants',
      message: isAr
        ? `تطبيق على ${selectedStores.length} متجر محدد؟`
        : `Apply to ${selectedStores.length} selected store(s)?`,
      confirmLabel: isAr ? 'تطبيق' : 'Apply',
      cancelLabel: isAr ? 'إلغاء' : 'Cancel',
    });
    if (!ok) return;
    let changed = 0;
    selectedStores.forEach((s) => {
      if (Boolean(s.masterGrantedPro) !== grant) {
        toggleMasterGrant(s.id);
        changed += 1;
        addAuditLog({
          adminId: 'master-admin-01',
          adminName: 'Souq Platform SuperAdmin',
          storeId: s.id,
          action: 'plan_change',
          resource: `Store: ${getStoreDisplayName(s, locale)}`,
          details: `Bulk ${grant ? 'grant' : 'revoke'} Master Pro`,
          status: 'success',
          ipAddress: 'master-console',
        });
      }
    });
    toast(
      isAr ? `تم تحديث المنحة لـ ${changed} متجر` : `Grant updated for ${changed} store(s)`,
      'success',
    );
    setSelectedIds([]);
  };

  const hostLabel = (store: StoreType) => {
    const onCentral = hostingOf(store) === 'central';
    return onCentral
      ? isAr
        ? 'الاستضافة المركزية'
        : 'Central Hostinger'
      : isAr
        ? 'استضافة الزهور'
        : 'Flowers Hostinger';
  };

  const storeIconTone = (store: StoreType) => {
    if (store.id.includes('coffee')) return 'var(--tone-warn)';
    if (store.id.includes('bleco') || store.id.includes('car')) return 'var(--accent)';
    return 'var(--tone-success)';
  };

  const StoreAvatar: React.FC<{ store: StoreType; size?: 'sm' | 'md' }> = ({ store, size = 'md' }) => {
    const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
    const name = getStoreDisplayName(store, locale);
    const tone = storeIconTone(store);
    const isCoffee = store.id.includes('coffee');
    const isCars = store.id.includes('bleco') || store.id.includes('car');
    if (store.logo) {
      return (
        <div
          className={`${dim} rounded-xl border p-0.5 flex items-center justify-center shrink-0 overflow-hidden`}
          style={{
            background: 'color-mix(in srgb, var(--accent) 6%, var(--surface))',
            borderColor: 'var(--border)',
          }}
        >
          <img
            src={store.logo}
            alt={name}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      );
    }
    return (
      <span
        className={`${dim} rounded-xl flex items-center justify-center shrink-0 border`}
        style={{
          background: `color-mix(in srgb, ${tone} 12%, var(--surface))`,
          color: tone,
          borderColor: `color-mix(in srgb, ${tone} 30%, var(--border))`,
        }}
      >
        {isCoffee ? (
          <Coffee className="w-4 h-4" />
        ) : isCars ? (
          <Car className="w-4 h-4" />
        ) : (
          <Flower2 className="w-4 h-4" />
        )}
      </span>
    );
  };

  const StatusPill: React.FC<{ store: StoreType }> = ({ store }) => (
    <button
      type="button"
      onClick={() => {
        toggleStoreStatus(store.id);
        toast(
          isAr
            ? `تم تغيير حالة المتجر «${getStoreDisplayName(store, locale)}»`
            : `Status updated for ${getStoreDisplayName(store, locale)}`,
          'success',
        );
      }}
      title={isAr ? 'تبديل حالة المتجر' : 'Toggle store status'}
      className={`${chipBase}`}
      style={
        store.status === 'active'
          ? {
              background: 'color-mix(in srgb, var(--tone-success) 12%, var(--surface))',
              color: 'var(--tone-success)',
              borderColor: 'color-mix(in srgb, var(--tone-success) 35%, var(--border))',
            }
          : store.status === 'suspended'
            ? {
                background: 'color-mix(in srgb, var(--tone-danger) 12%, var(--surface))',
                color: 'var(--tone-danger)',
                borderColor: 'color-mix(in srgb, var(--tone-danger) 35%, var(--border))',
              }
            : {
                background: 'color-mix(in srgb, var(--tone-warn) 12%, var(--surface))',
                color: 'var(--tone-warn)',
                borderColor: 'color-mix(in srgb, var(--tone-warn) 35%, var(--border))',
              }
      }
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background:
            store.status === 'active'
              ? 'var(--tone-success)'
              : store.status === 'suspended'
                ? 'var(--tone-danger)'
                : 'var(--tone-warn)',
        }}
      />
      {statusLabel(store.status)}
    </button>
  );

  const renderControls = (store: StoreType) => {
    const storeDisplayName = getStoreDisplayName(store, locale);
    const metrics = getMetrics(store);
    const realDomain = resolveDomain(store);
    const coffeeStore = store.id === 'store-coffee';
    const displayDomain =
      realDomain ||
      (isAr
        ? coffeeStore
          ? 'النطاق المجاني بانتظار الربط'
          : 'بانتظار النطاق المخصص'
        : coffeeStore
          ? 'Included domain not connected'
          : 'Custom domain not connected');
    const loginEmail = resolveStoreLoginEmail(store);
    const emailActive = isStoreLoginEmailActive(store.id);
    const isEditing = editingEmailStoreId === store.id;
    void emailAccessEpoch;

    return (
      <div className="space-y-3 min-w-0" style={{ color: 'var(--muted)' }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div
            className="rounded-xl border p-2.5 min-w-0"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <div className="flex items-center gap-1 mb-1">
              <Package className="w-3 h-3" style={{ color: 'var(--accent)' }} />
              <span>{isAr ? 'المنتجات' : 'Products'}</span>
            </div>
            <div className="font-extrabold tabular-nums text-sm" style={{ color: 'var(--text)' }}>
              {amount(metrics.productsCount)}
            </div>
          </div>
          <div
            className="rounded-xl border p-2.5 min-w-0"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <div className="flex items-center gap-1 mb-1">
              <ShoppingBag className="w-3 h-3" style={{ color: 'var(--accent)' }} />
              <span>{isAr ? 'الطلبات' : 'Orders'}</span>
            </div>
            <div className="font-extrabold tabular-nums text-sm" style={{ color: 'var(--text)' }}>
              {amount(metrics.ordersCount)}
            </div>
          </div>
          <div
            className="rounded-xl border p-2.5 min-w-0 col-span-2 sm:col-span-1"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <div className="flex items-center gap-1 mb-1">
              <ArrowUpRight className="w-3 h-3" style={{ color: 'var(--accent)' }} />
              <span>{isAr ? 'الإيرادات' : 'Revenue'}</span>
            </div>
            <div className="font-extrabold tabular-nums text-sm truncate" style={{ color: 'var(--text)' }}>
              {money(metrics.revenue)}
            </div>
          </div>
          <div
            className="rounded-xl border p-2.5 min-w-0 col-span-2 sm:col-span-1"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
          >
            <div className="flex items-center gap-1 mb-1">
              <Server className="w-3 h-3" style={{ color: 'var(--accent)' }} />
              <span>{isAr ? 'الاستضافة' : 'Hosting'}</span>
            </div>
            <div className="font-bold text-[11px] truncate" style={{ color: 'var(--text)' }}>
              {hostLabel(store)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {isAr ? 'النطاق' : 'Domain'}
          </span>
          <button
            type="button"
            dir="ltr"
            onClick={() => {
              if (!realDomain) return;
              void navigator.clipboard?.writeText(realDomain);
              toast(isAr ? 'تم نسخ النطاق' : 'Domain copied', 'success');
            }}
            className="font-mono font-bold truncate max-w-[240px] cursor-pointer"
            style={{ color: 'var(--text)' }}
            title={displayDomain}
          >
            {displayDomain}
          </button>
          <span
            className="px-2 py-0.5 rounded-lg text-[10px] font-bold border"
            style={{
              background: 'color-mix(in srgb, var(--tone-success) 12%, var(--surface))',
              color: 'var(--tone-success)',
              borderColor: 'color-mix(in srgb, var(--tone-success) 35%, var(--border))',
            }}
          >
            {deploymentLabel(store.deployment_status)}
            {store.deployment_status === 'live' || !store.deployment_status
              ? ` · ${isAr ? 'شهادة الأمان مفعّلة' : 'SSL Active'}`
              : ''}
          </span>
        </div>

        <div
          className="pt-2 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-[11px] font-semibold flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            {isAr ? 'لغات المتجر' : 'Store languages'}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['english', 'arabic'] as const).map((lang) => {
              const on = store.languages?.[lang] ?? true;
              const label = lang === 'english' ? (isAr ? 'الإنجليزية' : 'EN') : isAr ? 'العربية' : 'AR';
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleToggleStoreLanguage(store, lang)}
                  className={chipBase}
                  style={
                    on
                      ? {
                          background: 'color-mix(in srgb, var(--tone-success) 12%, var(--surface))',
                          color: 'var(--tone-success)',
                          borderColor: 'color-mix(in srgb, var(--tone-success) 40%, var(--border))',
                        }
                      : {
                          background: 'color-mix(in srgb, var(--muted) 8%, var(--surface))',
                          color: 'var(--muted)',
                          borderColor: 'var(--border)',
                          textDecoration: 'line-through',
                        }
                  }
                >
                  {label}{' '}
                  {on ? (isAr ? 'مفعّل' : 'ON') : isAr ? 'معطّل' : 'OFF'}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-semibold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              {isAr ? 'بريد دخول المتجر' : 'Store login email'}
            </span>
            <button
              type="button"
              onClick={() => handleToggleLoginEmail(store)}
              className={chipBase}
              style={
                emailActive
                  ? {
                      background: 'color-mix(in srgb, var(--tone-success) 12%, var(--surface))',
                      color: 'var(--tone-success)',
                      borderColor: 'color-mix(in srgb, var(--tone-success) 40%, var(--border))',
                    }
                  : {
                      background: 'color-mix(in srgb, var(--tone-danger) 12%, var(--surface))',
                      color: 'var(--tone-danger)',
                      borderColor: 'color-mix(in srgb, var(--tone-danger) 40%, var(--border))',
                    }
              }
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: emailActive ? 'var(--tone-success)' : 'var(--tone-danger)' }}
              />
              {emailActive ? (isAr ? 'نشط' : 'Active') : isAr ? 'غير نشط' : 'Inactive'}
            </button>
          </div>
          {isEditing ? (
            <div className="space-y-1.5">
              <input
                type="email"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                dir="ltr"
                placeholder={isAr ? 'البريد@مثال.com' : 'name@example.com'}
                className="w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-mono outline-none"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={cancelEditLoginEmail}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => saveLoginEmailChange(store)}
                  className="unity-btn-primary inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer"
                >
                  <Save className="w-3 h-3" />
                  {isAr ? 'حفظ البريد' : 'Save email'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[10px] truncate flex-1" style={{ color: 'var(--text)' }} dir="ltr">
                {loginEmail}
              </p>
              <button
                type="button"
                onClick={() => startEditLoginEmail(store)}
                className={`${chipBase} shrink-0`}
                style={{
                  borderColor: 'color-mix(in srgb, var(--accent) 35%, var(--border))',
                  color: 'var(--accent)',
                  background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))',
                }}
              >
                <Pencil className="w-3 h-3" />
                {isAr ? 'تغيير' : 'Change'}
              </button>
            </div>
          )}
          <p className="text-[9px]">
            {isAr
              ? 'تغيير بريد الدخول متاح للمشرف العام للمنصة فقط'
              : 'Login email can be changed by platform SuperAdmin only'}
          </p>
        </div>

        <div className="pt-2 border-t flex flex-col gap-2.5" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                toggleMasterGrant(store.id);
                addAuditLog({
                  adminId: 'master-admin-01',
                  adminName: 'Souq Platform SuperAdmin',
                  storeId: store.id,
                  action: 'plan_change',
                  resource: `Store: ${storeDisplayName}`,
                  details: `Toggled Master Pro Grant (State: ${!store.masterGrantedPro})`,
                  status: 'success',
                  ipAddress: 'master-console',
                });
                toast(
                  store.masterGrantedPro
                    ? isAr
                      ? `تم إلغاء منحة الباقة الاحترافية لـ «${storeDisplayName}»`
                      : `Pro grant revoked for ${storeDisplayName}`
                    : isAr
                      ? `تم منح الباقة الاحترافية لـ «${storeDisplayName}»`
                      : `Pro granted to ${storeDisplayName}`,
                  'success',
                );
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border cursor-pointer whitespace-nowrap"
              style={
                store.masterGrantedPro
                  ? {
                      background: 'color-mix(in srgb, var(--tone-warn) 12%, var(--surface))',
                      color: 'var(--tone-warn)',
                      borderColor: 'color-mix(in srgb, var(--tone-warn) 35%, var(--border))',
                    }
                  : {
                      background: 'color-mix(in srgb, var(--accent) 6%, var(--surface))',
                      color: 'var(--text)',
                      borderColor: 'var(--border)',
                    }
              }
            >
              {store.masterGrantedPro
                ? isAr
                  ? 'إلغاء المنحة'
                  : 'Revoke Grant'
                : isAr
                  ? 'منح الباقة الاحترافية'
                  : 'Grant Pro'}
            </button>

            <label
              className="flex items-center gap-1.5 px-2 py-1 rounded-xl border text-[10px] font-bold"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              <span>{isAr ? 'قوالب / نوع' : 'Templates / type'}</span>
              <input
                type="number"
                min={1}
                max={100}
                className="w-12 px-1 py-0.5 rounded-lg border text-[11px] font-mono bg-transparent"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                value={store.canvaTemplatesPerCategory ?? ''}
                placeholder="5"
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  const next = raw === '' ? null : Number(raw);
                  updateCanvaTemplatesPerCategory(
                    store.id,
                    next == null || Number.isNaN(next) ? null : next,
                  );
                  toast(
                    isAr
                      ? `تم تحديث حد القوالب لـ «${storeDisplayName}»`
                      : `Template limit updated for ${storeDisplayName}`,
                    'success',
                  );
                }}
              />
            </label>

            {userCanDelete && (
              <button
                type="button"
                onClick={async () => {
                  const ok = await confirmDialog({
                    title: isAr ? 'حذف المتجر' : 'Delete store',
                    message: isAr
                      ? `هل أنت متأكد من حذف «${storeDisplayName}»؟ لا يمكن التراجع عن هذا الإجراء.`
                      : `Are you sure you want to delete ${storeDisplayName}? This cannot be undone.`,
                    confirmLabel: isAr ? 'حذف' : 'Delete',
                    cancelLabel: isAr ? 'إلغاء' : 'Cancel',
                    danger: true,
                  });
                  if (ok) {
                    deleteStore(store.id);
                    addAuditLog({
                      adminId: 'master-admin-01',
                      adminName: 'Souq Platform SuperAdmin',
                      storeId: store.id,
                      action: 'store_update',
                      resource: `Store: ${storeDisplayName}`,
                      details: `Permanently removed store from platform`,
                      status: 'success',
                      ipAddress: 'master-console',
                    });
                    toast(isAr ? `تم حذف «${storeDisplayName}»` : `${storeDisplayName} deleted`, 'success');
                    setExpandedId(null);
                  }
                }}
                className="p-1.5 rounded-xl border cursor-pointer"
                style={{ color: 'var(--muted)', borderColor: 'transparent' }}
                title={isAr ? 'حذف المتجر' : 'Remove Store'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => switchToStore(store.id)}
            className="unity-btn-primary w-full sm:w-auto self-stretch sm:self-end px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{isAr ? 'الدخول كمتجر' : 'Login as Store'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
          </button>
        </div>
      </div>
    );
  };

  const SortBtn: React.FC<{ col: SortKey; label: string }> = ({ col, label }) => (
    <button
      type="button"
      onClick={() => toggleSort(col)}
      className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
      style={{ color: sortKey === col ? 'var(--accent)' : 'var(--muted)' }}
    >
      <span>{label}</span>
      {sortKey === col ? (
        sortDir === 'asc' ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      )}
    </button>
  );

  const from = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, totalCount);

  return (
    <div
      className="u-page p-4 sm:p-6 space-y-5 max-w-[1680px] mx-auto w-full min-w-0 overflow-x-hidden"
      style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Store className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} />
            <h1 className="text-xl font-extrabold tracking-tight truncate" style={{ color: 'var(--text)' }}>
              {isAr ? 'إدارة المتاجر والمنصة' : 'Platform Stores Control'}
            </h1>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'تحكم كامل لأكثر من ١٠٠ متجر: الباقات، الدخول، النطاقات، الاستضافة، والمنح — مع تصفية وترتيب وصفحات.'
              : 'Full control for 100+ stores: plans, login, domains, hosting, and grants — with filter, sort, and pages.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap min-w-0">
          <button
            type="button"
            onClick={handleOpenQuotasModal}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border"
            style={{
              background: 'color-mix(in srgb, var(--tone-success) 12%, var(--surface))',
              color: 'var(--tone-success)',
              borderColor: 'color-mix(in srgb, var(--tone-success) 35%, var(--border))',
            }}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">
              {isAr ? 'حصص واتساب' : 'WhatsApp Quotas'}
            </span>
          </button>

          <button
            type="button"
            onClick={async () => {
              await softRefreshTenantData();
              toast(
                isAr
                  ? 'تم تحديث ومزامنة جميع بيانات المتاجر والمنصة بنجاح'
                  : 'All store & platform data synchronized successfully',
                'success',
              );
            }}
            className={masterGhostBtnClass}
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
            <span className="whitespace-nowrap">{isAr ? 'مزامنة' : 'Sync'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateStore}
            className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">{isAr ? 'إنشاء متجر جديد' : 'Provision New Store'}</span>
          </button>
        </div>
      </div>

      <MasterMetaLine>
        {isAr
          ? `المصدر: متاجر المنصة الحقيقية · ${amount(stores.length)} متجر · عرض ${from}–${to}`
          : `Source: live platform stores · ${amount(stores.length)} stores · showing ${from}–${to}`}
      </MasterMetaLine>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 min-w-0">
        <OverviewStatCard
          label={isAr ? 'إجمالي المتاجر' : 'Total Stores'}
          value={amount(stores.length)}
          icon={Store}
          tone="accent"
        />
        <OverviewStatCard
          label={t('activeStores') || (isAr ? 'المتاجر النشطة' : 'Active Stores')}
          value={amount(activeStoresCount)}
          icon={CheckCircle}
          tone="success"
        />
        <OverviewStatCard
          label={isAr ? 'موقوف / غير نشط' : 'Suspended'}
          value={amount(suspendedStoresCount)}
          icon={Ban}
          tone="danger"
        />
        <OverviewStatCard
          label={isAr ? 'احترافي ومميز' : 'Pro & Premium'}
          value={amount(proStoresCount)}
          icon={Crown}
          tone="warn"
          footer={
            <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
              {isAr ? `${amount(grantedCount)} منحة إدارة` : `${amount(grantedCount)} master grants`}
            </span>
          }
        />
        <OverviewStatCard
          label={isAr ? 'طلبات المنصة' : 'Platform Orders'}
          value={amount(totalOrdersPlatform)}
          icon={ShoppingBag}
          tone="info"
        />
        <OverviewStatCard
          label={isAr ? 'إجمالي مبيعات المنصة' : 'Platform GMV'}
          value={money(totalGMV)}
          icon={ArrowUpRight}
          tone="info"
          footer={
            <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
              {isAr ? 'من الطلبات الحقيقية' : 'From real orders'}
            </span>
          }
        />
      </div>

      {/* Filter / toolbar */}
      <div className="u-luxe-panel p-3 sm:p-4 space-y-3 min-w-0">
        <div className="flex flex-col xl:flex-row xl:items-center gap-3 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search
              className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--muted)' }}
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                isAr
                  ? 'بحث: اسم المتجر، المالك، التصنيف، النطاق، البريد، المعرّف…'
                  : 'Search: store, owner, category, domain, email, id…'
              }
              className="w-full ps-8 pe-3 py-2 text-xs rounded-xl border focus:outline-none min-w-0"
              style={{
                background: 'color-mix(in srgb, var(--accent) 4%, var(--surface))',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className={selectCls}
              style={selectStyle}
              aria-label={isAr ? 'تصفية الباقة' : 'Filter plan'}
            >
              <option value="All">{isAr ? 'جميع الباقات' : 'All Plans'}</option>
              <option value="free">{isAr ? 'مجانية' : 'Free'}</option>
              <option value="pro">{isAr ? 'احترافية / مدفوعة' : 'Pro / Paid'}</option>
              <option value="premium">{isAr ? 'مميزة' : 'Premium'}</option>
              <option value="custom">{isAr ? 'مخصصة' : 'Custom'}</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={selectCls}
              style={selectStyle}
              aria-label={isAr ? 'تصفية الحالة' : 'Filter status'}
            >
              <option value="All">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="active">{isAr ? 'نشط' : 'Active'}</option>
              <option value="suspended">{isAr ? 'موقوف' : 'Suspended'}</option>
              <option value="pending">{isAr ? 'معلق' : 'Pending'}</option>
            </select>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters((v) => !v)}
              className={`${masterGhostBtnClass} !py-1.5`}
              style={
                activeFilterCount > 0 || showAdvancedFilters
                  ? {
                      borderColor: 'color-mix(in srgb, var(--accent) 40%, var(--border))',
                      color: 'var(--accent)',
                    }
                  : undefined
              }
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>
                {isAr ? 'تصفية متقدمة' : 'Advanced'}
                {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </span>
            </button>

            {(activeFilterCount > 0 || searchTerm) && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                <X className="w-3 h-3" />
                {isAr ? 'مسح' : 'Clear'}
              </button>
            )}

            <div
              className="inline-flex items-center rounded-xl border p-0.5"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              role="group"
              aria-label={isAr ? 'طريقة العرض' : 'View mode'}
            >
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className="px-2.5 py-1.5 rounded-[10px] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                style={
                  viewMode === 'table'
                    ? { background: 'var(--portal-cta)', color: '#fff' }
                    : { color: 'var(--muted)' }
                }
              >
                <List className="w-3.5 h-3.5" />
                {isAr ? 'جدول' : 'Table'}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className="px-2.5 py-1.5 rounded-[10px] text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                style={
                  viewMode === 'cards'
                    ? { background: 'var(--portal-cta)', color: '#fff' }
                    : { color: 'var(--muted)' }
                }
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                {isAr ? 'بطاقات' : 'Cards'}
              </button>
            </div>
          </div>
        </div>

        {showAdvancedFilters && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            <label className="flex flex-col gap-1 text-[10px] font-bold" style={{ color: 'var(--muted)' }}>
              {isAr ? 'الاستضافة' : 'Hosting'}
              <select
                value={filterHosting}
                onChange={(e) => setFilterHosting(e.target.value as HostingFilter)}
                className={selectCls}
                style={selectStyle}
              >
                <option value="All">{isAr ? 'الكل' : 'All'}</option>
                <option value="flowers">{isAr ? 'استضافة الزهور' : 'Flowers Hostinger'}</option>
                <option value="central">{isAr ? 'الاستضافة المركزية' : 'Central Hostinger'}</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[10px] font-bold" style={{ color: 'var(--muted)' }}>
              {isAr ? 'منحة الإدارة' : 'Master Grant'}
              <select
                value={filterGrant}
                onChange={(e) => setFilterGrant(e.target.value as GrantFilter)}
                className={selectCls}
                style={selectStyle}
              >
                <option value="All">{isAr ? 'الكل' : 'All'}</option>
                <option value="granted">{isAr ? 'ممنوح' : 'Granted'}</option>
                <option value="none">{isAr ? 'بدون منحة' : 'No grant'}</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[10px] font-bold" style={{ color: 'var(--muted)' }}>
              {isAr ? 'اللغات' : 'Languages'}
              <select
                value={filterLang}
                onChange={(e) => setFilterLang(e.target.value as LangFilter)}
                className={selectCls}
                style={selectStyle}
              >
                <option value="All">{isAr ? 'الكل' : 'All'}</option>
                <option value="both">{isAr ? 'العربية والإنجليزية' : 'AR + EN'}</option>
                <option value="ar">{isAr ? 'العربية مفعّلة' : 'Arabic on'}</option>
                <option value="en">{isAr ? 'الإنجليزية مفعّلة' : 'English on'}</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[10px] font-bold" style={{ color: 'var(--muted)' }}>
              {isAr ? 'التصنيف' : 'Category'}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={selectCls}
                style={selectStyle}
              >
                <option value="All">{isAr ? 'كل التصنيفات' : 'All categories'}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* Bulk bar */}
        {selectedIds.length > 0 && (
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border px-3 py-2"
            style={{
              borderColor: 'color-mix(in srgb, var(--accent) 35%, var(--border))',
              background: 'color-mix(in srgb, var(--accent) 8%, var(--surface))',
            }}
          >
            <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
              {isAr
                ? `${amount(selectedIds.length)} متجر محدد — تحكم جماعي`
                : `${amount(selectedIds.length)} selected — bulk control`}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => runBulkStatus('active')}
                className={`${chipBase}`}
                style={{
                  background: 'color-mix(in srgb, var(--tone-success) 14%, var(--surface))',
                  color: 'var(--tone-success)',
                  borderColor: 'color-mix(in srgb, var(--tone-success) 40%, var(--border))',
                }}
              >
                <CheckCircle className="w-3 h-3" />
                {isAr ? 'تفعيل' : 'Activate'}
              </button>
              <button
                type="button"
                onClick={() => runBulkStatus('suspended')}
                className={chipBase}
                style={{
                  background: 'color-mix(in srgb, var(--tone-danger) 12%, var(--surface))',
                  color: 'var(--tone-danger)',
                  borderColor: 'color-mix(in srgb, var(--tone-danger) 35%, var(--border))',
                }}
              >
                <Ban className="w-3 h-3" />
                {isAr ? 'إيقاف' : 'Suspend'}
              </button>
              <button
                type="button"
                onClick={() => runBulkGrant(true)}
                className={chipBase}
                style={{
                  background: 'color-mix(in srgb, var(--tone-warn) 12%, var(--surface))',
                  color: 'var(--tone-warn)',
                  borderColor: 'color-mix(in srgb, var(--tone-warn) 35%, var(--border))',
                }}
              >
                <Crown className="w-3 h-3" />
                {isAr ? 'منح برو' : 'Grant Pro'}
              </button>
              <button
                type="button"
                onClick={() => runBulkGrant(false)}
                className={chipBase}
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                {isAr ? 'إلغاء المنح' : 'Revoke'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className={chipBase}
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                <X className="w-3 h-3" />
                {isAr ? 'إلغاء التحديد' : 'Clear'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results meta + page size */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]" style={{ color: 'var(--muted)' }}>
        <span>
          {isAr
            ? `${amount(totalCount)} نتيجة مطابقة من ${amount(stores.length)} متجر`
            : `${amount(totalCount)} matched of ${amount(stores.length)} stores`}
        </span>
        <label className="inline-flex items-center gap-1.5">
          <span>{isAr ? 'صفوف الصفحة' : 'Rows / page'}</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className={selectCls}
            style={selectStyle}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="u-luxe-panel u-luxe-panel--flush overflow-hidden min-w-0">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs min-w-[980px]">
              <thead>
                <tr
                  className="border-b text-[11px] font-semibold"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'color-mix(in srgb, var(--accent) 5%, var(--surface))',
                    color: 'var(--muted)',
                  }}
                >
                  <th className="py-3 px-3 w-10">
                    <button
                      type="button"
                      onClick={toggleSelectAllPage}
                      className="cursor-pointer"
                      aria-label={isAr ? 'تحديد الكل في الصفحة' : 'Select all on page'}
                      style={{ color: 'var(--accent)' }}
                    >
                      {allPageSelected ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3 text-start">
                    <SortBtn col="name" label={isAr ? 'المتجر' : 'Store'} />
                  </th>
                  <th className="py-3 px-3 text-start">
                    <SortBtn col="status" label={isAr ? 'الحالة' : 'Status'} />
                  </th>
                  <th className="py-3 px-3 text-start">
                    <SortBtn col="plan" label={isAr ? 'الباقة' : 'Plan'} />
                  </th>
                  <th className="py-3 px-3 text-start">
                    <SortBtn col="domain" label={isAr ? 'النطاق' : 'Domain'} />
                  </th>
                  <th className="py-3 px-3 text-end">
                    <SortBtn col="products" label={isAr ? 'منتجات' : 'Products'} />
                  </th>
                  <th className="py-3 px-3 text-end">
                    <SortBtn col="orders" label={isAr ? 'طلبات' : 'Orders'} />
                  </th>
                  <th className="py-3 px-3 text-end">
                    <SortBtn col="revenue" label={isAr ? 'إيرادات' : 'Revenue'} />
                  </th>
                  <th className="py-3 px-3 text-start">{isAr ? 'الاستضافة' : 'Hosting'}</th>
                  <th className="py-3 px-3 text-end">{isAr ? 'تحكم' : 'Control'}</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((store) => {
                  const metrics = getMetrics(store);
                  const name = getStoreDisplayName(store, locale);
                  const cat = getStoreDisplayCategory(store, locale);
                  const owner = getStoreDisplayOwner(store, locale);
                  const domain = resolveDomain(store) || '—';
                  const selected = selectedIds.includes(store.id);
                  const expanded = expandedId === store.id;
                  return (
                    <React.Fragment key={store.id}>
                      <tr
                        className="border-b transition-colors"
                        style={{
                          borderColor: 'var(--border)',
                          background: expanded
                            ? 'color-mix(in srgb, var(--accent) 6%, var(--surface))'
                            : selected
                              ? 'color-mix(in srgb, var(--accent) 4%, var(--surface))'
                              : 'var(--surface)',
                        }}
                      >
                        <td className="py-3 px-3 align-middle">
                          <button
                            type="button"
                            onClick={() => toggleSelectOne(store.id)}
                            className="cursor-pointer"
                            style={{ color: selected ? 'var(--accent)' : 'var(--muted)' }}
                          >
                            {selected ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 align-middle min-w-[200px]">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <StoreAvatar store={store} size="sm" />
                            <div className="min-w-0">
                              <div className="font-bold truncate" style={{ color: 'var(--text)' }}>
                                {name}
                              </div>
                              <div className="text-[10px] truncate" style={{ color: 'var(--muted)' }}>
                                {cat} · {owner}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 align-middle">
                          <StatusPill store={store} />
                        </td>
                        <td className="py-3 px-3 align-middle">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span
                              className="uppercase font-mono text-[10px] px-1.5 py-0.5 rounded font-bold"
                              style={{
                                background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))',
                                color: 'var(--text)',
                              }}
                            >
                              {planLabel(store.plan)}
                            </span>
                            {store.masterGrantedPro && (
                              <span
                                className="text-[9px] font-bold border px-1.5 py-0.5 rounded inline-flex items-center gap-0.5"
                                style={{
                                  background: 'color-mix(in srgb, var(--tone-warn) 12%, var(--surface))',
                                  color: 'var(--tone-warn)',
                                  borderColor: 'color-mix(in srgb, var(--tone-warn) 35%, var(--border))',
                                }}
                              >
                                <Crown className="w-2.5 h-2.5" />
                                {isAr ? 'منحة' : 'Grant'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 align-middle">
                          <span className="font-mono text-[10px] truncate block max-w-[160px]" dir="ltr" title={domain}>
                            {domain}
                          </span>
                        </td>
                        <td className="py-3 px-3 align-middle text-end tabular-nums font-bold">
                          {amount(metrics.productsCount)}
                        </td>
                        <td className="py-3 px-3 align-middle text-end tabular-nums font-bold">
                          {amount(metrics.ordersCount)}
                        </td>
                        <td className="py-3 px-3 align-middle text-end tabular-nums font-bold whitespace-nowrap">
                          {money(metrics.revenue)}
                        </td>
                        <td className="py-3 px-3 align-middle">
                          <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: 'var(--muted)' }}>
                            <Database className="w-3 h-3" />
                            {hostLabel(store)}
                          </span>
                        </td>
                        <td className="py-3 px-3 align-middle">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => switchToStore(store.id)}
                              className="unity-btn-primary px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1 cursor-pointer"
                              title={isAr ? 'الدخول كمتجر' : 'Login as Store'}
                            >
                              {isAr ? 'دخول' : 'Open'}
                              <ArrowUpRight className="w-3 h-3 rtl:-scale-x-100" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedId(expanded ? null : store.id)}
                              className="p-1.5 rounded-lg border cursor-pointer"
                              style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}
                              title={isAr ? 'التحكم الكامل' : 'Full controls'}
                            >
                              {expanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr style={{ background: 'color-mix(in srgb, var(--accent) 4%, var(--surface))' }}>
                          <td colSpan={10} className="px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                            <div className="max-w-4xl ms-auto me-0">
                              <div
                                className="mb-2 text-[11px] font-extrabold flex items-center gap-1.5"
                                style={{ color: 'var(--accent)' }}
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                {isAr ? 'تحكم المشرف العام الكامل' : 'Full SuperAdmin controls'}
                              </div>
                              {renderControls(store)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {paged.length === 0 && (
            <div className="p-12 text-center text-xs" style={{ color: 'var(--muted)' }}>
              {isAr ? 'لا توجد متاجر مطابقة لعوامل التصفية الحالية.' : 'No stores match the current filters.'}
            </div>
          )}
        </div>
      )}

      {/* CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
          {paged.map((store) => {
            const name = getStoreDisplayName(store, locale);
            const cat = getStoreDisplayCategory(store, locale);
            const owner = getStoreDisplayOwner(store, locale);
            const metrics = getMetrics(store);
            const selected = selectedIds.includes(store.id);
            const expanded = expandedId === store.id;
            return (
              <div
                key={store.id}
                className="u-luxe-panel u-luxe-panel--interactive u-luxe-panel--lg flex flex-col min-w-0 overflow-hidden"
                style={
                  selected
                    ? {
                        outline: '2px solid color-mix(in srgb, var(--accent) 45%, transparent)',
                        outlineOffset: 0,
                      }
                    : undefined
                }
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleSelectOne(store.id)}
                      className="cursor-pointer shrink-0"
                      style={{ color: selected ? 'var(--accent)' : 'var(--muted)' }}
                    >
                      {selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                    <StoreAvatar store={store} />
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>
                        {name}
                      </h3>
                      <p className="text-[11px] truncate" style={{ color: 'var(--muted)' }}>
                        {cat} · {owner}
                      </p>
                    </div>
                  </div>
                  <StatusPill store={store} />
                </div>

                <div
                  className="grid grid-cols-3 gap-2 py-2.5 border-y text-center text-xs mb-3"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div>
                    <span className="text-[10px] block" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'المنتجات' : 'Products'}
                    </span>
                    <span className="font-bold tabular-nums">{amount(metrics.productsCount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'الطلبات' : 'Orders'}
                    </span>
                    <span className="font-bold tabular-nums">{amount(metrics.ordersCount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] block" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'الإيرادات' : 'Revenue'}
                    </span>
                    <span className="font-bold tabular-nums truncate block">{money(metrics.revenue)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] mb-3 flex-wrap">
                  <span className="inline-flex items-center gap-1" style={{ color: 'var(--muted)' }}>
                    <Database className="w-3 h-3" />
                    {hostLabel(store)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className="uppercase font-mono text-[10px] px-1.5 py-0.5 rounded font-bold"
                      style={{
                        background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))',
                        color: 'var(--text)',
                      }}
                    >
                      {planLabel(store.plan)}
                    </span>
                    {store.masterGrantedPro && (
                      <span
                        className="text-[9px] font-bold border px-1.5 py-0.5 rounded inline-flex items-center gap-0.5"
                        style={{
                          background: 'color-mix(in srgb, var(--tone-warn) 12%, var(--surface))',
                          color: 'var(--tone-warn)',
                          borderColor: 'color-mix(in srgb, var(--tone-warn) 35%, var(--border))',
                        }}
                      >
                        <Crown className="w-2.5 h-2.5" />
                        {isAr ? 'منحة' : 'Grant'}
                      </span>
                    )}
                  </span>
                </div>

                <div className="mt-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : store.id)}
                    className="flex-1 px-3 py-2 rounded-xl text-[11px] font-bold border cursor-pointer inline-flex items-center justify-center gap-1"
                    style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}
                  >
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {isAr ? 'التحكم الكامل' : 'Full control'}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchToStore(store.id)}
                    className="unity-btn-primary px-3 py-2 rounded-xl text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer"
                  >
                    {isAr ? 'دخول' : 'Open'}
                    <ArrowUpRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
                  </button>
                </div>

                {expanded && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    {renderControls(store)}
                  </div>
                )}
              </div>
            );
          })}
          {paged.length === 0 && (
            <div
              className="col-span-full p-10 text-center rounded-2xl border border-dashed text-xs"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              {isAr ? 'لا توجد متاجر مطابقة لعوامل التصفية الحالية.' : 'No stores match the current filters.'}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
            {isAr
              ? `عرض ${from}–${to} من أصل ${amount(totalCount)}`
              : `Showing ${from}–${to} of ${amount(totalCount)}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`${masterGhostBtnClass} !py-1.5 disabled:opacity-40`}
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              {isAr ? 'السابق' : 'Prev'}
            </button>
            <span
              className="px-3 py-1.5 rounded-xl text-[11px] font-bold border tabular-nums"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              {safePage} / {pageCount}
            </span>
            <button
              type="button"
              disabled={safePage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className={`${masterGhostBtnClass} !py-1.5 disabled:opacity-40`}
            >
              {isAr ? 'التالي' : 'Next'}
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Quotas Modal */}
      {showWhatsAppQuotasModal && (
        <GlobalModal
          isOpen
          onClose={() => setShowWhatsAppQuotasModal(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'إدارة حصص واتساب ومكافحة حظر الأرقام' : 'Store WhatsApp Quotas & Anti-Ban Safeguards'}
        >
          <div
            className="rounded-2xl border shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
              fontFamily: 'var(--font-ui)',
            }}
          >
            <div
              className="p-5 border-b flex items-center justify-between"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--portal-cta)',
                color: '#fff',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                >
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold truncate">
                    {isAr
                      ? 'إدارة حصص واتساب ومكافحة حظر الأرقام'
                      : 'Store WhatsApp Quotas & Anti-Ban Safeguards'}
                  </h2>
                  <p className="text-xs opacity-90 truncate">
                    {isAr
                      ? 'التحكم المركزي في سقف الرسائل الآلية لكل متجر'
                      : 'Centralized daily & monthly automated limits per store'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsAppQuotasModal(false)}
                className="p-1.5 rounded-lg cursor-pointer"
                style={{ color: '#fff' }}
                aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="p-4 border-b flex items-start gap-2.5 text-xs"
              style={{
                borderColor: 'var(--border)',
                background: 'color-mix(in srgb, var(--tone-success) 10%, var(--surface))',
                color: 'var(--text)',
              }}
            >
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--tone-success)' }} />
              <div>
                <span className="font-bold">
                  {isAr
                    ? 'سياسة الأمان الافتراضية: ١٠ رسائل يومياً و ٥٠ شهرياً'
                    : 'Default Anti-Ban Safety: 10 msgs/day & 50 msgs/month'}
                </span>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'الرسائل اليدوية عبر واتساب المباشر مجانية بالكامل مدى الحياة بدون حدود.'
                    : 'Direct WhatsApp manual messages stay free lifetime with zero quota limits.'}
                </p>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {quotasLoading ? (
                <div className="py-12 text-center text-xs flex flex-col items-center gap-2" style={{ color: 'var(--muted)' }}>
                  <RefreshCw className="w-5 h-5 animate-spin" style={{ color: 'var(--accent)' }} />
                  <span>{isAr ? 'جاري تحميل بيانات حصص المتاجر…' : 'Loading store quota records…'}</span>
                </div>
              ) : storeQuotas.length === 0 ? (
                <div className="py-12 text-center text-xs" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'لا توجد بيانات حصص متاحة حالياً.' : 'No store quota records found.'}
                </div>
              ) : (
                <div className="divide-y rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                  {storeQuotas.map((q) => {
                    const edit = editingQuotas[q.store_id] || {
                      daily_limit: q.daily_limit,
                      monthly_limit: q.monthly_limit,
                    };
                    const isSaving = savingQuotaStoreId === q.store_id;
                    const isNearDaily = q.daily_used >= q.daily_limit;
                    const isNearMonthly = q.monthly_used >= q.monthly_limit;
                    return (
                      <div
                        key={q.store_id}
                        className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                        style={{ background: 'var(--surface)' }}
                      >
                        <div className="min-w-[180px]">
                          <div className="font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                            <span>{isAr ? q.store_name_ar || q.store_name : q.store_name}</span>
                            <span
                              className="px-1.5 py-0.5 text-[9px] font-bold rounded-md"
                              style={
                                q.is_connected
                                  ? {
                                      background: 'color-mix(in srgb, var(--tone-success) 14%, var(--surface))',
                                      color: 'var(--tone-success)',
                                    }
                                  : {
                                      background: 'color-mix(in srgb, var(--muted) 10%, var(--surface))',
                                      color: 'var(--muted)',
                                    }
                              }
                            >
                              {q.is_connected
                                ? isAr
                                  ? 'متصل'
                                  : 'Connected'
                                : isAr
                                  ? 'غير متصل'
                                  : 'Not Connected'}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--muted)' }}>
                            {q.sender_phone || q.store_id}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>
                                {isAr ? 'الحد اليومي' : 'Daily Limit'}
                              </span>
                              <input
                                type="number"
                                min={1}
                                max={500}
                                value={edit.daily_limit}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 1;
                                  setEditingQuotas((prev) => ({
                                    ...prev,
                                    [q.store_id]: { ...edit, daily_limit: val },
                                  }));
                                }}
                                className="w-20 px-2 py-1 text-xs font-semibold rounded-lg border"
                                style={{
                                  background: 'var(--surface)',
                                  borderColor: 'var(--border)',
                                  color: 'var(--text)',
                                }}
                              />
                            </div>
                            <div className="text-[10px] self-end pb-1 font-mono" style={{ color: 'var(--muted)' }}>
                              <span style={isNearDaily ? { color: 'var(--tone-danger)', fontWeight: 700 } : undefined}>
                                {q.daily_used}
                              </span>
                              /{edit.daily_limit}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>
                                {isAr ? 'الحد الشهري' : 'Monthly Limit'}
                              </span>
                              <input
                                type="number"
                                min={1}
                                max={2000}
                                value={edit.monthly_limit}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 1;
                                  setEditingQuotas((prev) => ({
                                    ...prev,
                                    [q.store_id]: { ...edit, monthly_limit: val },
                                  }));
                                }}
                                className="w-20 px-2 py-1 text-xs font-semibold rounded-lg border"
                                style={{
                                  background: 'var(--surface)',
                                  borderColor: 'var(--border)',
                                  color: 'var(--text)',
                                }}
                              />
                            </div>
                            <div className="text-[10px] self-end pb-1 font-mono" style={{ color: 'var(--muted)' }}>
                              <span
                                style={isNearMonthly ? { color: 'var(--tone-danger)', fontWeight: 700 } : undefined}
                              >
                                {q.monthly_used}
                              </span>
                              /{edit.monthly_limit}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSaveStoreQuota(q.store_id)}
                            disabled={isSaving}
                            className="unity-btn-primary self-end px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {isSaving ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            <span>{isAr ? 'حفظ' : 'Save'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              className="p-4 border-t flex items-center justify-between gap-2"
              style={{
                borderColor: 'var(--border)',
                background: 'color-mix(in srgb, var(--accent) 4%, var(--surface))',
              }}
            >
              <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'تُحفظ الحدود فوراً في قاعدة البيانات وتُطبَّق على واجهات المتاجر'
                  : 'Limits are written to MySQL and enforced immediately'}
              </span>
              <button
                type="button"
                onClick={() => setShowWhatsAppQuotasModal(false)}
                className={masterGhostBtnClass}
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </GlobalModal>
      )}
    </div>
  );
};
