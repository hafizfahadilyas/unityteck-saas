import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  fetchMasterSubscriptions,
  fetchPlansCatalog,
  patchStoreSubscription,
} from '../../api/tenantApi';
import {
  Crown,
  RefreshCw,
  Users,
  AlertTriangle,
  Layers,
  CheckCircle,
  Check,
  Sparkles,
  Gem,
  Shield,
  Zap,
} from 'lucide-react';
import { GlobalModal } from '../common/GlobalModal';
import { OverviewStatCard } from '../common/OverviewStatCard';
import {
  MasterKpiGrid,
  MasterMetaLine,
  MasterTabPills,
  masterGhostBtnClass,
} from './MasterUiKit';
import { MasterStoreScopeFilter } from './MasterStoreScopeFilter';
import { useTenant } from '../../context/TenantContext';
import { AdvancedDataTable, type AdvancedTableColumn } from '../common/AdvancedDataTable';
import { AdvancedFilterBar } from '../common/AdvancedFilterBar';
import { pipelineAdvancedList, useAdvancedListState } from '../../hooks/useAdvancedListState';

type TabKey = 'plans' | 'subscriptions';

const FEATURE_LABELS: Record<string, { en: string; ar: string }> = {
  catalog: { en: 'Product catalog', ar: 'كتالوج المنتجات' },
  orders: { en: 'Orders management', ar: 'إدارة الطلبات' },
  basic_seo: { en: 'Basic search optimization', ar: 'تحسين بحث أساسي' },
  seo: { en: 'Search optimization', ar: 'تحسين محركات البحث' },
  coupons: { en: 'Coupons & offers', ar: 'القسائم والعروض' },
  shipping: { en: 'Shipping rules', ar: 'قواعد الشحن' },
  themes_basic: { en: 'Basic themes', ar: 'قوالب أساسية' },
  themes: { en: 'Full theme studio', ar: 'استوديو القوالب الكامل' },
  backups: { en: 'Store backups', ar: 'النسخ الاحتياطي للمتجر' },
  zatca: { en: 'E-invoicing compliance', ar: 'الامتثال للفوترة الإلكترونية' },
  analytics: { en: 'Analytics', ar: 'التحليلات' },
  reports: { en: 'Reports', ar: 'التقارير' },
  ai: { en: 'AI creative tools', ar: 'أدوات الذكاء الاصطناعي' },
  media_studio: { en: 'Media studio', ar: 'استوديو الوسائط' },
  custom_domain: { en: 'Custom domain', ar: 'نطاق مخصص' },
  whatsapp: { en: 'WhatsApp messaging', ar: 'رسائل واتساب' },
  social: { en: 'Social publishing', ar: 'النشر على التواصل' },
  api_access: { en: 'API access', ar: 'وصول واجهة البرمجة' },
  advanced_seo: { en: 'Advanced search optimization', ar: 'تحسين بحث متقدم' },
  advanced_analytics: { en: 'Advanced analytics', ar: 'تحليلات متقدمة' },
  all: { en: 'All platform features', ar: 'جميع ميزات المنصة' },
};

const PLAN_ICONS: Record<string, typeof Crown> = {
  free: Shield,
  paid: Zap,
  pro: Crown,
  premium: Gem,
  custom: Sparkles,
};

function formatStorageMb(mb: unknown, isAr: boolean): string {
  if (mb == null) return '∞';
  const n = Number(mb);
  if (!Number.isFinite(n)) return '∞';
  if (n >= 1024) {
    const gb = n / 1024;
    const label = Number.isInteger(gb) ? String(gb) : gb.toFixed(1);
    return isAr ? `${label} جيجابايت` : `${label} GB`;
  }
  return isAr ? `${n} ميجابايت` : `${n} MB`;
}

function formatLimit(v: unknown): string {
  if (v == null) return '∞';
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : '∞';
}

function featureLabel(code: string, isAr: boolean): string {
  const hit = FEATURE_LABELS[code];
  if (hit) return isAr ? hit.ar : hit.en;
  return code.replace(/_/g, ' ');
}

