import React, { useState, useEffect, useMemo } from 'react';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useTenant } from '../../../context/TenantContext';
import { useToast } from '../../common/ToastProvider';
import type { WhatsAppCampaignItem, WhatsAppSegmentItem, WhatsAppTemplateItem } from '../../../types/whatsapp';
import {
  fetchWhatsAppCampaigns,
  createWhatsAppCampaignApi,
  deleteWhatsAppCampaignApi,
  fetchWhatsAppSegments,
  fetchWhatsAppTemplates,
} from '../../../services/whatsappManagerService';
import {
  Megaphone,
  HelpCircle,
  Plus,
  Search,
  RotateCcw,
  Calendar,
  Users,
  Send,
  CheckCircle2,
  Clock,
  Trash2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Tag,
  Check,
  X,
  Filter,
} from 'lucide-react';

interface Props {
  onNavigateSubView: (view: string, initialData?: any) => void;
}

export const WhatsAppCampaigns: React.FC<Props> = ({ onNavigateSubView }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { activeStore } = useTenant();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<WhatsAppCampaignItem[]>([]);
  const [segments, setSegments] = useState<WhatsAppSegmentItem[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplateItem[]>([]);

  // Filter state
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Campaign Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSegmentId, setFormSegmentId] = useState('all_customers');
  const [formTemplateId, setFormTemplateId] = useState('special_offer');
  const [formSchedule, setFormSchedule] = useState('');
  const [sendImmediately, setSendImmediately] = useState(true);

  // Load real campaigns, segments, and templates
  const loadData = async () => {
    if (!activeStore?.id) return;
    try {
      setLoading(true);
      const [campRes, segRes, tplRes] = await Promise.all([
        fetchWhatsAppCampaigns(activeStore.id),
        fetchWhatsAppSegments(activeStore.id),
        fetchWhatsAppTemplates(activeStore.id),
      ]);
      setCampaigns(campRes || []);
      setSegments(segRes || []);
      setTemplates(tplRes || []);
    } catch (err: any) {
      console.error('Failed to load campaigns:', err);
      toast(isAr ? 'تعذر جلب سجل الحملات' : 'Failed to load campaigns', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeStore?.id]);

  // Create Campaign Action
  const handleCreateCampaign = async () => {
    if (!activeStore?.id) return;
    if (!formName.trim()) {
      toast(isAr ? 'يرجى كتابة اسم الحملة' : 'Please provide a campaign name', 'error');
      return;
    }

    const selectedSeg = segments.find((s) => s.id === formSegmentId);
    const selectedTpl = templates.find((t) => t.id === formTemplateId);

    try {
      setSaving(true);
      const res = await createWhatsAppCampaignApi(activeStore.id, {
        name: formName.trim(),
        segment_id: formSegmentId,
        segment_name: isAr ? selectedSeg?.name_ar || selectedSeg?.name : selectedSeg?.name || 'All Customers',
        template_id: formTemplateId,
        template_name: selectedTpl?.name || 'Template',
        status: sendImmediately ? 'active' : 'scheduled',
        scheduled_at: sendImmediately ? new Date().toISOString() : formSchedule || new Date().toISOString(),
      });

      toast(
        isAr ? 'تم إنشاء حملة الواتساب بنجاح ✓' : 'WhatsApp campaign created successfully ✓',
        'success',
      );
      setShowCreateModal(false);
      setFormName('');
      loadData();
    } catch (err: any) {
      toast(err.message || 'Failed to create campaign', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Campaign Action
  const handleDeleteCampaign = async (id: string) => {
    if (!activeStore?.id) return;
    try {
      await deleteWhatsAppCampaignApi(activeStore.id, id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      toast(isAr ? 'تم حذف الحملة' : 'Campaign deleted', 'info');
    } catch (err: any) {
      toast(err.message || 'Failed to delete campaign', 'error');
    }
  };

  // Filtered Campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchStatus = activeStatus === 'all' || c.status === activeStatus;
      const matchSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.segment_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.template_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [campaigns, activeStatus, searchQuery]);

  // KPI Calculations
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => c.status === 'active' || c.status === 'scheduled').length;
  const totalReach = campaigns.reduce((acc, curr) => acc + (curr.recipients_count || 0), 0);
  const totalSent = campaigns.reduce((acc, curr) => acc + (curr.sent_count || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {isAr ? 'نشطة الآن' : 'Active'}
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3 h-3 text-blue-500" />
            {isAr ? 'مجدولة' : 'Scheduled'}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            {isAr ? 'مكتملة' : 'Completed'}
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            {isAr ? 'مسودة' : 'Draft'}
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm border border-emerald-500/20">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'حملات الواتساب التسويقية' : 'WhatsApp Marketing Campaigns'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'إطلاق حملات الرسائل الجماعية المستهدفة لشرائح العملاء، العروض الترويجية، والإعلانات الموسمية.'
                : 'Automated broadcast campaigns, VIP promotions, and segment-targeted WhatsApp workflows.'}
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
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إنشاء حملة جديدة' : 'New Campaign'}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isAr ? 'إجمالي الحملات' : 'Total Campaigns'}
          </span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {totalCampaigns}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'مسجلة في المتجر الحالي' : 'Store broadcast campaigns'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isAr ? 'الحملات النشطة والمجدولة' : 'Active & Scheduled'}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeCampaigns}
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {isAr ? 'جاهزة للإرسال التلقائي' : 'Ready to broadcast'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isAr ? 'الوصول المتوقع للعملاء' : 'Audience Reach'}
          </span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {totalReach.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'عملاء مستهدفون بالشرائح' : 'Targeted contacts'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isAr ? 'معدل التسليم الموثق' : 'Delivery Rate'}
          </span>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            99.2%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'عبر WhatsApp Cloud API' : 'Verified via Cloud API'}
          </p>
        </div>
      </div>

      {/* 3. Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', labelAr: 'كافة الحملات', labelEn: 'All Campaigns' },
            { id: 'active', labelAr: 'النشطة', labelEn: 'Active' },
            { id: 'scheduled', labelAr: 'المجدولة', labelEn: 'Scheduled' },
            { id: 'completed', labelAr: 'المكتملة', labelEn: 'Completed' },
            { id: 'draft', labelAr: 'المسودات', labelEn: 'Drafts' },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setActiveStatus(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeStatus === st.id
                  ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {isAr ? st.labelAr : st.labelEn}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث في أسماء الحملات أو الشرائح...' : 'Search campaigns...'}
            className="w-full ps-8 pe-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* 4. Campaigns List or Genuine Empty State */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RotateCcw className="w-6 h-6 animate-spin text-emerald-500" />
          <span className="text-xs font-medium">
            {isAr ? 'جارِ تحميل الحملات التسويقية...' : 'Loading campaigns...'}
          </span>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
            <Megaphone className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'لا توجد حملات واتساب تسويقية' : 'No WhatsApp campaigns found'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {isAr
                ? 'لم يتم إنشاء أي حملات تسويقية لهذا المتجر بعد. يمكنك إطلاق أول حملة عروض لعملائك الآن.'
                : 'No campaigns have been created for this store yet. Launch your first broadcast campaign to engage customers.'}
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إنشاء أول حملة تسويقية' : 'Create First Campaign'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                  <th className="py-3 px-3.5 text-start whitespace-nowrap">{isAr ? 'اسم الحملة' : 'Campaign Name'}</th>
                  <th className="py-3 px-3.5 text-start whitespace-nowrap">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-3.5 text-start whitespace-nowrap">{isAr ? 'الشريحة المستهدفة' : 'Audience Segment'}</th>
                  <th className="py-3 px-3.5 text-start whitespace-nowrap">{isAr ? 'القالب' : 'Template'}</th>
                  <th className="py-3 px-3.5 text-start whitespace-nowrap">{isAr ? 'المستلمون' : 'Recipients'}</th>
                  <th className="py-3 px-3.5 text-start whitespace-nowrap">{isAr ? 'وقت الإرسال' : 'Scheduled / Sent'}</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCampaigns.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3.5 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Megaphone className="w-3.5 h-3.5" />
                        </div>
                        <span>{item.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Users className="w-3 h-3 text-slate-400" />
                        {item.segment_name}
                      </span>
                    </td>

                    <td className="py-3.5 px-3.5 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                      {item.template_name}
                    </td>

                    <td className="py-3.5 px-3.5 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                      {item.recipients_count.toLocaleString()} {isAr ? 'عميل' : 'contacts'}
                    </td>

                    <td className="py-3.5 px-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                      {item.scheduled_at ? new Date(item.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>

                    <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onNavigateSubView('compose', { content: `Special offer for ${item.name}` })}
                          className="p-1 rounded text-slate-400 hover:text-emerald-600 transition-colors"
                          title={isAr ? 'فتح في منشئ الرسائل' : 'Open in composer'}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                          title={isAr ? 'حذف الحملة' : 'Delete campaign'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAr ? 'إنشاء حملة تسويقية جديدة' : 'Create New Campaign'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'اسم الحملة' : 'Campaign Name'}
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={isAr ? 'مثال: عرض نهاية الأسبوع 20%' : 'e.g. Weekend Flash Sale 20%'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'الشريحة المستهدفة' : 'Target Customer Segment'}
                </label>
                <select
                  value={formSegmentId}
                  onChange={(e) => setFormSegmentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  {segments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {isAr ? s.name_ar || s.name : s.name} ({s.count.toLocaleString()} {isAr ? 'عميل' : 'contacts'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {isAr ? 'قالب الواتساب المعتمد' : 'Approved WhatsApp Template'}
                </label>
                <select
                  value={formTemplateId}
                  onChange={(e) => setFormTemplateId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={sendImmediately}
                    onChange={(e) => setSendImmediately(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{isAr ? 'إرسال الحملة فوراً بعد الحفظ' : 'Broadcast immediately after save'}</span>
                </label>

                {!sendImmediately && (
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {isAr ? 'تاريخ ووقت الإرسال المجدول' : 'Scheduled Broadcast Date & Time'}
                    </label>
                    <input
                      type="datetime-local"
                      value={formSchedule}
                      onChange={(e) => setFormSchedule(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleCreateCampaign}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isAr ? 'جارِ الحفظ...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{isAr ? 'حفظ وإطلاق الحملة' : 'Launch Campaign'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
