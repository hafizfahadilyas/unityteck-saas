import React from 'react';
import { useTenant } from '../../context/TenantContext';
import { ShieldCheck, Server, Database, Cloud, Zap, ArrowRight, CheckCircle2, Lock, X, Copy } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from './ToastProvider';

const TOPOLOGY_EN = `Users / Merchants / Customers
     │
     ├─► Admin UI (Master + Store) Vite SPA ──► Hostinger Static (apps/admin)
     │   (Fast SPA, TanStack Query, React Router, isolated workspaces)
     │
     ├─► Public Storefront Next.js 15 ───────► Vercel (apps/web)
     │   (Server-side rendered for SEO, ISR zero-stale revalidation)
     │
     ├─► Laravel 11 API (PHP 8.2+) ──────────► Hostinger (apps/api)
     │   (Sanctum token auth, MySQL 8 store_id multi-tenancy, queues via cron)
     │
     └─► Media & Assets ─────────────────────► Cloudflare R2 + CDN
         (Immutable hashed URLs, zero egress cost, instant image delivery)`;

const TOPOLOGY_AR = `المستخدمون / التجار / العملاء
     │
     ├─► Admin UI (Master + Store) Vite SPA ──► Hostinger Static (apps/admin)
     │   (تطبيق صفحة واحدة سريع، TanStack Query، React Router، مساحات عمل معزولة)
     │
     ├─► Public Storefront Next.js 15 ───────► Vercel (apps/web)
     │   (عرض من جهة الخادم لتحسين SEO، وتحديث ISR فوري بلا محتوى قديم)
     │
     ├─► Laravel 11 API (PHP 8.2+) ──────────► Hostinger (apps/api)
     │   (مصادقة Sanctum، تعدد المستأجرين عبر store_id في MySQL 8، طوابير عبر cron)
     │
     └─► Media & Assets ─────────────────────► Cloudflare R2 + CDN
         (روابط ثابتة مُجزّأة، بلا تكلفة نقل بيانات، تسليم فوري للصور)`;

