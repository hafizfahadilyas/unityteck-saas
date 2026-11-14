import React, { useCallback, useEffect, useState } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  createMasterAttachment,
  createMasterMaintenanceEvent,
  createPrivacyDataRequest,
  fetchMasterAcceptanceChecklist,
  fetchMasterAttachments,
  fetchMasterMaintenanceEvents,
  fetchMasterMfaStatus,
  fetchPrivacyDataRequests,
  fetchStoreStatusHistory,
  patchPrivacyDataRequest,
} from '../../api/tenantApi';
import { RefreshCw, Plus } from 'lucide-react';
import { MasterLuxePanel, MasterMetaLine, MasterTabPills, masterGhostBtnClass } from './MasterUiKit';

type Tab = 'attachments' | 'privacy' | 'maintenance' | 'status' | 'acceptance';

/** SOUQ PLUS Phase 6+8+9 — attachments, privacy, maintenance, status history, §9 checklist. */
export const MasterGovernanceHub: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('attachments');
  const [busy, setBusy] = useState(false);
  const [attachments, setAttachments] = useState<Array<Record<string, unknown>>>([]);
  const [privacy, setPrivacy] = useState<Array<Record<string, unknown>>>([]);
  const [maintenance, setMaintenance] = useState<Array<Record<string, unknown>>>([]);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [checklist, setChecklist] = useState<
    Array<{ id: string; label: string; label_en?: string; label_ar?: string; status: string }>
  >([]);
  const [mfaNote, setMfaNote] = useState('');
  const [attEntityType, setAttEntityType] = useState('ticket');
  const [attEntityId, setAttEntityId] = useState('');
  const [attName, setAttName] = useState('');
  const [attSize, setAttSize] = useState('1024');
  const [attUrl, setAttUrl] = useState('');
  const [privEmail, setPrivEmail] = useState('');
  const [privType, setPrivType] = useState('access');
  const [mntReason, setMntReason] = useState('');
  const [mntAction, setMntAction] = useState<'enable' | 'disable'>('enable');

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [a, p, m, h, c, mfa] = await Promise.all([
        fetchMasterAttachments(),
        fetchPrivacyDataRequests(),
        fetchMasterMaintenanceEvents(),
        fetchStoreStatusHistory(),
        fetchMasterAcceptanceChecklist(),
        fetchMasterMfaStatus(),
      ]);
      setAttachments(Array.isArray(a?.data) ? a.data : []);
      setPrivacy(Array.isArray(p?.data) ? p.data : []);
      setMaintenance(Array.isArray(m?.data) ? m.data : []);
      setHistory(Array.isArray(h?.data) ? h.data : []);
      setChecklist(Array.isArray(c?.data) ? c.data : []);
      const mfaMeta = (mfa?.meta || {}) as { note?: string; note_en?: string; note_ar?: string };
      setMfaNote(
        String(
          (isAr ? mfaMeta.note_ar : mfaMeta.note_en) ||
            mfaMeta.note ||
            mfa?.data?.status ||
            (isAr ? 'مؤجّل' : 'deferred'),
        ),
      );
    } catch {
      toast(isAr ? 'تعذر تحميل الحوكمة' : 'Failed to load governance', 'error');
    } finally {
      setBusy(false);
    }
  }, [isAr, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const addAttachment = async () => {
    if (!attEntityId.trim() || !attName.trim()) {
      toast(isAr ? 'معرّف الكيان واسم الملف مطلوبان' : 'Entity id and file name required', 'error');
      return;
    }
    try {
      await createMasterAttachment({
        entity_type: attEntityType,
        entity_id: attEntityId.trim(),
        file_name: attName.trim(),
        file_type: 'application/pdf',
        file_size: Number(attSize) || 1024,
        file_url: attUrl.trim() || undefined,
      });
      setAttEntityId('');
      setAttName('');
      setAttUrl('');
      toast(isAr ? 'تم تسجيل المرفق' : 'Attachment registered', 'success');
      await load();
    } catch {
      toast(isAr ? 'فشل التسجيل — تحقق من النوع والحجم' : 'Register failed — check type/size', 'error');
    }
  };

  const addPrivacy = async () => {
    if (!privEmail.trim()) {
      toast(isAr ? 'البريد مطلوب' : 'Email required', 'error');
      return;
    }
    try {
      await createPrivacyDataRequest({
        subject_email: privEmail.trim(),
        request_type: privType,
      });
      setPrivEmail('');
      toast(isAr ? 'تم إنشاء الطلب' : 'Request created', 'success');
      await load();
    } catch {
      toast(isAr ? 'فشل الإنشاء' : 'Create failed', 'error');
    }
  };

  const logMaintenance = async () => {
    if (!mntReason.trim()) {
      toast(isAr ? 'السبب مطلوب' : 'Reason required', 'error');
      return;
    }
    try {
      await createMasterMaintenanceEvent({
        action: mntAction,
        reason: mntReason.trim(),
        message_en: mntAction === 'enable' ? 'Platform maintenance' : 'Maintenance ended',
        message_ar: mntAction === 'enable' ? 'صيانة المنصة' : 'انتهت الصيانة',
      });
      setMntReason('');
      toast(isAr ? 'تم تسجيل حدث الصيانة' : 'Maintenance event logged', 'success');
      await load();
    } catch {
      toast(isAr ? 'فشل التسجيل' : 'Log failed', 'error');
    }
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'الحوكمة والامتثال' : 'Governance & Compliance'}
        subtitle={
          isAr
            ? 'المرفقات والخصوصية والصيانة وسجل الحالات وقائمة القبول'
            : 'Attachments, privacy, maintenance, status history, and acceptance'
        }
        actions={
          <button type="button" className={masterGhostBtnClass} onClick={() => void load()} disabled={busy}>
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        }
      />

      <MasterLuxePanel className="mt-4" padding="lg">
        <MasterMetaLine className="mt-0">
          {isAr ? 'المصادقة الثنائية' : 'MFA'}: {mfaNote}
        </MasterMetaLine>
      </MasterLuxePanel>

      <MasterTabPills
        className="mt-4"
        active={tab}
        onChange={(id) => setTab(id as Tab)}
        tabs={[
          { id: 'attachments', label: isAr ? 'المرفقات' : 'Attachments' },
          { id: 'privacy', label: isAr ? 'طلبات الخصوصية' : 'Privacy requests' },
          { id: 'maintenance', label: isAr ? 'الصيانة' : 'Maintenance' },
          { id: 'status', label: isAr ? 'سجل حالات المتجر' : 'Store status history' },
          { id: 'acceptance', label: isAr ? 'قائمة القبول' : 'Acceptance' },
        ]}
      />

      {tab === 'attachments' ? (
        <div className="mt-4 space-y-4">
          <MasterLuxePanel className="grid grid-cols-1 sm:grid-cols-5 gap-2" padding="lg">
            <select
              value={attEntityType}
              onChange={(e) => setAttEntityType(e.target.value)}
              className="rounded-xl border text-sm px-3 py-2 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <option value="ticket">{isAr ? 'تذكرة' : 'Ticket'}</option>
              <option value="verification">{isAr ? 'تحقق' : 'Verification'}</option>
              <option value="complaint">{isAr ? 'شكوى' : 'Complaint'}</option>
              <option value="incident">{isAr ? 'حادثة' : 'Incident'}</option>
            </select>
            <input
              value={attEntityId}
              onChange={(e) => setAttEntityId(e.target.value)}
              placeholder={isAr ? 'معرّف السجل' : 'Entity id'}
              className="rounded-xl border text-sm px-3 py-2 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            <input
              value={attName}
              onChange={(e) => setAttName(e.target.value)}
              placeholder={isAr ? 'اسم الملف.pdf' : 'file.pdf'}
              className="rounded-xl border text-sm px-3 py-2 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            <input
              value={attSize}
              onChange={(e) => setAttSize(e.target.value)}
              placeholder={isAr ? 'الحجم بالبايت' : 'Size bytes'}
              className="rounded-xl border text-sm px-3 py-2 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            <button type="button" className="unity-btn-primary text-sm inline-flex items-center justify-center gap-1" onClick={() => void addAttachment()}>
              <Plus className="w-3.5 h-3.5" aria-hidden />
              {isAr ? 'تسجيل' : 'Register'}
            </button>
            <input
              value={attUrl}
              onChange={(e) => setAttUrl(e.target.value)}
              placeholder={isAr ? 'رابط الملف (اختياري)' : 'File URL (optional)'}
              className="sm:col-span-5 rounded-xl border text-sm px-3 py-2 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            <MasterMetaLine className="sm:col-span-5 mt-0">
              {isAr
                ? 'حد أقصى ١٠ ميجابايت · فحص البرمجيات الخبيثة غير متاح · لا ملفات تنفيذية'
                : 'Max 10 MB · malware scan unavailable · no executables'}
            </MasterMetaLine>
          </MasterLuxePanel>
          <MasterLuxePanel padding="none" className="overflow-x-auto">
            {attachments.length === 0 ? (
              <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد سجلات' : 'No records found'}
              </div>
            ) : (
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-start p-3">{isAr ? 'الملف' : 'File'}</th>
                    <th className="text-start p-3">{isAr ? 'الكيان' : 'Entity'}</th>
                    <th className="text-start p-3">{isAr ? 'الحجم' : 'Size'}</th>
                    <th className="text-start p-3">{isAr ? 'الوقت' : 'When'}</th>
                  </tr>
                </thead>
                <tbody>
                  {attachments.map((a) => (
                    <tr key={String(a.id)} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="p-3 text-xs font-semibold">{String(a.file_name)}</td>
                      <td className="p-3 text-xs">
                        {String(a.entity_type)}:{String(a.entity_id)}
                      </td>
                      <td className="p-3 text-xs">{String(a.file_size)}</td>
                      <td className="p-3 text-xs">{String(a.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </MasterLuxePanel>
        </div>
      ) : null}

      {tab === 'privacy' ? (
        <div className="mt-4 space-y-4">
          <MasterLuxePanel className="grid grid-cols-1 sm:grid-cols-3 gap-2" padding="lg">
            <input
              value={privEmail}
              onChange={(e) => setPrivEmail(e.target.value)}
              placeholder={isAr ? 'بريد صاحب البيانات' : 'Subject email'}
              className="rounded-xl border text-sm px-3 py-2 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            <select
              value={privType}
              onChange={(e) => setPrivType(e.target.value)}
              className="rounded-xl border text-sm px-3 py-2 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <option value="access">{isAr ? 'اطلاع' : 'Access'}</option>
              <option value="correction">{isAr ? 'تصحيح' : 'Correction'}</option>
              <option value="deletion">{isAr ? 'حذف' : 'Deletion'}</option>
            </select>
            <button type="button" className="unity-btn-primary text-sm" onClick={() => void addPrivacy()}>
              {isAr ? 'إنشاء طلب' : 'Create request'}
            </button>
          </MasterLuxePanel>
          <MasterLuxePanel padding="none" className="overflow-x-auto">
            {privacy.length === 0 ? (
              <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد سجلات' : 'No records found'}
              </div>
            ) : (
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-start p-3">{isAr ? 'البريد' : 'Email'}</th>
                    <th className="text-start p-3">{isAr ? 'النوع' : 'Type'}</th>
                    <th className="text-start p-3">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="text-start p-3">{isAr ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {privacy.map((r) => (
                    <tr key={String(r.id)} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="p-3 text-xs">{String(r.subject_email)}</td>
                      <td className="p-3 text-xs">{String(r.request_type)}</td>
                      <td className="p-3 text-xs">{String(r.status)}</td>
                      <td className="p-3">
                        {String(r.status) !== 'completed' ? (
                          <button
                            type="button"
                            className="text-xs font-bold"
                            style={{ color: 'var(--accent)' }}
                            onClick={() =>
                              void patchPrivacyDataRequest(String(r.id), { status: 'completed' }).then(load)
                            }
                          >
                            {isAr ? 'إكمال' : 'Complete'}
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </MasterLuxePanel>
        </div>
      ) : null}

      {tab === 'maintenance' ? (
        <div className="mt-4 space-y-4">
          <MasterLuxePanel className="grid grid-cols-1 sm:grid-cols-3 gap-2" padding="lg">
            <select
              value={mntAction}
              onChange={(e) => setMntAction(e.target.value as 'enable' | 'disable')}
              className="rounded-xl border text-sm px-3 py-2 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <option value="enable">{isAr ? 'تفعيل الصيانة' : 'Enable maintenance'}</option>
              <option value="disable">{isAr ? 'إنهاء الصيانة' : 'Disable maintenance'}</option>
            </select>
            <input
              value={mntReason}
              onChange={(e) => setMntReason(e.target.value)}
              placeholder={isAr ? 'السبب (مطلوب)' : 'Reason (required)'}
              className="rounded-xl border text-sm px-3 py-2 bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            <button type="button" className="unity-btn-primary text-sm" onClick={() => void logMaintenance()}>
              {isAr ? 'تسجيل' : 'Log event'}
            </button>
          </MasterLuxePanel>
          <MasterLuxePanel padding="none" className="overflow-x-auto">
            {maintenance.length === 0 ? (
              <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد سجلات' : 'No records found'}
              </div>
            ) : (
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-start p-3">{isAr ? 'الإجراء' : 'Action'}</th>
                    <th className="text-start p-3">{isAr ? 'السبب' : 'Reason'}</th>
                    <th className="text-start p-3">{isAr ? 'الوقت' : 'When'}</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenance.map((e) => (
                    <tr key={String(e.id)} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="p-3 text-xs font-semibold">{String(e.action)}</td>
                      <td className="p-3 text-xs">{String(e.reason || '—')}</td>
                      <td className="p-3 text-xs">{String(e.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </MasterLuxePanel>
        </div>
      ) : null}

      {tab === 'status' ? (
        <MasterLuxePanel className="mt-4 overflow-x-auto" padding="none">
          {history.length === 0 ? (
            <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
              {isAr ? 'لا توجد سجلات' : 'No records found'}
            </div>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  <th className="text-start p-3">{isAr ? 'المتجر' : 'Store'}</th>
                  <th className="text-start p-3">{isAr ? 'من' : 'From'}</th>
                  <th className="text-start p-3">{isAr ? 'إلى' : 'To'}</th>
                  <th className="text-start p-3">{isAr ? 'السبب' : 'Reason'}</th>
                  <th className="text-start p-3">{isAr ? 'الوقت' : 'When'}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={String(h.id)} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="p-3 text-xs font-mono">{String(h.store_id)}</td>
                    <td className="p-3 text-xs">{String(h.from_status || '—')}</td>
                    <td className="p-3 text-xs">{String(h.to_status)}</td>
                    <td className="p-3 text-xs">{String(h.reason || '—')}</td>
                    <td className="p-3 text-xs">{String(h.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </MasterLuxePanel>
      ) : null}

      {tab === 'acceptance' ? (
        <MasterLuxePanel className="mt-4 overflow-x-auto" padding="none">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                <th className="text-start p-3">{isAr ? 'البند' : 'Item'}</th>
                <th className="text-start p-3">{isAr ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {checklist.map((c) => (
                <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="p-3 text-sm" style={{ color: 'var(--text)' }}>
                    {isAr
                      ? String(c.label_ar || c.label || '')
                      : String(c.label_en || c.label || '')}
                  </td>
                  <td
                    className="p-3 text-xs font-bold"
                    style={{
                      color:
                        c.status === 'pass' ? '#059669' : c.status === 'deferred' ? '#d97706' : '#e11d48',
                    }}
                  >
                    {c.status === 'pass'
                      ? isAr
                        ? 'ناجح'
                        : 'Pass'
                      : c.status === 'deferred'
                        ? isAr
                          ? 'مؤجّل'
                          : 'Deferred'
                        : isAr
                          ? 'فشل'
                          : String(c.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <MasterMetaLine className="p-3">
            {isAr
              ? 'لقطة آلية — الاعتماد النهائي للمرحلة التاسعة يدوي'
              : 'Automated snapshot — full phase 9 sign-off remains manual'}
          </MasterMetaLine>
        </MasterLuxePanel>
      ) : null}
    </AdminPageShell>
  );
};
