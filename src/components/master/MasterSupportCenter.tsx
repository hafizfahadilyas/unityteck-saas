import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  createMasterCsItem,
  createMasterSupportTicket,
  fetchMasterCsCollection,
  fetchMasterSupportTickets,
  patchMasterCsItem,
  patchMasterSupportTicket,
  replyMasterSupportTicket,
  type MasterCsCollection,
} from '../../api/tenantApi';
import { Headphones, Plus, RefreshCw } from 'lucide-react';
import { MasterLuxePanel, MasterMetaLine, MasterTabPills, masterGhostBtnClass } from './MasterUiKit';
import { AdvancedDataTable, type AdvancedTableColumn } from '../common/AdvancedDataTable';
import { AdvancedFilterBar } from '../common/AdvancedFilterBar';
import { pipelineAdvancedList, useAdvancedListState } from '../../hooks/useAdvancedListState';

type CsTab =
  | 'tickets'
  | 'complaints'
  | 'surveys'
  | 'announcements'
  | 'incidents'
  | 'help';

/** SOUQ PLUS Phase 1 tickets + Phase 4 CS CMS (real MySQL). */
export const MasterSupportCenter: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const [csTab, setCsTab] = useState<CsTab>('tickets');
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [cmsRows, setCmsRows] = useState<Array<Record<string, unknown>>>([]);
  const [meta, setMeta] = useState<{ open?: number; source?: string }>({});
  const [cmsMeta, setCmsMeta] = useState<{ source?: string }>({});
  const [busy, setBusy] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [closeReason, setCloseReason] = useState('');
  const [cmsTitle, setCmsTitle] = useState('');
  const [cmsBody, setCmsBody] = useState('');

  const ticketList = useAdvancedListState({
    initialPageSize: 10,
    initialSortKey: 'created',
    initialSortDir: 'desc',
    initialFilters: { status: 'all', priority: 'all' },
  });
  const cmsList = useAdvancedListState({
    initialPageSize: 10,
    initialSortKey: 'created',
    initialSortDir: 'desc',
    initialFilters: { status: 'all' },
  });

  const loadTickets = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetchMasterSupportTickets();
      setRows(Array.isArray(res?.data) ? res.data : []);
      setMeta(res?.meta || {});
    } catch {
      toast(isAr ? 'تعذر تحميل التذاكر' : 'Failed to load tickets', 'error');
      setRows([]);
    } finally {
      setBusy(false);
    }
  }, [isAr, toast]);

  const loadCms = useCallback(
    async (tab: Exclude<CsTab, 'tickets'>) => {
      setBusy(true);
      try {
        const collection = tab as MasterCsCollection;
        const res = await fetchMasterCsCollection(collection);
        setCmsRows(Array.isArray(res?.data) ? res.data : []);
        setCmsMeta(res?.meta || {});
      } catch {
        toast(isAr ? 'تعذر تحميل القسم' : 'Failed to load section', 'error');
        setCmsRows([]);
      } finally {
        setBusy(false);
      }
    },
    [isAr, toast],
  );

  useEffect(() => {
    if (csTab === 'tickets') void loadTickets();
    else void loadCms(csTab);
  }, [csTab, loadTickets, loadCms]);

  const create = async () => {
    if (!subject.trim()) {
      toast(isAr ? 'الموضوع مطلوب' : 'Subject is required', 'error');
      return;
    }
    try {
      await createMasterSupportTicket({
        subject: subject.trim(),
        description: description.trim(),
        priority,
      });
      setSubject('');
      setDescription('');
      toast(isAr ? 'تم إنشاء التذكرة' : 'Ticket created', 'success');
      await loadTickets();
    } catch {
      toast(isAr ? 'فشل الإنشاء' : 'Create failed', 'error');
    }
  };

  const closeTicket = async (id: string) => {
    if (!closeReason.trim()) {
      toast(isAr ? 'سبب الإغلاق مطلوب' : 'Closure reason required', 'error');
      return;
    }
    try {
      await patchMasterSupportTicket(id, {
        status: 'closed',
        closure_reason: closeReason.trim(),
      });
      setCloseReason('');
      toast(isAr ? 'تم الإغلاق' : 'Closed', 'success');
      await loadTickets();
    } catch {
      toast(isAr ? 'فشل الإغلاق' : 'Close failed', 'error');
    }
  };

  const sendReply = async (id: string) => {
    if (!reply.trim()) return;
    try {
      await replyMasterSupportTicket(id, reply.trim());
      setReply('');
      toast(isAr ? 'تم إرسال الرد' : 'Reply sent', 'success');
      await loadTickets();
    } catch {
      toast(isAr ? 'فشل الرد' : 'Reply failed', 'error');
    }
  };

  const createCms = async () => {
    if (!cmsTitle.trim()) {
      toast(isAr ? 'العنوان مطلوب' : 'Title required', 'error');
      return;
    }
    if (csTab === 'tickets') return;
    try {
      if (csTab === 'help') {
        await createMasterCsItem('help', {
          title_en: cmsTitle.trim(),
          title_ar: cmsTitle.trim(),
          body_en: cmsBody.trim(),
          body_ar: cmsBody.trim(),
          status: 'draft',
        });
      } else {
        await createMasterCsItem(csTab, {
          title: cmsTitle.trim(),
          body: cmsBody.trim(),
        });
      }
      setCmsTitle('');
      setCmsBody('');
      toast(isAr ? 'تم الإنشاء' : 'Created', 'success');
      await loadCms(csTab);
    } catch {
      toast(isAr ? 'فشل الإنشاء' : 'Create failed', 'error');
    }
  };

  const closeCms = async (id: string) => {
    if (csTab === 'tickets' || csTab === 'help') return;
    try {
      await patchMasterCsItem(csTab, id, { status: 'closed' });
      toast(isAr ? 'تم الإغلاق' : 'Closed', 'success');
      await loadCms(csTab);
    } catch {
      toast(isAr ? 'فشل الإغلاق' : 'Close failed', 'error');
    }
  };

  const ticketPipe = useMemo(
    () =>
      pipelineAdvancedList({
        rows,
        search: ticketList.search,
        getSearchBlob: (row) => `${row.subject} ${row.description} ${row.status} ${row.priority}`,
        filters: ticketList.filters,
        matchFilter: (row, key, value) => {
          if (key === 'status') return String(row.status || '') === value;
          if (key === 'priority') return String(row.priority || '') === value;
          return true;
        },
        dateFrom: ticketList.dateFrom,
        dateTo: ticketList.dateTo,
        getDate: (row) => (row.created_at ? String(row.created_at) : null),
        sortKey: ticketList.sortKey,
        sortDir: ticketList.sortDir,
        getSortValue: (row, key) => {
          if (key === 'subject') return String(row.subject || '');
          if (key === 'status') return String(row.status || '');
          if (key === 'priority') return String(row.priority || '');
          if (key === 'created') return String(row.created_at || '');
          return '';
        },
        page: ticketList.page,
        pageSize: ticketList.pageSize,
      }),
    [rows, ticketList],
  );

  const cmsPipe = useMemo(
    () =>
      pipelineAdvancedList({
        rows: cmsRows,
        search: cmsList.search,
        getSearchBlob: (row) =>
          `${row.title} ${row.title_ar} ${row.title_en} ${row.body} ${row.body_ar} ${row.body_en} ${row.status}`,
        filters: cmsList.filters,
        matchFilter: (row, key, value) => {
          if (key === 'status') return String(row.status || '') === value;
          return true;
        },
        dateFrom: cmsList.dateFrom,
        dateTo: cmsList.dateTo,
        getDate: (row) => (row.created_at ? String(row.created_at) : null),
        sortKey: cmsList.sortKey,
        sortDir: cmsList.sortDir,
        getSortValue: (row, key) => {
          if (key === 'title') return String(row.title || row.title_ar || row.title_en || '');
          if (key === 'status') return String(row.status || '');
          if (key === 'created') return String(row.created_at || '');
          return '';
        },
        page: cmsList.page,
        pageSize: cmsList.pageSize,
      }),
    [cmsRows, cmsList],
  );

  const ticketColumns = useMemo<AdvancedTableColumn<Record<string, unknown>>[]>(
    () => [
      {
        key: 'subject',
        header: isAr ? 'الموضوع' : 'Subject',
        sortable: true,
        render: (r) => (
          <button
            type="button"
            className="text-start w-full"
            onClick={() => setSelected(String(r.id))}
          >
            <div className="font-bold">{String(r.subject || '')}</div>
            {selected === String(r.id) ? (
              <p className="text-[11px] mt-1 line-clamp-3" style={{ color: 'var(--muted)' }}>
                {String(r.description || '—')}
              </p>
            ) : null}
          </button>
        ),
      },
      {
        key: 'status',
        header: isAr ? 'الحالة' : 'Status',
        sortable: true,
        render: (r) => String(r.status),
      },
      {
        key: 'priority',
        header: isAr ? 'الأولوية' : 'Priority',
        sortable: true,
        render: (r) => String(r.priority),
      },
      {
        key: 'created',
        header: isAr ? 'التاريخ' : 'Date',
        sortable: true,
        render: (r) => (
          <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
            {String(r.created_at || '—')}
          </span>
        ),
      },
      {
        key: 'action',
        header: isAr ? 'إجراء' : 'Action',
        render: (r) => {
          const id = String(r.id);
          if (selected !== id) {
            return (
              <button
                type="button"
                className="text-xs font-bold"
                style={{ color: 'var(--accent)' }}
                onClick={() => setSelected(id)}
              >
                {isAr ? 'فتح' : 'Open'}
              </button>
            );
          }
          return (
            <div className="space-y-2 min-w-[12rem]">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                placeholder={isAr ? 'رد…' : 'Reply…'}
                className="w-full rounded-lg border text-xs px-2 py-1.5"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                  background: 'var(--bg)',
                  fontFamily: 'var(--font-ui)',
                }}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-xs font-bold"
                  style={{ color: 'var(--accent)' }}
                  onClick={() => void sendReply(id)}
                >
                  {isAr ? 'إرسال رد' : 'Send reply'}
                </button>
                {String(r.status) !== 'closed' ? (
                  <>
                    <input
                      value={closeReason}
                      onChange={(e) => setCloseReason(e.target.value)}
                      placeholder={isAr ? 'سبب الإغلاق' : 'Closure reason'}
                      className="flex-1 min-w-[6rem] rounded-lg border text-xs px-2 py-1"
                      style={{
                        borderColor: 'var(--border)',
                        color: 'var(--text)',
                        background: 'var(--bg)',
                        fontFamily: 'var(--font-ui)',
                      }}
                    />
                    <button
                      type="button"
                      className="text-xs font-bold"
                      style={{ color: 'var(--tone-danger, #e11d48)' }}
                      onClick={() => void closeTicket(id)}
                    >
                      {isAr ? 'إغلاق' : 'Close'}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          );
        },
      },
    ],
    [isAr, selected, reply, closeReason],
  );

  const cmsColumns = useMemo<AdvancedTableColumn<Record<string, unknown>>[]>(
    () => [
      {
        key: 'title',
        header: isAr ? 'العنوان' : 'Title',
        sortable: true,
        render: (r) => (
          <div className="min-w-0 max-w-sm">
            <div className="font-bold">{String(r.title || r.title_ar || r.title_en || '')}</div>
            <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>
              {String(r.body || r.body_ar || r.body_en || '')}
            </p>
          </div>
        ),
      },
      {
        key: 'status',
        header: isAr ? 'الحالة' : 'Status',
        sortable: true,
        render: (r) => String(r.status || '—'),
      },
      {
        key: 'created',
        header: isAr ? 'التاريخ' : 'Date',
        sortable: true,
        render: (r) => (
          <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
            {String(r.created_at || '—')}
          </span>
        ),
      },
      {
        key: 'action',
        header: isAr ? 'إجراء' : 'Action',
        render: (r) =>
          csTab !== 'help' && String(r.status) !== 'closed' ? (
            <button
              type="button"
              className="text-xs font-bold"
              style={{ color: 'var(--tone-danger, #e11d48)' }}
              onClick={() => void closeCms(String(r.id))}
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          ) : (
            <span style={{ color: 'var(--muted)' }}>—</span>
          ),
      },
    ],
    [isAr, csTab],
  );

  const fieldStyle: React.CSSProperties = {
    borderColor: 'var(--border)',
    color: 'var(--text)',
    background: 'var(--bg)',
    fontFamily: 'var(--font-ui)',
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'خدمة العملاء والتواصل' : 'Customer Service & Communication'}
        subtitle={
          isAr
            ? 'تذاكر الدعم وأقسام خدمة العملاء من قاعدة البيانات'
            : 'Support tickets and CS sections from MySQL'
        }
        badge={
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ color: 'var(--accent)' }}>
            <Headphones className="w-3.5 h-3.5 inline me-1" aria-hidden />
            {meta.open ?? 0} {isAr ? 'مفتوحة' : 'open'}
          </span>
        }
        actions={
          <button
            type="button"
            className={masterGhostBtnClass}
            onClick={() => (csTab === 'tickets' ? void loadTickets() : void loadCms(csTab))}
            disabled={busy}
            aria-busy={busy}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        }
      />

      <MasterTabPills
        className="mt-4"
        active={csTab}
        onChange={(id) => setCsTab(id as CsTab)}
        tabs={[
          { id: 'tickets', label: isAr ? 'التذاكر' : 'Tickets' },
          { id: 'complaints', label: isAr ? 'الشكاوى' : 'Complaints' },
          { id: 'surveys', label: isAr ? 'الاستبيانات' : 'Surveys' },
          { id: 'announcements', label: isAr ? 'الإعلانات' : 'Announcements' },
          { id: 'incidents', label: isAr ? 'الحوادث' : 'Incidents' },
          { id: 'help', label: isAr ? 'مركز المساعدة' : 'Help Center' },
        ]}
      />

      {csTab === 'tickets' ? (
        <>
          <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
            <MasterLuxePanel className="space-y-3 xl:col-span-1" padding="lg">
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                {isAr ? 'تذكرة جديدة' : 'New ticket'}
              </p>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={isAr ? 'الموضوع' : 'Subject'}
                className="w-full rounded-xl border text-sm px-3 py-2"
                style={fieldStyle}
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder={isAr ? 'الوصف' : 'Description'}
                className="w-full rounded-xl border text-sm px-3 py-2"
                style={fieldStyle}
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border text-sm px-3 py-2"
                style={fieldStyle}
              >
                <option value="low">{isAr ? 'منخفضة' : 'Low'}</option>
                <option value="medium">{isAr ? 'متوسطة' : 'Medium'}</option>
                <option value="high">{isAr ? 'عالية' : 'High'}</option>
                <option value="urgent">{isAr ? 'عاجلة' : 'Urgent'}</option>
              </select>
              <button
                type="button"
                className="unity-btn-primary text-sm inline-flex items-center gap-1.5"
                onClick={() => void create()}
              >
                <Plus className="w-3.5 h-3.5" aria-hidden />
                {isAr ? 'إنشاء' : 'Create'}
              </button>
            </MasterLuxePanel>

            <div className="xl:col-span-2 min-w-0">
              <AdvancedDataTable
                rows={ticketPipe.pageRows}
                columns={ticketColumns}
                rowKey={(row) => String(row.id)}
                search={ticketList.search}
                onSearchChange={ticketList.setSearch}
                searchPlaceholder={isAr ? 'بحث في التذاكر…' : 'Search tickets…'}
                sortKey={ticketList.sortKey}
                sortDir={ticketList.sortDir}
                onSort={ticketList.onSort}
                page={ticketPipe.safePage}
                pageSize={ticketList.pageSize}
                onPageChange={ticketList.setPage}
                onPageSizeChange={ticketList.setPageSize}
                total={ticketPipe.total}
                loading={busy && rows.length === 0}
                emptyMessage={isAr ? 'لا توجد سجلات' : 'No records found'}
                filters={
                  <AdvancedFilterBar
                    filterValues={ticketList.filters}
                    onFilterChange={ticketList.setFilter}
                    dateFrom={ticketList.dateFrom}
                    dateTo={ticketList.dateTo}
                    onDateFromChange={ticketList.setDateFrom}
                    onDateToChange={ticketList.setDateTo}
                    onReset={ticketList.resetAll}
                    activeCount={ticketList.activeFilterCount}
                    fields={[
                      {
                        key: 'status',
                        label: isAr ? 'الحالة' : 'Status',
                        options: [
                          { value: 'all', label: isAr ? 'الكل' : 'All' },
                          { value: 'open', label: isAr ? 'مفتوحة' : 'Open' },
                          { value: 'closed', label: isAr ? 'مغلقة' : 'Closed' },
                        ],
                      },
                      {
                        key: 'priority',
                        label: isAr ? 'الأولوية' : 'Priority',
                        options: [
                          { value: 'all', label: isAr ? 'الكل' : 'All' },
                          { value: 'low', label: isAr ? 'منخفضة' : 'Low' },
                          { value: 'medium', label: isAr ? 'متوسطة' : 'Medium' },
                          { value: 'high', label: isAr ? 'عالية' : 'High' },
                          { value: 'urgent', label: isAr ? 'عاجلة' : 'Urgent' },
                        ],
                      },
                    ]}
                  />
                }
              />
            </div>
          </div>
          <MasterMetaLine>
            {isAr ? 'المصدر' : 'Source'}: {meta.source || 'support_tickets'}
          </MasterMetaLine>
        </>
      ) : (
        <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
          <MasterLuxePanel className="space-y-3 xl:col-span-1" padding="lg">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {isAr ? 'سجل جديد' : 'New record'}
            </p>
            <input
              value={cmsTitle}
              onChange={(e) => setCmsTitle(e.target.value)}
              placeholder={isAr ? 'العنوان' : 'Title'}
              className="w-full rounded-xl border text-sm px-3 py-2"
              style={fieldStyle}
            />
            <textarea
              value={cmsBody}
              onChange={(e) => setCmsBody(e.target.value)}
              rows={3}
              placeholder={isAr ? 'المحتوى' : 'Body'}
              className="w-full rounded-xl border text-sm px-3 py-2"
              style={fieldStyle}
            />
            <button
              type="button"
              className="unity-btn-primary text-sm inline-flex items-center gap-1.5"
              onClick={() => void createCms()}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden />
              {isAr ? 'إنشاء' : 'Create'}
            </button>
          </MasterLuxePanel>
          <div className="xl:col-span-2 min-w-0">
            <AdvancedDataTable
              rows={cmsPipe.pageRows}
              columns={cmsColumns}
              rowKey={(row) => String(row.id)}
              search={cmsList.search}
              onSearchChange={cmsList.setSearch}
              searchPlaceholder={isAr ? 'بحث…' : 'Search…'}
              sortKey={cmsList.sortKey}
              sortDir={cmsList.sortDir}
              onSort={cmsList.onSort}
              page={cmsPipe.safePage}
              pageSize={cmsList.pageSize}
              onPageChange={cmsList.setPage}
              onPageSizeChange={cmsList.setPageSize}
              total={cmsPipe.total}
              loading={busy && cmsRows.length === 0}
              emptyMessage={isAr ? 'لا توجد سجلات' : 'No records found'}
              filters={
                <AdvancedFilterBar
                  filterValues={cmsList.filters}
                  onFilterChange={cmsList.setFilter}
                  dateFrom={cmsList.dateFrom}
                  dateTo={cmsList.dateTo}
                  onDateFromChange={cmsList.setDateFrom}
                  onDateToChange={cmsList.setDateTo}
                  onReset={cmsList.resetAll}
                  activeCount={cmsList.activeFilterCount}
                  fields={[
                    {
                      key: 'status',
                      label: isAr ? 'الحالة' : 'Status',
                      options: [
                        { value: 'all', label: isAr ? 'الكل' : 'All' },
                        { value: 'open', label: isAr ? 'مفتوح' : 'Open' },
                        { value: 'closed', label: isAr ? 'مغلق' : 'Closed' },
                        { value: 'draft', label: isAr ? 'مسودة' : 'Draft' },
                      ],
                    },
                  ]}
                />
              }
            />
          </div>
          <MasterMetaLine className="xl:col-span-3">
            {isAr ? 'المصدر' : 'Source'}: {cmsMeta.source || csTab}
          </MasterMetaLine>
        </div>
      )}
    </AdminPageShell>
  );
};
