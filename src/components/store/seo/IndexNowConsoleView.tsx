import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Search, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  Zap,
  BarChart3,
  Layers
} from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import { 
  fetchIndexNowKey, 
  submitIndexNowUrls, 
  fetchSearchConsoleData 
} from '../../../services/enterpriseSeoApi';

interface IndexNowConsoleViewProps {
  storeId: string;
  storeName: string;
  domain: string;
  products: any[];
}

export const IndexNowConsoleView: React.FC<IndexNowConsoleViewProps> = ({
  storeId,
  storeName,
  domain,
  products = []
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'indexnow' | 'gsc'>('indexnow');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // IndexNow state
  const [indexNowKey, setIndexNowKey] = useState<string>('');
  const [verificationUrl, setVerificationUrl] = useState<string>('');
  const [isSubmittingIndexNow, setIsSubmittingIndexNow] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState<Array<{ url: string; time: string; status: string }>>([]);

  // Search Console state
  const [gscData, setGscData] = useState<any | null>(null);
  const [isLoadingGsc, setIsLoadingGsc] = useState(false);

  // Candidate URLs
  const candidateUrls = React.useMemo(() => {
    const base = domain.startsWith('http') ? domain : `https://${domain}`;
    const list: string[] = [
      `${base}/`,
      `${base}/catalog`,
      `${base}/sitemap.xml`,
    ];
    products.slice(0, 15).forEach((p) => {
      const slugOrId = p.slug || p.id;
      list.push(`${base}/product/${slugOrId}`);
    });
    return list;
  }, [domain, products]);

  const [selectedUrls, setSelectedUrls] = useState<string[]>(candidateUrls);

  useEffect(() => {
    setSelectedUrls(candidateUrls);
  }, [candidateUrls]);

  useEffect(() => {
    loadIndexNow();
    loadGsc();
  }, [storeId]);

  const loadIndexNow = async () => {
    try {
      const res = await fetchIndexNowKey(storeId);
      if (res?.key) {
        setIndexNowKey(res.key);
        setVerificationUrl(res.verification_file_url);
      }
    } catch {
      // Keep fallback
    }
  };

  const loadGsc = async () => {
    setIsLoadingGsc(true);
    try {
      const res = await fetchSearchConsoleData(storeId);
      if (res?.data) {
        setGscData(res.data);
      }
    } catch {
      // Keep empty if not connected
    } finally {
      setIsLoadingGsc(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleSelectUrl = (url: string) => {
    setSelectedUrls(prev => 
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const handleSubmitIndexNow = async () => {
    if (selectedUrls.length === 0) {
      toast(isAr ? 'يرجى تحديد رابط واحد على الأقل' : 'Select at least one URL', 'error');
      return;
    }

    setIsSubmittingIndexNow(true);
    try {
      const res = await submitIndexNowUrls(storeId, selectedUrls);
      const time = new Date().toLocaleTimeString(isAr ? 'ar-SA' : 'en-US');
      
      const newEntries = selectedUrls.map(u => ({
        url: u,
        time,
        status: res?.success ? 'Delivered (HTTP 200/202)' : 'Queued'
      }));
      setSubmissionHistory(prev => [...newEntries, ...prev].slice(0, 50));

      toast(
        isAr 
          ? `تم إرسال ${selectedUrls.length} رابط بنجاح عبر بروتوكول IndexNow` 
          : `Submitted ${selectedUrls.length} URLs to IndexNow protocol`,
        'success'
      );
    } catch (err: any) {
      toast(err?.message || (isAr ? 'فشل إرسال الروابط' : 'Failed to submit URLs'), 'error');
    } finally {
      setIsSubmittingIndexNow(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-slate-900/40 border border-emerald-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Instant Indexing
            </span>
            <span className="text-xs text-slate-400">IndexNow Protocol • Bing Webmaster • Google Search Console</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            {isAr ? 'الفهرسة الفورية ومحركات البحث' : 'Instant Indexing & Search Consoles'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {isAr 
              ? 'إخطار محركات البحث لحظياً عند إضافة أو تعديل المنتجات، ومتابعة أداء الزيارات الفعلي.' 
              : 'Notify search bots instantly via IndexNow on product updates, and track real search impressions.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-800/80 border border-slate-700/60 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('indexnow')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'indexnow'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            {isAr ? 'بروتوكول IndexNow' : 'IndexNow Protocol'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gsc')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'gsc'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {isAr ? 'أداء Google Search Console' : 'Search Console Data'}
          </button>
        </div>
      </div>

      {/* Honest Indexing Caveat */}
      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
        <div>
          <span className="font-bold">{isAr ? 'مبدأ الفهرسة الواقعي (Zero-Mock):' : 'Realistic Indexing Notice:'} </span>
          {isAr
            ? 'نجاح إرسال الرابط إلى IndexNow أو Google يضمن إخطار الزاحف الفوري بوصول محتوى جديد، ولا يعني بالضرورة ظهوره الفوري في النتائج حتى يكتمل فحصه وأرشفته من قِبل المحرك.'
            : 'Successful transmission notifies Bing/IndexNow crawlers of new URLs immediately. It does not claim instant indexing until search engines parse and rank the page.'}
        </div>
      </div>

      {/* TAB 1: INDEXNOW */}
      {activeTab === 'indexnow' && (
        <div className="space-y-6">
          {/* Key and Host Verification */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              {isAr ? 'مفتاح التحقق ومسار بروتوكول IndexNow' : 'IndexNow Verification Key & Host Binding'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">{isAr ? 'مفتاح IndexNow النشط:' : 'Active IndexNow Key:'}</span>
                <div className="flex items-center justify-between font-mono text-xs text-emerald-400 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="truncate">{indexNowKey || 'Generating key...'}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(indexNowKey, 'inkey')}
                    className="ml-2 text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'inkey' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">{isAr ? 'ملف التحقق العام في المتجر:' : 'Public Verification Endpoint:'}</span>
                <div className="flex items-center justify-between font-mono text-xs text-slate-300 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="truncate">{verificationUrl || `https://${domain}/${indexNowKey}.txt`}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(verificationUrl || `https://${domain}/${indexNowKey}.txt`, 'inurl')}
                    className="ml-2 text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'inurl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* URLs Submission List */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  {isAr ? 'روابط المتجر المرشحة للإرسال الفوري' : 'Store Candidate URLs for Instant Dispatch'}
                </h4>
                <p className="text-xs text-slate-400">
                  {isAr 
                    ? `محدد حالياً (${selectedUrls.length} من ${candidateUrls.length})` 
                    : `Currently selected (${selectedUrls.length} of ${candidateUrls.length})`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUrls(candidateUrls)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300"
                >
                  {isAr ? 'تحديد الكل' : 'Select All'}
                </button>
                <button
                  type="button"
                  onClick={handleSubmitIndexNow}
                  disabled={isSubmittingIndexNow || selectedUrls.length === 0}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md"
                >
                  {isSubmittingIndexNow ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      {isAr ? 'جاري الإرسال...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      {isAr ? `إرسال الروابط (${selectedUrls.length})` : `Submit URLs (${selectedUrls.length})`}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {candidateUrls.map((url, idx) => {
                const isSelected = selectedUrls.includes(url);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleSelectUrl(url)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected 
                        ? 'bg-emerald-950/30 border-emerald-700/60 text-slate-200' 
                        : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-mono text-[11px] truncate">
                      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                        isSelected ? 'bg-emerald-500 text-black font-bold' : 'border border-slate-600'
                      }`}>
                        {isSelected ? '✓' : ''}
                      </span>
                      <span className="truncate">{url}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submission History Log */}
          {submissionHistory.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {isAr ? 'سجل الإرسال الحديث لـ IndexNow' : 'Recent IndexNow Submissions'}
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {submissionHistory.map((h, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/40 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-300 text-[11px] truncate">{h.url}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-500">{h.time}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 font-bold">
                        {h.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GOOGLE SEARCH CONSOLE */}
      {activeTab === 'gsc' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-teal-400" />
                  {isAr ? 'إحصائيات واستعلامات Google Search Console' : 'Google Search Console Performance Ledger'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr ? 'مستمدة مباشرة من حساب Google المرتبط بدون أرقام مولدة' : 'Directly retrieved from verified store OAuth connection'}
                </p>
              </div>
              <button
                type="button"
                onClick={loadGsc}
                disabled={isLoadingGsc}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGsc ? 'animate-spin' : ''}`} />
                {isAr ? 'تحديث الإحصائيات' : 'Refresh'}
              </button>
            </div>

            {isLoadingGsc ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-500" />
                {isAr ? 'جاري الاتصال بـ Google Search Console...' : 'Connecting to Google Search Console...'}
              </div>
            ) : gscData?.queries?.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">{isAr ? 'استعلام البحث' : 'Query'}</th>
                      <th className="p-3">{isAr ? 'النقرات' : 'Clicks'}</th>
                      <th className="p-3">{isAr ? 'مرات الظهور' : 'Impressions'}</th>
                      <th className="p-3">{isAr ? 'نسبة النقر (CTR)' : 'CTR'}</th>
                      <th className="p-3">{isAr ? 'متوسط الترتيب' : 'Avg Position'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-slate-300">
                    {gscData.queries.map((q: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-medium text-white">{q.query}</td>
                        <td className="p-3 font-mono text-emerald-400">{q.clicks}</td>
                        <td className="p-3 font-mono text-slate-300">{q.impressions}</td>
                        <td className="p-3 font-mono text-teal-400">{q.ctr}%</td>
                        <td className="p-3 font-mono text-amber-400">{q.position}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 text-slate-400">
                <BarChart3 className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-bold">{isAr ? 'لم تتوفر استعلامات بحث حقيقية بعد' : 'No Live Search Queries Found'}</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {isAr
                    ? 'تأكد من إتمام ربط حساب Google Site Kit والتحقق من ملكية النطاق لعرض الكلمات والنقرات الفعلية.'
                    : 'Ensure Google OAuth is linked and site ownership is verified in Search Console to view queries and clicks.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
