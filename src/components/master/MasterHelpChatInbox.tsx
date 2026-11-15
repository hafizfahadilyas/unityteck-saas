import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, Headphones, Loader2, RefreshCw, Save, Send, Sparkles } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { useTenant } from '../../context/TenantContext';
import { AdvancedDataTable, type AdvancedTableColumn } from '../common/AdvancedDataTable';
import { AdvancedFilterBar } from '../common/AdvancedFilterBar';
import { MasterLuxePanel, masterGhostBtnClass } from './MasterUiKit';
import { getStoreDisplayName } from '../../utils/storeLocalization';
import {
  createMasterHelpKb,
  fetchMasterHelpChatAgents,
  fetchMasterHelpChatAnalytics,
  fetchMasterHelpChatSession,
  fetchMasterHelpChatSessions,
  fetchMasterHelpChatSettings,
  fetchMasterHelpKb,
  masterHelpChatAiReply,
  patchMasterHelpChatSession,
  replyMasterHelpChat,
  saveMasterHelpChatSettings,
  type HelpChatMessage,
  type HelpChatSession,
  type HelpChatSettings,
} from '../../api/tenantApi';

type InboxTab = 'inbox' | 'kb' | 'agents' | 'settings';

export const MasterHelpChatInbox: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const { stores } = useTenant();
  const [tab, setTab] = useState<InboxTab>('inbox');
  const [rows, setRows] = useState<HelpChatSession[]>([]);
  const [meta, setMeta] = useState<{
    waiting?: number;
    total?: number;
    page?: number;
    per_page?: number;
    page_count?: number;
  }>({});
  const [analytics, setAnalytics] = useState<Record<string, number | string>>({});
  const [agents, setAgents] = useState<Array<{ id?: string; name?: string; email?: string; role?: string }>>([]);
  const [kbRows, setKbRows] = useState<
    Array<{
      id: string;
      title_en?: string;
      title_ar?: string;
      body_en?: string;
      body_ar?: string;
      suggested?: number | boolean;
      status?: string;
      category?: string;
    }>
  >([]);
  const [kbTitleEn, setKbTitleEn] = useState('');
  const [kbTitleAr, setKbTitleAr] = useState('');
  const [kbBodyEn, setKbBodyEn] = useState('');
  const [kbBodyAr, setKbBodyAr] = useState('');
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<HelpChatMessage[]>([]);
  const [selectedSession, setSelectedSession] = useState<HelpChatSession | null>(null);
  const [reply, setReply] = useState('');
  const [assignee, setAssignee] = useState('');
  const [settings, setSettings] = useState<HelpChatSettings>({});
  const [settingsStoreId, setSettingsStoreId] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  /** Default: all stores / all statuses so SuperAdmin sees every help thread. */
  const [statusFilter, setStatusFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortKey, setSortKey] = useState<string | null>('updated');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const storeLabel = useCallback(
    (storeId: string | null | undefined) => {
      const sid = String(storeId || '').trim();
      if (!sid) return isAr ? '—' : '—';
      const hit = stores.find((s) => s.id === sid);
      return hit ? getStoreDisplayName(hit, locale) : sid;
    },
    [stores, locale, isAr],
  );

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const loadSessions = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetchMasterHelpChatSessions({
        status: statusFilter === 'all' ? undefined : statusFilter,
        store_id: storeFilter.trim() || undefined,
        q: search.trim() || undefined,
        page,
        per_page: pageSize,
      });
      let data = Array.isArray(res?.data) ? res.data : [];
      if (dateFrom || dateTo) {
        data = data.filter((r) => {
          const d = String(r.created_at || r.escalated_at || '').slice(0, 10);
          if (!d) return true;
          if (dateFrom && d < dateFrom) return false;
          if (dateTo && d > dateTo) return false;
          return true;
        });
      }
      if (sortKey) {
        data = [...data].sort((a, b) => {
          const av =
            sortKey === 'store'
              ? String(a.store_id || '')
              : sortKey === 'status'
                ? String(a.status || '')
                : String(a.updated_at || a.escalated_at || '');
          const bv =
            sortKey === 'store'
              ? String(b.store_id || '')
              : sortKey === 'status'
                ? String(b.status || '')
                : String(b.updated_at || b.escalated_at || '');
          const cmp = av.localeCompare(bv);
          return sortDir === 'asc' ? cmp : -cmp;
        });
      }
      setRows(data);
      setMeta(res?.meta || {});
    } catch {
      toast(isAr ? 'تعذر تحميل المحادثات' : 'Failed to load help chats', 'error');
      setRows([]);
    } finally {
      setBusy(false);
    }
  }, [isAr, toast, statusFilter, storeFilter, search, page, pageSize, dateFrom, dateTo, sortKey, sortDir]);

  const loadSettings = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetchMasterHelpChatSettings(settingsStoreId.trim() || undefined);
      setSettings(res?.data || {});
    } catch {
      toast(isAr ? 'تعذر تحميل الإعدادات' : 'Failed to load settings', 'error');
    } finally {
      setBusy(false);
    }
  }, [isAr, toast, settingsStoreId]);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await fetchMasterHelpChatAnalytics();
      setAnalytics(res?.data || {});
    } catch {
      setAnalytics({});
    }
  }, []);

  const loadAgents = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetchMasterHelpChatAgents();
      setAgents(Array.isArray(res?.data) ? res.data : []);
    } catch {
      toast(isAr ? 'تعذر تحميل الوكلاء' : 'Failed to load agents', 'error');
      setAgents([]);
    } finally {
      setBusy(false);
    }
  }, [isAr, toast]);

  const loadKb = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetchMasterHelpKb();
      setKbRows(Array.isArray(res?.data) ? res.data : []);
    } catch {
      toast(isAr ? 'تعذر تحميل قاعدة المعرفة' : 'Failed to load knowledge base', 'error');
      setKbRows([]);
    } finally {
      setBusy(false);
    }
  }, [isAr, toast]);

  useEffect(() => {
    if (tab === 'inbox') {
      void loadSessions();
      void loadAnalytics();
      void loadAgents();
    } else if (tab === 'settings') void loadSettings();
    else if (tab === 'agents') void loadAgents();
    else if (tab === 'kb') void loadKb();
  }, [tab, loadSessions, loadSettings, loadAnalytics, loadAgents, loadKb]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, storeFilter, search, pageSize]);

  const openSession = async (id: string) => {
    setSelectedId(id);
    setBusy(true);
    try {
      const res = await fetchMasterHelpChatSession(id);
      setSelectedSession(res.data.session);
      setMessages(Array.isArray(res.data.messages) ? res.data.messages : []);
    } catch {
      toast(isAr ? 'تعذر فتح المحادثة' : 'Failed to open session', 'error');
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    if (!selectedId || !reply.trim()) return;
    try {
      await replyMasterHelpChat(selectedId, { body: reply.trim() });
      setReply('');
      toast(
        isAr ? 'تم إرسال الرد وإشعار صاحب المتجر' : 'Reply sent — store owner notified',
        'success',
      );
      await openSession(selectedId);
      await loadSessions();
    } catch {
      toast(isAr ? 'فشل إرسال الرد' : 'Reply failed', 'error');
    }
  };

  const draftWithAi = async (send: boolean) => {
    if (!selectedId) return;
    setAiBusy(true);
    try {
      const res = await masterHelpChatAiReply(selectedId, {
        hint: reply.trim() || undefined,
        send,
      });
      if (send) {
        setReply('');
        toast(
          isAr ? 'تم إرسال رد الذكاء الاصطناعي لصاحب المتجر' : 'AI reply sent to store owner',
          'success',
        );
        await openSession(selectedId);
        await loadSessions();
      } else if (res.data.draft) {
        setReply(res.data.draft);
        toast(isAr ? 'تم إنشاء مسودة بالذكاء الاصطناعي' : 'AI draft ready — edit then send', 'success');
      }
    } catch {
      toast(isAr ? 'فشل رد الذكاء الاصطناعي' : 'AI reply failed', 'error');
    } finally {
      setAiBusy(false);
    }
  };

  const resolveSession = async (id: string) => {
    try {
      await patchMasterHelpChatSession(id, { status: 'resolved' });
      toast(isAr ? 'تم الإغلاق' : 'Resolved', 'success');
      await loadSessions();
      void loadAnalytics();
      if (selectedId === id) await openSession(id);
    } catch {
      toast(isAr ? 'فشل الإغلاق' : 'Resolve failed', 'error');
    }
  };

  const assignSession = async () => {
    if (!selectedId || !assignee.trim()) return;
    try {
      await patchMasterHelpChatSession(selectedId, {
        status: 'human_active',
        assignee: assignee.trim(),
      });
      toast(isAr ? 'تم التعيين' : 'Assigned', 'success');
      await openSession(selectedId);
      await loadSessions();
    } catch {
      toast(isAr ? 'فشل التعيين' : 'Assign failed', 'error');
    }
  };

  const createKb = async () => {
    if (!kbTitleEn.trim() && !kbTitleAr.trim()) {
      toast(isAr ? 'العنوان مطلوب' : 'Title required', 'error');
      return;
    }
    try {
      await createMasterHelpKb({
        title_en: kbTitleEn.trim() || kbTitleAr.trim(),
        title_ar: kbTitleAr.trim() || kbTitleEn.trim(),
        body_en: kbBodyEn,
        body_ar: kbBodyAr,
        suggested: true,
        status: 'published',
      });
      setKbTitleEn('');
      setKbTitleAr('');
      setKbBodyEn('');
      setKbBodyAr('');
      toast(isAr ? 'تمت إضافة المقال' : 'Article added', 'success');
      await loadKb();
    } catch {
      toast(isAr ? 'فشل الإنشاء' : 'Create failed', 'error');
    }
  };

  const saveSettings = async () => {
    try {
      const res = await saveMasterHelpChatSettings({
        ...settings,
        store_id: settingsStoreId.trim() || null,
      });
      setSettings(res.data);
      toast(isAr ? 'تم حفظ إعدادات الروبوت' : 'Chatbot settings saved', 'success');
    } catch {
      toast(isAr ? 'فشل الحفظ' : 'Save failed', 'error');
    }
  };

  const onSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const statusLabel = (status: string) => {
    if (!isAr) return status || '—';
    const map: Record<string, string> = {
      waiting_human: 'بانتظار الإدارة',
      human_active: 'محادثة بشرية',
      ai_active: 'ذكاء اصطناعي',
      escalated: 'مُصعَّد',
      resolved: 'مُغلقة',
      closed: 'مغلقة',
    };
    return map[status] || status || '—';
  };

  const columns = useMemo<AdvancedTableColumn<HelpChatSession>[]>(
    () => [
      {
        key: 'store',
        header: isAr ? 'المتجر' : 'Store',
        sortable: true,
        render: (r) => (
          <button type="button" className="text-start w-full" onClick={() => void openSession(String(r.id))}>
            <div className="font-bold text-sm" style={{ color: 'var(--accent)' }}>
              {storeLabel(r.store_id)}
            </div>
            <div className="text-[11px] line-clamp-2" style={{ color: 'var(--muted)' }}>
              {String(r.subject || r.requester_email || '—')}
            </div>
          </button>
        ),
      },
      {
        key: 'status',
        header: isAr ? 'الحالة' : 'Status',
        sortable: true,
        render: (r) => (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
              color: 'var(--accent)',
            }}
          >
            {statusLabel(String(r.status || ''))}
          </span>
        ),
      },
      {
        key: 'updated',
        header: isAr ? 'آخر تحديث' : 'Updated',
        sortable: true,
        render: (r) => (
          <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
            {String(r.escalated_at || r.updated_at || '—')}
          </span>
        ),
      },
      {
        key: 'action',
        header: isAr ? 'إجراء' : 'Action',
        render: (r) => (
          <div className="flex flex-wrap gap-1">
            <button type="button" className={masterGhostBtnClass} onClick={() => void openSession(String(r.id))}>
              {isAr ? 'فتح' : 'Open'}
            </button>
            {r.status !== 'resolved' && r.status !== 'closed' ? (
              <button type="button" className={masterGhostBtnClass} onClick={() => void resolveSession(String(r.id))}>
                {isAr ? 'إغلاق' : 'Resolve'}
              </button>
            ) : null}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAr, storeLabel],
  );

  const total = meta.total ?? rows.length;

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={tab === 'inbox' ? 'unity-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold' : masterGhostBtnClass}
          onClick={() => setTab('inbox')}
        >
          <span className="inline-flex items-center gap-1">
            <Headphones className="w-3.5 h-3.5" />
            {isAr ? 'كل المحادثات' : 'All conversations'}
            {typeof meta.waiting === 'number' ? ` (${meta.waiting})` : ''}
          </span>
        </button>
        <button
          type="button"
          className={tab === 'kb' ? 'unity-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold' : masterGhostBtnClass}
          onClick={() => setTab('kb')}
        >
          {isAr ? 'قاعدة المعرفة' : 'Knowledge Base'}
        </button>
        <button
          type="button"
          className={tab === 'agents' ? 'unity-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold' : masterGhostBtnClass}
          onClick={() => setTab('agents')}
        >
          {isAr ? 'الوكلاء' : 'Agents'}
        </button>
        <button
          type="button"
          className={tab === 'settings' ? 'unity-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold' : masterGhostBtnClass}
          onClick={() => setTab('settings')}
        >
          {isAr ? 'تفعيل الذكاء الاصطناعي' : 'AI enable / customize'}
        </button>
        <button
          type="button"
          className={masterGhostBtnClass}
          onClick={() => {
            if (tab === 'inbox') {
              void loadSessions();
              void loadAnalytics();
            } else if (tab === 'settings') void loadSettings();
            else if (tab === 'kb') void loadKb();
            else void loadAgents();
          }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {tab === 'inbox' && Object.keys(analytics).length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
          {(
            [
              ['sessions_total', isAr ? 'الكل' : 'Total'],
              ['ai_active', isAr ? 'ذكاء اصطناعي' : 'AI'],
              ['waiting_human', isAr ? 'بانتظار' : 'Waiting'],
              ['human_active', isAr ? 'بشري' : 'Human'],
              ['escalated', isAr ? 'مُصعَّد' : 'Escalated'],
              ['resolved', isAr ? 'مُغلق' : 'Resolved'],
              ['tickets_open', isAr ? 'تذاكر' : 'Tickets'],
              ['ai_replies_used_period', isAr ? 'ردود AI' : 'AI used'],
            ] as const
          ).map(([key, label]) => (
            <div
              key={key}
              className="rounded-xl border px-3 py-2"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
                {label}
              </div>
              <div className="text-lg font-black tabular-nums">{String(analytics[key] ?? 0)}</div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'inbox' ? (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3 min-w-0 space-y-2">
            <AdvancedDataTable
              rows={rows}
              columns={columns}
              rowKey={(row) => String(row.id)}
              search={searchInput}
              onSearchChange={setSearchInput}
              searchPlaceholder={isAr ? 'بحث بالمتجر أو السؤال أو البريد…' : 'Search store, question, email…'}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(n) => {
                setPageSize(n);
                setPage(1);
              }}
              total={total}
              loading={busy && rows.length === 0}
              emptyMessage={isAr ? 'لا توجد محادثات مساعدة' : 'No help chat sessions'}
              pageSizeOptions={[10, 25, 50, 100]}
              filters={
                <AdvancedFilterBar
                  filterValues={{ status: statusFilter, store: storeFilter || 'all' }}
                  onFilterChange={(key, value) => {
                    if (key === 'status') setStatusFilter(value);
                    if (key === 'store') setStoreFilter(value === 'all' ? '' : value);
                  }}
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  onDateFromChange={setDateFrom}
                  onDateToChange={setDateTo}
                  showDates
                  onReset={() => {
                    setStatusFilter('all');
                    setStoreFilter('');
                    setSearchInput('');
                    setSearch('');
                    setDateFrom('');
                    setDateTo('');
                    setPage(1);
                  }}
                  activeCount={
                    (statusFilter !== 'all' ? 1 : 0) +
                    (storeFilter.trim() ? 1 : 0) +
                    (dateFrom || dateTo ? 1 : 0)
                  }
                  fields={[
                    {
                      key: 'store',
                      label: isAr ? 'المتجر' : 'Store',
                      options: [
                        { value: 'all', label: isAr ? 'كل المتاجر' : 'All stores' },
                        ...stores.map((s) => ({
                          value: s.id,
                          label: getStoreDisplayName(s, locale),
                        })),
                      ],
                    },
                    {
                      key: 'status',
                      label: isAr ? 'الحالة' : 'Status',
                      options: [
                        { value: 'all', label: isAr ? 'الكل' : 'All' },
                        { value: 'waiting_human', label: isAr ? 'بانتظار الإدارة' : 'Waiting human' },
                        { value: 'human_active', label: isAr ? 'محادثة بشرية' : 'Human active' },
                        { value: 'ai_active', label: isAr ? 'ذكاء اصطناعي' : 'AI active' },
                        { value: 'escalated', label: isAr ? 'مُصعَّد' : 'Escalated' },
                        { value: 'resolved', label: isAr ? 'مُغلقة' : 'Resolved' },
                      ],
                    },
                  ]}
                />
              }
            />
          </div>

          <MasterLuxePanel className="xl:col-span-2 min-h-[420px] flex flex-col" padding="lg">
            {!selectedId ? (
              <div className="flex-1 flex items-center justify-center text-sm p-6 text-center" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? 'اختر محادثة لترى سؤال صاحب المتجر — رد يدوياً أو بالذكاء الاصطناعي.'
                  : 'Select a session to see the store owner question — reply manually or with AI.'}
              </div>
            ) : (
              <>
                <div className="border-b pb-3 mb-3" style={{ borderColor: 'var(--border)' }}>
                  <div className="text-sm font-bold">
                    {isAr ? 'المتجر' : 'Store'}: {storeLabel(selectedSession?.store_id)}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                    {selectedSession?.requester_email || selectedSession?.requester_name || '—'} ·{' '}
                    {statusLabel(String(selectedSession?.status || ''))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 max-h-[360px] mb-3">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl px-3 py-2 text-sm"
                      style={{
                        background:
                          m.role === 'human'
                            ? 'color-mix(in srgb, var(--accent) 16%, var(--surface))'
                            : m.role === 'user'
                              ? 'var(--border)'
                              : 'transparent',
                        border: m.role === 'system' ? '1px dashed var(--border)' : undefined,
                      }}
                    >
                      <div className="text-[10px] font-bold mb-0.5" style={{ color: 'var(--muted)' }}>
                        {m.role === 'user'
                          ? isAr
                            ? 'صاحب المتجر'
                            : 'Store owner'
                          : m.role === 'human'
                            ? isAr
                              ? 'أنت (الإدارة)'
                              : 'You (Master)'
                            : m.role === 'assistant'
                              ? isAr
                                ? 'الذكاء الاصطناعي'
                                : 'AI'
                              : isAr
                                ? 'النظام'
                                : 'System'}
                      </div>
                      <div className="whitespace-pre-wrap break-words">{m.body}</div>
                      {m.attachment_url ? (
                        <a href={m.attachment_url} target="_blank" rel="noreferrer" className="block mt-2">
                          <img src={m.attachment_url} alt="" className="max-h-32 rounded-lg object-cover" />
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mb-2 items-center">
                  <button
                    type="button"
                    className={masterGhostBtnClass}
                    disabled={aiBusy}
                    onClick={() => void draftWithAi(false)}
                  >
                    {aiBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {isAr ? 'مسودة ذكاء اصطناعي' : 'AI draft'}
                  </button>
                  <button
                    type="button"
                    className={masterGhostBtnClass}
                    disabled={aiBusy}
                    onClick={() => void draftWithAi(true)}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    {isAr ? 'إرسال بالذكاء الاصطناعي' : 'Send with AI'}
                  </button>
                  <input
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    list="help-agents-list"
                    placeholder={isAr ? 'تعيين وكيل…' : 'Assign agent…'}
                    className="rounded-xl border px-2 py-1 text-xs min-w-[8rem]"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                  />
                  <datalist id="help-agents-list">
                    {agents.map((a) => (
                      <option key={String(a.id || a.email)} value={a.email || a.name || ''} />
                    ))}
                  </datalist>
                  <button type="button" className={masterGhostBtnClass} onClick={() => void assignSession()}>
                    {isAr ? 'تعيين' : 'Assign'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={2}
                    className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                    placeholder={isAr ? 'اكتب الرد لصاحب المتجر…' : 'Write reply to store owner…'}
                  />
                  <button
                    type="button"
                    className="unity-btn-primary px-3 rounded-xl self-stretch"
                    onClick={() => void sendReply()}
                    disabled={!reply.trim()}
                    title={isAr ? 'رد بشري' : 'Human reply'}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </MasterLuxePanel>
        </div>
      ) : tab === 'kb' ? (
        <MasterLuxePanel className="space-y-4" padding="lg">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'مقالات قاعدة المعرفة والأسئلة الشائعة تغذي ردود الذكاء الاصطناعي واقتراحات المتجر.'
              : 'Knowledge base & FAQ articles feed AI replies and store suggested questions.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              value={kbTitleEn}
              onChange={(e) => setKbTitleEn(e.target.value)}
              placeholder={isAr ? 'العنوان (إنجليزي)' : 'Title (EN)'}
              className="rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            />
            <input
              value={kbTitleAr}
              onChange={(e) => setKbTitleAr(e.target.value)}
              placeholder={isAr ? 'العنوان (عربي)' : 'Title (AR)'}
              dir="rtl"
              className="rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            />
            <textarea
              value={kbBodyEn}
              onChange={(e) => setKbBodyEn(e.target.value)}
              rows={3}
              placeholder={isAr ? 'المحتوى (إنجليزي)' : 'Body (EN)'}
              className="rounded-xl border px-3 py-2 text-sm sm:col-span-1"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            />
            <textarea
              value={kbBodyAr}
              onChange={(e) => setKbBodyAr(e.target.value)}
              rows={3}
              dir="rtl"
              placeholder={isAr ? 'المحتوى (عربي)' : 'Body (AR)'}
              className="rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            />
          </div>
          <button type="button" className="unity-btn-primary px-4 py-2 rounded-xl text-sm font-bold" onClick={() => void createKb()}>
            {isAr ? 'إضافة مقال' : 'Add article'}
          </button>
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {kbRows.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد مقالات' : 'No articles'}
              </p>
            ) : (
              kbRows.map((a) => (
                <div key={a.id} className="rounded-xl border p-3 text-sm" style={{ borderColor: 'var(--border)' }}>
                  <div className="font-bold">{isAr ? a.title_ar || a.title_en : a.title_en || a.title_ar}</div>
                  <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                    {a.category} · {a.status}
                    {a.suggested ? (isAr ? ' · مقترح' : ' · suggested') : ''}
                  </div>
                  <p className="text-xs mt-1 line-clamp-3" style={{ color: 'var(--muted)' }}>
                    {isAr ? a.body_ar || a.body_en : a.body_en || a.body_ar}
                  </p>
                </div>
              ))
            )}
          </div>
        </MasterLuxePanel>
      ) : tab === 'agents' ? (
        <MasterLuxePanel className="space-y-3" padding="lg">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'الوكلاء من حسابات المنصة الحالية (بدون نظام مصادقة مكرر). عيّن وكيلاً من درج المحادثة.'
              : 'Agents from existing platform users (no duplicate auth). Assign from the conversation drawer.'}
          </p>
          {agents.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {isAr ? 'لا يوجد وكلاء' : 'No agents found'}
            </p>
          ) : (
            <ul className="space-y-2">
              {agents.map((a) => (
                <li
                  key={String(a.id || a.email)}
                  className="rounded-xl border px-3 py-2 text-sm flex flex-wrap justify-between gap-2"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span className="font-bold">{a.name || a.email || a.id}</span>
                  <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                    {a.email} · {a.role}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </MasterLuxePanel>
      ) : (
        <MasterLuxePanel className="space-y-4 max-w-3xl" padding="lg">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'الخطة المجانية: بدون ردود ذكاء اصطناعي. المدفوعة ١٠٠ · الاحترافية ٣٠٠ · المميزة/المخصصة ٥٠٠ رد شهرياً.'
              : 'Free plan: no AI replies. Paid 100 · Pro 300 · Premium/Custom 500 AI replies per month.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs space-y-1">
              <span style={{ color: 'var(--muted)' }}>
                {isAr ? 'معرّف المتجر (فارغ = عام للمنصة)' : 'Store id (empty = platform default)'}
              </span>
              <input
                value={settingsStoreId}
                onChange={(e) => setSettingsStoreId(e.target.value)}
                onBlur={() => void loadSettings()}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                placeholder="store-1"
              />
            </label>
            <label className="text-xs flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={Boolean(settings.enabled ?? true)}
                onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
              />
              {isAr ? 'تفعيل روبوت المساعدة' : 'Enable help chatbot'}
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs space-y-1">
              <span style={{ color: 'var(--muted)' }}>{isAr ? 'اسم الروبوت (إنجليزي)' : 'Bot name (EN)'}</span>
              <input
                value={settings.bot_name_en || ''}
                onChange={(e) => setSettings((s) => ({ ...s, bot_name_en: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              />
            </label>
            <label className="text-xs space-y-1">
              <span style={{ color: 'var(--muted)' }}>{isAr ? 'اسم الروبوت (عربي)' : 'Bot name (AR)'}</span>
              <input
                value={settings.bot_name_ar || ''}
                onChange={(e) => setSettings((s) => ({ ...s, bot_name_ar: e.target.value }))}
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                dir="rtl"
              />
            </label>
          </div>

          <label className="text-xs space-y-1 block">
            <span style={{ color: 'var(--muted)' }}>{isAr ? 'ترحيب إنجليزي' : 'Welcome (EN)'}</span>
            <textarea
              value={settings.welcome_en || ''}
              onChange={(e) => setSettings((s) => ({ ...s, welcome_en: e.target.value }))}
              rows={2}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            />
          </label>
          <label className="text-xs space-y-1 block">
            <span style={{ color: 'var(--muted)' }}>{isAr ? 'ترحيب عربي' : 'Welcome (AR)'}</span>
            <textarea
              value={settings.welcome_ar || ''}
              onChange={(e) => setSettings((s) => ({ ...s, welcome_ar: e.target.value }))}
              rows={2}
              dir="rtl"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            />
          </label>
          <label className="text-xs space-y-1 block">
            <span style={{ color: 'var(--muted)' }}>{isAr ? 'تعليمات النظام (إنجليزي)' : 'System prompt (EN)'}</span>
            <textarea
              value={settings.system_prompt_en || ''}
              onChange={(e) => setSettings((s) => ({ ...s, system_prompt_en: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            />
          </label>
          <label className="text-xs space-y-1 block">
            <span style={{ color: 'var(--muted)' }}>{isAr ? 'تعليمات النظام (عربي)' : 'System prompt (AR)'}</span>
            <textarea
              value={settings.system_prompt_ar || ''}
              onChange={(e) => setSettings((s) => ({ ...s, system_prompt_ar: e.target.value }))}
              rows={3}
              dir="rtl"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            />
          </label>

          <div className="flex flex-wrap gap-4 text-xs">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(settings.voice_enabled ?? true)}
                onChange={(e) => setSettings((s) => ({ ...s, voice_enabled: e.target.checked }))}
              />
              {isAr ? 'الصوت' : 'Voice'}
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(settings.image_enabled ?? true)}
                onChange={(e) => setSettings((s) => ({ ...s, image_enabled: e.target.checked }))}
              />
              {isAr ? 'الصور / لقطات الشاشة' : 'Images / screenshots'}
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(settings.human_handoff_enabled ?? true)}
                onChange={(e) => setSettings((s) => ({ ...s, human_handoff_enabled: e.target.checked }))}
              />
              {isAr ? 'التحويل إلى إنسان' : 'Human handoff'}
            </label>
          </div>

          <button
            type="button"
            className="unity-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
            onClick={() => void saveSettings()}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isAr ? 'حفظ التخصيص' : 'Save customization'}
          </button>
        </MasterLuxePanel>
      )}
    </div>
  );
};

export default MasterHelpChatInbox;
