import React, { useState, useEffect, useMemo } from 'react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import { useToast } from '../../common/ToastProvider';
import type { WhatsAppAutomationItem } from '../../../types/whatsapp';
import {
  fetchWhatsAppAutomations,
  updateWhatsAppAutomationsApi,
  sendWhatsAppMessageApi,
} from '../../../services/whatsappManagerService';
import {
  Zap,
  HelpCircle,
  Play,
  Pause,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Truck,
  RotateCcw,
  Sparkles,
  CreditCard,
  MessageSquare,
  Search,
  Filter,
  Plus,
  Edit2,
  X,
  Save,
  Check,
} from 'lucide-react';

interface Props {
  onNavigateSubView: (view: string, initialData?: any) => void;
}

export const WhatsAppAutomations: React.FC<Props> = ({ onNavigateSubView }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { activeStore } = useTenant();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [automations, setAutomations] = useState<WhatsAppAutomationItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  // Edit Automation Modal
  const [editingItem, setEditingItem] = useState<WhatsAppAutomationItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Test send modal
  const [testModalItem, setTestModalItem] = useState<WhatsAppAutomationItem | null>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState('+9665');
  const [sendingTest, setSendingTest] = useState(false);

  // Load real automations for active store
  const loadAutomations = async () => {
    if (!activeStore?.id) return;
    try {
      setLoading(true);
      const data = await fetchWhatsAppAutomations(activeStore.id);
      setAutomations(data);
    } catch (err: any) {
      console.error('Failed to load automations:', err);
      toast(isAr ? 'تعذر جلب إعدادات الأتمتة' : 'Failed to load automations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAutomations();
  }, [activeStore?.id]);

  // Toggle active/inactive state and persist
  const handleToggleActive = async (id: string, currentState: boolean) => {
    if (!activeStore?.id) return;
    const updated = automations.map((a) =>
      a.id === id ? { ...a, is_active: !currentState } : a,
    );
    setAutomations(updated);
    setSavingId(id);

    try {
      await updateWhatsAppAutomationsApi(activeStore.id, updated);
      toast(
        isAr
          ? !currentState
            ? 'تم تفعيل مسار الأتمتة بنجاح ✓'
            : 'تم إيقاف مسار الأتمتة مؤقتاً'
          : !currentState
          ? 'Automation activated successfully ✓'
          : 'Automation paused',
        'success',
      );
    } catch (err) {
      toast(isAr ? 'تعذر حفظ التغيير' : 'Failed to save automation', 'error');
      // Rollback
      setAutomations(automations);
    } finally {
      setSavingId(null);
    }
  };

  // Change delay minutes
  const handleDelayChange = async (id: string, newDelay: number) => {
    if (!activeStore?.id) return;
    const updated = automations.map((a) =>
      a.id === id ? { ...a, delay_minutes: newDelay } : a,
    );
    setAutomations(updated);

    try {
      await updateWhatsAppAutomationsApi(activeStore.id, updated);
      toast(isAr ? 'تم تحديث توقيت الإرسال' : 'Delay updated', 'info');
    } catch (err) {
      toast(isAr ? 'تعذر حفظ التغيير' : 'Failed to update delay', 'error');
    }
  };

  // Save Modal Edits
  const handleSaveModal = async () => {
    if (!activeStore?.id || !editingItem) return;
    const updated = automations.map((a) => (a.id === editingItem.id ? editingItem : a));
    setAutomations(updated);
    setShowEditModal(false);

    try {
      await updateWhatsAppAutomationsApi(activeStore.id, updated);
      toast(isAr ? 'تم حفظ تفاصيل الأتمتة ✓' : 'Automation updated successfully ✓', 'success');
    } catch (err) {
      toast(isAr ? 'تعذر الحفظ' : 'Failed to save', 'error');
    }
  };

  // Test Trigger Send
  const handleSendTestTrigger = async () => {
    if (!activeStore?.id || !testModalItem) return;
    if (!testPhoneNumber || testPhoneNumber.trim().length < 8) {
      toast(isAr ? 'يرجى إدخال رقم هاتف صالح' : 'Please provide a valid phone number', 'error');
      return;
    }

    try {
      setSendingTest(true);
      await sendWhatsAppMessageApi(activeStore.id, {
        phone_number: testPhoneNumber.trim(),
        customer_name: isAr ? 'عميل تجريبي' : 'Test Customer',
        order_number: '10284',
        message_content: `[TEST TRIGGER - ${testModalItem.name}]\nHello from ${activeStore.name}! This is a verified test of automated workflow: ${testModalItem.trigger_event}`,
        message_type: testModalItem.name,
        category: 'order',
        template_name: testModalItem.template_id,
        agent_name: 'Automation Bot',
        agent_initials: 'BOT',
      });

      toast(
        isAr ? 'تم إرسال رسالة الاختبار بنجاح ✓' : 'Test automation message sent successfully ✓',
        'success',
      );
      setTestModalItem(null);
    } catch (err: any) {
      toast(err.message || 'Failed to send test message', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  // KPI Calculations
  const totalCount = automations.length;
  const activeCount = automations.filter((a) => a.is_active).length;
  const totalTriggered = automations.reduce((acc, curr) => acc + (curr.total_triggered || 0), 0);
  const avgDelivery =
    automations.length > 0
      ? Math.round(
          automations.reduce((acc, curr) => acc + (curr.delivery_rate || 100), 0) /
            automations.length,
        )
      : 100;

  // Filtered List
  const filteredAutomations = useMemo(() => {
    return automations.filter((item) => {
      const matchCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name_ar.includes(searchQuery) ||
        item.trigger_event.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [automations, activeCategory, searchQuery]);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'order':
        return <ShoppingBag className="w-5 h-5 text-emerald-500" />;
      case 'shipping':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'delivery':
        return <CheckCircle2 className="w-5 h-5 text-teal-500" />;
      case 'cart':
        return <Sparkles className="w-5 h-5 text-purple-500" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-amber-500" />;
      default:
        return <Zap className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm border border-emerald-500/20">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'أتمتة رسائل الواتساب' : 'WhatsApp Automations'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'إعداد مسارات العمل التلقائية للتأكيد، التتبع، استعادة السلات المتروكة، وتحديثات الدفع والتوصيل.'
                : 'Automated triggers, drip campaigns, and scheduled transactional workflows for your store.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onNavigateSubView('center')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            ← {isAr ? 'مركز الرسائل' : 'Message Center'}
          </button>

          <button
            type="button"
            onClick={() =>
              toast(
                isAr
                  ? 'دليل استخدام مشغلات الأتمتة المعتمدة مع واتساب للأعمال'
                  : 'WhatsApp Business API automation triggers documentation',
                'info',
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <HelpCircle className="w-4 h-4 text-sky-500" />
            <span>{isAr ? 'دليل المساعدة' : 'Help Guide'}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isAr ? 'إجمالي مسارات الأتمتة' : 'Total Automations'}
          </span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {totalCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'قوالب تشغيل جاهزة' : 'Configured workflows'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isAr ? 'المسارات النشطة' : 'Active Automations'}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </span>
            <span className="text-xs text-slate-400">/ {totalCount}</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {isAr ? 'تعمل تلقائياً فور الحدث' : 'Live event triggers'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isAr ? 'إجمالي الرسائل المُرسلة' : 'Total Messages Triggered'}
          </span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {totalTriggered.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'عبر متجركم الحالي' : 'Store-scoped executions'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isAr ? 'معدل نجاح التسليم' : 'Delivery Rate'}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {avgDelivery}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'مطابق لسياسات Meta' : 'Meta API standard'}
          </p>
        </div>
      </div>

      {/* 3. Category Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', labelAr: 'كافة المسارات', labelEn: 'All Triggers' },
            { id: 'order', labelAr: 'الطلبات', labelEn: 'Orders' },
            { id: 'shipping', labelAr: 'الشحن والتتبع', labelEn: 'Shipping' },
            { id: 'delivery', labelAr: 'التوصيل', labelEn: 'Delivery' },
            { id: 'cart', labelAr: 'السلات المتروكة', labelEn: 'Abandoned Cart' },
            { id: 'payment', labelAr: 'المدفوعات', labelEn: 'Payments' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {isAr ? cat.labelAr : cat.labelEn}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث في مشغلات الأتمتة...' : 'Search automations...'}
            className="w-full ps-8 pe-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* 4. Automations Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RotateCcw className="w-6 h-6 animate-spin text-emerald-500" />
          <span className="text-xs font-medium">
            {isAr ? 'جارِ تحميل مسارات الأتمتة...' : 'Loading automations...'}
          </span>
        </div>
      ) : filteredAutomations.length === 0 ? (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <Zap className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {isAr ? 'لا توجد مسارات أتمتة مطابقة' : 'No automations found'}
          </h3>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'جرّب تعديل مصطلحات البحث أو تصفية الفئات.'
              : 'Try adjusting your search query or category filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAutomations.map((item) => {
            const isSaving = savingId === item.id;
            return (
              <div
                key={item.id}
                className={`rounded-xl border transition-all p-4 bg-white dark:bg-slate-900 flex flex-col justify-between shadow-sm ${
                  item.is_active
                    ? 'border-emerald-200 dark:border-emerald-800/80 hover:shadow-md'
                    : 'border-slate-200 dark:border-slate-800 opacity-80'
                }`}
              >
                <div>
                  {/* Top Bar: Icon, Title, and Active Switch */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {isAr ? item.name_ar : item.name}
                        </h3>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {/* Active Toggle Switch */}
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleToggleActive(item.id, item.is_active)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        item.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          item.is_active ? (isAr ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                    {isAr ? item.description_ar : item.description}
                  </p>

                  {/* Trigger Detail Box */}
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                      <span className="font-semibold">{isAr ? 'الحدث المُشغل:' : 'Trigger Event:'}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[170px]" title={item.trigger_event}>
                        {isAr ? item.trigger_event_ar : item.trigger_event}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                      <span className="font-semibold">{isAr ? 'القالب المعتمد:' : 'WhatsApp Template:'}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                        {item.template_name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                      <span className="font-semibold">{isAr ? 'فترة التأخير:' : 'Execution Delay:'}</span>
                      <select
                        value={item.delay_minutes}
                        onChange={(e) => handleDelayChange(item.id, Number(e.target.value))}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                      >
                        <option value={0}>{isAr ? 'فوري (0 دقيقة)' : 'Instant (0 min)'}</option>
                        <option value={30}>{isAr ? '30 دقيقة' : '30 minutes'}</option>
                        <option value={60}>{isAr ? 'ساعة واحدة' : '1 hour'}</option>
                        <option value={120}>{isAr ? 'ساعتان' : '2 hours'}</option>
                        <option value={720}>{isAr ? '12 ساعة' : '12 hours'}</option>
                        <option value={1440}>{isAr ? '24 ساعة' : '24 hours'}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Footer: Real Stats & Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.total_triggered.toLocaleString()}
                    </span>{' '}
                    {isAr ? 'أُرسلت' : 'sent'} •{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {item.delivery_rate}% {isAr ? 'نجاح' : 'delivered'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTestModalItem(item)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1"
                      title={isAr ? 'إرسال رسالة تجريبية لاختبار المسار' : 'Send test trigger message'}
                    >
                      <Send className="w-3 h-3 text-emerald-500" />
                      <span>{isAr ? 'تجربة' : 'Test'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(item);
                        setShowEditModal(true);
                      }}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3 text-slate-400" />
                      <span>{isAr ? 'تعديل' : 'Edit'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Test Trigger Modal */}
      {testModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'اختبار مسار الأتمتة' : 'Test Automation Trigger'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTestModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isAr
                ? `سيتم إرسال رسالة تجريبية باستخدام مسار (${testModalItem.name_ar}) إلى الرقم المحدد أدناه.`
                : `A test trigger message using (${testModalItem.name}) will be sent to the phone number specified below.`}
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'رقم الهاتف للتجربة (دولي)' : 'Destination Phone Number'}
              </label>
              <input
                type="text"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="+9665XXXXXXXX"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 dir-ltr text-start"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTestModalItem(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={sendingTest}
                onClick={handleSendTestTrigger}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                {sendingTest ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isAr ? 'جارِ الإرسال...' : 'Sending...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إرسال الآن' : 'Send Test'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Edit Details Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'تعديل مسار الأتمتة' : 'Edit Automation'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'اسم الأتمتة (English)' : 'Automation Name (EN)'}
                </label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'اسم الأتمتة (عربي)' : 'Automation Name (AR)'}
                </label>
                <input
                  type="text"
                  value={editingItem.name_ar}
                  onChange={(e) => setEditingItem({ ...editingItem, name_ar: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'وصف المسار' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={isAr ? editingItem.description_ar : editingItem.description}
                  onChange={(e) =>
                    isAr
                      ? setEditingItem({ ...editingItem, description_ar: e.target.value })
                      : setEditingItem({ ...editingItem, description: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'فترة التأخير (دقائق)' : 'Execution Delay (minutes)'}
                </label>
                <input
                  type="number"
                  value={editingItem.delay_minutes}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, delay_minutes: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isAr ? 'حفظ التغييرات' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
