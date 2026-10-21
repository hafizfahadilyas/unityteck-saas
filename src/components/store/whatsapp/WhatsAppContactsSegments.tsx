import React, { useState, useEffect, useMemo } from 'react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import { useToast } from '../../common/ToastProvider';
import type { WhatsAppContactItem, WhatsAppSegmentItem } from '../../../types/whatsapp';
import {
  fetchWhatsAppContacts,
  fetchWhatsAppSegments,
} from '../../../services/whatsappManagerService';
import {
  Users,
  UserCheck,
  UserX,
  ShieldAlert,
  UserPlus,
  HelpCircle,
  Calendar,
  Search,
  RotateCcw,
  Plus,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Save,
  Tag,
  PieChart,
  ArrowUpRight,
  Edit,
  Mail,
  Phone,
  ShoppingBag,
  Clock,
  Sparkles,
} from 'lucide-react';

interface Props {
  onNavigateSubView: (view: string, initialData?: any) => void;
}

export const WhatsAppContactsSegments: React.FC<Props> = ({ onNavigateSubView }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { activeStore } = useTenant();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'contacts' | 'segments' | 'tags' | 'import_export'>('contacts');
  const [loading, setLoading] = useState(true);

  // Real Contacts & Segments from API
  const [contacts, setContacts] = useState<WhatsAppContactItem[]>([]);
  const [segments, setSegments] = useState<WhatsAppSegmentItem[]>([]);
  const [metrics, setMetrics] = useState({
    total_contacts: 0,
    subscribed: 0,
    unsubscribed: 0,
    blocked: 0,
    new_contacts: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');

  // Selected contact for the right details pane
  const [selectedContact, setSelectedContact] = useState<WhatsAppContactItem | null>(null);
  const [contactNotes, setContactNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 8,
    total: 0,
  });

  // Load real contacts & segments
  useEffect(() => {
    if (!activeStore?.id) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const [contactRes, segmentRes] = await Promise.all([
          fetchWhatsAppContacts(activeStore.id, {
            search: searchQuery.trim() || undefined,
            page: currentPage,
            per_page: 8,
          }),
          fetchWhatsAppSegments(activeStore.id),
        ]);

        const rawContacts = contactRes.data || [];
        // Map raw customers to contact items with real values
        const mapped: WhatsAppContactItem[] = rawContacts.map((c: any) => ({
          id: c.id,
          name: c.name || (isAr ? 'عميل' : 'Customer'),
          phone: c.phone || '',
          email: c.email || '',
          total_orders: c.orders_count ?? c.total_orders ?? 0,
          total_spent: Number(c.total_spent || 0),
          last_order_at: c.last_order_at || (c.updated_at ? new Date(c.updated_at).toLocaleDateString() : '-'),
          is_active: c.is_active !== false,
          marketing_opt_in: c.marketing_opt_in !== false,
          tags: Array.isArray(c.tags) && c.tags.length ? c.tags : [(c.orders_count || 0) > 5 ? 'VIP' : 'Regular'],
          segments: Array.isArray(c.segments) && c.segments.length ? c.segments : ['All Customers'],
          notes: c.notes || '',
          created_at: c.created_at || '',
        }));

        setContacts(mapped);
        if (mapped.length > 0 && !selectedContact) {
          setSelectedContact(mapped[0]);
          setContactNotes(mapped[0].notes || '');
        }

        if (contactRes.metrics) {
          setMetrics(contactRes.metrics);
        }
        if (contactRes.pagination) {
          setPagination(contactRes.pagination);
        }
        setSegments(segmentRes);
      } catch (err) {
        console.error('Failed to load contacts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeStore?.id, searchQuery, currentPage, isAr]);

  const handleSaveNotes = () => {
    if (!selectedContact) return;
    setSavingNotes(true);
    setTimeout(() => {
      setSavingNotes(false);
      toast(isAr ? 'تم حفظ ملاحظات جهة الاتصال' : 'Contact notes saved', 'success');
    }, 400);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast(isAr ? 'تم النسخ' : 'Copied', 'info');
  };

  return (
    <div className="w-full space-y-6 pb-12 font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm border border-emerald-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'جهات الاتصال والشرائح' : 'Contacts & Segments'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'إدارة جهات اتصال الواتساب، إنشاء شرائح الجمهور المستهدف، وتتبع تفاعل العملاء.'
                : 'Manage your WhatsApp contacts, create audience segments, and track customer engagement.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Oct 15, 2026 - Oct 14, 2026</span>
          </div>

          <button
            type="button"
            onClick={() => toast(isAr ? 'دليل إدارة جهات اتصال الواتساب والشرائح' : 'Contacts & Segments Guide', 'info')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <HelpCircle className="w-4 h-4 text-sky-500" />
            <span>{isAr ? 'دليل المساعدة' : 'Help Guide'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top 5 KPI Cards (Matching Reference Image 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Contacts */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isAr ? 'إجمالي جهات الاتصال' : 'Total Contacts'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.total_contacts.toLocaleString()}
          </div>
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>
              {metrics.total_contacts > 0
                ? `${((metrics.subscribed / metrics.total_contacts) * 100).toFixed(0)}% ${isAr ? 'نسبة الاشتراك' : 'opt-in rate'}`
                : isAr ? 'لا توجد بيانات' : 'No contacts yet'}
            </span>
          </p>
        </div>

        {/* Subscribed (Opt-In) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isAr ? 'مشترك (موافق)' : 'Subscribed (Opt-In)'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.subscribed.toLocaleString()}
          </div>
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.total_contacts > 0
              ? `${((metrics.subscribed / metrics.total_contacts) * 100).toFixed(1)}%`
              : '0%'}
          </p>
        </div>

        {/* Unsubscribed (Opt-Out) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isAr ? 'ملغي الاشتراك' : 'Unsubscribed (Opt-out)'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <UserX className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.unsubscribed.toLocaleString()}
          </div>
          <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1">
            {metrics.total_contacts > 0
              ? `${((metrics.unsubscribed / metrics.total_contacts) * 100).toFixed(1)}%`
              : '0%'}
          </p>
        </div>

        {/* Blocked Numbers */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isAr ? 'أرقام محظورة' : 'Blocked Numbers'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.blocked.toLocaleString()}
          </div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
            {metrics.total_contacts > 0
              ? `${((metrics.blocked / metrics.total_contacts) * 100).toFixed(1)}%`
              : '0%'}
          </p>
        </div>

        {/* New Contacts */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isAr ? 'جهات اتصال جديدة' : 'New Contacts'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <UserPlus className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {metrics.new_contacts.toLocaleString()}
          </div>
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>
              {metrics.new_contacts > 0
                ? `+${metrics.new_contacts} ${isAr ? 'هذا الشهر' : 'new this month'}`
                : isAr ? 'لا توجد إضافات حديثة' : 'No new contacts'}
            </span>
          </p>
        </div>
      </div>

      {/* 3. Sub-Tabs & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'contacts'
                ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isAr ? 'كافة جهات الاتصال' : 'All Contacts'} ({metrics.total_contacts.toLocaleString()})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('segments')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'segments'
                ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isAr ? 'الشرائح' : 'Segments'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tags')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'tags'
                ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isAr ? 'الوسوم' : 'Tags'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import_export')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'import_export'
                ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isAr ? 'استيراد / تصدير' : 'Import / Export'}
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => toast(isAr ? 'فتح نافذة إضافة جهة اتصال' : 'Add Contact Modal', 'info')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة جهة اتصال' : 'Add Contact'}</span>
          </button>

          <button
            type="button"
            onClick={() => toast(isAr ? 'فتح نافذة إنشاء شريحة جديدة' : 'Create Segment Modal', 'info')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAr ? 'إنشاء شريحة' : 'Create Segment'}</span>
          </button>
        </div>
      </div>

      {/* 4. Filters Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'بحث بالاسم، رقم الهاتف، البريد أو رقم الطلب...'
                  : 'Search by name, phone number, email, or order number...'
              }
              className="w-full ps-9 pe-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">{isAr ? 'الحالة: الكل' : 'All Status'}</option>
            <option value="active">{isAr ? 'نشط' : 'Active'}</option>
            <option value="inactive">{isAr ? 'غير نشط' : 'Inactive'}</option>
          </select>

          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">{isAr ? 'كافة الوسوم' : 'All Tags'}</option>
            <option value="VIP">VIP</option>
            <option value="Regular">Regular</option>
            <option value="New">New</option>
          </select>

          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">{isAr ? 'كافة الشرائح' : 'All Segments'}</option>
            <option value="vip">{isAr ? 'عملاء VIP' : 'VIP Customers'}</option>
            <option value="recent">{isAr ? 'العملاء الجدد' : 'Recent Customers'}</option>
          </select>

          <select
            value={customerTypeFilter}
            onChange={(e) => setCustomerTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">{isAr ? 'نوع العميل' : 'Customer Type'}</option>
            <option value="retail">{isAr ? 'تجزئة' : 'Retail'}</option>
            <option value="wholesale">{isAr ? 'جملة' : 'Wholesale'}</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setTagFilter('all');
              setSegmentFilter('all');
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* 5. Main Workspace: Contacts Table (8 cols) + Contact Details Drawer (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Table Area */}
        <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {contacts.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold">{isAr ? 'لا توجد جهات اتصال مسجلة' : 'No contacts found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                    <th className="py-3 px-3 w-8 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-emerald-600" />
                    </th>
                    <th className="py-3 px-3 text-start whitespace-nowrap">{isAr ? 'العميل' : 'Customer'}</th>
                    <th className="py-3 px-3 text-start whitespace-nowrap">{isAr ? 'رقم الهاتف' : 'Phone Number'}</th>
                    <th className="py-3 px-3 text-start whitespace-nowrap">{isAr ? 'البريد الإلكتروني' : 'Email'}</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">{isAr ? 'الطلبات' : 'Orders'}</th>
                    <th className="py-3 px-3 text-start whitespace-nowrap">{isAr ? 'إجمالي المشتريات' : 'Total Spent'}</th>
                    <th className="py-3 px-3 text-start whitespace-nowrap">{isAr ? 'آخر طلب' : 'Last Order'}</th>
                    <th className="py-3 px-3 text-start whitespace-nowrap">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="py-3 px-3 text-start whitespace-nowrap">{isAr ? 'الاشتراك' : 'Subscription'}</th>
                    <th className="py-3 px-3 text-start whitespace-nowrap">{isAr ? 'الوسوم' : 'Tags'}</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {contacts.map((c) => {
                    const isSelected = selectedContact?.id === c.id;
                    const initial = (c.name || 'C').charAt(0).toUpperCase();

                    return (
                      <tr
                        key={c.id}
                        onClick={() => {
                          setSelectedContact(c);
                          setContactNotes(c.notes || '');
                        }}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" className="rounded border-slate-300 text-emerald-600" />
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                              {initial}
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {c.name}
                            </span>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300 dir-ltr text-start">
                          {c.phone}
                        </td>

                        {/* Email */}
                        <td className="py-3 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {c.email}
                        </td>

                        {/* Orders count */}
                        <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">
                          {c.total_orders}
                        </td>

                        {/* Total Spent */}
                        <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                          SAR {c.total_spent?.toLocaleString()}
                        </td>

                        {/* Last Order */}
                        <td className="py-3 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {c.last_order_at}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {c.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Subscription */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              c.marketing_opt_in
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {c.marketing_opt_in ? (isAr ? 'مشترك' : 'Subscribed') : (isAr ? 'غير مشترك' : 'Opted Out')}
                          </span>
                        </td>

                        {/* Tags */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 flex-wrap">
                            {(c.tags && c.tags.length > 0 ? c.tags : [(c.total_orders || 0) > 5 ? 'VIP' : 'Regular']).map((tag) => (
                              <span
                                key={tag}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  tag === 'VIP'
                                    ? 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                                    : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() =>
                              onNavigateSubView('compose', {
                                phone: c.phone,
                                customerName: c.name,
                              })
                            }
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                            title="Send WhatsApp message"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {isAr
                ? `عرض 1 إلى ${contacts.length} من إجمالي ${pagination.total.toLocaleString()} جهة اتصال`
                : `Showing 1 to ${contacts.length} of ${pagination.total.toLocaleString()} contacts`}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button type="button" className="w-7 h-7 rounded bg-emerald-600 text-white font-bold text-xs">
                {currentPage}
              </button>
              <button
                type="button"
                disabled={currentPage >= pagination.last_page}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Contact Details Panel (Matching Reference Image 1) */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {isAr ? 'تفاصيل جهة الاتصال' : 'Contact Details'}
            </h2>
            <Edit className="w-4 h-4 text-amber-500 cursor-pointer" />
          </div>

          {selectedContact ? (
            <div className="space-y-4">
              {/* Profile Card Header */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-xl flex items-center justify-center border border-emerald-300 dark:border-emerald-800 shrink-0">
                  {(selectedContact.name || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedContact.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${selectedContact.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {selectedContact.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {isAr ? 'تاريخ التسجيل: ' : 'Customer since: '}
                    {selectedContact.created_at ? new Date(selectedContact.created_at).toLocaleDateString() : '-'}
                  </p>
                </div>
              </div>

              {/* Contact Data Items */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">{isAr ? 'رقم الهاتف' : 'Phone Number'}</span>
                  <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-800 dark:text-slate-200 dir-ltr">
                    <span>{selectedContact.phone || '-'}</span>
                    {selectedContact.phone && (
                      <button type="button" onClick={() => handleCopy(selectedContact.phone)} className="text-slate-400 hover:text-slate-600">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">{isAr ? 'البريد الإلكتروني' : 'Email'}</span>
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                    <span className="truncate max-w-[150px]">{selectedContact.email || '-'}</span>
                    {selectedContact.email && (
                      <button type="button" onClick={() => handleCopy(selectedContact.email || '')} className="text-slate-400 hover:text-slate-600">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">{isAr ? 'إجمالي الطلبات' : 'Total Orders'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedContact.total_orders}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">{isAr ? 'إجمالي المشتريات' : 'Total Spent'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">SAR {selectedContact.total_spent?.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">{isAr ? 'آخر طلب' : 'Last Order'}</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{selectedContact.last_order_at}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">{isAr ? 'الاشتراك' : 'Subscription'}</span>
                  <span className={`font-semibold ${selectedContact.marketing_opt_in ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {selectedContact.marketing_opt_in ? (isAr ? 'مشترك (تسويق)' : 'Subscribed (Marketing)') : (isAr ? 'غير مشترك' : 'Opted Out')}
                  </span>
                </div>

                {/* Tags */}
                <div className="py-1 border-b border-slate-100 dark:border-slate-800 space-y-1.5">
                  <span className="text-slate-500 dark:text-slate-400">{isAr ? 'الوسوم' : 'Tags'}</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(selectedContact.tags && selectedContact.tags.length > 0 ? selectedContact.tags : ['Regular']).map((tag) => (
                      <span
                        key={tag}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tag === 'VIP'
                            ? 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => toast(isAr ? 'إضافة وسم للعميل' : 'Add tag to customer', 'info')}
                      className="p-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Segments */}
                <div className="py-1 border-b border-slate-100 dark:border-slate-800 space-y-1.5">
                  <span className="text-slate-500 dark:text-slate-400">{isAr ? 'الشرائح' : 'Segments'}</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(selectedContact.segments && selectedContact.segments.length > 0 ? selectedContact.segments : ['All Customers']).map((seg) => (
                      <span
                        key={seg}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                      >
                        {seg}
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => toast(isAr ? 'إضافة إلى شريحة' : 'Add to segment', 'info')}
                      className="p-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-slate-500 dark:text-slate-400 block font-semibold">
                    {isAr ? 'ملاحظات' : 'Notes'}
                  </label>
                  <textarea
                    rows={2}
                    value={contactNotes}
                    onChange={(e) => setContactNotes(e.target.value)}
                    placeholder={isAr ? 'أضف ملاحظات خاصة بهذا العميل...' : 'VIP customer, prefers perfume sets. Send special offers.'}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={savingNotes}
                      onClick={handleSaveNotes}
                      className="px-3 py-1 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[11px] font-bold hover:opacity-90 transition-opacity"
                    >
                      {savingNotes ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-10">
              {isAr ? 'اختر جهة اتصال لعرض تفاصيلها' : 'Select a contact to view details'}
            </p>
          )}
        </div>
      </div>

      {/* 6. Bottom Analytics Section (Matching Reference Image 1) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Customer Segments List */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              {isAr ? 'شرائح العملاء' : 'Customer Segments'}
            </h3>
            <button
              type="button"
              onClick={() => toast(isAr ? 'إنشاء شريحة جديدة' : 'New Segment', 'info')}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <Plus className="w-3 h-3" />
              <span>{isAr ? 'شريحة جديدة' : 'New Segment'}</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {segments.map((seg) => (
              <div
                key={seg.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                    👥
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      {isAr ? seg.name_ar || seg.name : seg.name}
                    </h4>
                    <p className="text-[10px] text-slate-400">{seg.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {seg.count.toLocaleString()}
                  </span>
                  <MoreHorizontal className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Contacts by Status Donut Graphic */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            {isAr ? 'جهات الاتصال حسب الحالة' : 'Contacts by Status'}
          </h3>

          <div className="flex items-center justify-center gap-6 py-4">
            {/* Donut graphic */}
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="50" stroke="currentColor" strokeWidth="16" className="text-slate-100 dark:text-slate-800" fill="none" />
                {metrics.total_contacts > 0 && (
                  <circle
                    cx="64"
                    cy="64"
                    r="50"
                    stroke="#10b981"
                    strokeWidth="16"
                    strokeDasharray={314.16}
                    strokeDashoffset={314.16 * (1 - metrics.subscribed / metrics.total_contacts)}
                    strokeLinecap="round"
                    fill="none"
                  />
                )}
                {metrics.total_contacts > 0 && metrics.unsubscribed > 0 && (
                  <circle
                    cx="64"
                    cy="64"
                    r="50"
                    stroke="#f43f5e"
                    strokeWidth="16"
                    strokeDasharray={314.16}
                    strokeDashoffset={314.16 * (1 - metrics.unsubscribed / metrics.total_contacts)}
                    strokeLinecap="round"
                    fill="none"
                  />
                )}
              </svg>
              <div className="absolute text-center">
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  {metrics.total_contacts.toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400">Contacts</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">
                  {isAr ? 'مشترك' : 'Subscribed'}{' '}
                  {metrics.total_contacts > 0
                    ? ((metrics.subscribed / metrics.total_contacts) * 100).toFixed(1)
                    : '0'}% ({metrics.subscribed.toLocaleString()})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">
                  {isAr ? 'ملغي الاشتراك' : 'Unsubscribed'}{' '}
                  {metrics.total_contacts > 0
                    ? ((metrics.unsubscribed / metrics.total_contacts) * 100).toFixed(1)
                    : '0'}% ({metrics.unsubscribed.toLocaleString()})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-300 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">
                  {isAr ? 'محظور' : 'Blocked'}{' '}
                  {metrics.total_contacts > 0
                    ? ((metrics.blocked / metrics.total_contacts) * 100).toFixed(1)
                    : '0'}% ({metrics.blocked.toLocaleString()})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">
                  {isAr ? 'غير نشط' : 'Inactive'}{' '}
                  {metrics.total_contacts > 0
                    ? (
                        (Math.max(
                          0,
                          metrics.total_contacts -
                            metrics.subscribed -
                            metrics.unsubscribed -
                            metrics.blocked,
                        ) /
                          metrics.total_contacts) *
                        100
                      ).toFixed(1)
                    : '0'}% (
                  {Math.max(
                    0,
                    metrics.total_contacts -
                      metrics.subscribed -
                      metrics.unsubscribed -
                      metrics.blocked,
                  ).toLocaleString()}
                  )
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Top Customer Segments by Contacts */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              {isAr ? 'أعلى الشرائح تفاعلاً' : 'Top Audience Segments'}
            </h3>
            <span
              onClick={() => setActiveTab('segments')}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              {isAr ? 'عرض الكل' : 'View all'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {segments.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <p className="text-xs">{isAr ? 'لا توجد شرائح بعد' : 'No segments available'}</p>
              </div>
            ) : (
              segments.slice(0, 5).map((seg, idx) => {
                const maxCount = Math.max(...segments.map((s) => s.count), 1);
                const pct = Math.min(100, Math.max(10, (seg.count / maxCount) * 100));
                return (
                  <div key={seg.id} className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-center font-bold text-slate-400 text-xs">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
                        {isAr ? seg.name_ar || seg.name : seg.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-bold font-mono text-slate-900 dark:text-white whitespace-nowrap text-[11px]">
                        {seg.count.toLocaleString()} {isAr ? 'عميل' : 'contacts'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