/** SOUQ PLUS Phase 1 §4.4 — plan catalogue + subscription lifecycle (real API). */
export const MasterPlansSubscriptions: React.FC = () => {
  const { locale, money, amount } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const { stores } = useTenant();
  const [storeScope, setStoreScope] = useState<string>('all');
  const [storeScopeStatus, setStoreScopeStatus] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [tab, setTab] = useState<TabKey>('plans');
  const [busy, setBusy] = useState(false);
  const [plans, setPlans] = useState<Array<Record<string, unknown>>>([]);
  const [subs, setSubs] = useState<Array<Record<string, unknown>>>([]);
  const [meta, setMeta] = useState<{ near_expiry?: number; last_refresh?: string; source?: string }>({});
  const [edit, setEdit] = useState<Record<string, unknown> | null>(null);
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('active');
  const [saving, setSaving] = useState(false);
  const list = useAdvancedListState({
    initialPageSize: 10,
    initialSortKey: 'store',
    initialSortDir: 'asc',
    initialFilters: { status: 'all', plan: 'all' },
  });

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [p, s] = await Promise.all([fetchPlansCatalog(), fetchMasterSubscriptions()]);
      setPlans(Array.isArray(p?.data) ? p.data : []);
      setSubs(Array.isArray(s?.data) ? s.data : []);
      setMeta(s?.meta || {});
    } catch (e) {
      toast(
        isAr ? 'تعذر تحميل الباقات أو الاشتراكات' : 'Failed to load plans or subscriptions',
        'error',
      );
      setPlans([]);
      setSubs([]);
    } finally {
      setBusy(false);
    }
  }, [isAr, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const subStats = useMemo(() => {
    let active = 0;
    let expired = 0;
    let trial = 0;
    for (const row of subs) {
      const life = (row.lifecycle || {}) as Record<string, unknown>;
      const st = String(life.status || '');
      if (st === 'active') active += 1;
      if (st === 'expired' || st === 'suspended') expired += 1;
      if (st === 'trial') trial += 1;
    }
    return {
      plans: plans.length,
      subs: subs.length,
      active,
      expired,
      trial,
      near: meta.near_expiry ?? 0,
    };
  }, [plans.length, subs, meta.near_expiry]);

  const scopedSubs = useMemo(() => {
    if (storeScope === 'all') return subs;
    return subs.filter((r) => String(r.store_id) === storeScope);
  }, [subs, storeScope]);

  const planOptions = useMemo(() => {
    const set = new Set<string>();
    for (const row of subs) {
      const p = String(row.plan || '').trim();
      if (p) set.add(p);
    }
    return Array.from(set).sort();
  }, [subs]);

  const subsPipeline = useMemo(
    () =>
      pipelineAdvancedList({
        rows: scopedSubs,
        search: list.search,
        getSearchBlob: (row) =>
          `${row.store_id} ${row.store_name} ${row.plan} ${JSON.stringify(row.lifecycle)}`,
        filters: list.filters,
        matchFilter: (row, key, value) => {
          const life = (row.lifecycle || {}) as Record<string, unknown>;
          if (key === 'status') return String(life.status || '') === value;
          if (key === 'plan') return String(row.plan || '') === value;
          return true;
        },
        dateFrom: list.dateFrom,
        dateTo: list.dateTo,
        getDate: (row) => {
          const life = (row.lifecycle || {}) as Record<string, unknown>;
          return life.ends_at ? String(life.ends_at) : null;
        },
        sortKey: list.sortKey,
        sortDir: list.sortDir,
        getSortValue: (row, key) => {
          const life = (row.lifecycle || {}) as Record<string, unknown>;
          if (key === 'store') return String(row.store_name || row.store_id || '');
          if (key === 'plan') return String(row.plan || '');
          if (key === 'status') return String(life.status || '');
          if (key === 'ends') return life.ends_at ? String(life.ends_at) : '';
          return '';
        },
        page: list.page,
        pageSize: list.pageSize,
      }),
    [scopedSubs, list],
  );

  const subscribersByPlan = useMemo(() => {
    const map = new Map<string, number>();
    // Prefer live subscription rows; fall back to platform stores.plan when API list empty
    const source =
      subs.length > 0
        ? subs.map((row) => String(row.plan || '').toLowerCase())
        : stores.map((s) => String(s.plan || '').toLowerCase());
    for (const code of source) {
      if (!code) continue;
      map.set(code, (map.get(code) || 0) + 1);
    }
    return map;
  }, [subs, stores]);

  const openPlanSubs = (planCode: string) => {
    setTab('subscriptions');
    list.setFilter('plan', planCode);
    list.setSearch('');
  };

  const openEdit = (row: Record<string, unknown>) => {
    const life = (row.lifecycle || {}) as Record<string, unknown>;
    setEdit(row);
    setStatus(String(life.status || 'active'));
    setReason('');
  };

  const saveEdit = async () => {
    if (!edit?.store_id) return;
    if (!reason.trim()) {
      toast(isAr ? 'سبب التغيير مطلوب' : 'Reason is required', 'error');
      return;
    }
    setSaving(true);
    try {
      await patchStoreSubscription(String(edit.store_id), {
        status,
        reason: reason.trim(),
      });
      toast(isAr ? 'تم تحديث الاشتراك' : 'Subscription updated', 'success');
      setEdit(null);
      await load();
    } catch {
      toast(isAr ? 'فشل تحديث الاشتراك' : 'Subscription update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = (s: string) => {
    const map: Record<string, { en: string; ar: string }> = {
      trial: { en: 'Trial', ar: 'تجريبي' },
      active: { en: 'Active', ar: 'نشط' },
      grace: { en: 'Grace', ar: 'مهلة' },
      expired: { en: 'Expired', ar: 'منتهي' },
      suspended: { en: 'Suspended', ar: 'موقوف' },
      cancelled: { en: 'Cancelled', ar: 'ملغى' },
    };
    const hit = map[s] || { en: s || 'Unknown', ar: s || 'غير معروف' };
    return isAr ? hit.ar : hit.en;
  };

  const subColumns = useMemo<AdvancedTableColumn<Record<string, unknown>>[]>(
    () => [
      {
        key: 'store',
        header: isAr ? 'المتجر' : 'Store',
        sortable: true,
        render: (row) => (
          <div>
            <div className="font-semibold">{String(row.store_name || row.store_id)}</div>
            <div className="text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
              {String(row.store_id)}
            </div>
          </div>
        ),
      },
      {
        key: 'plan',
        header: isAr ? 'الباقة' : 'Plan',
        sortable: true,
        render: (row) => (
          <span className="capitalize" style={{ color: 'var(--muted)' }}>
            {String(row.plan || '—')}
          </span>
        ),
      },
      {
        key: 'status',
        header: isAr ? 'الحالة' : 'Status',
        sortable: true,
        render: (row) => {
          const life = (row.lifecycle || {}) as Record<string, unknown>;
          return statusLabel(String(life.status || ''));
        },
      },
      {
        key: 'ends',
        header: isAr ? 'ينتهي' : 'Ends',
        sortable: true,
        render: (row) => {
          const life = (row.lifecycle || {}) as Record<string, unknown>;
          return (
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {life.ends_at ? String(life.ends_at).slice(0, 10) : '—'}
            </span>
          );
        },
      },
      {
        key: 'action',
        header: isAr ? 'إجراء' : 'Action',
        render: (row) => (
          <button
            type="button"
            className="text-xs font-bold"
            style={{ color: 'var(--accent)' }}
            onClick={() => openEdit(row)}
          >
            {isAr ? 'تعديل' : 'Edit'}
          </button>
        ),
      },
    ],
    [isAr],
  );

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'الاشتراكات والباقات' : 'Subscriptions & Plans'}
        subtitle={
          isAr
            ? 'كتالوج الباقات ودورة اشتراك التجار — مصدر حقيقي فقط'
            : 'Plan catalogue and merchant subscription lifecycle — live source only'
        }
        actions={
          <button
            type="button"
            className={masterGhostBtnClass}
            onClick={() => void load()}
            disabled={busy}
            aria-busy={busy}
          >
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} aria-hidden />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        }
      />

      <MasterTabPills
        className="mt-4"
        active={tab}
        onChange={(id) => setTab(id as TabKey)}
        tabs={[
          { id: 'plans', label: isAr ? 'الباقات' : 'Plans' },
          { id: 'subscriptions', label: isAr ? 'الاشتراكات' : 'Subscriptions' },
        ]}
      />

      <MasterMetaLine>
        {isAr ? 'آخر تحديث' : 'Last refresh'}: {meta.last_refresh || '—'} ·{' '}
        {isAr ? 'المصدر' : 'Source'}: {meta.source || 'plans/subscriptions'} ·{' '}
        {isAr ? 'قرب الانتهاء' : 'Near expiry'}: {meta.near_expiry ?? 0} ·{' '}
        {isAr ? 'متاجر المنصة' : 'Platform stores'}: {amount(stores.length)}
      </MasterMetaLine>

      <MasterKpiGrid className="mt-3" cols={5}>
        <OverviewStatCard
          label={isAr ? 'باقات الكتالوج' : 'Plan tiers'}
          value={amount(subStats.plans)}
          icon={Layers}
          tone="accent"
        />
        <OverviewStatCard
          label={isAr ? 'الاشتراكات' : 'Subscriptions'}
          value={amount(subStats.subs)}
          icon={Users}
          tone="info"
        />
        <OverviewStatCard
          label={isAr ? 'نشطة' : 'Active'}
          value={amount(subStats.active)}
          icon={CheckCircle}
          tone="success"
        />
        <OverviewStatCard
          label={isAr ? 'تجريبية' : 'Trial'}
          value={amount(subStats.trial)}
          icon={Crown}
          tone="warn"
        />
        <OverviewStatCard
          label={isAr ? 'قرب الانتهاء' : 'Near expiry'}
          value={amount(subStats.near)}
          icon={AlertTriangle}
          tone="danger"
        />
      </MasterKpiGrid>

      {tab === 'plans' ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0 w-full max-w-full overflow-x-hidden">
          {busy && plans.length === 0 ? (
            <div className="text-sm col-span-full" style={{ color: 'var(--muted)' }}>
              {isAr ? 'جاري التحميل…' : 'Loading…'}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-sm col-span-full" style={{ color: 'var(--muted)' }}>
              {isAr ? 'لا توجد باقات' : 'No records found'}
            </div>
          ) : (
            plans.map((p) => {
              const code = String(p.code || '').toLowerCase();
              const featured = code === 'pro' || code === 'premium';
              const Icon = PLAN_ICONS[code] || Crown;
              const features = Array.isArray(p.features)
                ? (p.features as string[])
                : [];
              const subCount = subscribersByPlan.get(code) || 0;
              const planNameAr = p.name_ar != null ? String(p.name_ar) : '';
              const planNameEn = String(p.name || p.code || '');
              const planTitle = isAr && planNameAr ? planNameAr : planNameEn;
              const priceLabel =
                p.price_sar == null
                  ? isAr
                    ? 'سعر مخصص'
                    : 'Custom pricing'
                  : money(Number(p.price_sar) || 0);
              const periodNote =
                p.price_sar == null
                  ? isAr
                    ? 'يُحدد حسب الاتفاق'
                    : 'Set per agreement'
                  : isAr
                    ? 'شهرياً · بالريال السعودي'
                    : 'Per month · Saudi Riyal';

              return (
                <article
                  key={String(p.id || p.code)}
                  className={`u-plan-luxe min-w-0${featured ? ' u-plan-luxe--featured' : ''}`}
                >
                  {featured ? (
                    <span className="u-plan-luxe__badge">
                      {code === 'premium'
                        ? isAr
                          ? 'الأعلى'
                          : 'Top tier'
                        : isAr
                          ? 'الأكثر اختياراً'
                          : 'Popular'}
                    </span>
                  ) : null}

                  <div className="u-plan-luxe__head">
                    <span className="u-plan-luxe__icon" aria-hidden>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 pe-10">
                      <h3 className="u-plan-luxe__title">{planTitle}</h3>
                      <p className="u-plan-luxe__code">{code || '—'}</p>
                    </div>
                  </div>

                  <div className="u-plan-luxe__price">
                    <div className="u-plan-luxe__price-value">{priceLabel}</div>
                    <div className="u-plan-luxe__price-note">{periodNote}</div>
                  </div>

                  <div className="u-plan-luxe__specs">
                    <div className="u-plan-luxe__spec">
                      <span className="u-plan-luxe__spec-label">
                        {isAr ? 'المنتجات' : 'Products'}
                      </span>
                      <span className="u-plan-luxe__spec-value">
                        {formatLimit(p.product_limit)}
                      </span>
                    </div>
                    <div className="u-plan-luxe__spec">
                      <span className="u-plan-luxe__spec-label">
                        {isAr ? 'الطلبات' : 'Orders'}
                      </span>
                      <span className="u-plan-luxe__spec-value">
                        {formatLimit(p.order_limit)}
                      </span>
                    </div>
                    <div className="u-plan-luxe__spec">
                      <span className="u-plan-luxe__spec-label">
                        {isAr ? 'التخزين' : 'Storage'}
                      </span>
                      <span className="u-plan-luxe__spec-value">
                        {formatStorageMb(p.storage_mb, isAr)}
                      </span>
                    </div>
                    <div className="u-plan-luxe__spec">
                      <span className="u-plan-luxe__spec-label">
                        {isAr ? 'مقاعد الفريق' : 'Team seats'}
                      </span>
                      <span className="u-plan-luxe__spec-value">
                        {formatLimit(p.team_seats)}
                      </span>
                    </div>
                  </div>

                  <ul className="u-plan-luxe__features">
                    {features.length === 0 ? (
                      <li className="u-plan-luxe__feature" style={{ color: 'var(--plan-muted)' }}>
                        {isAr ? 'لا ميزات مدرجة' : 'No features listed'}
                      </li>
                    ) : (
                      features.map((f) => (
                        <li key={f} className="u-plan-luxe__feature">
                          <Check className="u-plan-luxe__feature-icon" aria-hidden />
                          <span>{featureLabel(f, isAr)}</span>
                        </li>
                      ))
                    )}
                  </ul>

                  <div className="u-plan-luxe__foot">
                    <span className="u-plan-luxe__subs">
                      <Users className="w-3 h-3" aria-hidden />
                      {isAr
                        ? `${amount(subCount)} مشترك`
                        : `${amount(subCount)} subscriber${subCount === 1 ? '' : 's'}`}
                    </span>
                    <button
                      type="button"
                      className="u-plan-luxe__cta"
                      onClick={() => openPlanSubs(String(p.code || p.id || ''))}
                    >
                      {isAr ? 'عرض المشتركين' : 'View subscribers'}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3 min-w-0">
          <MasterStoreScopeFilter
            value={storeScope}
            onChange={setStoreScope}
            statusFilter={storeScopeStatus}
            onStatusFilterChange={setStoreScopeStatus}
            showStatusChips
          />
          <AdvancedDataTable
            rows={subsPipeline.pageRows}
            columns={subColumns}
            rowKey={(row) => String(row.store_id)}
            search={list.search}
            onSearchChange={list.setSearch}
            searchPlaceholder={isAr ? 'بحث بالمتجر أو الباقة…' : 'Search store or plan…'}
            sortKey={list.sortKey}
            sortDir={list.sortDir}
            onSort={list.onSort}
            page={subsPipeline.safePage}
            pageSize={list.pageSize}
            onPageChange={list.setPage}
            onPageSizeChange={list.setPageSize}
            total={subsPipeline.total}
            loading={busy && subs.length === 0}
            emptyMessage={isAr ? 'لا توجد سجلات' : 'No records found'}
            filters={
              <AdvancedFilterBar
                filterValues={list.filters}
                onFilterChange={list.setFilter}
                dateFrom={list.dateFrom}
                dateTo={list.dateTo}
                onDateFromChange={list.setDateFrom}
                onDateToChange={list.setDateTo}
                onReset={list.resetAll}
                activeCount={list.activeFilterCount}
                fields={[
                  {
                    key: 'status',
                    label: isAr ? 'الحالة' : 'Status',
                    options: [
                      { value: 'all', label: isAr ? 'كل الحالات' : 'All statuses' },
                      ...['trial', 'active', 'grace', 'expired', 'suspended'].map((s) => ({
                        value: s,
                        label: statusLabel(s),
                      })),
                    ],
                  },
                  {
                    key: 'plan',
                    label: isAr ? 'الباقة' : 'Plan',
                    options: [
                      { value: 'all', label: isAr ? 'كل الباقات' : 'All plans' },
                      ...planOptions.map((p) => ({ value: p, label: p })),
                    ],
                  },
                ]}
              />
            }
          />
        </div>
      )}

      <GlobalModal
        isOpen={!!edit}
        onClose={() => setEdit(null)}
        aria-label={isAr ? 'تحديث الاشتراك' : 'Update subscription'}
      >
        <div
          className="rounded-2xl border max-w-md w-full p-5 space-y-3 shadow-xl"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>
            {isAr ? 'تحديث الاشتراك' : 'Update subscription'}
          </h2>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {String(edit?.store_name || '')} · {String(edit?.store_id || '')}
          </p>
          <label className="block text-xs font-semibold" style={{ color: 'var(--text)' }}>
            {isAr ? 'الحالة' : 'Status'}
            <select
              className="mt-1 w-full rounded-xl border text-sm py-2 px-3 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {['trial', 'active', 'grace', 'expired', 'suspended'].map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold" style={{ color: 'var(--text)' }}>
            {isAr ? 'السبب (إلزامي)' : 'Reason (required)'}
            <textarea
              className="mt-1 w-full rounded-xl border text-sm py-2 px-3 bg-transparent min-h-[80px]"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => setEdit(null)}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              className="unity-btn-primary text-sm"
              onClick={() => void saveEdit()}
              disabled={saving}
              aria-busy={saving}
            >
              {isAr ? 'حفظ' : 'Save'}
            </button>
          </div>
        </div>
      </GlobalModal>
    </AdminPageShell>
  );
};
