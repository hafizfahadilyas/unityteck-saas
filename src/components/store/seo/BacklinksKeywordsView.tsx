import React, { useState, useEffect } from 'react';
import { 
  Link2, 
  Search, 
  ExternalLink, 
  Plus, 
  Mail, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Tag,
  CheckCircle2
} from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import { 
  fetchSeoBacklinks, 
  fetchSeoKeywords, 
  addSeoKeyword 
} from '../../../services/enterpriseSeoApi';

interface BacklinksKeywordsViewProps {
  storeId: string;
  storeName: string;
  domain: string;
}

export const BacklinksKeywordsView: React.FC<BacklinksKeywordsViewProps> = ({
  storeId,
  storeName,
  domain
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'backlinks' | 'keywords'>('backlinks');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Backlinks state
  const [backlinks, setBacklinks] = useState<any[]>([]);
  const [isLoadingBacklinks, setIsLoadingBacklinks] = useState(false);
  const [outreachModalOpen, setOutreachModalOpen] = useState(false);
  const [outreachTargetDomain, setOutreachTargetDomain] = useState('');
  const [generatedOutreachEmail, setGeneratedOutreachEmail] = useState<{ subject: string; body: string } | null>(null);

  // Keywords state
  const [keywords, setKeywords] = useState<any[]>([]);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  const [showAddKeywordModal, setShowAddKeywordModal] = useState(false);
  const [newKeywordText, setNewKeywordText] = useState('');
  const [newKeywordLang, setNewKeywordLang] = useState<'ar' | 'en'>('ar');
  const [newKeywordIntent, setNewKeywordIntent] = useState<'commercial' | 'informational' | 'transactional' | 'navigational'>('commercial');
  const [isSubmittingKeyword, setIsSubmittingKeyword] = useState(false);

  useEffect(() => {
    loadBacklinks();
    loadKeywords();
  }, [storeId]);

  const loadBacklinks = async () => {
    setIsLoadingBacklinks(true);
    try {
      const res = await fetchSeoBacklinks(storeId);
      if (res?.data) {
        setBacklinks(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      // Keep empty if unconfigured
    } finally {
      setIsLoadingBacklinks(false);
    }
  };

  const loadKeywords = async () => {
    setIsLoadingKeywords(true);
    try {
      const res = await fetchSeoKeywords(storeId);
      if (res?.data) {
        setKeywords(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      // Keep empty
    } finally {
      setIsLoadingKeywords(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateOutreach = (targetDomainName: string) => {
    setOutreachTargetDomain(targetDomainName);
    const subject = isAr 
      ? `طلب تعاون وتغطية لمتجر ${storeName}` 
      : `Collaboration & Editorial Feature Request - ${storeName}`;
    const body = isAr
      ? `السلام عليكم ورحمة الله وبركاته،\n\nفريق عمل ${targetDomainName} الموقر،\n\nنتابع محتواكم القيم والمتميز في التجارة والتسوق بالمملكة العربية السعودية.\nنود مشاركتكم متجرنا (${storeName} - ${domain}) والمتخصص في تقديم تجارب تسوق استثنائية لعملائنا في السعودية.\n\nيسرنا تزويدكم بتغطية حصرية أو معلومات موثقة حول منتجاتنا لإثراء مقالاتكم القادمة، مع إمكانية التنسيق لشراكة رقمية مميزة.\n\nشاكرين لكم وقتكم الكريم،\nفريق ${storeName}\n${domain}`
      : `Hello Editorial Team at ${targetDomainName},\n\nWe love your curated coverage and insightful resources for Saudi retail consumers.\nWe are reaching out from ${storeName} (${domain}), an official Saudi online store.\n\nWe would love to explore an editorial feature or collaboration providing verified retail insights for your upcoming industry guides.\n\nBest regards,\n${storeName} Team\n${domain}`;

    setGeneratedOutreachEmail({ subject, body });
    setOutreachModalOpen(true);
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeywordText.trim()) return;

    setIsSubmittingKeyword(true);
    try {
      await addSeoKeyword(storeId, {
        keyword: newKeywordText.trim(),
        language: newKeywordLang,
        intent: newKeywordIntent,
        search_volume: null, // Zero-mock: unknown unless official API
        difficulty: null
      });
      toast(isAr ? 'تمت إضافة الكلمة المفتاحية بنجاح' : 'Keyword tracked successfully', 'success');
      setNewKeywordText('');
      setShowAddKeywordModal(false);
      loadKeywords();
    } catch (err: any) {
      toast(err?.message || (isAr ? 'فشل إضافة الكلمة' : 'Failed to add keyword'), 'error');
    } finally {
      setIsSubmittingKeyword(false);
    }
  };

  const verifiedBacklinksCount = backlinks.filter(b => b.status === 'verified').length;
  const opportunitiesCount = backlinks.filter(b => b.status === 'opportunity').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-slate-900/40 border border-blue-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Authority & Reach
            </span>
            <span className="text-xs text-slate-400">Genuine Editorial Partnerships & Verified Search Terms</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-400" />
            {isAr ? 'إدارة الروابط الخلفية والكلمات المفتاحية' : 'Backlink Intelligence & Keyword Strategy'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {isAr 
              ? 'مراقبة الروابط الخلفية الحقيقية، والتواصل مع الأدلة المعتمدة، واستهداف الكلمات المفتاحية دون أرقام وهمية.' 
              : 'Monitor authentic backlink profiles, initiate genuine editorial outreach, and track high-intent keywords.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-800/80 border border-slate-700/60 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('backlinks')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'backlinks'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Link2 className="w-4 h-4" />
            {isAr ? 'الروابط والشراكات' : 'Backlinks & Outreach'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('keywords')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'keywords'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            {isAr ? 'الكلمات المفتاحية' : 'Target Keywords'}
          </button>
        </div>
      </div>

      {/* Zero-Fake Policy */}
      <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
        <div>
          <span className="font-bold">{isAr ? 'سياسة النزاهة الرقمية الصارمة:' : 'Strict Integrity & Zero-Spam Policy:'} </span>
          {isAr
            ? 'نظام سوق يحظر كلياً شبكات الروابط الخاصة (PBNs) أو التعليقات المزعجة التلقائية أو الروابط المدفوعة المضللة. كما تظهر مؤشرات حجم البحث فقط عندما تتوفر من مصدر موثوق؛ وخلاف ذلك تصنّف كـ "غير متوفرة" لمنع التضليل.'
            : 'Souq platform strictly forbids Private Blog Networks (PBNs), automated forum spam, or deceptive link purchases. Search volumes and keyword difficulties display "Unavailable" unless connected to a verified API.'}
        </div>
      </div>

      {/* TAB 1: BACKLINKS & OUTREACH */}
      {activeTab === 'backlinks' && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">{isAr ? 'الروابط الموثقة النشطة' : 'Active Verified Backlinks'}</span>
              <span className="text-2xl font-bold text-emerald-400">{verifiedBacklinksCount}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">{isAr ? 'فرص الأدلة والشراكات المقترحة' : 'Outreach Opportunities'}</span>
              <span className="text-2xl font-bold text-blue-400">{opportunitiesCount}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">{isAr ? 'النطاقات المحيلة الفريدة' : 'Unique Referring Domains'}</span>
              <span className="text-2xl font-bold text-purple-400">
                {new Set(backlinks.map(b => b.source_domain)).size}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blue-400" />
              {isAr ? 'سجل الروابط وفرص الشراكات التحريرية' : 'Backlink Ledger & Editorial Opportunities'}
            </h3>
            <button
              type="button"
              onClick={() => handleGenerateOutreach('منصة التجارة السعودية')}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Mail className="w-3.5 h-3.5" />
              {isAr ? 'إنشاء بريد تواصل تحريري' : 'Draft Outreach Pitch'}
            </button>
          </div>

          {/* Backlinks Table */}
          {isLoadingBacklinks ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
              {isAr ? 'جاري تحميل الروابط...' : 'Loading backlink data...'}
            </div>
          ) : backlinks.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">{isAr ? 'النطاق المحيل' : 'Referring Domain'}</th>
                    <th className="p-3">{isAr ? 'نص الرابط (Anchor Text)' : 'Anchor Text'}</th>
                    <th className="p-3">{isAr ? 'الرابط المستهدف' : 'Target URL'}</th>
                    <th className="p-3">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="p-3">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-slate-300">
                  {backlinks.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-medium text-white flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-blue-400" />
                        {b.source_domain || b.source_url}
                      </td>
                      <td className="p-3 text-slate-400">{b.anchor_text || '—'}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-400">{b.target_url}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.status === 'verified' 
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' 
                            : 'bg-blue-950 text-blue-300 border border-blue-800/60'
                        }`}>
                          {b.status === 'verified' ? (isAr ? 'موثق' : 'Verified') : (isAr ? 'فرصة مقترحة' : 'Opportunity')}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => handleGenerateOutreach(b.source_domain || 'الشريك')}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[11px]"
                        >
                          <Mail className="w-3 h-3 text-blue-400" />
                          {isAr ? 'رسالة تواصل' : 'Pitch'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 text-slate-400">
              <Link2 className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-bold">{isAr ? 'لا توجد روابط خلفية مسجلة حتى الآن' : 'No Backlink Records Logged'}</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {isAr
                  ? 'بإمكانك ربط حسابات Google Search Console لاكتشاف النطاقات المحيلة، أو إنشاء خطابات تواصل تحريرية للشراكات.'
                  : 'Connect Google Search Console to detect incoming referring domains, or use our outreach engine for editorial partnerships.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KEYWORD RESEARCH */}
      {activeTab === 'keywords' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" />
                {isAr ? 'استراتيجية الكلمات المفتاحية والبحث المحلي بالسعودية' : 'Target Keyword Strategy & Saudi Local Search'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? 'متابعة نية البحث والمصطلحات الدارجة في المتجر' : 'Track search intent and high-converting retail keywords'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddKeywordModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAr ? 'إضافة كلمة مستهدفة' : 'Add Target Keyword'}
            </button>
          </div>

          {/* Keywords Table */}
          {isLoadingKeywords ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-500" />
              {isAr ? 'جاري تحميل الكلمات...' : 'Loading keywords...'}
            </div>
          ) : keywords.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">{isAr ? 'الكلمة المفتاحية' : 'Keyword'}</th>
                    <th className="p-3">{isAr ? 'اللغة' : 'Language'}</th>
                    <th className="p-3">{isAr ? 'نية البحث' : 'Search Intent'}</th>
                    <th className="p-3">{isAr ? 'حجم البحث الشهري' : 'Search Volume'}</th>
                    <th className="p-3">{isAr ? 'المنافسة' : 'Difficulty'}</th>
                    <th className="p-3">{isAr ? 'تكلفة النقرة (CPC)' : 'CPC'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-slate-300">
                  {keywords.map((kw) => (
                    <tr key={kw.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-white flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-cyan-400" />
                        {kw.keyword}
                      </td>
                      <td className="p-3 uppercase font-mono text-[11px] text-slate-400">{kw.language || 'AR'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-300 font-medium">
                          {kw.intent || 'Commercial'}
                        </span>
                      </td>
                      <td className="p-3">
                        {kw.search_volume !== null && kw.search_volume !== undefined ? (
                          <span className="font-mono text-emerald-400">{kw.search_volume.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">{isAr ? 'غير متوفر' : 'Unavailable'}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {kw.difficulty !== null && kw.difficulty !== undefined ? (
                          <span className="font-mono text-amber-400">{kw.difficulty}%</span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">{isAr ? 'غير متوفر' : 'Unavailable'}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {kw.cpc !== null && kw.cpc !== undefined ? (
                          <span className="font-mono text-slate-300">${kw.cpc}</span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">{isAr ? 'غير متوفر' : 'Unavailable'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-bold">{isAr ? 'لا توجد كلمات مفتاحية مضافة' : 'No Keywords Tracked Yet'}</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {isAr
                  ? 'أضف الكلمات المفتاحية الرئيسية والفرعية التي يبحث بها عملاؤك في السوق السعودي لمراقبة أداء المنتجات.'
                  : 'Add primary and localized Saudi keywords to track search volume and target intent for your store.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Outreach Email Modal */}
      {outreachModalOpen && generatedOutreachEmail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                {isAr ? `خطاب تواصل تحريري لـ ${outreachTargetDomain}` : `Editorial Pitch for ${outreachTargetDomain}`}
              </h3>
              <button
                type="button"
                onClick={() => setOutreachModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'عنوان الرسالة:' : 'Subject:'}</label>
              <div className="p-2.5 rounded-lg bg-slate-800 text-xs text-white font-mono flex items-center justify-between">
                <span>{generatedOutreachEmail.subject}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(generatedOutreachEmail.subject, 'subj')}
                  className="text-blue-400 hover:text-blue-300 text-xs ml-2"
                >
                  {copiedKey === 'subj' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'محتوى الرسالة:' : 'Body:'}</label>
              <textarea
                readOnly
                rows={8}
                value={generatedOutreachEmail.body}
                className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500">
                {isAr ? 'مكتوب بنبرة تحريرية احترافية بدون سبام' : 'Curated editorial pitch (Zero Spam)'}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(generatedOutreachEmail.body, 'body')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                {copiedKey === 'body' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'body' ? (isAr ? 'تم نسخ الرسالة!' : 'Copied!') : (isAr ? 'نسخ نص الرسالة' : 'Copy Email')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Keyword Modal */}
      {showAddKeywordModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddKeyword} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                {isAr ? 'إضافة كلمة مفتاحية جديدة' : 'Add Target Keyword'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddKeywordModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isAr ? 'الكلمة المفتاحية:' : 'Keyword:'}
              </label>
              <input
                type="text"
                required
                placeholder={isAr ? 'مثال: قهوة مختصة سعودية' : 'e.g., saudi specialty coffee'}
                value={newKeywordText}
                onChange={(e) => setNewKeywordText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'اللغة:' : 'Language:'}</label>
                <select
                  value={newKeywordLang}
                  onChange={(e) => setNewKeywordLang(e.target.value as 'ar' | 'en')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="ar">العربية (AR)</option>
                  <option value="en">English (EN)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'نية البحث:' : 'Search Intent:'}</label>
                <select
                  value={newKeywordIntent}
                  onChange={(e) => setNewKeywordIntent(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="commercial">{isAr ? 'تجاري (Commercial)' : 'Commercial'}</option>
                  <option value="transactional">{isAr ? 'شرائي (Transactional)' : 'Transactional'}</option>
                  <option value="informational">{isAr ? 'معلوماتي (Informational)' : 'Informational'}</option>
                  <option value="navigational">{isAr ? 'ملاحي (Navigational)' : 'Navigational'}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddKeywordModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmittingKeyword}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5"
              >
                {isSubmittingKeyword ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {isAr ? 'جاري الحفظ...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    {isAr ? 'حفظ الكلمة' : 'Save Keyword'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
