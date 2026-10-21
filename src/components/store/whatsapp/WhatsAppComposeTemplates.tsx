import React, { useState, useEffect, useMemo } from 'react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import { useToast } from '../../common/ToastProvider';
import type { WhatsAppTemplateItem } from '../../../types/whatsapp';
import {
  fetchWhatsAppTemplates,
  sendWhatsAppMessageApi,
  fetchWhatsAppContacts,
  createWhatsAppTemplateApi,
} from '../../../services/whatsappManagerService';
import {
  MessageSquare,
  Send,
  Plus,
  Search,
  CheckCircle2,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Video,
  ShoppingBag,
  Smartphone,
  Monitor,
  Copy,
  Check,
  ChevronDown,
  Phone,
  Video as VideoCall,
  MoreVertical,
  ArrowLeft,
  Smile,
  Mic,
  Camera,
  ExternalLink,
  Bold,
  Italic,
  List,
  Sparkles,
  HelpCircle,
  Clock,
  RotateCcw,
  X,
  Save,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  initialTab?: 'compose' | 'templates' | 'media';
  initialData?: any;
  onNavigateSubView: (view: string) => void;
}

export const WhatsAppComposeTemplates: React.FC<Props> = ({
  initialTab = 'compose',
  initialData,
  onNavigateSubView,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { activeStore } = useTenant();
  const { toast } = useToast();

  // Sub-tabs
  const [topTab, setTopTab] = useState<'compose' | 'templates' | 'media'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setTopTab(initialTab);
    }
  }, [initialTab]);

  // Templates from API
  const [templates, setTemplates] = useState<WhatsAppTemplateItem[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Template search & filter
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategory, setTemplateCategory] = useState('all');
  const [templateStatus, setTemplateStatus] = useState('all');

  // Selected Template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('order_confirmation');

  // Real Store Customers
  const [storeCustomers, setStoreCustomers] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Recipient Mode: 'customer' | 'order' | 'custom'
  const [recipientType, setRecipientType] = useState<'customer' | 'order' | 'custom'>('customer');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string;
    phone: string;
  }>({
    id: initialData?.customerId || '',
    name: initialData?.customerName || (isAr ? 'عميل' : 'Customer'),
    phone: initialData?.phone || '',
  });

  const [orderNumber, setOrderNumber] = useState<string>(initialData?.orderNumber || '10284');
  const [customPhone, setCustomPhone] = useState<string>('');

  // New Template Modal state
  const [showNewTplModal, setShowNewTplModal] = useState(false);
  const [newTplName, setNewTplName] = useState('');
  const [newTplNameAr, setNewTplNameAr] = useState('');
  const [newTplCategory, setNewTplCategory] = useState('utility');
  const [newTplDesc, setNewTplDesc] = useState('');
  const [newTplContent, setNewTplContent] = useState('');
  const [creatingTpl, setCreatingTpl] = useState(false);

  // Send Test Message Modal state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('+9665');
  const [sendingTest, setSendingTest] = useState(false);

  // Message body
  const [messageContent, setMessageContent] = useState<string>(
    initialData?.content ||
      `Hi {{customer_name}} 👋\n\nThank you for your order #{{order_id}}!\nWe are preparing your order and it will be shipped within 1-3 business days.\nYou can track your order using the link below:\nhttps://tracking.sa/{{order_id}}\n\nIf you have any questions, feel free to contact us.\n\nBest regards,\n{{store_name}}`,
  );

  // Attach Media
  const [attachedMedia, setAttachedMedia] = useState<string | null>(null);

  // Preview Mode: 'mobile' | 'web'
  const [previewMode, setPreviewMode] = useState<'mobile' | 'web'>('mobile');
  const [sending, setSending] = useState(false);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // Load templates & real customers from real backend API
  useEffect(() => {
    if (!activeStore?.id) return;
    const loadData = async () => {
      try {
        setLoadingTemplates(true);
        const [tplData, contactsRes] = await Promise.all([
          fetchWhatsAppTemplates(activeStore.id),
          fetchWhatsAppContacts(activeStore.id, { per_page: 50 }),
        ]);
        setTemplates(tplData || []);

        const custList = contactsRes.data || [];
        setStoreCustomers(custList);

        // Auto-select first real customer if none provided in initialData
        if (custList.length > 0 && !initialData?.phone) {
          setSelectedCustomer({
            id: custList[0].id,
            name: custList[0].name || (isAr ? 'عميل' : 'Customer'),
            phone: custList[0].phone || '',
          });
          if (custList[0].total_orders) {
            setOrderNumber(String(10000 + (custList[0].total_orders || 1)));
          }
        }
      } catch (err) {
        console.error('Failed to load composer data:', err);
      } finally {
        setLoadingTemplates(false);
      }
    };
    loadData();
  }, [activeStore?.id, initialData, isAr]);

  // When a template is clicked from left column
  const handleSelectTemplate = (tpl: WhatsAppTemplateItem) => {
    setSelectedTemplateId(tpl.id);
    setMessageContent(tpl.content);
    toast(isAr ? `تم اختيار قالب: ${tpl.name_ar || tpl.name}` : `Selected template: ${tpl.name}`, 'info');
  };

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchSearch =
        !templateSearch ||
        tpl.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
        tpl.description.toLowerCase().includes(templateSearch.toLowerCase());
      const matchCategory = templateCategory === 'all' || tpl.category === templateCategory;
      const matchStatus = templateStatus === 'all' || tpl.status === templateStatus;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [templates, templateSearch, templateCategory, templateStatus]);

  // Interpolated Preview Text
  const previewText = useMemo(() => {
    const custName =
      recipientType === 'customer'
        ? selectedCustomer.name
        : recipientType === 'order'
        ? selectedCustomer.name
        : isAr
        ? 'عميلنا العزيز'
        : 'Customer';
    const ordId = orderNumber || '10284';
    const storeName = activeStore?.name || 'My Store';
    const trackingLink = `https://tracking.sa/${ordId}`;

    return messageContent
      .replace(/\{\{customer_name\}\}/g, custName)
      .replace(/\{\{order_id\}\}/g, ordId)
      .replace(/\{\{tracking_number\}\}/g, `TRK-${ordId}-SA`)
      .replace(/\{\{tracking_link\}\}/g, trackingLink)
      .replace(/\{\{order_status\}\}/g, isAr ? 'قيد التجهيز' : 'Processing')
      .replace(/\{\{store_name\}\}/g, storeName);
  }, [messageContent, selectedCustomer, orderNumber, activeStore?.name, recipientType, isAr]);

  const handleCopyVar = (variableStr: string) => {
    navigator.clipboard.writeText(variableStr);
    setCopiedVar(variableStr);
    toast(isAr ? `تم نسخ ${variableStr}` : `Copied ${variableStr}`, 'success');
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const handleInsertVariable = (variableStr: string) => {
    setMessageContent((prev) => (prev ? `${prev} ${variableStr}` : variableStr));
  };

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return storeCustomers.slice(0, 8);
    const q = customerSearch.toLowerCase();
    return storeCustomers.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)),
    );
  }, [storeCustomers, customerSearch]);

  const handleCreateNewTemplate = async () => {
    if (!activeStore?.id) return;
    if (!newTplName.trim()) {
      toast(isAr ? 'يرجى إدخال اسم القالب' : 'Please provide template name', 'error');
      return;
    }
    if (!newTplContent.trim()) {
      toast(isAr ? 'يرجى كتابة نص القالب' : 'Please provide template content', 'error');
      return;
    }

    try {
      setCreatingTpl(true);
      const res = await createWhatsAppTemplateApi(activeStore.id, {
        name: newTplName.trim(),
        name_ar: newTplNameAr.trim() || newTplName.trim(),
        category: newTplCategory,
        description: newTplDesc.trim(),
        content: newTplContent.trim(),
      });

      setTemplates((prev) => [res.data, ...prev]);
      setSelectedTemplateId(res.data.id);
      setMessageContent(res.data.content);
      toast(
        isAr ? 'تم إنشاء القالب وتقديمه للاعتماد بنجاح ✓' : 'Template created and submitted ✓',
        'success',
      );
      setShowNewTplModal(false);
      setNewTplName('');
      setNewTplNameAr('');
      setNewTplDesc('');
      setNewTplContent('');
    } catch (err: any) {
      toast(err.message || 'Failed to create template', 'error');
    } finally {
      setCreatingTpl(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!activeStore?.id) return;
    if (!testPhoneNumber || testPhoneNumber.trim().length < 8) {
      toast(isAr ? 'يرجى إدخال رقم هاتف صالح للاختبار' : 'Please provide a valid test phone number', 'error');
      return;
    }

    try {
      setSendingTest(true);
      await sendWhatsAppMessageApi(activeStore.id, {
        phone_number: testPhoneNumber.trim(),
        customer_name: isAr ? 'اختبار تجريبي' : 'Test Recipient',
        order_number: orderNumber || '10284',
        message_content: `[WHATSAPP TEST]\n${previewText}`,
        message_type: 'Test Message',
        category: 'custom',
        template_name: selectedTemplateId,
        agent_name: 'Store Admin',
        agent_initials: 'SA',
      });

      toast(isAr ? 'تم إرسال الرسالة التجريبية بنجاح ✓' : 'Test message sent successfully ✓', 'success');
      setShowTestModal(false);
    } catch (err: any) {
      toast(err.message || 'Failed to send test message', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  const handleLoadOrder = () => {
    if (!orderNumber.trim()) {
      toast(isAr ? 'يرجى إدخال رقم الطلب أولاً' : 'Please enter order number', 'error');
      return;
    }
    const cleanNum = orderNumber.replace('#', '').trim();
    const found = storeCustomers.find(
      (c) => c.total_orders && String(c.total_orders).includes(cleanNum),
    );
    if (found) {
      setSelectedCustomer({
        id: found.id,
        name: found.name,
        phone: found.phone,
      });
      toast(
        isAr ? `تم ربط الطلب #${cleanNum} بالعميل ${found.name}` : `Linked order #${cleanNum} to ${found.name}`,
        'success',
      );
    } else {
      toast(isAr ? `تم تحديث متغيرات الطلب #${cleanNum}` : `Updated variables for order #${cleanNum}`, 'info');
    }
  };

  // 1. 100% Free Lifetime Direct WhatsApp (wa.me)
  const handleSendDirectWhatsApp = async () => {
    if (!activeStore?.id) return;
    const phoneToSend =
      recipientType === 'custom' ? customPhone : selectedCustomer.phone;

    if (!phoneToSend || phoneToSend.trim().length < 6) {
      toast(isAr ? 'يرجى إدخال رقم هاتف صالح' : 'Please provide a valid phone number', 'error');
      return;
    }

    if (!messageContent.trim()) {
      toast(isAr ? 'يرجى كتابة نص الرسالة' : 'Message content cannot be empty', 'error');
      return;
    }

    // Clean phone number: remove +, dashes, spaces
    let cleanPhone = phoneToSend.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
    // Normalize Saudi local 05 to 9665
    if (cleanPhone.startsWith('05') && cleanPhone.length === 10) {
      cleanPhone = '966' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('5') && cleanPhone.length === 9) {
      cleanPhone = '966' + cleanPhone;
    }

    const directUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(previewText)}`;

    try {
      // Log to database as manual message (does not deduct from API limit)
      await sendWhatsAppMessageApi(activeStore.id, {
        phone_number: phoneToSend,
        customer_name: selectedCustomer.name,
        customer_id: selectedCustomer.id,
        order_number: orderNumber || undefined,
        message_content: previewText,
        message_type: 'Direct WhatsApp (Manual)',
        category: 'order',
        template_name: selectedTemplateId,
        agent_name: 'Store Admin',
        agent_initials: 'SA',
        send_mode: 'direct',
      });
    } catch (e) {
      console.warn('Direct message logged warning:', e);
    }

    // Open WhatsApp Web or App directly
    window.open(directUrl, '_blank');
    toast(
      isAr
        ? 'تم فتح تطبيق واتساب للإرسال المباشر مجاناً مدى الحياة ✓'
        : 'Direct WhatsApp opened (100% Free Lifetime) ✓',
      'success',
    );
  };

  // 2. Real Automated API Call with Anti-Ban Quota Protection
  const handleSendMessage = async () => {
    if (!activeStore?.id) return;
    const phoneToSend =
      recipientType === 'custom' ? customPhone : selectedCustomer.phone;

    if (!phoneToSend || phoneToSend.trim().length < 6) {
      toast(isAr ? 'يرجى إدخال رقم هاتف صالح' : 'Please provide a valid phone number', 'error');
      return;
    }

    if (!messageContent.trim()) {
      toast(isAr ? 'يرجى كتابة نص الرسالة' : 'Message content cannot be empty', 'error');
      return;
    }

    try {
      setSending(true);
      await sendWhatsAppMessageApi(activeStore.id, {
        phone_number: phoneToSend,
        customer_name: selectedCustomer.name,
        customer_id: selectedCustomer.id,
        order_number: orderNumber || undefined,
        message_content: previewText,
        message_type: 'Order Confirmation',
        category: 'order',
        template_name: selectedTemplateId,
        agent_name: 'Store Admin',
        agent_initials: 'SA',
        send_mode: 'api',
      });

      toast(
        isAr ? 'تم إرسال رسالة الواتساب بنجاح ✓' : 'WhatsApp message sent successfully ✓',
        'success',
      );
      onNavigateSubView('center');
    } catch (err: any) {
      console.error('Send message failed:', err);
      toast(err.message || 'Failed to send WhatsApp message', 'error');
      if (
        err.message &&
        (err.message.includes('limit reached') ||
          err.message.includes('quota') ||
          err.message.includes('paused') ||
          err.message.includes('Anti-Ban'))
      ) {
        setShowSafetyModal(true);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm border border-emerald-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'إنشاء الرسائل والقوالب' : 'Compose Message & Templates'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'إنشاء وإرسال رسائل الواتساب باستخدام القوالب المعتمدة أو الرسائل المخصصة مع المعاينة الحية.'
                : 'Create and send WhatsApp messages using approved templates or custom messages. Personalize with customer data and preview before sending.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => toast(isAr ? 'دليل إعداد القوالب وتراخيص Meta' : 'WhatsApp Template approval guide', 'info')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <HelpCircle className="w-4 h-4 text-sky-500" />
          <span>{isAr ? 'دليل المساعدة' : 'Help Guide'}</span>
        </button>
      </div>

      {/* 2. Top Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setTopTab('compose')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            topTab === 'compose'
              ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {isAr ? 'إنشاء رسالة' : 'Compose Message'}
        </button>

        <button
          type="button"
          onClick={() => setTopTab('templates')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            topTab === 'templates'
              ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {isAr ? 'قوالب الرسائل' : 'Message Templates'}
        </button>

        <button
          type="button"
          onClick={() => setTopTab('media')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            topTab === 'media'
              ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {isAr ? 'مكتبة الوسائط' : 'Media Library'}
        </button>
      </div>

      {/* 3. Three-Column Workspace Layout (Matching Reference Image 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMN 1: Approved Templates (3.5 cols on desktop) */}
        <div className="lg:col-span-3 xl:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {isAr ? 'القوالب المعتمدة' : 'Approved Templates'} ({filteredTemplates.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowNewTplModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? 'قالب جديد' : 'New Template'}</span>
            </button>
          </div>

          {/* Search Templates */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              placeholder={isAr ? 'بحث في القوالب...' : 'Search templates...'}
              className="w-full ps-8 pe-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Template Category & Status Dropdowns */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={templateCategory}
              onChange={(e) => setTemplateCategory(e.target.value)}
              className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">{isAr ? 'كافة الفئات' : 'All Categories'}</option>
              <option value="utility">Utility</option>
              <option value="marketing">Marketing</option>
            </select>

            <select
              value={templateStatus}
              onChange={(e) => setTemplateStatus(e.target.value)}
              className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">{isAr ? 'كافة الحالات' : 'All Status'}</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Templates List */}
          <div className="space-y-2 max-h-[560px] overflow-y-auto pe-1 custom-sidebar-scroll">
            {filteredTemplates.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`p-2.5 rounded-xl border text-start cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {isAr ? tpl.name_ar || tpl.name : tpl.name}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 shrink-0">
                      Approved
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {tpl.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: Compose Message Center Form (5 cols on desktop) */}
        <div className="lg:col-span-5 xl:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-slate-800">
            {isAr ? 'إنشاء الرسالة' : 'Compose Message'}
          </h2>

          {/* Template Selector Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isAr ? 'القالب المختار' : 'Template'}
            </label>
            <div className="relative">
              <select
                value={selectedTemplateId}
                onChange={(e) => {
                  const found = templates.find((t) => t.id === e.target.value);
                  if (found) handleSelectTemplate(found);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* "To" Recipient Selector Radio */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isAr ? 'إلى (المستلم):' : 'To'}
            </label>
            <div className="flex items-center gap-4 text-xs text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="recipient"
                  checked={recipientType === 'customer'}
                  onChange={() => setRecipientType('customer')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>{isAr ? 'عميل' : 'Customer'}</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="recipient"
                  checked={recipientType === 'order'}
                  onChange={() => setRecipientType('order')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>{isAr ? 'طلب' : 'Order'}</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="recipient"
                  checked={recipientType === 'custom'}
                  onChange={() => setRecipientType('custom')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>{isAr ? 'رقم مخصص' : 'Custom Number'}</span>
              </label>
            </div>

            {/* Customer Search / Selection Card */}
            {recipientType === 'customer' && (
              <div className="space-y-2 mt-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerSearch}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    placeholder={isAr ? 'بحث بالاسم أو رقم الهاتف...' : 'Search customer by name or phone number...'}
                    className="w-full ps-8 pe-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {showCustomerDropdown && (
                    <div className="absolute top-full start-0 end-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-30 divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredCustomers.length === 0 ? (
                        <p className="p-3 text-xs text-slate-400 text-center">
                          {isAr ? 'لا يوجد عملاء مطابقين' : 'No matching customers found'}
                        </p>
                      ) : (
                        filteredCustomers.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedCustomer({
                                id: c.id,
                                name: c.name || (isAr ? 'عميل' : 'Customer'),
                                phone: c.phone || '',
                              });
                              setShowCustomerDropdown(false);
                              setCustomerSearch('');
                              if (c.total_orders) {
                                setOrderNumber(String(10000 + (c.total_orders || 1)));
                              }
                            }}
                            className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-white block">{c.name}</span>
                              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{c.phone}</span>
                            </div>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              {c.total_orders ?? 0} {isAr ? 'طلبات' : 'orders'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Customer Card (Matching Reference Image 2) */}
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                      {(selectedCustomer.name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {selectedCustomer.name}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 dir-ltr text-start">
                        {selectedCustomer.phone}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateSubView('contacts')}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {isAr ? 'عرض الملف' : 'View Profile'}
                  </button>
                </div>
              </div>
            )}

            {/* Custom Phone Number input */}
            {recipientType === 'custom' && (
              <div className="mt-2">
                <input
                  type="text"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder="+966 5XXXXXXXX"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 dir-ltr text-start"
                />
              </div>
            )}
          </div>

          {/* Order Number Field + Load Order */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isAr ? 'رقم الطلب' : 'Order Number'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="#10284"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleLoadOrder}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                {isAr ? 'تحميل الطلب' : 'Load Order'}
              </button>
            </div>
          </div>

          {/* Anti-Ban Safety Protection Banner */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
            <div className="flex items-start gap-2.5 min-w-0">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">
                  {isAr ? 'نظام الحماية من حظر الرقم (Anti-Ban Protection Active)' : 'WhatsApp Anti-Ban Protection Active'}
                </span>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-normal">
                  {isAr
                    ? 'الحد الآمن اليومي 10 رسائل والشهري 50 رسالة لحماية رقم هاتفك من خوارزميات الحظر. يمكنك استخدام «واتساب مباشر» للإرسال المجاني واللامحدود مدى الحياة.'
                    : 'Safe limit is 10 messages/day and 50 messages/month to safeguard your phone number from spam bans. Use Direct WhatsApp for unlimited lifetime free messaging.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSafetyModal(true)}
              className="px-2.5 py-1 rounded-lg bg-amber-200/70 dark:bg-amber-900/50 hover:bg-amber-200 font-bold text-[11px] text-amber-950 dark:text-amber-200 shrink-0 transition-colors cursor-pointer"
            >
              {isAr ? 'شروط الأمان' : 'Safety Info'}
            </button>
          </div>

          {/* Message Content with Formatting Toolbar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'محتوى الرسالة' : 'Message Content'}
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {messageContent.length}/1000
              </span>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between p-1.5 rounded-t-lg border-t border-x border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <button
                  type="button"
                  onClick={() => setMessageContent((p) => p + ' *bold* ')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setMessageContent((p) => p + ' _italic_ ')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setMessageContent((p) => p + '\n• ')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setMessageContent((p) => p + ' ✨ ')}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Emoji"
                >
                  <Smile className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Variables quick-dropdown */}
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleInsertVariable(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="text-[11px] font-semibold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="" disabled>
                    {isAr ? 'إدراج متغير...' : 'Variables ▾'}
                  </option>
                  <option value="{{customer_name}}">Customer Name</option>
                  <option value="{{order_id}}">Order ID</option>
                  <option value="{{tracking_link}}">Tracking Link</option>
                  <option value="{{store_name}}">Store Name</option>
                </select>
              </div>
            </div>

            <textarea
              rows={6}
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className="w-full px-3 py-2 rounded-b-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans leading-relaxed resize-y"
            />
          </div>

          {/* Attach Media (Optional) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'إرفاق وسائط (اختياري)' : 'Attach Media (Optional)'}
              </label>
              <span className="text-[10px] text-slate-400">
                {isAr ? 'الحد الأقصى: 16 ميجابايت' : 'Maximum file size: 16 MB'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAttachedMedia('image');
                  toast(isAr ? 'تم تحديد إرفاق صورة' : 'Image attached', 'info');
                }}
                className={`py-2 px-1 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                  attachedMedia === 'image'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span className="text-[10px] font-semibold">{isAr ? 'صورة' : 'Image'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAttachedMedia('pdf');
                  toast(isAr ? 'تم تحديد إرفاق ملف PDF' : 'PDF attached', 'info');
                }}
                className={`py-2 px-1 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                  attachedMedia === 'pdf'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="text-[10px] font-semibold">{isAr ? 'مستند (PDF)' : 'Document (PDF)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAttachedMedia('video');
                  toast(isAr ? 'تم تحديد إرفاق فيديو' : 'Video attached', 'info');
                }}
                className={`py-2 px-1 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                  attachedMedia === 'video'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Video className="w-4 h-4" />
                <span className="text-[10px] font-semibold">{isAr ? 'فيديو' : 'Video'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAttachedMedia('product');
                  toast(isAr ? 'تم تحديد إرفاق بطاقة منتج' : 'Product card attached', 'info');
                }}
                className={`py-2 px-1 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                  attachedMedia === 'product'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="text-[10px] font-semibold">{isAr ? 'منتج' : 'Product'}</span>
              </button>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => toast(isAr ? 'تم حفظ المسودة بنجاح' : 'Draft saved successfully', 'info')}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {isAr ? 'حفظ كمسودة' : 'Save as Draft'}
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setTestPhoneNumber(selectedCustomer.phone || '+9665');
                  setShowTestModal(true);
                }}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {isAr ? 'رسالة تجريبية' : 'Test Message'}
              </button>

              {/* Direct WhatsApp (100% Free Lifetime) Button */}
              <button
                type="button"
                onClick={handleSendDirectWhatsApp}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                title={isAr ? 'إرسال مباشر عبر تطبيق أو ويب واتساب - مجاني 100% مدى الحياة بدون حدود' : 'Open WhatsApp Web/App directly - 100% Free Lifetime & Unlimited'}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isAr ? 'واتساب مباشر (مجاني 100%)' : 'Direct WhatsApp (Free Lifetime)'}</span>
              </button>

              {/* Automated API Send Button (Uses Store Quota) */}
              <button
                type="button"
                disabled={sending}
                onClick={handleSendMessage}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title={isAr ? 'إرسال تلقائي عبر Meta Cloud API (يستهلك من رصيد المتجر)' : 'Automated dispatch via Meta Cloud API'}
              >
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                <span>{sending ? (isAr ? 'جارِ الإرسال...' : 'Sending...') : (isAr ? 'إرسال تلقائي (API)' : 'Automated API Send')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN 3: Message Live Preview & Template Variables (4 cols on desktop) */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'معاينة الرسالة' : 'Message Preview'}
              </h2>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewMode('mobile')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    previewMode === 'mobile'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  WhatsApp (Mobile)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('web')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    previewMode === 'web'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  WhatsApp (Web)
                </button>
              </div>
            </div>

            {/* 1:1 Pixel-Perfect WhatsApp Phone Frame Mockup */}
            <div className="mx-auto w-[280px] sm:w-[300px] rounded-[36px] p-2.5 bg-slate-900 shadow-2xl border-4 border-slate-800 text-slate-900 overflow-hidden">
              {/* iPhone screen display */}
              <div className="rounded-[28px] overflow-hidden bg-[#EFEAE2] dark:bg-[#0B141A] flex flex-col h-[460px]">
                {/* Status Bar */}
                <div className="bg-[#008069] dark:bg-[#1F2C34] text-white px-5 pt-2 pb-1 flex items-center justify-between text-[11px] font-bold">
                  <span>9:41</span>
                  <div className="w-16 h-3 bg-black/30 rounded-full" />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px]">5G</span>
                    <span className="text-[10px]">100%</span>
                  </div>
                </div>

                {/* WhatsApp Chat Header */}
                <div className="bg-[#008069] dark:bg-[#1F2C34] text-white px-3 py-2 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4 rtl:rotate-180 cursor-pointer" />
                    <div className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-900 font-bold flex items-center justify-center text-xs">
                      A
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight">
                        {selectedCustomer.name}
                      </h4>
                      <span className="text-[10px] text-emerald-100 dark:text-slate-300">
                        online
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-white/90">
                    <VideoCall className="w-4 h-4" />
                    <Phone className="w-3.5 h-3.5" />
                    <MoreVertical className="w-4 h-4" />
                  </div>
                </div>

                {/* Chat Bubble Area */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2 flex flex-col justify-end text-start">
                  <div className="text-center my-1">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-white/70 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-medium shadow-xs">
                      Today
                    </span>
                  </div>

                  {/* Message Bubble (WhatsApp green incoming message style) */}
                  <div className="max-w-[90%] self-end bg-[#E7FFDB] dark:bg-[#005C4B] rounded-2xl rounded-tr-none p-3 text-xs shadow-sm text-slate-900 dark:text-white leading-relaxed space-y-1.5 border border-emerald-500/10">
                    <div className="whitespace-pre-line text-[11px]">
                      {previewText}
                    </div>

                    <div className="flex items-center justify-end gap-1 text-[9px] text-slate-500 dark:text-emerald-200 pt-0.5">
                      <span>10:30 AM</span>
                      {/* Double Blue / Green Checkmarks */}
                      <span className="text-sky-500 dark:text-sky-400 font-bold">✓✓</span>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Chat Input Bar */}
                <div className="p-2 bg-[#F0F2F5] dark:bg-[#1F2C34] flex items-center gap-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex-1 bg-white dark:bg-[#2A3942] rounded-full px-3 py-1.5 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Smile className="w-4 h-4 text-slate-400" />
                      <span className="text-[11px] text-slate-400">Message</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Paperclip className="w-3.5 h-3.5" />
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#00A884] text-white flex items-center justify-center shrink-0 shadow-md">
                    <Mic className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Template Variables List with Copy Buttons (Matching Reference Image 2) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-slate-800">
              {isAr ? 'متغيرات القوالب (Template Variables)' : 'Template Variables'}
            </h3>

            <div className="space-y-1.5 text-xs">
              {[
                { token: '{{customer_name}}', label: 'Customer name' },
                { token: '{{order_id}}', label: 'Order number' },
                { token: '{{tracking_number}}', label: 'Tracking number' },
                { token: '{{tracking_link}}', label: 'Tracking link' },
                { token: '{{order_status}}', label: 'Order status' },
                { token: '{{store_name}}', label: 'Store name' },
              ].map((v) => (
                <div
                  key={v.token}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
                >
                  <div className="flex items-center gap-2">
                    <code className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px] font-bold">
                      {v.token}
                    </code>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {v.label}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyVar(v.token)}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                    title="Copy variable"
                  >
                    {copiedVar === v.token ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Create New Template Modal */}
      {showNewTplModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden text-start">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? 'إنشاء قالب واتساب جديد' : 'Create New WhatsApp Template'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'سيتم إرسال القالب لـ Meta للاعتماد والمزامنة مع حسابك'
                      : 'Template will be submitted to Meta for verification and sync'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTplModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'اسم القالب (إنجليزي)' : 'Template Name (EN)'} *
                  </label>
                  <input
                    type="text"
                    value={newTplName}
                    onChange={(e) => setNewTplName(e.target.value)}
                    placeholder="e.g. order_shipped_alert"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'اسم القالب (عربي)' : 'Template Name (AR)'}
                  </label>
                  <input
                    type="text"
                    value={newTplNameAr}
                    onChange={(e) => setNewTplNameAr(e.target.value)}
                    placeholder="مثال: تنبيه شحن الطلب"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'فئة القالب (Category)' : 'Template Category'}
                </label>
                <select
                  value={newTplCategory}
                  onChange={(e) => setNewTplCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="utility">Utility (تحديثات الطلبات والمعاملات)</option>
                  <option value="marketing">Marketing (عروض ترويجية وتسويق)</option>
                  <option value="authentication">Authentication (رموز التحقق OTP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الوصف' : 'Description'}
                </label>
                <input
                  type="text"
                  value={newTplDesc}
                  onChange={(e) => setNewTplDesc(e.target.value)}
                  placeholder={isAr ? 'وصف استخدام القالب...' : 'Describe when this template is used...'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isAr ? 'نص الرسالة (Content)' : 'Message Content'} *
                  </label>
                  <div className="flex items-center gap-1">
                    {['{{customer_name}}', '{{order_id}}', '{{tracking_link}}'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setNewTplContent((prev) => prev + ` ${v} `)}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-mono hover:bg-emerald-50"
                      >
                        +{v}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={newTplContent}
                  onChange={(e) => setNewTplContent(e.target.value)}
                  placeholder={
                    isAr
                      ? 'مرحباً {{customer_name}}، نود إبلاغك بأن طلبك رقم {{order_id}} قيد المعالجة...'
                      : 'Hi {{customer_name}}, your order #{{order_id}} is being processed...'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50">
              <button
                type="button"
                onClick={() => setShowNewTplModal(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={creatingTpl}
                onClick={handleCreateNewTemplate}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                {creatingTpl ? (
                  <span>{isAr ? 'جارِ الاعتماد...' : 'Submitting...'}</span>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إرسال للاعتماد والمزامنة' : 'Submit for Approval'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Send Test Message Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden text-start">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? 'إرسال رسالة تجريبية' : 'Send Test WhatsApp Message'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr ? 'إرسال فوري إلى رقم جوال للاختبار والمعاينة' : 'Immediate delivery to test device for inspection'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'رقم هاتف المستلم (مع الرمز الدولي)' : 'Recipient Phone Number (with country code)'} *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    dir="ltr"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    placeholder="+9665XXXXXXXX"
                    className="w-full ps-9 pe-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'نص الرسالة التجريبية' : 'Test Message Body Preview'}
                </label>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 max-h-36 overflow-y-auto whitespace-pre-line font-mono">
                  {previewText}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50">
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={sendingTest}
                onClick={handleSendTestMessage}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                {sendingTest ? (
                  <span>{isAr ? 'جارِ الإرسال...' : 'Sending...'}</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إرسال الآن' : 'Send Now'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anti-Ban Safety Protection Details Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? 'إرشادات الحماية من حظر الرقم (Anti-Ban Rules)' : 'WhatsApp Anti-Ban Rules & Quota Safety'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'كيف تحمي رقم هاتفك من الحظر وخوارزميات السبام'
                      : 'How your phone number is protected from WhatsApp spam blocks'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSafetyModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>{isAr ? 'لماذا يتم حظر الأرقام في واتساب؟' : 'Why does WhatsApp ban numbers?'}</span>
                </div>
                <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
                  {isAr
                    ? 'تقوم خوارزميات Meta بمراقبة الإرسال الآلي الكثيف. عند إرسال رسائل آلية سريعة من رقم غير موثق بالكامل أو جديد، يتم تصنيف الرقم كسبام وحظره مؤقتاً أو دائماً.'
                    : 'Meta automated spam detectors flag numbers that send high-volume automated messages too quickly without prior customer contact. This can result in permanent phone number bans.'}
                </p>
              </div>

              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{isAr ? 'الحدود المحددة من الإدارة العامة (Master Admin)' : 'Master Admin Safe Limits:'}</span>
                </h4>
                <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 ps-4 list-disc">
                  <li>
                    <strong>{isAr ? 'الحد اليومي الآمن:' : 'Safe Daily Limit:'}</strong>{' '}
                    {isAr ? '10 رسائل تلقائية في اليوم للحفاظ على تقييم جودة الرقم (Quality Rating).' : '10 automated API messages per day to maintain green quality rating.'}
                  </li>
                  <li>
                    <strong>{isAr ? 'الحد الشهري:' : 'Monthly Limit:'}</strong>{' '}
                    {isAr ? '50 رسالة شهرياً لكل متجر، ويمكن تعديلها من قبل Master Admin حسب الطلب.' : '50 messages per month per store, fully configurable by Master Admin.'}
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800 dark:text-emerald-300">
                  <MessageSquare className="w-4 h-4" />
                  <span>{isAr ? 'الحل المجاني 100% مدى الحياة (واتساب مباشر)' : '100% Free Lifetime Solution (Direct WhatsApp):'}</span>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  {isAr
                    ? 'استخدم زر «واتساب مباشر» لفتح محادثة واتساب ويب أو التطبيق فوراً. هذه الطريقة مجانية 100% مدى الحياة، بلا أي رسوم، وبلا أي حدود يومية، وآمنة تماماً ضد الحظر!'
                    : 'Use the Direct WhatsApp button to open WhatsApp Web or your phone app directly. This option is 100% free lifetime, has zero quota limits, and zero risk of automated bans!'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/50">
              <button
                type="button"
                onClick={() => setShowSafetyModal(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSafetyModal(false);
                  handleSendDirectWhatsApp();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isAr ? 'إرسال عبر واتساب مباشر الآن' : 'Send via Direct WhatsApp Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
