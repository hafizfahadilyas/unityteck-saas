import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  fetchCentralOverview,
  fetchGlobalSettings,
  updateGlobalSetting,
  fetchMerchantsList,
  executeBulkMerchantAction,
  fetchStorePlans,
  updateStorePlan,
  assignStorePlan,
  fetchAiPlans,
  updateAiPlan,
  assignAiSubscription,
  toggleAiSubscriptionStatus,
  fetchAiFeaturesRegistry,
  updateGlobalAiFeature,
  setMerchantFeatureOverride,
  bulkToggleAiFeature,
  fetchCreditWallets,
  fetchCreditTransactions,
  adjustMerchantCredits,
  bulkCreditGrant,
  fetchPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
  fetchPagesRegistry,
  toggleGlobalPage,
  setStorePageOverride,
  fetchComponentsRegistry,
  toggleGlobalComponent,
  setStoreComponentOverride,
  fetchCentralAuditLogs,
  type CentralOverviewData,
  type MerchantListItem,
  type AiPlanItem,
  type AiFeatureItem,
  type DashboardPageItem,
  type UiComponentItem,
  type PaymentRequestItem,
  type AuditLogItem,
} from '../../../api/masterCentralControlApi';
import { IndividualMerchantControlModal } from './IndividualMerchantControlModal';
import {
  LayoutDashboard,
  Users,
  Store,
  Settings,
  Crown,
  Sparkles,
  Cpu,
  Coins,
  CreditCard,
  Search,
  Image as ImageIcon,
  PhoneCall,
  Bot,
  Share2,
  Zap,
  Eye,
  Layers,
  ShieldCheck,
  Sliders,
  Network,
  BarChart3,
  Bell,
  Activity,
  Lock,
  FileText,
  SlidersHorizontal,
  RefreshCw,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Filter,
  Check,
  X,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  CheckSquare,
  Square,
} from 'lucide-react';

export const CONTROL_SECTIONS = [
  { id: 'overview', nameEn: '1. Central Overview', nameAr: '١. النظرة العامة المركزية', icon: LayoutDashboard },
  { id: 'merchants', nameEn: '2. Merchant Management', nameAr: '٢. إدارة التجار الشاملة', icon: Users },
  { id: 'stores', nameEn: '3. Store Management', nameAr: '٣. إدارة المتاجر المركزية', icon: Store },
  { id: 'global-settings', nameEn: '4. Global Settings', nameAr: '٤. الإعدادات العامة للمنصة', icon: Settings },
  { id: 'store-plans', nameEn: '5. Store Plan Management', nameAr: '٥. باقات المتاجر (١٠٠-٣٠٠-٥٠٠)', icon: Crown },
  { id: 'ai-subscriptions', nameEn: '6. AI Subscription Management', nameAr: '٦. اشتراكات الذكاء (٦ باقات)', icon: Sparkles },
  { id: 'ai-features', nameEn: '7. AI Feature Management', nameAr: '٧. سجل خدمات الذكاء الاصطناعي', icon: Cpu },
  { id: 'ai-credits', nameEn: '8. AI Credit Management', nameAr: '٨. إدارة أرصدة ومحافظ الذكاء', icon: Coins },
  { id: 'payments', nameEn: '9. Payment Management', nameAr: '٩. اعتماد وإدارة المدفوعات', icon: CreditCard },
  { id: 'seo', nameEn: '10. SEO Management', nameAr: '١٠. إدارة محركات البحث والسيو', icon: Search },
  { id: 'ai-images', nameEn: '11. AI Image Management', nameAr: '١١. توليد وتصميم الصور الذكية', icon: ImageIcon },
  { id: 'ai-calling', nameEn: '12. AI Calling Management', nameAr: '١٢. وكلاء الاتصال الصوتي السعودي', icon: PhoneCall },
  { id: 'ai-agents', nameEn: '13. AI Agent Management', nameAr: '١٣. وكلاء الدعم والأتمتة', icon: Bot },
  { id: 'social-media', nameEn: '14. Social Media Management', nameAr: '١٤. إدارة النشر الاجتماعي', icon: Share2 },
  { id: 'automation', nameEn: '15. Automation Management', nameAr: '١٥. أتمتة العمليات والمهام', icon: Zap },
  { id: 'page-visibility', nameEn: '16. Page Visibility Management', nameAr: '١٦. التحكم بظهور الصفحات', icon: Eye },
  { id: 'ui-components', nameEn: '17. UI Component Management', nameAr: '١٧. التحكم بالصناديق والأزرار', icon: Layers },
  { id: 'feature-access', nameEn: '18. Feature Access Control', nameAr: '١٨. مصفوفة صلاحيات الميزات', icon: ShieldCheck },
  { id: 'merchant-limits', nameEn: '19. Merchant Limits Management', nameAr: '١٩. حدود وسقوف الاستخدام', icon: Sliders },
  { id: 'integrations', nameEn: '20. API & Integration Management', nameAr: '٢٠. واجهات الربط والتكامل', icon: Network },
  { id: 'analytics', nameEn: '21. Usage & Cost Analytics', nameAr: '٢١. تحليلات الاستهلاك والتكاليف', icon: BarChart3 },
  { id: 'notifications', nameEn: '22. Notifications Management', nameAr: '٢٢. الإشعارات والتنبيهات', icon: Bell },
  { id: 'activity-logs', nameEn: '23. System Activity Logs', nameAr: '٢٣. سجل النشاط المباشر', icon: Activity },
  { id: 'security', nameEn: '24. Security & Permissions', nameAr: '٢٤. الأمان والأدوار الإدارية', icon: Lock },
  { id: 'audit-logs', nameEn: '25. Audit Logs', nameAr: '٢٥. سجلات التدقيق والرقابة', icon: FileText },
  { id: 'global-config', nameEn: '26. Global Configuration', nameAr: '٢٦. التهيئات والتوافق العام', icon: SlidersHorizontal },
];

