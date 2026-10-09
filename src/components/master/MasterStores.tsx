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
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Globe, 
  Database,
  ArrowUpRight,
  Flower2,
  Crown
} from 'lucide-react';

import { usePrefs } from '../../i18n/PrefsContext';
import { OverviewStatCard } from '../common/OverviewStatCard';
import { useToast } from '../common/ToastProvider';

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
    updateStoreLanguages,
    deleteStore,
    addAuditLog,
    allProducts,
    allOrders,
    cacheEpoch,
  } = useTenant();
  const { t, money, amount, locale } = usePrefs();
  const { toast, confirm: confirmDialog } = useToast();
  const isAr = locale === 'ar';
  const loc = isAr ? 'ar-SA' : 'en-US';

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
    updateStoreLanguages(store.id, next);
    addAuditLog({
      adminId: 'master-admin-01',
      adminName: 'Master SuperAdmin',
      storeId: store.id,
      action: 'store_update',
      resource: `Store: ${store.name}`,
      details: `Language availability: English ${next.english ? 'ON' : 'OFF'}, Arabic ${next.arabic ? 'ON' : 'OFF'}`,
      status: 'success',
      ipAddress: '185.199.108.153',
    });
    toast(
      isAr
        ? `تم تحديث لغات المتجر «${store.name}» (الإنجليزية: ${next.english ? 'مفعلة' : 'معطلة'}، العربية: ${next.arabic ? 'مفعلة' : 'معطلة'})`
        : `Language updated for ${store.name}: English ${next.english ? 'ON' : 'OFF'}, Arabic ${next.arabic ? 'ON' : 'OFF'}`,
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

  const filtered = stores.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase());
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
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-teal-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {isAr ? 'جميع المتاجر والعملاء' : 'All Client Stores & Tenants'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAr
              ? 'إدارة مركزية للمتاجر: الاشتراكات، عزل قواعد البيانات، النطاقات، وتسجيل الدخول كتاجر.'
              : 'Centralized merchant control: manage subscriptions, database isolation, domains, and impersonation.'}
          </p>
        </div>

        <button
          onClick={onOpenCreateStore}
          className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إنشاء متجر جديد' : 'Provision New Store'}</span>
        </button>
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
          label={isAr ? 'تجار باقة Pro' : 'Pro Tier Merchants'}
          value={amount(stores.filter((s) => s.plan === 'pro').length)}
          icon={Crown}
          tone="warn"
          sparkline={[
            Math.max(0, stores.filter((s) => s.plan === 'pro').length - 1),
            stores.filter((s) => s.plan === 'pro').length,
          ]}
          delta={
            stores.length > 0
              ? Math.round(
                  (stores.filter((s) => s.plan === 'pro').length / stores.length) * 100,
                )
              : null
          }
          deltaLabel={isAr ? 'نسبة Pro' : 'high tier'}
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
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={isAr ? 'البحث عن اسم المتجر أو المالك أو التصنيف...' : 'Search store name, merchant owner, category...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full ps-8 pe-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">{isAr ? 'الباقة' : 'Plan'}:</span>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            >
              <option value="All">{isAr ? 'جميع الباقات' : 'All Plans'}</option>
              <option value="pro">{isAr ? 'تاجر برو Pro' : 'Pro Merchant'}</option>
              <option value="free">{isAr ? 'باقة مجانية' : 'Free Tier'}</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500">{isAr ? 'الحالة' : 'Status'}:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
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

          const hostingerId =
            store.hosting_id ||
            `hst_${store.id.replace(/^store[-_]?/i, 're-') || 'shared_01'}`;

          const displayDomain =
            store.custom_domain ||
            store.demo_domain ||
            `${store.slug || store.id}.saasdomain.com`;

          return (
            <div
              key={store.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30 flex items-center justify-center shrink-0 shadow-2xs border border-emerald-200">
                      <Flower2 className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 leading-tight truncate">
                        {store.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {store.category} · {isAr ? 'المالك' : 'Owner'}:{' '}
                        <span className="text-slate-700 font-medium">{store.owner}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      toggleStoreStatus(store.id);
                      toast(
                        isAr
                          ? `تم تغيير حالة المتجر «${store.name}»`
                          : `Status updated for ${store.name}`,
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
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center my-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'المنتجات' : 'Products'}</span>
                    <span className="font-bold text-slate-800 tabular-nums">{productsCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'الطلبات' : 'Orders'}</span>
                    <span className="font-bold text-slate-800 tabular-nums">{ordersCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'الإيرادات' : 'Revenue'}</span>
                    <span className="font-bold text-slate-900 tabular-nums">{money(storeRevenue)}</span>
                  </div>
                </div>

                {/* Domain & Hostinger Shared DB details */}
                <div className="space-y-2 text-[11px] text-slate-600 mb-4">
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
                      className="font-mono text-slate-700 font-bold truncate text-end select-all max-w-[210px] cursor-pointer hover:text-teal-700 dark:hover:text-teal-300"
                      title={isAr ? `نسخ ${displayDomain}` : `Copy ${displayDomain}`}
                      dir="ltr"
                    >
                      {displayDomain}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 flex items-center gap-1 shrink-0">
                      <Database className="w-3 h-3 text-slate-400" /> {isAr ? 'استضافة Hostinger المشتركة:' : 'Hostinger Shared:'}
                    </span>
                    <span className="font-mono text-slate-700 truncate text-end">
                      {hostingerId} ({isAr ? 'MySQL معزولة' : 'MySQL isolated'})
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 flex items-center gap-1 shrink-0">
                      <ShieldCheck className="w-3 h-3 text-amber-500" /> {isAr ? 'الباقة والمنحة:' : 'Plan & Grant:'}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="uppercase font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                        {store.plan === 'pro' ? 'Pro' : isAr ? 'مجانية' : store.plan}
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
                      {deploymentLabel(store.deployment_status)} ({isAr ? 'SSL مفعّل' : 'SSL Active'})
                    </span>
                  </div>

                  {/* Super Admin Language Availability Control */}
                  <div className="pt-2.5 pb-1 border-t border-slate-100 flex items-center justify-between gap-2">
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
                </div>
              </div>

              {/* Actions Bottom Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      toggleMasterGrant(store.id);
                      addAuditLog({
                        adminId: 'master-admin-01',
                        adminName: 'Master SuperAdmin',
                        storeId: store.id,
                        action: 'plan_change',
                        resource: `Store: ${store.name}`,
                        details: `Toggled Master Pro Grant (State: ${!store.masterGrantedPro})`,
                        status: 'success',
                        ipAddress: '185.199.108.153',
                      });
                      toast(
                        store.masterGrantedPro
                          ? isAr
                            ? `تم إلغاء منحة Pro لـ «${store.name}»`
                            : `Pro grant revoked for ${store.name}`
                          : isAr
                            ? `تم منح باقة Pro لـ «${store.name}»`
                            : `Pro granted to ${store.name}`,
                        'success',
                      );
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                      store.masterGrantedPro
                        ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30 dark:hover:bg-amber-500/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title={isAr ? 'تبديل منحة Pro المجانية من الإدارة' : 'Toggle Complimentary Master Grant'}
                  >
                    {store.masterGrantedPro
                      ? isAr ? 'إلغاء المنحة' : 'Revoke Grant'
                      : isAr ? 'منح Pro' : 'Grant Pro'}
                  </button>

                  <button
                    onClick={async () => {
                      const ok = await confirmDialog({
                        title: isAr ? 'حذف المتجر' : 'Delete store',
                        message: isAr
                          ? `هل أنت متأكد من حذف «${store.name}»؟ لا يمكن التراجع عن هذا الإجراء.`
                          : `Are you sure you want to delete ${store.name}? This cannot be undone.`,
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
                          resource: `Store: ${store.name}`,
                          details: `Permanently removed store from platform`,
                          status: 'success',
                          ipAddress: '185.199.108.153',
                        });
                        toast(isAr ? `تم حذف «${store.name}»` : `${store.name} deleted`, 'success');
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 border border-transparent hover:border-rose-100 dark:hover:border-rose-500/30 rounded-xl transition-colors cursor-pointer"
                    title={isAr ? 'حذف المتجر' : 'Remove Store'}
                    aria-label={isAr ? 'حذف المتجر' : 'Remove Store'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
    </div>
  );
};

