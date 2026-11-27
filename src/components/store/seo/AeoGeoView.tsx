import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  RefreshCw, 
  ArrowRight,
  ShieldCheck,
  Send,
  FileText,
  Search
} from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import { 
  generateAeoContent, 
  generateGeoContent, 
  saveSeoMetadata 
} from '../../../services/enterpriseSeoApi';

interface AeoGeoViewProps {
  storeId: string;
  storeName: string;
  domain: string;
  products: any[];
}

export const AeoGeoView: React.FC<AeoGeoViewProps> = ({
  storeId,
  storeName,
  domain,
  products = []
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'aeo' | 'geo'>('aeo');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isGeneratingAeo, setIsGeneratingAeo] = useState(false);
  const [isGeneratingGeo, setIsGeneratingGeo] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [aeoResult, setAeoResult] = useState<{
    faqs?: Array<{ question_ar: string; answer_ar: string; question_en: string; answer_en: string; search_intent: string }>;
    buying_guide?: { title_ar: string; title_en: string; content_ar: string; content_en: string };
    conversational_queries?: string[];
  } | null>(null);

  const [geoResult, setGeoResult] = useState<{
    entity_summary_ar?: string;
    entity_summary_en?: string;
    brand_facts?: string[];
    authoritative_claims?: string[];
    ai_readiness_checklist?: Array<{ item: string; status: 'ready' | 'needs_action'; note: string }>;
    schema_entity_jsonld?: Record<string, unknown>;
  } | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateAeo = async () => {
    setIsGeneratingAeo(true);
    try {
      const res = await generateAeoContent(storeId, selectedProductId || undefined);
      if (res?.success && res?.data) {
        setAeoResult(res.data);
        toast(
          isAr 
            ? `تم توليد محتوى AEO بنجاح (رصيد مستهلك: ${res.credits_deducted ?? 2})` 
            : `AEO content generated successfully (Credits used: ${res.credits_deducted ?? 2})`,
          'success'
        );
      } else {
        toast(res?.message || (isAr ? 'تعذر توليد محتوى AEO' : 'Failed to generate AEO content'), 'error');
      }
    } catch (err: any) {
      toast(err?.message || (isAr ? 'فشل الاتصال بمحرك الذكاء' : 'AI Generation connection error'), 'error');
    } finally {
      setIsGeneratingAeo(false);
    }
  };

  const handleGenerateGeo = async () => {
    setIsGeneratingGeo(true);
    try {
      const res = await generateGeoContent(storeId);
      if (res?.success && res?.data) {
        setGeoResult(res.data);
        toast(
          isAr 
            ? `تم توليد ملف توافق محركات التوليد GEO بنجاح (رصيد مستهلك: ${res.credits_deducted ?? 3})` 
            : `GEO alignment pack generated successfully (Credits used: ${res.credits_deducted ?? 3})`,
          'success'
        );
      } else {
        toast(res?.message || (isAr ? 'تعذر توليد ملف GEO' : 'Failed to generate GEO pack'), 'error');
      }
    } catch (err: any) {
      toast(err?.message || (isAr ? 'فشل الاتصال بمحرك الذكاء' : 'AI Generation connection error'), 'error');
    } finally {
      setIsGeneratingGeo(false);
    }
  };

  const handlePublishAeoFaqs = async () => {
    if (!aeoResult?.faqs?.length) return;
    setIsPublishing(true);
    try {
      await saveSeoMetadata(storeId, {
        entity_type: selectedProductId ? 'product' : 'store',
        entity_id: selectedProductId || storeId,
        url_path: selectedProductId ? `/product/${selectedProductId}` : '/',
        payload: {
          aeo_faqs: aeoResult.faqs,
          buying_guide: aeoResult.buying_guide,
          updated_at: new Date().toISOString()
        }
      });
      toast(isAr ? 'تم نشر الأسئلة وإضافتها للبيانات المنظمة بنجاح!' : 'AEO FAQs published and attached to structured data!', 'success');
    } catch (err: any) {
      toast(err?.message || (isAr ? 'فشل نشر البيانات' : 'Failed to publish data'), 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/40 border border-indigo-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Next-Gen Search
            </span>
            <span className="text-xs text-slate-400">Google AI Overviews • ChatGPT • Gemini • Perplexity</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            {isAr ? 'محرك إجابات الذكاء (AEO) ومحركات التوليد (GEO)' : 'Answer Engine (AEO) & Generative Optimization (GEO)'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {isAr 
              ? 'تحسين ظهور متجرك في إجابات الذكاء الاصطناعي والمحادثات بدون وعود وهمية أو روابط زائفة.' 
              : 'Optimize store visibility in AI answers & conversations with strictly verified product facts and zero synthetic claims.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-800/80 border border-slate-700/60 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('aeo')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'aeo'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            {isAr ? 'تحسين الإجابات (AEO)' : 'Answer Engine (AEO)'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('geo')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'geo'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4" />
            {isAr ? 'محركات التوليد (GEO)' : 'Generative Engine (GEO)'}
          </button>
        </div>
      </div>

      {/* Compliance / Zero-Fake Banner */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
        <div>
          <span className="font-bold">{isAr ? 'ميثاق الموثوقية الصارم (Zero-Mock Policy):' : 'Strict Zero-Mock Compliance:'} </span>
          {isAr
            ? 'تعتمد كافة محتويات AEO و GEO على المواصفات الحقيقية والأسعار المخزنة في متجرك فقط. لن يتم توليد مراجعات وهمية أو ادعاءات جوائز مزيفة أو وعود ضمان غير مؤكدة.'
            : 'All AEO and GEO facts stem strictly from verified store database attributes. No fake reviews, synthetic award citations, or unverifiable warranty claims are ever generated.'}
        </div>
      </div>

      {/* TAB 1: AEO - Answer Engine Optimization */}
      {activeTab === 'aeo' && (
        <div className="space-y-6">
          {/* Action Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              {isAr ? 'توليد أسئلة وإجابات تفاعلية ودليل شراء' : 'Generate Conversational FAQs & Buying Guide'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  {isAr ? 'اختر منتجاً مستهدفاً (أو اتركه فارغاً لكامل المتجر):' : 'Target Product (or leave empty for whole store):'}
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">{isAr ? '🏢 كامل المتجر وصفحة البداية' : '🏢 Entire Store & Homepage'}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.title || p.id} ({p.price ? `${p.price} SAR` : 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleGenerateAeo}
                  disabled={isGeneratingAeo}
                  className="w-full px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  {isGeneratingAeo ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {isAr ? 'جاري التحليل والتوليد...' : 'Analyzing & Generating...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {isAr ? 'توليد حزمة AEO (2 رصيد)' : 'Generate AEO Pack (2 Credits)'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results Display */}
          {aeoResult ? (
            <div className="space-y-6">
              {/* Conversational Queries */}
              {aeoResult.conversational_queries && aeoResult.conversational_queries.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
                    {isAr ? 'استفسارات البحث الصوتي والمحادثات الشائعة' : 'Common Conversational & Voice Search Queries'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {aeoResult.conversational_queries.map((q, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-full text-xs bg-indigo-950/60 border border-indigo-800/40 text-indigo-200">
                        💬 "{q}"
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQs List */}
              {aeoResult.faqs && aeoResult.faqs.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-emerald-400" />
                      {isAr ? 'الأسئلة الأكثر بحثاً وإجاباتها الرسمية' : 'Verified Frequently Asked Questions (FAQ)'}
                    </h4>
                    <span className="text-xs text-slate-400">{aeoResult.faqs.length} {isAr ? 'أسئلة موثقة' : 'Verified FAQs'}</span>
                  </div>

                  <div className="space-y-3">
                    {aeoResult.faqs.map((faq, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-emerald-300">
                            س: {faq.question_ar || faq.question_en}
                          </p>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300">
                            {faq.search_intent || 'Informational'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          ج: {faq.answer_ar || faq.answer_en}
                        </p>
                        {faq.question_en && (
                          <div className="mt-2 pt-2 border-t border-slate-700/50 text-[11px] text-slate-400">
                            <span className="font-semibold text-slate-300">EN: </span>
                            {faq.question_en} — {faq.answer_en}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Publish Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handlePublishAeoFaqs}
                      disabled={isPublishing}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
                    >
                      {isPublishing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          {isAr ? 'جاري النشر وتحديث الميتاداتا...' : 'Publishing to Storefront...'}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          {isAr ? 'نشر الأسئلة في المتجر وتضمين JSON-LD' : 'Publish FAQs & Add JSON-LD'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Buying Guide */}
              {aeoResult.buying_guide && (
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    {aeoResult.buying_guide.title_ar || aeoResult.buying_guide.title_en || (isAr ? 'دليل الشراء الذكي' : 'Smart Buying Guide')}
                  </h4>
                  <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                    {aeoResult.buying_guide.content_ar || aeoResult.buying_guide.content_en}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 text-slate-400">
              <HelpCircle className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-bold">{isAr ? 'لم يتم توليد حزمة أسئلة AEO بعد' : 'No AEO Pack Generated Yet'}</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {isAr
                  ? 'اضغط زر التوليد بالأعلى لاستخراج الأسئلة الشائعة من المنتجات وصياغة إجابات مباشرة تلتقطها محركات الذكاء.'
                  : 'Click the button above to extract frequent questions from store products and craft concise answers that AI search bots favor.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GEO - Generative Engine Optimization */}
      {activeTab === 'geo' && (
        <div className="space-y-6">
          {/* Action Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                {isAr ? 'فحص جاهزية محركات الذكاء وتوليد هوية الكيان' : 'AI Engine Readiness & Entity Identity Generator'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr 
                  ? 'يقوم النموذج بفحص اتساق بيانات علامتك التجارية، ووضوح حقائق المنتجات لتسهيل اقتباسها في Google AI Mode وChatGPT Search.' 
                  : 'Analyzes brand consistency and clear product facts for effortless citation in Google AI Mode and ChatGPT Search.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateGeo}
              disabled={isGeneratingGeo}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shrink-0"
            >
              {isGeneratingGeo ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {isAr ? 'جاري الفحص والتوليد...' : 'Auditing & Generating...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {isAr ? 'فحص وتوليد ملف GEO (3 رصيد)' : 'Audit & Generate GEO Pack (3 Credits)'}
                </>
              )}
            </button>
          </div>

          {/* Results Display */}
          {geoResult ? (
            <div className="space-y-6">
              {/* Entity Summary */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  {isAr ? 'ملخص الكيان والمؤسسة للمحركات الذكية' : 'Entity & Brand Summary for LLM Crawlers'}
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200 leading-relaxed">
                  {geoResult.entity_summary_ar || geoResult.entity_summary_en}
                </div>
              </div>

              {/* Verified Brand Facts */}
              {geoResult.brand_facts && (
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    {isAr ? 'الحقائق الموثقة للعلامة التجارية (Brand Facts)' : 'Verified Brand Facts'}
                  </h4>
                  <ul className="space-y-2">
                    {geoResult.brand_facts.map((fact, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Readiness Checklist */}
              {geoResult.ai_readiness_checklist && (
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    {isAr ? 'قائمة التحقق من جاهزية الظهور في الذكاء الاصطناعي' : 'AI Search Readiness Checklist'}
                  </h4>
                  <div className="space-y-2">
                    {geoResult.ai_readiness_checklist.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          {item.status === 'ready' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                          <span className="text-slate-200 font-medium">{item.item}</span>
                        </div>
                        <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                          item.status === 'ready' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                        }`}>
                          {item.note}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* JSON-LD Schema Snippet */}
              {geoResult.schema_entity_jsonld && (
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {isAr ? 'كود Organization JSON-LD المعتمد' : 'Verified Organization JSON-LD'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleCopy(JSON.stringify(geoResult.schema_entity_jsonld, null, 2), 'schema')}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5"
                    >
                      {copiedKey === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey === 'schema' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الكود' : 'Copy')}
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                    {JSON.stringify(geoResult.schema_entity_jsonld, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 text-slate-400">
              <Bot className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-bold">{isAr ? 'لم يتم فحص جاهزية GEO بعد' : 'No GEO Audit Run Yet'}</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {isAr
                  ? 'اضغط زر فحص GEO لتحليل اتساق الهوية الرقمية لعلامتك التجارية والتأكد من قابلية قراءة زواحف LLMs لمتجرك.'
                  : 'Run the GEO audit to verify brand entity consistency and ensure LLM web crawlers parse your storefront accurately.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
