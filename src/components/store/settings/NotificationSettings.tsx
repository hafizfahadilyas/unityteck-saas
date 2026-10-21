import React, { useState, useEffect } from 'react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import { useToast } from '../../common/ToastProvider';
import type {
  StoreNotificationSettings,
  NotificationTemplateItem,
} from '../../../types';
import {
  fetchNotificationSettingsApi,
  updateNotificationSettingsApi,
  sendTestNotificationApi,
} from '../../../api/tenantApi';
import {
  MessageSquare,
  Smartphone,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Bell,
  Sparkles,
  Phone,
  Layers,
  Globe,
  ShieldCheck,
  Check,
  Copy,
} from 'lucide-react';

export const NotificationSettings: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { activeStore } = useTenant();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<StoreNotificationSettings>({
    store_id: activeStore.id,
    channels: {
      whatsapp: {
        enabled: true,
        provider: 'whatsapp_cloud_api',
        sender_phone: '+966125558899',
        auto_notify_customer: true,
        auto_notify_merchant: true,
      },
      sms: {
        enabled: true,
        provider: 'unifonic_ksa',
        sender_id: 'MakkahGifts',
        auto_notify_customer: true,
        auto_notify_merchant: false,
      },
    },
    templates: {
      order_placed: {
        event: 'order_placed',
        name_en: 'Order Placed & Confirmed',
        name_ar: 'تم استلام وتأكيد الطلب',
        sms_template_ar:
          'مرحباً {{customer_name}}، تم استلام طلبك رقم {{order_number}} بنجاح لدى {{store_name}} بمبلغ {{order_total}} ر.س. سنتواصل معك فور بدء التجهيز.',
        sms_template_en:
          'Hello {{customer_name}}, your order #{{order_number}} at {{store_name}} has been received for {{order_total}} SAR. We will notify you once dispatched.',
        whatsapp_template_ar:
          '🎉 *مرحباً {{customer_name}}*\n\nتم تأكيد طلبك بنجاح من متجر *{{store_name}}*!\n\n📋 *رقم الطلب:* #{{order_number}}\n💰 *الإجمالي:* {{order_total}} {{currency}}\n💳 *طريقة الدفع:* {{payment_method}}\n📍 *وجهة التوصيل:* {{delivery_city}}\n\nشكراً لتسوقك معنا! 🌸',
        whatsapp_template_en:
          '🎉 *Hello {{customer_name}}*\n\nYour order has been confirmed at *{{store_name}}*!\n\n📋 *Order Ref:* #{{order_number}}\n💰 *Total:* {{order_total}} {{currency}}\n💳 *Payment:* {{payment_method}}\n📍 *Destination:* {{delivery_city}}\n\nThank you for shopping with us! 🌸',
      },
      order_shipped: {
        event: 'order_shipped',
        name_en: 'Order Shipped / Out with Courier',
        name_ar: 'تم شحن الطلب مع شركة الشحن',
        sms_template_ar:
          'عزيزي {{customer_name}}، تم شحن طلبك #{{order_number}} مع {{courier_name}} برقم تتبع {{tracking_number}}. للتتبع: {{tracking_url}}',
        sms_template_en:
          'Dear {{customer_name}}, your order #{{order_number}} has shipped with {{courier_name}} (AWB: {{tracking_number}}). Track here: {{tracking_url}}',
        whatsapp_template_ar:
          '🚚 *طلبك في الطريق إليك!*\n\nعزيزي {{customer_name}}، تم تسليم طلبك #{{order_number}} لشركة *{{courier_name}}*.\n\n📦 *رقم التتبع (AWB):* `{{tracking_number}}`\n🔗 *رابط التتبع المباشر:* {{tracking_url}}\n\nنتمنى لك تجربة تسوق رائعة!',
        whatsapp_template_en:
          '🚚 *Your Order is On the Way!*\n\nDear {{customer_name}}, order #{{order_number}} has been dispatched to *{{courier_name}}*.\n\n📦 *Tracking Number (AWB):* `{{tracking_number}}`\n🔗 *Live Tracking Link:* {{tracking_url}}\n\nEnjoy your purchase!',
      },
      order_delivered: {
        event: 'order_delivered',
        name_en: 'Order Delivered Successfully',
        name_ar: 'تم توصيل واستلام الطلب',
        sms_template_ar:
          'تم تسليم طلبك #{{order_number}} بنجاح! شكراً لاختيارك {{store_name}}. يسعدنا تقييمك لتجربتك.',
        sms_template_en:
          'Your order #{{order_number}} has been delivered successfully! Thank you for choosing {{store_name}}.',
        whatsapp_template_ar:
          '✅ *تم تسليم الطلب بنجاح!*\n\nمرحباً {{customer_name}}، نأمل أن تكون منتجات متجر *{{store_name}}* قد نالت إعجابكم ورضاكم الكامل.\n\nإذا كانت لديكم أي استفسارات أو ملاحظات، يسعدنا تواصلكم دائماً.',
        whatsapp_template_en:
          '✅ *Order Delivered Successfully!*\n\nHello {{customer_name}}, we hope you love your purchase from *{{store_name}}*.\n\nIf you have any feedback or inquiries, our team is always here to assist you.',
      },
      order_cancelled: {
        event: 'order_cancelled',
        name_en: 'Order Cancelled & Refunded',
        name_ar: 'إلغاء الطلب واسترداد القيمة',
        sms_template_ar:
          'تم إلغاء الطلب رقم #{{order_number}} لدى {{store_name}}. تم قيد استرداد المبلغ إلى وسيلة الدفع الخاصة بكم.',
        sms_template_en:
          'Order #{{order_number}} at {{store_name}} has been cancelled. Your refund has been initiated to your original payment method.',
        whatsapp_template_ar:
          'ℹ️ *إشعار إلغاء الطلب*\n\nمرحباً {{customer_name}}، نفيدكم بإلغاء الطلب رقم #{{order_number}}.\n\nتمت معالجة استرداد المبلغ بقيمة {{order_total}} {{currency}} إلى وسيلة الدفع المستخدمة وسيظهر في حسابكم خلال 2-7 أيام عمل.',
        whatsapp_template_en:
          'ℹ️ *Order Cancellation Notice*\n\nHello {{customer_name}}, order #{{order_number}} has been cancelled.\n\nA refund of {{order_total}} {{currency}} has been processed back to your payment method and will reflect within 2-7 business days.',
      },
    },
    merchant_alert_phones: ['+966554128899'],
  });

  const [activeEventTab, setActiveEventTab] = useState<string>('order_placed');
  const [templateLang, setTemplateLang] = useState<'ar' | 'en'>(isAr ? 'ar' : 'en');
  const [testPhone, setTestPhone] = useState('+966554128899');
  const [testChannel, setTestChannel] = useState<'whatsapp' | 'sms' | 'both'>('whatsapp');
  const [lastTestResult, setLastTestResult] = useState<any>(null);

  // Load from backend API
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetchNotificationSettingsApi(activeStore.id);
        if (mounted && res?.data) {
          setSettings((prev) => ({
            ...prev,
            ...res.data,
            store_id: activeStore.id,
          }));
        }
      } catch (err) {
        // Keep default initialized settings
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [activeStore.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNotificationSettingsApi(
        {
          channels: settings.channels,
          templates: settings.templates,
          merchant_alert_phones: settings.merchant_alert_phones,
        },
        activeStore.id
      );
      toast(
        isAr
          ? 'تم حفظ إعدادات وقوالب الإشعارات بنجاح ✓'
          : 'Notification channels and bilingual templates saved successfully ✓',
        'success'
      );
    } catch (err: any) {
      toast(err?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    setTesting(true);
    setLastTestResult(null);
    try {
      const res = await sendTestNotificationApi(
        {
          event: activeEventTab,
          recipient_phone: testPhone,
          channel: testChannel,
        },
        activeStore.id
      );
      setLastTestResult(res.data);
      toast(
        isAr
          ? `تم إرسال إشعار تجريبي بنجاح إلى ${testPhone} ✓`
          : `Test alert dispatched successfully to ${testPhone} ✓`,
        'success'
      );
    } catch (err: any) {
      toast(err?.message || 'Failed to send test notification', 'error');
    } finally {
      setTesting(false);
    }
  };

  const currentTemplate: NotificationTemplateItem =
    settings.templates[activeEventTab] || settings.templates['order_placed'];

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner & Save Action */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isAr ? 'إشعارات الواتساب والرسائل النصية الفورية (SMS)' : 'WhatsApp & SMS Instant Order Alerts'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                +966 Saudi KSA Standard
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'إرسال تنبيهات لحظية ومؤتمتة للعميل والتاجر عند تأكيد الطلب، الشحن برقم التتبع، والتوصيل.'
                : 'Automated real-time notifications for customer & store merchant upon order lifecycle triggers.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 self-start sm:self-auto cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'حفظ الإعدادات والقوالب' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Channel Toggles (WhatsApp & SMS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* WhatsApp Channel Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? 'قناة واتساب للأعمال (WhatsApp Business API)' : 'WhatsApp Cloud API Channel'}
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Provider: WhatsApp Cloud API / Twilio</span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.channels.whatsapp.enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    channels: {
                      ...settings.channels,
                      whatsapp: {
                        ...settings.channels.whatsapp,
                        enabled: e.target.checked,
                      },
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-700 dark:text-slate-300 font-bold">
                {isAr ? 'إرسال تنبيه آلي للعميل فور الطلب والشحن' : 'Notify customer on order triggers'}
              </span>
              <input
                type="checkbox"
                checked={settings.channels.whatsapp.auto_notify_customer}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    channels: {
                      ...settings.channels,
                      whatsapp: {
                        ...settings.channels.whatsapp,
                        auto_notify_customer: e.target.checked,
                      },
                    },
                  })
                }
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-700 dark:text-slate-300 font-bold">
                {isAr ? 'إرسال تنبيه لإدارة المتجر عند كل طلب جديد' : 'Alert store merchant phone on new orders'}
              </span>
              <input
                type="checkbox"
                checked={settings.channels.whatsapp.auto_notify_merchant}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    channels: {
                      ...settings.channels,
                      whatsapp: {
                        ...settings.channels.whatsapp,
                        auto_notify_merchant: e.target.checked,
                      },
                    },
                  })
                }
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* SMS Gateway Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {isAr ? 'بوابة الرسائل النصية (Saudi SMS Gateway)' : 'Saudi SMS Gateway (Unifonic / Taqnyat)'}
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  Sender ID: {settings.channels.sms.sender_id || 'MakkahGifts'}
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.channels.sms.enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    channels: {
                      ...settings.channels,
                      sms: {
                        ...settings.channels.sms,
                        enabled: e.target.checked,
                      },
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-700 dark:text-slate-300 font-bold">
                {isAr ? 'إرسال رسائل SMS للأرقام السعودية (+966)' : 'Send SMS to verified KSA numbers (+966)'}
              </span>
              <input
                type="checkbox"
                checked={settings.channels.sms.auto_notify_customer}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    channels: {
                      ...settings.channels,
                      sms: {
                        ...settings.channels.sms,
                        auto_notify_customer: e.target.checked,
                      },
                    },
                  })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-700 dark:text-slate-300 font-bold">
                {isAr ? 'اسم المرسل المعتمد من هيئة الاتصالات (Sender ID)' : 'Official CITC Sender ID'}
              </span>
              <input
                type="text"
                value={settings.channels.sms.sender_id || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    channels: {
                      ...settings.channels,
                      sms: {
                        ...settings.channels.sms,
                        sender_id: e.target.value,
                      },
                    },
                  })
                }
                className="px-2.5 py-1 text-xs font-mono font-bold border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                placeholder="e.g. MakkahGifts"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bilingual Template Editor */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              {isAr ? 'محرر قوالب الرسائل ثنائية اللغة' : 'Bilingual Message Template Editor'}
            </h4>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'خصص نصوص الرسائل مع المتغيرات الديناميكية كاسم العميل ورقم التتبع.'
                : 'Customize templates with dynamic tags like customer name and tracking link.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTemplateLang('ar')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  templateLang === 'ar' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                العربية (RTL)
              </button>
              <button
                type="button"
                onClick={() => setTemplateLang('en')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  templateLang === 'en' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                English (LTR)
              </button>
            </div>
          </div>
        </div>

        {/* Event Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
          {Object.entries(settings.templates).map(([key, tpl]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveEventTab(key)}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeEventTab === key
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {isAr ? tpl.name_ar : tpl.name_en}
            </button>
          ))}
        </div>

        {/* Template Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* WhatsApp Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'نص رسالة الواتساب' : 'WhatsApp Message Format'}</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Supports *bold* & emojis</span>
            </div>
            <textarea
              rows={7}
              value={
                templateLang === 'ar'
                  ? currentTemplate.whatsapp_template_ar
                  : currentTemplate.whatsapp_template_en
              }
              onChange={(e) => {
                const val = e.target.value;
                setSettings({
                  ...settings,
                  templates: {
                    ...settings.templates,
                    [activeEventTab]: {
                      ...currentTemplate,
                      [templateLang === 'ar' ? 'whatsapp_template_ar' : 'whatsapp_template_en']: val,
                    },
                  },
                });
              }}
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-sans text-slate-900 dark:text-white leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* SMS Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span>{isAr ? 'نص رسالة SMS' : 'SMS Text Message'}</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Standard 70/160 chars</span>
            </div>
            <textarea
              rows={7}
              value={
                templateLang === 'ar'
                  ? currentTemplate.sms_template_ar
                  : currentTemplate.sms_template_en
              }
              onChange={(e) => {
                const val = e.target.value;
                setSettings({
                  ...settings,
                  templates: {
                    ...settings.templates,
                    [activeEventTab]: {
                      ...currentTemplate,
                      [templateLang === 'ar' ? 'sms_template_ar' : 'sms_template_en']: val,
                    },
                  },
                });
              }}
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-sans text-slate-900 dark:text-white leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Dynamic Placeholders Tag Reference */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
            {isAr ? 'المتغيرات الديناميكية المتاحة للاستخدام في القوالب:' : 'Available Dynamic Template Tags:'}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              '{{customer_name}}',
              '{{order_number}}',
              '{{order_total}}',
              '{{currency}}',
              '{{courier_name}}',
              '{{tracking_number}}',
              '{{tracking_url}}',
              '{{delivery_city}}',
              '{{store_name}}',
            ].map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300 font-bold"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Live Simulation Sandbox & Test Drawer */}
      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              {isAr ? 'محاكي واختبار الإرسال المباشر (+966 Sandbox)' : 'Live Saudi Notification Dispatch Simulator'}
            </h4>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
            KSA Test Sandbox
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
              {isAr ? 'رقم هاتف المستلم (سعودي)' : 'Recipient Phone Number'}
            </label>
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="+966554128899"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
              {isAr ? 'قناة الإرسال التجريبية' : 'Test Channel'}
            </label>
            <select
              value={testChannel}
              onChange={(e) => setTestChannel(e.target.value as any)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="whatsapp">WhatsApp Business API Only</option>
              <option value="sms">Saudi SMS Only</option>
              <option value="both">Both (WhatsApp + SMS)</option>
            </select>
          </div>

          <div>
            <button
              type="button"
              disabled={testing}
              onClick={handleSendTest}
              className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testing ? (isAr ? 'جاري الإرسال...' : 'Dispatching...') : isAr ? 'إرسال تنبيه تجريبي' : 'Send Test Alert'}</span>
            </button>
          </div>
        </div>

        {/* Live Payload Preview Results */}
        {lastTestResult && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-emerald-600 font-bold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'تمت المحاكاة والإرسال بنجاح' : 'Simulated Dispatch Succeeded'}</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400">{lastTestResult.dispatched_at}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {lastTestResult.channels?.whatsapp && (
                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 block mb-1">
                    WhatsApp Message Preview
                  </span>
                  <pre className="text-[11px] font-sans whitespace-pre-wrap text-slate-800 dark:text-slate-200 leading-relaxed">
                    {lastTestResult.channels.whatsapp.message_preview}
                  </pre>
                </div>
              )}

              {lastTestResult.channels?.sms && (
                <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60">
                  <span className="text-[10px] font-black uppercase text-blue-800 dark:text-blue-300 block mb-1">
                    SMS Message Preview
                  </span>
                  <p className="text-[11px] font-sans text-slate-800 dark:text-slate-200 leading-relaxed">
                    {lastTestResult.channels.sms.message_preview}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
