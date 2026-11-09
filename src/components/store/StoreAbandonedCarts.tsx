import React, { useState, useMemo } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { GlobalModal } from '../common/GlobalModal';
import {
  ShoppingCart,
  Clock,
  Send,
  AlertCircle,
  Calendar,
  CheckCircle2,
  DollarSign,
  Download,
  Filter,
  Plus,
  Search,
  Settings,
  Briefcase,
  Eye,
  MoreVertical,
  Mail,
  Smartphone,
  Edit2,
  X,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Info,
  Sliders,
  ShieldCheck,
  Check,
  Package,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Percent,
  Tag,
  Link,
  Smile,
  Image,
  Bold,
  Italic,
  GitBranch,
} from 'lucide-react';
import { formatRelativeTime } from '../../notification-system/utils/dateFilters';
import { parseOrderDate, periodCountGrowth } from '../../utils/liveSeries';
import { WhatsAppBrandIcon } from '../common/BrandIcons';
import { downloadCsv } from '../../utils/exportSpreadsheet';
import {
  readAbandonedCartSequence,
  writeAbandonedCartSequence,
  type AbandonedCartSequenceConfig,
} from '../../utils/abandonedCartSequenceConfig';
import * as tenantApi from '../../api/tenantApi';

interface StoreAbandonedCartsProps {
  onNavigateTab?: (tab: string) => void;
}

