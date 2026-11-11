import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { Sparkline } from '../common/Sparkline';
import { 
  Search, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  ExternalLink, 
  Copy, 
  RefreshCw, 
  Send, 
  Eye, 
  BarChart3, 
  Code, 
  Layers, 
  Smartphone, 
  Monitor, 
  Check, 
  Sparkles,
  Link2,
  Trash2,
  ShieldCheck,
  Plus,
  Flower2,
  Star,
  X,
  Gauge,
  Activity,
  Zap,
  HelpCircle,
  Sliders,
  Settings2,
  Upload,
  ArrowLeft,
} from 'lucide-react';
import { PageDocsGuideModal } from '../common/PageDocsGuideModal';
import { GlobalModal } from '../common/GlobalModal';
import { PortalHubCard } from '../common/PortalHubCard';
import { realTrackingId, seoSetupStep, storeGoogleEmail, storePublicHost } from './seo/storeSeoSetup';
import { GoogleConnectModal } from './GoogleConnectModal';
import { UtmCampaignBuilder } from './UtmCampaignBuilder';
import {
  initiateRealGoogleOAuth,
  getStoredGoogleClientId,
  setStoredGoogleClientId,
  clearStoreGoogleState,
  clearPageSpeedFixes,
  mapPageSpeedAuditSnapshot,
  mapGoogleConnectError,
  hasRealGoogleClientId,
  PageSpeedAuditResult,
} from '../../utils/googleRealAuth';
import { fetchGoogleAuthUrl, fetchGooglePageSpeedData, submitGoogleCallback } from '../../api/tenantApi';
import {
  getStoreSeoDeepAudit,
  type SeoDeepAuditItem,
} from '../../services/ksaAutomationEngine';

interface StoreSEOProps {
  onNavigateTab?: (tab: string) => void;
}

