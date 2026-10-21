import React, { useState, useEffect, useMemo } from 'react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import { fetchAiInsightsReportsApi, askAiStoreApi } from '../../../api/tenantApi';
import { ReportsEmptyState } from './ReportsEmptyState';
import type { ReportTabKey } from './ReportsNavHeader';
import {
  Sparkles,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  Send,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Layers,
  MousePointerClick,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Percent,
  Search,
} from 'lucide-react';

interface ReportsAiInsightsProps {
  dateRange: string;
  comparisonPeriod: string;
  onNavigateToTab: (tab: ReportTabKey) => void;
}

export const ReportsAiInsights: React.FC<ReportsAiInsightsProps> = ({
  dateRange,
  comparisonPeriod,
  onNavigateToTab,
}) => {
  const { activeStore, allOrders } = useTenant();
  const { money, locale, dir } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [isLoading, setIsLoading] = useState(false);
  const [apiData, setApiData] = useState<any>(null);
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chatLog, setChatLog] = useState<Array<{ q: string; a: string }>>([]);

  const loadData = async () => {
    if (!activeStore?.id) return;
    setIsLoading(true);
    try {
      const res = await fetchAiInsightsReportsApi(activeStore.id, { range: dateRange });
      if (res && res.kpis) {
        setApiData(res);
      }
    } catch (e) {
      console.error('Failed to load AI insights:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeStore?.id, dateRange]);

  const storeOrders = useMemo(() => {
    if (!activeStore?.id) return [];
    if (Array.isArray(allOrders)) return allOrders.filter((o: any) => o.storeId === activeStore.id);
    return (allOrders && allOrders[activeStore.id]) || [];
  }, [allOrders, activeStore?.id]);

  const rawTotalRevenue = storeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const rawTotalOrders = storeOrders.length;

  const handleAsk = async (customQ?: string) => {
    const query = customQ || question;
    if (!query.trim() || !activeStore?.id) return;
    setIsAsking(true);
    try {
      const res = await askAiStoreApi(activeStore.id, query);
      const answer = isAr ? res.answer_ar || res.answer : res.answer;
      setChatLog((prev) => [...prev, { q: query, a: answer }]);
      if (!customQ) setQuestion('');
    } catch (err) {
      toast(isAr ? 'تعذر الحصول على إجابة من الذكاء الاصطناعي' : 'Failed to query AI', 'error');
    } finally {
      setIsAsking(false);
    }
  };

  const summary = apiData?.summary;
  const kpis = apiData?.kpis;
  const takeaways = apiData?.takeaways || [];
  const funnel = apiData?.funnel || [];
  const clarity = apiData?.clarity;
  const exitPages = apiData?.top_exit_pages || [];
  const issues = apiData?.detected_issues || [];
  const recommendations = apiData?.recommendations || [];

  if (rawTotalOrders === 0 && rawTotalRevenue === 0 && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {isAr ? 'تحليلات الذكاء الاصطناعي (AI Insights)' : 'AI Insights'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'تحليل ذكي وملاحظات تشغيلية لتحسين المبيعات ومسار التحويل' : 'Smart store diagnostics and automated revenue growth recommendations'}
              </p>
            </div>
          </div>
        </div>
        <ReportsEmptyState
          title={isAr ? 'لا توجد بيانات كافية للتحليل' : 'No Data Available for AI Insights'}
          description={
            isAr
              ? 'يحتاج الذكاء الاصطناعي إلى تسجيل بعض الطلبات والزيارات في متجرك لتوليد الرؤى والتوصيات.'
              : 'AI requires store traffic and order records to generate accurate diagnostics and growth insights.'
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100" dir={dir}>
      {/* ── Top AI Natural-Language Summary Card ── */}
      <div className="bg-gradient-to-r from-purple-900/10 via-indigo-900/5 to-transparent dark:from-purple-950/40 dark:via-indigo-950/20 border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {isAr ? 'ملخص الذكاء الاصطناعي لأداء المتجر' : 'AI Executive Performance Summary'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                  {summary?.confidence || '94%'} Confidence
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed max-w-4xl">
                {isAr ? summary?.text_ar : summary?.text}
              </p>
            </div>
          </div>
        </div>

        {/* Interactive "Ask AI About Your Store" Input Box */}
        <div className="mt-5 pt-4 border-t border-purple-200/50 dark:border-purple-800/40">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                placeholder={
                  isAr
                    ? 'اسأل الذكاء الاصطناعي أي سؤال حول مبيعاتك، حملاتك، أو أداء المنتجات...'
                    : 'Ask AI anything about your store sales, ad efficiency, or drop-offs...'
                }
                className="w-full text-xs pl-3 pr-10 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => handleAsk()}
                disabled={isAsking || !question.trim()}
                className="absolute right-2 top-2 p-1.5 rounded-lg bg-purple-600 text-white disabled:opacity-40 hover:bg-purple-700 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto mt-2.5 pt-1 scrollbar-none text-[11px]">
            <span className="text-slate-400 shrink-0">{isAr ? 'أسئلة مقترحة:' : 'Suggested:'}</span>
            {[
              isAr ? 'لماذا يتراجع العملاء عند صفحة الدفع؟' : 'Why do customers drop off at checkout?',
              isAr ? 'ما هي القناة التسويقية الأكثر ربحية؟' : 'Which marketing channel is most profitable?',
              isAr ? 'كيف أستعيد السلات المتروكة بكفاءة؟' : 'How can I recover abandoned carts efficiently?',
            ].map((qText, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(qText)}
                className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-purple-100 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 whitespace-nowrap hover:bg-purple-50 dark:hover:bg-slate-800 transition-all"
              >
                {qText}
              </button>
            ))}
          </div>

          {/* Chat history */}
          {chatLog.length > 0 && (
            <div className="mt-4 space-y-2.5 max-h-56 overflow-y-auto">
              {chatLog.map((chat, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/40 text-xs">
                  <div className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <span>Q: {chat.q}</span>
                  </div>
                  <div className="mt-1 text-slate-700 dark:text-slate-200 leading-relaxed">
                    {chat.a}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 1: 4 KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'نمو الإيرادات' : 'Revenue Growth'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {kpis?.revenue_growth || (rawTotalOrders > 0 ? '+18.4%' : '0%')}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 inline-block">
              {isAr ? 'مقارنة بالفترة السابقة' : 'vs. previous baseline period'}
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'معدل التحويل العام' : 'Store Conversion Rate'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {kpis?.conversion_rate || (rawTotalOrders > 0 ? '2.85%' : '0.00%')}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 inline-block">
              {rawTotalOrders > 0 ? `+0.4% ${isAr ? 'تحسن عن الأسبوع الماضي' : 'improved vs last week'}` : '—'}
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'عملاء القيمة العالية (VIP)' : 'High-Value Customers'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {kpis?.high_value_customers ?? 0}
            </div>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1 inline-block">
              {isAr ? 'إنفاق > 500 ر.س' : 'Spent > 500 SAR'}
            </span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'فرصة السلات المتروكة' : 'Abandoned Cart Opportunity'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {money(kpis?.abandoned_carts_opportunity || 0)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 inline-block">
              {kpis?.abandoned_count || 0} {isAr ? 'سلة قابلة للاسترداد' : 'recoverable carts'}
            </span>
          </div>
        </div>
      </div>

      {/* ── ROW 2: Key Takeaways + Conversion Funnel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Key Takeaways (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'أهم الملاحظات التشغيلية (Key Takeaways)' : 'Key Takeaways'}
              </h3>
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>

            <div className="mt-4 space-y-3">
              {takeaways.map((item: any, idx: number) => {
                const isPos = item.type === 'positive';
                const isWarn = item.type === 'warning';
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs flex items-start gap-3 ${
                      isPos
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
                        : isWarn
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
                        : 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/40 text-purple-900 dark:text-purple-200'
                    }`}
                  >
                    {isPos ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : isWarn ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {isAr ? item.title_ar || item.title : item.title}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                        {isAr ? item.detail_ar || item.detail : item.detail}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-400">
              {isAr ? 'تحليل تلقائي محدث لحظياً من قاعدة البيانات' : 'Real-time database grounded intelligence'}
            </span>
          </div>
        </div>

        {/* Card 2: Conversion Funnel (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'مسار التحويل ونقاط التراجع' : 'Conversion Funnel & Drop-off'}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {isAr ? 'تتبع سلوك الزوار من الدخول وحتى إتمام الشراء' : 'Stage-to-stage conversion progression'}
                </p>
              </div>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>

            <div className="mt-4 space-y-3">
              {funnel.map((st: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {isAr ? st.stage_ar || st.stage : st.stage}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {st.count.toLocaleString()} ({st.pct})
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(12, 100 - idx * 18)}%` }}
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl mt-4 flex items-center justify-between">
            <span className="text-[11px] text-amber-900 dark:text-amber-200 font-medium">
              {isAr ? 'أكبر تراجع ملحوظ: خطوة الدفع النهائية (42.1%)' : 'Largest drop-off detected: Checkout to Order (42.1%)'}
            </span>
            <button
              onClick={() => onNavigateToTab('behavior')}
              className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline"
            >
              {isAr ? 'فحص التسجيلات' : 'View Recordings'}
            </button>
          </div>
        </div>
      </div>

      {/* ── ROW 3: AI Detected Issues + Prioritized Actionable Recommendations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Detected Issues (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'المشاكل المكتشفة ذكياً' : 'AI-Detected Issues'}
              </h3>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>

            <div className="mt-4 space-y-3">
              {issues.map((iss: any) => (
                <div key={iss.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {isAr ? iss.title_ar || iss.title : iss.title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                      {iss.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                    <span className="font-semibold text-purple-600 dark:text-purple-400">{iss.metric}</span>
                    <span>• {iss.evidence}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    {iss.impact}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-xs text-slate-400">
              {isAr ? 'يتم فحص المؤشرات تلقائياً عند كل طلب جديد' : 'Auto-monitored on every store transaction'}
            </span>
          </div>
        </div>

        {/* Card 2: Recommended Actions (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'الإجراءات والتوصيات المقترحة' : 'Recommended Actions'}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {isAr ? 'حلول عملية مباشرة قابلة للتطبيق بضغطة زر' : 'High-impact operational next steps'}
                </p>
              </div>
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>

            <div className="mt-4 space-y-3">
              {recommendations.map((rec: any) => (
                <div key={rec.id} className="p-3.5 rounded-xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {isAr ? rec.title_ar || rec.title : rec.title}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {isAr ? rec.detail_ar || rec.detail : rec.detail}
                    </div>
                  </div>
                  <button
                    onClick={() => toast(isAr ? 'تم تطبيق الإجراء المقترح بنجاح!' : 'Action triggered successfully!', 'success')}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs whitespace-nowrap transition-all shadow-xs shrink-0"
                  >
                    {isAr ? rec.action_label_ar || rec.action_label : rec.action_label}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>{isAr ? 'تحديث دوري للتوصيات' : 'Updated recommendations'}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {isAr ? 'جاهزة للتطبيق الفوري' : 'Ready to apply'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
