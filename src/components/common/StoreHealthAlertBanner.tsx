import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Zap,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from './ToastProvider';
import {
  auditStoreHealth,
  type AlertSeverity,
  type HealthIssue,
} from '../../utils/healthCheck';

interface StoreHealthAlertBannerProps {
  onNavigateTab?: (tab: string, subTab?: string) => void;
  className?: string;
}

export const StoreHealthAlertBanner: React.FC<StoreHealthAlertBannerProps> = ({
  onNavigateTab,
  className = '',
}) => {
  const {
    activeStore,
    seoConfigs,
    allPaymentGateways,
    allCouriers,
    allShipping,
    allProducts,
    allOrders,
    updateStoreSEOConfig,
    addShippingCity,
    savePaymentGatewayConfig,
  } = useTenant();
  const { locale, t } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [autoFixingId, setAutoFixingId] = useState<string | null>(null);

  const seoConfig = seoConfigs[activeStore.id];
  const paymentGateways = allPaymentGateways[activeStore.id] || [];
  const couriers = allCouriers[activeStore.id] || [];
  const shippingZones = allShipping[activeStore.id] || [];
  const products = allProducts[activeStore.id] || [];
  const orders = allOrders[activeStore.id] || [];

  const report = auditStoreHealth({
    store: activeStore,
    seoConfig,
    paymentGateways,
    couriers,
    shippingZones,
    products,
    orders,
  });

  if (isDismissed || (report.status === 'healthy' && !isExpanded)) {
    return null;
  }

  const handleAutoFix = async (issue: HealthIssue) => {
    setAutoFixingId(issue.id);
    try {
      if (issue.category === 'seo' && issue.id.includes('seo-meta-missing')) {
        updateStoreSEOConfig(activeStore.id, {
          metaTitle: `${activeStore.name} | Official Store`,
          metaDescription: `Discover the best luxury collections and verified products at ${activeStore.name}. Fast delivery across Saudi Arabia.`,
          sitemapUrl: `https://${activeStore.slug || 'store'}.saudi-stores.com/sitemap.xml`,
          keywords: [activeStore.name, 'Saudi Arabia', 'Online Store', 'Fast Delivery'],
        });
        toast(
          isAr ? 'تم توليد وتطبيق بيانات SEO الافتراضية بنجاح' : 'Default SEO metadata generated & applied',
          'success'
        );
      } else if (issue.category === 'shipping' && issue.id.includes('no-shipping-zones')) {
        addShippingCity('Riyadh & Central Region', 25, 300, 'Same Day (2-4 hrs)', {
          region: 'Central',
          ratePerKg: 2,
        });
        addShippingCity('Jeddah & Western Region', 30, 350, '1-2 Business Days', {
          region: 'Western',
          ratePerKg: 3,
        });
        toast(
          isAr ? 'تم إنشاء مناطق الشحن والتوصيل الأساسية بنجاح' : 'Standard shipping zones created',
          'success'
        );
      } else if (issue.category === 'payment' && issue.id.includes('no-payment-gateways')) {
        await savePaymentGatewayConfig({
          provider: 'cod',
          title: 'Cash on Delivery',
          titleAr: 'الدفع عند الاستلام',
          isEnabled: true,
          supportedMethods: ['cod'],
        });
        toast(
          isAr ? 'تم تفعيل الدفع عند الاستلام تلقائياً' : 'Cash on Delivery gateway activated',
          'success'
        );
      }
    } catch {
      toast(isAr ? 'حدث خطأ أثناء المعالجة التلقائية' : 'Auto-fix encountered an issue', 'error');
    } finally {
      setAutoFixingId(null);
    }
  };

  const severityStyles = {
    critical: {
      container: 'bg-rose-50/95 dark:bg-rose-950/60 border-rose-300 dark:border-rose-500/50 text-rose-950 dark:text-rose-100',
      iconBox: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-700/60',
      titleColor: 'text-rose-950 dark:text-rose-100',
      subColor: 'text-rose-900/85 dark:text-rose-200/85',
      badge: 'bg-rose-600 text-white font-bold',
      btn: 'bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 text-rose-950 dark:text-rose-100 border border-rose-300 dark:border-rose-700',
      dismiss: 'text-rose-800 hover:text-rose-950 dark:text-rose-300 dark:hover:text-white',
      icon: AlertCircle,
      title: isAr ? '🔴 إجراءات حرجة مطلوبة للمتجر' : '🔴 Critical Actions Required',
    },
    action_required: {
      container: 'bg-amber-50/95 dark:bg-amber-950/60 border-amber-300 dark:border-amber-500/50 text-amber-950 dark:text-amber-100',
      iconBox: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-700/60',
      titleColor: 'text-amber-950 dark:text-amber-100',
      subColor: 'text-amber-900/85 dark:text-amber-200/85',
      badge: 'bg-amber-500 text-slate-950 font-black',
      btn: 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-700',
      dismiss: 'text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-white',
      icon: AlertTriangle,
      title: isAr ? '🟠 معلومات وإعدادات ربط مطلوبة' : '🟠 Action Required: Missing Configurations',
    },
    warning: {
      container: 'bg-sky-50/95 dark:bg-sky-950/60 border-sky-300 dark:border-sky-500/50 text-sky-950 dark:text-sky-100',
      iconBox: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300 border border-sky-200 dark:border-sky-700/60',
      titleColor: 'text-sky-950 dark:text-sky-100',
      subColor: 'text-sky-900/85 dark:text-sky-200/85',
      badge: 'bg-sky-600 text-white font-bold',
      btn: 'bg-sky-100 hover:bg-sky-200 dark:bg-sky-900/40 dark:hover:bg-sky-900/60 text-sky-950 dark:text-sky-100 border border-sky-300 dark:border-sky-700',
      dismiss: 'text-sky-800 hover:text-sky-950 dark:text-sky-300 dark:hover:text-white',
      icon: Sparkles,
      title: isAr ? '🟡 توصيات تحسين المتجر وGoogle' : '🟡 Recommended Optimizations',
    },
    healthy: {
      container: 'bg-emerald-50/95 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-500/50 text-emerald-950 dark:text-emerald-100',
      iconBox: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60',
      titleColor: 'text-emerald-950 dark:text-emerald-100',
      subColor: 'text-emerald-900/85 dark:text-emerald-200/85',
      badge: 'bg-emerald-600 text-white font-bold',
      btn: 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 text-emerald-950 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700',
      dismiss: 'text-emerald-800 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-white',
      icon: CheckCircle2,
      title: isAr ? '🟢 جميع الخدمات متصلة وتعمل بالبيانات الحقيقية' : '🟢 All Systems Connected & Verified',
    },
  }[report.status];

  const Icon = severityStyles.icon;

  return (
    <div
      className={`rounded-2xl border backdrop-blur-md p-4 transition-all duration-300 shadow-sm ${severityStyles.container} ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${severityStyles.iconBox}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-sm font-extrabold tracking-tight ${severityStyles.titleColor}`}>
                {severityStyles.title}
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full shadow-2xs ${severityStyles.badge}`}>
                {report.issues.length} {isAr ? 'عناصر' : 'items'}
              </span>
              <span className={`text-[11px] font-semibold ${severityStyles.subColor}`}>
                • {isAr ? 'مؤشر الجاهزية الحقيقية:' : 'Live Readiness Score:'}{' '}
                <strong className={`font-black ${severityStyles.titleColor}`}>{report.score}%</strong>
              </span>
            </div>
            <p className={`text-xs mt-0.5 line-clamp-1 font-medium ${severityStyles.subColor}`}>
              {isAr
                ? 'هذه البيانات والمعلومات مطلوبة إلزامياً. ولن يعمل هذا القسم مع البيانات الحقيقية بشكل صحيح حتى يتم توفيرها.'
                : 'This information is required. Until provided, this feature will not function with real data.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${severityStyles.btn}`}
          >
            <span>{isExpanded ? (isAr ? 'إخفاء التفاصيل' : 'Hide Details') : (isAr ? 'عرض الإجراءات' : 'View Actions')}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${severityStyles.dismiss}`}
            title={isAr ? 'إغلاق' : 'Dismiss'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-300/60 dark:border-white/10 space-y-3">
          <div className="p-3.5 rounded-xl bg-white/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-100 shadow-2xs">
            <p className="font-bold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{isAr ? 'تنبيه المصادقة والبيانات الحقيقية (No Dummy Data Policy):' : 'Authentic Data & Live Integration Notice:'}</span>
            </p>
            <p className="leading-relaxed opacity-90">
              {isAr
                ? 'وفقاً لمعايير الإنتاج الحقيقية، لا يتم توليد أرقام عشوائية أو وهمية. إذا كانت أداة Google أو بوابة الدفع أو شركة الشحن غير مهيأة، ستظهر الحالة كـ "بانتظار البيانات" أو "غير متصل" حتى تكتمل المدخلات المطلوبة أدناه.'
                : 'Under live production standards, zero mock or randomized data is generated. If Google suite, payments, or logistics are missing configuration, stats will display "Waiting for Data" or "Not Connected" until required credentials are supplied below.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.issues.map((issue) => (
              <div
                key={issue.id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2 shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {issue.severity === 'critical' && <span className="text-rose-500">🔴</span>}
                      {issue.severity === 'action_required' && <span className="text-amber-500">🟠</span>}
                      {issue.severity === 'warning' && <span className="text-sky-500">🟡</span>}
                      {isAr ? issue.titleAr : issue.title}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                      {issue.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-normal">
                    {isAr ? issue.descriptionAr : issue.description}
                  </p>
                  <div className="mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-900 dark:text-amber-200">
                    <strong>{isAr ? 'المطلوب:' : 'Required:'}</strong> {isAr ? issue.requiredInfoAr : issue.requiredInfo}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {isAr ? issue.impactAr : issue.impact}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {issue.canAutoFix && (
                      <button
                        onClick={() => handleAutoFix(issue)}
                        disabled={autoFixingId === issue.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:text-emerald-300 text-[11px] font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        {autoFixingId === issue.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Zap className="w-3 h-3" />
                        )}
                        <span>{isAr ? 'معالجة تلقائية' : 'Auto Fix'}</span>
                      </button>
                    )}
                    {onNavigateTab && (
                      <button
                        onClick={() => onNavigateTab(issue.targetTab, issue.targetSubTab)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                      >
                        <span>{isAr ? 'الانتقال للضبط' : 'Configure Now'}</span>
                        <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
