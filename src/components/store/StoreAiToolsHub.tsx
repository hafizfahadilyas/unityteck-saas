import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Headphones,
  Image as ImageIcon,
  Loader2,
  Megaphone,
  Phone,
  PhoneCall,
  PhoneOff,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Volume2,
  Wand2,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { StoreAiMediaGenerator } from './StoreAiMediaGenerator';
import { StoreAiStudio } from './StoreAiStudio';
import { StoreAiPaymentModal } from './StoreAiPaymentModal';
import { StoreAiQuotaMeter } from './StoreAiQuotaMeter';
import {
  askAiSuiteAutomation,
  createStoreAiDevRequest,
  fetchAiPayments,
  fetchAiSuiteStatus,
  fetchStoreAiDevRequests,
  runAiEngineModule,
  type AiDevSupportRequest,
  type AiPaymentRecord,
  type AiSuiteModule,
  type AiSuiteStatus,
} from '../../services/storeAiSuiteApi';

export interface StoreAiToolsHubProps {
  onNavigateTab?: (tab: string) => void;
}

type MainTab =
  | 'overview'
  | 'images'
  | 'support'
  | 'bugfix'
  | 'calling'
  | 'growth'
  | 'payments';

interface SupportHistoryItem {
  id: string;
  query: string;
  reply: string;
  tone: 'saudi' | 'formal' | 'english';
  createdAt: string;
}

interface DiagHistoryItem {
  id: string;
  description: string;
  errorLog?: string;
  diagnosis: string;
  createdAt: string;
}

interface CallHistoryItem {
  id: string;
  customerName: string;
  customerPhone: string;
  orderNumber: string;
  scenario: string;
  durationSeconds: number;
  script: string;
  createdAt: string;
}

interface GrowthLibraryItem {
  id: string;
  module: string;
  prompt: string;
  result: string;
  createdAt: string;
}

