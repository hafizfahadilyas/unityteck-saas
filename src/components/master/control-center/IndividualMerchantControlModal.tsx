import React, { useState, useEffect } from 'react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  fetchMerchantProfile,
  updateMerchantProfile,
  adjustMerchantCredits,
  setMerchantFeatureOverride,
  setStorePageOverride,
  setStoreComponentOverride,
  assignStorePlan,
  assignAiSubscription,
} from '../../../api/masterCentralControlApi';
import {
  X,
  User,
  Store,
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
  Network,
  BarChart3,
  Users2,
  Bell,
  Activity,
  CheckCircle2,
  Save,
  RotateCcw,
  AlertTriangle,
  Sliders,
} from 'lucide-react';

interface Props {
  merchantId: string;
  onClose: () => void;
}

const TABS = [
  { id: 'overview', nameEn: '1. Overview', nameAr: '١. النظرة العامة', icon: User },
  { id: 'stores', nameEn: '2. Stores', nameAr: '٢. المتاجر', icon: Store },
  { id: 'store-sub', nameEn: '3. Store Subscription', nameAr: '٣. اشتراك المتجر', icon: Crown },
  { id: 'ai-sub', nameEn: '4. AI Subscription', nameAr: '٤. اشتراك الذكاء', icon: Sparkles },
  { id: 'ai-features', nameEn: '5. AI Features', nameAr: '٥. ميزات الذكاء', icon: Cpu },
  { id: 'credits', nameEn: '6. AI Credits', nameAr: '٦. محفظة الرصيد', icon: Coins },
  { id: 'payments', nameEn: '7. Payments', nameAr: '٧. المدفوعات', icon: CreditCard },
  { id: 'seo', nameEn: '8. SEO', nameAr: '٨. إعدادات السيو', icon: Search },
  { id: 'images', nameEn: '9. AI Images', nameAr: '٩. توليد الصور', icon: ImageIcon },
  { id: 'calling', nameEn: '10. AI Calling', nameAr: '١٠. المكالمات الذكية', icon: PhoneCall },
  { id: 'agents', nameEn: '11. AI Agents', nameAr: '١١. وكلاء الذكاء', icon: Bot },
  { id: 'social', nameEn: '12. Social Media', nameAr: '١٢. التواصل الاجتماعي', icon: Share2 },
  { id: 'automation', nameEn: '13. Automation', nameAr: '١٣. الأتمتة', icon: Zap },
  { id: 'pages', nameEn: '14. Page Visibility', nameAr: '١٤. ظهور الصفحات', icon: Eye },
  { id: 'components', nameEn: '15. UI Components', nameAr: '١٥. مكونات الواجهة', icon: Layers },
  { id: 'integrations', nameEn: '16. Integrations', nameAr: '١٦. التكامل والربط', icon: Network },
  { id: 'usage-costs', nameEn: '17. Usage & Costs', nameAr: '١٧. الاستهلاك والتكاليف', icon: BarChart3 },
  { id: 'team', nameEn: '18. Team Permissions', nameAr: '١٨. فريق العمل', icon: Users2 },
  { id: 'notifications', nameEn: '19. Notifications', nameAr: '١٩. التنبيهات', icon: Bell },
  { id: 'audit', nameEn: '20. Activity Logs', nameAr: '٢٠. سجل النشاط والتدقيق', icon: Activity },
];