export const StoreSEO: React.FC<StoreSEOProps> = ({ onNavigateTab }) => {
  const { 
    activeStore, 
    currentProducts,
    currentSEOConfig, 
    updateStoreSEOConfig, 
    connectGoogleAccount, 
    disconnectGoogleAccount, 
    submitUrlToGoogleIndexing 
  } = useTenant();

  const { t, locale, dir } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  type SeoSubTab = 'hub' | 'console' | 'google_tags' | 'utm' | 'pagespeed' | 'meta' | 'simulator' | 'deep_audit';
  // null = hub buttons only; set = that section's data
  const [activeSubTab, setActiveSubTab] = useState<SeoSubTab | null>(null);
  const [deepAuditItems, setDeepAuditItems] = useState<SeoDeepAuditItem[]>(() =>
    getStoreSeoDeepAudit(activeStore.id, activeStore.name, activeStore.slug, currentProducts.length),
  );
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showTrackingConfigModal, setShowTrackingConfigModal] = useState(false);
  const [editGa4Id, setEditGa4Id] = useState(currentSEOConfig.ga4MeasurementId || '');
  const [editGtmId, setEditGtmId] = useState(currentSEOConfig.gtmContainerId || '');
  const [editGscTag, setEditGscTag] = useState(currentSEOConfig.searchConsoleVerificationTag || '');
  const [editGoogleAdsId, setEditGoogleAdsId] = useState(currentSEOConfig.googleAdsConversionId || '');
  const [customClientId, setCustomClientId] = useState(getStoredGoogleClientId());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Keep tracking form state synced with active store SEO config + Zero-Touch Master GTM/GA4 Auto-Fallback
  useEffect(() => {
    const resolvedGa4 = realTrackingId(currentSEOConfig.ga4MeasurementId);
    const resolvedGtm = realTrackingId(currentSEOConfig.gtmContainerId);
    const resolvedGsc = realTrackingId(currentSEOConfig.searchConsoleVerificationTag);
    setEditGa4Id(resolvedGa4);
    setEditGtmId(resolvedGtm);
    setEditGscTag(resolvedGsc);
    setEditGoogleAdsId(currentSEOConfig.googleAdsConversionId || '');
    setGa4Id(resolvedGa4);
    setGtmId(resolvedGtm);
    setGscTag(resolvedGsc);
    setDeepAuditItems(
      getStoreSeoDeepAudit(activeStore.id, activeStore.name, activeStore.slug, currentProducts.length),
    );
  }, [currentSEOConfig, activeStore.id, activeStore.name, activeStore.slug, activeStore.ownerEmail, currentProducts.length]);

  // Core Web Vitals & PageSpeed Live State (Laravel → Google PSI, zero-mock)
  const [pageSpeedStrategy, setPageSpeedStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const [isLoadingPageSpeed, setIsLoadingPageSpeed] = useState(false);
  const [pageSpeedData, setPageSpeedData] = useState<PageSpeedAuditResult | null>(null);
  const [pageSpeedError, setPageSpeedError] = useState<string | null>(null);
  const [activeIssueCategory, setActiveIssueCategory] = useState<'all' | 'performance' | 'accessibility' | 'seo'>('all');

  const psiScoreTone = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 text-emerald-700 border-emerald-500';
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-500';
    if (score > 0) return 'bg-rose-50 text-rose-700 border-rose-500';
    return 'bg-slate-50 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600';
  };
  const psiScoreLabel = (score: number) => {
    if (score >= 90) return isAr ? 'جيد (٩٠–١٠٠)' : 'Good (90-100)';
    if (score >= 50) return isAr ? 'يحتاج تحسين' : 'Needs Work';
    if (score > 0) return isAr ? 'ضعيف' : 'Poor';
    return isAr ? 'بانتظار البيانات' : 'Waiting for Data';
  };

  const [urlToSubmit, setUrlToSubmit] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [newKeyword, setNewKeyword] = useState('');
  const [isSubmittingIndex, setIsSubmittingIndex] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /** Legacy SEO deep-links for Search Console / GTM → Settings page */
  useEffect(() => {
    const redirectToSettings = (view: unknown) => {
      const mapped =
        view === 'search-console' || view === 'search_console'
          ? 'search_console'
          : view === 'gtm' || view === 'tag_manager'
            ? 'tag_manager'
            : null;
      if (!mapped) return;
      try {
        sessionStorage.setItem('unityteck-settings-view', mapped);
      } catch {
        /* storage may be unavailable */
      }
      window.dispatchEvent(new CustomEvent('unityteck-settings-view', { detail: mapped }));
      window.dispatchEvent(new CustomEvent('unityteck-open-store-tab', { detail: 'settings' }));
    };
    const onSeoView = (e: Event) => {
      redirectToSettings((e as CustomEvent).detail);
    };
    window.addEventListener('unityteck-seo-view', onSeoView);
    try {
      const saved = sessionStorage.getItem('unityteck-seo-view');
      if (saved) {
        redirectToSettings(saved);
        sessionStorage.removeItem('unityteck-seo-view');
      }
    } catch {
      /* storage may be unavailable */
    }
    return () => window.removeEventListener('unityteck-seo-view', onSeoView);
  }, []);

  // ⚡ Zero-Touch Auto-Pilot Engine State
  const [isAutoPilotSyncing, setIsAutoPilotSyncing] = useState(false);
  const [autoPilotLastSync, setAutoPilotLastSync] = useState<string>(() => {
    try {
      return localStorage.getItem(`unityteck_seo_autopilot_${activeStore.id}`) || 'Auto-Active';
    } catch {
      return 'Auto-Active';
    }
  });

  // Dynamic candidate routes for the entire store
  const storeBaseUrl = React.useMemo(() => {
    return activeStore.custom_domain
      ? `https://${activeStore.custom_domain}`
      : `https://${activeStore.slug || 'demo'}.saasdomain.com`;
  }, [activeStore.custom_domain, activeStore.slug]);

  const candidateUrls = React.useMemo(() => {
    const list: string[] = [
      `${storeBaseUrl}/`,
      `${storeBaseUrl}/catalog`,
      `${storeBaseUrl}/sitemap.xml`,
    ];
    currentProducts.forEach((p) => {
      const slugOrId = (p as any).slug || p.id;
      list.push(`${storeBaseUrl}/product/${slugOrId}`);
    });
    return list;
  }, [storeBaseUrl, currentProducts]);

  // Execute Auto-Pilot Sync across all store catalog routes without merchant manual typing
  const handleAutoPilotSyncAll = React.useCallback((silent = false) => {
    setIsAutoPilotSyncing(true);
    const existingSet = new Set((currentSEOConfig.submittedUrls || []).map((u) => u.url));
    const urlsToSubmit = candidateUrls.filter((u) => !existingSet.has(u));

    const timestamp = new Date().toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    if (urlsToSubmit.length === 0) {
      setAutoPilotLastSync(timestamp);
      try {
        localStorage.setItem(`unityteck_seo_autopilot_${activeStore.id}`, timestamp);
      } catch {}
      setIsAutoPilotSyncing(false);
      if (!silent) {
        toast(
          isAr
            ? `كافة روابط المتجر (${candidateUrls.length}) مفهرسة بالفعل ومحدَّثة في محركات البحث`
            : `All store routes (${candidateUrls.length}) are already indexed & up to date with Googlebot`,
          'success'
        );
      }
      return;
    }

    urlsToSubmit.forEach((u, i) => {
      setTimeout(() => {
        submitUrlToGoogleIndexing(activeStore.id, u);
        if (i === urlsToSubmit.length - 1) {
          setIsAutoPilotSyncing(false);
          setAutoPilotLastSync(timestamp);
          try {
            localStorage.setItem(`unityteck_seo_autopilot_${activeStore.id}`, timestamp);
          } catch {}
          if (!silent) {
            toast(
              isAr
                ? `تمت أرشفة وتحديث (${urlsToSubmit.length}) رابط تلقائياً بنجاح في جوجل واجهة الفهرسة`
                : `Successfully auto-indexed (${urlsToSubmit.length}) store URLs with Google Indexing API`,
              'success'
            );
          }
        }
      }, i * 300);
    });
  }, [candidateUrls, currentSEOConfig.submittedUrls, isAr, activeStore.id, submitUrlToGoogleIndexing, toast]);

  // ⚡ Auto-Pilot Effect 1: Auto-submit unindexed catalog routes on mount & catalog change
  useEffect(() => {
    if (!currentSEOConfig.googleConnected) return;
    const existingSet = new Set((currentSEOConfig.submittedUrls || []).map((u) => u.url));
    const pending = candidateUrls.filter((u) => !existingSet.has(u));
    if (pending.length > 0) {
      handleAutoPilotSyncAll(true);
    }
  }, [candidateUrls.length, currentSEOConfig.googleConnected, handleAutoPilotSyncAll]);

  // Editable Meta Form State
  const [metaTitleEn, setMetaTitleEn] = useState(currentSEOConfig.metaTitleEn || currentSEOConfig.metaTitle || '');
  const [metaTitleAr, setMetaTitleAr] = useState(currentSEOConfig.metaTitleAr || '');
  const [metaDescriptionEn, setMetaDescriptionEn] = useState(currentSEOConfig.metaDescriptionEn || currentSEOConfig.metaDescription || '');
  const [metaDescriptionAr, setMetaDescriptionAr] = useState(currentSEOConfig.metaDescriptionAr || '');
  const metaTitle = isAr ? metaTitleAr : metaTitleEn;
  const metaDescription = isAr ? metaDescriptionAr : metaDescriptionEn;
  const [ga4Id, setGa4Id] = useState(currentSEOConfig.ga4MeasurementId);
  const [gtmId, setGtmId] = useState(currentSEOConfig.gtmContainerId);
  const [gscTag, setGscTag] = useState(currentSEOConfig.searchConsoleVerificationTag);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [ogImageUrl, setOgImageUrl] = useState('');
  const ogFileInputRef = React.useRef<HTMLInputElement>(null);

  // PageSpeed always audits this store's own URL only (no manual typing / cross-store URLs)
  useEffect(() => {
    setPageSpeedData(null);
    setPageSpeedError(null);
  }, [activeStore.id, storeBaseUrl]);

  // Load live PageSpeed via Laravel API (Hostinger) → Google PSI — never invent scores
  const loadPageSpeed = async (
    strategy: 'mobile' | 'desktop' = pageSpeedStrategy,
    _customUrl?: string,
    refresh = true,
  ) => {
    setIsLoadingPageSpeed(true);
    setPageSpeedError(null);
    const targetUrl = (storeBaseUrl || '').trim();
    try {
      const res = await fetchGooglePageSpeedData(activeStore.id, strategy, refresh, targetUrl || undefined);
      const mapped = mapPageSpeedAuditSnapshot(res?.audit as Record<string, any> | null, strategy, targetUrl);
      if (mapped?.isLive) {
        setPageSpeedData(mapped);
        setPageSpeedError(null);
      } else {
        setPageSpeedData(null);
        setPageSpeedError(
          res?.message ||
            (isAr
              ? 'تعذّر تشغيل فحص سرعة الصفحات. تحقق من رابط المتجر أو مفتاح واجهة برمجة تطبيقات سرعة الصفحات.'
              : 'PageSpeed audit unavailable. Check the storefront URL or PageSpeed API key.'),
        );
      }
    } catch (err: any) {
      setPageSpeedData(null);
      setPageSpeedError(
        err?.message ||
          (isAr ? 'فشل الاتصال بخدمة سرعة الصفحات' : 'Failed to reach PageSpeed service'),
      );
    } finally {
      setIsLoadingPageSpeed(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'pagespeed' && !pageSpeedData && !isLoadingPageSpeed && !pageSpeedError) {
      void loadPageSpeed(pageSpeedStrategy, storeBaseUrl, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubTab, activeStore.id, storeBaseUrl]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Instant connect disabled (zero-mock KSA) — require real OAuth Client ID
  const handleInstantGoogleConnect = (_email: string) => {
    setIsAuthenticating(false);
    setOauthError(
      isAr
        ? 'الربط الفوري متوقف. أدخل معرّف عميل جوجل الحقيقي ثم أكمل تسجيل الدخول.'
        : 'Instant connect is disabled. Enter a real Google Cloud client id, then sign in.',
    );
    toast(
      isAr ? 'البيانات الوهمية ممنوعة. استخدم تسجيل الدخول الحقيقي من جوجل.' : 'Invented connections are blocked. Use a real Google sign-in.',
      'error',
    );
  };

  // Real OAuth Connect Trigger
  const handleStartRealGoogleOAuth = () => {
    const step = seoSetupStep(activeStore);
    const email = storeGoogleEmail(activeStore);
    if (step === 'need_email') {
      toast(isAr ? 'أضف بريد دخول هذا المتجر أولاً.' : 'Add this store’s login email first.', 'error');
      return;
    }
    if (step === 'need_domain') {
      toast(
        isAr
          ? 'النطاق العام غير محفوظ. بعد ربط النطاق يفتح مالك المتجر بريده في جوجل من هذه الصفحة.'
          : 'No public domain is saved yet. After the domain is added, the store owner signs in with their Gmail on this page.',
        'error',
      );
      return;
    }
    setIsAuthenticating(true);
    setOauthError(null);

    void (async () => {
      let clientId = '';
      try {
        const authMeta = await fetchGoogleAuthUrl(activeStore.id, window.location.origin);
        clientId = String(authMeta?.client_id || '').trim();
      } catch (err) {
        setIsAuthenticating(false);
        setOauthError(mapGoogleConnectError(err, isAr));
        return;
      }

      const custom = (customClientId || getStoredGoogleClientId()).trim();
      if (
        hasRealGoogleClientId(custom) &&
        hasRealGoogleClientId(clientId) &&
        custom !== clientId
      ) {
        setIsAuthenticating(false);
        setOauthError(
          isAr
            ? 'معرّف العميل المخصص لا يطابق إعداد الخادم. امسحه أو طابق السر على الخادم.'
            : 'Custom Client ID does not match the server. Clear it or match GOOGLE_CLIENT_ID / SECRET.',
        );
        return;
      }
      if (!hasRealGoogleClientId(clientId)) {
        clientId = hasRealGoogleClientId(custom) ? custom : getStoredGoogleClientId();
      }
      if (!hasRealGoogleClientId(clientId)) {
        setIsAuthenticating(false);
        setOauthError(
          isAr
            ? 'معرّف عميل جوجل غير جاهز على الخادم.'
            : 'Google Client ID is not ready on the server.',
        );
        return;
      }

      initiateRealGoogleOAuth({
        storeSlug: activeStore.slug,
        clientId,
        loginHint: email,
        flow: 'code',
        onCode: async (code, redirectUri) => {
          try {
            const res = await submitGoogleCallback(activeStore.id, { code, redirect_uri: redirectUri });
            const savedEmail = String(res?.integration?.google_account_email || '').trim();
            setIsAuthenticating(false);
            if (!savedEmail) {
              setOauthError(
                isAr
                  ? 'جوجل لم يحفظ حساب هذا المتجر. أعد المحاولة من النطاق العام.'
                  : 'Google did not save this store account. Try again on the public domain.',
              );
              return;
            }
            connectGoogleAccount(activeStore.id, savedEmail);
            updateStoreSEOConfig(activeStore.id, {
              googleConnected: true,
              googleAccountEmail: savedEmail,
              connectedAt: new Date().toISOString().split('T')[0],
              searchConsoleConnected: Boolean(res?.site_kit?.linked?.search_console),
              ga4MeasurementId: res?.integration?.ga4_measurement_id || realTrackingId(currentSEOConfig.ga4MeasurementId),
              gtmContainerId: res?.integration?.gtm_container_id || realTrackingId(currentSEOConfig.gtmContainerId),
              indexingApiEnabled: Boolean(res?.site_kit?.indexing_homepage_pinged),
            });
            toast(
              isAr ? `تم ربط جوجل لهذا المتجر:${savedEmail}` : `Google connected for this store: ${savedEmail}`,
              'success',
            );
          } catch (err) {
            setIsAuthenticating(false);
            setOauthError(mapGoogleConnectError(err, isAr));
          }
        },
        onSuccess: () => {
          setIsAuthenticating(false);
        },
        onError: (errMsg) => {
          setIsAuthenticating(false);
          setOauthError(mapGoogleConnectError(errMsg, isAr));
        },
      });
    })();
  };

  const handleDisconnect = () => {
    disconnectGoogleAccount(activeStore.id);
    clearStoreGoogleState(activeStore.id);
    clearPageSpeedFixes(activeStore.id);
    toast(isAr ? 'تم فصل حساب جوجل وإعادة ضبط البيانات' : 'Google account disconnected and data reset', 'info');
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredGoogleClientId(customClientId);
    setShowConfigModal(false);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlToSubmit.trim()) return;
    setIsSubmittingIndex(true);
    setTimeout(() => {
      submitUrlToGoogleIndexing(activeStore.id, urlToSubmit.trim());
      setUrlToSubmit('');
      setIsSubmittingIndex(false);
    }, 600);
  };

  const handleSaveMeta = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSEOConfig(activeStore.id, {
      metaTitle,
      metaDescription,
      metaTitleEn,
      metaTitleAr,
      metaDescriptionEn,
      metaDescriptionAr,
      ga4MeasurementId: ga4Id,
      gtmContainerId: gtmId,
      searchConsoleVerificationTag: gscTag,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleAddKeyword = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newKeyword.trim()) {
      e.preventDefault();
      const updated = [...currentSEOConfig.keywords, newKeyword.trim()];
      updateStoreSEOConfig(activeStore.id, { keywords: updated });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (index: number) => {
    const updated = currentSEOConfig.keywords.filter((_, i) => i !== index);
    updateStoreSEOConfig(activeStore.id, { keywords: updated });
  };

  return (
    <div className="u-page p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100 w-full min-w-0" dir={dir}>
      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--muted)' }}>
        <button
          type="button"
          onClick={() => onNavigateTab?.('marketing')}
          className="cursor-pointer hover:underline bg-transparent border-0 p-0"
          style={{ color: 'var(--accent)' }}
        >
          {isAr ? 'أدوات التسويق' : 'Marketing Tools'}
        </button>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>
          {isAr ? 'تحسين محركات البحث' : 'SEO Optimization'}
        </span>
      </div>
      {/* ── Top Header Banner with Official Google Identity ── */}
      <div
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-white p-6 sm:p-7 rounded-3xl shadow-sm border"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #032320 50%, #021a18 100%)',
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shadow-inner">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
              {isAr ? 'تحسين محركات البحث' : 'SEO Optimization'}
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {isAr ? 'تسجيل دخول حقيقي' : 'Real sign-in'}
              </span>
            </h1>
          </div>
          <p className="text-sm text-slate-200 max-w-3xl leading-relaxed font-medium">
            {isAr
              ? 'اربط حساب جوجل الخاص بهذا المتجر بعد أن يصبح النطاق مباشراً على الاستضافة. الأرقام تظهر فقط عندما ترسلها جوجل أو ميتا. قبل ذلك تبقى الخانات فارغة.'
              : 'Connect this store’s own Google account after the domain is live on Hostinger. Numbers appear only when Google or Meta sends them. Until then the fields stay empty.'}
          </p>
        </div>

        {/* Google Real Connection Status */}
        <div className="flex items-center gap-3 shrink-0">
          {currentSEOConfig.googleConnected ? (
            <div className="bg-slate-900/90 border border-emerald-500/40 p-3 rounded-2xl flex items-center gap-3.5 backdrop-blur-sm">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white truncate max-w-[200px]">
                    {currentSEOConfig.googleAccountEmail}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
                <div className="text-[10px] text-emerald-300">
                  {isAr ? 'حساب جوجل متصل' : 'Google account connected'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGuideOpen(true)}
                className="text-xs font-bold text-slate-200 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
              >
                {isAr ? 'الدليل' : 'Guide'}
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-xs font-bold text-rose-300 hover:text-rose-100 px-2 py-1 rounded-lg hover:bg-rose-500/20 transition-all cursor-pointer"
                title={isAr ? 'فصل الحساب' : 'Disconnect account'}
              >
                {isAr ? 'فصل الحساب' : 'Disconnect'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConnectModal(true)}
                disabled={isAuthenticating}
                className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl text-xs font-black flex items-center gap-2.5 shadow-lg transition-all cursor-pointer transform active:scale-95 disabled:opacity-60"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span>{isAr ? 'جاري الربط...' : 'Connecting...'}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>{isAr ? 'ربط حساب جوجل' : 'Connect Google account'}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowConfigModal(true)}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl border border-slate-700 cursor-pointer transition-all"
                title={isAr ? 'إعداد معرّف عميل جوجل' : 'Set the Google client id'}
              >
                <Sliders className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsGuideOpen(true)}
                className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-2xl border border-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                <HelpCircle className="w-4 h-4 text-blue-400" />
                <span>{isAr ? 'الدليل' : 'Guide'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {oauthError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-2xl text-xs flex items-center gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">{isAr ? 'خطأ في تسجيل الدخول:' : 'Sign-in error:'} </span>
            <span>{oauthError}</span>
          </div>
          <button onClick={() => setOauthError(null)} className="text-rose-600 dark:text-rose-400 hover:text-rose-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Hub: ONLY big buttons. Section open: back + that section's data. */}
      {activeSubTab === null ? (
        <div className="u-equal-sections grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {(
            [
              {
                id: 'hub' as const,
                icon: Activity,
                title: isAr ? 'مركز الربط' : 'Connection hub',
                desc: isAr ? 'ربط خدمات جوجل لهذا المتجر.' : 'Connect Google services for this store.',
              },
              {
                id: 'pagespeed' as const,
                icon: Gauge,
                title: isAr ? 'سرعة الصفحات ومؤشرات الويب' : 'PageSpeed & Web Vitals',
                desc: isAr ? 'قياس سرعة الصفحات من بيانات حقيقية.' : 'Measure page speed from real data.',
              },
              {
                id: 'utm' as const,
                icon: Link2,
                title: isAr ? 'تتبع الحملات' : 'Campaign tracking',
                desc: isAr ? 'روابط التتبع للحملات التسويقية.' : 'UTM links for marketing campaigns.',
              },
              {
                id: 'meta' as const,
                icon: Globe,
                title: isAr ? 'وسوم الصفحة وخريطة الموقع' : 'Page tags and sitemap',
                desc: isAr ? 'وسوم الصفحات وخريطة الموقع.' : 'Page meta tags and sitemap.',
              },
              {
                id: 'simulator' as const,
                icon: Eye,
                title: isAr ? 'معاينة نتائج البحث' : 'Search result preview',
                desc: isAr ? 'معاينة ظهور المتجر في نتائج البحث.' : 'Preview how the store appears in search.',
              },
              {
                id: 'deep_audit' as const,
                icon: Sparkles,
                title: isAr ? 'الروابط والعناوين والنص البديل' : 'Links, headings, and alt text',
                desc: isAr ? 'مراجعة الروابط والعناوين والنص البديل.' : 'Audit links, headings, and alt text.',
              },
            ] as const
          ).map((tab) => (
            <PortalHubCard
              key={tab.id}
              icon={tab.icon}
              title={tab.title}
              description={tab.desc}
              onClick={() => setActiveSubTab(tab.id)}
              isAr={isAr}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSubTab(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold cursor-pointer shadow-xs"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} aria-hidden />
            {isAr ? 'كل أقسام تحسين البحث' : 'All SEO sections'}
          </button>
        </div>
      )}

      {/* ================= TAB 0: SITE KIT CENTRALIZED CONNECTION HUB ================= */}
      {activeSubTab === 'hub' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs leading-relaxed">
            {seoSetupStep(activeStore) === 'need_email' && (isAr
              ? 'بريد دخول هذا المتجر غير محفوظ. بعد حفظه يربط المالك حسابه بنفسه.'
              : 'This store has no login email yet. After it is saved, the owner connects their own account.')}
            {seoSetupStep(activeStore) === 'need_domain' && (isAr
              ? `البريد ${storeGoogleEmail(activeStore)} جاهز. النطاق العام غير مربوط، لذلك تبقى هذه الخطوة معلقة. بعد إضافة النطاق يفتح المالك بريده من زر الربط. لا حاجة لتكرار ذلك من الإدارة لكل متجر.`
              : `Email ${storeGoogleEmail(activeStore)} is ready. The public domain is not linked yet, so this step waits. After the domain is added, the owner signs in from the connect button. Master does not repeat this for every store.`)}
            {seoSetupStep(activeStore) === 'ready' && (isAr
              ? `النطاق ${storePublicHost(activeStore)} والبريد ${storeGoogleEmail(activeStore)} جاهزان. المالك يسجّل الدخول ببريده مرة واحدة. الأرقام تأتي من جوجل بعد ذلك، ولا تُخترع هنا.`
              : `Domain ${storePublicHost(activeStore)} and email ${storeGoogleEmail(activeStore)} are ready. The owner signs in with that email once. Numbers come from Google after that, and are not invented here.`)}
          </div>
          {/* Services Matrix (4 Google Services: GA4, GSC, GTM, Indexing) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Google Analytics 4 */}
            <div className="p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-200 dark:border-amber-800">
                    GA4
                  </div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{isAr ? 'تحليلات جوجل' : 'Google Analytics 4'}</span>
                </div>
                {currentSEOConfig.googleConnected ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{isAr ? 'متصل' : 'Connected'}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {isAr ? 'غير متصل' : 'Not connected'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {isAr ? 'يتتبع التحويلات وإضافات السلة والزوار عند توفر معرّف القياس الحقيقي.' : 'Tracks conversions, cart adds, and visitors when a real measurement id is saved.'}
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[130px]">
                  {currentSEOConfig.ga4MeasurementId || '—'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowTrackingConfigModal(true)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold text-[11px] cursor-pointer"
                >
                  {isAr ? 'إعداد' : 'Configure'}
                </button>
              </div>
            </div>

            {/* 2. Google Search Console */}
            <div className="p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-200 dark:border-blue-800">
                    GSC
                  </div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{isAr ? 'بحث جوجل' : 'Search Console'}</span>
                </div>
                {currentSEOConfig.googleConnected ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{isAr ? 'متصل' : 'Connected'}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {isAr ? 'غير متصل' : 'Not connected'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {isAr ? 'نقرات البحث ومرات الظهور تُعرض فقط بعد الربط الحقيقي.' : 'Search clicks and impressions appear only after a real connection.'}
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  {currentSEOConfig.googleConnected
                    ? (isAr ? `${currentSEOConfig.totalSearchClicks || 0}نقرة` : `${currentSEOConfig.totalSearchClicks || 0} clicks`)
                    : '—'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      sessionStorage.setItem('unityteck-settings-view', 'search_console');
                    } catch {
                      /* storage may be unavailable */
                    }
                    window.dispatchEvent(new CustomEvent('unityteck-open-store-tab', { detail: 'settings' }));
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold text-[11px] cursor-pointer"
                >
                  {isAr ? 'فتح الإعدادات' : 'Open Settings'}
                </button>
              </div>
            </div>

            {/* 3. Google Tag Manager */}
            <div className="p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-bold text-xs flex items-center justify-center border border-teal-200 dark:border-teal-800">
                    GTM
                  </div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{isAr ? 'مدير العلامات' : 'Tag Manager'}</span>
                </div>
                {currentSEOConfig.googleConnected ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{isAr ? 'متصل' : 'Connected'}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {isAr ? 'غير متصل' : 'Not connected'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {isAr ? 'حاوية مدير العلامات تُعرض فقط إذا حُفظ معرّفها لهذا المتجر.' : 'The tag container id shows only when it is saved for this store.'}
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[130px]">
                  {currentSEOConfig.gtmContainerId || '—'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowTrackingConfigModal(true)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold text-[11px] cursor-pointer"
                >
                  {isAr ? 'إدارة' : 'Manage'}
                </button>
              </div>
            </div>

            {/* 4. Instant Google Indexing */}
            <div className="p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                    API
                  </div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{isAr ? 'فهرسة جوجل' : 'Indexing API'}</span>
                </div>
                {currentSEOConfig.googleConnected ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{isAr ? 'نشط' : 'Active'}</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {isAr ? 'غير متصل' : 'Not connected'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {isAr ? 'عدد الصفحات المفهرسة يبقى صفراً إلى أن تصل بيانات حقيقية.' : 'Indexed page count stays at zero until real data arrives.'}
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  {currentSEOConfig.googleConnected
                    ? (isAr ? `${currentSEOConfig.indexedUrlsCount || 0}صفحة` : `${currentSEOConfig.indexedUrlsCount || 0} pages`)
                    : '—'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      sessionStorage.setItem('unityteck-settings-view', 'search_console');
                    } catch {
                      /* storage may be unavailable */
                    }
                    window.dispatchEvent(new CustomEvent('unityteck-open-store-tab', { detail: 'settings' }));
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold text-[11px] cursor-pointer"
                >
                  {isAr ? 'فتح الإعدادات' : 'Open Settings'}
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ================= TAB: CORE WEB VITALS & PAGESPEED ================= */}
      {activeSubTab === 'pagespeed' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'مؤشرات سرعة الصفحات وأداء الويب' : 'PageSpeed & Core Web Vitals Insights'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {pageSpeedData?.isLive
                  ? (isAr ? 'تم الفحص مباشرة عبر واجهة جوجل الرسمية' : 'Audited directly through the official Google speed check')
                  : (isAr ? 'شغّل الفحص لقياس الأداء الحقيقي من جوجل' : 'Run an audit to measure real Google speed scores')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono max-w-full"
                title={isAr ? 'رابط هذا المتجر فقط — غير قابل للتعديل' : 'This store URL only — not editable'}
              >
                <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span
                  className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate max-w-[14rem] sm:max-w-[16rem] select-all"
                  dir="ltr"
                >
                  {storeBaseUrl}
                </span>
              </div>

              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setPageSpeedStrategy('mobile');
                    void loadPageSpeed('mobile', storeBaseUrl, true);
                  }}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    pageSpeedStrategy === 'mobile' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{isAr ? 'الجوال' : 'Mobile'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPageSpeedStrategy('desktop');
                    void loadPageSpeed('desktop', storeBaseUrl, true);
                  }}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    pageSpeedStrategy === 'desktop' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>{isAr ? 'سطح المكتب' : 'Desktop'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => void loadPageSpeed(pageSpeedStrategy, storeBaseUrl, true)}
                disabled={isLoadingPageSpeed}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPageSpeed ? 'animate-spin' : ''}`} />
                <span>{isLoadingPageSpeed ? (isAr ? 'جاري الفحص...' : 'Auditing...') : isAr ? 'فحص الآن' : 'Run Audit'}</span>
              </button>
            </div>
          </div>

          {!pageSpeedData && !isLoadingPageSpeed ? (
            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 text-center space-y-3">
              <Gauge className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {pageSpeedError
                  ? (isAr ? 'تعذّر جلب نتائج سرعة الصفحات' : 'PageSpeed Results Unavailable')
                  : (isAr ? 'لم يتم تشغيل فحص سرعة الصفحات بعد' : 'No PageSpeed Audit Run Yet')}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {pageSpeedError ||
                  (isAr
                    ? 'اضغط على زر الفحص لقياس أداء ومؤشرات الويب الحقيقية لمتجرك عبر واجهة جوجل الرسمية.'
                    : 'Click Run Audit to measure genuine performance, SEO, accessibility, and Core Web Vitals via the official Google PageSpeed API.')}
              </p>
              <button
                type="button"
                onClick={() => void loadPageSpeed(pageSpeedStrategy, storeBaseUrl, true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isAr ? 'تشغيل الفحص الحي' : 'Run Live PageSpeed Audit'}</span>
              </button>
            </div>
          ) : isLoadingPageSpeed ? (
            <div className="p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? 'جاري فحص المتجر عبر جوجل...' : 'Auditing the store through Google...'}
              </h4>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'يتم قياس أكبر محتوى ظاهر وتغيّر التخطيط وأول محتوى ظاهر وسرعة التحميل...'
                  : 'Measuring LCP, CLS, FCP, blocking time, and SEO audits...'}
              </p>
            </div>
          ) : pageSpeedData ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
                  <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-black text-lg shrink-0 ${psiScoreTone(pageSpeedData.performanceScore)}`}>
                    {pageSpeedData.isLive ? pageSpeedData.performanceScore : '—'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">{isAr ? 'الأداء' : 'Performance'}</span>
                    <span className="text-[10px] font-semibold text-slate-500">{psiScoreLabel(pageSpeedData.performanceScore)}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{pageSpeedStrategy === 'mobile' ? (isAr ? 'الجوال' : 'mobile') : (isAr ? 'سطح المكتب' : 'desktop')}</span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
                  <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-black text-lg shrink-0 ${psiScoreTone(pageSpeedData.accessibilityScore)}`}>
                    {pageSpeedData.isLive ? pageSpeedData.accessibilityScore : '—'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">{isAr ? 'إمكانية الوصول' : 'Accessibility'}</span>
                    <span className="text-[10px] font-semibold text-slate-500">{psiScoreLabel(pageSpeedData.accessibilityScore)}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{isAr ? 'التباين والعناوين' : 'Contrast & labels'}</span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
                  <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-black text-lg shrink-0 ${psiScoreTone(pageSpeedData.bestPracticesScore)}`}>
                    {pageSpeedData.isLive ? pageSpeedData.bestPracticesScore : '—'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">{isAr ? 'أفضل الممارسات' : 'Best Practices'}</span>
                    <span className="text-[10px] font-semibold text-slate-500">{psiScoreLabel(pageSpeedData.bestPracticesScore)}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{isAr ? 'التشفير والأمان' : 'HTTPS & security'}</span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
                  <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-black text-lg shrink-0 ${psiScoreTone(pageSpeedData.seoScore)}`}>
                    {pageSpeedData.isLive ? pageSpeedData.seoScore : '—'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">{isAr ? 'تحسين محركات البحث' : 'SEO'}</span>
                    <span className="text-[10px] font-semibold text-slate-500">{psiScoreLabel(pageSpeedData.seoScore)}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{isAr ? 'الوصف والبيانات المنظمة' : 'Meta & crawlability'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { key: 'lcp', label: isAr ? 'أكبر محتوى ظاهر' : 'LCP', value: pageSpeedData.lcp, tip: isAr ? 'الهدف أقل من ٢٫٥ ث' : 'Target < 2.5s' },
                  { key: 'fcp', label: isAr ? 'أول محتوى ظاهر' : 'FCP', value: pageSpeedData.fcp, tip: isAr ? 'الهدف أقل من ١٫٨ ث' : 'Target < 1.8s' },
                  { key: 'cls', label: isAr ? 'تغيّر التخطيط' : 'CLS', value: pageSpeedData.cls, tip: isAr ? 'الهدف أقل من ٠٫١' : 'Target < 0.1' },
                  { key: 'tbt', label: isAr ? 'وقت الحظر الكلي' : 'TBT', value: pageSpeedData.tbt, tip: isAr ? 'الهدف أقل من ٢٠٠ ملث' : 'Target < 200ms' },
                  { key: 'si', label: isAr ? 'مؤشر السرعة' : 'Speed Index', value: pageSpeedData.speedIndex, tip: isAr ? 'الهدف أقل من ٣٫٤ ث' : 'Target < 3.4s' },
                  { key: 'inp', label: isAr ? 'الاستجابة للتفاعل' : 'INP', value: pageSpeedData.inp, tip: isAr ? 'الهدف أقل من ٢٠٠ ملث' : 'Target < 200ms' },
                ].map((m) => (
                  <div key={m.key} className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">{m.label}</span>
                    <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{m.value || '—'}</div>
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded block w-fit">{m.tip}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      <span>{isAr ? 'تشخيصات سرعة الصفحات والتوصيات:' : 'PageSpeed Diagnostics & Recommendations:'}</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isAr
                        ? 'فرص تحسين حقيقية من تحليل الأداء — بدون درجات وهمية أو إصلاح تلقائي مزيف'
                        : 'Real Lighthouse opportunities — no invented scores or fake auto-fix'}
                    </p>
                  </div>
                  {pageSpeedData.auditedAt && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isAr ? `آخر فحص:${pageSpeedData.auditedAt}` : `Last audit: ${pageSpeedData.auditedAt}`}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveIssueCategory('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      activeIssueCategory === 'all'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isAr ? 'الكل' : 'All'} ({pageSpeedData.issues.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIssueCategory('performance')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      activeIssueCategory === 'performance'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {isAr ? 'الأداء والسرعة' : 'Performance'} ({pageSpeedData.issues.filter((i) => i.category === 'performance').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIssueCategory('accessibility')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      activeIssueCategory === 'accessibility'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {isAr ? 'إمكانية الوصول' : 'Accessibility'} ({pageSpeedData.issues.filter((i) => i.category === 'accessibility').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIssueCategory('seo')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      activeIssueCategory === 'seo'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {isAr ? 'تحسين محركات البحث' : 'SEO'} ({pageSpeedData.issues.filter((i) => i.category === 'seo').length})
                  </button>
                </div>

                {(!pageSpeedData.issues || pageSpeedData.issues.length === 0) ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {isAr
                        ? `لا توجد فرص فاشلة ضمن أعلى التشخيصات. اجتاز${pageSpeedData.passedAuditsCount || 0}فحصاً.`
                        : `No failing opportunities in the top diagnostics. ${pageSpeedData.passedAuditsCount || 0} audits passed.`}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pageSpeedData.issues
                      .filter((i) => activeIssueCategory === 'all' || i.category === activeIssueCategory)
                      .map((issue) => (
                        <div
                          key={issue.id}
                          className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-amber-500" />
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white">{issue.title}</h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                issue.category === 'performance'
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                  : issue.category === 'seo'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                              }`}>
                                {issue.category === 'performance'
                                  ? (isAr ? 'أداء' : 'performance')
                                  : issue.category === 'seo'
                                  ? (isAr ? 'بحث' : 'seo')
                                  : (isAr ? 'وصول' : 'accessibility')}
                              </span>
                            </div>
                            {issue.displayValue && (
                              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg shrink-0 border bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                                {issue.displayValue}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px] pt-1">
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700">
                              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                                {isAr ? 'سبب الأهمية والتأثير:' : 'Why it matters:'}
                              </span>
                              <p className="text-slate-600 dark:text-slate-400">{issue.whyItMatters || issue.description}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800">
                              <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                                {isAr ? 'الحل المقترح:' : 'Recommended fix:'}
                              </span>
                              <p className="text-emerald-700 dark:text-emerald-400">{issue.recommendedFix}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ================= TAB 1: GOOGLE SEARCH CONSOLE & INDEXING ================= */}
      {activeSubTab === 'console' && (
        <div className="space-y-6">
          {!currentSEOConfig.googleConnected ? (
            /* Unconnected State Banner */
            <div className="p-6 rounded-3xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-center space-y-3">
              <Search className="w-10 h-10 text-blue-600 mx-auto" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {isAr ? 'بحث جوجل غير متصل' : 'Google Search Console is not connected'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
                {isAr
                  ? 'اربط حساب جوجل الخاص بمتجرك لعرض النقرات الحقيقية ومرات الظهور ومعدل النقر والكلمات المفتاحية.'
                  : 'Connect your store\'s official Google Account to view real organic search clicks, impressions, CTR, position, and actual shopper queries from google.com.sa.'}
              </p>
              <button
                type="button"
                onClick={() => setShowConnectModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-md inline-flex items-center gap-2 cursor-pointer transition-all transform active:scale-95"
              >
                <Zap className="w-4 h-4" />
                <span>{isAr ? 'ربط حساب جوجل الآن' : 'Connect Google account'}</span>
              </button>
            </div>
          ) : (
            /* Connected KPI Metrics from Real Google Search Console */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-blue-50/70 hover:bg-blue-50/90 dark:bg-blue-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 shadow-2xs space-y-2 transition-all">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-blue-200">
                  <span>{isAr ? 'نقرات بحث جوجل' : 'Google search clicks'}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {currentSEOConfig.totalSearchClicks > 0
                      ? (isAr ? 'بيانات حقيقية' : 'Real Data')
                      : (isAr ? 'بانتظار المزامنة' : 'Waiting for Sync')}
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {currentSEOConfig.totalSearchClicks > 0 ? currentSEOConfig.totalSearchClicks.toLocaleString() : '0'}
                </div>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium block">
                  {isAr ? 'زوار البحث العضوي' : 'Organic search visitors'}
                </span>
              </div>

              <div className="p-5 bg-emerald-50/70 hover:bg-emerald-50/90 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs space-y-2 transition-all">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-emerald-200">
                  <span>{isAr ? 'مرات الظهور' : 'Search Impressions'}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {currentSEOConfig.totalSearchImpressions > 0
                      ? (isAr ? 'بيانات حقيقية' : 'Real Data')
                      : (isAr ? 'بانتظار المزامنة' : 'Waiting for Sync')}
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {currentSEOConfig.totalSearchImpressions > 0 ? currentSEOConfig.totalSearchImpressions.toLocaleString() : '0'}
                </div>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium block">
                  {isAr ? 'مرات الظهور على جوجل' : 'Impressions on Google'}
                </span>
              </div>

              <div className="p-5 bg-purple-50/70 hover:bg-purple-50/90 dark:bg-purple-950/30 rounded-2xl border border-purple-200/80 dark:border-purple-900/40 shadow-2xs space-y-2 transition-all">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-purple-200">
                  <span>{isAr ? 'متوسط نسبة النقر' : 'Average click rate'}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {currentSEOConfig.avgCtr > 0
                      ? (isAr ? 'موثّق في بحث جوجل' : 'Search Console verified')
                      : (isAr ? 'بانتظار المزامنة' : 'Waiting for Sync')}
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {currentSEOConfig.avgCtr ? `${currentSEOConfig.avgCtr}%` : '0.0%'}
                </div>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium block">
                  {isAr ? 'معدل النقر العضوي' : 'Organic click-through rate'}
                </span>
              </div>

              <div className="p-5 bg-amber-50/70 hover:bg-amber-50/90 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-2xs space-y-2 transition-all">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-amber-200">
                  <span>{isAr ? 'حالة الفهرسة' : 'Google Indexing Status'}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {currentSEOConfig.indexedUrlsCount > 0
                      ? (isAr ? 'متصل' : 'Connected')
                      : (isAr ? 'لا توجد روابط' : 'No URLs')}
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {currentSEOConfig.indexedUrlsCount || 0} {isAr ? 'رابط' : 'URLs'}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 pt-2 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'آخر تنبيه:' : 'Last ping:'} {currentSEOConfig.lastIndexingPing || (isAr ? 'أبداً' : 'Never')}</span>
                </div>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium block">
                  {isAr ? 'موقع بحث جوجل' : 'Search Console site'}
                </span>
              </div>
            </div>
          )}

          {/* ⚡ ZERO-TOUCH AUTONOMOUS INDEXING ENGINE */}
          <div
            className="rounded-3xl p-6 sm:p-7 border shadow-sm space-y-4"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 78, 59, 0.15) 100%)',
              borderColor: 'rgba(16, 185, 129, 0.3)',
            }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Zap className="w-5 h-5" />
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    {isAr ? 'أرشفة تلقائية' : 'Automatic indexing'}
                    <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
                      {isAr ? 'يعمل تلقائياً 24/7' : 'Running 24/7'}
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                  {isAr
                    ? 'لا تحتاج إلى كتابة أو إرسال أي رابط يدوياً! محرك الأتمتة يفحص متجرك باستمرار ويرسل روابط المتجر الرئيسية وصفحات المنتجات وخرائط الموقع تلقائياً إلى فهرسة محركات البحث فور توفرها.'
                    : 'Zero manual submissions required! The autonomous auto-pilot continuously indexes your store routes, catalog pages, and new product URLs directly with Googlebot.'}
                </p>
              </div>

              {/* Auto-Pilot Action Trigger */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAutoPilotSyncAll(false)}
                  disabled={isAutoPilotSyncing}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer transform active:scale-95 disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${isAutoPilotSyncing ? 'animate-spin' : ''}`} />
                  <span>
                    {isAutoPilotSyncing
                      ? (isAr ? 'جاري الأرشفة التلقائية...' : 'Auto-Indexing All Routes...')
                      : (isAr ? '⚡ مزامنة وأرشفة كافة الروابط فوراً' : '⚡ Sync All Store URLs Now')}
                  </span>
                </button>
              </div>
            </div>

            {/* Auto-Pilot Live Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-emerald-500/20 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                  {isAr ? 'الروابط المكتشفة' : 'Monitored URLs'}
                </span>
                <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                  {candidateUrls.length} {isAr ? 'صفحة' : 'Pages'}
                </div>
              </div>

              <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-emerald-500/20 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                  {isAr ? 'المؤرشفة في جوجل' : 'Indexed in Google'}
                </span>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {currentSEOConfig.indexedUrlsCount} {isAr ? 'رابط' : 'URLs'}
                </div>
              </div>

              <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-emerald-500/20 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                  {isAr ? 'حالة الطيار الآلي' : 'Auto-Pilot Mode'}
                </span>
                <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مستمر وتلقائي' : 'Autonomous'}</span>
                </div>
              </div>

              <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-emerald-500/20 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                  {isAr ? 'آخر تحديث تلقائي' : 'Last Auto-Ping'}
                </span>
                <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mt-1 truncate">
                  {autoPilotLastSync}
                </div>
              </div>
            </div>
          </div>

          {/* Instant Google Indexing API Form (Secondary / Custom URL fallback) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{isAr ? 'إرسال رابط إضافي مخصص (اختياري)' : 'Manual URL Ping (Optional — Auto-Pilot already handles store)'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr
                    ? 'إذا أردت فحص أو إرسال رابط خارجي أو حملة محددة بشكل فوري إلى فهرسة محركات البحث'
                    : 'Submit an individual custom URL directly to Googlebot if priority expedited indexing is required'}
                </p>
              </div>

              <div className="flex items-center gap-2" />
            </div>

            <form onSubmit={handleUrlSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder={`https://${activeStore.slug}.saudi-stores.com/products/new-item-slug`}
                  value={urlToSubmit}
                  onChange={(e) => setUrlToSubmit(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingIndex}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isSubmittingIndex ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isAr ? 'جاري الإرسال...' : 'Sending...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إرسال للفهرسة' : 'Send for indexing'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Submitted URLs Stream */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">{isAr ? 'الروابط المرسلة' : 'Submitted links'}</span>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">{isAr ? 'الرابط' : 'Link'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'وقت الإرسال' : 'Sent'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="py-2.5 px-3 text-right">{isAr ? 'إجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {currentSEOConfig.submittedUrls.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-blue-700 dark:text-blue-400 truncate max-w-md">
                          {item.url}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">{item.submittedAt}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>
                              {item.status === 'indexed'
                                ? (isAr ? 'مفهرس' : 'Indexed')
                                : item.status === 'crawling'
                                ? (isAr ? 'قيد الزحف' : 'Crawling')
                                : (isAr ? 'بانتظار التأكيد' : 'Waiting')}
                            </span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              submitUrlToGoogleIndexing(activeStore.id, item.url);
                            }}
                            className="text-[11px] text-slate-500 hover:text-blue-600 font-semibold cursor-pointer"
                          >
                            {isAr ? 'إعادة الإرسال' : 'Send again'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top Google Search Queries Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'استعلامات البحث' : 'Search queries'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr
                    ? 'تظهر الكلمات فقط عندما يعيدها حساب هذا المتجر.'
                    : 'Queries appear only when this store’s account returns them.'}
                </p>
              </div>
              <span className="text-xs text-slate-400">{isAr ? 'آخر ٢٨ يوماً عند توفر البيانات' : 'Last 28 days when data exists'}</span>
            </div>

            {!currentSEOConfig.googleConnected ? (
              <div className="py-8 text-center space-y-2">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-500">
                  {isAr ? 'حساب جوجل غير متصل. اربط الحساب لعرض الاستعلامات الحقيقية.' : 'Google account is not connected. Connect it to show real queries.'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowConnectModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {isAr ? 'ربط حساب جوجل' : 'Connect Google account'}
                </button>
              </div>
            ) : (!currentSEOConfig.topQueries || currentSEOConfig.topQueries.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {isAr ? 'لا توجد بيانات كلمات بحث متوفرة لهذه الفترة بعد.' : 'No search query data available for this store period yet.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">{isAr ? 'الاستعلام' : 'Query'}</th>
                      <th className="py-3 px-3 text-right">{isAr ? 'النقرات' : 'Clicks'}</th>
                      <th className="py-3 px-3 text-right">{isAr ? 'مرات الظهور' : 'Impressions'}</th>
                      <th className="py-3 px-3 text-right">{isAr ? 'معدل النقر' : 'Click rate'}</th>
                      <th className="py-3 px-4 text-center">{isAr ? 'متوسط الترتيب' : 'Average position'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {currentSEOConfig.topQueries.map((q, idx) => {
                      const ctr = q.impressions > 0 ? ((q.clicks / q.impressions) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="text-slate-400 font-mono text-[10px]">#{idx + 1}</span>
                            <span>{q.query}</span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                            {q.clicks.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                            {q.impressions.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                            {ctr}%
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              #{q.position}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: GOOGLE TAG MANAGER & GA4 ================= */}
      {activeSubTab === 'google_tags' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GA4 Setup */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                GA4
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{isAr ? 'تحليلات جوجل' : 'Google Analytics 4'}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{isAr ? 'الصق معرف القياس الحقيقي لهذا المتجر.' : 'Paste this store’s real measurement id.'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'معرف القياس' : 'Measurement id'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ga4Id}
                    onChange={(e) => setGa4Id(e.target.value)}
                    placeholder="G-ABC1234567"
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                  <button
                    onClick={() => handleCopy(ga4Id, 'ga4')}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'ga4' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'ga4' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  {isAr ? 'تجده في حساب التحليلات ثم المشرف ثم تدفق البيانات.' : 'Find it in the analytics account, then admin, then data streams.'}
                </p>
              </div>

              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-1.5 text-xs text-emerald-900 dark:text-emerald-200">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'الأحداث لا تُعد مفعّلة إلا بعد حفظ المعرف على النطاق المباشر' : 'Events are not treated as on until the id is saved on the live domain'}</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  {isAr
                    ? 'بعد النشر، الزيارة الحقيقية قد تظهر خلال دقائق، والتقارير العادية خلال يوم إلى يومين.'
                    : 'After publish, a real visit can show within minutes, and standard reports within one to two days.'}
                </p>
              </div>
            </div>
          </div>

          {/* Google Tag Manager Setup */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                GTM
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {isAr ? 'إدارة علامات جوجل' : 'Google Tag Manager (GTM)'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr
                    ? 'نشر العلامات المخصصة وبكسل الإعلانات وعلامات الحملات'
                    : 'Deploy custom tags, TikTok pixels, and Google Ads tags'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'معرّف حاوية العلامات' : 'GTM Container ID (GTM-XXXXXXX)'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={gtmId}
                    onChange={(e) => setGtmId(e.target.value)}
                    placeholder="GTM-XXXXXXX"
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                  <button
                    onClick={() => handleCopy(gtmId, 'gtm')}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'gtm' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'gtm' ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  {isAr
                    ? 'يُحقَن سكربت الحاوية تلقائياً في واجهة المتجر العامة.'
                    : 'The GTM container script is asynchronously injected into your storefront.'}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'وسم التحقق من أدوات مشرفي المواقع' : 'Google Search Console Verification Tag'}
                </label>
                <input
                  type="text"
                  value={gscTag}
                  onChange={(e) => setGscTag(e.target.value)}
                  placeholder="google-site-verification=..."
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSaveMeta}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer mt-2"
              >
                {isAr ? 'حفظ إعدادات علامات جوجل' : 'Save Google Tag Settings'}
              </button>

              {saveSuccess && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-center text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {isAr
                      ? 'تم تحديث العلامات! التغييرات تظهر على المتجر فوراً.'
                      : 'Google tags updated! Changes live on your store immediately.'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: META TAGS & SITEMAP ================= */}
      {activeSubTab === 'meta' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              {isAr ? 'بيانات تحسين محركات البحث لواجهة المتجر' : 'Storefront SEO Metadata'}
            </h3>

            <form onSubmit={handleSaveMeta} className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">{isAr ? 'عنوان الصفحة' : 'Page title'}</label>
                  <span className={`text-[10px] ${metaTitle.length > 60 ? 'text-amber-600 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                    {metaTitle.length} / 60
                  </span>
                </div>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => (isAr ? setMetaTitleAr(e.target.value) : setMetaTitleEn(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">{isAr ? 'وصف الصفحة' : 'Page description'}</label>
                  <span className={`text-[10px] ${metaDescription.length > 160 ? 'text-amber-600 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                    {metaDescription.length} / 160
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => (isAr ? setMetaDescriptionAr(e.target.value) : setMetaDescriptionEn(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'كلمات البحث المستهدفة (اضغط إدخال للإضافة)' : 'Target SEO Keywords (Press Enter to add)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. توصيل ورد مكة, هدايا فاخرة..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={handleAddKeyword}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {currentSEOConfig.keywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(idx)}
                        className="text-slate-400 hover:text-rose-600 font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Open Graph Social Share Image Media Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'صورة المشاركة' : 'Share image'}
                </label>
                <input
                  ref={ogFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          setOgImageUrl(ev.target.result as string);
                          toast(isAr ? 'تم تحديث صورة المشاركة بنجاح' : 'Social share image uploaded!', 'success');
                        }
                      };
                      reader.readAsDataURL(f);
                    }
                  }}
                />
                <div
                  className="p-3.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-4 cursor-pointer transition-colors"
                  onClick={() => ogFileInputRef.current?.click()}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-16 h-11 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 shrink-0">
                      <img src={ogImageUrl} alt="OG Preview" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {isAr ? 'انقر لرفع صورة المشاركة' : 'Click to upload custom OG Image'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">1200x630 px (WhatsApp / Twitter / Meta)</span>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {isAr ? 'تحديث بيانات تحسين البحث' : 'Update SEO Metadata'}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              {isAr ? 'خريطة الموقع التلقائية' : 'Automated Sitemap.xml'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Dynamically generated at Next.js SSR build and refreshed on every product creation.
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-blue-700 dark:text-blue-400 truncate">
              {currentSEOConfig.sitemapUrl || `https://${activeStore.slug}.saudi-stores.com/sitemap.xml`}
            </div>
            <a
              href={currentSEOConfig.sitemapUrl || `https://${activeStore.slug}.saudi-stores.com/sitemap.xml`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>{isAr ? 'معاينة خريطة الموقع المباشرة' : 'Inspect Live XML Sitemap'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* ================= TAB: UTM CAMPAIGN TRACKING BUILDER ================= */}
      {activeSubTab === 'utm' && <UtmCampaignBuilder />}

      {/* ================= TAB: BROKEN LINKS, BACKLINKS, H1/H2, ALT TAGS & AUTO-INDEXING FIXER ================= */}
      {activeSubTab === 'deep_audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isAr
                  ? 'الفحص الشامل (الروابط المعطلة، الروابط الخلفية، العناوين، النصوص البديلة للصور، والفهرسة)'
                  : 'Full SEO Audit (Broken Links, Backlinks, Headings, Alt Tags & Indexing)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'لا نتائج وهمية — تظهر العناصر فقط بعد فحص حقيقي للمتجر.'
                  : 'Zero mock — items appear only after a real store crawl/API result.'}
              </p>
            </div>

            {deepAuditItems.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  toast(
                    isAr
                      ? 'الإصلاح التلقائي الوهمي معطّل — استخدم إصلاحاً حقيقياً لكل عنصر.'
                      : 'Fake bulk auto-fix is disabled — apply a real fix per item.',
                    'info',
                  );
                }}
                className="px-5 py-2.5 rounded-2xl text-xs font-black text-white shadow-md flex items-center gap-2 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAr ? 'تحديث نتائج الفحص' : 'Refresh audit results'}</span>
              </button>
            ) : null}
          </div>

          <div className="space-y-3">
            {deepAuditItems.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-sm text-slate-500">
                {isAr ? 'لا توجد سجلات — بانتظار بيانات الفحص الحقيقية' : 'No records found — Waiting for Data'}
              </div>
            ) : null}
            {deepAuditItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        item.status === 'fixed' || item.status === 'healthy'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-amber-500/15 text-amber-500'
                      }`}
                    >
                      {item.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-mono text-blue-600 dark:text-blue-400">{item.urlOrTarget}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {isAr ? item.issueAr : item.issueEn}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isAr ? item.fixActionAr : item.fixActionEn}
                  </div>
                </div>

                <div>
                  {item.status === 'fixed' || item.status === 'healthy' ? (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-500 text-xs font-black inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isAr ? 'سليم ومُفعل ✓' : 'Fixed & Verified ✓'}</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 text-xs font-black">
                      {isAr ? 'بانتظار فحص حقيقي' : 'Waiting for Data'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: SERP & RICH PREVIEW ================= */}
      {activeSubTab === 'simulator' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'معاينة نتائج البحث' : 'Google SERP Live Simulator'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'معاينة مباشرة لظهور متجرك في نتائج محركات البحث'
                  : 'Live preview of how your store appears on Google Search Results'}
              </p>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-all ${
                  previewDevice === 'mobile' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-all ${
                  previewDevice === 'desktop' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
            </div>
          </div>

          <div className={`mx-auto bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs ${previewDevice === 'mobile' ? 'max-w-md' : 'max-w-2xl'}`}>
            <div className="space-y-1 text-left" dir="ltr">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">
                  {activeStore.name.charAt(0)}
                </div>
                <span className="font-medium text-slate-800 dark:text-slate-200">{activeStore.name}</span>
                <span className="text-slate-400 dark:text-slate-500">https://{activeStore.slug}.saudi-stores.com</span>
              </div>
              <h4 className="text-blue-800 dark:text-blue-400 text-base font-medium hover:underline cursor-pointer">
                {metaTitle || (isAr ? 'لا يوجد عنوان' : 'No title yet')}
              </h4>
              <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                {metaDescription || (isAr ? 'لا يوجد وصف' : 'No description yet')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Real Tracking IDs Configuration Modal ── */}
      {showTrackingConfigModal && (
        <GlobalModal
          isOpen
          onClose={() => setShowTrackingConfigModal(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'إعداد معرفات التتبع الحقيقية' : 'Set real tracking ids'}
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {isAr ? 'إعداد معرفات التتبع الحقيقية' : 'Set real tracking ids'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr ? 'أدخل المعرفات الحقيقية من تحليلات جوجل ومدير العلامات' : 'Enter the real ids from Google Analytics and Tag Manager'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTrackingConfigModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* GA4 ID */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'معرف قياس تحليلات جوجل ٤' : 'Google Analytics 4 Measurement ID (GA4)'}
                </label>
                <input
                  type="text"
                  value={editGa4Id}
                  onChange={(e) => setEditGa4Id(e.target.value.trim())}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                  {isAr ? 'يبدأ بالمقطع المعتمد في تدفق القياس' : 'Starts with the measurement prefix from the data stream'}
                </span>
              </div>

              {/* GTM ID */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'معرف حاوية مدير العلامات من جوجل' : 'Google Tag Manager Container ID (GTM)'}
                </label>
                <input
                  type="text"
                  value={editGtmId}
                  onChange={(e) => setEditGtmId(e.target.value.trim())}
                  placeholder="GTM-XXXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Search Console Tag */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'وسم التحقق من أدوات مشرفي المواقع' : 'Google Search Console Verification Tag'}
                </label>
                <input
                  type="text"
                  value={editGscTag}
                  onChange={(e) => setEditGscTag(e.target.value.trim())}
                  placeholder="google-site-verification=XXXXXXXXXXXXXXXXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Google Ads ID */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'معرف تحويل إعلانات جوجل (اختياري)' : 'Google Ads Conversion ID / Tag (Optional)'}
                </label>
                <input
                  type="text"
                  value={editGoogleAdsId}
                  onChange={(e) => setEditGoogleAdsId(e.target.value.trim())}
                  placeholder="AW-XXXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowTrackingConfigModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  updateStoreSEOConfig(activeStore.id, {
                    ga4MeasurementId: editGa4Id,
                    gtmContainerId: editGtmId,
                    searchConsoleVerificationTag: editGscTag,
                    googleAdsConversionId: editGoogleAdsId,
                  });
                  setShowTrackingConfigModal(false);
                  toast(
                    isAr
                      ? 'تم حفظ معرفات هذا المتجر. الأرقام تظهر حسب المدد المكتوبة في الدليل.'
                      : 'Ids saved for this store. Numbers appear on the timetable in the guide.',
                    'success'
                  );
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-sm cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>{isAr ? 'حفظ وتفعيل المعرفات' : 'Save & Verify Live Stream'}</span>
              </button>
            </div>
          </div>
        </GlobalModal>
      )}

      {/* ── Official Google Site Kit Connection & Property Modal ── */}
      <GoogleConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnected={() => {
          setShowConnectModal(false);
          void loadPageSpeed();
        }}
      />

      {/* Docs Guide Modal */}
      <PageDocsGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        pageId="seo"
      />
    </div>
  );
};