export const StoreAbandonedCarts: React.FC<StoreAbandonedCartsProps> = ({ onNavigateTab }) => {
  const { activeStore, currentOrders, currentProducts, allStoreCustomers } = useTenant();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();

  // Selected reminder to edit (first, second, third, or null) — opens popup modal
  const [editingReminder, setEditingReminder] = useState<'first' | 'second' | 'third' | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [activeLang, setActiveLang] = useState<'EN' | 'AR'>(isAr ? 'AR' : 'EN');

  // Preview cart details modal
  const [viewingCart, setViewingCart] = useState<any | null>(null);

  // Services modal state
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Reminder templates — persisted per store_id
  const [reminders, setReminders] = useState<AbandonedCartSequenceConfig>(() =>
    readAbandonedCartSequence(activeStore.id),
  );

  React.useEffect(() => {
    setReminders(readAbandonedCartSequence(activeStore.id));
    setActiveLang(isAr ? 'AR' : 'EN');
    let cancelled = false;
    tenantApi
      .fetchStoreSettingsApi(activeStore.id)
      .then((settings) => {
        if (cancelled) return;
        const remote = settings?.abandoned_cart_sequence;
        if (remote && typeof remote === 'object') {
          const merged = {
            ...readAbandonedCartSequence(activeStore.id),
            ...(remote as Partial<AbandonedCartSequenceConfig>),
          } as AbandonedCartSequenceConfig;
          writeAbandonedCartSequence(activeStore.id, merged);
          setReminders(merged);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [activeStore.id, isAr]);

  const persistReminders = async (next: AbandonedCartSequenceConfig) => {
    setReminders(next);
    writeAbandonedCartSequence(activeStore.id, next);
    try {
      const current = await tenantApi.fetchStoreSettingsApi(activeStore.id);
      await tenantApi.updateStoreSettingsApi(activeStore.id, {
        ...current,
        abandoned_cart_sequence: next,
      });
    } catch {
      /* local memory kept */
    }
  };

  // Automation Settings State
  const [automationSettings, setAutomationSettings] = useState({
    enabled: true,
    timeZone: '(GMT+03:00) Riyadh',
    sendStart: '09:00 AM',
    sendEnd: '09:00 PM',
    minCartValue: '50.00',
  });

  // Automation Rules State
  const [automationRules, setAutomationRules] = useState({
    startTiming: '1 hour',
    stopCondition: 'Order is completed',
    excludeCondition: 'Customers with active orders',
    maxReminders: '3 reminders',
    reminderInterval: '24 hours',
  });

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedCartIds, setSelectedCartIds] = useState<string[]>([]);
  const [variableDropdownOpen, setVariableDropdownOpen] = useState(false);

  // Real store customers and pending/abandoned orders
  const storeCustomers = (allStoreCustomers && allStoreCustomers[activeStore.id]) || [];

  // Derive real abandoned carts from orders that are in pending/draft/uncompleted state
  const abandonedCarts = useMemo(() => {
    const list = currentOrders
      .filter((o) => o.status === 'pending')
      .map((o) => {
        const cust = storeCustomers.find((c) => c.id === (o as any).customerId || (o.customerEmail && c.email === o.customerEmail) || (o.customerPhone && c.phone === o.customerPhone));
        return {
          id: o.id,
          customerName: o.customerName || (cust ? cust.name : isAr ? 'عميل زائر' : 'Guest Customer'),
          customerEmail: o.customerEmail || (cust ? cust.email : '') || '—',
          customerPhone: o.customerPhone || (cust ? cust.phone : '') || '—',
          cartValue: o.total || 0,
          source: (o as any).source || 'Online Store',
          abandonedAt: o.createdAt || o.date || new Date().toISOString(),
          lastActivity: (() => {
            const ts = o.createdAt || (o.date && o.time ? `${o.date} ${o.time}` : o.date);
            return ts ? formatRelativeTime(String(ts), locale) : (isAr ? 'الآن' : 'Just now');
          })(),
          status: 'Recoverable' as const,
          remindersSent: 0,
          itemsCount: o.items?.length || 1,
          items: o.items || [],
        };
      });
    return list;
  }, [currentOrders, storeCustomers, isAr, locale]);

  const currentTemplate = editingReminder ? reminders[editingReminder] : null;

  const activeTemplateMessage =
    currentTemplate &&
    (activeLang === 'AR'
      ? currentTemplate.messageAr || currentTemplate.message
      : currentTemplate.message || currentTemplate.messageAr || '');

  const activeTemplateTitle =
    currentTemplate &&
    (activeLang === 'AR'
      ? currentTemplate.titleAr || currentTemplate.title
      : currentTemplate.title || currentTemplate.titleAr || '');

  // Live formatted text for channel preview (uses this store’s first abandoned cart when available)
  const livePreviewText = useMemo(() => {
    if (!currentTemplate || !activeTemplateMessage) return '';
    const sample = abandonedCarts[0];
    const checkoutPath = activeStore.slug ? `/${activeStore.slug}/checkout` : '/checkout';
    const storeLabel = isAr
      ? activeStore.nameAr || activeStore.name || 'متجرك'
      : activeStore.name || activeStore.nameAr || 'Your Store';
    return activeTemplateMessage
      .replace(/\{name\}/g, sample?.customerName || (isAr ? '«اسم العميل»' : '«customer name»'))
      .replace(/\{cart_value\}/g, sample ? money(sample.cartValue) : isAr ? '«قيمة السلة»' : '«cart value»')
      .replace(/\{checkout_link\}/g, checkoutPath)
      .replace(/\{store_name\}/g, storeLabel)
      .replace(/\{discount_code\}/g, isAr ? '«كود الخصم»' : '«discount code»')
      .replace(
        /\{products\}/g,
        sample
          ? isAr
            ? `${sample.itemsCount} منتجات`
            : `${sample.itemsCount} products`
          : isAr
            ? '٠ منتجات'
            : '0 products',
      )
      .replace(
        /\{product_list\}/g,
        sample?.items?.length
          ? sample.items
              .map(
                (it: any) =>
                  (isAr ? it.nameAr || it.name || it.nameEn : it.name || it.nameEn || it.nameAr) || '',
              )
              .filter(Boolean)
              .join(isAr ? '، ' : ', ')
          : isAr
            ? 'لا توجد منتجات'
            : 'No products',
      );
  }, [
    currentTemplate,
    activeTemplateMessage,
    activeStore.name,
    activeStore.nameAr,
    activeStore.slug,
    isAr,
    abandonedCarts,
    money,
  ]);

  // Filtered abandoned carts
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return abandonedCarts.filter((cart) => {
      const matchSearch =
        !q ||
        cart.customerName.toLowerCase().includes(q) ||
        cart.customerEmail.toLowerCase().includes(q) ||
        cart.customerPhone.includes(q);
      const matchStatus = statusFilter === 'all' || cart.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [abandonedCarts, search, statusFilter]);

  // Statistics calculated from real store data
  const totalCarts = abandonedCarts.length;
  const recoverableValue = abandonedCarts.reduce((acc, c) => acc + c.cartValue, 0);
  const cartsGrowth = useMemo(
    () => periodCountGrowth(abandonedCarts, (c) => parseOrderDate(c.abandonedAt)),
    [abandonedCarts],
  );
  // Pending carts are currently all recoverable; recovered reminders not tracked yet → 0
  const recoveredCount = 0;
  const recoverablePct = totalCarts > 0 ? 100 : 0;
  const recoveredPct = totalCarts > 0 ? Math.round((recoveredCount / totalCarts) * 1000) / 10 : 0;

  // Pagination
  const lastPage = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // Export CSV — real cart rows; Excel-safe BOM + sep=,
  const handleExportCsv = () => {
    if (filtered.length === 0) {
      toast(isAr ? 'لا توجد بيانات سلات للتصدير' : 'No carts to export', 'info');
      return;
    }
    const header = isAr
      ? ['المعرف', 'العميل', 'البريد الإلكتروني', 'الهاتف', 'قيمة السلة', 'المصدر', 'التاريخ', 'الحالة']
      : ['ID', 'Customer', 'Email', 'Phone', 'Cart Value', 'Source', 'Date', 'Status'];
    const rows = filtered.map((c) => [
      String(c.id ?? ''),
      String(c.customerName ?? ''),
      String(c.customerEmail ?? ''),
      String(c.customerPhone ?? ''),
      String(c.cartValue ?? ''),
      String(c.source ?? ''),
      String(c.abandonedAt ?? ''),
      String(c.status ?? ''),
    ]);
    downloadCsv(`abandoned-carts-${activeStore.id}.csv`, [header, ...rows]);
    toast(isAr ? `تم تصدير ${filtered.length} سلة بنجاح` : `Exported ${filtered.length} carts`, 'success');
  };

  const handleSendManualReminder = (cartId: string, name: string) => {
    toast(
      isAr
        ? `تم جدولة إرسال تذكير سلة للعميل${name}`
        : `Cart recovery reminder scheduled for ${name}`,
      'success'
    );
  };

  const openReminderEditor = (key: 'first' | 'second' | 'third') => {
    setEditingReminder(key);
    setSelectedChannel(reminders[key].channel);
    setVariableDropdownOpen(false);
  };

  const channelLabel = (ch: 'whatsapp' | 'sms' | 'email') =>
    ch === 'whatsapp'
      ? isAr
        ? 'واتساب'
        : 'WhatsApp'
      : ch === 'sms'
        ? isAr
          ? 'رسائل قصيرة'
          : 'SMS'
        : isAr
          ? 'البريد الإلكتروني'
          : 'Email';

  const selectPreviewChannel = (ch: 'whatsapp' | 'sms' | 'email') => {
    setSelectedChannel(ch);
    if (!editingReminder) return;
    setReminders((prev) => ({
      ...prev,
      [editingReminder]: { ...prev[editingReminder], channel: ch },
    }));
  };

  const insertVariableIntoMessage = (variable: string) => {
    if (!editingReminder) return;
    const step = reminders[editingReminder];
    if (activeLang === 'AR') {
      const prev = step.messageAr || step.message || '';
      setReminders({
        ...reminders,
        [editingReminder]: {
          ...step,
          messageAr: `${prev}${prev ? ' ' : ''}${variable}`,
        },
      });
    } else {
      const prev = step.message || '';
      setReminders({
        ...reminders,
        [editingReminder]: {
          ...step,
          message: `${prev}${prev ? ' ' : ''}${variable}`,
        },
      });
    }
    setVariableDropdownOpen(false);
  };

  return (
    <div className="u-page p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-800 dark:text-slate-100 w-full min-w-0">
      {/* 1. Page Header matching Reference Screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            <span>{isAr ? 'السلات المتروكة' : 'Abandoned Carts'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? 'عرض وإدارة السلات غير المكتملة، إرسال تذكيرات آلية واستعادة المبيعات'
              : 'View and manage abandoned carts, send reminders and recover lost sales'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => openReminderEditor('first')}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>{isAr ? 'إعدادات التذكير' : 'Reminder Settings'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowServicesModal(true)}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Briefcase className="w-4 h-4 text-slate-500" />
            <span>{isAr ? 'الخدمات' : 'Services'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2 bg-[#0EA5A4] hover:bg-[#0c8f8e] text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isAr ? 'تصدير السلات المتروكة' : 'Export Abandoned Carts'}</span>
          </button>
        </div>
      </div>

      {/* 2. 7 KPI Stat Cards Matching Reference Screenshot Exactly */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Carts */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold">{isAr ? 'إجمالي السلات' : 'Total Carts'}</span>
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <ShoppingCart className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
            {totalCarts}
          </div>
          {cartsGrowth.hasData ? (
            <span className={`text-[10px] flex items-center gap-0.5 font-bold ${
              cartsGrowth.pct >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-500 dark:text-rose-400'
            }`}>
              {cartsGrowth.pct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(cartsGrowth.pct)}% {isAr ? 'مقارنة بالسابق' : 'vs prev'}</span>
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium">
              {isAr ? 'لا بيانات مقارنة بعد' : 'No comparison data yet'}
            </span>
          )}
        </div>

        {/* New Carts */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold">{isAr ? 'سلات جديدة' : 'New Carts'}</span>
            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <User className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
            {totalCarts}
          </div>
          <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold">
            + {isAr ? 'جديد' : 'New'}
          </span>
        </div>

        {/* Reminder Sent */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold">{isAr ? 'تم الإرسال' : 'Reminder Sent'}</span>
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Send className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
            0
          </div>
          <span className="inline-block px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 text-[9px] font-bold">
            ◆ {isAr ? 'تم الإرسال' : 'Sent'}
          </span>
        </div>

        {/* Reminder Failed */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold">{isAr ? 'فشل الإرسال' : 'Reminder Failed'}</span>
            <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
            0
          </div>
          <span className="inline-block px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 text-[9px] font-bold">
            ◆ {isAr ? 'فشل' : 'Failed'}
          </span>
        </div>

        {/* Scheduled */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold">{isAr ? 'مجدول' : 'Scheduled'}</span>
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
            0
          </div>
          <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 text-[9px] font-bold">
            ◆ {isAr ? 'مجدول' : 'Scheduled'}
          </span>
        </div>

        {/* Recovered Carts */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold">{isAr ? 'سلات مستردة' : 'Recovered Carts'}</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
            0
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" />
            <span>{recoveredPct}%</span>
          </span>
        </div>

        {/* Recoverable Carts */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold">{isAr ? 'سلات قابلة للاسترداد' : 'Recoverable Carts'}</span>
            <span className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <ShoppingCart className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums truncate">
            {totalCarts}
          </div>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" />
            <span>{recoverablePct}%</span>
          </span>
        </div>
      </div>

      {/* 3. Main Abandoned Carts Table Section matching Reference Screenshot */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Action and Filter Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                className="appearance-none px-3 py-1.5 pe-7 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'send') {
                    if (selectedCartIds.length === 0) {
                      toast(isAr ? 'يرجى تحديد سلة واحدة على الأقل' : 'Select at least one cart', 'info');
                    } else {
                      toast(
                        isAr
                          ? `تم إرسال تذكيرات لـ${selectedCartIds.length}سلة`
                          : `Sent reminders to ${selectedCartIds.length} carts`,
                        'success'
                      );
                      setSelectedCartIds([]);
                    }
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>{isAr ? 'إجراءات' : 'Actions'}</option>
                <option value="send">{isAr ? 'إرسال تذكير للمحددين' : 'Send Reminder'}</option>
                <option value="export">{isAr ? 'تصدير المحدد' : 'Export Selected'}</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute end-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="button"
              disabled={selectedCartIds.length === 0}
              onClick={() => {
                toast(
                  isAr
                    ? `تم جدولة إرسال التذكيرات لـ${selectedCartIds.length}سلة`
                    : `Reminders scheduled for ${selectedCartIds.length} carts`,
                  'success'
                );
                setSelectedCartIds([]);
              }}
              className="px-3.5 py-1.5 bg-[#0EA5A4] hover:bg-[#0c8f8e] text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isAr ? 'إرسال تذكير' : 'Send Reminder'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? 'ابحث باسم العميل أو البريد أو الهاتف...' : 'Search by customer name, email or phone...'}
                className="w-64 sm:w-72 px-3 py-1.5 ps-8 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <button
              type="button"
              onClick={() => {
                setStatusFilter(statusFilter === 'all' ? 'Recoverable' : 'all');
              }}
              className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
              title={isAr ? 'تصفية' : 'Filter'}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-[11px] bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-4 text-start w-8">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedCartIds.length === filtered.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedCartIds(filtered.map((c) => c.id));
                      else setSelectedCartIds([]);
                    }}
                    className="rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                  />
                </th>
                <th className="py-3 px-3 text-start">{isAr ? 'العميل' : 'Customer'}</th>
                <th className="py-3 px-3 text-start">{isAr ? 'المنتجات' : 'Products'}</th>
                <th className="py-3 px-3 text-end">{isAr ? 'قيمة السلة' : 'Cart Value'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'المصدر' : 'Source'}</th>
                <th className="py-3 px-3 text-start">{isAr ? 'تاريخ الترك' : 'Abandoned At'}</th>
                <th className="py-3 px-3 text-start">{isAr ? 'آخر نشاط' : 'Last Activity'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'التذكيرات' : 'Reminders'}</th>
                <th className="py-3 px-4 text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30 text-teal-600" />
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                      {isAr ? 'لا توجد سلات متروكة حالياً' : 'No Abandoned Carts Found'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      {isAr
                        ? 'عندما يقوم أي عميل بإضافة منتجات إلى السلة دون إتمام الطلب، ستظهر تفاصيلها هنا تلقائياً مع تتبع التذكيرات الآلية.'
                        : 'When customers add products to their cart without checking out, their carts will automatically appear here with automated recovery tracking.'}
                    </p>
                  </td>
                </tr>
              ) : (
                pageRows.map((cart) => (
                  <tr
                    key={cart.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 text-start">
                      <input
                        type="checkbox"
                        checked={selectedCartIds.includes(cart.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedCartIds([...selectedCartIds, cart.id]);
                          else setSelectedCartIds(selectedCartIds.filter((id) => id !== cart.id));
                        }}
                        className="rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                      />
                    </td>
                    <td className="py-3 px-3 text-start">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold shrink-0">
                          {cart.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white leading-tight">
                            {cart.customerName}
                          </div>
                          <div className="text-[11px] text-slate-400 leading-tight">
                            {cart.customerEmail}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight">
                            {cart.customerPhone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-start">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                          <Package className="w-3.5 h-3.5" />
                        </div>
                        <span className="inline-block px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                          +{cart.itemsCount}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-end font-bold text-slate-900 dark:text-white tabular-nums">
                      {money(cart.cartValue)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {cart.source}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-start text-slate-500 text-[11px]">
                      {cart.abandonedAt.slice(0, 10)}
                    </td>
                    <td className="py-3 px-3 text-start text-slate-500 text-[11px]">
                      {cart.lastActivity}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {isAr ? 'قابلة للاسترداد' : cart.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-[11px] text-slate-500">
                      <span className="text-teal-600 dark:text-teal-400 font-semibold">1/3 sent</span>
                      <div className="text-[10px] text-slate-400">Next in 22h</div>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingCart(cart)}
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title={isAr ? 'عرض التفاصيل' : 'View Details'}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendManualReminder(cart.id, cart.customerName)}
                          className="p-1.5 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition-colors cursor-pointer"
                          title={isAr ? 'إرسال تذكير' : 'Send Reminder'}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            toast(isAr ? 'خيارات إضافية' : 'More options', 'info');
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar matching reference screenshot */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            {isAr
              ? `عرض 1 إلى${pageRows.length}من أصل${filtered.length}سلة`
              : `Showing 1 to ${pageRows.length} of ${filtered.length} results`}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
            <span className="px-3 py-1 bg-[#0EA5A4] text-white font-bold rounded-lg text-xs">
              {page}
            </span>
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Edit Reminder popup modal — opened from Reminder Sequence */}
      {editingReminder && currentTemplate && (
          <GlobalModal
            isOpen
            onClose={() => {
              setEditingReminder(null);
              setVariableDropdownOpen(false);
            }}
            dir={isAr ? 'rtl' : 'ltr'}
            aria-label={isAr ? 'تعديل التذكير' : 'Edit Reminder'}
            contentClassName="max-w-6xl"
          >
          <div className="w-full rounded-2xl border border-teal-200 dark:border-teal-800/80 overflow-hidden bg-white dark:bg-slate-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[min(92dvh,900px)] overflow-y-auto">
            {/* Light Teal Header Banner matching reference */}
            <div className="sticky top-0 z-10 bg-[#d1f4f0] dark:bg-teal-950/80 border-b border-teal-200 dark:border-teal-800/80 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-teal-900 dark:text-teal-200 font-bold text-sm">
                <Edit2 className="w-4 h-4 text-teal-700 dark:text-teal-300" />
                <span>{isAr ? 'تعديل التذكير' : 'Edit Reminder'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-200/60 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-semibold">
                  {editingReminder === 'first'
                    ? isAr ? 'التذكير الأول' : 'First Reminder'
                    : editingReminder === 'second'
                    ? isAr ? 'التذكير الثاني' : 'Second Reminder'
                    : isAr ? 'التذكير الثالث' : 'Third Reminder'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingReminder(null);
                  setVariableDropdownOpen(false);
                }}
                className="p-1 rounded-lg text-teal-800 dark:text-teal-300 hover:bg-teal-200/60 dark:hover:bg-teal-900/60 transition-colors cursor-pointer"
                title={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Device Live Preview Column (4 cols) */}
              <div className="lg:col-span-4 flex flex-col items-center">
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 self-start mb-2.5">
                  {isAr ? 'معاينة الرسالة' : 'Message Preview'}
                </span>

                {/* Channel Switch Tabs */}
                <div className="flex items-center gap-1.5 mb-4 self-start flex-wrap">
                  <button
                    type="button"
                    onClick={() => selectPreviewChannel('whatsapp')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedChannel === 'whatsapp'
                        ? 'bg-emerald-500 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {channelLabel('whatsapp')}
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPreviewChannel('sms')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedChannel === 'sms'
                        ? 'bg-blue-500 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {channelLabel('sms')}
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPreviewChannel('email')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedChannel === 'email'
                        ? 'bg-purple-500 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {channelLabel('email')}
                  </button>
                </div>

                {/* Device mockup — screen changes by selected channel */}
                <div className="w-[280px] h-[500px] bg-slate-950 rounded-[44px] p-3 shadow-xl border-4 border-slate-800 relative flex flex-col">
                  <div className="relative pt-1 pb-2 px-3 flex items-center justify-between text-[10px] text-white font-medium select-none">
                    <span>10:24</span>
                    <div className="w-24 h-4 bg-slate-900 rounded-b-xl mx-auto -mt-1" />
                    <div className="flex items-center gap-1">
                      <span className="text-[9px]">5G</span>
                      <div className="w-4 h-2 border border-white rounded-xs p-0.5">
                        <div className="h-full bg-white rounded-2xs w-3/4" />
                      </div>
                    </div>
                  </div>

                  {selectedChannel === 'whatsapp' && (
                    <div className="flex-1 bg-[#efeae2] dark:bg-[#0b141a] rounded-[30px] overflow-hidden flex flex-col text-slate-900 dark:text-slate-100 border border-black/10">
                      <div className="bg-[#075e54] dark:bg-[#1f2c34] text-white px-3 py-2 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2">
                          <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                            {activeStore.name?.charAt(0) || (isAr ? 'م' : 'S')}
                          </div>
                          <div className="leading-tight">
                            <div className="text-[11px] font-bold truncate max-w-[120px]">
                              {activeStore.name || (isAr ? 'متجرك' : 'Your Store')}
                            </div>
                            <div className="text-[9px] text-emerald-200">
                              {isAr ? 'متصل' : 'Online'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-white/80">
                          <Phone className="w-3 h-3" />
                          <MoreVertical className="w-3 h-3" />
                        </div>
                      </div>
                      <div className="flex-1 p-3 overflow-y-auto space-y-2">
                        <div className="bg-white dark:bg-[#1f2c34] p-3 rounded-2xl rounded-tl-xs shadow-xs text-xs leading-relaxed text-slate-800 dark:text-slate-100">
                          <p className="whitespace-pre-wrap text-[11px]">{livePreviewText}</p>
                          <div className="text-[9px] text-slate-400 text-end flex items-center justify-end gap-1 mt-1">
                            <span>10:24</span>
                            <span className="text-teal-600 dark:text-teal-400 font-bold">✓✓</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedChannel === 'sms' && (
                    <div className="flex-1 bg-[#f2f2f7] rounded-[30px] overflow-hidden flex flex-col text-slate-900 border border-black/10">
                      <div className="bg-white/90 border-b border-slate-200 px-3 py-2.5 flex items-center justify-between">
                        <ChevronLeft className="w-4 h-4 text-blue-500 rtl:rotate-180" />
                        <div className="text-center leading-tight">
                          <div className="text-[11px] font-bold text-slate-900 truncate max-w-[140px]">
                            {activeStore.name || (isAr ? 'متجرك' : 'Your Store')}
                          </div>
                          <div className="text-[9px] text-slate-400">
                            {isAr ? 'رسالة نصية' : 'Text Message'}
                          </div>
                        </div>
                        <MoreVertical className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div className="flex-1 p-3 overflow-y-auto">
                        <div className="max-w-[92%] ms-auto bg-[#0A84FF] text-white p-3 rounded-2xl rounded-br-sm text-[11px] leading-relaxed whitespace-pre-wrap shadow-xs">
                          {livePreviewText}
                        </div>
                        <div className="text-[9px] text-slate-400 text-end mt-1.5 px-1">10:24</div>
                      </div>
                      <div className="px-3 py-2 border-t border-slate-200 bg-white flex items-center gap-2">
                        <div className="flex-1 h-7 rounded-full bg-slate-100 border border-slate-200 px-3 text-[10px] text-slate-400 flex items-center">
                          {isAr ? 'رسالة نصية' : 'Text Message'}
                        </div>
                        <div className="w-7 h-7 rounded-full bg-[#0A84FF] flex items-center justify-center">
                          <Send className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedChannel === 'email' && (
                    <div className="flex-1 bg-white rounded-[30px] overflow-hidden flex flex-col text-slate-900 border border-black/10">
                      <div className="bg-purple-600 text-white px-3 py-2.5 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <div className="leading-tight min-w-0">
                          <div className="text-[11px] font-bold truncate">
                            {currentTemplate.title || (isAr ? 'تذكير السلة' : 'Cart Reminder')}
                          </div>
                          <div className="text-[9px] text-purple-100 truncate">
                            {activeStore.name || (isAr ? 'متجرك' : 'Your Store')}
                          </div>
                        </div>
                      </div>
                      <div className="px-3 py-2 border-b border-slate-100 space-y-1 text-[10px]">
                        <div className="flex gap-1">
                          <span className="text-slate-400 shrink-0">{isAr ? 'من:' : 'From:'}</span>
                          <span className="font-semibold text-slate-700 truncate">
                            {activeStore.name || (isAr ? 'متجرك' : 'Your Store')}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <span className="text-slate-400 shrink-0">{isAr ? 'إلى:' : 'To:'}</span>
                          <span className="text-slate-600 truncate">
                            {abandonedCarts[0]?.customerEmail && abandonedCarts[0].customerEmail !== '—'
                              ? abandonedCarts[0].customerEmail
                              : isAr
                                ? 'لا يوجد بريد'
                                : 'No email yet'}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <span className="text-slate-400 shrink-0">{isAr ? 'الموضوع:' : 'Subject:'}</span>
                          <span className="font-semibold text-slate-800 truncate">
                            {currentTemplate.title}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 p-3 overflow-y-auto bg-slate-50">
                        <div className="bg-white border border-slate-200 rounded-xl p-3 text-[11px] leading-relaxed text-slate-800 whitespace-pre-wrap shadow-xs">
                          {livePreviewText}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Content & Editor Column (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {isAr ? 'محتوى الرسالة' : 'Message Content'}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveLang('EN')}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                        activeLang === 'EN'
                          ? 'bg-[#0EA5A4] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLang('AR')}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                        activeLang === 'AR'
                          ? 'bg-[#0EA5A4] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      AR
                    </button>
                  </div>
                </div>

                {/* Message Title (Internal) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isAr ? 'عنوان الرسالة (داخلي)' : 'Message Title (Internal)'}
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {(activeTemplateTitle || '').length}/100
                    </span>
                  </div>
                  <input
                    type="text"
                    value={activeTemplateTitle || ''}
                    onChange={(e) =>
                      setReminders({
                        ...reminders,
                        [editingReminder]:
                          activeLang === 'AR'
                            ? { ...currentTemplate, titleAr: e.target.value }
                            : { ...currentTemplate, title: e.target.value },
                      })
                    }
                    dir={activeLang === 'AR' ? 'rtl' : 'ltr'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Message Text with Rich Toolbar matching Reference */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isAr ? 'نص الرسالة *' : 'Message Text *'}
                    </label>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 focus-within:border-teal-500">
                    {/* Toolbar */}
                    <div className="px-2 py-1.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800/80">
                      <div className="flex items-center gap-1 text-slate-500">
                        <button
                          type="button"
                          onClick={() => insertVariableIntoMessage('*bold text*')}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 font-bold text-xs"
                          title="Bold"
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertVariableIntoMessage('_italic text_')}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 text-xs"
                          title="Italic"
                        >
                          <Italic className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertVariableIntoMessage('{checkout_link}')}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 text-xs"
                          title="Link"
                        >
                          <Link className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertVariableIntoMessage('👋')}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 text-xs"
                          title="Emoji"
                        >
                          <Smile className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            toast(isAr ? 'ميزة إرفاق صورة السلة مفعلة في القالب' : 'Product images enabled in template', 'info');
                          }}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 text-xs"
                          title="Image"
                        >
                          <Image className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Insert Variable Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setVariableDropdownOpen(!variableDropdownOpen)}
                          className="px-2 py-0.5 rounded text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isAr ? 'إدراج متغير' : 'Insert Variable'}</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>

                        {variableDropdownOpen && (
                          <div className="absolute end-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-1.5 z-20 space-y-1">
                            {[
                              { label: isAr ? 'اسم العميل' : 'Customer Name', val: '{name}' },
                              { label: isAr ? 'قيمة السلة' : 'Cart Value', val: '{cart_value}' },
                              { label: isAr ? 'رابط الدفع' : 'Checkout Link', val: '{checkout_link}' },
                              { label: isAr ? 'عدد المنتجات' : 'Products Count', val: '{products}' },
                              { label: isAr ? 'قائمة المنتجات' : 'Products List', val: '{product_list}' },
                              { label: isAr ? 'كود الخصم' : 'Discount Code', val: '{discount_code}' },
                              { label: isAr ? 'اسم المتجر' : 'Store Name', val: '{store_name}' },
                            ].map((v) => (
                              <button
                                key={v.val}
                                type="button"
                                onClick={() => insertVariableIntoMessage(v.val)}
                                className="w-full text-start px-2 py-1 text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
                              >
                                <span>{v.label}</span>
                                <span className="font-mono text-[10px] text-teal-600">{v.val}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <textarea
                      rows={6}
                      value={activeTemplateMessage || ''}
                      onChange={(e) =>
                        setReminders({
                          ...reminders,
                          [editingReminder]:
                            activeLang === 'AR'
                              ? { ...currentTemplate, messageAr: e.target.value }
                              : { ...currentTemplate, message: e.target.value },
                        })
                      }
                      dir={activeLang === 'AR' ? 'rtl' : 'ltr'}
                      className="w-full p-3 bg-transparent text-xs leading-relaxed resize-none text-slate-900 dark:text-white focus:outline-none"
                    />

                    <div className="px-3 py-1.5 text-end text-[10px] text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50">
                      {(activeTemplateMessage || '').length}/1000
                    </div>
                  </div>
                </div>

                {/* Available Variables Chips matching Reference */}
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 mb-1.5">
                    {isAr ? 'المتغيرات المتاحة:' : 'Available Variables:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { token: '{name}', labelAr: 'اسم العميل', labelEn: 'Customer name' },
                      { token: '{cart_value}', labelAr: 'قيمة السلة', labelEn: 'Cart value' },
                      { token: '{checkout_link}', labelAr: 'رابط إتمام الشراء', labelEn: 'Checkout link' },
                      { token: '{products}', labelAr: 'عدد المنتجات', labelEn: 'Products count' },
                      { token: '{product_list}', labelAr: 'قائمة المنتجات', labelEn: 'Products list' },
                      { token: '{discount_code}', labelAr: 'كود الخصم', labelEn: 'Discount code' },
                      { token: '{store_name}', labelAr: 'اسم المتجر', labelEn: 'Store name' },
                    ].map((v) => (
                      <button
                        key={v.token}
                        type="button"
                        title={v.token}
                        onClick={() => insertVariableIntoMessage(v.token)}
                        className="px-2 py-1 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[10px] font-bold hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors cursor-pointer border border-teal-200/50 dark:border-teal-800/50"
                      >
                        {isAr ? v.labelAr : v.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reminder Settings Column (3 cols) */}
              <div className="lg:col-span-3 space-y-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="block text-xs font-bold text-slate-900 dark:text-white">
                  {isAr ? 'إعدادات التذكير' : 'Reminder Settings'}
                </span>

                {/* Time after cart is abandoned */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {isAr ? 'وقت الإرسال بعد ترك السلة *' : 'Time after cart is abandoned *'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={currentTemplate.time}
                      onChange={(e) =>
                        setReminders({
                          ...reminders,
                          [editingReminder]: {
                            ...currentTemplate,
                            time: e.target.value,
                          },
                        })
                      }
                      className="w-16 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                    <select
                      value={currentTemplate.unit}
                      onChange={(e) =>
                        setReminders({
                          ...reminders,
                          [editingReminder]: {
                            ...currentTemplate,
                            unit: e.target.value,
                          },
                        })
                      }
                      className="flex-1 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                    >
                      <option value="Minute">{isAr ? 'دقيقة' : 'Minute'}</option>
                      <option value="Hour">{isAr ? 'ساعة' : 'Hour'}</option>
                      <option value="Hours">{isAr ? 'ساعات' : 'Hours'}</option>
                      <option value="Days">{isAr ? 'أيام' : 'Days'}</option>
                    </select>
                  </div>
                </div>

                {/* Minimum cart value */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {isAr ? 'الحد الأدنى لقيمة السلة (اختياري)' : 'Minimum cart value (optional)'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={currentTemplate.minCartValue}
                      onChange={(e) =>
                        setReminders({
                          ...reminders,
                          [editingReminder]: {
                            ...currentTemplate,
                            minCartValue: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 pe-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                    <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                      SAR
                    </span>
                  </div>
                </div>

                {/* Target market */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {isAr ? 'السوق المستهدف (اختياري)' : 'Target market (optional)'}
                  </label>
                  <select
                    value={currentTemplate.targetMarket}
                    onChange={(e) =>
                      setReminders({
                        ...reminders,
                        [editingReminder]: {
                          ...currentTemplate,
                          targetMarket: e.target.value,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="All Markets">{isAr ? 'جميع الأسواق' : 'All Markets'}</option>
                    <option value="Saudi Arabia">{isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia'}</option>
                    <option value="UAE">{isAr ? 'الإمارات العربية المتحدة' : 'United Arab Emirates'}</option>
                    <option value="Kuwait">{isAr ? 'الكويت' : 'Kuwait'}</option>
                  </select>
                </div>

                {/* Toggles */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
                  <label className="flex items-center justify-between text-xs cursor-pointer">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {isAr ? 'تفعيل الشحن المجاني' : 'Enable free shipping'}
                    </span>
                    <input
                      type="checkbox"
                      checked={currentTemplate.freeShipping}
                      onChange={(e) =>
                        setReminders({
                          ...reminders,
                          [editingReminder]: {
                            ...currentTemplate,
                            freeShipping: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs cursor-pointer">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {isAr ? 'تفعيل كود الخصم' : 'Enable discount'}
                    </span>
                    <input
                      type="checkbox"
                      checked={currentTemplate.discount}
                      onChange={(e) =>
                        setReminders({
                          ...reminders,
                          [editingReminder]: {
                            ...currentTemplate,
                            discount: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                  </label>
                </div>

                {/* Sending channel */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {isAr ? 'قناة الإرسال *' : 'Sending channel *'}
                  </label>
                  <select
                    value={currentTemplate.channel}
                    onChange={(e) => {
                      const ch = e.target.value as 'whatsapp' | 'sms' | 'email';
                      setReminders({
                        ...reminders,
                        [editingReminder]: {
                          ...currentTemplate,
                          channel: ch,
                        },
                      });
                      setSelectedChannel(ch);
                    }}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="whatsapp">{channelLabel('whatsapp')}</option>
                    <option value="sms">{channelLabel('sms')}</option>
                    <option value="email">{channelLabel('email')}</option>
                  </select>
                </div>

                {/* Info Callout Box matching Reference */}
                <div className="p-2.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 text-[11px] text-teal-800 dark:text-teal-300 flex items-start gap-2">
                  <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    {isAr
                      ? 'يمكنك تفعيل أكثر من قناة (مثل الإرسال عبر الرسائل القصيرة) من خلال إعدادات الأتمتة المتقدمة.'
                      : 'You can activate more than one channel (e.g. send via SMS) from the automation settings.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void persistReminders(reminders).then(() => {
                      toast(
                        isAr
                          ? 'تم حفظ وتطبيق إعدادات القالب بنجاح'
                          : 'Reminder settings applied and saved successfully',
                        'success',
                      );
                      setEditingReminder(null);
                      setVariableDropdownOpen(false);
                    });
                  }}
                  className="w-full py-2.5 bg-[#0EA5A4] hover:bg-[#0c8f8e] text-white rounded-xl text-xs font-bold transition-all mt-4 cursor-pointer shadow-xs"
                >
                  {isAr ? 'تطبيق وحفظ' : 'Apply & Save'}
                </button>
              </div>
            </div>
          </div>
          </GlobalModal>
        )}

      {/* Bottom cards grid — Automation / Reminder Sequence / Rules / Recovery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Automation Settings */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-xs text-slate-900 dark:text-white">
              {isAr ? 'إعدادات الأتمتة' : 'Automation Settings'}
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {/* Enable automation */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  {isAr ? 'تفعيل الأتمتة' : 'Enable automation'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {isAr ? 'إرسال التذكيرات آلياً للعملاء' : 'Automatically send reminders'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={automationSettings.enabled}
                  onChange={(e) =>
                    setAutomationSettings({ ...automationSettings, enabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-slate-600 peer-checked:bg-[#0EA5A4]"></div>
              </label>
            </div>

            {/* Time Zone */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isAr ? 'المنطقة الزمنية' : 'Time Zone'}
              </label>
              <select
                value={automationSettings.timeZone}
                onChange={(e) =>
                  setAutomationSettings({ ...automationSettings, timeZone: e.target.value })
                }
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value="(GMT+03:00) Riyadh">(GMT+03:00) Riyadh</option>
                <option value="(GMT+04:00) Dubai">(GMT+04:00) Dubai</option>
                <option value="(GMT+03:00) Kuwait">(GMT+03:00) Kuwait</option>
              </select>
            </div>

            {/* Send messages between */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isAr ? 'إرسال الرسائل بين' : 'Send messages between'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={automationSettings.sendStart}
                  onChange={(e) =>
                    setAutomationSettings({ ...automationSettings, sendStart: e.target.value })
                  }
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center"
                />
                <span className="text-slate-400 text-xs">{isAr ? 'إلى' : 'to'}</span>
                <input
                  type="text"
                  value={automationSettings.sendEnd}
                  onChange={(e) =>
                    setAutomationSettings({ ...automationSettings, sendEnd: e.target.value })
                  }
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center"
                />
              </div>
            </div>

            {/* Minimum cart value */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isAr ? 'الحد الأدنى لقيمة السلة' : 'Minimum cart value'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={automationSettings.minCartValue}
                  onChange={(e) =>
                    setAutomationSettings({ ...automationSettings, minCartValue: e.target.value })
                  }
                  className="w-full px-3 py-1.5 pe-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                  SAR
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Reminder Sequence matching reference timeline */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-xs text-slate-900 dark:text-white">
              {isAr ? 'تسلسل التذكيرات' : 'Reminder Sequence'}
            </h3>
          </div>

          {/* Timeline Nodes */}
          <div className="space-y-3 relative before:absolute before:top-3 before:bottom-3 before:start-3.5 before:w-0.5 before:bg-teal-200 dark:before:bg-teal-900">
            {(
              [
                {
                  key: 'first' as const,
                  step: 1,
                  color: 'bg-emerald-500',
                  icon: <WhatsAppBrandIcon className="w-3.5 h-3.5 text-[#25D366]" title={channelLabel('whatsapp')} />,
                  title: isAr ? 'التذكير الأول' : 'First Reminder',
                  when: isAr ? 'بعد ساعة واحدة' : 'After 1 hour',
                },
                {
                  key: 'second' as const,
                  step: 2,
                  color: 'bg-blue-500',
                  icon: <Smartphone className="w-3.5 h-3.5 text-blue-500" />,
                  title: isAr ? 'التذكير الثاني' : 'Second Reminder',
                  when: isAr ? 'بعد 24 ساعة' : 'After 24 hours',
                },
                {
                  key: 'third' as const,
                  step: 3,
                  color: 'bg-purple-500',
                  icon: <Mail className="w-3.5 h-3.5 text-purple-500" />,
                  title: isAr ? 'التذكير الثالث' : 'Third Reminder',
                  when: isAr ? 'بعد 3 أيام' : 'After 3 days',
                },
              ] as const
            ).map((node) => (
              <div
                key={node.key}
                className={`relative flex items-center justify-between ps-8 gap-2 ${
                  reminders[node.key].enabled ? '' : 'opacity-55'
                }`}
              >
                <div
                  className={`absolute start-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full ${node.color} text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white dark:ring-slate-900`}
                >
                  {node.step}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  {node.icon}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {node.title}
                    </div>
                    <div className="text-[10px] text-slate-400">{node.when}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                  <label
                    className="relative inline-flex items-center cursor-pointer"
                    title={
                      reminders[node.key].enabled
                        ? isAr
                          ? 'إيقاف'
                          : 'Turn off'
                        : isAr
                          ? 'تشغيل'
                          : 'Turn on'
                    }
                  >
                    <input
                      type="checkbox"
                      checked={reminders[node.key].enabled}
                      onChange={(e) =>
                        setReminders({
                          ...reminders,
                          [node.key]: { ...reminders[node.key], enabled: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-slate-600 peer-checked:bg-[#0EA5A4]" />
                  </label>
                  <button
                    type="button"
                    onClick={() => openReminderEditor(node.key)}
                    className="p-1 hover:text-teal-600 rounded cursor-pointer"
                    title={isAr ? 'تعديل' : 'Edit'}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              toast(isAr ? 'تم استيفاء الحد الأقصى للمسار (3 تذكيرات)' : 'Max sequence reached (3 reminders)', 'info');
            }}
            className="w-full py-1.5 border border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة تذكير جديد' : 'Add New Reminder'}</span>
          </button>
        </div>

        {/* Card 3: Automation Rules matching reference */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-xs text-slate-900 dark:text-white">
              {isAr ? 'قواعد الأتمتة' : 'Automation Rules'}
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Start automation */}
            <div>
              <div className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                {isAr ? 'بدء الأتمتة' : 'Start automation'}
              </div>
              <div className="text-[10px] text-slate-400 mb-1">
                {isAr ? 'عند إضافة منتجات دون إتمام الطلب' : "When customer doesn't checkout"}
              </div>
              <select
                value={automationRules.startTiming}
                onChange={(e) =>
                  setAutomationRules({ ...automationRules, startTiming: e.target.value })
                }
                className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              >
                <option value="1 hour">1 hour</option>
                <option value="2 hours">2 hours</option>
                <option value="6 hours">6 hours</option>
              </select>
            </div>

            {/* Stop automation */}
            <div>
              <div className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                {isAr ? 'إيقاف الأتمتة' : 'Stop automation'}
              </div>
              <select
                value={automationRules.stopCondition}
                onChange={(e) =>
                  setAutomationRules({ ...automationRules, stopCondition: e.target.value })
                }
                className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs mt-1"
              >
                <option value="Order is completed">Order is completed</option>
                <option value="Customer replies">Customer replies</option>
              </select>
            </div>

            {/* Exclude customers */}
            <div>
              <div className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                {isAr ? 'استبعاد العملاء' : 'Exclude customers'}
              </div>
              <select
                value={automationRules.excludeCondition}
                onChange={(e) =>
                  setAutomationRules({ ...automationRules, excludeCondition: e.target.value })
                }
                className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs mt-1"
              >
                <option value="Customers with active orders">Customers with active orders</option>
                <option value="VIP Customers">VIP Customers</option>
              </select>
            </div>

            {/* Max Reminders */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block">
                  {isAr ? 'الحد الأقصى' : 'Max reminders'}
                </span>
                <select
                  value={automationRules.maxReminders}
                  onChange={(e) =>
                    setAutomationRules({ ...automationRules, maxReminders: e.target.value })
                  }
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs mt-0.5"
                >
                  <option value="3 reminders">3 reminders</option>
                  <option value="2 reminders">2 reminders</option>
                </select>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">
                  {isAr ? 'الفترة بين الرسائل' : 'Interval'}
                </span>
                <select
                  value={automationRules.reminderInterval}
                  onChange={(e) =>
                    setAutomationRules({ ...automationRules, reminderInterval: e.target.value })
                  }
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs mt-0.5"
                >
                  <option value="24 hours">24 hours</option>
                  <option value="12 hours">12 hours</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: AI Assistant matching Reference Screenshot */}
        <div className="p-5 bg-gradient-to-b from-purple-50/50 to-indigo-50/30 dark:from-purple-950/20 dark:to-indigo-950/10 rounded-2xl border border-purple-200/60 dark:border-purple-800/40 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="font-bold text-xs text-purple-900 dark:text-purple-200">
                {isAr ? 'المساعد الذكي' : 'AI Assistant'}
              </h3>
            </div>

            <p className="text-[11px] text-purple-800/80 dark:text-purple-300 leading-snug">
              {isAr
                ? 'الحصول على رسائل أكثر فاعلية وأفضل توقيت باستخدام الذكاء الاصطناعي.'
                : 'Get more effective messages and better timing using AI.'}
            </p>

            <ul className="space-y-1.5 text-[11px] text-purple-900 dark:text-purple-200">
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-purple-600" />
                <span>{isAr ? 'توليد محتوى الرسائل' : 'Generate message content'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-purple-600" />
                <span>{isAr ? 'تحسين وقت الإرسال' : 'Improve send timing'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-purple-600" />
                <span>{isAr ? 'اختيار القناة الأفضل' : 'Choose best channel'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-purple-600" />
                <span>{isAr ? 'تخصيص الرسالة لكل عميل' : 'Personalize for each customer'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-purple-600" />
                <span>{isAr ? 'اقتراح العروض والخصومات' : 'Suggest offers and discounts'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-purple-600" />
                <span>{isAr ? 'تحليل النتائج والرؤى' : 'Analyze results and insights'}</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer mt-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'فتح إعدادات الذكاء الاصطناعي' : 'Open AI Settings'}</span>
          </button>
        </div>
      </div>

      {/* Cart Details Modal (Compact & Centered with Zero Overlap/Cutoff) */}
      {viewingCart && (
        <GlobalModal
          isOpen
          onClose={() => setViewingCart(null)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'تفاصيل السلة المتروكة' : 'Abandoned Cart Details'}
        >
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {isAr ? 'تفاصيل السلة المتروكة' : 'Abandoned Cart Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingCart(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'العميل:' : 'Customer:'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {viewingCart.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'البريد:' : 'Email:'}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {viewingCart.customerEmail}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'الهاتف:' : 'Phone:'}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {viewingCart.customerPhone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'قيمة السلة:' : 'Cart Value:'}</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400 text-sm">
                    {money(viewingCart.cartValue)}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2">
                  {isAr ? 'المنتجات في السلة:' : 'Items in Cart:'}
                </span>
                <div className="space-y-2">
                  {viewingCart.items && viewingCart.items.length > 0 ? (
                    viewingCart.items.map((it: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/30"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {it.name || `Product #${idx + 1}`}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {money(it.price || 0)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-slate-400">
                      {isAr ? 'تفاصيل المنتجات المسجلة في السلة' : 'No explicit item details available'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => setViewingCart(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSendManualReminder(viewingCart.id, viewingCart.customerName);
                  setViewingCart(null);
                }}
                className="px-4 py-2 bg-[#0EA5A4] text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isAr ? 'إرسال تذكير الآن' : 'Send Reminder Now'}</span>
              </button>
            </div>
          </div>
        </GlobalModal>
      )}

      {/* Services Modal */}
      {showServicesModal && (
        <GlobalModal
          isOpen
          onClose={() => setShowServicesModal(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'خدمات استعادة السلات' : 'Abandoned Cart Services'}
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {isAr ? 'خدمات استعادة السلات' : 'Abandoned Cart Services'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowServicesModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <WhatsAppBrandIcon className="w-4 h-4 text-[#25D366]" title={isAr ? 'واتساب' : 'WhatsApp'} />
                  <span>{isAr ? 'واجهة واتساب للأعمال' : 'WhatsApp Business API'}</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  {isAr
                    ? 'ربط مباشر لإرسال إشعارات التذكير الآلية بروابط سريعة للدفع.'
                    : 'Direct integration for automated WhatsApp reminders with instant checkout links.'}
                </p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-500" />
                  <span>{isAr ? 'بوابة الرسائل النصية' : 'SMS Gateway Integration'}</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  {isAr
                    ? 'إرسال رسائل نصية قصيرة فورية بأعلى معدلات وصول للمملكة والخليج.'
                    : 'Instant SMS gateway integration for high delivery rates across KSA and GCC.'}
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowServicesModal(false)}
                className="px-4 py-2 bg-[#0EA5A4] text-white rounded-xl text-xs font-bold"
              >
                {isAr ? 'حسناً' : 'Close'}
              </button>
            </div>
          </div>
        </GlobalModal>
      )}

      {/* AI Assistant Modal */}
      {showAiModal && (
        <GlobalModal
          isOpen
          onClose={() => setShowAiModal(false)}
          dir={isAr ? 'rtl' : 'ltr'}
          aria-label={isAr ? 'إعدادات المساعد الذكي' : 'AI Assistant Settings'}
        >
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-purple-200 dark:border-purple-800 overflow-hidden my-auto animate-in fade-in zoom-in-95">
            <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  {isAr ? 'إعدادات المساعد الذكي' : 'AI Assistant Settings'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {isAr
                  ? 'يقوم المساعد الذكي بتحليل سلوك المتسوقين وتحديد أفضل وقت ونبرة لرسائل التذكير لزيادة معدل تحويل السلات المتروكة إلى طلبات مؤكدة.'
                  : 'AI analyzes customer checkout behavior to determine optimal send timing and personalized copy for maximum cart recovery.'}
              </p>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <span>{isAr ? 'توليد نصوص ذكية تلقائياً' : 'Auto-generate smart copy'}</span>
                  <input type="checkbox" defaultChecked className="rounded text-purple-600" />
                </label>
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <span>{isAr ? 'التوقيت الديناميكي حسب نشاط العميل' : 'Dynamic send timing'}</span>
                  <input type="checkbox" defaultChecked className="rounded text-purple-600" />
                </label>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  toast(isAr ? 'تم حفظ إعدادات الذكاء الاصطناعي' : 'AI settings updated', 'success');
                  setShowAiModal(false);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
              >
                {isAr ? 'تفعيل وحفظ' : 'Enable & Save'}
              </button>
            </div>
          </div>
        </GlobalModal>
      )}
    </div>
  );
};
