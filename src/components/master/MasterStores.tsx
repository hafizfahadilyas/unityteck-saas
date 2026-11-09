import React, { useState, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { Store as StoreType, PlanType } from '../../types';
import {
  Store, 
  Search, 
  Filter, 
  Plus, 
  ExternalLink, 
  ShieldCheck, 
  ShieldAlert,
  CheckCircle, 
  Clock, 
  AlertTriangle, 
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
} from 'lucide-react';

import { usePrefs } from '../../i18n/PrefsContext';
import { OverviewStatCard } from '../common/OverviewStatCard';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';
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
  setStoreLoginEmailOverride,
  toggleStoreLoginEmailActive,
} from '../../auth/storeEmailAccess';
import { fetchMasterWhatsAppQuotas, updateMasterWhatsAppQuotaApi } from '../../services/whatsappManagerService';
import { MasterStoreWhatsAppQuota } from '../../types/whatsapp';

interface MasterStoresProps {
  onOpenCreateStore: () => void;
}

export const MasterStores: React.FC<MasterStoresProps> = ({ onOpenCreateStore }) => {
  const {
    stores,
    switchToStore,
    toggleMasterGrant,
    toggleStoreStatus,
    updateStorePlan,
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
  const loc = isAr ? 'ar-SA' : 'en-US';
  const session = readAuthSession();
  const userCanDelete = canDeleteEntities(session?.user?.role);

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
      adminName: 'Master SuperAdmin',
      storeId: store.id,
      action: 'store_update',
      resource: `Store: ${storeDisplayName}`,
      details: `Language availability: English ${next.english ? 'ON' : 'OFF'}, Arabic ${next.arabic ? 'ON' : 'OFF'}`,
      status: 'success',
      ipAddress: '185.199.108.153',
    });
    toast(
      isAr
        ? `تم تحديث لغات المتجر «${storeDisplayName}» (الإنجليزية:${next.english ? 'مفعلة': 'معطلة'}، العربية:${next.arabic ? 'مفعلة': 'معطلة'})`
        : `Language updated for ${storeDisplayName}: English ${next.english ? 'ON' : 'OFF'}, Arabic ${next.arabic ? 'ON' : 'OFF'}`,
      'success',
    );
  };

  const statusLabel = (status: string) => {
    if (status === 'active') return isAr ? 'نشط' : 'Active';
    if (status === 'pending') return isAr ? 'معلق' : 'Pending';
    return status;
  };

  const deploymentLabel = (status?: string) => {
    if (status === 'live' || !status) return isAr ? 'منشور' : 'Live';
    if (status === 'building') return isAr ? 'قيد التجهيز' : 'Building';
    return status;
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  /** Bumps when Master toggles / changes a store login email */
  const [emailAccessEpoch, setEmailAccessEpoch] = useState(0);
  const [editingEmailStoreId, setEditingEmailStoreId] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState('');

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

  const handleToggleLoginEmail = (store: StoreType) => {
    const next = toggleStoreLoginEmailActive(store.id);
    setEmailAccessEpoch((n) => n + 1);
    const storeDisplayName = getStoreDisplayName(store, locale);
    const loginEmail = resolveStoreLoginEmail(store);
    addAuditLog({
      adminId: 'master-admin-01',
      adminName: 'Master SuperAdmin',
      storeId: store.id,
      action: 'store_update',
      resource: `Store login email: ${loginEmail}`,
      details: `Login email set to ${next ? 'Active' : 'Inactive'} for ${storeDisplayName}`,
      status: 'success',
      ipAddress: '185.199.108.153',
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
      toast(
        isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address',
        'error',
      );
      return;
    }

    // Another store already owns this login email?
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
        adminName: 'Master SuperAdmin',
        storeId: store.id,
        action: 'store_update',
        resource: `Store login email: ${saved}`,
        details: `Changed login email for ${storeDisplayName} to ${saved}`,
        status: 'success',
        ipAddress: '185.199.108.153',
      });
      toast(
        isAr
          ? `تم تغيير بريد الدخول لـ «${storeDisplayName}» إلى${saved}`
          : `Login email for ${storeDisplayName} changed to ${saved}`,
        'success',
      );
    } catch {
      toast(
        isAr ? 'تعذر حفظ بريد الدخول' : 'Could not save login email',
        'error',
      );
    }
  };

  const [showWhatsAppQuotasModal, setShowWhatsAppQuotasModal] = useState(false);
  const [quotasLoading, setQuotasLoading] = useState(false);
  const [storeQuotas, setStoreQuotas] = useState<MasterStoreWhatsAppQuota[]>([]);
  const [editingQuotas, setEditingQuotas] = useState<Record<string, { daily_limit: number; monthly_limit: number }>>({});
  const [savingQuotaStoreId, setSavingQuotaStoreId] = useState<string | null>(null);

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

  const filtered = stores.filter((s) => {
    const q = searchTerm.toLowerCase().trim();
    const displayName = getStoreDisplayName(s, locale).toLowerCase();
    const displayCategory = getStoreDisplayCategory(s, locale).toLowerCase();
    const displayOwner = getStoreDisplayOwner(s, locale).toLowerCase();
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.nameEn && s.nameEn.toLowerCase().includes(q)) ||
      (s.nameAr && s.nameAr.toLowerCase().includes(q)) ||
      displayName.includes(q) ||
      displayCategory.includes(q) ||
      displayOwner.includes(q) ||
      s.owner.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q);
    const matchPlan = filterPlan === 'All' || s.plan === filterPlan;
    const matchStatus = filterStatus === 'All' || s.status === filterStatus;
    return matchSearch && matchPlan && matchStatus;
  });

  const totalGMV = useMemo(() => {
    const flat = Object.values(allOrders || {}).flat();
    if (flat.length > 0) {
      return flat.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    }
    return stores.reduce((sum, s) => sum + (s.revenue || 0), 0);
  }, [allOrders, stores, cacheEpoch]);

  return (
    <div className="u-page p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-teal-600" />
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'جميع المتاجر والعملاء' : 'All Client Stores & Tenants'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? 'إدارة مركزية للمتاجر: الاشتراكات، عزل قواعد البيانات، النطاقات، وتسجيل الدخول كتاجر.'
              : 'Centralized merchant control: manage subscriptions, database isolation, domains, and impersonation.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleOpenQuotasModal}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer border border-emerald-200/80 dark:border-emerald-500/30"
            title={isAr ? 'إدارة حصص واتساب ومكافحة حظر الأرقام لجميع المتاجر' : 'Manage Store WhatsApp Quotas & Anti-Ban Controls'}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isAr ? 'حصص واتساب (مكافحة الحظر)' : 'WhatsApp Quotas (Anti-Ban)'}</span>
          </button>

          <button
            onClick={async () => {
              await softRefreshTenantData();
              toast(isAr ? 'تم تحديث ومزامنة جميع بيانات المتاجر والمنصة بنجاح' : 'All store & platform data synchronized successfully', 'success');
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer border border-slate-200/80 dark:border-slate-700"
            title={isAr ? 'مزامنة وتحديث بيانات المتاجر' : 'Sync & Refresh Store Data'}
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
            <span>{isAr ? 'مزامنة البيانات' : 'Sync Master Data'}</span>
          </button>

          <button
            onClick={onOpenCreateStore}
            className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إنشاء متجر جديد' : 'Provision New Store'}</span>
          </button>
        </div>
      </div>

      {/* 4 Platform KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <OverviewStatCard
          label={isAr ? 'إجمالي المتاجر' : 'Total Client Stores'}
          value={amount(stores.length)}
          icon={Store}
          tone="accent"
          sparkline={[Math.max(1, stores.length - 2), Math.max(1, stores.length - 1), stores.length]}
          delta={stores.length > 0 ? 100 : null}
          deltaLabel={isAr ? 'مقارنة بالشهر الماضي' : 'vs last month'}
        />
        <OverviewStatCard
          label={t('activeStores') || (isAr ? 'المتاجر النشطة' : 'Active Stores')}
          value={amount(stores.filter((s) => s.status === 'active').length)}
          icon={CheckCircle}
          tone="success"
          sparkline={[
            Math.max(1, stores.filter((s) => s.status === 'active').length - 1),
            stores.filter((s) => s.status === 'active').length,
          ]}
          delta={
            stores.length > 0
              ? Math.round(
                  (stores.filter((s) => s.status === 'active').length / stores.length) * 100,
                )
              : null
          }
          deltaLabel={isAr ? 'من إجمالي المتاجر' : 'operational'}
        />
        <OverviewStatCard
          label={isAr ? 'اشتراك احترافي ومميز' : 'Pro and Premium'}
          value={amount(stores.filter((s) => s.plan === 'pro' || s.plan === 'premium' || s.plan === 'paid').length)}
          icon={Crown}
          tone="warn"
          sparkline={[
            Math.max(0, stores.filter((s) => s.plan === 'pro' || s.plan === 'premium' || s.plan === 'paid').length - 1),
            stores.filter((s) => s.plan === 'pro' || s.plan === 'premium' || s.plan === 'paid').length,
          ]}
          delta={
            stores.length > 0
              ? Math.round(
                  (stores.filter((s) => s.plan === 'pro' || s.plan === 'premium' || s.plan === 'paid').length / stores.length) * 100,
                )
              : null
          }
          deltaLabel={isAr ? 'من إجمالي المتاجر' : 'of all stores'}
        />
        <OverviewStatCard
          label={isAr ? 'إجمالي مبيعات المنصة' : 'Total Platform GMV'}
          value={money(totalGMV)}
          icon={ArrowUpRight}
          tone="info"
          sparkline={[Math.round(totalGMV * 0.7), Math.round(totalGMV * 0.85), totalGMV]}
          delta={totalGMV > 0 ? 100 : null}
          deltaLabel={isAr ? 'إيرادات' : 'revenue'}
        />
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={isAr ? 'البحث عن اسم المتجر أو المالك أو التصنيف...' : 'Search store name, merchant owner, category...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full ps-8 pe-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400">{isAr ? 'الباقة' : 'Plan'}:</span>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="All">{isAr ? 'جميع الباقات' : 'All Plans'}</option>
              <option value="pro">{isAr ? 'تاجر الباقة الاحترافية' : 'Pro Merchant'}</option>
              <option value="free">{isAr ? 'باقة مجانية' : 'Free Tier'}</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400">{isAr ? 'الحالة' : 'Status'}:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="All">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="active">{isAr ? 'نشط' : 'Active'}</option>
              <option value="pending">{isAr ? 'معلق' : 'Pending'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stores Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((store) => {
          const storeProducts = allProducts[store.id] || [];
          const productsCount = storeProducts.length || store.productsCount;
          const storeOrders = allOrders[store.id] || [];
          const ordersCount = storeOrders.length || store.ordersCount;
          const storeRevenue = storeOrders.length
            ? storeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
            : store.revenue;

          const onCentralHost = store.id !== 'store-1';
          const hostAccount = onCentralHost
            ? isAr
              ? 'الاستضافة المركزية'
              : 'Central Hostinger'
            : isAr
              ? 'استضافة الزهور'
              : 'Flowers Hostinger';
          const hostDetail = onCentralHost
            ? isAr
              ? 'القهوة والسيارات والمتاجر الجديدة'
              : 'Coffee, cars, and new stores'
            : isAr
              ? 'حساب منفصل'
              : 'Separate account';

          const realDomain = store.custom_domain || store.domain || store.demo_domain || '';
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
          const planLabel =
            store.plan === 'premium'
              ? isAr
                ? 'مميزة'
                : 'Premium'
              : store.plan === 'pro' || store.plan === 'paid'
                ? isAr
                  ? 'احترافية'
                  : 'Pro'
                : store.plan === 'custom'
                  ? isAr
                    ? 'مخصصة'
                    : 'Custom'
                  : isAr
                    ? 'مجانية'
                    : 'Free';

              const storeDisplayName = getStoreDisplayName(store, locale);
              const storeDisplayCategory = getStoreDisplayCategory(store, locale);
              const storeDisplayOwner = getStoreDisplayOwner(store, locale);

              return (
                <div
                  key={store.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {store.logo ? (
                          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                            <img
                              src={store.logo}
                              alt={storeDisplayName}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs border ${
                            store.id.includes('coffee')
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30'
                              : store.id.includes('bleco') || store.id.includes('car')
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
                          }`}>
                            {store.id.includes('coffee') ? (
                              <Coffee className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                            ) : store.id.includes('bleco') || store.id.includes('car') ? (
                              <Car className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                            ) : (
                              <Flower2 className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                            )}
                          </span>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight truncate">
                            {storeDisplayName}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {storeDisplayCategory} · {isAr ? 'المالك' : 'Owner'}:{' '}
                            <span className="text-slate-700 dark:text-slate-200 font-medium">{storeDisplayOwner}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          toggleStoreStatus(store.id);
                          toast(
                            isAr
                              ? `تم تغيير حالة المتجر «${storeDisplayName}»`
                              : `Status updated for ${storeDisplayName}`,
                            'success',
                          );
                        }}
                        title={isAr ? 'تبديل حالة المتجر' : 'Toggle store status'}
                        aria-label={isAr ? 'تبديل حالة المتجر' : 'Toggle store status'}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 cursor-pointer ${
                          store.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30'
                        }`}
                      >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        store.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span className="capitalize">{statusLabel(store.status)}</span>
                  </button>
                </div>

                {/* Metrics Pill Row */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800 text-center my-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'المنتجات' : 'Products'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">{productsCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'الطلبات' : 'Orders'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">{ordersCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'الإيرادات' : 'Revenue'}</span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">{money(storeRevenue)}</span>
                  </div>
                </div>

                {/* Domain & Hostinger Shared DB details */}
                <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300 mb-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 flex items-center gap-1 shrink-0">
                      <Globe className="w-3 h-3 text-slate-400" /> {isAr ? 'النطاق:' : 'Domain:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard?.writeText(displayDomain);
                        toast(isAr ? 'تم نسخ النطاق' : 'Domain copied', 'success');
                      }}
                      className="font-mono text-slate-700 dark:text-slate-200 font-bold truncate text-end select-all max-w-[210px] cursor-pointer hover:text-teal-700 dark:hover:text-teal-300"
                      title={isAr ? `نسخ${displayDomain}` : `Copy ${displayDomain}`}
                      dir="ltr"
                    >
                      {displayDomain}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 flex items-center gap-1 shrink-0">
                      <Database className="w-3 h-3 text-slate-400" /> {isAr ? 'الاستضافة:' : 'Hosting:'}
                    </span>
                    <span className="font-mono text-slate-700 dark:text-slate-200 truncate text-end">
                      {hostAccount} ({hostDetail})
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 flex items-center gap-1 shrink-0">
                      <ShieldCheck className="w-3 h-3 text-amber-500" /> {isAr ? 'الباقة والمنحة:' : 'Plan & Grant:'}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="uppercase font-mono text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold">
                        {planLabel}
                      </span>
                      {store.masterGrantedPro && (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200/80 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>{isAr ? 'منحة الإدارة' : 'Master Grant'}</span>
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-slate-400 flex items-center gap-1 shrink-0">
                      <CheckCircle className="w-3 h-3 text-emerald-500" /> {isAr ? 'النشر:' : 'Deployment:'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 rounded">
                      {deploymentLabel(store.deployment_status)} ({isAr ? 'شهادة الأمان مفعّلة' : 'SSL Active'})
                    </span>
                  </div>

                  {/* Super Admin Language Availability Control */}
                  <div className="pt-2.5 pb-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
                      <Globe className="w-3.5 h-3.5 text-teal-600" />
                      <span>{isAr ? 'لغات المتجر:' : 'Store Languages:'}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {/* English Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleStoreLanguage(store, 'english')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${
                          (store.languages?.english ?? true)
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                            : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700 line-through'
                        }`}
                        title={isAr ? 'تفعيل / تعطيل الإنجليزية' : 'Toggle English availability'}
                      >
                        <span>🇬🇧 EN</span>
                        <span className="text-[9px]">{(store.languages?.english ?? true) ? 'ON' : 'OFF'}</span>
                      </button>
                      {/* Arabic Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleStoreLanguage(store, 'arabic')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${
                          (store.languages?.arabic ?? true)
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
                            : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700 line-through'
                        }`}
                        title={isAr ? 'تفعيل / تعطيل العربية' : 'Toggle Arabic availability'}
                      >
                        <span>🇸🇦 AR</span>
                        <span className="text-[9px]">{(store.languages?.arabic ?? true) ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Master SuperAdmin only: login email Active/Inactive + Change */}
                  {(() => {
                    const loginEmail = resolveStoreLoginEmail(store);
                    const emailActive = isStoreLoginEmailActive(store.id);
                    const isEditing = editingEmailStoreId === store.id;
                    void emailAccessEpoch;
                    return (
                      <div className="pt-2.5 pb-0.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
                            <Mail className="w-3.5 h-3.5 text-teal-600" />
                            <span>{isAr ? 'بريد دخول المتجر:' : 'Store login email:'}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleLoginEmail(store)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border cursor-pointer transition-colors ${
                              emailActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40'
                                : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/40'
                            }`}
                            title={
                              isAr
                                ? 'تفعيل / تعطيل بريد الدخول (سوبر أدمن فقط)'
                                : 'Activate / deactivate login email (SuperAdmin only)'
                            }
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                emailActive ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            {emailActive
                              ? isAr
                                ? 'نشط'
                                : 'Active'
                              : isAr
                                ? 'غير نشط'
                                : 'Inactive'}
                          </button>
                        </div>

                        {isEditing ? (
                          <div className="space-y-1.5">
                            <input
                              type="email"
                              value={emailDraft}
                              onChange={(e) => setEmailDraft(e.target.value)}
                              dir="ltr"
                              placeholder="name@example.com"
                              className="w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-mono outline-none focus:ring-2 focus:ring-teal-500/30 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                            />
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={cancelEditLoginEmail}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                              >
                                {isAr ? 'إلغاء' : 'Cancel'}
                              </button>
                              <button
                                type="button"
                                onClick={() => saveLoginEmailChange(store)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-teal-600 text-white hover:bg-teal-700 cursor-pointer"
                              >
                                <Save className="w-3 h-3" />
                                {isAr ? 'حفظ البريد' : 'Save email'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className="font-mono text-[10px] text-slate-600 dark:text-slate-300 truncate text-start min-w-0"
                              dir="ltr"
                              title={loginEmail}
                            >
                              {loginEmail}
                            </p>
                            <button
                              type="button"
                              onClick={() => startEditLoginEmail(store)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/30 cursor-pointer shrink-0"
                              title={
                                isAr
                                  ? 'تغيير بريد الدخول (سوبر أدمن فقط)'
                                  : 'Change login email (SuperAdmin only)'
                              }
                            >
                              <Pencil className="w-3 h-3" />
                              {isAr ? 'تغيير' : 'Change'}
                            </button>
                          </div>
                        )}
                        <p className="text-[9px] text-slate-400 dark:text-slate-500">
                          {isAr
                            ? 'تغيير بريد الدخول متاح لسوبر أدمن المنصة فقط'
                            : 'Login email can be changed by platform SuperAdmin only'}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Actions Bottom Bar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      toggleMasterGrant(store.id);
                      addAuditLog({
                        adminId: 'master-admin-01',
                        adminName: 'Master SuperAdmin',
                        storeId: store.id,
                        action: 'plan_change',
                        resource: `Store: ${storeDisplayName}`,
                        details: `Toggled Master Pro Grant (State: ${!store.masterGrantedPro})`,
                        status: 'success',
                        ipAddress: '185.199.108.153',
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
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                      store.masterGrantedPro
                        ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30 dark:hover:bg-amber-500/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}
                    title={isAr ? 'تبديل منحة الباقة الاحترافية المجانية من الإدارة' : 'Toggle Complimentary Master Grant'}
                  >
                    {store.masterGrantedPro
                      ? isAr ? 'إلغاء المنحة' : 'Revoke Grant'
                      : isAr ? 'منح الباقة الاحترافية' : 'Grant Pro'}
                  </button>

                  <label
                    className="flex items-center gap-1.5 px-2 py-1 rounded-xl border text-[10px] font-bold"
                    style={{ borderColor: 'var(--border)' }}
                    title={
                      isAr
                        ? 'عدد قوالب استوديو التصميم المجانية لكل نوع (فارغ = ٥ أو برو غير محدود)'
                        : 'Free Design Studio templates per category (empty = 5, or unlimited on Pro)'
                    }
                  >
                    <span className="text-muted whitespace-nowrap">
                      {isAr ? 'قوالب/نوع' : 'Tpls/type'}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      className="w-12 px-1 py-0.5 rounded-lg border text-[11px] font-mono bg-transparent"
                      style={{ borderColor: 'var(--border)' }}
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
                            adminName: 'Master SuperAdmin',
                            storeId: store.id,
                            action: 'store_update',
                            resource: `Store: ${storeDisplayName}`,
                            details: `Permanently removed store from platform`,
                            status: 'success',
                            ipAddress: '185.199.108.153',
                          });
                          toast(isAr ? `تم حذف «${storeDisplayName}»` : `${storeDisplayName} deleted`, 'success');
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 border border-transparent hover:border-rose-100 dark:hover:border-rose-500/30 rounded-xl transition-colors cursor-pointer"
                      title={isAr ? 'حذف المتجر' : 'Remove Store'}
                      aria-label={isAr ? 'حذف المتجر' : 'Remove Store'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Login as Merchant Button */}
                <button
                  onClick={() => switchToStore(store.id)}
                  className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <span>{isAr ? 'الدخول كمتجر' : 'Login as Store'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-teal-300 rtl:-scale-x-100" />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
            {isAr ? 'لا توجد متاجر مطابقة لعوامل التصفية الحالية.' : 'No stores match the current filters.'}
          </div>
        )}
      </div>

      {/* Master WhatsApp Quotas & Anti-Ban Modal */}
      {showWhatsAppQuotasModal && (
        <GlobalModal
          isOpen
          onClose={() => setShowWhatsAppQuotasModal(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'إدارة حصص واتساب ومكافحة حظر الأرقام' : 'Store WhatsApp Quotas & Anti-Ban Safeguards'}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>
                      {isAr
                        ? 'إدارة حصص واتساب ومكافحة حظر الأرقام'
                        : 'Store WhatsApp Quotas & Anti-Ban Safeguards'}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                      {isAr ? 'الإدارة العامة' : 'Master Admin'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'التحكم المركزي في سقف الرسائل الآلية لكل متجر لحماية شرائح وأرقام التجار من حظر ميتا'
                      : 'Centralized control: configure daily & monthly automated limits to protect merchant numbers from Meta spam flags'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppQuotasModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Anti-Ban Protection Policy Card */}
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    {isAr
                      ? 'سياسة الأمان الافتراضية: 10 رسائل/يومياً و 50 رسائل/شهرياً'
                      : 'Default Anti-Ban Safety: 10 msgs/day & 50 msgs/month'}
                  </span>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 mt-0.5">
                    {isAr
                      ? 'خوارزميات ميتا تقوم بحظر الأرقام الجديدة عند إرسال رسائل جماعية مفاجئة. الرسائل اليدوية عبر واتساب المباشر مجانية بالكامل مدى الحياة بدون حدود وبدون خطر الحظر.'
                      : 'Meta spam filters flag phone numbers sending bulk automated messages without prior customer opt-in. The Direct WhatsApp option is 100% Free Lifetime with zero quota limits.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body: Stores Quota Table */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {quotasLoading ? (
                <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-teal-600" />
                  <span>{isAr ? 'جاري تحميل بيانات حصص المتاجر...' : 'Loading store quota records...'}</span>
                </div>
              ) : storeQuotas.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  {isAr ? 'لا توجد بيانات حصص متاحة حالياً.' : 'No store quota records found.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {storeQuotas.map((q) => {
                    const edit = editingQuotas[q.store_id] || { daily_limit: q.daily_limit, monthly_limit: q.monthly_limit };
                    const isSaving = savingQuotaStoreId === q.store_id;
                    const isNearDaily = q.daily_used >= q.daily_limit;
                    const isNearMonthly = q.monthly_used >= q.monthly_limit;

                    return (
                      <div
                        key={q.store_id}
                        className="p-3.5 bg-white dark:bg-slate-900/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        {/* Store Info */}
                        <div className="min-w-[180px]">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{isAr ? q.store_name_ar || q.store_name : q.store_name}</span>
                            {q.is_connected ? (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                                {isAr ? 'متصل بـ ميتا' : 'Connected'}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                {isAr ? 'غير متصل' : 'Not Connected'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {q.sender_phone || q.store_id}
                          </div>
                        </div>

                        {/* Quota Form Controls */}
                        <div className="flex flex-wrap items-center gap-4">
                          {/* Daily Quota */}
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                {isAr ? 'الحد اليومي' : 'Daily Limit'}
                              </span>
                              <input
                                type="number"
                                min={1}
                                max={500}
                                value={edit.daily_limit}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  setEditingQuotas((prev) => ({
                                    ...prev,
                                    [q.store_id]: { ...edit, daily_limit: val },
                                  }));
                                }}
                                className="w-20 px-2 py-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 self-end pb-1 font-mono">
                              <span className={isNearDaily ? 'text-rose-600 font-bold' : ''}>
                                {q.daily_used}
                              </span>
                              /{edit.daily_limit} {isAr ? 'مستخدم اليوم' : 'used'}
                            </div>
                          </div>

                          {/* Monthly Quota */}
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                {isAr ? 'الحد الشهري' : 'Monthly Limit'}
                              </span>
                              <input
                                type="number"
                                min={1}
                                max={2000}
                                value={edit.monthly_limit}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  setEditingQuotas((prev) => ({
                                    ...prev,
                                    [q.store_id]: { ...edit, monthly_limit: val },
                                  }));
                                }}
                                className="w-20 px-2 py-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 self-end pb-1 font-mono">
                              <span className={isNearMonthly ? 'text-rose-600 font-bold' : ''}>
                                {q.monthly_used}
                              </span>
                              /{edit.monthly_limit} {isAr ? 'مستخدم هذا الشهر' : 'used'}
                            </div>
                          </div>

                          {/* Save Button */}
                          <button
                            onClick={() => handleSaveStoreQuota(q.store_id)}
                            disabled={isSaving}
                            className="self-end px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title={isAr ? 'حفظ الحصة للمتجر' : 'Save Quota'}
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

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'يتم تطبيق الحدود فورياً على واجهات المتاجر وحفظها في قاعدة البيانات'
                  : 'Changes are written to MySQL store_settings and enforced immediately in real-time'}
              </span>
              <button
                onClick={() => setShowWhatsAppQuotasModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
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

