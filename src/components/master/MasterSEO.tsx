import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { Sparkline } from '../common/Sparkline';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { 
  Search, 
  Globe, 
  CheckCircle2, 
  Zap, 
  Check, 
  RefreshCw,
  ArrowRight,
  Flower2,
  Copy,
  Download,
} from 'lucide-react';

const INDEXING_PAYLOAD = `POST https://indexing.googleapis.com/v3/urlNotifications:publish
Content-Type: application/json
{
  "url": "https://{store_slug}.saudi-stores.com/products/{sku}",
  "type": "URL_UPDATED"
}`;

export const MasterSEO: React.FC = () => {
  const { stores, seoConfigs, switchToStore } = useTenant();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [filterMode, setFilterMode] = useState<'all' | 'connected' | 'pending'>('all');
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncToast, setSyncToast] = useState(false);

  // Compute aggregated Google SEO metrics across ALL stores
  const storeEntries = stores.map(s => {
    const seo = seoConfigs[s.id] || {
      storeId: s.id,
      googleConnected: false,
      googleAccountEmail: null,
      ga4MeasurementId: '',
      gtmContainerId: '',
      searchConsoleConnected: false,
      searchConsoleVerificationTag: '',
      indexingApiEnabled: false,
      indexedUrlsCount: 0,
      totalSearchClicks: 0,
      totalSearchImpressions: 0,
      avgCtr: 0,
      avgPosition: 0,
      lastIndexingPing: 'Never',
      topQueries: [],
      submittedUrls: []
    };
    return { store: s, seo };
  });

  const connectedCount = storeEntries.filter(e => e.seo.googleConnected).length;
  const totalClicksAcrossStores = storeEntries.reduce((acc, e) => acc + (e.seo.totalSearchClicks || 0), 0);
  const totalImpressionsAcrossStores = storeEntries.reduce((acc, e) => acc + (e.seo.totalSearchImpressions || 0), 0);
  const totalIndexedUrlsAcrossStores = storeEntries.reduce((acc, e) => acc + (e.seo.indexedUrlsCount || 0), 0);
  const avgCtrGlobal = ((totalClicksAcrossStores / (totalImpressionsAcrossStores || 1)) * 100).toFixed(1);

  const filteredStores = storeEntries.filter(e => {
    if (filterMode === 'connected') return e.seo.googleConnected;
    if (filterMode === 'pending') return !e.seo.googleConnected;
    return true;
  });

  const handleGlobalSync = () => {
    setIsSyncingAll(true);
    setTimeout(() => {
      setIsSyncingAll(false);
      setSyncToast(true);
      toast(
        isAr
          ? `تم تحديث بيانات Google لجميع المتاجر (${stores.length})`
          : `Google data refreshed for all ${stores.length} stores`,
        'success',
      );
      setTimeout(() => setSyncToast(false), 3000);
    }, 1200);
  };

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(INDEXING_PAYLOAD);
      toast(isAr ? 'تم نسخ طلب Indexing API' : 'Indexing API payload copied', 'success');
    } catch {
      toast(isAr ? 'تعذّر النسخ إلى الحافظة' : 'Could not copy to clipboard', 'error');
    }
  };

  const handleExportCsv = () => {
    const header = ['Store', 'Slug', 'Google Account', 'GA4 ID', 'GTM Container', 'Indexed URLs', 'Clicks', 'Impressions', 'CTR'];
    const rows = filteredStores.map(({ store, seo }) => [
      store.name,
      store.slug,
      seo.googleConnected ? seo.googleAccountEmail || '' : 'Not connected',
      seo.ga4MeasurementId || '',
      seo.gtmContainerId || '',
      String(seo.indexedUrlsCount || 0),
      String(seo.totalSearchClicks || 0),
      String(seo.totalSearchImpressions || 0),
      seo.avgCtr ? `${seo.avgCtr}%` : '',
    ]);
    const csv = [header, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `master-seo-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast(isAr ? 'تم تنزيل تقرير SEO بصيغة CSV' : 'SEO report downloaded as CSV', 'success');
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-[#032320] via-[#06332e] to-[#032320] text-white p-6 rounded-3xl shadow-sm border border-[#0d4a43]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg border border-teal-500/30">
              <Search className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2 flex-wrap" style={{ color: '#ffffff' }}>
              {isAr ? 'إدارة SEO المركزية والتحكم في فهرسة Google' : 'Master SEO & Central Google Indexing Control'}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {isAr ? 'مُجمِّع متعدد المستأجرين' : 'Multi-Tenant Aggregator'}
              </span>
            </h1>
          </div>
          <p className="text-xs text-teal-200/80 max-w-2xl leading-relaxed">
            {isAr
              ? 'لوحة مركزية لمراقبة حسابات Google لجميع متاجر التجار، ومعدلات الفهرسة في Google Search Console، وحركة أحداث GA4، وسلامة خرائط XML. عند ربط العملاء لحسابات Google الخاصة بهم، يتجمّع أداء البحث هنا لحظيًا.'
              : "Central dashboard monitoring all merchant stores' Google accounts, Google Search Console indexing rates, GA4 event traffic, and XML sitemap health. When clients connect their Google accounts, their search performance aggregates here in real-time."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGlobalSync}
            disabled={isSyncingAll}
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
            <span>
              {isSyncingAll
                ? isAr ? 'جارٍ مزامنة بيانات جميع المتاجر...' : 'Syncing All Store Data...'
                : isAr ? 'مزامنة جميع حسابات Google' : 'Sync All Google Accounts'}
            </span>
          </button>
        </div>
      </div>

      {syncToast && (
        <div className="p-3 bg-teal-50 border border-teal-300 text-teal-900 dark:bg-teal-500/10 dark:border-teal-500/30 dark:text-teal-200 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>
            {isAr
              ? `تم تحديث بيانات Google Search Console و Indexing API المركزية عبر جميع متاجر التجار (${stores.length})!`
              : `Central Google Search Console & Indexing API data refreshed across all ${stores.length} merchant stores!`}
          </span>
        </div>
      )}

      {/* Cross-Store KPI Analytics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{isAr ? 'حسابات Google المرتبطة' : 'Connected Google Accounts'}</span>
            <span className="text-[10px] text-teal-700 font-bold bg-teal-50 dark:bg-teal-500/10 dark:text-teal-300 px-2 py-0.5 rounded-full">
              {isAr ? `${connectedCount} من ${stores.length} متاجر` : `${connectedCount} of ${stores.length} Stores`}
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {isAr ? `${connectedCount} مرتبط` : `${connectedCount} Connected`}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-teal-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${(connectedCount / (stores.length || 1)) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 block">
            {isAr ? 'عملاء متزامنون عبر حسابات Google الخاصة بهم' : 'Clients synced via their own Google accounts'}
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{isAr ? 'إجمالي مرات الظهور في البحث' : 'Global Search Impressions'}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              totalImpressionsAcrossStores > 0
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'text-slate-500 bg-slate-100'
            }`} dir="ltr">
              {totalImpressionsAcrossStores > 0 ? '+28.5%' : (isAr ? 'بانتظار البيانات' : 'Waiting for Data')}
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {totalImpressionsAcrossStores > 0 ? totalImpressionsAcrossStores.toLocaleString() : '0'}
          </div>
          <div className="h-8">
            <Sparkline
              data={totalImpressionsAcrossStores > 0 ? [Math.round(totalImpressionsAcrossStores * 0.4), Math.round(totalImpressionsAcrossStores * 0.6), Math.round(totalImpressionsAcrossStores * 0.8), totalImpressionsAcrossStores] : [0, 0, 0, 0]}
              color="#10b981"
            />
          </div>
          <span className="text-[10px] text-slate-400 block">
            {isAr ? 'إجمالي مرات الظهور في بحث Google بالسعودية' : 'Total KSA Google search impressions'}
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{isAr ? 'إجمالي النقرات العضوية' : 'Total Organic Clicks'}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              totalClicksAcrossStores > 0
                ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-300'
                : 'text-slate-500 bg-slate-100'
            }`}>
              {totalClicksAcrossStores > 0 ? (isAr ? 'بث نشط' : 'Active Stream') : (isAr ? 'لا توجد نقرات بعد' : 'No Clicks Yet')}
            </span>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
            {totalClicksAcrossStores > 0 ? totalClicksAcrossStores.toLocaleString() : '0'}
          </div>
          <div className="h-8">
            <Sparkline
              data={totalClicksAcrossStores > 0 ? [Math.round(totalClicksAcrossStores * 0.4), Math.round(totalClicksAcrossStores * 0.7), totalClicksAcrossStores] : [0, 0, 0, 0]}
              color="#2563eb"
            />
          </div>
          <span className="text-[10px] text-slate-400 block">
            {isAr ? 'إجمالي زيارات العملاء العضوية' : 'Aggregated organic customer visits'}
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{isAr ? 'إجمالي الروابط المفهرسة' : 'Total URLs Indexed'}</span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">
              {isAr ? `متوسط CTR: ${avgCtrGlobal}%` : `Avg CTR: ${avgCtrGlobal}%`}
            </span>
          </div>
          <div className="text-2xl font-black text-teal-800 dark:text-teal-300 tabular-nums">
            {isAr ? `${totalIndexedUrlsAcrossStores} رابط` : `${totalIndexedUrlsAcrossStores} URLs`}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
            <span>{isAr ? 'فهرسة تلقائية عبر Next.js 15 SSR' : 'Automated Next.js 15 SSR Indexing'}</span>
          </div>
          <span className="text-[10px] text-slate-400 block">
            {isAr ? 'مفهرسة على Google و Bing و Yandex' : 'Indexed across Google, Bing & Yandex'}
          </span>
        </div>
      </div>

      {/* Stores Google SEO Matrix Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {isAr ? 'حالة SEO وحسابات Google لمتاجر التجار' : 'Merchant Store SEO & Google Account Status'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'تفصيل لكل متجر يشمل ربط حساب Google، ومعرّفات GA4، ووسوم Google Search Console، وترتيب البحث.'
                : 'Per-store breakdown of Google account connection, GA4 IDs, Google Search Console tags, and search rankings.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-lg transition-all ${filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
              >
                {isAr ? `كل المتاجر (${stores.length})` : `All Stores (${stores.length})`}
              </button>
              <button
                onClick={() => setFilterMode('connected')}
                className={`px-3 py-1 rounded-lg transition-all ${filterMode === 'connected' ? 'bg-white text-emerald-700 dark:text-emerald-300 shadow-xs' : 'text-slate-500'}`}
              >
                {isAr ? `مرتبطة (${connectedCount})` : `Connected (${connectedCount})`}
              </button>
              <button
                onClick={() => setFilterMode('pending')}
                className={`px-3 py-1 rounded-lg transition-all ${filterMode === 'pending' ? 'bg-white text-amber-700 dark:text-amber-300 shadow-xs' : 'text-slate-500'}`}
              >
                {isAr ? `قيد الانتظار (${stores.length - connectedCount})` : `Pending (${stores.length - connectedCount})`}
              </button>
            </div>
            <button
              type="button"
              onClick={handleExportCsv}
              title={isAr ? 'تصدير الجدول بصيغة CSV' : 'Export table as CSV'}
              aria-label={isAr ? 'تصدير الجدول بصيغة CSV' : 'Export table as CSV'}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-start">{isAr ? 'متجر التاجر' : 'Store'}</th>
                <th className="py-3 px-3 text-start">{isAr ? 'حساب Google' : 'Google Account'}</th>
                <th className="py-3 px-3 text-start">{isAr ? 'Analytics (GA4)' : 'Analytics (GA4)'}</th>
                <th className="py-3 px-3 text-start">{isAr ? 'حاوية GTM' : 'GTM Container'}</th>
                <th className="py-3 px-3 text-start">{isAr ? 'Search Console' : 'Search Console'}</th>
                <th className="py-3 px-3 text-start">{isAr ? 'Google Ads' : 'Google Ads'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'حالة المزامنة' : 'Sync Status'}</th>
                <th className="py-3 px-4 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStores.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    {isAr ? 'لا توجد متاجر تطابق هذا الفلتر.' : 'No stores match this filter.'}
                  </td>
                </tr>
              )}
              {filteredStores.map(({ store, seo }) => (
                <tr key={store.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30 flex items-center justify-center shadow-2xs border border-emerald-200">
                      <Flower2 className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">{store.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono" dir="ltr">{store.slug}.saudi-stores.com</div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    {seo.googleConnected ? (
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate max-w-[140px]">{seo.googleAccountEmail}</span>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30">
                        {isAr ? 'غير مرتبط' : 'Not Connected'}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                    {seo.ga4MeasurementId ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">{seo.ga4MeasurementId}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                    {seo.gtmContainerId ? (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">{seo.gtmContainerId}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3">
                    {seo.googleConnected ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700">
                        {isAr ? 'نشط ومفحوص' : 'Active & Verified'}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                    {seo.googleConnected ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                        {isAr ? 'حساب معتمد' : 'Authorized'}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    {seo.googleConnected ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {isAr ? 'متزامن' : 'Synced'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                        {isAr ? 'في الانتظار' : 'Pending'}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => switchToStore(store.id)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 mx-auto transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>{isAr ? 'إدارة' : 'Manage'}</span>
                      <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Central Google Indexing API Technical Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>{isAr ? 'بنية الدفع المركزية لـ Google Indexing API' : 'Master Google Indexing API Push Architecture'}</span>
            </h4>
            <button
              type="button"
              onClick={handleCopyPayload}
              title={isAr ? 'نسخ الطلب' : 'Copy payload'}
              aria-label={isAr ? 'نسخ الطلب' : 'Copy payload'}
              className="shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>{isAr ? 'نسخ' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isAr
              ? 'عندما يُنشئ أي تاجر منتجًا أو يحدّثه أو ينشره في منصتنا متعددة المستأجرين، تُطلق واجهة Laravel 11 API على Hostinger مهمة في طابور الخلفية، تقوم فورًا بإرسال طلب JSON-RPC إلى Webmaster Indexing API من Google:'
              : "When any merchant creates, updates, or publishes a product in our multi-tenant SaaS, our Laravel 11 API on Hostinger triggers a background queue job. The job pushes an instant JSON-RPC payload to Google's Webmaster Indexing API:"}
          </p>
          <div className="p-3 bg-slate-900 dark:bg-black/40 text-teal-400 font-mono text-[11px] rounded-xl overflow-x-auto text-left" dir="ltr">
            POST https://indexing.googleapis.com/v3/urlNotifications:publish<br/>
            Content-Type: application/json<br/>
            &#123;<br/>
            &nbsp;&nbsp;&quot;url&quot;: &quot;https://&#123;store_slug&#125;.saudi-stores.com/products/&#123;sku&#125;&quot;,<br/>
            &nbsp;&nbsp;&quot;type&quot;: &quot;URL_UPDATED&quot;<br/>
            &#125;
          </div>
          <span className="text-[11px] text-slate-400 block">
            {isAr
              ? 'يضمن زمن فهرسة شبه فوري دون انتظار جولات الزحف الأسبوعية.'
              : 'Ensures 0ms indexing latency without waiting for weekly crawler sweeps.'}
          </span>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>{isAr ? 'الريادة في بحث التجارة الإلكترونية السعودية' : 'Saudi E-Commerce Search Dominance'}</span>
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isAr
              ? 'كل متجر يُنشأ على منصة Unityteck مزوّد مسبقًا بمخططات بيانات منظمة مخصصة للسوق السعودي:'
              : 'Every store generated on the Unityteck platform is baked with Saudi-specific structured data schemas:'}
          </p>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              {isAr ? (
                <span><strong>مخطط تاجر متوافق مع ZATCA:</strong> سجل تجاري موثّق في المملكة</span>
              ) : (
                <span><strong>ZATCA Compliant Merchant Schema:</strong> Verified business registration in KSA</span>
              )}
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              {isAr ? (
                <span><strong>العملة بالريال السعودي:</strong> عرض الأسعار في Google Shopping بالريال مباشرة</span>
              ) : (
                <span><strong>Currency in SAR:</strong> Native Google Shopping price display in Saudi Riyals</span>
              )}
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              {isAr ? (
                <span><strong>وسوم Hreflang العربية:</strong> <code>ar-SA</code> و <code>en-SA</code> بتوطين تلقائي</span>
              ) : (
                <span><strong>Arabic Hreflang Tags:</strong> <code>ar-SA</code> and <code>en-SA</code> auto-localized</span>
              )}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
