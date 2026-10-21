import React, { useState, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  Bell,
  Mail,
  MessageSquare,
  Globe,
  Sliders,
  Settings,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Layers,
  ChevronDown,
  X,
  Send,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link2,
  Smile,
  Package,
  ArrowRight,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  Eye,
} from 'lucide-react';

interface ReminderItem {
  id: string;
  store_id: string;
  title: string;
  message: string;
  language: 'EN' | 'AR';
  productId: string;
  productName: string;
  daysAfterPurchase: number;
  timeUnit: 'days' | 'weeks' | 'months';
  channels: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    webPush: boolean;
  };
  isActive: boolean;
  sentCount: number;
  conversionRate: string;
  createdAt: string;
}

interface StoreRepurchaseRemindersProps {
  onNavigateTab?: (tab: string) => void;
}

export const StoreRepurchaseReminders: React.FC<StoreRepurchaseRemindersProps> = ({
  onNavigateTab,
}) => {
  const { activeStore, currentProducts, currentOrders } = useTenant();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';

  // Active view: 'create' or 'list'
  const [viewMode, setViewMode] = useState<'create' | 'list'>('create');
  const [activeSection, setActiveSection] = useState<'content' | 'conditions' | 'settings'>('content');

  // Form state
  const [isActive, setIsActive] = useState(true);
  const [language, setLanguage] = useState<'EN' | 'AR'>('EN');
  const [notificationTitle, setNotificationTitle] = useState('Running low? 👀');
  const [notificationMessage, setNotificationMessage] = useState(
    "Hey {name} 👋 It's been a while since you picked up {product}, and we wanted to make sure you're all set. If you're running low, you can reorder it anytime and keep enjoying it! 🌸"
  );
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [timeSincePurchase, setTimeSincePurchase] = useState<number>(30);
  const [timeUnit, setTimeUnit] = useState<'days' | 'weeks' | 'months'>('days');

  // Channels state
  const [channels, setChannels] = useState({
    email: true,
    sms: true,
    inApp: true,
    webPush: true,
  });

  // Local storage persistence per store
  const storageKey = `unityteck_repurchase_reminders_${activeStore.id}`;
  const [remindersList, setRemindersList] = useState<ReminderItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null);
  const [testSent, setTestSent] = useState(false);

  // Set default product from real store products if available
  React.useEffect(() => {
    if (currentProducts.length > 0 && !selectedProductId) {
      setSelectedProductId(currentProducts[0].id);
    }
  }, [currentProducts, selectedProductId]);

  const selectedProduct = useMemo(() => {
    return currentProducts.find((p) => p.id === selectedProductId) || currentProducts[0];
  }, [currentProducts, selectedProductId]);

  // Rendered preview message with dynamic tags replaced
  const previewMessage = useMemo(() => {
    const pName = selectedProduct
      ? (isAr ? (selectedProduct as any).name_ar || selectedProduct.nameAr || selectedProduct.name : selectedProduct.name)
      : (isAr ? 'المنتج المختار' : 'Selected Product');
    return notificationMessage
      .replace(/{name}/g, isAr ? 'سارة' : 'Sarah')
      .replace(/{product}/g, pName)
      .replace(/{discount}/g, '15%')
      .replace(/{expiry_date}/g, isAr ? '١٥ يوليو' : 'July 15');
  }, [notificationMessage, selectedProduct, isAr]);

  const insertVariable = (variable: string) => {
    setNotificationMessage((prev) => `${prev} ${variable}`);
  };

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const newReminder: ReminderItem = {
      id: `rem_${Date.now()}`,
      store_id: activeStore.id,
      title: notificationTitle,
      message: notificationMessage,
      language,
      productId: selectedProductId,
      productName: selectedProduct ? selectedProduct.name : 'All Products',
      daysAfterPurchase: timeSincePurchase,
      timeUnit,
      channels,
      isActive,
      sentCount: 0,
      conversionRate: '0.0%',
      createdAt: new Date().toISOString(),
    };

    const updated = [newReminder, ...remindersList];
    setRemindersList(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // storage unavailable
    }

    setNotificationSuccess(isAr ? 'تم حفظ التذكير الآلي بنجاح!' : 'Automated reminder saved successfully!');
    setTimeout(() => {
      setNotificationSuccess(null);
      setViewMode('list');
    }, 1500);
  };

  const handleSendTest = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleDeleteReminder = (id: string) => {
    const updated = remindersList.filter((r) => r.id !== id);
    setRemindersList(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // storage unavailable
    }
  };

  const handleToggleReminderStatus = (id: string) => {
    const updated = remindersList.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r));
    setRemindersList(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // storage unavailable
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-6 space-y-6 max-w-[1650px] mx-auto text-slate-800 dark:text-slate-100" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Breadcrumb & Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span
              onClick={() => onNavigateTab && onNavigateTab('marketing')}
              className="cursor-pointer hover:underline text-teal-600 dark:text-teal-400 font-medium"
            >
              {isAr ? 'أدوات التسويق' : 'Marketing Tools'}
            </span>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-semibold">
              {isAr ? 'تذكيرات إعادة الشراء' : 'Repurchase Reminders'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            {isAr ? 'تذكيرات إعادة الشراء الآلية' : 'Automated Repurchase Reminders'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isAr
              ? 'أرسل إشعارات وتذكيرات ذكية للعملاء لإعادة شراء منتجاتهم المفضلة في الوقت المناسب.'
              : 'Send timely, personalized reminders to customers when they are likely running low.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {viewMode === 'create' ? (
            <button
              onClick={() => setViewMode('list')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              {isAr ? 'عرض كل التذكيرات' : 'View All Reminders'}
              <span className="px-2 py-0.5 text-xs rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-bold">
                {remindersList.length}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setViewMode('create')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {isAr ? 'إنشاء تذكير جديد' : 'Create New Reminder'}
            </button>
          )}
        </div>
      </div>

      {notificationSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium text-sm">{notificationSuccess}</span>
        </div>
      )}

      {testSent && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center gap-3 text-blue-800 dark:text-blue-200">
          <Send className="w-5 h-5 text-blue-600 shrink-0" />
          <span className="font-medium text-sm">
            {isAr
              ? 'تم إرسال إشعار تجريبي عبر القنوات المحددة!'
              : 'Test notification sent successfully across selected channels!'}
          </span>
        </div>
      )}

      {viewMode === 'list' ? (
        /* Reminders List Table */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {isAr ? 'قائمة التذكيرات النشطة' : 'Active Automated Reminders'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isAr
                  ? `مخصص لمتجر: ${activeStore.name}`
                  : `Configured specifically for: ${activeStore.name}`}
              </p>
            </div>
            <button
              onClick={() => setViewMode('create')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAr ? 'إضافة تذكير' : 'Add Reminder'}
            </button>
          </div>

          {remindersList.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Bell className="w-8 h-8 opacity-75" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                {isAr ? 'لا توجد تذكيرات مسجلة حتى الآن' : 'No Automated Reminders Found'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
                {isAr
                  ? 'ابدأ بإنشاء أول تذكير ذكي لإعادة الشراء لزيادة مبيعاتك الدورية وتحفيز عملائك.'
                  : 'Start by creating your first smart reminder to drive repeat purchases and customer retention.'}
              </p>
              <button
                onClick={() => setViewMode('create')}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm"
              >
                {isAr ? 'إنشاء تذكير الآن' : 'Create Reminder Now'}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" dir={isAr ? 'rtl' : 'ltr'}>
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4">{isAr ? 'عنوان الإشعار' : 'Reminder Title'}</th>
                    <th className="py-3 px-4">{isAr ? 'المنتج المستهدف' : 'Target Product'}</th>
                    <th className="py-3 px-4">{isAr ? 'توقيت الإرسال' : 'Trigger Time'}</th>
                    <th className="py-3 px-4">{isAr ? 'القنوات' : 'Channels'}</th>
                    <th className="py-3 px-4">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="py-3 px-4 text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {remindersList.map((rem) => (
                    <tr key={rem.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{rem.title}</div>
                        <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">{rem.message}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {rem.productName}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600 dark:text-gray-400">
                        {rem.daysAfterPurchase} {rem.timeUnit} {isAr ? 'بعد الشراء' : 'after order'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          {rem.channels.email && <span title="Email"><Mail className="w-3.5 h-3.5 text-teal-600" /></span>}
                          {rem.channels.sms && <span title="SMS"><MessageSquare className="w-3.5 h-3.5 text-blue-600" /></span>}
                          {rem.channels.inApp && <span title="In-App"><Bell className="w-3.5 h-3.5 text-amber-600" /></span>}
                          {rem.channels.webPush && <span title="Web Push"><Globe className="w-3.5 h-3.5 text-indigo-600" /></span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleReminderStatus(rem.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            rem.isActive
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${rem.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {rem.isActive ? (isAr ? 'نشط' : 'Active') : isAr ? 'معطل' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-end">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteReminder(rem.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            title={isAr ? 'حذف' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Create / Edit View matching exact pixel-perfect image */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (col-span-4 or 5): Summary & Live Phone Preview */}
          <div className="lg:col-span-4 space-y-6">
            {/* Reminder Summary Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                {isAr ? 'ملخص التذكير' : 'Reminder Summary'}
              </h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setActiveSection('content')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-colors ${
                    activeSection === 'content'
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>{isAr ? 'محتوى الإشعار' : 'Notification Content'}</span>
                  </div>
                  {activeSection === 'content' && <span className="w-2 h-2 rounded-full bg-teal-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('conditions')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-colors ${
                    activeSection === 'conditions'
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>{isAr ? 'الشروط والمحفزات' : 'Conditions'}</span>
                  </div>
                  {activeSection === 'conditions' && <span className="w-2 h-2 rounded-full bg-teal-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('settings')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-colors ${
                    activeSection === 'settings'
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>{isAr ? 'الإعدادات والقنوات' : 'Settings'}</span>
                  </div>
                  {activeSection === 'settings' && <span className="w-2 h-2 rounded-full bg-teal-500" />}
                </button>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 dark:text-teal-400 text-xs font-bold">
                  i
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {isAr ? 'المعاينة المباشرة' : 'Live Preview'}
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                {isAr
                  ? 'هكذا سيظهر الإشعار لعملائك على شاشة القفل.'
                  : 'This is how the notification will appear to your customers.'}
              </p>

              {/* iPhone Mockup Frame */}
              <div className="relative mx-auto w-full max-w-[280px] rounded-[36px] bg-gradient-to-b from-teal-950 via-slate-900 to-slate-950 p-3 shadow-2xl border-4 border-slate-700/80">
                {/* Dynamic Island / Notch */}
                <div className="mx-auto w-24 h-4 bg-black rounded-full mb-3 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-800 me-2" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-900/40" />
                </div>

                {/* Lockscreen Clock */}
                <div className="text-center text-white pt-2 pb-5">
                  <div className="w-4 h-4 mx-auto mb-1 text-slate-300">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mx-auto">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                  </div>
                  <div className="text-3xl font-extralight tracking-tight">9:41</div>
                  <div className="text-xs font-light text-slate-300 mt-0.5">
                    {isAr ? 'الإثنين، ١٠ يونيو' : 'Monday, June 10'}
                  </div>
                </div>

                {/* Lockscreen Notification Banner */}
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border border-white/20 text-slate-900 dark:text-white transition-all duration-200">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {notificationTitle || (isAr ? 'تذكير بالمنتج' : 'Running low? 👀')}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium shrink-0">
                          {isAr ? 'الآن' : 'now'}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-gray-700 dark:text-gray-300 break-words">
                        {previewMessage}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Home Indicator Bar */}
                <div className="mx-auto w-24 h-1 bg-white/40 rounded-full mt-6 mb-1" />
              </div>
            </div>
          </div>

          {/* Right Column (col-span-8): Form matching Reference */}
          <div className="lg:col-span-8 space-y-6">
            <form onSubmit={handleSaveReminder} className="space-y-6">
              {/* Header Box: Create New Reminder + Active Toggle */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {isAr ? 'إنشاء تذكير جديد' : 'Create New Reminder'}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isAr
                          ? 'أرسل إشعارات وتنبيهات آلية لعملائك في التوقيت الأمثل.'
                          : 'Send automatic notifications to customers at the right time.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {isActive ? (isAr ? 'نشط' : 'Active') : isAr ? 'معطل' : 'Inactive'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isActive ? 'bg-teal-600' : 'bg-gray-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isActive
                            ? isAr
                              ? '-translate-x-5'
                              : 'translate-x-5'
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 1: Notification Content */}
              <div
                id="section-content"
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-5"
              >
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-800">
                  <MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {isAr ? 'محتوى الإشعار' : 'Notification Content'}
                  </h3>
                </div>

                {/* Title & Language */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-10 space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {isAr ? 'عنوان الإشعار *' : 'Notification Title *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      placeholder={isAr ? 'أوشكت الكمية على الانتهاء؟ 👀' : 'Running low? 👀'}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {isAr ? 'اللغة' : 'Language'}
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as 'EN' | 'AR')}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    >
                      <option value="EN">EN</option>
                      <option value="AR">AR</option>
                    </select>
                  </div>
                </div>

                {/* Message with Toolbar & Counter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {isAr ? 'نص الإشعار *' : 'Notification Message *'}
                    </label>
                    <span className="text-[11px] text-gray-400">
                      {notificationMessage.length}/300
                    </span>
                  </div>

                  {/* Rich Toolbar */}
                  <div className="border border-gray-300 dark:border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500">
                    <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-700 flex-wrap">
                      <button
                        type="button"
                        onClick={() => insertVariable('**bold**')}
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300"
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable('*italic*')}
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300"
                        title="Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300"
                        title="Underline"
                      >
                        <Underline className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300"
                        title="Strikethrough"
                      >
                        <Strikethrough className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1" />
                      <button
                        type="button"
                        onClick={() => insertVariable('\n• ')}
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300"
                        title="Bullet List"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable('\n1. ')}
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300"
                        title="Numbered List"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable(' https://store.com/reorder ')}
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300"
                        title="Link"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable(' 🌸 ')}
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300"
                        title="Emoji"
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      required
                      maxLength={300}
                      rows={4}
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      className="w-full p-3.5 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Variable Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => insertVariable('{name}')}
                    className="p-3 text-start rounded-xl border border-gray-200 dark:border-slate-800 hover:border-teal-500/60 dark:hover:border-teal-500/60 bg-gray-50/50 dark:bg-slate-800/30 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-all text-xs"
                  >
                    <div className="font-semibold text-teal-600 dark:text-teal-400">{'{name}'}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {isAr ? 'اسم العميل' : 'Customer name'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => insertVariable('{product}')}
                    className="p-3 text-start rounded-xl border border-gray-200 dark:border-slate-800 hover:border-teal-500/60 dark:hover:border-teal-500/60 bg-gray-50/50 dark:bg-slate-800/30 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-all text-xs"
                  >
                    <div className="font-semibold text-teal-600 dark:text-teal-400">{'{product}'}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {isAr ? 'اسم المنتج' : 'Product name'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => insertVariable('{discount}')}
                    className="p-3 text-start rounded-xl border border-gray-200 dark:border-slate-800 hover:border-teal-500/60 dark:hover:border-teal-500/60 bg-gray-50/50 dark:bg-slate-800/30 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-all text-xs"
                  >
                    <div className="font-semibold text-teal-600 dark:text-teal-400">{'{discount}'}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {isAr ? 'قيمة الخصم' : 'Discount value'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => insertVariable('{expiry_date}')}
                    className="p-3 text-start rounded-xl border border-gray-200 dark:border-slate-800 hover:border-teal-500/60 dark:hover:border-teal-500/60 bg-gray-50/50 dark:bg-slate-800/30 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-all text-xs"
                  >
                    <div className="font-semibold text-teal-600 dark:text-teal-400">{'{expiry_date}'}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {isAr ? 'تاريخ انتهاء العرض' : 'Offer expiry date'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Section 2: Conditions */}
              <div
                id="section-conditions"
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-5"
              >
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-800">
                  <Settings className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {isAr ? 'الشروط والمحفزات' : 'Conditions'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isAr
                        ? 'حدد متى والمنتجات التي ينطلق بناءً عليها هذا التذكير.'
                        : 'Set when this notification will be sent to customers.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Real Product Dropdown */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {isAr ? 'المنتج الذي قام العميل بشرائه *' : 'Product the customer purchased *'}
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    >
                      {currentProducts.length === 0 ? (
                        <option value="">{isAr ? 'لا توجد منتجات مسجلة' : 'No products available'}</option>
                      ) : (
                        currentProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {isAr ? (p as any).name_ar || p.nameAr || p.name : p.name} — {money(p.price)}
                          </option>
                        ))
                      )}
                    </select>
                    <span className="block text-[11px] text-gray-400">
                      {isAr ? 'اختر المنتج الذي سيطلق هذا التذكير.' : 'Choose the product that will trigger this reminder.'}
                    </span>
                  </div>

                  {/* Time since purchase */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {isAr ? 'المدة بعد آخر عملية شراء *' : 'Time since last purchase *'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        max={365}
                        required
                        value={timeSincePurchase}
                        onChange={(e) => setTimeSincePurchase(Number(e.target.value))}
                        className="w-2/3 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                      <select
                        value={timeUnit}
                        onChange={(e) => setTimeUnit(e.target.value as 'days' | 'weeks' | 'months')}
                        className="w-1/3 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      >
                        <option value="days">{isAr ? 'أيام' : 'Days'}</option>
                        <option value="weeks">{isAr ? 'أسابيع' : 'Weeks'}</option>
                        <option value="months">{isAr ? 'أشهر' : 'Months'}</option>
                      </select>
                    </div>
                    <span className="block text-[11px] text-gray-400">
                      {isAr
                        ? 'إرسال هذا التذكير بعد انقضاء المدة المحددة من الشراء.'
                        : 'Send this reminder after the selected number of days.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Settings & Channels */}
              <div
                id="section-settings"
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-5"
              >
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-800">
                  <Sliders className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {isAr ? 'إعدادات قنوات الإرسال' : 'Settings'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isAr
                        ? 'حدد القنوات التي سيتم إرسال هذا الإشعار عبرها.'
                        : 'Choose where and how this notification will be sent.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Email */}
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      channels.email
                        ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 dark:border-teal-500'
                        : 'border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={channels.email}
                      onChange={(e) => setChannels({ ...channels, email: e.target.checked })}
                      className="mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
                        <Mail className="w-3.5 h-3.5 text-teal-600" />
                        {isAr ? 'البريد الإلكتروني' : 'Email'}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {isAr ? 'إرسال عبر الإيميل' : 'Send via email'}
                      </div>
                    </div>
                  </label>

                  {/* SMS */}
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      channels.sms
                        ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 dark:border-teal-500'
                        : 'border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={channels.sms}
                      onChange={(e) => setChannels({ ...channels, sms: e.target.checked })}
                      className="mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
                        <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                        {isAr ? 'الرسائل النصية' : 'SMS'}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {isAr ? 'إرسال عبر SMS' : 'Send via SMS'}
                      </div>
                    </div>
                  </label>

                  {/* In-App */}
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      channels.inApp
                        ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 dark:border-teal-500'
                        : 'border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={channels.inApp}
                      onChange={(e) => setChannels({ ...channels, inApp: e.target.checked })}
                      className="mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
                        <Bell className="w-3.5 h-3.5 text-teal-600" />
                        {isAr ? 'إشعار داخل التطبيق' : 'In-App Notification'}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {isAr ? 'إظهار داخل تطبيق المتجر' : 'Show in the mobile app'}
                      </div>
                    </div>
                  </label>

                  {/* Web Push */}
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      channels.webPush
                        ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 dark:border-teal-500'
                        : 'border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={channels.webPush}
                      onChange={(e) => setChannels({ ...channels, webPush: e.target.checked })}
                      className="mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
                        <Globe className="w-3.5 h-3.5 text-teal-600" />
                        {isAr ? 'إشعارات الويب' : 'Web Push Notification'}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {isAr ? 'إظهار على متصفحات الويب' : 'Show on web browsers'}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-6 py-2.5 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-semibold text-sm hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSendTest}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-teal-600/40 dark:border-teal-400/40 text-teal-700 dark:text-teal-300 font-semibold text-sm hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    {isAr ? 'إرسال إشعار تجريبي' : 'Send Test Notification'}
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-all shadow-md hover:shadow-teal-600/20"
                  >
                    <Bell className="w-4 h-4" />
                    {isAr ? 'إنشاء التذكير' : 'Create Reminder'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
