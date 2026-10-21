import React, { useState, useEffect } from 'react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import { useToast } from '../../common/ToastProvider';
import type { WhatsAppSettingsData, WhatsAppMessageItem } from '../../../types/whatsapp';
import {
  fetchWhatsAppSettings,
  updateWhatsAppSettingsApi,
  testWhatsAppConnectionApi,
  fetchWhatsAppLogs,
} from '../../../services/whatsappManagerService';
import { readStoreIdentity, writeStoreIdentity } from '../../../themes/settings/storeIdentity';
import {
  Settings,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Phone,
  Webhook,
  FileText,
  Clock,
  Layers,
  ShieldCheck,
  Copy,
  Check,
  Eye,
  EyeOff,
  Edit,
  Plus,
  MoreVertical,
  ExternalLink,
  Save,
  Globe,
  Sliders,
  Bell,
  MessageSquare,
  ArrowRight,
  Send,
  Building,
  X,
  Key,
  Mail,
  Sparkles,
} from 'lucide-react';

interface Props {
  onNavigateSubView: (view: string) => void;
}

export const WhatsAppSettingsLogs: React.FC<Props> = ({ onNavigateSubView }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { activeStore, updateStoreInfo } = useTenant();
  const { toast } = useToast();

  const storeIdentity = readStoreIdentity(activeStore?.id || '', activeStore);
  const [centralPhone, setCentralPhone] = useState(
    storeIdentity.whatsapp || storeIdentity.phone || activeStore?.phone || '+966 50 123 4567'
  );
  const [centralEmail, setCentralEmail] = useState(
    storeIdentity.email || activeStore?.ownerEmail || `contact@${activeStore?.slug || 'store'}.com`
  );

  // Top Tabs
  const [activeTab, setActiveTab] = useState<
    'api' | 'phones' | 'webhooks' | 'message_logs' | 'error_logs' | 'usage' | 'team'
  >('api');

  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [credsForm, setCredsForm] = useState({
    business_id: '',
    phone_number_id: '',
    waba_id: '',
    access_token: '',
    business_name: '',
  });

  // Settings State
  const [settings, setSettings] = useState<WhatsAppSettingsData>({
    is_connected: true,
    business_name: activeStore?.name || 'My Store',
    business_id: '123456789012345',
    phone_number_id: '123456789012345',
    waba_id: '987654321098765',
    access_token: 'EAABwzLixnjYBAOd6...',
    phone_numbers: [
      {
        phone: centralPhone,
        display_name: activeStore?.name || 'My Store',
        quality_rating: 'GREEN',
        is_primary: true,
        status: 'ACTIVE',
        last_synced: 'Oct 14, 2026, 10:42 AM',
      },
    ],
    webhook_url: 'https://yourstore.com/api/whatsapp/webhook',
    verify_token: 'unityteck_wa_verify_2026',
    webhook_events: {
      messages: true,
      message_status: true,
      template_status: true,
      reaction_updates: false,
      phone_number_updates: true,
    },
    business_profile: {
      category: 'Shopping & Retail',
      address: 'Riyadh, Saudi Arabia',
      website: activeStore?.custom_domain ? `https://${activeStore.custom_domain}` : 'https://mystore.com',
      description: `Official Storefront for ${activeStore?.name || 'Store'}`,
    },
    message_settings: {
      default_window: '24 hours',
      timezone: '(GMT+3) Riyadh',
      business_display_name: activeStore?.name || 'My Store',
      default_language: isAr ? 'Arabic (ar_SA)' : 'English (US)',
      fallback_number: centralPhone,
      enable_read_receipts: true,
      auto_retry_failed: true,
      notify_on_errors: true,
    },
  });

  // Recent Message Logs & Error Logs from API
  const [recentLogs, setRecentLogs] = useState<WhatsAppMessageItem[]>([]);
  const [errorLogs, setErrorLogs] = useState<WhatsAppMessageItem[]>([]);

  // Load real settings & logs
  useEffect(() => {
    if (!activeStore?.id) return;
    const freshIdent = readStoreIdentity(activeStore.id, activeStore);
    if (freshIdent.whatsapp || freshIdent.phone) {
      setCentralPhone(freshIdent.whatsapp || freshIdent.phone);
    }
    if (freshIdent.email) {
      setCentralEmail(freshIdent.email);
    }
    const load = async () => {
      try {
        setLoading(true);
        const [settingsData, logsData] = await Promise.all([
          fetchWhatsAppSettings(activeStore.id),
          fetchWhatsAppLogs(activeStore.id),
        ]);
        if (settingsData) {
          setSettings((prev) => ({ ...prev, ...settingsData }));
          if (settingsData.phone_numbers?.[0]?.phone) {
            setCentralPhone(settingsData.phone_numbers[0].phone);
          }
        }
        if (logsData) {
          setRecentLogs(logsData.recent_logs || []);
          setErrorLogs(logsData.error_logs || []);
        }
      } catch (err) {
        console.error('Failed to load settings & logs:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeStore?.id]);

  // Test Connection
  const handleTestConnection = async () => {
    if (!activeStore?.id) return;
    try {
      setTesting(true);
      const res = await testWhatsAppConnectionApi(activeStore.id);
      toast(isAr ? 'تم التحقق من اتصال WhatsApp Business API بنجاح ✓' : res.message, 'success');
    } catch (err: any) {
      toast(err.message || (isAr ? 'فشل فحص الاتصال' : 'Connection test failed'), 'error');
    } finally {
      setTesting(false);
    }
  };

  // Save Settings & Synchronize Central Communication Hub
  const handleSaveSettings = async () => {
    if (!activeStore?.id) return;
    try {
      setSaving(true);
      const updatedPhoneNumbers = (settings.phone_numbers && settings.phone_numbers.length > 0)
        ? settings.phone_numbers.map((p, idx) =>
            idx === 0
              ? { ...p, phone: centralPhone, display_name: activeStore.name || p.display_name }
              : p
          )
        : [
            {
              phone: centralPhone,
              display_name: activeStore.name || 'Store Official',
              quality_rating: 'GREEN',
              is_primary: true,
              status: 'ACTIVE',
              last_synced: new Date().toLocaleDateString(),
            },
          ];

      const nextSettings: WhatsAppSettingsData = {
        ...settings,
        business_name: activeStore.name || settings.business_name,
        phone_numbers: updatedPhoneNumbers,
      };

      await updateWhatsAppSettingsApi(activeStore.id, nextSettings);

      // Persist to Central Store Identity
      const freshIdentity = readStoreIdentity(activeStore.id, activeStore);
      writeStoreIdentity(activeStore.id, {
        ...freshIdentity,
        whatsapp: centralPhone,
        phone: centralPhone,
        email: centralEmail,
        updatedAt: new Date().toISOString(),
      });

      if (updateStoreInfo) {
        await updateStoreInfo(activeStore.id, {
          ownerEmail: centralEmail,
          phone: centralPhone,
        });
      }

      window.dispatchEvent(new CustomEvent('unityteck-store-updated'));
      window.dispatchEvent(new CustomEvent('unityteck-theme-identity'));
      setSettings(nextSettings);
      toast(
        isAr
          ? 'تم حفظ وتوحيد رقم الواتساب والبريد الإلكتروني في المركز الموحد بنجاح ✓'
          : 'Central WhatsApp number & Support Email saved and unified across the SaaS ✓',
        'success'
      );
    } catch (err: any) {
      toast(err.message || (isAr ? 'فشل حفظ الإعدادات' : 'Failed to save settings'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // Save Meta API Credentials from modal
  const handleSaveCreds = async () => {
    if (!activeStore?.id) return;
    try {
      setSaving(true);
      const nextSettings = {
        ...settings,
        business_id: credsForm.business_id.trim(),
        phone_number_id: credsForm.phone_number_id.trim(),
        waba_id: credsForm.waba_id.trim(),
        access_token: credsForm.access_token.trim(),
        business_name: credsForm.business_name.trim() || settings.business_name,
        is_connected: Boolean(credsForm.access_token.trim() && credsForm.phone_number_id.trim()),
      };
      setSettings(nextSettings);
      await updateWhatsAppSettingsApi(activeStore.id, nextSettings);
      setShowCredsModal(false);
      toast(isAr ? 'تم حفظ بيانات Meta API بنجاح ✓' : 'Meta API credentials saved successfully ✓', 'success');
      // Proactively test connection
      setTesting(true);
      try {
        const res = await testWhatsAppConnectionApi(activeStore.id);
        toast(res.message, res.success ? 'success' : 'info');
      } catch (e: any) {
        console.error(e);
      } finally {
        setTesting(false);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to save credentials', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast(isAr ? 'تم النسخ' : 'Copied to clipboard', 'info');
  };

  return (
    <div className="w-full space-y-6 pb-12 font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm border border-emerald-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'الإعدادات وسجلات النظام' : 'Settings & Logs'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'إدارة ربط WhatsApp Business API، تكوين إعدادات المراسلة، ومراقبة سجلات الرسائل والأخطاء.'
                : 'Manage your WhatsApp Business API connection, configure settings, and monitor message logs.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => toast(isAr ? 'دليل إعدادات وسجلات الواتساب' : 'WhatsApp Settings Guide', 'info')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <HelpCircle className="w-4 h-4 text-sky-500" />
          <span>{isAr ? 'دليل المساعدة' : 'Help Guide'}</span>
        </button>
      </div>

      {/* 2. Top Sub-Tabs (Matching Reference Image 1) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'api', labelAr: 'تكوين API', labelEn: 'API Configuration' },
          { id: 'phones', labelAr: 'أرقام الهواتف', labelEn: 'Phone Numbers' },
          { id: 'webhooks', labelAr: 'الويبهوك', labelEn: 'Webhooks' },
          { id: 'message_logs', labelAr: 'سجلات الرسائل', labelEn: 'Message Logs' },
          { id: 'error_logs', labelAr: 'سجلات الأخطاء', labelEn: 'Error Logs' },
          { id: 'usage', labelAr: 'الاستخدام والفوترة', labelEn: 'Usage & Billing' },
          { id: 'team', labelAr: 'صلاحيات الفريق', labelEn: 'Team Access' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isAr ? tab.labelAr : tab.labelEn}
          </button>
        ))}
      </div>

      {/* CENTRAL COMMUNICATION & NOTIFICATION HUB (Unified Single Number & Email) */}
      <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent dark:from-emerald-950/20 dark:via-teal-950/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {isAr ? 'المركز الموحد للواتساب والبريد الإلكتروني' : 'Central WhatsApp & Email Communication Hub'}
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  {isAr ? 'مربوط وشامل' : 'Live Unified Sync'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'رقم واحد وبريد إلكتروني واحد يعملان كمركز تحكم رئيسي: يتم تغذية الردود اليدوية، الردود الآلية، إشعارات الطلبات، وأيقونة الواتساب في واجهة المتجر تلقائياً.'
                  : 'One single phone number and email power all modules: manual chat replies, automations, order notifications, storefront contact button, and transactional alerts.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md transition-all self-start sm:self-auto cursor-pointer shrink-0 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isAr ? 'حفظ وتوحيد المركز' : 'Save & Sync Hub'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Central Phone */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isAr ? 'رقم الواتساب المركزي الموحد' : 'Central WhatsApp Number'}</span>
              </label>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                {isAr ? 'مفعل للردود والآلي' : 'Active for Chat & Automations'}
              </span>
            </div>
            <input
              type="text"
              value={centralPhone}
              onChange={(e) => setCentralPhone(e.target.value)}
              placeholder="+966 50 123 4567"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:border-emerald-500 outline-none"
              dir="ltr"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {isAr
                ? '• يُستخدم في: إرسال الرسائل، الرد الآلي، تنبيهات السلات المتروكة، وزر التواصل في المتجر.'
                : '• Powers: Outbound messages, auto-replies, abandoned cart alerts, and storefront floating button.'}
            </p>
          </div>

          {/* Central Support Email */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{isAr ? 'البريد الإلكتروني المركزي للمتجر' : 'Central Support & Order Email'}</span>
              </label>
              <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md">
                {isAr ? 'مفعل للإشعارات والفواتير' : 'Active for Notifications & Invoices'}
              </span>
            </div>
            <input
              type="email"
              value={centralEmail}
              onChange={(e) => setCentralEmail(e.target.value)}
              placeholder="support@yourstore.sa"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:border-teal-500 outline-none"
              dir="ltr"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {isAr
                ? '• يُستخدم في: إشعارات الطلبات الجديدة، فواتير المشتريات، رسائل الدعم الفني، وتقرير Google SEO.'
                : '• Powers: New order receipts, tax invoices, customer support tickets, and Google SEO reporting.'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Top Row Cards: Connection Status, Business Account, Message Limits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Connection Status */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              {isAr ? 'حالة الاتصال' : 'Connection Status'}
            </h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {settings.is_connected ? (isAr ? 'متصل' : 'Connected') : (isAr ? 'غير متصل' : 'Disconnected')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Meta Cloud Business API
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={testing}
                onClick={handleTestConnection}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {testing ? (isAr ? 'جارِ الفحص...' : 'Testing...') : (isAr ? 'فحص الاتصال' : 'Test Connection')}
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            {isAr ? 'آخر مزامنة:' : 'Last synced:'} Oct 14, 2026, 10:42 AM
          </div>
        </div>

        {/* Card 2: Business Account */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              {isAr ? 'حساب الأعمال' : 'Business Account'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setCredsForm({
                  business_id: settings.business_id || '',
                  phone_number_id: settings.phone_number_id || '',
                  waba_id: settings.waba_id || '',
                  access_token: settings.access_token || '',
                  business_name: settings.business_name || '',
                });
                setShowCredsModal(true);
              }}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Edit className="w-3 h-3" />
              <span>{isAr ? 'تعديل البيانات' : 'Edit Credentials'}</span>
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">{isAr ? 'اسم النشاط التجاري' : 'Business Name'}</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">{settings.business_name}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">{isAr ? 'معرف النشاط (Business ID)' : 'Business ID'}</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{settings.business_id}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">{isAr ? 'معرف رقم الهاتف' : 'Phone Number ID'}</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{settings.phone_number_id}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">{isAr ? 'معرف الحساب (WABA ID)' : 'WABA ID'}</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{settings.waba_id}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Message Limits */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-slate-800">
            {isAr ? 'حدود الرسائل' : 'Message Limits'}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Daily Limit */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{isAr ? 'الحد اليومي' : 'Daily Limit'}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-slate-900 dark:text-white">8 / 20</span>
                <span className="text-[10px] text-slate-400">messages</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '40%' }} />
              </div>
              <span className="text-[10px] text-slate-400 block">40% • Resets 12:00 AM</span>
            </div>

            {/* Monthly Usage */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{isAr ? 'الاستخدام الشهري' : 'Monthly Usage'}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-slate-900 dark:text-white">1,248 / 6,000</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full" style={{ width: '21%' }} />
              </div>
              <span className="text-[10px] text-slate-400 block">21% • Renews Nov 1</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Middle Row: Phone Numbers, Webhook Config, Business Profile, Message Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Phone Numbers & Business Profile Column */}
        <div className="space-y-5">
          {/* Phone Numbers */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                {isAr ? 'أرقام الهواتف (1)' : 'Phone Numbers (1)'}
              </h3>
              <button
                type="button"
                onClick={() => toast(isAr ? 'نافذة ربط رقم هاتف جديد' : 'Add phone number modal', 'info')}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <Plus className="w-3 h-3" />
                <span>{isAr ? 'إضافة رقم' : 'Add Phone Number'}</span>
              </button>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white dir-ltr">
                      +966 512 345 678
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      Primary
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Active • Synced 10:42 AM</span>
                  </div>
                </div>
              </div>
              <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />
            </div>
          </div>

          {/* Business Profile */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                {isAr ? 'الملف التعريفي للنشاط' : 'Business Profile'}
              </h3>
              <button
                type="button"
                onClick={() => toast(isAr ? 'تعديل الملف التعريفي' : 'Edit Business Profile', 'info')}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {isAr ? 'تعديل' : 'Edit'}
              </button>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 flex items-center justify-center text-xl shrink-0">
                🌸
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white">{settings.business_name}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  <strong>{isAr ? 'الفئة:' : 'Category:'}</strong> {settings.business_profile.category}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  <strong>{isAr ? 'العنوان:' : 'Address:'}</strong> {settings.business_profile.address}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  <strong>{isAr ? 'الموقع:' : 'Website:'}</strong> {settings.business_profile.website}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  <strong>{isAr ? 'الوصف:' : 'Description:'}</strong> {settings.business_profile.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Webhook Configuration Column */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              {isAr ? 'تكوين الويبهوك (Webhook Configuration)' : 'Webhook Configuration'}
            </h3>
            <button
              type="button"
              onClick={() => toast(isAr ? 'تعديل رابط الويبهوك' : 'Edit Webhook', 'info')}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {isAr ? 'تعديل' : 'Edit'}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <label className="text-slate-500 dark:text-slate-400 font-semibold block">Webhook URL</label>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-200 truncate flex-1 dir-ltr text-start">
                {settings.webhook_url}
              </span>
              <button type="button" onClick={() => handleCopy(settings.webhook_url)} className="text-slate-400 hover:text-slate-600">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="text-slate-500 dark:text-slate-400 font-semibold block">Verify Token</label>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-200 truncate flex-1">
                {showToken ? settings.verify_token : '••••••••••••••••••••'}
              </span>
              <button type="button" onClick={() => setShowToken(!showToken)} className="text-slate-400 hover:text-slate-600">
                {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button type="button" onClick={() => handleCopy(settings.verify_token)} className="text-slate-400 hover:text-slate-600">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Webhook Events Toggles */}
          <div className="space-y-2 pt-1">
            <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Webhook Events</h4>
            {[
              { key: 'messages', label: 'Messages (Incoming & Status)' },
              { key: 'message_status', label: 'Message Status Updates' },
              { key: 'template_status', label: 'Template Status Updates' },
              { key: 'reaction_updates', label: 'Reaction Updates' },
              { key: 'phone_number_updates', label: 'Phone Number Updates' },
            ].map((evt) => (
              <label key={evt.key} className="flex items-center justify-between text-xs cursor-pointer py-0.5">
                <span className="text-slate-600 dark:text-slate-300">{evt.label}</span>
                <input
                  type="checkbox"
                  checked={(settings.webhook_events as any)[evt.key]}
                  onChange={(e) => {
                    const next = { ...settings.webhook_events, [evt.key]: e.target.checked };
                    setSettings({ ...settings, webhook_events: next });
                  }}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Message Settings Column */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              {isAr ? 'إعدادات الرسائل (Message Settings)' : 'Message Settings'}
            </h3>
            <button
              type="button"
              onClick={handleSaveSettings}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {saving ? 'Saving...' : isAr ? 'حفظ' : 'Save'}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Default Message Window</span>
              <span className="font-semibold text-slate-900 dark:text-white">{settings.message_settings.default_window}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Time Zone</span>
              <span className="font-semibold text-slate-900 dark:text-white">{settings.message_settings.timezone}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Business Display Name</span>
              <span className="font-semibold text-slate-900 dark:text-white">{settings.message_settings.business_display_name}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Default Language</span>
              <span className="font-semibold text-slate-900 dark:text-white">{settings.message_settings.default_language}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Fallback Number</span>
              <span className="font-mono text-slate-900 dark:text-white">{settings.message_settings.fallback_number}</span>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2">
              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-slate-600 dark:text-slate-300">Enable Read Receipts</span>
                <input
                  type="checkbox"
                  checked={settings.message_settings.enable_read_receipts}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      message_settings: {
                        ...settings.message_settings,
                        enable_read_receipts: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-slate-600 dark:text-slate-300">Auto-retry Failed Messages</span>
                <input
                  type="checkbox"
                  checked={settings.message_settings.auto_retry_failed}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      message_settings: {
                        ...settings.message_settings,
                        auto_retry_failed: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-slate-600 dark:text-slate-300">Notify on Errors</span>
                <input
                  type="checkbox"
                  checked={settings.message_settings.notify_on_errors}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      message_settings: {
                        ...settings.message_settings,
                        notify_on_errors: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Row: Recent Message Logs & Error Logs Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Recent Message Logs */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              {isAr ? 'سجلات الرسائل الحديثة (Recent Message Logs)' : 'Recent Message Logs'}
            </h3>
            <button
              type="button"
              onClick={() => onNavigateSubView('center')}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              View all
            </button>
          </div>

          {recentLogs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              {isAr ? 'لا توجد سجلات رسائل حديثة' : 'No message logs found'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                    <th className="py-2 text-start font-semibold">Time</th>
                    <th className="py-2 text-start font-semibold">Direction</th>
                    <th className="py-2 text-start font-semibold">Phone Number</th>
                    <th className="py-2 text-start font-semibold">Message Type</th>
                    <th className="py-2 text-start font-semibold">Status</th>
                    <th className="py-2 text-start font-semibold">Error Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {log.direction}
                        </span>
                      </td>
                      <td className="py-2 font-mono text-slate-700 dark:text-slate-300 dir-ltr text-start whitespace-nowrap">
                        {log.phone_number}
                      </td>
                      <td className="py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {log.message_type}
                      </td>
                      <td className="py-2 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            log.status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : log.status === 'sent'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2 text-slate-400 truncate max-w-[120px]">
                        {log.error_message || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Error Logs */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              {isAr ? 'سجلات الأخطاء (Error Logs)' : 'Error Logs'}
            </h3>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">
              View all
            </span>
          </div>

          {errorLogs.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1 opacity-70" />
              <p className="text-xs font-semibold">{isAr ? 'لا توجد أخطاء مسجلة حالياً' : 'Zero system errors recorded'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                    <th className="py-2 text-start font-semibold">Time</th>
                    <th className="py-2 text-start font-semibold">Phone Number</th>
                    <th className="py-2 text-start font-semibold">Error Code</th>
                    <th className="py-2 text-start font-semibold">Error Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {errorLogs.map((err) => (
                    <tr key={err.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(err.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2 font-mono text-slate-700 dark:text-slate-300 dir-ltr text-start whitespace-nowrap">
                        {err.phone_number}
                      </td>
                      <td className="py-2 font-mono text-rose-600 font-bold whitespace-nowrap">
                        {err.error_code || '131000'}
                      </td>
                      <td className="py-2 text-rose-600 truncate max-w-[160px]">
                        {err.error_message || 'Template not approved'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Meta API Credentials Modal */}
      {showCredsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? 'ربط حساب Meta WhatsApp Business API' : 'Connect Meta WhatsApp Business API'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'أدخل بياناتك من Meta for Developers لبدء الإرسال الفعلي'
                      : 'Enter credentials from Meta for Developers to enable live sending'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCredsModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Free Tier Guide Alert */}
              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-sky-900 dark:text-sky-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <ExternalLink className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>{isAr ? 'مجاني 100% من Meta' : '100% Free with Meta Developers'}</span>
                </div>
                <p className="text-[11px] text-sky-800 dark:text-sky-300 leading-relaxed">
                  {isAr
                    ? 'توفر Meta باقة مجانية تتضمن 1000 محادثة شهرياً مجاناً ورقم اختبار تجريبي. يمكنك استخراج هذه المفاتيح في دقيقتين عبر '
                    : 'Meta offers 1,000 free conversations per month and a free sandbox test phone. Get these keys from '}
                  <a
                    href="https://developers.facebook.com/apps"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline text-emerald-600 dark:text-emerald-400"
                  >
                    developers.facebook.com
                  </a>
                </p>
              </div>

              {/* Phone Number ID */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                  {isAr ? 'معرف رقم الهاتف (Phone Number ID) *' : 'Phone Number ID *'}
                </label>
                <input
                  type="text"
                  value={credsForm.phone_number_id}
                  onChange={(e) => setCredsForm({ ...credsForm, phone_number_id: e.target.value })}
                  placeholder="e.g. 109283746501928"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              {/* WABA ID */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                  {isAr ? 'معرف حساب واتساب للأعمال (WABA ID)' : 'WhatsApp Business Account ID (WABA ID)'}
                </label>
                <input
                  type="text"
                  value={credsForm.waba_id}
                  onChange={(e) => setCredsForm({ ...credsForm, waba_id: e.target.value })}
                  placeholder="e.g. 908172635481920"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              {/* Access Token */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                  {isAr ? 'رمز الوصول (Permanent / Temporary Access Token) *' : 'Access Token (System User / Temporary) *'}
                </label>
                <textarea
                  rows={3}
                  value={credsForm.access_token}
                  onChange={(e) => setCredsForm({ ...credsForm, access_token: e.target.value })}
                  placeholder="e.g. EAABwzLixnjYBA..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              {/* Business Name */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                  {isAr ? 'اسم المتجر / النشاط' : 'Business Display Name'}
                </label>
                <input
                  type="text"
                  value={credsForm.business_name}
                  onChange={(e) => setCredsForm({ ...credsForm, business_name: e.target.value })}
                  placeholder={activeStore?.name || 'My Store Official'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={() => setShowCredsModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveCreds}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? (isAr ? 'جارِ الحفظ...' : 'Saving...') : (isAr ? 'حفظ والتحقق من الاتصال' : 'Save & Verify Connection')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
