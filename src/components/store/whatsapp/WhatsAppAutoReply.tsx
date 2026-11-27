import React, { useState, useEffect } from 'react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import { useToast } from '../../common/ToastProvider';
import { GlobalModal } from '../../common/GlobalModal';
import type { WhatsAppAutoReplySettings, WhatsAppAutoReplyRule } from '../../../types/whatsapp';
import {
  fetchWhatsAppAutoReply,
  updateWhatsAppAutoReplyApi,
  testWhatsAppAutoReplyApi,
} from '../../../services/whatsappManagerService';
import {
  Bot,
  Zap,
  Sparkles,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Save,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  PhoneCall,
  Loader2,
} from 'lucide-react';

interface Props {
  onNavigateSubView?: (view: string, initialData?: any) => void;
}

export const WhatsAppAutoReply: React.FC<Props> = ({ onNavigateSubView }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { activeStore } = useTenant();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<WhatsAppAutoReplySettings>({
    is_enabled: true,
    welcome_message_ar: '',
    welcome_message_en: '',
    away_message_ar: '',
    away_message_en: '',
    working_hours_enabled: false,
    working_hours_start: '09:00',
    working_hours_end: '22:00',
    ai_smart_reply_enabled: true,
    rules: [],
  });

  // Test Simulator State
  const [testPhone, setTestPhone] = useState('+966501234567');
  const [testMessage, setTestMessage] = useState('كم سعر التوصيل وكيف اطلب؟');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // New Rule Modal
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleKeyword, setRuleKeyword] = useState('');
  const [ruleReply, setRuleReply] = useState('');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const loadSettings = async () => {
    if (!activeStore?.id) return;
    try {
      setLoading(true);
      const data = await fetchWhatsAppAutoReply(activeStore.id);
      setSettings(data);
    } catch (err: any) {
      console.error('Failed to load auto-reply settings:', err);
      toast(isAr ? 'تعذر جلب إعدادات الرد التلقائي' : 'Failed to load auto-reply settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [activeStore?.id]);

  const handleSave = async (updatedSettings = settings) => {
    if (!activeStore?.id) return;
    try {
      setSaving(true);
      await updateWhatsAppAutoReplyApi(activeStore.id, updatedSettings);
      setSettings(updatedSettings);
      toast(
        isAr
          ? 'تم حفظ إعدادات الرد التلقائي بنجاح ✓'
          : 'Auto-reply settings saved successfully ✓',
        'success',
      );
    } catch (err: any) {
      toast(isAr ? 'تعذر حفظ الإعدادات' : 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestAutoReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore?.id) return;
    if (!testPhone.trim() || !testMessage.trim()) {
      toast(isAr ? 'يرجى كتابة رقم الهاتف والرسالة التجريبية' : 'Please provide phone and message', 'error');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      const res = await testWhatsAppAutoReplyApi(activeStore.id, {
        phone_number: testPhone.trim(),
        test_message: testMessage.trim(),
        customer_name: isAr ? 'عميل تجريبي' : 'Test Customer',
      });

      setTestResult(res.data);
      toast(
        isAr
          ? 'تمت معالجة الرد التلقائي وإرساله للرقم الحقيقي بنجاح ✓'
          : 'Auto-reply processed and dispatched to real phone number ✓',
        'success',
      );
    } catch (err: any) {
      toast(isAr ? 'تعذر إرسال الاختبار' : 'Failed to test auto-reply', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveRule = () => {
    if (!ruleKeyword.trim() || !ruleReply.trim()) {
      toast(isAr ? 'يرجى إدخال الكلمة المفتاحية والرد' : 'Please fill keyword and reply', 'error');
      return;
    }

    let updatedRules = [...settings.rules];
    if (editingRuleId) {
      updatedRules = updatedRules.map((r) =>
        r.id === editingRuleId ? { ...r, keyword: ruleKeyword.trim(), reply: ruleReply.trim() } : r,
      );
    } else {
      updatedRules.push({
        id: 'r_' + Date.now(),
        keyword: ruleKeyword.trim(),
        reply: ruleReply.trim(),
      });
    }

    const updated = { ...settings, rules: updatedRules };
    setSettings(updated);
    handleSave(updated);
    setShowRuleModal(false);
    setRuleKeyword('');
    setRuleReply('');
    setEditingRuleId(null);
  };

  const handleDeleteRule = (id: string) => {
    const updated = {
      ...settings,
      rules: settings.rules.filter((r) => r.id !== id),
    };
    setSettings(updated);
    handleSave(updated);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>
          {isAr ? 'جاري تحميل نظام الرد التلقائي على الأرقام...' : 'Loading real auto-reply system...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div
        className="p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)',
          borderColor: 'rgba(16, 185, 129, 0.25)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black" style={{ color: 'var(--text)' }}>
                {isAr ? 'الرد التلقائي الذكي على أرقام واتساب الحقيقية' : 'Smart WhatsApp Auto-Reply for Real Numbers'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                {isAr ? 'مباشر وحقيقي' : 'Live & Real'}
              </span>
            </div>
            <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'يرد تلقائياً على رسائل العملاء الواردة برقم حقيقي، مع دعم الرد الذكي المعتمد على الذكاء الاصطناعي مجاناً.'
                : 'Automatically replies to inbound customer WhatsApp messages on real numbers with free Gemini AI.'}
            </p>
          </div>
        </div>

        {/* Master Switch */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.is_enabled}
              onChange={(e) => {
                const updated = { ...settings, is_enabled: e.target.checked };
                setSettings(updated);
                handleSave(updated);
              }}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
            <span className="text-xs font-bold" style={{ color: 'var(--text)' }}>
              {settings.is_enabled ? (isAr ? 'مفعل' : 'Enabled') : (isAr ? 'معطل' : 'Disabled')}
            </span>
          </label>

          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm"
            style={{ background: 'var(--portal-cta)' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isAr ? 'حفظ الإعدادات' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="p-4 rounded-xl border flex items-center justify-between"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
              {isAr ? 'إجمالي الردود الآلية المرسلة' : 'Total Auto-Replies Dispatched'}
            </p>
            <p className="text-xl font-black mt-1" style={{ color: 'var(--text)' }}>
              {settings.stats?.total_auto_replies_sent ?? 0}
            </p>
          </div>
          <Zap className="w-7 h-7 text-emerald-500 opacity-80" />
        </div>

        <div
          className="p-4 rounded-xl border flex items-center justify-between"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
              {isAr ? 'الرسائل الواردة من العملاء' : 'Inbound Customer Texts'}
            </p>
            <p className="text-xl font-black mt-1" style={{ color: 'var(--text)' }}>
              {settings.stats?.incoming_messages_received ?? 0}
            </p>
          </div>
          <MessageSquare className="w-7 h-7 text-blue-500 opacity-80" />
        </div>

        <div
          className="p-4 rounded-xl border flex items-center justify-between"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>
              {isAr ? 'ردود الذكاء الاصطناعي الذكية' : 'Gemini AI Smart Answers'}
            </p>
            <p className="text-xl font-black mt-1" style={{ color: 'var(--text)' }}>
              {settings.stats?.ai_smart_replies ?? 0}
            </p>
          </div>
          <Sparkles className="w-7 h-7 text-purple-500 opacity-80" />
        </div>
      </div>

      {/* AI Smart Assistant & Core Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: AI Assistant + Welcome Message */}
        <div className="space-y-6">
          {/* AI Smart Auto-Reply Card */}
          <div
            className="p-5 rounded-2xl border space-y-4"
            style={{
              background: 'var(--card)',
              borderColor: settings.ai_smart_reply_enabled ? 'rgba(168, 85, 247, 0.4)' : 'var(--border)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black" style={{ color: 'var(--text)' }}>
                    {isAr ? 'مساعد الذكاء الاصطناعي الذكي (Google Gemini Free API)' : 'AI Smart Customer Agent (Google Gemini Free API)'}
                  </h3>
                  <p className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                    {isAr
                      ? 'يجيب فوراً على أسئلة العملاء المعقدة باللهجة السعودية ويفهم الكتالوج.'
                      : 'Answers complex questions instantly in polite Arabic/English using store context.'}
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.ai_smart_reply_enabled}
                  onChange={(e) => {
                    const updated = { ...settings, ai_smart_reply_enabled: e.target.checked };
                    setSettings(updated);
                    handleSave(updated);
                  }}
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-800 dark:text-purple-200 text-xs font-semibold leading-relaxed border border-purple-200 dark:border-purple-800">
              {isAr
                ? '✓ يعمل مجاناً بالكامل 100% عبر واجهة Google Gemini API الرسمية بدون أي تكاليف إضافية.'
                : '✓ 100% Free Lifetime via official Google Gemini API tier with zero additional platform fees.'}
            </div>
          </div>

          {/* Welcome Message */}
          <div
            className="p-5 rounded-2xl border space-y-4"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Bot className="w-4 h-4 text-emerald-600" />
                {isAr ? 'رسالة الترحيب التلقائية الأولى' : 'Initial Welcome Auto-Reply'}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800" style={{ color: 'var(--muted)' }}>
                {isAr ? 'عند أول تواصل' : 'On First Contact'}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                {isAr ? 'نص الترحيب (بالعربية)' : 'Welcome Message (Arabic)'}
              </label>
              <textarea
                value={settings.welcome_message_ar}
                onChange={(e) => setSettings({ ...settings, welcome_message_ar: e.target.value })}
                rows={3}
                className="w-full text-xs p-3 rounded-xl border focus:outline-none transition-colors"
                style={{
                  background: 'var(--input-bg, transparent)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
                placeholder={isAr ? 'مرحباً بك في متجرنا! شكراً لتواصلك معنا...' : 'Welcome to our store...'}
              />
              <p className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
                {isAr ? 'المتغيرات المتاحة:' : 'Available variables:'}{' '}
                <code className="text-emerald-600 font-bold">&#123;&#123;store_name&#125;&#125;</code>,{' '}
                <code className="text-emerald-600 font-bold">&#123;&#123;customer_name&#125;&#125;</code>,{' '}
                <code className="text-emerald-600 font-bold">&#123;&#123;store_url&#125;&#125;</code>
              </p>
            </div>
          </div>

          {/* Working Hours & Away Message */}
          <div
            className="p-5 rounded-2xl border space-y-4"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-black" style={{ color: 'var(--text)' }}>
                  {isAr ? 'أوقات العمل ورسالة خارج الدوام' : 'Operating Hours & Away Message'}
                </h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.working_hours_enabled}
                  onChange={(e) => setSettings({ ...settings, working_hours_enabled: e.target.checked })}
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.working_hours_enabled && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'بداية الدوام (بتوقيت الرياض)' : 'Start Time (Riyadh)'}
                  </label>
                  <input
                    type="time"
                    value={settings.working_hours_start}
                    onChange={(e) => setSettings({ ...settings, working_hours_start: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border focus:outline-none"
                    style={{ background: 'var(--input-bg, transparent)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'نهاية الدوام (بتوقيت الرياض)' : 'End Time (Riyadh)'}
                  </label>
                  <input
                    type="time"
                    value={settings.working_hours_end}
                    onChange={(e) => setSettings({ ...settings, working_hours_end: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border focus:outline-none"
                    style={{ background: 'var(--input-bg, transparent)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold" style={{ color: 'var(--text)' }}>
                {isAr ? 'رسالة خارج أوقات العمل' : 'Away / Out of Office Message'}
              </label>
              <textarea
                value={settings.away_message_ar}
                onChange={(e) => setSettings({ ...settings, away_message_ar: e.target.value })}
                rows={2}
                className="w-full text-xs p-3 rounded-xl border focus:outline-none"
                style={{ background: 'var(--input-bg, transparent)', borderColor: 'var(--border)', color: 'var(--text)' }}
                placeholder={isAr ? 'شكراً لتواصلك معنا، نحن خارج أوقات العمل حالياً...' : 'We are away...'}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live Number Test Simulator + Keyword Rules */}
        <div className="space-y-6">
          {/* REAL NUMBER LIVE TEST SIMULATOR */}
          <div
            className="p-5 rounded-2xl border space-y-4 shadow-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.02) 100%)',
              borderColor: 'rgba(59, 130, 246, 0.3)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black" style={{ color: 'var(--text)' }}>
                    {isAr ? 'اختبار الرد التلقائي على رقم هاتف حقيقي' : 'Live Real Phone Number Auto-Reply Test'}
                  </h3>
                  <p className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                    {isAr ? 'اكتب رقم جوالك الحقيقي لتجربة استلام الرد التلقائي فوراً' : 'Enter a real phone to test instant automated response'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {isAr ? 'تجربة حية' : 'Live Test'}
              </span>
            </div>

            <form onSubmit={handleTestAutoReply} className="space-y-3">
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'رقم الهاتف الحقيقي (صيغة دولية مع المفتاح)' : 'Real Phone Number (with country code)'}
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+966 50 123 4567"
                  className="w-full text-xs p-2.5 rounded-xl border focus:outline-none font-mono"
                  style={{ background: 'var(--input-bg, transparent)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                  {isAr ? 'رسالة العميل التجريبية' : 'Test Customer Inbound Query'}
                </label>
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder={isAr ? 'كم سعر الشحن للرياض؟' : 'How much is shipping?'}
                  className="w-full text-xs p-2.5 rounded-xl border focus:outline-none"
                  style={{ background: 'var(--input-bg, transparent)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>

              <button
                type="submit"
                disabled={testing}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md"
                style={{ background: '#2563EB' }}
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isAr ? 'إرسال واختبار الرد التلقائي على الرقم' : 'Send & Test Auto-Reply on Real Number'}
              </button>
            </form>

            {/* Test Results Output */}
            {testResult && (
              <div
                className="p-4 rounded-xl border space-y-2 mt-3"
                style={{ background: 'var(--card)', borderColor: 'rgba(16, 185, 129, 0.4)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {isAr ? 'تم إنشاء الرد وتوجيهه بنجاح' : 'Auto-Reply Generated & Routed'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {testResult.matched_keyword || 'RULE_MATCH'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 text-xs font-medium leading-relaxed" style={{ color: 'var(--text)' }}>
                  "{testResult.reply}"
                </div>

                {testResult.direct_url && (
                  <a
                    href={testResult.direct_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 underline mt-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {isAr ? 'فتح المحادثة والرد الآن على واتساب (wa.me)' : 'Open chat on WhatsApp (wa.me)'}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Keyword Triggers Manager */}
          <div
            className="p-5 rounded-2xl border space-y-4"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-black" style={{ color: 'var(--text)' }}>
                  {isAr ? 'قواعد الكلمات المفتاحية التلقائية' : 'Keyword Trigger Rules'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setRuleKeyword('');
                  setRuleReply('');
                  setEditingRuleId(null);
                  setShowRuleModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 transition-colors border border-emerald-200 dark:border-emerald-800"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAr ? 'إضافة قاعدة رد' : 'Add Rule'}
              </button>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {settings.rules.length === 0 ? (
                <p className="text-xs text-center py-6 font-semibold" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'لا توجد قواعد رد مخصصة، سيتم استخدام الرد الترحيبي والذكاء الاصطناعي.' : 'No keyword rules set. AI and welcome replies will be used.'}
                </p>
              ) : (
                settings.rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-3 rounded-xl border flex items-start justify-between gap-3"
                    style={{ borderColor: 'var(--border)', background: 'var(--card-subtle, transparent)' }}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {rule.keyword}
                        </span>
                      </div>
                      <p className="text-xs font-medium line-clamp-2" style={{ color: 'var(--muted)' }}>
                        {rule.reply}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingRuleId(rule.id);
                          setRuleKeyword(rule.keyword);
                          setRuleReply(rule.reply);
                          setShowRuleModal(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                        title={isAr ? 'تعديل' : 'Edit'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/60 text-red-500 transition-colors"
                        title={isAr ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Rule Modal */}
      {showRuleModal && (
        <GlobalModal
          isOpen={showRuleModal}
          onClose={() => setShowRuleModal(false)}
          title={editingRuleId ? (isAr ? 'تعديل قاعدة الرد' : 'Edit Trigger Rule') : (isAr ? 'إضافة قاعدة رد تلقائي جديدة' : 'Add New Auto-Reply Rule')}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                {isAr ? 'الكلمة المفتاحية (مثل: سعر، شحن، توصيل، طلب)' : 'Keyword (e.g. price, shipping, track)'}
              </label>
              <input
                type="text"
                value={ruleKeyword}
                onChange={(e) => setRuleKeyword(e.target.value)}
                placeholder={isAr ? 'سعر' : 'price'}
                className="w-full text-xs p-2.5 rounded-xl border focus:outline-none font-bold"
                style={{ background: 'var(--input-bg, transparent)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text)' }}>
                {isAr ? 'نص الرد التلقائي الذي سيصل للعميل' : 'Auto-Reply Text Sent to Customer'}
              </label>
              <textarea
                value={ruleReply}
                onChange={(e) => setRuleReply(e.target.value)}
                rows={4}
                placeholder={isAr ? 'اكتب الرد التلقائي هنا...' : 'Enter automated response...'}
                className="w-full text-xs p-3 rounded-xl border focus:outline-none"
                style={{ background: 'var(--input-bg, transparent)', borderColor: 'var(--border)', color: 'var(--text)' }}
              />
              <p className="text-[10px] font-semibold mt-1" style={{ color: 'var(--muted)' }}>
                {isAr ? 'يدعم المتغيرات:' : 'Supports:'} <code className="text-emerald-600 font-bold">&#123;&#123;store_url&#125;&#125;</code>, <code className="text-emerald-600 font-bold">&#123;&#123;store_name&#125;&#125;</code>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRuleModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveRule}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm"
                style={{ background: 'var(--portal-cta)' }}
              >
                {isAr ? 'حفظ القاعدة' : 'Save Rule'}
              </button>
            </div>
          </div>
        </GlobalModal>
      )}
    </div>
  );
};
