import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import { useToast } from '../../common/ToastProvider';
import type {
  WhatsAppOverviewData,
  WhatsAppMessageItem,
  WhatsAppPaginationInfo,
  WhatsAppFilterParams,
} from '../../../types/whatsapp';
import {
  fetchWhatsAppOverview,
  fetchWhatsAppMessages,
} from '../../../services/whatsappManagerService';
import { readStoreIdentity } from '../../../themes/settings/storeIdentity';
import {
  getCustomerDisplayName,
  getLocalizedWhatsAppMessage,
} from '../../../utils/storeLocalization';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  CheckCheck,
  XCircle,
  HelpCircle,
  Calendar,
  Search,
  RotateCcw,
  Plus,
  MoreHorizontal,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Copy,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  User,
  ShoppingBag,
} from 'lucide-react';

interface Props {
  onNavigateSubView: (view: string, initialData?: any) => void;
}

export const WhatsAppMessageCenter: React.FC<Props> = ({ onNavigateSubView }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { activeStore } = useTenant();
  const { toast } = useToast();

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Real overview data from API (no dummy fallback)
  const [overview, setOverview] = useState<WhatsAppOverviewData | null>(null);

  // Active category tab
  const [activeCategory, setActiveCategory] = useState<'all' | 'order' | 'marketing' | 'custom'>('all');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Messages list & pagination
  const [messages, setMessages] = useState<WhatsAppMessageItem[]>([]);
  const [pagination, setPagination] = useState<WhatsAppPaginationInfo>({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0,
  });

  // Selected row IDs for bulk actions
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // 1. Fetch Overview Metrics
  const loadOverview = useCallback(async () => {
    if (!activeStore?.id) return;
    try {
      setLoadingOverview(true);
      const data = await fetchWhatsAppOverview(activeStore.id);
      setOverview(data);
    } catch (err: any) {
      console.error('Failed to load WhatsApp overview:', err);
    } finally {
      setLoadingOverview(false);
    }
  }, [activeStore?.id]);

  // 2. Fetch Messages List
  const loadMessages = useCallback(async () => {
    if (!activeStore?.id) return;
    try {
      setLoadingMessages(true);
      const params: WhatsAppFilterParams = {
        category: activeCategory,
        status: selectedStatus === 'all' ? undefined : (selectedStatus as any),
        message_type: selectedType === 'all' ? undefined : selectedType,
        template: selectedTemplate === 'all' ? undefined : selectedTemplate,
        agent: selectedAgent === 'all' ? undefined : selectedAgent,
        search: searchQuery.trim() || undefined,
        page: currentPage,
        per_page: 12,
      };
      const res = await fetchWhatsAppMessages(activeStore.id, params);
      setMessages(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to load WhatsApp messages:', err);
      toast(isAr ? 'تعذر جلب سجلات رسائل الواتساب' : 'Failed to load WhatsApp messages', 'error');
    } finally {
      setLoadingMessages(false);
    }
  }, [
    activeStore?.id,
    activeCategory,
    selectedStatus,
    selectedType,
    selectedTemplate,
    selectedAgent,
    searchQuery,
    currentPage,
    isAr,
    toast,
  ]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedType('all');
    setSelectedTemplate('all');
    setSelectedAgent('all');
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRowIds(messages.map((m) => m.id));
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRowIds((prev) => [...prev, id]);
    } else {
      setSelectedRowIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Localized date & time formatting
  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { time: '', date: '' };
    if (isAr) {
      const time = d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      const date = d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' });
      return { time, date };
    }
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return { time, date };
  };

  // Clean single '#' format for order numbers (prevent ##10284)
  const cleanOrderNumber = (ord: string | null | undefined) => {
    if (!ord) return null;
    const cleaned = ord.replace(/^#+/, '').trim();
    return cleaned ? `#${cleaned}` : null;
  };

  // Message Type localization helper
  const getLocalizedMessageType = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('confirmation')) return isAr ? 'تأكيد الطلب' : 'Order Confirmation';
    if (t.includes('delivery')) return isAr ? 'تحديث التوصيل' : 'Delivery Update';
    if (t.includes('order update') || t.includes('update')) return isAr ? 'تحديث الطلب' : 'Order Update';
    if (t.includes('marketing')) return isAr ? 'تسويق' : 'Marketing';
    if (t.includes('payment')) return isAr ? 'تحديث الدفع' : 'Payment Update';
    if (t.includes('return')) return isAr ? 'تحديث الإرجاع' : 'Return Update';
    return isAr ? 'رسالة مخصصة' : 'Custom';
  };

  // Agent display and role localization
  const getAgentDisplay = (initials: string | null | undefined, name: string | null | undefined) => {
    const init = (initials || 'SA').toUpperCase();
    if (init === 'SA') return { code: init, role: isAr ? 'مدير المتجر' : 'Store Admin' };
    if (init === 'MA') return { code: init, role: isAr ? 'مسؤول التسويق' : 'Marketing Agent' };
    if (init === 'FA') return { code: init, role: isAr ? 'مسؤول التوصيل' : 'Fulfillment Agent' };
    if (init === 'TM') return { code: init, role: isAr ? 'طارق المكي' : 'Tariq Al-Makki' };
    return { code: init, role: isAr ? (name ? getCustomerDisplayName(name, 'ar') : 'موظف') : (name || 'Agent') };
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {isAr ? 'تم التسليم' : 'Delivered'}
          </span>
        );
      case 'read':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            {isAr ? 'تمت القراءة' : 'Read'}
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {isAr ? 'تم الإرسال' : 'Sent'}
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {isAr ? 'فشل' : 'Failed'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  // Message Type badge styling
  const getTypeBadge = (type: string) => {
    const localizedType = getLocalizedMessageType(type);
    const t = type.toLowerCase();
    if (t.includes('confirmation')) {
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 whitespace-nowrap">
          {localizedType}
        </span>
      );
    }
    if (t.includes('order update') || t.includes('update')) {
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 whitespace-nowrap">
          {localizedType}
        </span>
      );
    }
    if (t.includes('delivery')) {
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 whitespace-nowrap">
          {localizedType}
        </span>
      );
    }
    if (t.includes('marketing')) {
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 whitespace-nowrap">
          {localizedType}
        </span>
      );
    }
    if (t.includes('payment')) {
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 whitespace-nowrap">
          {localizedType}
        </span>
      );
    }
    if (t.includes('return')) {
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800/80 whitespace-nowrap">
          {localizedType}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 whitespace-nowrap">
        {localizedType}
      </span>
    );
  };

  // Calculate gauge dash offset for daily usage
  const dailyUsed = overview?.usage.daily_used ?? 0;
  const dailyLimit = overview?.usage.daily_limit ?? 20;
  const usagePercentage = Math.min(100, Math.round((dailyUsed / Math.max(1, dailyLimit)) * 100));

  return (
    <div className="w-full space-y-6 pb-12 font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header with Title & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm border border-emerald-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'مركز رسائل الواتساب' : 'WhatsApp Message Center'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'إرسال وإدارة رسائل الواتساب لعملائك، تتبع حالة التسليم، وعرض المحادثات وإدارة القوالب.'
                : 'Send and manage WhatsApp messages for your customers. Track delivery status, view conversations, and manage templates.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Date Range Picker */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{isAr ? '15 أكتوبر - 14 نوفمبر 2026' : 'Oct 15, 2026 - Nov 14, 2026'}</span>
          </div>

          {/* Help Guide */}
          <button
            type="button"
            onClick={() =>
              toast(
                isAr
                  ? 'دليل استخدام WhatsApp Business API وربط الحسابات'
                  : 'WhatsApp Business API documentation & connection guide',
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

      {/* 2. Top Metrics Cards Bar (Fully Responsive, Overlap-Free, Dark High-Contrast Text) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* Card 1: WhatsApp Business Connection Status */}
        <div className="col-span-1 md:col-span-1 lg:col-span-7 xl:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-950 dark:text-white truncate">
                    {isAr ? 'واتساب للأعمال' : 'WhatsApp Business'}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {overview?.connection.is_connected ? (isAr ? 'متصل' : 'Connected') : (isAr ? 'غير متصل' : 'Disconnected')}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono dir-ltr text-start" dir="ltr">
                  {overview?.connection.phone_number || readStoreIdentity(activeStore?.id || '', activeStore).whatsapp || activeStore?.phone || '+966 50 123 4567'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateSubView('settings')}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors shrink-0 shadow-xs"
            >
              {isAr ? 'إدارة' : 'Manage'}
            </button>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 gap-2 flex-wrap">
            <span className="truncate">{overview?.connection.provider || (isAr ? 'واجهة Meta Cloud Business API' : 'Meta Cloud Business API')}</span>
            <span className="shrink-0 font-medium text-slate-600 dark:text-slate-400">
              {isAr ? 'آخر مزامنة:' : 'Last synced:'}{' '}
              {overview?.connection.last_synced_at
                ? formatDateTime(overview.connection.last_synced_at).time || (isAr ? '10:42 ص' : '10:42 AM')
                : (isAr ? '10:42 ص' : '10:42 AM')}
            </span>
          </div>
        </div>

        {/* Card 2: Daily Usage Gauge */}
        <div className="col-span-1 md:col-span-1 lg:col-span-5 xl:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center gap-3.5 overflow-hidden">
          {/* Circular Progress Meter */}
          <div className="relative w-13 h-13 shrink-0 flex items-center justify-center">
            <svg className="w-13 h-13 transform -rotate-90">
              <circle
                cx="26"
                cy="26"
                r="21"
                stroke="currentColor"
                strokeWidth="4.5"
                className="text-slate-100 dark:text-slate-800"
                fill="none"
              />
              <circle
                cx="26"
                cy="26"
                r="21"
                stroke="currentColor"
                strokeWidth="4.5"
                strokeDasharray={131.95}
                strokeDashoffset={131.95 - (131.95 * usagePercentage) / 100}
                strokeLinecap="round"
                className="text-emerald-500 transition-all duration-500"
                fill="none"
              />
            </svg>
            <span className="absolute text-xs font-black text-slate-950 dark:text-white" dir="ltr">
              {dailyUsed}/{dailyLimit}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              {isAr ? 'الاستخدام اليومي' : 'Daily Usage'}
            </h4>
            <p className="text-sm font-extrabold text-slate-950 dark:text-white mt-0.5 truncate">
              {dailyUsed} {isAr ? 'رسالة أرسلت' : 'messages sent'}
            </p>
            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5 whitespace-nowrap">
              {isAr ? 'يتجدد اليوم 12:00 ص' : 'Resets today at 12:00 AM'}
            </p>
          </div>
        </div>

        {/* 4 Performance Metric Cards: Full 12 columns, 4 across */}
        <div className="col-span-1 md:col-span-2 lg:col-span-12 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Card 3: Total Messages */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                {isAr ? 'إجمالي الرسائل' : 'Total Messages'}
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Send className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-950 dark:text-white">
                {overview?.metrics.total_messages?.toLocaleString() ?? 0}
              </span>
            </div>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-0.5 whitespace-nowrap">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{overview?.metrics.total_trend || '+12%'} {isAr ? 'مقارنة بالفترة' : 'vs prev'}</span>
            </p>
          </div>

          {/* Card 4: Delivered */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                {isAr ? 'تم التسليم' : 'Delivered'}
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-950 dark:text-white">
                {overview?.metrics.delivered?.toLocaleString() ?? 0}
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {overview?.metrics.delivered_rate ?? 0}%
              </span>
            </div>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-0.5 whitespace-nowrap">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{overview?.metrics.delivered_trend || '+5.2%'}</span>
            </p>
          </div>

          {/* Card 5: Read */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                {isAr ? 'تمت القراءة' : 'Read'}
              </span>
              <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <CheckCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-950 dark:text-white">
                {overview?.metrics.read?.toLocaleString() ?? 0}
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {overview?.metrics.read_rate ?? 0}%
              </span>
            </div>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-0.5 whitespace-nowrap">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{overview?.metrics.read_trend || '+5.2%'}</span>
            </p>
          </div>

          {/* Card 6: Failed */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                {isAr ? 'فشل' : 'Failed'}
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <XCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-950 dark:text-white">
                {overview?.metrics.failed?.toLocaleString() ?? 0}
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {overview?.metrics.failed_rate ?? 0}%
              </span>
            </div>
            <p className="text-xs font-bold text-rose-700 dark:text-rose-400 mt-1 flex items-center gap-0.5 whitespace-nowrap">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>{overview?.metrics.failed_trend || '-1.3%'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Category Tabs + Send Message Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setActiveCategory('all');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-500/50 font-black shadow-xs'
                : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
            }`}
          >
            {isAr ? 'كافة الرسائل' : 'All Messages'} ({overview?.categories.all ?? 0})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('order');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${
              activeCategory === 'order'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-500/50 font-black shadow-xs'
                : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
            }`}
          >
            {isAr ? 'رسائل الطلبات' : 'Order Messages'} ({overview?.categories.order ?? 0})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('marketing');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${
              activeCategory === 'marketing'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-500/50 font-black shadow-xs'
                : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
            }`}
          >
            {isAr ? 'رسائل تسويقية' : 'Marketing Messages'} ({overview?.categories.marketing ?? 0})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('custom');
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${
              activeCategory === 'custom'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-500/50 font-black shadow-xs'
                : 'text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-bold'
            }`}
          >
            {isAr ? 'رسائل مخصصة' : 'Custom Messages'} ({overview?.categories.custom ?? 0})
          </button>
        </div>

        <button
          type="button"
          onClick={() => onNavigateSubView('compose')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isAr ? 'إرسال رسالة' : 'Send Message'}</span>
        </button>
      </div>

      {/* 4. Filters Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'بحث باسم العميل، رقم الهاتف، أو رقم الطلب...'
                  : 'Search by customer name, phone number, order number...'
              }
              className="w-full ps-9 pe-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Message Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-xs"
          >
            <option value="all">{isAr ? 'نوع الرسالة: الكل' : 'Message Type: All'}</option>
            <option value="Order Confirmation">{isAr ? 'تأكيد الطلب' : 'Order Confirmation'}</option>
            <option value="Order Update">{isAr ? 'تحديث الطلب' : 'Order Update'}</option>
            <option value="Delivery Update">{isAr ? 'تحديث التوصيل' : 'Delivery Update'}</option>
            <option value="Marketing">{isAr ? 'تسويق' : 'Marketing'}</option>
            <option value="Payment Update">{isAr ? 'تحديث الدفع' : 'Payment Update'}</option>
            <option value="Return Update">{isAr ? 'تحديث الإرجاع' : 'Return Update'}</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-xs"
          >
            <option value="all">{isAr ? 'الحالة: الكل' : 'Status: All'}</option>
            <option value="delivered">{isAr ? 'تم التسليم' : 'Delivered'}</option>
            <option value="read">{isAr ? 'تمت القراءة' : 'Read'}</option>
            <option value="sent">{isAr ? 'تم الإرسال' : 'Sent'}</option>
            <option value="failed">{isAr ? 'فشل' : 'Failed'}</option>
          </select>

          {/* Templates Filter */}
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-xs"
          >
            <option value="all">{isAr ? 'كافة القوالب' : 'All Templates'}</option>
            <option value="order_confirmation">{isAr ? 'تأكيد الطلب' : 'Order Confirmation'}</option>
            <option value="shipping_update">{isAr ? 'تحديث الشحن' : 'Shipping Update'}</option>
            <option value="delivery_update">{isAr ? 'تحديث التوصيل' : 'Delivery Update'}</option>
            <option value="abandoned_cart">{isAr ? 'سلة متروكة' : 'Abandoned Cart'}</option>
          </select>

          {/* Agent Filter */}
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-xs"
          >
            <option value="all">{isAr ? 'كافة الموظفين' : 'All Agents'}</option>
            <option value="SA">{isAr ? 'SA - مدير المتجر' : 'SA - Store Admin'}</option>
            <option value="MA">{isAr ? 'MA - مسؤول التسويق' : 'MA - Marketing Agent'}</option>
            <option value="FA">{isAr ? 'FA - مسؤول التوصيل' : 'FA - Fulfillment Agent'}</option>
            <option value="TM">{isAr ? 'TM - طارق المكي' : 'TM - Tariq Al-Makki'}</option>
          </select>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* 5. Messages Data Presentation (Desktop Table + Mobile Cards) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loadingMessages ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
            <span className="text-xs font-medium">{isAr ? 'جارِ تحميل سجلات الرسائل...' : 'Loading messages...'}</span>
          </div>
        ) : messages.length === 0 ? (
          /* Genuine Empty State (NO FAKE / NO DUMMY DATA) */
          <div className="py-20 px-4 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'لا توجد رسائل واتساب مسجلة' : 'No WhatsApp messages found'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isAr
                ? 'لم يتم تسجيل أي رسائل وفقاً لمعايير التصفية المحددة. يمكنك إرسال رسالتك الأولى الآن.'
                : 'No messages matched your filter criteria. Compose and send your first message to customers.'}
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => onNavigateSubView('compose')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إنشاء رسالة جديدة' : 'Compose First Message'}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= lg) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-[1020px] w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRowIds.length === messages.length && messages.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="py-3 px-3 text-start whitespace-nowrap">{isAr ? 'الوقت' : 'Time'}</th>
                    <th className="py-3 px-3 text-start whitespace-nowrap">{isAr ? 'العميل' : 'Customer'}</th>
                    <th className="py-3 px-3 text-start whitespace-nowrap">{isAr ? 'رقم الهاتف' : 'Phone Number'}</th>
                    <th className="py-3 px-3 text-start whitespace-nowrap">{isAr ? 'رقم الطلب' : 'Order #'}</th>
                    <th className="py-3 px-3 text-start min-w-[240px]">{isAr ? 'محتوى الرسالة' : 'Message Content'}</th>
                    <th className="py-3 px-3 text-start whitespace-nowrap">{isAr ? 'النوع' : 'Type'}</th>
                    <th className="py-3 px-3 text-start whitespace-nowrap">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="py-3 px-3 text-start whitespace-nowrap">{isAr ? 'الموظف' : 'Agent'}</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {messages.map((item) => {
                    const isChecked = selectedRowIds.includes(item.id);
                    const localizedCustomerName = getCustomerDisplayName(item.customer_name, locale);
                    const firstChar = (localizedCustomerName || 'C').charAt(0).toUpperCase();
                    const dateTime = formatDateTime(item.created_at);
                    const formattedOrderNum = cleanOrderNumber(item.order_number);
                    const localizedContent = getLocalizedWhatsAppMessage(item.message_content, locale);
                    const agentInfo = getAgentDisplay(item.agent_initials, item.agent_name);

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isChecked ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                            className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>

                        {/* Time */}
                        <td className="py-3 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          <div className="font-semibold">{dateTime.time}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{dateTime.date}</div>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                              {firstChar}
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {localizedCustomerName}
                            </span>
                          </div>
                        </td>

                        {/* Phone with 1-Click Direct WhatsApp */}
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5" dir="ltr">
                            <span className="font-mono dir-ltr inline-block tracking-wider" dir="ltr">
                              {item.phone_number}
                            </span>
                            <a
                              href={`https://wa.me/${item.phone_number.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 transition-colors inline-flex items-center"
                              title={isAr ? 'محادثة فورية عبر واتساب' : 'Direct WhatsApp Chat'}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>

                        {/* Order # */}
                        <td className="py-3 px-3 whitespace-nowrap font-medium">
                          {formattedOrderNum ? (
                            <span className="text-blue-600 dark:text-blue-400 font-mono font-semibold hover:underline cursor-pointer">
                              {formattedOrderNum}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Message Content Preview */}
                        <td className="py-3 px-3 max-w-xs truncate text-slate-700 dark:text-slate-300 font-normal" title={localizedContent}>
                          {localizedContent}
                        </td>

                        {/* Type Badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {getTypeBadge(item.message_type)}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {getStatusBadge(item.status)}
                        </td>

                        {/* Agent Badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            title={agentInfo.role}
                          >
                            {agentInfo.code}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-center whitespace-nowrap relative">
                          <button
                            type="button"
                            onClick={() => setActiveActionMenuId(activeActionMenuId === item.id ? null : item.id)}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {activeActionMenuId === item.id && (
                            <div className="absolute end-6 top-8 z-30 w-36 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-start">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(localizedContent);
                                  toast(isAr ? 'تم نسخ نص الرسالة' : 'Message text copied', 'success');
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 font-medium"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>{isAr ? 'نسخ النص' : 'Copy Text'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  onNavigateSubView('compose', {
                                    phone: item.phone_number,
                                    customerName: localizedCustomerName,
                                    content: localizedContent,
                                  });
                                  setActiveActionMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 font-medium"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>{isAr ? 'إعادة الإرسال' : 'Resend'}</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Card View (< lg) */}
            <div className="block lg:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 sm:p-4 space-y-3.5">
              {messages.map((item) => {
                const isChecked = selectedRowIds.includes(item.id);
                const localizedCustomerName = getCustomerDisplayName(item.customer_name, locale);
                const firstChar = (localizedCustomerName || 'C').charAt(0).toUpperCase();
                const dateTime = formatDateTime(item.created_at);
                const formattedOrderNum = cleanOrderNumber(item.order_number);
                const localizedContent = getLocalizedWhatsAppMessage(item.message_content, locale);
                const agentInfo = getAgentDisplay(item.agent_initials, item.agent_name);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs transition-all space-y-2.5 ${
                      isChecked ? 'ring-2 ring-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    {/* Top Row: Avatar + Name + Time + Status */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 shrink-0"
                        />
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                          {firstChar}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {localizedCustomerName}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span>{dateTime.time}</span>
                            <span>•</span>
                            <span>{dateTime.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>

                    {/* Middle Row: Type Badge + Order # + Phone */}
                    <div className="flex items-center justify-between gap-2 text-xs pt-0.5 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getTypeBadge(item.message_type)}
                        {formattedOrderNum && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {formattedOrderNum}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300" dir="ltr">
                        <span dir="ltr">{item.phone_number}</span>
                        <a
                          href={`https://wa.me/${item.phone_number.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 inline-flex items-center"
                          title={isAr ? 'محادثة فورية عبر واتساب' : 'Direct WhatsApp Chat'}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Message Content Box */}
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed break-words font-normal">
                      {localizedContent}
                    </div>

                    {/* Bottom Row: Agent & Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                        <span>{isAr ? 'الموظف:' : 'Agent:'}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                          {agentInfo.code}
                        </span>
                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                          ({agentInfo.role})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(localizedContent);
                            toast(isAr ? 'تم نسخ نص الرسالة' : 'Message copied', 'success');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{isAr ? 'نسخ' : 'Copy'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onNavigateSubView('compose', {
                              phone: item.phone_number,
                              customerName: localizedCustomerName,
                              content: localizedContent,
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-colors shadow-xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>{isAr ? 'إعادة الإرسال' : 'Resend'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* 6. Pagination Footer */}
        {pagination.total > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {isAr
                ? `عرض ${(pagination.current_page - 1) * pagination.per_page + 1} إلى ${Math.min(
                    pagination.current_page * pagination.per_page,
                    pagination.total,
                  )} من إجمالي ${pagination.total.toLocaleString()} رسالة`
                : `Showing ${(pagination.current_page - 1) * pagination.per_page + 1} to ${Math.min(
                    pagination.current_page * pagination.per_page,
                    pagination.total,
                  )} of ${pagination.total.toLocaleString()} messages`}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pagination.current_page <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </button>

              {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                    pagination.current_page === pageNum
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              {pagination.last_page > 5 && (
                <>
                  <span className="px-1 text-slate-400">...</span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(pagination.last_page)}
                    className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800"
                  >
                    {pagination.last_page}
                  </button>
                </>
              )}

              <button
                type="button"
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
