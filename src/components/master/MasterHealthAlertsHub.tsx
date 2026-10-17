import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Store as StoreIcon,
  Globe,
  CreditCard,
  Truck,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  auditPlatformHealth,
  type AlertSeverity,
  type HealthCategory,
  type HealthIssue,
} from '../../utils/healthCheck';

interface MasterHealthAlertsHubProps {
  onNavigateTab?: (tab: string) => void;
  className?: string;
}

export const MasterHealthAlertsHub: React.FC<MasterHealthAlertsHubProps> = ({
  onNavigateTab,
  className = '',
}) => {
  const {
    stores,
    seoConfigs,
    allPaymentGateways,
    allCouriers,
    allShipping,
    allProducts,
    allOrders,
    switchToStore,
    updateStoreSEOConfig,
    addShippingCity,
    savePaymentGatewayConfig,
  } = useTenant();
  const { locale, t } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<HealthCategory | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<AlertSeverity | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoFixingAll, setIsAutoFixingAll] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const platformHealth = useMemo(() => {
    return auditPlatformHealth({
      stores,
      seoConfigs,
      allPaymentGateways,
      allCouriers,
      allShipping,
      allProducts,
      allOrders,
    });
  }, [
    stores,
    seoConfigs,
    allPaymentGateways,
    allCouriers,
    allShipping,
    allProducts,
    allOrders,
  ]);

  const filteredIssues = useMemo(() => {
    return platformHealth.allIssues.filter((issue) => {
      if (selectedCategory !== 'all' && issue.category !== selectedCategory) return false;
      if (selectedSeverity !== 'all' && issue.severity !== selectedSeverity) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const text = `${issue.storeName} ${issue.title} ${issue.titleAr} ${issue.description} ${issue.descriptionAr} ${issue.category}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
  }, [platformHealth.allIssues, selectedCategory, selectedSeverity, searchQuery]);

  const handleAutoFixSingle = async (issue: HealthIssue) => {
    try {
      if (issue.category === 'seo' && issue.id.includes('seo-meta-missing')) {
        const targetStore = stores.find((s) => s.id === issue.storeId);
        if (targetStore) {
          updateStoreSEOConfig(issue.storeId, {
            metaTitle: `${targetStore.name} | Official Store`,
            metaDescription: `Discover the best luxury collections and verified products at ${targetStore.name}. Fast delivery across Saudi Arabia.`,
            sitemapUrl: `https://${targetStore.slug || 'store'}.saudi-stores.com/sitemap.xml`,
            keywords: [targetStore.name, 'Saudi Arabia', 'Online Store', 'Fast Delivery'],
          });
          toast(
            isAr ? `تم تحديث SEO للمتجر ${targetStore.name}` : `SEO generated for ${targetStore.name}`,
            'success'
          );
        }
      } else if (issue.category === 'payment' && issue.id.includes('no-payment-gateways')) {
        await savePaymentGatewayConfig({
          provider: 'cod',
          title: 'Cash on Delivery',
          titleAr: 'الدفع عند الاستلام',
          isEnabled: true,
          supportedMethods: ['cod'],
        });
        toast(
          isAr ? 'تم تفعيل بوابة الدفع الافتراضية' : 'Default COD gateway enabled',
          'success'
        );
      }
    } catch {
      toast(isAr ? 'تعذر إتمام المعالجة التلقائية' : 'Auto-fix encountered an error', 'error');
    }
  };

  const handleFixAllEligible = async () => {
    setIsAutoFixingAll(true);
    const autoFixable = platformHealth.allIssues.filter((i) => i.canAutoFix);
    try {
      for (const issue of autoFixable) {
        await handleAutoFixSingle(issue);
      }
      toast(
        isAr
          ? `تمت معالجة ${autoFixable.length} مشكلة مؤهلة للإصلاح التلقائي بنجاح`
          : `Successfully auto-resolved ${autoFixable.length} eligible issues`,
        'success'
      );
    } finally {
      setIsAutoFixingAll(false);
    }
  };

  const severityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <span>🔴</span> {isAr ? 'حرج' : 'Critical'}
          </span>
        );
      case 'action_required':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <span>🟠</span> {isAr ? 'إجراء مطلوب' : 'Action Required'}
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30">
            <span>🟡</span> {isAr ? 'تنبيه' : 'Warning'}
          </span>
        );
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            <span>🟢</span> {isAr ? 'سليم ومتصل' : 'Connected'}
          </span>
        );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ── Top Executive Health Card ── */}
      <div
        className="rounded-2xl border p-4 sm:p-5 transition-all shadow-xs"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'color-mix(in srgb, var(--accent) 15%, var(--surface))',
                color: 'var(--accent)',
              }}
            >
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight" style={{ color: 'var(--text)' }}>
                  {isAr ? 'مركز صحة المنصة وجاهزية المتاجر' : 'Central Platform Health & Store Readiness'}
                </h2>
                {severityBadge(platformHealth.overallStatus)}
              </div>
              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'مراقبة مركزية شاملة لربط Google، بوابات الدفع، شركات الشحن، واكتمال بيانات المتاجر.'
                  : 'Central live diagnostics across Google integration, payment gateways, couriers, and store setup.'}
              </p>
            </div>
          </div>

          {/* Quick Stat Badges & Toggle Button */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
              <span>🔴 {platformHealth.totalCriticalIssues}</span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>{isAr ? 'حرج' : 'Critical'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold">
              <span>🟠 {platformHealth.totalActionRequiredIssues}</span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>{isAr ? 'إجراء مطلوب' : 'Action'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-400 text-xs font-bold">
              <span>🟡 {platformHealth.totalWarnings}</span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>{isAr ? 'تنبيه' : 'Warnings'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              <span>🟢 {platformHealth.healthyStoresCount}/{platformHealth.totalStores}</span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>{isAr ? 'سليم' : 'Healthy'}</span>
            </div>

            {/* Expand / Collapse Details Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ms-1"
              style={{
                background: isExpanded ? 'color-mix(in srgb, var(--accent) 15%, var(--surface))' : 'var(--surface)',
                borderColor: isExpanded ? 'var(--accent)' : 'var(--border)',
                color: isExpanded ? 'var(--accent)' : 'var(--text)',
              }}
            >
              <span>
                {isExpanded
                  ? isAr ? 'إخفاء التفاصيل' : 'Hide Issues'
                  : isAr
                  ? `عرض المشاكل والتنبيهات (${filteredIssues.length})`
                  : `Review Issues (${filteredIssues.length})`}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* ── Sub Header Actions & Filter Strip (Visible only when expanded) ── */}
        {isExpanded && (
          <div
            className="mt-4 pt-4 border-t flex flex-col md:flex-row md:items-center justify-between gap-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search Box */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث في التنبيهات والمتاجر...' : 'Search alerts & stores...'}
                  className="w-full ps-8 pe-3 py-1.5 rounded-xl text-xs border focus:outline-none"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              {/* Severity Filter */}
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl text-xs border focus:outline-none cursor-pointer"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                <option value="all">{isAr ? 'كل الحالات' : 'All Severities'}</option>
                <option value="critical">{isAr ? '🔴 حرج فقط' : '🔴 Critical Only'}</option>
                <option value="action_required">{isAr ? '🟠 إجراء مطلوب' : '🟠 Action Required'}</option>
                <option value="warning">{isAr ? '🟡 تنبيهات' : '🟡 Warnings'}</option>
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl text-xs border focus:outline-none cursor-pointer"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              >
                <option value="all">{isAr ? 'كل الأقسام' : 'All Categories'}</option>
                <option value="google">Google Suite & OAuth</option>
                <option value="seo">SEO & Indexing</option>
                <option value="payment">{isAr ? 'بوابات الدفع' : 'Payment Gateways'}</option>
                <option value="shipping">{isAr ? 'الشحن واللوجستيات' : 'Shipping & Logistics'}</option>
                <option value="catalog">{isAr ? 'الكتالوج والمنتجات' : 'Catalog & Products'}</option>
                <option value="subscription">{isAr ? 'الاشتراكات وحالة المتجر' : 'Subscriptions'}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleFixAllEligible}
                disabled={isAutoFixingAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isAutoFixingAll ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                <span>{isAr ? 'إصلاح تلقائي للمؤهل' : 'Auto-Fix Eligible'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Multi-Store Live Matrix Table / Cards (Visible only when expanded) ── */}
      {isExpanded && (
        <div className="space-y-3">
          {filteredIssues.length === 0 ? (
            <div
              className="rounded-2xl border p-8 text-center"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                {isAr ? 'لا توجد تنبيهات مطابقة' : 'No matching issues found'}
              </h4>
              <p className="text-xs mt-1 max-w-md mx-auto" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'جميع المتاجر المحددة تعمل ببيانات حقيقية وكافة الإعدادات الأساسية مكتملة بنجاح.'
                  : 'All selected stores are operating with authentic data and verified configurations.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all hover:shadow-md"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <StoreIcon className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--muted)' }} />
                        <span className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>
                          {issue.storeName}
                        </span>
                      </div>
                      {severityBadge(issue.severity)}
                    </div>

                    <h5 className="text-xs font-bold tracking-tight flex items-center gap-1" style={{ color: 'var(--text)' }}>
                      {isAr ? issue.titleAr : issue.title}
                    </h5>

                    <p className="text-[11px] mt-1 line-clamp-2" style={{ color: 'var(--muted)' }}>
                      {isAr ? issue.descriptionAr : issue.description}
                    </p>

                    <div
                      className="mt-2.5 p-2.5 rounded-xl border leading-snug"
                      style={{
                        background: 'color-mix(in srgb, #f59e0b 8%, var(--surface))',
                        borderColor: 'color-mix(in srgb, #f59e0b 25%, transparent)',
                      }}
                    >
                      <strong className="block text-[10px] uppercase font-bold mb-1 tracking-wider text-amber-700 dark:text-amber-400">
                        {isAr ? 'المعلومات والإجراء المطلوب:' : 'Required Action & Information:'}
                      </strong>
                      <p className="text-[11px] font-medium text-slate-800 dark:text-amber-100">
                        {isAr ? issue.requiredInfoAr : issue.requiredInfo}
                      </p>
                    </div>
                  </div>

                  <div
                    className="pt-3 border-t flex items-center justify-between gap-2"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span className="text-[10px] truncate" style={{ color: 'var(--muted)' }}>
                      {isAr ? issue.impactAr : issue.impact}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {issue.canAutoFix && (
                        <button
                          onClick={() => handleAutoFixSingle(issue)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <Zap className="w-3 h-3" />
                          <span>{isAr ? 'إصلاح' : 'Fix'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => switchToStore(issue.storeId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer"
                        style={{
                          background: 'color-mix(in srgb, var(--text) 5%, var(--surface))',
                          borderColor: 'var(--border)',
                          color: 'var(--text)',
                        }}
                      >
                        <span>{isAr ? 'فتح المتجر' : 'Inspect'}</span>
                        <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