export const ArchitectureBanner: React.FC = () => {
  const { showArchDrawer, setShowArchDrawer, activeStore, mode, canAccessMaster } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  if (!showArchDrawer) return null;

  const topology = isAr ? TOPOLOGY_AR : TOPOLOGY_EN;

  const copyTopology = async () => {
    try {
      await navigator.clipboard.writeText(topology);
      toast(isAr ? 'تم نسخ مخطط النشر إلى الحافظة' : 'Deployment topology copied to clipboard', 'success');
    } catch {
      toast(isAr ? 'تعذّر النسخ إلى الحافظة' : 'Could not copy to clipboard', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r rtl:bg-gradient-to-l from-[#032b28] via-[#06423d] to-[#0a524c] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-400/20 rounded-lg text-teal-300 border border-teal-400/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isAr ? 'بنية منصة التجارة الإلكترونية متعددة المستأجرين' : 'Multi-Tenant E-Commerce SaaS Architecture'}
              </h2>
              <p className="text-xs text-teal-200/80">
                {isAr
                  ? 'قاعدة شيفرة واحدة · عزل متعدد المتاجر · فصل بين المشرف العام ومشرف المتجر'
                  : 'Single Codebase · Multi-Store Isolation · Master Admin & Store Admin Split'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowArchDrawer(false)}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            title={isAr ? 'إغلاق' : 'Close'}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-sm text-slate-600 max-h-[75vh] overflow-y-auto">
          {/* Key Principles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-900 font-semibold mb-1">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isAr ? 'عزل بيانات المتجر' : 'Store Data Isolation'}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isAr ? (
                  <>
                    يتم تقسيم عملاء كل مستأجر وطلباته ومنتجاته وقنواته حسب{' '}
                    <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px] font-mono">store_id</code>، مع إمكانية التوجيه إلى قاعدة MySQL مخصصة.
                  </>
                ) : (
                  <>
                    Every tenant's customers, orders, products, and channels are partitioned by <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px] font-mono">store_id</code>, with optional dedicated MySQL instance routing.
                  </>
                )}
              </p>
              <div className="mt-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300 px-2 py-1 rounded inline-block">
                {isAr ? 'قاعدة بيانات المتجر النشط: ' : 'Active Store DB: '}
                {activeStore.dbIsolation === 'dedicated_mysql'
                  ? isAr
                    ? 'MySQL مخصصة'
                    : 'Dedicated MySQL'
                  : isAr
                    ? 'قسم مشترك (store_id)'
                    : 'Shared partition (store_id)'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-900 font-semibold mb-1">
                <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{isAr ? 'مجاني/احترافي + منح من المشرف العام' : 'Free/Pro + Master Grant'}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isAr
                  ? 'يمكن أن تكون المتاجر مجانية أو احترافية. ويستطيع المشرف العام منح ميزات الباقة الاحترافية مباشرةً عبر صلاحية التجاوز، لتفعيل تحليلات التسويق المتقدمة وتقسيم عملاء VIP.'
                  : 'Stores can be Free or Pro. The Master Admin can grant Pro features directly via Master override, unlocking advanced marketing analytics & VIP segmentation.'}
              </p>
              <div className="mt-2 text-[11px] font-medium text-blue-700 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-300 px-2 py-1 rounded inline-block">
                {isAr ? 'الباقة الحالية: ' : 'Current Plan: '}
                <span className="uppercase font-bold">
                  {isAr ? (activeStore.plan === 'pro' ? 'احترافية' : activeStore.plan === 'free' ? 'مجانية' : activeStore.plan) : activeStore.plan}
                </span>{' '}
                {activeStore.masterGrantedPro && (isAr ? '(بمنحة من المشرف العام)' : '(Master Granted)')}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-900 font-semibold mb-1">
                <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>{isAr ? 'نشر فوري / بلا محتوى قديم' : 'Instant Publish / Zero Stale'}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isAr
                  ? 'التغييرات في لوحة المتجر تُبطل ذاكرة الحافة فورًا دون انتظار إعادة البناء الدورية، وتظهر تعديلات الكتالوج في واجهة المتجر مباشرةً.'
                  : 'Changes made in Store Admin invalidate edge tags in real time without waiting for periodic rebuilds. Catalog modifications reflect on storefront instantly.'}
              </p>
              <div className="mt-2 text-[11px] font-medium text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300 px-2 py-1 rounded inline-block">
                {isAr ? 'إبطال ذاكرة الحافة: مفعّل' : 'Edge Invalidation: Active'}
              </div>
            </div>
          </div>

          {/* Locked Stack Deployment Diagram */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-900 dark:bg-slate-950 text-slate-200 font-mono text-xs">
            <div className="text-teal-400 font-semibold mb-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                <span>{isAr ? 'مخطط النشر (بدون VPS)' : 'DEPLOYMENT TOPOLOGY (NO VPS)'}</span>
              </span>
              <button
                type="button"
                onClick={copyTopology}
                title={isAr ? 'نسخ المخطط' : 'Copy topology'}
                aria-label={isAr ? 'نسخ المخطط' : 'Copy topology'}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-sans text-teal-300 border border-teal-400/30 hover:bg-white/10 transition-colors"
              >
                <Copy className="w-3 h-3" />
                {isAr ? 'نسخ' : 'Copy'}
              </button>
            </div>
            {/* Diagram stays LTR so the box-drawing connectors line up */}
            <pre dir="ltr" className="text-[11px] leading-relaxed overflow-x-auto text-slate-300 text-left">
{topology}
            </pre>
          </div>

          {/* Quick Context Switch Helper */}
          <div className="flex items-center justify-between gap-3 p-3.5 bg-teal-50 border border-teal-200 dark:bg-teal-500/10 dark:border-teal-500/30 rounded-xl">
            <div>
              <span className="text-xs font-semibold text-teal-900 dark:text-teal-200 block">
                {isAr ? 'وضع العرض الحالي: ' : 'Currently viewing in: '}
                {mode === 'master'
                  ? isAr
                    ? 'لوحة المشرف العام للمنصة'
                    : 'Master Admin Platform View'
                  : isAr
                    ? `لوحة المتجر (${activeStore.name})`
                    : `Store Admin (${activeStore.name})`}
              </span>
              <span className="text-[11px] text-teal-700 dark:text-teal-300">
                {canAccessMaster
                  ? isAr
                    ? 'حساب المشرف العام يمكنه فتح جميع المتاجر، بينما يبقى حساب المتجر مقيّدًا بـ store_id الخاص به فقط.'
                    : 'Master login can open every store. Store login stays on its own store_id only.'
                  : isAr
                    ? 'حساب المتجر: لوحة المشرف العام مخفية، وترى هذا المتجر فقط.'
                    : 'Store login: Master Admin is hidden. You only see this store.'}
              </span>
            </div>
            <button
              onClick={() => setShowArchDrawer(false)}
              className="shrink-0 px-4 py-2 bg-teal-800 text-white rounded-lg text-xs font-medium hover:bg-teal-900 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors"
            >
              {isAr ? 'متابعة الاستكشاف' : 'Continue Exploring'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