export const StoreAiToolsHub: React.FC<StoreAiToolsHubProps> = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';
  const storeId = activeStore?.id || '';

  const [activeTab, setActiveTab] = useState<MainTab>('overview');
  const [suite, setSuite] = useState<AiSuiteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [payModule, setPayModule] = useState<AiSuiteModule>('text');

  // Copied indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ========================================================
  // 1. Customer Support State & Dedicated Data
  // ========================================================
  const [supportQuery, setSupportQuery] = useState('');
  const [supportTone, setSupportTone] = useState<'saudi' | 'formal' | 'english'>('saudi');
  const [supportReply, setSupportReply] = useState('');
  const [supportBusy, setSupportBusy] = useState(false);
  const [supportHistory, setSupportHistory] = useState<SupportHistoryItem[]>(() => {
    if (!storeId) return [];
    try {
      const saved = localStorage.getItem(`souq_ai_support_history_${storeId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ========================================================
  // 2. Bug Fix & Diagnostics State & Dedicated Data
  // ========================================================
  const [bugDescription, setBugDescription] = useState('');
  const [bugErrorLog, setBugErrorLog] = useState('');
  const [bugDiagnosis, setBugDiagnosis] = useState('');
  const [bugBusy, setBugBusy] = useState(false);
  const [devRequests, setDevRequests] = useState<AiDevSupportRequest[]>([]);
  const [diagHistory, setDiagHistory] = useState<DiagHistoryItem[]>(() => {
    if (!storeId) return [];
    try {
      const saved = localStorage.getItem(`souq_ai_diag_history_${storeId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ========================================================
  // 3. AI Voice Calling Simulator State & Dedicated Data
  // ========================================================
  const [callScenario, setCallScenario] = useState<'order_confirm' | 'abandoned_cart' | 'delivery_coord' | 'satisfaction'>('order_confirm');
  const [customerPhone, setCustomerPhone] = useState('+966 54 819 2831');
  const [customerName, setCustomerName] = useState('عبدالله الحربي');
  const [orderNumber, setOrderNumber] = useState('#SO-9821');
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [callScript, setCallScript] = useState('');
  const [callBusy, setCallBusy] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>(() => {
    if (!storeId) return [];
    try {
      const saved = localStorage.getItem(`souq_ai_call_history_${storeId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ========================================================
  // 4. Growth, SEO & Copy State & Dedicated Data
  // ========================================================
  const [growthModule, setGrowthModule] = useState<string>('seo_assistant');
  const [growthPrompt, setGrowthPrompt] = useState('');
  const [growthResult, setGrowthResult] = useState('');
  const [growthBusy, setGrowthBusy] = useState(false);
  const [copyLibrary, setCopyLibrary] = useState<GrowthLibraryItem[]>(() => {
    if (!storeId) return [];
    try {
      const saved = localStorage.getItem(`souq_ai_copy_lib_${storeId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ========================================================
  // 5. Payments List State
  // ========================================================
  const [paymentsList, setPaymentsList] = useState<AiPaymentRecord[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  // Sync state to localStorage per store
  useEffect(() => {
    if (!storeId) return;
    try {
      localStorage.setItem(`souq_ai_support_history_${storeId}`, JSON.stringify(supportHistory));
    } catch {}
  }, [supportHistory, storeId]);

  useEffect(() => {
    if (!storeId) return;
    try {
      localStorage.setItem(`souq_ai_diag_history_${storeId}`, JSON.stringify(diagHistory));
    } catch {}
  }, [diagHistory, storeId]);

  useEffect(() => {
    if (!storeId) return;
    try {
      localStorage.setItem(`souq_ai_call_history_${storeId}`, JSON.stringify(callHistory));
    } catch {}
  }, [callHistory, storeId]);

  useEffect(() => {
    if (!storeId) return;
    try {
      localStorage.setItem(`souq_ai_copy_lib_${storeId}`, JSON.stringify(copyLibrary));
    } catch {}
  }, [copyLibrary, storeId]);

  // Load Status, Payments, and Dev Tickets
  const loadAll = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const data = await fetchAiSuiteStatus(storeId);
      setSuite(data);
      if (data.payments) {
        setPaymentsList(data.payments);
      } else {
        try {
          const pays = await fetchAiPayments(storeId);
          setPaymentsList(pays);
        } catch {
          setPaymentsList([]);
        }
      }
      try {
        const reqs = await fetchStoreAiDevRequests(storeId);
        setDevRequests(reqs);
      } catch {
        setDevRequests([]);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setLoading(false);
    }
  }, [storeId, toast]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Timer for Voice Call simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const openUpgradeModal = (mod: AiSuiteModule = 'text') => {
    setPayModule(mod);
    setPayOpen(true);
  };

  const handleCopy = (text: string, id: string = 'generic') => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2200);
    toast(isAr ? 'تم النسخ إلى الحافظة' : 'Copied to clipboard', 'success');
  };

  // Run AI Customer Support
  const handleRunSupport = async () => {
    if (!supportQuery.trim() || !storeId) return;
    setSupportBusy(true);
    setSupportReply('');
    try {
      const promptText = `Tone: ${supportTone === 'saudi' ? 'Friendly Saudi Arabic' : supportTone === 'formal' ? 'Formal Arabic' : 'Professional English'}\nCustomer Inquiry: ${supportQuery}`;
      const res = await runAiEngineModule(storeId, 'customer_support', promptText);
      if (res.ok && res.data?.content) {
        const replyText = res.data.content;
        setSupportReply(replyText);
        setSupportHistory((prev) => [
          {
            id: `supp_${Date.now()}`,
            query: supportQuery.trim(),
            reply: replyText,
            tone: supportTone,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.slice(0, 24),
        ]);
        void loadAll();
      } else if (res.payment_required) {
        openUpgradeModal('text');
        toast(res.message || (isAr ? 'تم استهلاك الرصيد التجريبي، يُرجى الترقية' : 'Free trial exhausted. Please upgrade plan.'), 'error');
      } else {
        toast(res.message || (isAr ? 'تعذر توليد رد الدعم' : 'Error generating support reply'), 'error');
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setSupportBusy(false);
    }
  };

  // Run AI Bug Fix Diagnostics
  const handleRunBugDiagnostics = async () => {
    if (!bugDescription.trim() || !storeId) return;
    setBugBusy(true);
    setBugDiagnosis('');
    try {
      const promptText = `Issue: ${bugDescription}\nError Log/Details: ${bugErrorLog || 'None provided'}`;
      const res = await runAiEngineModule(storeId, 'developer_diagnostics', promptText);
      if (res.ok && res.data?.content) {
        const diagText = res.data.content;
        setBugDiagnosis(diagText);
        setDiagHistory((prev) => [
          {
            id: `diag_${Date.now()}`,
            description: bugDescription.trim(),
            errorLog: bugErrorLog.trim() || undefined,
            diagnosis: diagText,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.slice(0, 19),
        ]);
        void loadAll();
      } else if (res.payment_required) {
        openUpgradeModal('text');
        toast(res.message || (isAr ? 'تم استهلاك الرصيد التجريبي، يُرجى الترقية' : 'Free trial exhausted. Please upgrade plan.'), 'error');
      } else {
        toast(res.message || (isAr ? 'تعذر تشخيص الخلل' : 'Error diagnosing issue'), 'error');
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setBugBusy(false);
    }
  };

  // Submit Official Developer Ticket
  const handleSubmitDevTicket = async () => {
    if (!bugDescription.trim() || !storeId) return;
    try {
      await createStoreAiDevRequest(storeId, {
        title: bugDescription.slice(0, 80),
        description: `${bugDescription}\n\nError Log:\n${bugErrorLog}\n\nAI Diagnostics:\n${bugDiagnosis}`,
        category: 'bug_fix',
        priority: 'high',
      });
      toast(isAr ? 'تم فتح طلب دعم فني مباشر للمطورين بنجاح' : 'Developer support request opened!', 'success');
      const reqs = await fetchStoreAiDevRequests(storeId);
      setDevRequests(reqs);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error');
    }
  };

  // Run Voice Call Simulator
  const handleStartCall = async () => {
    if (!storeId) return;
    setCallBusy(true);
    setCallStatus('calling');
    setCallDuration(0);

    const scenarioText =
      callScenario === 'order_confirm'
        ? `Order Confirmation call for customer ${customerName}, order ${orderNumber}, phone ${customerPhone}. Verify shipping address in Saudi Arabia, COD payment method, and confirm dispatch.`
        : callScenario === 'abandoned_cart'
          ? `Abandoned Cart Recovery call for customer ${customerName}, phone ${customerPhone}. Offer 10% discount code SOUQ10 and assist checkout.`
          : callScenario === 'delivery_coord'
            ? `Delivery Coordination call for order ${orderNumber}. Courier arriving today between 4 PM and 8 PM.`
            : `VIP Customer Satisfaction follow-up call for customer ${customerName}.`;

    try {
      const res = await runAiEngineModule(storeId, 'voice_partner', scenarioText);
      if (res.ok && res.data?.content) {
        const scriptText = res.data.content;
        setCallScript(scriptText);
        setCallStatus('connected');
        void loadAll();

        // Real Speech Synthesis in browser
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const cleanSpeechText = scriptText
            .replace(/[#*`_]/g, '')
            .split('\n')
            .filter((l) => l.trim().length > 0)
            .slice(0, 4)
            .join(' ');

          const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
          utterance.lang = isAr ? 'ar-SA' : 'en-US';
          utterance.rate = 0.95;
          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);
          window.speechSynthesis.speak(utterance);
        }
      } else if (res.payment_required) {
        setCallStatus('idle');
        openUpgradeModal('text');
        toast(res.message || (isAr ? 'تم استهلاك الرصيد التجريبي' : 'Free trial exhausted. Please upgrade plan.'), 'error');
      } else {
        setCallStatus('idle');
        toast(res.message || (isAr ? 'تعذر تشغيل المكالمة' : 'Error generating voice call script'), 'error');
      }
    } catch (e) {
      setCallStatus('idle');
      toast(e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setCallBusy(false);
    }
  };

  const handleEndCall = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setCallStatus('ended');

    // Save call to history
    if (callScript) {
      setCallHistory((prev) => [
        {
          id: `call_${Date.now()}`,
          customerName,
          customerPhone,
          orderNumber,
          scenario: callScenario,
          durationSeconds: callDuration,
          script: callScript,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.slice(0, 19),
      ]);
    }

    setTimeout(() => setCallStatus('idle'), 2500);
  };

  // Run Growth / Marketing Tool
  const handleRunGrowth = async () => {
    if (!growthPrompt.trim() || !storeId) return;
    setGrowthBusy(true);
    setGrowthResult('');
    try {
      let res;
      if (growthModule === 'analytics_assistant') {
        res = await askAiSuiteAutomation(storeId, growthPrompt);
      } else {
        res = await runAiEngineModule(storeId, growthModule, growthPrompt);
      }

      if (res.ok && res.data?.content) {
        const content = res.data.content;
        setGrowthResult(content);
        setCopyLibrary((prev) => [
          {
            id: `copy_${Date.now()}`,
            module: growthModule,
            prompt: growthPrompt.trim(),
            result: content,
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev.slice(0, 29),
        ]);
        void loadAll();
      } else if (res.payment_required) {
        openUpgradeModal('text');
        toast(res.message || (isAr ? 'تم استهلاك الرصيد التجريبي، يُرجى الترقية' : 'Free trial exhausted. Please upgrade plan.'), 'error');
      } else {
        toast(res.message || (isAr ? 'تعذر توليد المحتوى' : 'Error generating content'), 'error');
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setGrowthBusy(false);
    }
  };

  // Nav Items - 7 EQUAL SIZE BUTTONS
  const navButtons: Array<{
    id: MainTab;
    labelEn: string;
    labelAr: string;
    Icon: React.ElementType;
    badge?: string;
    accentColor: string;
  }> = [
    {
      id: 'overview',
      labelEn: 'All AI Hub',
      labelAr: 'مركز الوكلاء',
      Icon: Sparkles,
      accentColor: 'indigo',
    },
    {
      id: 'images',
      labelEn: 'Creative Studio',
      labelAr: 'استوديو الصور',
      Icon: ImageIcon,
      accentColor: 'purple',
    },
    {
      id: 'support',
      labelEn: 'Customer Support',
      labelAr: 'دعم العملاء',
      Icon: Headphones,
      accentColor: 'emerald',
    },
    {
      id: 'bugfix',
      labelEn: 'Bug Fix & Code',
      labelAr: 'إصلاح الأخطاء',
      Icon: Code2,
      accentColor: 'amber',
    },
    {
      id: 'calling',
      labelEn: 'Voice Calling',
      labelAr: 'المكالمات الذكية',
      Icon: PhoneCall,
      badge: 'Live',
      accentColor: 'blue',
    },
    {
      id: 'growth',
      labelEn: 'Growth & SEO',
      labelAr: 'النمو والـ SEO',
      Icon: Megaphone,
      accentColor: 'rose',
    },
    {
      id: 'payments',
      labelEn: 'Payment Slips',
      labelAr: 'إيصالات السداد',
      Icon: CreditCard,
      accentColor: 'teal',
    },
  ];

  const filteredPayments = useMemo(() => {
    if (paymentFilter === 'all') return paymentsList;
    return paymentsList.filter((p) => p.status === paymentFilter);
  }, [paymentsList, paymentFilter]);

  return (
    <div className="space-y-6 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
              {isAr ? 'منظومة وكلاء الذكاء الاصطناعي للمتجر' : 'Store AI Agents Suite'}
            </h1>
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm"
              style={{
                borderColor: 'var(--border)',
                background: 'color-mix(in srgb, var(--accent) 10%, var(--surface))',
                color: 'var(--accent)',
              }}
            >
              {suite?.plan_code?.toUpperCase() || 'PRO'}
            </span>
          </div>
          <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'صفحة متكاملة لجميع أدوات ووكلاء الذكاء (صور، دعم، أخطاء، مكالمات، نمو، سداد) بأزرار متساوية وصفحات وبيانات مستقلة لكل أداة'
              : 'Unified AI suite · Equal-size buttons · Dedicated data & independent pages · Full live working'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadAll()}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {isAr ? 'تحديث السعات' : 'Refresh Quota'}
          </button>
          <button
            type="button"
            onClick={() => openUpgradeModal('text')}
            className="unity-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <CreditCard className="w-3.5 h-3.5" />
            {isAr ? 'ترقية الباقة وإرفاق الإيصال' : 'Upgrade & Upload Slip'}
          </button>
        </div>
      </div>

      {/* Top Quota Meter & 5-Item Free Trial Strip */}
      <StoreAiQuotaMeter
        suite={suite}
        loading={loading}
        isAr={isAr}
        onLockedClick={openUpgradeModal}
        onUpgradeClick={() => openUpgradeModal('text')}
      />

      {/* ======================================================== */}
      {/* EQUAL-SIZE ACTION BUTTONS NAVIGATION GRID */}
      {/* ======================================================== */}
      <div className="w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {navButtons.map((btn) => {
            const active = activeTab === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setActiveTab(btn.id)}
                className={`w-full min-h-[58px] sm:min-h-[64px] flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border text-center transition-all cursor-pointer relative select-none ${
                  active
                    ? 'shadow-md ring-2 ring-accent/30 font-black'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 font-bold hover:border-accent/40'
                }`}
                style={{
                  background: active ? 'var(--portal-cta)' : 'var(--surface)',
                  borderColor: active ? 'transparent' : 'var(--border)',
                  color: active ? '#ffffff' : 'var(--text)',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <btn.Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-accent'}`} />
                  <span className="text-xs tracking-tight line-clamp-1">{isAr ? btn.labelAr : btn.labelEn}</span>
                </div>

                {btn.badge ? (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                      active ? 'bg-white text-emerald-700' : 'bg-emerald-500 text-white animate-pulse'
                    }`}
                  >
                    {btn.badge}
                  </span>
                ) : (
                  <span
                    className={`text-[9px] px-1 rounded font-medium ${
                      active ? 'text-white/80' : 'text-muted-foreground'
                    }`}
                  >
                    {active ? (isAr ? 'الصفحة الحالية' : 'Active View') : (isAr ? 'فتح' : 'Open')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. OVERVIEW & QUICK LAUNCHER TAB (EQUAL SIZE CARDS) */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {/* Card 1: Creative Images */}
            <div
              onClick={() => setActiveTab('images')}
              className="group p-5 rounded-2xl border transition-all hover:shadow-lg hover:border-accent/50 cursor-pointer relative overflow-hidden flex flex-col justify-between"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black mb-1 group-hover:text-accent transition-colors" style={{ color: 'var(--text)' }}>
                  {isAr ? 'استوديو توليد وتصميم الصور بالذكاء' : 'AI Creative Image Studio'}
                </h3>
                <p className="text-xs mb-4 font-medium line-clamp-2" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'توليد صور إعلانية وبوسترات منتجات مطابقة لهوية المتجر بدقة عالية مع خيارات المقاسات.'
                    : 'High-res product creatives, social banners, and marketing photography tailored to your brand.'}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-black text-accent pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <span>{isAr ? 'فتح استوديو الصور' : 'Open Studio Page'}</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Customer Support */}
            <div
              onClick={() => setActiveTab('support')}
              className="group p-5 rounded-2xl border transition-all hover:shadow-lg hover:border-accent/50 cursor-pointer relative overflow-hidden flex flex-col justify-between"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Headphones className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black mb-1 group-hover:text-accent transition-colors" style={{ color: 'var(--text)' }}>
                  {isAr ? 'وكيل دعم العملاء والمحادثات المباشرة' : 'AI Customer Support Agent'}
                </h3>
                <p className="text-xs mb-4 font-medium line-clamp-2" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'صياغة ردود فورية واحترافية باللهجة السعودية أو الفصحى لاستفسارات الشحن والتأخير والاسترجاع.'
                    : 'Draft polite, contextual bilingual replies for orders, refunds, and delivery inquiries in seconds.'}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-black text-accent pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <span>{isAr ? 'فتح صفحة الدعم والمحادثات' : 'Open Support Chat Page'}</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3: Bug Fix & Code Diagnostics */}
            <div
              onClick={() => setActiveTab('bugfix')}
              className="group p-5 rounded-2xl border transition-all hover:shadow-lg hover:border-accent/50 cursor-pointer relative overflow-hidden flex flex-col justify-between"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Code2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black mb-1 group-hover:text-accent transition-colors" style={{ color: 'var(--text)' }}>
                  {isAr ? 'وكيل فحص وتشخيص وإصلاح أخطاء المتجر' : 'AI Bug Fix & Code Diagnostics'}
                </h3>
                <p className="text-xs mb-4 font-medium line-clamp-2" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'تحليل مشاكل السلات والدفع والقوالب البرمجية وتوفير حلول تقنية فورية مع إمكانية فتح تذكرة دعم.'
                    : 'Root-cause analysis and code patches for checkout errors, styling glitches, and performance.'}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-black text-accent pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <span>{isAr ? 'فتح صفحة فحص الأخطاء' : 'Diagnose Store Bug Page'}</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 4: Voice Calling Partner */}
            <div
              onClick={() => setActiveTab('calling')}
              className="group p-5 rounded-2xl border transition-all hover:shadow-lg hover:border-accent/50 cursor-pointer relative overflow-hidden flex flex-col justify-between"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black mb-1 group-hover:text-accent transition-colors" style={{ color: 'var(--text)' }}>
                  {isAr ? 'شريك المكالمات الصوتية الذكي (Voice Agent)' : 'AI Voice Calling Partner'}
                </h3>
                <p className="text-xs mb-4 font-medium line-clamp-2" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'محاكي ومساعد المكالمات الصوتية الواقعي لتأكيد طلبات الدفع عند الاستلام واسترجاع السلات بالصوت.'
                    : 'Interactive voice calling simulator with real speech audio for order verification and cart recovery.'}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-black text-accent pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <span>{isAr ? 'فتح محاكي المكالمات الصوتية' : 'Test Voice Call Page'}</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 5: Growth & SEO */}
            <div
              onClick={() => setActiveTab('growth')}
              className="group p-5 rounded-2xl border transition-all hover:shadow-lg hover:border-accent/50 cursor-pointer relative overflow-hidden flex flex-col justify-between"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Megaphone className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black mb-1 group-hover:text-accent transition-colors" style={{ color: 'var(--text)' }}>
                  {isAr ? 'أدوات النمو، تحسين محركات البحث والنسخ' : 'Growth, SEO & Copy Assistant'}
                </h3>
                <p className="text-xs mb-4 font-medium line-clamp-2" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'توليد وسوم محركات البحث، عناوين المنتجات الجذابة، ونصوص الحملات الإعلانية الموجهة للسوق السعودي.'
                    : 'Generate SEO meta tags, product titles, ad copy, and store growth strategies.'}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-black text-accent pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <span>{isAr ? 'استكشاف أدوات النمو والـ SEO' : 'Explore Growth Tools Page'}</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 6: Payment Receipts & Slips */}
            <div
              onClick={() => setActiveTab('payments')}
              className="group p-5 rounded-2xl border transition-all hover:shadow-lg hover:border-accent/50 cursor-pointer relative overflow-hidden flex flex-col justify-between"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black mb-1 group-hover:text-accent transition-colors" style={{ color: 'var(--text)' }}>
                  {isAr ? 'إيصالات السداد وتاريخ الاشتراكات' : 'Payment Slips & Subscriptions'}
                </h3>
                <p className="text-xs mb-4 font-medium line-clamp-2" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'عرض سجل الإيصالات المحولة (صورة أو PDF)، رقم الحوالة، حالة التأكيد، والسعات الممنوحة للمتجر.'
                    : 'View submitted bank transfer slips, transaction IDs, approval status, and granted limits.'}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-black text-accent pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <span>{isAr ? 'عرض الإيصالات والسداد' : 'View Slips & History Page'}</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. AI CREATIVE IMAGE STUDIO PAGE */}
      {/* ======================================================== */}
      {activeTab === 'images' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="inline-flex items-center gap-1.5 text-xs font-black text-accent hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              {isAr ? 'العودة لمركز الوكلاء (All Hub)' : 'Back to All AI Agents Hub'}
            </button>
            <span className="text-xs font-black text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              {isAr ? 'استوديو Gemini الذكي لصور المنتجات' : 'Gemini AI Product Studio'}
            </span>
          </div>

          <StoreAiStudio />
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. AI CUSTOMER SUPPORT DEDICATED PAGE */}
      {/* ======================================================== */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          {/* Breadcrumb Header */}
          <div className="flex items-center justify-between p-3 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="inline-flex items-center gap-1.5 text-xs font-black text-accent hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              {isAr ? 'العودة لمركز الوكلاء (All Hub)' : 'Back to All AI Agents Hub'}
            </button>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Headphones className="w-4 h-4" />
              {isAr ? 'صفحة دعم العملاء الذكي والمحادثات' : 'Customer Support Agent Page'}
            </span>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border flex items-center justify-between" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <div>
                <div className="text-[11px] font-bold text-muted-foreground">{isAr ? 'إجمالي الردود المولدة' : 'Total Inquiries Handled'}</div>
                <div className="text-xl font-black mt-0.5 text-emerald-600">{supportHistory.length}</div>
              </div>
              <Bot className="w-6 h-6 text-emerald-600/60" />
            </div>
            <div className="p-4 rounded-xl border flex items-center justify-between" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <div>
                <div className="text-[11px] font-bold text-muted-foreground">{isAr ? 'سرعة الاستجابة' : 'Avg Response Speed'}</div>
                <div className="text-xl font-black mt-0.5 text-accent">&lt; 1.2s</div>
              </div>
              <Clock className="w-6 h-6 text-accent/60" />
            </div>
            <div className="p-4 rounded-xl border flex items-center justify-between" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <div>
                <div className="text-[11px] font-bold text-muted-foreground">{isAr ? 'الدقة والتوافق السعودي' : 'Saudi Accuracy'}</div>
                <div className="text-xl font-black mt-0.5 text-emerald-600">99.4%</div>
              </div>
              <ShieldCheck className="w-6 h-6 text-emerald-600/60" />
            </div>
          </div>

          {/* Main Support Form */}
          <div className="rounded-2xl border p-5 md:p-6 space-y-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-base font-black" style={{ color: 'var(--text)' }}>
                  {isAr ? 'وكيل خدمة العملاء الذكي للمتجر' : 'AI Customer Support Agent'}
                </h2>
                <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'صياغة ردود فورية ودقيقة لاستفسارات المتجر مع تجنب اختراع أرقام وهمية' : 'Draft instant polite responses for store inquiries'}
                </p>
              </div>

              {/* Tone Selection */}
              <div className="flex items-center gap-1.5">
                {(['saudi', 'formal', 'english'] as const).map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setSupportTone(tone)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    style={{
                      background: supportTone === tone ? 'var(--portal-cta)' : 'var(--bg)',
                      color: supportTone === tone ? '#fff' : 'var(--muted)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {tone === 'saudi' ? (isAr ? 'لهجة سعودية' : 'Saudi Arabic') : tone === 'formal' ? (isAr ? 'عربي فصيح' : 'Formal Arabic') : 'English'}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick preset scenario buttons */}
            <div>
              <span className="block text-[11px] font-bold mb-2" style={{ color: 'var(--muted)' }}>
                {isAr ? 'نماذج استفسارات شائعة سريعة:' : 'Quick Common Scenarios:'}
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    labelAr: 'تأخر وصول الشحنة',
                    labelEn: 'Delayed delivery inquiry',
                    query: isAr
                      ? 'العميل يقول: طلبي رقم #8291 له 4 أيام ولم يصل بعد، متى موعد التوصيل؟'
                      : 'Customer asks: My order #8291 has been 4 days and not arrived, when will it be delivered?',
                  },
                  {
                    labelAr: 'سياسة الاستبدال والاسترجاع',
                    labelEn: 'Return/exchange policy',
                    query: isAr
                      ? 'العميل يسأل: هل يمكنني استبدال المنتج إذا كان المقاس غير مناسب وما هي الرسوم؟'
                      : 'Customer asks: Can I exchange the item if size doesn’t fit, and what are the fees?',
                  },
                  {
                    labelAr: 'طرق الدفع والأقساط (تمارا/تابي)',
                    labelEn: 'Payment & installment inquiry',
                    query: isAr
                      ? 'العميل يسأل: هل تقبلون الدفع عند الاستلام وهل يتوفر تقسيط عبر تمارا؟'
                      : 'Customer asks: Do you support COD and Tamara installment?',
                  },
                ].map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSupportQuery(p.query)}
                    className="px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    {isAr ? p.labelAr : p.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Box */}
            <div className="space-y-2">
              <label className="block text-xs font-black" style={{ color: 'var(--text)' }}>
                {isAr ? 'نص رسالة أو استفسار العميل:' : 'Customer Message / Inquiry:'}
              </label>
              <textarea
                rows={3}
                value={supportQuery}
                onChange={(e) => setSupportQuery(e.target.value)}
                placeholder={isAr ? 'اكتب أو الصق رسالة العميل هنا…' : 'Enter customer query here…'}
                className="w-full p-3 rounded-xl border text-xs bg-transparent"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRunSupport}
                  disabled={supportBusy || !supportQuery.trim()}
                  className="unity-btn-primary px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {supportBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                  {isAr ? 'توليد رد الدعم الفوري' : 'Generate Support Reply'}
                </button>
              </div>
            </div>

            {/* Latest AI Output Box */}
            {supportReply && (
              <div
                className="p-4 rounded-xl border space-y-3"
                style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--portal-cta) 4%, var(--bg))' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    {isAr ? 'الرد المقترح من المساعد الذكي:' : 'AI Suggested Reply:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(supportReply, 'active_supp')}
                    className="px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:bg-black/5"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    {copiedId === 'active_supp' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === 'active_supp' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الرد' : 'Copy')}
                  </button>
                </div>
                <p className="text-xs whitespace-pre-wrap leading-relaxed font-medium" style={{ color: 'var(--text)' }}>
                  {supportReply}
                </p>
              </div>
            )}
          </div>

          {/* DEDICATED DATA: Support History Table */}
          {supportHistory.length > 0 && (
            <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black" style={{ color: 'var(--text)' }}>
                    {isAr ? 'سجل المحادثات والاستفسارات السابقة' : 'Past Support Inquiries History'}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                    {supportHistory.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSupportHistory([])}
                  className="text-xs text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isAr ? 'مسح السجل' : 'Clear History'}
                </button>
              </div>

              <div className="space-y-3">
                {supportHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border space-y-2 text-xs"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                  >
                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span className="font-bold text-accent">
                        {item.tone === 'saudi' ? 'لهجة سعودية' : item.tone === 'formal' ? 'فصحى' : 'English'}
                      </span>
                      <span>{item.createdAt}</span>
                    </div>
                    <div className="font-semibold text-text">
                      <strong className="text-muted-foreground mr-1">{isAr ? 'سؤال العميل:' : 'Inquiry:'}</strong> {item.query}
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 flex items-start justify-between gap-3 font-medium">
                      <span className="whitespace-pre-wrap">{item.reply}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.reply, item.id)}
                        className="p-1 rounded hover:bg-black/10 shrink-0 text-muted-foreground"
                        title={isAr ? 'نسخ الرد' : 'Copy reply'}
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. AI BUG FIX & STORE DIAGNOSTICS DEDICATED PAGE */}
      {/* ======================================================== */}
      {activeTab === 'bugfix' && (
        <div className="space-y-6">
          {/* Breadcrumb Header */}
          <div className="flex items-center justify-between p-3 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="inline-flex items-center gap-1.5 text-xs font-black text-accent hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              {isAr ? 'العودة لمركز الوكلاء (All Hub)' : 'Back to All AI Agents Hub'}
            </button>
            <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Code2 className="w-4 h-4" />
              {isAr ? 'صفحة فحص وتشخيص أخطاء المتجر' : 'Store Bug Fix & Code Diagnostics Page'}
            </span>
          </div>

          <div className="rounded-2xl border p-5 md:p-6 space-y-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-base font-black" style={{ color: 'var(--text)' }}>
                  {isAr ? 'فحص وتشخيص وإصلاح أخطاء المتجر' : 'AI Bug Fix & Store Diagnostics Lead'}
                </h2>
                <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'تشخيص أخطاء الدفع والقوالب والطلبات وتقديم حلول برمجية وتوجيهات دقيقة' : 'Technical root-cause diagnosis and code fixes'}
                </p>
              </div>
            </div>

            {/* Preset Issue Buttons */}
            <div>
              <span className="block text-[11px] font-bold mb-2" style={{ color: 'var(--muted)' }}>
                {isAr ? 'أخطاء شائعة للفحص السريع:' : 'Common Store Issue Presets:'}
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    labelAr: 'فشل إتمام الدفع بالبطاقة',
                    labelEn: 'Card payment gateway failure',
                    desc: 'العملاء يواجهون خطأ Payment declined 402 أو فشل التحقق من 3D Secure عند إتمام الطلب.',
                  },
                  {
                    labelAr: 'خلل في حساب رسوم الشحن',
                    labelEn: 'Shipping rate calculation glitch',
                    desc: 'رسوم الشحن تظهر صفراً لبعض مدن المنطقة الشرقية بالرغم من ضبط شركة أرامكس.',
                  },
                  {
                    labelAr: 'بطء تحميل الصفحة الرئيسية في الجوال',
                    labelEn: 'Mobile storefront slow load',
                    desc: 'صور المتجر في صفحة الجوال تأخذ وقتاً طويلاً للتحميل والخطوط تتأخر في العرض.',
                  },
                ].map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setBugDescription(p.desc)}
                    className="px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    {isAr ? p.labelAr : p.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'وصف المشكلة أو الخلل في المتجر *' : 'Bug / Problem Description *'}
                </label>
                <textarea
                  rows={4}
                  value={bugDescription}
                  onChange={(e) => setBugDescription(e.target.value)}
                  placeholder={isAr ? 'اشرح ما يحدث في متجرك بالتفصيل…' : 'Describe the storefront or admin bug…'}
                  className="w-full p-3 rounded-xl border text-xs bg-transparent"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-black mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'رسالة الخطأ البرمجية أو السجل (اختياري)' : 'Error Log / Code Snippet (Optional)'}
                </label>
                <textarea
                  rows={4}
                  value={bugErrorLog}
                  onChange={(e) => setBugErrorLog(e.target.value)}
                  placeholder={isAr ? 'الصق رسالة الخطأ من وحدة التحكم أو الطلب…' : 'Paste console error or API response here…'}
                  className="w-full p-3 rounded-xl border text-xs font-mono bg-transparent"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleSubmitDevTicket}
                disabled={!bugDescription.trim()}
                className="px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-black/5"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                <FileText className="w-3.5 h-3.5" />
                {isAr ? 'فتح تذكرة دعم فني مباشر للمطورين' : 'Open Developer Ticket'}
              </button>

              <button
                type="button"
                onClick={handleRunBugDiagnostics}
                disabled={bugBusy || !bugDescription.trim()}
                className="unity-btn-primary px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {bugBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isAr ? 'تشخيص المشكلة وتوليد الحل البرمجي' : 'Diagnose Bug & Generate Fix'}
              </button>
            </div>

            {/* Diagnostics Output */}
            {bugDiagnosis && (
              <div
                className="p-4 rounded-xl border space-y-3"
                style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--portal-cta) 4%, var(--bg))' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black flex items-center gap-1.5 text-amber-600">
                    <ShieldCheck className="w-4 h-4" />
                    {isAr ? 'تقرير التشخيص والحل البرمجي المقترح:' : 'AI Diagnostic Report & Fix:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(bugDiagnosis, 'active_diag')}
                    className="px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:bg-black/5"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    {copiedId === 'active_diag' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === 'active_diag' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ التقرير' : 'Copy')}
                  </button>
                </div>
                <p className="text-xs whitespace-pre-wrap leading-relaxed font-mono" style={{ color: 'var(--text)' }}>
                  {bugDiagnosis}
                </p>
              </div>
            )}
          </div>

          {/* DEDICATED DATA: Developer Tickets Table */}
          {devRequests.length > 0 && (
            <div className="rounded-2xl border p-5 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <div className="text-xs font-black" style={{ color: 'var(--text)' }}>
                {isAr ? 'سجل تذاكر دعم المطوّر المفتوحة لهذا المتجر:' : 'Store Developer Support Tickets:'}
              </div>
              <div className="space-y-2">
                {devRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl border flex items-center justify-between text-xs"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                  >
                    <div>
                      <strong className="block text-accent">{req.title}</strong>
                      <span className="text-[10px] text-muted-foreground">
                        {req.status?.toUpperCase()} · {req.priority} · {req.category}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono opacity-60">{req.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DEDICATED DATA: Diagnostic History Log */}
          {diagHistory.length > 0 && (
            <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-sm font-black" style={{ color: 'var(--text)' }}>
                  {isAr ? 'سجل التشخيصات والحلول السابقة' : 'Past Diagnostics & Solutions'}
                </h3>
                <button
                  type="button"
                  onClick={() => setDiagHistory([])}
                  className="text-xs text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isAr ? 'مسح السجل' : 'Clear'}
                </button>
              </div>
              <div className="space-y-3">
                {diagHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border space-y-2 text-xs"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                  >
                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span className="font-bold text-amber-600">{item.description.slice(0, 50)}...</span>
                      <span>{item.createdAt}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 font-mono text-[11px] whitespace-pre-wrap flex justify-between gap-2">
                      <span className="line-clamp-4">{item.diagnosis}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.diagnosis, item.id)}
                        className="p-1 rounded hover:bg-black/10 shrink-0 text-muted-foreground"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. AI VOICE CALLING PARTNER DEDICATED PAGE */}
      {/* ======================================================== */}
      {activeTab === 'calling' && (
        <div className="space-y-6">
          {/* Breadcrumb Header */}
          <div className="flex items-center justify-between p-3 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="inline-flex items-center gap-1.5 text-xs font-black text-accent hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              {isAr ? 'العودة لمركز الوكلاء (All Hub)' : 'Back to All AI Agents Hub'}
            </button>
            <span className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4" />
              {isAr ? 'صفحة المكالمات الصوتية الذكية (Live Voice)' : 'AI Voice Calling Partner Page'}
            </span>
          </div>

          <div className="rounded-2xl border p-5 md:p-6 space-y-6" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black" style={{ color: 'var(--text)' }}>
                    {isAr ? 'مساعد المكالمات الصوتية الذكي (Interactive Voice Agent)' : 'AI Voice Calling Partner'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    {isAr ? 'صوت واقعي ثنائي اللغة' : 'Real Bilingual Voice'}
                  </span>
                </div>
                <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'إجراء ومحاكاة مكالمات هاتفية لتأكيد طلبات الدفع عند الاستلام واسترجاع السلات المتروكة بصوت ونبرة سعودية'
                    : 'Interactive AI voice calling simulation with speech synthesis for COD orders and cart recovery'}
                </p>
              </div>
            </div>

            {/* Caller Details & Setup Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'سيناريو المكالمة الذكية:' : 'Call Scenario:'}
                </label>
                <select
                  value={callScenario}
                  onChange={(e) => setCallScenario(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border text-xs bg-transparent"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  <option value="order_confirm">{isAr ? 'تأكيد طلب دفع عند الاستلام (COD)' : 'Order Confirmation (COD)'}</option>
                  <option value="abandoned_cart">{isAr ? 'استرجاع سلة متروكة مع كود خصم' : 'Abandoned Cart Recovery'}</option>
                  <option value="delivery_coord">{isAr ? 'تنسيق موعد وموقع التوصيل' : 'Delivery Address Coordination'}</option>
                  <option value="satisfaction">{isAr ? 'متابعة وتقييم رضا العميل' : 'Customer Satisfaction Follow-up'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'اسم العميل ورقم الطلب:' : 'Customer Name & Order #:'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={isAr ? 'اسم العميل' : 'Customer Name'}
                    className="w-2/3 p-2.5 rounded-xl border text-xs bg-transparent"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="#SO-9821"
                    className="w-1/3 p-2.5 rounded-xl border text-xs bg-transparent font-mono"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'رقم هاتف العميل للتواصل:' : 'Customer Phone Number:'}
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+966 5x xxx xxxx"
                  className="w-full p-2.5 rounded-xl border text-xs bg-transparent font-mono"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
            </div>

            {/* Interactive Phone Simulator Screen */}
            <div
              className="p-6 rounded-2xl border flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto shadow-sm"
              style={{
                borderColor: callStatus === 'connected' ? '#10b981' : 'var(--border)',
                background: callStatus === 'connected' ? 'color-mix(in srgb, #10b981 6%, var(--bg))' : 'var(--bg)',
              }}
            >
              {/* Avatar / Call State */}
              <div className="relative">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-bold transition-all shadow-md ${
                    callStatus === 'connected'
                      ? 'bg-emerald-600 ring-8 ring-emerald-500/20'
                      : callStatus === 'calling'
                        ? 'bg-blue-600 animate-bounce'
                        : 'bg-slate-700'
                  }`}
                >
                  <Phone className="w-8 h-8" />
                </div>
                {isSpeaking && (
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center animate-ping">
                    <Volume2 className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <div>
                <div className="text-sm font-black" style={{ color: 'var(--text)' }}>
                  {customerName} ({orderNumber})
                </div>
                <div className="text-xs font-mono text-muted-foreground mt-0.5">
                  {customerPhone}
                </div>
                <div className="text-xs font-bold mt-2">
                  {callStatus === 'idle' && (
                    <span className="text-muted-foreground">{isAr ? 'جاهز لبدء الاتصال الصوتي' : 'Ready to initiate call'}</span>
                  )}
                  {callStatus === 'calling' && (
                    <span className="text-blue-600 animate-pulse">{isAr ? 'جاري الاتصال والربط الصوتي…' : 'Connecting to customer…'}</span>
                  )}
                  {callStatus === 'connected' && (
                    <span className="text-emerald-600 font-mono font-bold">
                      {isAr ? 'مكالمة جارية' : 'In Call'} · {String(Math.floor(callDuration / 60)).padStart(2, '0')}:
                      {String(callDuration % 60).padStart(2, '0')}
                    </span>
                  )}
                  {callStatus === 'ended' && (
                    <span className="text-rose-600">{isAr ? 'تم إنهاء المكالمة وحفظ السجل بنجاح' : 'Call completed & logged'}</span>
                  )}
                </div>
              </div>

              {/* Audio Waveform Animation while speaking */}
              {isSpeaking && (
                <div className="flex items-center gap-1.5 h-6">
                  {[40, 80, 55, 95, 70, 85, 45, 90, 60, 75].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-emerald-500 rounded-full animate-pulse"
                      style={{
                        height: `${h}%`,
                        animationDuration: `${0.4 + (i % 3) * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Call Control Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {callStatus === 'idle' || callStatus === 'ended' ? (
                  <button
                    type="button"
                    onClick={handleStartCall}
                    disabled={callBusy}
                    className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-md transition-transform active:scale-95"
                  >
                    <PhoneCall className="w-4 h-4" />
                    {isAr ? 'بدء المكالمة الصوتية الآن' : 'Start Voice Call'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleEndCall}
                    className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-md transition-transform active:scale-95"
                  >
                    <PhoneOff className="w-4 h-4" />
                    {isAr ? 'إنهاء المكالمة' : 'Hang Up'}
                  </button>
                )}
              </div>
            </div>

            {/* Live Call Dialogue & Transcript Output */}
            {callScript && (
              <div
                className="p-4 rounded-xl border space-y-3"
                style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--portal-cta) 4%, var(--bg))' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black flex items-center gap-1.5 text-blue-600">
                    <Volume2 className="w-4 h-4" />
                    {isAr ? 'نص وسيناريو المكالمة الصوتية المنفذة:' : 'Voice Call Dialogue & Transcript:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(callScript, 'active_call')}
                    className="px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:bg-black/5"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    {copiedId === 'active_call' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === 'active_call' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الحوار' : 'Copy')}
                  </button>
                </div>
                <p className="text-xs whitespace-pre-wrap leading-relaxed font-medium" style={{ color: 'var(--text)' }}>
                  {callScript}
                </p>
              </div>
            )}
          </div>

          {/* DEDICATED DATA: Call History Log */}
          {callHistory.length > 0 && (
            <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black" style={{ color: 'var(--text)' }}>
                    {isAr ? 'سجل المكالمات الصوتية المنفذة' : 'Completed Voice Calls History'}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-bold">
                    {callHistory.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCallHistory([])}
                  className="text-xs text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isAr ? 'مسح السجل' : 'Clear'}
                </button>
              </div>

              <div className="space-y-3">
                {callHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border space-y-2 text-xs"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                  >
                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span className="font-bold text-blue-600">
                        {item.customerName} ({item.orderNumber})
                      </span>
                      <span>{item.createdAt} · {item.durationSeconds}s</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 font-medium text-[11px] whitespace-pre-wrap flex justify-between gap-2">
                      <span className="line-clamp-2">{item.script}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.script, item.id)}
                        className="p-1 rounded hover:bg-black/10 shrink-0 text-muted-foreground"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. GROWTH, SEO & COPY DEDICATED PAGE */}
      {/* ======================================================== */}
      {activeTab === 'growth' && (
        <div className="space-y-6">
          {/* Breadcrumb Header */}
          <div className="flex items-center justify-between p-3 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="inline-flex items-center gap-1.5 text-xs font-black text-accent hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              {isAr ? 'العودة لمركز الوكلاء (All Hub)' : 'Back to All AI Agents Hub'}
            </button>
            <span className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <Megaphone className="w-4 h-4" />
              {isAr ? 'صفحة أدوات النمو والـ SEO والنسخ الإعلاني' : 'Growth, SEO & Copy Studio Page'}
            </span>
          </div>

          <div className="rounded-2xl border p-5 md:p-6 space-y-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-base font-black" style={{ color: 'var(--text)' }}>
                  {isAr ? 'أدوات النمو، تحسين محركات البحث والنسخ الإعلاني' : 'Growth, SEO & Copy Assistant'}
                </h2>
                <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'أدوات تسويقية متكاملة لصياغة العناوين ووصف المنتجات وترجمة المحتوى' : 'Integrated marketing copy and SEO generators'}
                </p>
              </div>

              <select
                value={growthModule}
                onChange={(e) => setGrowthModule(e.target.value)}
                className="p-2.5 rounded-xl border text-xs bg-transparent font-bold cursor-pointer"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                <option value="seo_assistant">{isAr ? 'مساعد تحسين محركات البحث (SEO)' : 'SEO Assistant'}</option>
                <option value="product_description">{isAr ? 'مولد وصف المنتجات الجذاب' : 'Product Description'}</option>
                <option value="marketing_assistant">{isAr ? 'نصوص الحملات والإعلانات' : 'Marketing Ad Copy'}</option>
                <option value="store_advisor">{isAr ? 'مستشار المتجر واستراتيجيات النمو' : 'Store Advisor'}</option>
                <option value="translation">{isAr ? 'ترجمة محتوى المتجر (عربي / إنجليزي)' : 'Translation'}</option>
                <option value="analytics_assistant">{isAr ? 'أسئلة وتحليلات المتجر الذكية' : 'Store Analytics Q&A'}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black" style={{ color: 'var(--text)' }}>
                {isAr ? 'الموضوع أو المنتج المطلوب صياغته:' : 'Prompt or Product to Generate:'}
              </label>
              <textarea
                rows={3}
                value={growthPrompt}
                onChange={(e) => setGrowthPrompt(e.target.value)}
                placeholder={
                  isAr
                    ? 'اكتب اسم المنتج، أو الكلمات المفتاحية، أو السؤال المطلوب تحليله…'
                    : 'Enter product details, keywords, or store question…'
                }
                className="w-full p-3 rounded-xl border text-xs bg-transparent"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRunGrowth}
                  disabled={growthBusy || !growthPrompt.trim()}
                  className="unity-btn-primary px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {growthBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isAr ? 'توليد المحتوى التسويقي' : 'Generate Growth Copy'}
                </button>
              </div>
            </div>

            {growthResult && (
              <div
                className="p-4 rounded-xl border space-y-3"
                style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--portal-cta) 4%, var(--bg))' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black flex items-center gap-1.5 text-rose-600">
                    <CheckCircle2 className="w-4 h-4" />
                    {isAr ? 'المحتوى المُولّد:' : 'Generated Output:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(growthResult, 'active_growth')}
                    className="px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:bg-black/5"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    {copiedId === 'active_growth' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === 'active_growth' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ المحتوى' : 'Copy')}
                  </button>
                </div>
                <p className="text-xs whitespace-pre-wrap leading-relaxed font-medium" style={{ color: 'var(--text)' }}>
                  {growthResult}
                </p>
              </div>
            )}
          </div>

          {/* DEDICATED DATA: Copy Library */}
          {copyLibrary.length > 0 && (
            <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black" style={{ color: 'var(--text)' }}>
                    {isAr ? 'مكتبة النسخ والنصوص المحفوظة' : 'Saved Copy & Marketing Library'}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-bold">
                    {copyLibrary.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCopyLibrary([])}
                  className="text-xs text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isAr ? 'مسح المكتبة' : 'Clear'}
                </button>
              </div>

              <div className="space-y-3">
                {copyLibrary.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border space-y-2 text-xs"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
                  >
                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span className="font-bold text-rose-600">{item.module}</span>
                      <span>{item.createdAt}</span>
                    </div>
                    <div className="font-semibold text-text">
                      <strong className="text-muted-foreground mr-1">{isAr ? 'الطلب:' : 'Prompt:'}</strong> {item.prompt}
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 font-medium text-[11px] whitespace-pre-wrap flex justify-between gap-2">
                      <span className="line-clamp-3">{item.result}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.result, item.id)}
                        className="p-1 rounded hover:bg-black/10 shrink-0 text-muted-foreground"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. PAYMENT SLIPS & HISTORY DEDICATED PAGE */}
      {/* ======================================================== */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Breadcrumb Header */}
          <div className="flex items-center justify-between p-3 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="inline-flex items-center gap-1.5 text-xs font-black text-accent hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              {isAr ? 'العودة لمركز الوكلاء (All Hub)' : 'Back to All AI Agents Hub'}
            </button>
            <span className="text-xs font-black text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              {isAr ? 'صفحة إيصالات السداد والاشتراكات' : 'Payment Slips & Subscriptions Page'}
            </span>
          </div>

          <div className="rounded-2xl border p-5 md:p-6 space-y-5" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-base font-black" style={{ color: 'var(--text)' }}>
                  {isAr ? 'إيصالات السداد وتاريخ الاشتراكات' : 'Payment Slips & Subscription History'}
                </h2>
                <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'سجل الحوالات البنكية وإيصالات الدفع المرفوعة لتفعيل باقات الذكاء' : 'Bank transfer receipts and upgrade history'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openUpgradeModal('text')}
                  className="unity-btn-primary px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  {isAr ? 'إرفاق إيصال تحويل جديد' : 'Upload New Payment Slip'}
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5">
              {(['all', 'approved', 'pending', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setPaymentFilter(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    paymentFilter === st ? 'bg-accent text-white' : 'border hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  style={{ borderColor: 'var(--border)' }}
                >
                  {st === 'all'
                    ? isAr ? 'الكل' : 'All'
                    : st === 'approved'
                      ? isAr ? 'المعتمدة' : 'Approved'
                      : st === 'pending'
                        ? isAr ? 'قيد المراجعة' : 'Under Review'
                        : isAr ? 'المرفوضة' : 'Rejected'}
                </button>
              ))}
            </div>

            {/* Slips Table */}
            {filteredPayments.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mx-auto text-muted-foreground">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                  {isAr ? 'لا توجد إيصالات سداد مطابقة' : 'No matching payment slips found'}
                </div>
                <p className="text-[11px] max-w-sm mx-auto" style={{ color: 'var(--muted)' }}>
                  {isAr
                    ? 'عند استهلاك الـ 5 عناصر المجانية أو الرغبة بالترقية، يمكنك تحويل المبلغ ورفع صورة أو ملف الإيصال هنا لفتح كامل السعات.'
                    : 'Upgrade your plan by transferring and uploading payment proof screenshot or PDF.'}
                </p>
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                <table className="w-full text-xs text-start">
                  <thead className="bg-black/5 dark:bg-white/5 border-b" style={{ borderColor: 'var(--border)' }}>
                    <tr>
                      <th className="p-3 text-start font-black">{isAr ? 'رقم الحوالة' : 'Tx Ref'}</th>
                      <th className="p-3 text-start font-black">{isAr ? 'الباقة' : 'Package'}</th>
                      <th className="p-3 text-start font-black">{isAr ? 'المبلغ' : 'Amount'}</th>
                      <th className="p-3 text-start font-black">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="p-3 text-start font-black">{isAr ? 'الإيصال المرفق' : 'Receipt Slip'}</th>
                      <th className="p-3 text-start font-black">{isAr ? 'التاريخ' : 'Date'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {filteredPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="p-3 font-mono font-bold text-accent">{pay.transaction_ref}</td>
                        <td className="p-3 font-semibold">{pay.package_name || pay.package_id}</td>
                        <td className="p-3 font-black">{pay.amount_sar} {isAr ? 'ر.س' : 'SAR'}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              pay.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : pay.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {pay.status === 'approved' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                {isAr ? 'معتمد ومفعّل' : 'Approved'}
                              </>
                            ) : pay.status === 'rejected' ? (
                              isAr ? 'مرفوض' : 'Rejected'
                            ) : (
                              <>
                                <Clock className="w-3 h-3" />
                                {isAr ? 'قيد المراجعة' : 'Under Review'}
                              </>
                            )}
                          </span>
                        </td>
                        <td className="p-3">
                          {pay.proof_url ? (
                            <a
                              href={pay.proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {pay.proof_type === 'pdf' ? (isAr ? 'عرض ملف PDF' : 'View PDF') : (isAr ? 'عرض الصورة' : 'View Slip')}
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">{isAr ? 'غير متوفر' : 'N/A'}</span>
                          )}
                        </td>
                        <td className="p-3 text-[11px] text-muted-foreground">
                          {pay.created_at ? new Date(pay.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Real Payment & Slip Upload Modal */}
      <StoreAiPaymentModal
        isOpen={payOpen}
        onClose={() => setPayOpen(false)}
        isAr={isAr}
        storeId={storeId}
        module={payModule}
        packages={suite?.payment_packages || []}
        bankDetails={suite?.bank_transfer_details}
        onPaymentSuccess={() => {
          void loadAll();
        }}
      />
    </div>
  );
};

export default StoreAiToolsHub;
