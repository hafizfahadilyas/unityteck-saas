import React, { useCallback, useEffect, useState } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  createMasterSupportTicket,
  fetchMasterSupportTickets,
  patchMasterSupportTicket,
  replyMasterSupportTicket,
} from '../../api/tenantApi';
import { Headphones, Plus, RefreshCw } from 'lucide-react';

/** SOUQ PLUS Phase 1 §4.7 — real support tickets (MySQL). */
export const MasterSupportCenter: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [meta, setMeta] = useState<{ open?: number; source?: string }>({});
  const [busy, setBusy] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [closeReason, setCloseReason] = useState('');

  const load = useCallback(async () => {
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

  useEffect(() => {
    void load();
  }, [load]);

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
      await load();
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
      await load();
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
      await load();
    } catch {
      toast(isAr ? 'فشل الرد' : 'Reply failed', 'error');
    }
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'خدمة العملاء والتواصل' : 'Customer Service & Communication'}
        subtitle={
          isAr
            ? 'تذاكر الدعم من قاعدة البيانات — بدون قوائم وهمية'
            : 'Support tickets from MySQL — no fake lists'
        }
        badge={
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ color: 'var(--accent)' }}>
            <Headphones className="w-3.5 h-3.5 inline me-1" aria-hidden />
            {meta.open ?? 0} {isAr ? 'مفتوحة' : 'open'}
          </span>
        }
        actions={
          <button type="button" className="unity-btn-primary text-sm inline-flex items-center gap-1.5" onClick={() => void load()} disabled={busy}>
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        }
      />

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
            {isAr ? 'تذكرة جديدة' : 'New ticket'}
          </p>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={isAr ? 'الموضوع' : 'Subject'}
            className="w-full rounded-xl border text-sm px-3 py-2 bg-transparent"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={isAr ? 'الوصف' : 'Description'}
            className="w-full rounded-xl border text-sm px-3 py-2 bg-transparent"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-xl border text-sm px-3 py-2 bg-transparent"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <option value="low">{isAr ? 'منخفضة' : 'Low'}</option>
            <option value="medium">{isAr ? 'متوسطة' : 'Medium'}</option>
            <option value="high">{isAr ? 'عالية' : 'High'}</option>
            <option value="urgent">{isAr ? 'عاجلة' : 'Urgent'}</option>
          </select>
          <button type="button" className="unity-btn-primary text-sm inline-flex items-center gap-1.5" onClick={() => void create()}>
            <Plus className="w-3.5 h-3.5" aria-hidden />
            {isAr ? 'إنشاء' : 'Create'}
          </button>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          {rows.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
              {isAr ? 'لا توجد سجلات' : 'No records found'}
            </div>
          ) : (
            <ul className="divide-y max-h-[420px] overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
              {rows.map((r) => (
                <li key={String(r.id)} className="p-3">
                  <button type="button" className="w-full text-start" onClick={() => setSelected(String(r.id))}>
                    <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                      {String(r.subject || '')}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                      {String(r.status)} · {String(r.priority)} · {String(r.created_at || '')}
                    </div>
                  </button>
                  {selected === String(r.id) ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {String(r.description || '—')}
                      </p>
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        rows={2}
                        placeholder={isAr ? 'رد…' : 'Reply…'}
                        className="w-full rounded-xl border text-xs px-2 py-1.5 bg-transparent"
                        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="text-xs font-bold" style={{ color: 'var(--accent)' }} onClick={() => void sendReply(String(r.id))}>
                          {isAr ? 'إرسال رد' : 'Send reply'}
                        </button>
                        {String(r.status) !== 'closed' ? (
                          <>
                            <input
                              value={closeReason}
                              onChange={(e) => setCloseReason(e.target.value)}
                              placeholder={isAr ? 'سبب الإغلاق' : 'Closure reason'}
                              className="flex-1 min-w-[8rem] rounded-lg border text-xs px-2 py-1 bg-transparent"
                              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                            />
                            <button type="button" className="text-xs font-bold" style={{ color: '#e11d48' }} onClick={() => void closeTicket(String(r.id))}>
                              {isAr ? 'إغلاق' : 'Close'}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className="mt-3 text-[11px]" style={{ color: 'var(--muted)' }}>
        {isAr ? 'المصدر' : 'Source'}: {meta.source || 'support_tickets'}
      </p>
    </AdminPageShell>
  );
};