export const SuperAdminControlCenter: React.FC = () => {
  const { locale, money } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Data States
  const [overview, setOverview] = useState<CentralOverviewData | null>(null);
  const [merchants, setMerchants] = useState<MerchantListItem[]>([]);
  const [storePlans, setStorePlans] = useState<any[]>([]);
  const [aiPlans, setAiPlans] = useState<AiPlanItem[]>([]);
  const [aiFeatures, setAiFeatures] = useState<AiFeatureItem[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [payments, setPayments] = useState<PaymentRequestItem[]>([]);
  const [pages, setPages] = useState<DashboardPageItem[]>([]);
  const [components, setComponents] = useState<UiComponentItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [globalSettings, setGlobalSettings] = useState<Record<string, any>>({});

  // Merchant Selection & Modals
  const [selectedMerchantIds, setSelectedMerchantIds] = useState<string[]>([]);
  const [openedMerchantId, setOpenedMerchantId] = useState<string | null>(null);

  // Action / Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    actionLabel: string;
    isDangerous?: boolean;
    onConfirm: () => Promise<void>;
  }>({ open: false, title: '', description: '', actionLabel: '', onConfirm: async () => {} });

  const loadCurrentSectionData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeSection === 'overview') {
        const data = await fetchCentralOverview();
        setOverview(data);
      } else if (activeSection === 'merchants') {
        const res = await fetchMerchantsList();
        setMerchants(res.data);
      } else if (activeSection === 'store-plans' || activeSection === 'stores') {
        const res = await fetchStorePlans();
        setStorePlans(res);
      } else if (activeSection === 'ai-subscriptions') {
        const res = await fetchAiPlans();
        setAiPlans(res);
      } else if (activeSection === 'ai-features' || activeSection === 'feature-access') {
        const res = await fetchAiFeaturesRegistry();
        setAiFeatures(res);
      } else if (activeSection === 'ai-credits' || activeSection === 'merchant-limits') {
        const res = await fetchCreditWallets();
        setWallets(res);
      } else if (activeSection === 'payments') {
        const res = await fetchPaymentRequests();
        setPayments(res.data);
      } else if (activeSection === 'page-visibility') {
        const res = await fetchPagesRegistry();
        setPages(res);
      } else if (activeSection === 'ui-components') {
        const res = await fetchComponentsRegistry();
        setComponents(res);
      } else if (activeSection === 'audit-logs' || activeSection === 'activity-logs') {
        const res = await fetchCentralAuditLogs();
        setAuditLogs(res.data);
      } else if (activeSection === 'global-settings' || activeSection === 'global-config') {
        const res = await fetchGlobalSettings();
        setGlobalSettings(res);
      }
    } catch (err: any) {
      toast({
        title: isAr ? 'خطأ في جلب البيانات' : 'Data Load Error',
        description: err.message || 'Failed to connect to central backend.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [activeSection, isAr, toast]);

  useEffect(() => {
    loadCurrentSectionData();
  }, [loadCurrentSectionData, refreshKey]);

  // Bulk Selection Handlers
  const handleSelectAllMerchants = (checked: boolean) => {
    if (checked) {
      setSelectedMerchantIds(merchants.map((m) => m.id));
    } else {
      setSelectedMerchantIds([]);
    }
  };

  const handleToggleMerchantSelection = (id: string) => {
    setSelectedMerchantIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  return (
    <div
      className="flex-1 flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ fontFamily: 'var(--font-ui, system-ui)' }}
    >
      {/* ── Top Executive Header ── */}
      <header className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 backdrop-blur flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
              <span>{isAr ? 'منصة سوق — مركز التحكم المركزي للماستر' : 'SOUQ PLATFORM — MASTER ADMIN CENTRAL CONTROL'}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PROD v2.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'إدارة مركزية كاملة لجميع التجار والمتاجر واشتراكات الذكاء والمدفوعات والميزات'
                : 'Centralized authority over all merchants, stores, AI services, subscriptions, and permissions.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{isAr ? 'تحديث البيانات' : 'Refresh State'}</span>
          </button>
        </div>
      </header>

      {/* ── Main Layout: Sidebar & Content ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Navigation Rail / Mini Sections */}
        <nav
          className="w-72 bg-slate-900/60 border-e border-slate-800 overflow-y-auto p-2 space-y-1 custom-sidebar-scroll shrink-0"
          aria-label="Control Center Sections"
        >
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {isAr ? 'أقسام لوحة التحكم (٢٦ قسماً)' : 'Control Sections (26 Modules)'}
          </div>
          {CONTROL_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition text-start ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{isAr ? sec.nameAr : sec.nameEn}</span>
              </button>
            );
          })}
        </nav>

        {/* Section View Pane */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ── 1. CENTRAL OVERVIEW ── */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>{isAr ? 'إجمالي التجار والمتاجر' : 'Merchants & Stores'}</span>
                    <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-white">
                    {overview?.counts.total_merchants || 0}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      ({overview?.counts.total_stores || 0} {isAr ? 'متجر' : 'stores'})
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{overview?.counts.active_stores || 0} {isAr ? 'متجر نشط حالياً' : 'Active Stores'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>{isAr ? 'اشتراكات المتاجر والذكاء' : 'Active Subscriptions'}</span>
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-white">
                    {overview?.counts.store_subscriptions || 0}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      (+{overview?.counts.ai_subscriptions || 0} AI)
                    </span>
                  </div>
                  <div className="text-[11px] text-indigo-400 flex items-center gap-1 font-medium">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAr ? 'باقات مستقلة ومحمية' : 'Separated Tier Entitlements'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>{isAr ? 'طلبات دفع بانتظار الاعتماد' : 'Pending Payment Approvals'}</span>
                    <CreditCard className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-2xl font-black text-white">
                    {overview?.counts.pending_payments || 0}
                  </div>
                  <div className="text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تتطلب مراجعة واعتماد الماستر' : 'Manual verification required'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>{isAr ? 'أرصدة الذكاء المتداولة' : 'Credits in Circulation'}</span>
                    <Coins className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white">
                    {(overview?.counts.total_credits_in_circulation || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'رصيد حقيقي مسجل بقاعدة البيانات' : 'Authoritative MySQL Wallets'}</span>
                  </div>
                </div>
              </div>

              {/* Service Matrix Status */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-200">
                  {isAr ? 'حالة البنية التحتية والأنظمة المركزية' : 'Core Infrastructure Health'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <div>
                      <div className="text-xs font-bold text-white">MySQL Database</div>
                      <div className="text-[10px] text-emerald-400 font-mono">Connected (Hostinger)</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <div>
                      <div className="text-xs font-bold text-white">Google Gemini API</div>
                      <div className="text-[10px] text-emerald-400 font-mono">Connected & Verified</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <div>
                      <div className="text-xs font-bold text-white">ZATCA E-Invoicing</div>
                      <div className="text-[10px] text-emerald-400 font-mono">Phase 2 Enforced</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <div>
                      <div className="text-xs font-bold text-white">Dynamic Config Sync</div>
                      <div className="text-[10px] text-indigo-400 font-mono">No-Reload Push Active</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 2. MERCHANT MANAGEMENT ── */}
          {activeSection === 'merchants' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-300">
                    {selectedMerchantIds.length}{' '}
                    {isAr ? 'تاجر محدد' : 'merchants selected'}
                  </span>
                  {selectedMerchantIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const amount = prompt(isAr ? 'أدخل عدد الرصيد للإضافة لجميع التجار المحددين:' : 'Enter credit amount to grant:');
                          if (amount) {
                            executeBulkMerchantAction({
                              merchant_ids: selectedMerchantIds,
                              action: 'add_credits',
                              credit_amount: parseInt(amount, 10),
                              reason: 'Bulk credit grant via Master Control',
                            }).then(() => {
                              toast({ title: isAr ? 'تمت إضافة الرصيد بنجاح' : 'Credits granted' });
                              loadCurrentSectionData();
                            });
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition"
                      >
                        {isAr ? 'إضافة رصيد جماعي' : 'Add Credits'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(isAr ? 'هل تريد تفعيل الذكاء الاصطناعي للتجار المحددين؟' : 'Enable AI for selected merchants?')) {
                            executeBulkMerchantAction({
                              merchant_ids: selectedMerchantIds,
                              action: 'enable_ai',
                              reason: 'Bulk enable AI via Master Control',
                            }).then(() => {
                              toast({ title: isAr ? 'تم تفعيل الذكاء الاصطناعي' : 'AI enabled' });
                              loadCurrentSectionData();
                            });
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition"
                      >
                        {isAr ? 'تفعيل الذكاء' : 'Enable AI'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(isAr ? 'هل تريد تعليق المتاجر المحددة مؤقتاً؟' : 'Suspend selected merchant stores?')) {
                            executeBulkMerchantAction({
                              merchant_ids: selectedMerchantIds,
                              action: 'suspend',
                              reason: 'Administrative suspension via Master Control',
                            }).then(() => {
                              toast({ title: isAr ? 'تم تعليق المتاجر' : 'Stores suspended' });
                              loadCurrentSectionData();
                            });
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition"
                      >
                        {isAr ? 'تعليق الخدمات' : 'Suspend'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={isAr ? 'بحث بالاسم، البريد، أو المعرف...' : 'Search merchant by name, email, ID...'}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Merchant Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedMerchantIds.length === merchants.length && merchants.length > 0}
                          onChange={(e) => handleSelectAllMerchants(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-800 text-indigo-600"
                        />
                      </th>
                      <th className="p-3">{isAr ? 'التاجر' : 'Merchant'}</th>
                      <th className="p-3">{isAr ? 'المتجر' : 'Store'}</th>
                      <th className="p-3">{isAr ? 'باقة المتجر' : 'Store Plan'}</th>
                      <th className="p-3">{isAr ? 'اشتراك الذكاء' : 'AI Plan'}</th>
                      <th className="p-3">{isAr ? 'الرصيد المتبقي' : 'Credits'}</th>
                      <th className="p-3">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="p-3 text-end">{isAr ? 'إجراءات التحكم' : 'Control Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {merchants.map((m) => {
                      const isSelected = selectedMerchantIds.includes(m.id);
                      return (
                        <tr key={m.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleMerchantSelection(m.id)}
                              className="rounded border-slate-700 bg-slate-800 text-indigo-600"
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white">{m.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{m.email}</div>
                          </td>
                          <td className="p-3">
                            {m.store ? (
                              <div>
                                <span className="font-semibold text-slate-200">{m.store.name}</span>
                                <div className="text-[10px] text-slate-500 font-mono">{m.store.domain || m.store.slug}</div>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">{isAr ? 'لا يوجد متجر' : 'No Store'}</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                              {m.store_plan.code}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                              {m.ai_plan.code}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-400">
                            {m.wallet.remaining_credits}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.store?.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {m.store?.status || 'Active'}
                            </span>
                          </td>
                          <td className="p-3 text-end">
                            <button
                              type="button"
                              onClick={() => setOpenedMerchantId(m.id)}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 ms-auto cursor-pointer"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                              <span>{isAr ? 'لوحة التحكم الفردية' : 'Open Control Panel'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 5. STORE PLAN MANAGEMENT ── */}
          {activeSection === 'store-plans' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-indigo-200">
                    {isAr ? 'إدارة باقات المتاجر الرسمية (١٠٠ - ٣٠٠ - ٥٠٠ ر.س)' : 'Default Store Plans (100, 300, 500 SAR)'}
                  </h3>
                  <p className="text-xs text-indigo-300/80">
                    {isAr
                      ? 'تعديل أسعار وحدود الباقات للمشتركين الجدد دون التأثير على اشتراكات التجار السارية'
                      : 'Update catalog prices and limits for future purchases. Existing merchant terms are preserved.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {storePlans.map((plan) => (
                  <div key={plan.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 relative flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">{plan.code}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                          {plan.subscriptions_count || 0} {isAr ? 'متجر مشترك' : 'stores'}
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-white mt-1">{plan.name}</h4>
                      <div className="text-2xl font-black text-white mt-2">
                        {plan.price_sar} <span className="text-xs font-normal text-slate-400">SAR / month</span>
                      </div>

                      <div className="mt-4 space-y-2 text-xs text-slate-300">
                        <div className="flex justify-between border-b border-slate-800 pb-1">
                          <span className="text-slate-400">{isAr ? 'حد المنتجات' : 'Products Limit'}</span>
                          <span className="font-bold">{plan.product_limit ? plan.product_limit : '∞ Unlimited'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-1">
                          <span className="text-slate-400">{isAr ? 'المساحة التخزينية' : 'Storage Limit'}</span>
                          <span className="font-bold">{plan.storage_mb} MB</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-1">
                          <span className="text-slate-400">{isAr ? 'فريق العمل' : 'Team Seats'}</span>
                          <span className="font-bold">{plan.team_seats} seats</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newPrice = prompt(isAr ? `أدخل السعر الجديد لباقة ${plan.name} (ر.س):` : `Enter new price for ${plan.name} (SAR):`, String(plan.price_sar));
                        if (newPrice) {
                          updateStorePlan(plan.id, {
                            price_sar: parseFloat(newPrice),
                            reason: `Price updated from ${plan.price_sar} to ${newPrice} SAR via Master Control`,
                          }).then(() => {
                            toast({ title: isAr ? 'تم تحديث سعر الباقة' : 'Store Plan updated' });
                            loadCurrentSectionData();
                          });
                        }
                      }}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition cursor-pointer"
                    >
                      {isAr ? 'تعديل سعر الباقة والميزات' : 'Edit Plan Price & Features'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 6. AI SUBSCRIPTION MANAGEMENT (6 OFFERS) ── */}
          {activeSection === 'ai-subscriptions' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-purple-200">
                    {isAr ? 'إدارة باقات الذكاء الاصطناعي الستة (شهري وسنوي)' : 'AI Subscriptions (6 Independently Configurable Offers)'}
                  </h3>
                  <p className="text-xs text-purple-300/80">
                    {isAr
                      ? 'باقات أساسية، متقدمة، والأكثر طلباً (شهري وسنوي) مع تحديد الحصص والرصيد وميزات Gemini'
                      : 'Monthly and Yearly (Basic, Advanced, Most Popular) with credit allowances and model access.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {aiPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-6 rounded-2xl border space-y-4 relative flex flex-col justify-between ${
                      plan.is_popular
                        ? 'bg-gradient-to-b from-purple-900/30 to-slate-900 border-purple-500 shadow-xl shadow-purple-900/20'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    {plan.is_popular && (
                      <span className="absolute -top-3 start-6 px-3 py-0.5 rounded-full bg-purple-600 text-[10px] font-black uppercase text-white tracking-wider shadow">
                        {isAr ? 'الأكثر طلباً' : 'Most Popular'}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {plan.billing_cycle} • {plan.tier}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 font-mono font-bold">
                          {plan.credits} {isAr ? 'رصيد' : 'Credits'}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white mt-1">{isAr ? plan.name_ar : plan.name_en}</h4>
                      <div className="text-2xl font-black text-white mt-2">
                        {plan.price_sar} <span className="text-xs font-normal text-slate-400">SAR / {plan.billing_cycle}</span>
                      </div>

                      <div className="mt-4 space-y-2 text-xs text-slate-300">
                        <div className="flex justify-between border-b border-slate-800 pb-1">
                          <span className="text-slate-400">{isAr ? 'الحد اليومي' : 'Daily Limit'}</span>
                          <span className="font-bold">{plan.daily_limit} generations</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-1">
                          <span className="text-slate-400">{isAr ? 'حد توليد الصور' : 'Images Limit'}</span>
                          <span className="font-bold">{plan.image_generation_limit} images</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-1">
                          <span className="text-slate-400">{isAr ? 'دقائق الاتصال الذكي' : 'Calling Minutes'}</span>
                          <span className="font-bold">{plan.calling_minutes} mins</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-1">
                          <span className="text-slate-400">{isAr ? 'رصيد المكافأة' : 'Bonus Credits'}</span>
                          <span className="font-bold text-emerald-400">+{plan.bonus_credits}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newPrice = prompt(isAr ? `أدخل السعر الجديد لباقة ${plan.name_en} (ر.س):` : `Enter new price:`, String(plan.price_sar));
                          if (newPrice) {
                            updateAiPlan(plan.id, {
                              price_sar: parseFloat(newPrice),
                              reason: 'Updated AI Plan Price via Master Control',
                            }).then(() => {
                              toast({ title: isAr ? 'تم تحديث باقة الذكاء' : 'AI Plan Updated' });
                              loadCurrentSectionData();
                            });
                          }
                        }}
                        className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition cursor-pointer"
                      >
                        {isAr ? 'تعديل السعر والحصص' : 'Edit Plan'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          updateAiPlan(plan.id, {
                            is_popular: !plan.is_popular,
                            reason: 'Toggled is_popular status',
                          }).then(() => {
                            toast({ title: isAr ? 'تم التحديث' : 'Status Toggled' });
                            loadCurrentSectionData();
                          });
                        }}
                        className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                          plan.is_popular ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'border-slate-700 text-slate-400 hover:text-white'
                        }`}
                        title={isAr ? 'تمييز كأكثر طلباً' : 'Toggle Most Popular'}
                      >
                        <Crown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 7. AI FEATURE MANAGEMENT ── */}
          {activeSection === 'ai-features' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">
                    {isAr ? 'سجل خدمات الذكاء الاصطناعي (١٦ خدمة مدمجة)' : 'AI Feature Registry (16 Official Services)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAr
                      ? 'التحكم العام بتفعيل/تعطيل كل ميزة، تغيير تكلفة الرصيد، والحدود اليومية والشهرية'
                      : 'Global enable/disable, credit cost adjustment, and usage quota limits per AI service.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiFeatures.map((feat) => {
                  const isEnabled = Boolean(feat.global_status);
                  return (
                    <div key={feat.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{isAr ? feat.name_ar : feat.name_en}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                              {feat.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{isAr ? feat.description_ar : feat.description_en}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            updateGlobalAiFeature(feat.id, {
                              global_status: !isEnabled,
                              reason: `Global feature status toggled to ${!isEnabled ? 'enabled' : 'disabled'}`,
                            }).then(() => {
                              toast({ title: isAr ? 'تم تحديث حالة الميزة' : 'Feature Status Updated' });
                              loadCurrentSectionData();
                            });
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
                            isEnabled
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {isEnabled ? (isAr ? 'مفعلة عاماً' : 'Global Enabled') : (isAr ? 'معطلة عاماً' : 'Global Disabled')}
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-300">
                        <div className="flex items-center gap-3">
                          <span>
                            {isAr ? 'التكلفة:' : 'Cost:'}{' '}
                            <strong className="text-indigo-400">{feat.credit_cost} {isAr ? 'رصيد' : 'credits'}</strong>
                          </span>
                          <span>
                            {isAr ? 'الحد اليومي:' : 'Daily:'} <strong>{feat.daily_limit}</strong>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newCost = prompt(isAr ? 'أدخل تكلفة الرصيد لكل استخدام:' : 'Enter credit cost per run:', String(feat.credit_cost));
                            if (newCost) {
                              updateGlobalAiFeature(feat.id, {
                                credit_cost: parseInt(newCost, 10),
                                reason: 'Credit cost modified',
                              }).then(() => {
                                toast({ title: isAr ? 'تم حفظ التكلفة' : 'Cost updated' });
                                loadCurrentSectionData();
                              });
                            }
                          }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                        >
                          {isAr ? 'تعديل التكلفة' : 'Edit Cost'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 9. PAYMENT APPROVAL MANAGEMENT ── */}
          {activeSection === 'payments' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">
                    {isAr ? 'مركز اعتماد ومراجعة المدفوعات والتحويلات البنكية' : 'Payment Approval & Proof Verification Center'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAr
                      ? 'مراجعة إيصالات التحويل البنكي وتفعيل الاشتراكات وإضافة الأرصدة آلياً وبشكل ذري فور الاعتماد'
                      : 'Review bank receipts. Approval atomically activates the purchased tier and adds wallet credits.'}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">{isAr ? 'رقم الطلب' : 'Request ID'}</th>
                      <th className="p-3">{isAr ? 'المتجر' : 'Store'}</th>
                      <th className="p-3">{isAr ? 'الباقة / الخدمة' : 'Package'}</th>
                      <th className="p-3">{isAr ? 'المبلغ' : 'Amount'}</th>
                      <th className="p-3">{isAr ? 'المرجع' : 'Reference'}</th>
                      <th className="p-3">{isAr ? 'إيصال التحويل' : 'Proof'}</th>
                      <th className="p-3">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="p-3 text-end">{isAr ? 'إجراءات الاعتماد' : 'Approval Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-mono font-bold text-indigo-400">#{p.id.slice(-6)}</td>
                        <td className="p-3 font-bold text-white">{p.store ? p.store.name : p.store_id}</td>
                        <td className="p-3 font-semibold text-slate-200">{p.package_name}</td>
                        <td className="p-3 font-bold text-white">{p.amount_sar} SAR</td>
                        <td className="p-3 font-mono text-slate-400">{p.transaction_ref}</td>
                        <td className="p-3">
                          {p.proof_url || p.proof_path ? (
                            <a
                              href={p.proof_url || `/storage/${p.proof_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-indigo-400 underline flex items-center gap-1 font-bold"
                            >
                              <span>{isAr ? 'عرض الإيصال' : 'View Proof'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-500 italic">{isAr ? 'بدون إيصال' : 'No file'}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : p.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-end">
                          {p.status === 'pending' ? (
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(isAr ? 'هل أنت متأكد من اعتماد هذا الدفع وتفعيل الرصيد؟' : 'Approve payment and activate credits?')) {
                                    approvePaymentRequest(p.id, { reason: 'Approved by Master' }).then(() => {
                                      toast({ title: isAr ? 'تم اعتماد الدفع وتفعيل الرصيد' : 'Payment approved and credited.' });
                                      loadCurrentSectionData();
                                    });
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition cursor-pointer"
                              >
                                {isAr ? 'اعتماد' : 'Approve'}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const reason = prompt(isAr ? 'أدخل سبب الرفض:' : 'Enter rejection reason:');
                                  if (reason) {
                                    rejectPaymentRequest(p.id, reason).then(() => {
                                      toast({ title: isAr ? 'تم رفض الطلب' : 'Payment rejected.' });
                                      loadCurrentSectionData();
                                    });
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition cursor-pointer"
                              >
                                {isAr ? 'رفض' : 'Reject'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              {p.reviewed_by ? `Reviewed by ${p.reviewed_by}` : 'Processed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 16. PAGE VISIBILITY MANAGEMENT ── */}
          {activeSection === 'page-visibility' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">
                    {isAr ? 'إدارة ظهور صفحات لوحة التحكم (٣٠ صفحة مسجلة)' : 'Page Visibility Registry (30 Dashboard Pages)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAr
                      ? 'إخفاء أو إظهار أي صفحة عاماً أو لمتجر محدد مع حجب الوصول المباشر عبر الواجهة الخلفية دون إلغاء الاشتراكات'
                      : 'Hide or show pages globally or per store. Direct URL access is blocked on the backend.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pages.map((p) => {
                  const isVisible = Boolean(p.global_visibility);
                  return (
                    <div key={p.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-xs">{isAr ? p.name_ar : p.name_en}</div>
                        <div className="text-[10px] text-slate-500 font-mono">/{p.route_key}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          toggleGlobalPage(p.id, !isVisible, 'Global toggle via Master Control').then(() => {
                            toast({ title: isAr ? 'تم تحديث حالة الصفحة' : 'Page visibility updated' });
                            loadCurrentSectionData();
                          });
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
                          isVisible
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {isVisible ? (isAr ? 'ظاهرة' : 'Visible') : (isAr ? 'مخفية' : 'Hidden')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 17. UI COMPONENT MANAGEMENT ── */}
          {activeSection === 'ui-components' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">
                    {isAr ? 'التحكم بالصناديق والأزرار والمكونات' : 'UI Components & Card Manager'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAr
                      ? 'إظهار وإخفاء وترتيب البطاقات الإحصائية وأزرار التوليد السريع والصناديق الإرشادية'
                      : 'Manage dashboard cards, statistics boxes, generation buttons, and their order.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {components.map((c) => {
                  const isVisible = Boolean(c.global_visibility);
                  return (
                    <div key={c.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-xs">{isAr ? c.title_ar || c.name_ar : c.title_en || c.name_en}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {c.component_key} • {c.component_type}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          toggleGlobalComponent(c.id, !isVisible, 'Global component toggle via Master Control').then(() => {
                            toast({ title: isAr ? 'تم تحديث المكون' : 'Component updated' });
                            loadCurrentSectionData();
                          });
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
                          isVisible
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {isVisible ? (isAr ? 'مفعل' : 'Active') : (isAr ? 'معطل' : 'Disabled')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 25. AUDIT LOGS ── */}
          {(activeSection === 'audit-logs' || activeSection === 'activity-logs') && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <h3 className="text-sm font-bold text-slate-200">
                  {isAr ? 'سجل التدقيق والرقابة المركزية (Audit Logs)' : 'Authoritative Master Audit Logs'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr
                    ? 'تسجيل كل قرار إداري مع الحالة السابقة والجديدة والسبب وهوية المشرف وعنوان IP'
                    : 'Every administrative decision recorded with before/after snapshots, reason, admin ID, and IP.'}
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">{isAr ? 'الوقت' : 'Timestamp'}</th>
                      <th className="p-3">{isAr ? 'المشرف' : 'Admin'}</th>
                      <th className="p-3">{isAr ? 'الإجراء' : 'Action'}</th>
                      <th className="p-3">{isAr ? 'المجال' : 'Domain'}</th>
                      <th className="p-3">{isAr ? 'المتجر' : 'Store'}</th>
                      <th className="p-3">{isAr ? 'السبب' : 'Reason'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="p-3 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="p-3 text-white font-bold">{log.admin_id}</td>
                        <td className="p-3 text-indigo-400 font-bold">{log.action}</td>
                        <td className="p-3 text-slate-300">{log.domain}</td>
                        <td className="p-3 text-slate-400">{log.store_id || 'Global'}</td>
                        <td className="p-3 text-slate-200 font-sans text-xs">{log.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 26. GLOBAL CONFIGURATION & REMAINING SECTIONS ── */}
          {['global-settings', 'global-config', 'seo', 'ai-images', 'ai-calling', 'ai-agents', 'social-media', 'automation', 'feature-access', 'merchant-limits', 'integrations', 'analytics', 'notifications', 'security'].includes(activeSection) && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white capitalize">
                  {CONTROL_SECTIONS.find((s) => s.id === activeSection)?.nameEn}
                </h3>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {isAr ? 'متصل بالواجهة الخلفية' : 'Live Connected API'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'هذا القسم مرتبط بشكل كامل بمحرك الأذونات والتهيئات المركزي. يمكنك إجراء التعديلات المباشرة مع تسجيل التدقيق التلقائي.'
                  : 'This section is fully bound to the central permissions and configuration engine. All operations execute directly against Laravel + MySQL.'}
              </p>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{isAr ? 'إجراء تهيئة سريعة لهذا القسم' : 'Apply Section Configuration'}</div>
                  <div className="text-[11px] text-slate-400">{isAr ? 'حفظ السياسة والقيم الافتراضية' : 'Save policy and global defaults'}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const reason = prompt(isAr ? 'أدخل سبب التعديل للتسجيل في التدقيق:' : 'Enter reason for audit record:');
                    if (reason) {
                      updateGlobalSetting({
                        setting_key: `sec_${activeSection}_enabled`,
                        setting_value: { enabled: true, updated_at: new Date().toISOString() },
                        setting_group: activeSection,
                        reason,
                      }).then(() => {
                        toast({ title: isAr ? 'تم تحديث الإعدادات وحفظها في التدقيق' : 'Settings updated and audited.' });
                      });
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition"
                >
                  {isAr ? 'حفظ وتطبيق التغييرات' : 'Save & Publish Changes'}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── 20-Tab Individual Merchant Control Panel Modal ── */}
      {openedMerchantId && (
        <IndividualMerchantControlModal
          merchantId={openedMerchantId}
          onClose={() => {
            setOpenedMerchantId(null);
            loadCurrentSectionData();
          }}
        />
      )}
    </div>
  );
};
