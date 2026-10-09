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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <span>🔴</span> {isAr ? 'حرج' : 'Critical'}
          </span>
        );
      case 'action_required':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <span>🟠</span> {isAr ? 'إجراء مطلوب' : 'Action Required'}
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <span>🟡</span> {isAr ? 'تنبيه' : 'Warning'}
          </span>
        );
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span>🟢</span> {isAr ? 'سليم ومتصل' : 'Connected'}
          </span>
        );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ── Top Executive Health Card ── */}
      <div
        className="rounded-2xl border p-5 transition-all shadow-md"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'color-mix(in srgb, var(--accent) 15%, var(--surface))',
                color: 'var(--accent)',
              }}
            >
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black tracking-tight" style={{ color: 'var(--text)' }}>
                  {isAr ? 'مركز صحة المنصة والمراقبة اللحظية' : 'Central Platform Health & Real Diagnostics'}
                </h2>
                {severityBadge(platformHealth.overallStatus)}
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'مراقبة مركزية شاملة لربط Google، بوابات الدفع، شركات الشحن، واكتمال بيانات المتاجر بدون بيانات وهمية.'
                  : 'Centralized live audit across Google connections, payment gateways, couriers, and authentic store readiness.'}
              </p>
            </div>
          </div>

          {/* Quick Stat Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
              <span>🔴 {platformHealth.totalCriticalIssues}</span>
              <span className="text-[11px] font-medium text-white/70">{isAr ? 'حرج' : 'Critical'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
              <span>🟠 {platformHealth.totalActionRequiredIssues}</span>
              <span className="text-[11px] font-medium text-white/70">{isAr ? 'إجراء مطلوب' : 'Action Required'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold">
              <span>🟡 {platformHealth.totalWarnings}</span>
              <span className="text-[11px] font-medium text-white/70">{isAr ? 'تنبيهات' : 'Warnings'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <span>🟢 {platformHealth.healthyStoresCount}/{platformHealth.totalStores}</span>
              <span className="text-[11px] font-medium text-white/70">{isAr ? 'متاجر سليمة 100%' : 'Healthy Stores'}</span>
            </div>
          </div>
        </div>

        {/* ── Sub Header Actions & Filter Strip ── */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Box */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث في التنبيهات والمتاجر...' : 'Search alerts & stores...'}
                className="w-full ps-8 pe-3 py-1.5 rounded-xl text-xs bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl text-xs bg-black/20 border border-white/10 text-white focus:outline-none cursor-pointer"
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
              className="px-3 py-1.5 rounded-xl text-xs bg-black/20 border border-white/10 text-white focus:outline-none cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {isAutoFixingAll ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span>{isAr ? 'إصلاح تلقائي للعناصر المؤهلة' : 'Auto-Fix Eligible Items'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Multi-Store Live Matrix Table / Cards ── */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div
            className="rounded-2xl border p-8 text-center"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white">
              {isAr ? 'لا توجد تنبيهات مطابقة' : 'No matching issues found'}
            </h4>
            <p className="text-xs text-white/60 mt-1 max-w-md mx-auto">
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
                className="rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all hover:border-white/20"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <StoreIcon className="w-3.5 h-3.5 text-white/60 shrink-0" />
                      <span className="text-xs font-bold text-white truncate">
                        {issue.storeName}
                      </span>
                    </div>
                    {severityBadge(issue.severity)}
                  </div>

                  <h5 className="text-xs font-bold text-white tracking-tight flex items-center gap-1">
                    {isAr ? issue.titleAr : issue.title}
                  </h5>

                  <p className="text-[11px] text-white/70 mt-1 line-clamp-2">
                    {isAr ? issue.descriptionAr : issue.description}
                  </p>

                  <div className="mt-2.5 p-2 rounded-xl bg-black/25 border border-white/5 text-[11px] text-amber-300 leading-snug">
                    <strong className="block text-white/90 text-[10px] uppercase font-semibold mb-0.5">
                      {isAr ? 'المعلومات والإجراء المطلوب:' : 'Required Action & Information:'}
                    </strong>
                    {isAr ? issue.requiredInfoAr : issue.requiredInfo}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-white/50 truncate">
                    {isAr ? issue.impactAr : issue.impact}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {issue.canAutoFix && (
                      <button
                        onClick={() => handleAutoFixSingle(issue)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold transition-colors"
                      >
                        <Zap className="w-3 h-3" />
                        <span>{isAr ? 'إصلاح' : 'Fix'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => switchToStore(issue.storeId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-colors"
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
    </div>
  );
};
