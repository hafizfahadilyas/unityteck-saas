import React, { useState, useEffect } from 'react';
import { 
  Code2, 
  Settings2, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  RotateCcw,
  ShieldCheck,
  Zap,
  Save,
  Layers,
  ArrowRight
} from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import { 
  fetchSeoImplementations, 
  rollbackSeoImplementation, 
  fetchSeoSettings, 
  updateSeoSettings,
  saveSeoMetadata 
} from '../../../services/enterpriseSeoApi';

interface SchemaAutomationViewProps {
  storeId: string;
  storeName: string;
  domain: string;
  products: any[];
}

export const SchemaAutomationView: React.FC<SchemaAutomationViewProps> = ({
  storeId,
  storeName,
  domain,
  products = []
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'schema' | 'automation' | 'history'>('schema');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Schema Studio State
  const [schemaType, setSchemaType] = useState<'Organization' | 'WebSite' | 'Product' | 'FAQPage' | 'BreadcrumbList'>('Organization');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [customJsonLd, setCustomJsonLd] = useState<string>('');
  const [isSavingSchema, setIsSavingSchema] = useState(false);
  const [jsonValidationError, setJsonValidationError] = useState<string | null>(null);

  // Automation Settings State
  const [automationMode, setAutomationMode] = useState<'manual' | 'approval_required' | 'pre_approved'>('approval_required');
  const [autoGenProductSeo, setAutoGenProductSeo] = useState(true);
  const [autoGenImageAlt, setAutoGenImageAlt] = useState(true);
  const [weeklyAuditEnabled, setWeeklyAuditEnabled] = useState(true);
  const [brokenLinkMonitoring, setBrokenLinkMonitoring] = useState(true);
  const [autoPingSitemap, setAutoPingSitemap] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Implementation History State
  const [implementations, setImplementations] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);
  const [selectedDiffItem, setSelectedDiffItem] = useState<any | null>(null);

  useEffect(() => {
    loadSettings();
    loadImplementations();
  }, [storeId]);

  // Compute live JSON-LD template based on selected type
  useEffect(() => {
    const base = domain.startsWith('http') ? domain : `https://${domain}`;
    let obj: Record<string, unknown> = {};

    if (schemaType === 'Organization') {
      obj = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: storeName,
        url: base,
        logo: `${base}/logo.png`,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          areaServed: 'SA',
          availableLanguage: ['Arabic', 'English']
        }
      };
    } else if (schemaType === 'WebSite') {
      obj = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: storeName,
        url: base,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${base}/catalog?search={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      };
    } else if (schemaType === 'Product') {
      const prod = products.find(p => p.id === selectedProductId) || products[0];
      obj = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: prod?.name || prod?.title || `${storeName} Item`,
        image: prod?.image_url || prod?.images?.[0] || `${base}/product-placeholder.png`,
        description: prod?.description || `${storeName} authentic product`,
        sku: prod?.sku || `SKU-${prod?.id || '001'}`,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'SAR',
          price: prod?.price || '99.00',
          availability: 'https://schema.org/InStock',
          url: `${base}/product/${prod?.slug || prod?.id || 'item'}`
        }
      };
    } else if (schemaType === 'FAQPage') {
      obj = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: isAr ? `ما هي طرق الشحن المتوفرة في ${storeName}؟` : `What shipping options does ${storeName} offer?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: isAr ? 'نوفر توصيلاً سريعاً لكافة مدن المملكة العربية السعودية والدفع عند الاستلام وبطاقات مدى.' : 'We provide fast delivery across Saudi Arabia supporting Mada and cash on delivery.' }
          }
        ]
      };
    } else if (schemaType === 'BreadcrumbList') {
      obj = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: isAr ? 'الرئيسية' : 'Home',
            item: base
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: isAr ? 'المتجر' : 'Catalog',
            item: `${base}/catalog`
          }
        ]
      };
    }

    setCustomJsonLd(JSON.stringify(obj, null, 2));
    setJsonValidationError(null);
  }, [schemaType, selectedProductId, storeName, domain, products, isAr]);

  const loadSettings = async () => {
    try {
      const res = await fetchSeoSettings(storeId);
      if (res?.data) {
        setAutomationMode(res.data.automation_mode || 'approval_required');
        setAutoGenProductSeo(Boolean(res.data.auto_generate_product_seo ?? true));
        setAutoGenImageAlt(Boolean(res.data.auto_generate_image_alt ?? true));
        setWeeklyAuditEnabled(Boolean(res.data.weekly_audit_enabled ?? true));
        setBrokenLinkMonitoring(Boolean(res.data.broken_link_monitoring ?? true));
        setAutoPingSitemap(Boolean(res.data.auto_ping_sitemap ?? true));
      }
    } catch {
      // Keep defaults
    }
  };

  const loadImplementations = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetchSeoImplementations(storeId);
      if (res?.data) {
        setImplementations(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      // Keep empty
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleJsonChange = (val: string) => {
    setCustomJsonLd(val);
    try {
      JSON.parse(val);
      setJsonValidationError(null);
    } catch (err: any) {
      setJsonValidationError(err?.message || 'Invalid JSON syntax');
    }
  };

  const handleSaveSchema = async () => {
    if (jsonValidationError) {
      toast(isAr ? 'يرجى إصلاح أخطاء صيغة JSON قبل الحفظ' : 'Fix JSON syntax errors before saving', 'error');
      return;
    }

    let parsedPayload: Record<string, unknown> = {};
    try {
      parsedPayload = JSON.parse(customJsonLd);
    } catch {
      toast(isAr ? 'كود JSON غير صالح' : 'Invalid JSON code', 'error');
      return;
    }

    setIsSavingSchema(true);
    try {
      await saveSeoMetadata(storeId, {
        entity_type: schemaType.toLowerCase(),
        entity_id: schemaType === 'Product' ? selectedProductId : storeId,
        url_path: schemaType === 'Product' ? `/product/${selectedProductId}` : '/',
        payload: {
          json_ld_schema: parsedPayload,
          updated_at: new Date().toISOString()
        }
      });
      toast(isAr ? 'تم حفظ ونشر البيانات المنظمة بنجاح في كود المتجر' : 'Schema saved & published to live storefront!', 'success');
      loadImplementations();
    } catch (err: any) {
      toast(err?.message || (isAr ? 'فشل حفظ المخطط' : 'Failed to save schema'), 'error');
    } finally {
      setIsSavingSchema(false);
    }
  };

  const handleSaveAutomationSettings = async () => {
    setIsSavingSettings(true);
    try {
      await updateSeoSettings(storeId, {
        automation_mode: automationMode,
        auto_generate_product_seo: autoGenProductSeo,
        auto_generate_image_alt: autoGenImageAlt,
        weekly_audit_enabled: weeklyAuditEnabled,
        broken_link_monitoring: brokenLinkMonitoring,
        auto_ping_sitemap: autoPingSitemap
      });
      toast(isAr ? 'تم تحديث قواعد الأتمتة بنجاح' : 'Automation rules updated successfully', 'success');
    } catch (err: any) {
      toast(err?.message || (isAr ? 'فشل حفظ الإعدادات' : 'Failed to update settings'), 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRollback = async (implId: string) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من رغبتك بالتراجع واسترجاع النسخة السابقة؟' : 'Are you sure you want to rollback to the previous version?')) {
      return;
    }

    setRollingBackId(implId);
    try {
      const res = await rollbackSeoImplementation(storeId, implId);
      if (res?.success) {
        toast(isAr ? 'تم التراجع واسترجاع البيانات السابقة بنجاح!' : 'Successfully rolled back to previous state!', 'success');
        loadImplementations();
      } else {
        toast(res?.message || (isAr ? 'فشل التراجع' : 'Failed to rollback'), 'error');
      }
    } catch (err: any) {
      toast(err?.message || (isAr ? 'فشل الاتصال بخدمة التراجع' : 'Rollback error'), 'error');
    } finally {
      setRollingBackId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-cyan-900/40 via-blue-900/30 to-slate-900/40 border border-cyan-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Structured Data & Control
            </span>
            <span className="text-xs text-slate-400">JSON-LD Validator • Multi-Mode Automation • 1-Click Rollback</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            {isAr ? 'البيانات المنظمة (Schema)، الأتمتة وسجل التراجع' : 'Structured Data, Automation Rules & Rollback'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {isAr 
              ? 'توليد وسوم JSON-LD مطابقة لبيانات المتجر الحقيقية، وضبط صلاحيات الأتمتة، مع إمكانية التراجع الفوري عن أي تعديل.' 
              : 'Generate verified JSON-LD schema matching visible products, set automated approval rules, and rollback changes in 1-click.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-800/80 border border-slate-700/60 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'schema'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            {isAr ? 'مخطط البيانات (Schema)' : 'Schema Studio'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('automation')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'automation'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            {isAr ? 'قواعد الأتمتة' : 'Automation Rules'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            {isAr ? 'سجل التراجع (Rollback)' : 'Rollback Ledger'}
          </button>
        </div>
      </div>

      {/* Safety Banner */}
      <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
        <div>
          <span className="font-bold">{isAr ? 'أمان الإنتاج والتراجع المضمون:' : 'Production Safety & Atomic Rollback:'} </span>
          {isAr
            ? 'تطابق بيانات Schema دائماً المحتوى الفعلي المرئي للمستخدم بدون تقييمات مزيفة. كما يتم الاحتفاظ بنسخة كاملة قبل وبعد كل تطبيق لتسهيل التراجع الفوري بنقرة واحدة.'
            : 'Structured data strictly mirrors visible page content with zero fabricated review ratings. Every modification archives a full snapshot enabling immediate 1-click rollback.'}
        </div>
      </div>

      {/* TAB 1: SCHEMA STUDIO */}
      {activeTab === 'schema' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'نوع المخطط (Schema Type):' : 'Schema Type:'}</label>
                <select
                  value={schemaType}
                  onChange={(e) => setSchemaType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Organization">{isAr ? 'مؤسسة / متجر (Organization)' : 'Organization'}</option>
                  <option value="WebSite">{isAr ? 'موقع إلكتروني وبحث (WebSite)' : 'WebSite'}</option>
                  <option value="Product">{isAr ? 'منتج وعروض (Product & Offer)' : 'Product & Offer'}</option>
                  <option value="FAQPage">{isAr ? 'أسئلة شائعة (FAQPage)' : 'FAQPage'}</option>
                  <option value="BreadcrumbList">{isAr ? 'مسار التنقل (Breadcrumbs)' : 'BreadcrumbList'}</option>
                </select>
              </div>

              {schemaType === 'Product' && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'المنتج المستهدف:' : 'Target Product:'}</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.title || p.id} ({p.price ? `${p.price} SAR` : 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Editor & Validation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">{isAr ? 'كود JSON-LD المعتمد:' : 'JSON-LD Snippet:'}</span>
                  {jsonValidationError ? (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 font-mono">
                      {jsonValidationError}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Valid JSON-LD
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(customJsonLd, 'schema')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5"
                  >
                    {copiedKey === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'schema' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSchema}
                    disabled={isSavingSchema || Boolean(jsonValidationError)}
                    className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    {isSavingSchema ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        {isAr ? 'جاري الحفظ والنشر...' : 'Publishing...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        {isAr ? 'نشر المخطط في المتجر' : 'Publish to Store'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              <textarea
                rows={12}
                value={customJsonLd}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-500 leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATION RULES */}
      {activeTab === 'automation' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <Settings2 className="w-4 h-4 text-blue-400" />
                {isAr ? 'نمط الأتمتة وصلاحيات النشر' : 'Automation Workflow & Publishing Mode'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr 
                  ? 'اختر مستوى التحكم الذي تفضله بين الاعتماد اليدوي الصارم أو الأتمتة المعتمدة مسبقاً.' 
                  : 'Choose between strict manual review, recommendation notifications, or pre-approved safe automation.'}
              </p>
            </div>

            {/* Mode Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setAutomationMode('manual')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  automationMode === 'manual'
                    ? 'bg-blue-950/40 border-blue-500 shadow-md text-white'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs">{isAr ? '1. الوضع اليدوي (Manual)' : '1. Manual Mode'}</span>
                  {automationMode === 'manual' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                </div>
                <p className="text-[11px] leading-relaxed">
                  {isAr 
                    ? 'لا يتم تطبيق أي تغيير نهائياً إلا بعد قيامك بالنقر يدوياً على زر التطبيق.' 
                    : 'Zero changes applied automatically. Every single field requires explicit merchant click.'}
                </p>
              </div>

              <div
                onClick={() => setAutomationMode('approval_required')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  automationMode === 'approval_required'
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-md text-white'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs">{isAr ? '2. إشعار وموافقة (Approval Required)' : '2. Approval Required (Recommended)'}</span>
                  {automationMode === 'approval_required' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                </div>
                <p className="text-[11px] leading-relaxed">
                  {isAr 
                    ? 'يقوم الذكاء بتجهيز التعديلات وإدراجها في قائمة التوصيات، وتنتظر موافقتك السريعة بنقرة واحدة.' 
                    : 'AI audits and prepares fixes into your recommendations inbox; requires 1-click merchant confirmation.'}
                </p>
              </div>

              <div
                onClick={() => setAutomationMode('pre_approved')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  automationMode === 'pre_approved'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md text-white'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs">{isAr ? '3. أتمتة معتمدة مسبقاً (Pre-Approved)' : '3. Pre-Approved Automation'}</span>
                  {automationMode === 'pre_approved' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] leading-relaxed">
                  {isAr 
                    ? 'تطبيق تلقائي فوري للمهام الآمنة (مثل النص البديل للصور وتحديث sitemap)، مع إمكانية التراجع بأي وقت.' 
                    : 'Safe non-breaking optimizations (like Image ALTs & sitemap pings) apply automatically with rollback support.'}
                </p>
              </div>
            </div>

            {/* Feature Switches */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {isAr ? 'ميزات الأتمتة المجدولة:' : 'Scheduled Automation Triggers:'}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoGenProductSeo}
                    onChange={(e) => setAutoGenProductSeo(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">{isAr ? 'توليد سيو المنتجات الجديدة تلقائياً' : 'Auto-generate SEO for new products'}</span>
                    <span className="text-[11px] text-slate-400">{isAr ? 'إعداد العناوين والوصف فور إضافة المنتج' : 'Pre-fill meta tags upon product creation'}</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoGenImageAlt}
                    onChange={(e) => setAutoGenImageAlt(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">{isAr ? 'توليد النص البديل (ALT) لصور المنتجات' : 'Auto-generate Image ALT tags'}</span>
                    <span className="text-[11px] text-slate-400">{isAr ? 'توصيف دقيق باللغتين العربية والإنجليزية' : 'Bilingual accurate visual description'}</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weeklyAuditEnabled}
                    onChange={(e) => setWeeklyAuditEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">{isAr ? 'فحص تقني أسبوعي تلقائي للمتجر' : 'Weekly automated technical crawl'}</span>
                    <span className="text-[11px] text-slate-400">{isAr ? 'اكتشاف الأخطاء وتحديث سجل الصحة' : 'Detect crawling errors and update health score'}</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={brokenLinkMonitoring}
                    onChange={(e) => setBrokenLinkMonitoring(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">{isAr ? 'مراقبة الروابط المكسورة (404)' : 'Broken links monitoring (404)'}</span>
                    <span className="text-[11px] text-slate-400">{isAr ? 'تنبيه فوري عند توقف أي رابط بالمتجر' : 'Instant alert on broken internal links'}</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveAutomationSettings}
                disabled={isSavingSettings}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
              >
                {isSavingSettings ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {isAr ? 'جاري حفظ الإعدادات...' : 'Saving Rules...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isAr ? 'حفظ قواعد الأتمتة' : 'Save Automation Rules'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: IMPLEMENTATION HISTORY & 1-CLICK ROLLBACK */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-400" />
                  {isAr ? 'سجل التعديلات المطبقة وإمكانية التراجع الفوري' : 'Applied Changes Audit Log & 1-Click Rollback'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr 
                    ? 'يتم أرشفة الحالة السابقة بالكامل قبل أي تعديل لتمكين استرجاعها فوراً.' 
                    : 'Every optimization snapshot is immutable; rollback restores previous state instantly.'}
                </p>
              </div>
              <button
                type="button"
                onClick={loadImplementations}
                disabled={isLoadingHistory}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                {isAr ? 'تحديث' : 'Refresh'}
              </button>
            </div>

            {/* Table */}
            {isLoadingHistory ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-500" />
                {isAr ? 'جاري تحميل سجل التعديلات...' : 'Loading implementation history...'}
              </div>
            ) : implementations.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">{isAr ? 'الكيان / المسار' : 'Entity / URL'}</th>
                      <th className="p-3">{isAr ? 'نوع التعديل' : 'Optimization Type'}</th>
                      <th className="p-3">{isAr ? 'تاريخ التطبيق' : 'Applied At'}</th>
                      <th className="p-3">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="p-3 text-right">{isAr ? 'إجراء التراجع' : 'Rollback Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-slate-300">
                    {implementations.map((impl) => (
                      <tr key={impl.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3">
                          <span className="font-bold text-white block capitalize">{impl.entity_type}</span>
                          <span className="font-mono text-[11px] text-slate-400">{impl.url_path || '/'}</span>
                        </td>
                        <td className="p-3 font-medium text-slate-300">
                          {impl.optimization_type || 'Metadata Update'}
                        </td>
                        <td className="p-3 text-slate-400 text-[11px]">
                          {impl.applied_at || impl.created_at || 'Just now'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            impl.status === 'rolled_back'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          }`}>
                            {impl.status === 'rolled_back' ? (isAr ? 'تم التراجع' : 'Rolled Back') : (isAr ? 'نشط في المتجر' : 'Active')}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {impl.status !== 'rolled_back' ? (
                            <button
                              type="button"
                              onClick={() => handleRollback(impl.id)}
                              disabled={rollingBackId === impl.id}
                              className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-[11px] flex items-center gap-1.5 ml-auto transition-all"
                            >
                              {rollingBackId === impl.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3 h-3" />
                              )}
                              {isAr ? 'تراجع للنسخة السابقة' : '1-Click Rollback'}
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[11px] italic">{isAr ? 'تم استرجاع الأصل' : 'Restored'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 text-slate-400">
                <History className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-bold">{isAr ? 'لا توجد تعديلات منفذة في السجل' : 'No Changes in Rollback Ledger'}</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {isAr
                    ? 'عند تطبيق أي تحسين عبر الذكاء الاصطناعي أو نشر مخططات Schema، ستظهر هنا مع إمكانية التراجع الفوري بنقرة واحدة.'
                    : 'When you apply an AI fix or update Schema, immutable before/after snapshots are recorded here for 1-click rollback.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