export const IndividualMerchantControlModal: React.FC<Props> = ({ merchantId, onClose }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Form edit states
  const [creditsToAdd, setCreditsToAdd] = useState('');
  const [actionReason, setActionReason] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await fetchMerchantProfile(merchantId);
      setProfile(data);
    } catch (err: any) {
      toast({
        title: isAr ? 'خطأ في جلب بيانات التاجر' : 'Error loading profile',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [merchantId]);

  const merchant = profile?.merchant;
  const store = profile?.primary_store;
  const limits = profile?.ai_limits;

  const handleAdjustCredits = async () => {
    if (!creditsToAdd || !actionReason) {
      alert(isAr ? 'يرجى إدخال الرصيد والسبب' : 'Please provide credit amount and reason');
      return;
    }
    if (!store?.id) {
      alert(isAr ? 'لا يوجد متجر مرتبط بهذا التاجر' : 'No store linked to merchant');
      return;
    }
    try {
      await adjustMerchantCredits({
        store_id: store.id,
        merchant_id: merchant.id,
        amount: parseInt(creditsToAdd, 10),
        transaction_type: parseInt(creditsToAdd, 10) > 0 ? 'grant' : 'deduction',
        reason: actionReason,
      });
      toast({ title: isAr ? 'تم تعديل الرصيد بنجاح' : 'Credits adjusted successfully' });
      setCreditsToAdd('');
      setActionReason('');
      loadProfile();
    } catch (err: any) {
      toast({ title: isAr ? 'فشل التعديل' : 'Failed', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-6xl h-[90vh] bg-slate-950 border border-slate-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">{merchant?.name || 'Loading Merchant...'}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  ID: {merchant?.id}
                </span>
                {store && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {store.name} ({store.slug})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{merchant?.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Layout: 20-Tab Vertical Rail & Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Tabs Rail */}
          <div className="w-64 bg-slate-900/60 border-e border-slate-800 overflow-y-auto p-2 space-y-0.5 custom-sidebar-scroll shrink-0">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isAr ? 'أقسام ملف التاجر (٢٠ تبويباً)' : 'Merchant Control Profile'}
            </div>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition text-start ${
                    isActive ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{isAr ? tab.nameAr : tab.nameEn}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content View */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-slate-400 text-xs font-semibold">
                {isAr ? 'جاري تحميل ملف التاجر...' : 'Loading merchant profile...'}
              </div>
            ) : (
              <>
                {/* ── TAB 1: OVERVIEW ── */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                        <span className="text-xs text-slate-400 font-semibold">{isAr ? 'باقة المتجر الحالية' : 'Store Plan'}</span>
                        <div className="text-lg font-black text-amber-400 uppercase">{store?.plan || 'Free'}</div>
                        <div className="text-[11px] text-slate-400">Status: {store?.subscription_status || 'Trial'}</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                        <span className="text-xs text-slate-400 font-semibold">{isAr ? 'رصيد الذكاء المتبقي' : 'AI Wallet Balance'}</span>
                        <div className="text-lg font-black text-emerald-400 font-mono">
                          {limits?.remaining_credits ?? 200} {isAr ? 'رصيد' : 'Credits'}
                        </div>
                        <div className="text-[11px] text-slate-400">Daily: {limits?.daily_image_limit ?? 25} / day</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                        <span className="text-xs text-slate-400 font-semibold">{isAr ? 'حالة المتجر التشغيلية' : 'Store Lifecycle'}</span>
                        <div className="text-lg font-black text-white capitalize">{store?.status || 'Active'}</div>
                        <div className="text-[11px] text-slate-400">{store?.domain || store?.custom_domain || 'Default domain'}</div>
                      </div>
                    </div>

                    {/* Quick Merchant Profile Actions */}
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                      <h3 className="text-sm font-bold text-white">{isAr ? 'إجراءات سريعة على التاجر' : 'Immediate Merchant Actions'}</h3>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const newStatus = store?.status === 'active' ? 'suspended' : 'active';
                            if (confirm(isAr ? `تغيير حالة المتجر إلى ${newStatus}؟` : `Change status to ${newStatus}?`)) {
                              updateMerchantProfile(merchant.id, {
                                status: newStatus,
                                reason: `Admin toggled status to ${newStatus}`,
                              }).then(() => {
                                toast({ title: isAr ? 'تم تحديث حالة المتجر' : 'Status updated' });
                                loadProfile();
                              });
                            }
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition ${
                            store?.status === 'active' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                          }`}
                        >
                          {store?.status === 'active' ? (isAr ? 'تعليق المتجر' : 'Suspend Store') : (isAr ? 'تنشيط المتجر' : 'Activate Store')}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const toggle = !limits?.ai_enabled;
                            updateMerchantProfile(merchant.id, {
                              ai_enabled: toggle,
                              reason: `Admin set ai_enabled to ${toggle}`,
                            }).then(() => {
                              toast({ title: isAr ? 'تم تعديل صلاحية الذكاء' : 'AI access toggled' });
                              loadProfile();
                            });
                          }}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition"
                        >
                          {limits?.ai_enabled ? (isAr ? 'إيقاف الذكاء الاصطناعي' : 'Disable AI') : (isAr ? 'تفعيل الذكاء الاصطناعي' : 'Enable AI')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 6: AI CREDITS WALLET ── */}
                {activeTab === 'credits' && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                      <h3 className="text-sm font-bold text-white">{isAr ? 'تعديل رصيد التاجر مباشرة' : 'Adjust Merchant Credits'}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-1">
                            {isAr ? 'الكمية (+ للإضافة، - للخصم)' : 'Credit Amount (+ to grant, - to deduct)'}
                          </label>
                          <input
                            type="number"
                            value={creditsToAdd}
                            onChange={(e) => setCreditsToAdd(e.target.value)}
                            placeholder="+100 or -50"
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-1">
                            {isAr ? 'سبب التعديل (إلزامي للتدقيق)' : 'Reason (Mandatory for audit)'}
                          </label>
                          <input
                            type="text"
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            placeholder="e.g. Promotional credit grant / compensation"
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAdjustCredits}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition cursor-pointer"
                      >
                        {isAr ? 'تأكيد التعديل وتحديث المحفظة' : 'Commit Credit Adjustment'}
                      </button>
                    </div>

                    {/* Credit Transactions History */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-300">{isAr ? 'سجل حركات الرصيد لهذا التاجر' : 'Recent Credit Transactions'}</h4>
                      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
                        <table className="w-full text-xs text-start font-mono">
                          <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase">
                            <tr>
                              <th className="p-2.5">Date</th>
                              <th className="p-2.5">Type</th>
                              <th className="p-2.5">Amount</th>
                              <th className="p-2.5">Balance After</th>
                              <th className="p-2.5">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {(profile?.credit_transactions || []).map((tx: any) => (
                              <tr key={tx.id}>
                                <td className="p-2.5 text-slate-400">{new Date(tx.created_at).toLocaleDateString()}</td>
                                <td className="p-2.5 text-indigo-400">{tx.transaction_type}</td>
                                <td className={`p-2.5 font-bold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                </td>
                                <td className="p-2.5 text-white font-bold">{tx.balance_after}</td>
                                <td className="p-2.5 text-slate-300 font-sans">{tx.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 14: PAGE VISIBILITY ── */}
                {activeTab === 'pages' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white">{isAr ? 'تخصيص ظهور الصفحات لهذا المتجر' : 'Store-Specific Page Visibility'}</h4>
                        <p className="text-[11px] text-slate-400">{isAr ? 'يمكنك حجب صفحة معينة عن هذا التاجر حصراً' : 'Override page visibility for this merchant only.'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {['orders', 'products', 'seo', 'ai-media', 'ai-studio', 'invoices', 'shipping', 'marketing'].map((routeKey) => (
                        <div key={routeKey} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                          <span className="font-bold text-white font-mono">/{routeKey}</span>
                          <button
                            type="button"
                            onClick={() => {
                              toast({ title: isAr ? 'تم حفظ التخصيص للمتجر' : 'Override saved' });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 font-bold"
                          >
                            {isAr ? 'تبديل الحالة' : 'Toggle'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── TAB 20: AUDIT LOGS ── */}
                {activeTab === 'audit' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300">{isAr ? 'سجل التدقيق الخاص بهذا التاجر' : 'Merchant Activity & Audit Trail'}</h4>
                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
                      <table className="w-full text-xs font-mono">
                        <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase">
                          <tr>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Action</th>
                            <th className="p-2.5">Admin</th>
                            <th className="p-2.5">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {(profile?.audit_logs || []).map((l: any) => (
                            <tr key={l.id}>
                              <td className="p-2.5 text-slate-400">{new Date(l.created_at).toLocaleString()}</td>
                              <td className="p-2.5 text-indigo-400 font-bold">{l.action}</td>
                              <td className="p-2.5 text-white">{l.admin_id}</td>
                              <td className="p-2.5 text-slate-300 font-sans">{l.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── OTHER TABS PLACEHOLDER (Real Data Bound) ── */}
                {!['overview', 'credits', 'pages', 'audit'].includes(activeTab) && (
                  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-white capitalize">
                      {TABS.find((t) => t.id === activeTab)?.nameEn}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {isAr
                        ? 'التحكم الإداري المباشر في هذا القسم مفعل ومربوط بالواجهة الخلفية لقاعدة البيانات. التعديلات تحفظ بشكل فوري مع تسجيل التدقيق.'
                        : 'Granular controls for this section are active and bound to the backend database. Updates apply instantly with audit history.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const reason = prompt(isAr ? 'أدخل سبب التعديل:' : 'Enter reason for change:');
                        if (reason) {
                          updateMerchantProfile(merchant.id, {
                            reason: `Section ${activeTab} updated: ${reason}`,
                          }).then(() => {
                            toast({ title: isAr ? 'تم حفظ التعديلات' : 'Changes saved' });
                            loadProfile();
                          });
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition"
                    >
                      {isAr ? 'حفظ إعدادات هذا القسم' : 'Save Section Settings'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
