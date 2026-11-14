import React, { useCallback, useEffect, useState } from 'react';
import { AdminPageShell, AdminPageHeader } from '../common/AdminPageHeader';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import {
  fetchMasterMessageDeliveries,
  fetchMasterMessageTemplates,
  fetchMasterMessagingChannels,
  patchMasterMessageTemplate,
} from '../../api/tenantApi';
import { RefreshCw } from 'lucide-react';
import { MasterLuxePanel, MasterMetaLine, MasterTabPills, masterGhostBtnClass } from './MasterUiKit';

type Tab = 'channels' | 'templates' | 'deliveries';

/** SOUQ PLUS Phase 7 — templates + honest channel status + delivery log. */
export const MasterMessagingHub: React.FC = () => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('channels');
  const [busy, setBusy] = useState(false);
  const [channels, setChannels] = useState<Array<Record<string, unknown>>>([]);
  const [templates, setTemplates] = useState<Array<Record<string, unknown>>>([]);
  const [deliveries, setDeliveries] = useState<Array<Record<string, unknown>>>([]);
  const [editId, setEditId] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [bodyAr, setBodyAr] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [c, t, d] = await Promise.all([
        fetchMasterMessagingChannels(),
        fetchMasterMessageTemplates(),
        fetchMasterMessageDeliveries(),
      ]);
      setChannels(Array.isArray(c?.data) ? c.data : []);
      setTemplates(Array.isArray(t?.data) ? t.data : []);
      setDeliveries(Array.isArray(d?.data) ? d.data : []);
    } catch {
      toast(isAr ? 'تعذر تحميل الرسائل' : 'Failed to load messaging', 'error');
    } finally {
      setBusy(false);
    }
  }, [isAr, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveTemplate = async () => {
    if (!editId) return;
    try {
      await patchMasterMessageTemplate(editId, { body_en: bodyEn, body_ar: bodyAr });
      toast(isAr ? 'تم حفظ القالب' : 'Template saved', 'success');
      await load();
    } catch {
      toast(isAr ? 'فشل الحفظ' : 'Save failed', 'error');
    }
  };

  return (
    <AdminPageShell>
      <AdminPageHeader
        title={isAr ? 'قنوات الرسائل والقوالب' : 'Messaging Channels & Templates'}
        subtitle={
          isAr
            ? 'لا تُعرض حالة متصل إلا لمزود حقيقي — لا إرسال وهمي'
            : 'Never show Connected without a real provider — no fake sends'
        }
        actions={
          <button type="button" className={masterGhostBtnClass} onClick={() => void load()} disabled={busy}>
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        }
      />

      <MasterTabPills
        className="mt-4"
        active={tab}
        onChange={(id) => setTab(id as Tab)}
        tabs={[
          { id: 'channels', label: isAr ? 'القنوات' : 'Channels' },
          { id: 'templates', label: isAr ? 'القوالب' : 'Templates' },
          { id: 'deliveries', label: isAr ? 'سجل التسليم' : 'Delivery log' },
        ]}
      />

      {tab === 'channels' ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {channels.map((ch) => (
            <MasterLuxePanel key={String(ch.id)} padding="lg" className="space-y-2">
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                {isAr ? String(ch.label_ar || ch.label_en) : String(ch.label_en || ch.label_ar)}
              </p>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-md inline-block"
                style={{
                  color: ch.connected ? '#059669' : 'var(--muted)',
                  background: ch.connected
                    ? 'color-mix(in srgb, #10b981 12%, transparent)'
                    : 'color-mix(in srgb, var(--muted) 10%, transparent)',
                }}
              >
                {ch.connected
                  ? isAr
                    ? 'متصل'
                    : 'Connected'
                  : isAr
                    ? 'غير معروف / غير متصل'
                    : 'Unknown / Not Connected'}
              </span>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {isAr
                  ? String(ch.note_ar || ch.note || '')
                  : String(ch.note_en || ch.note || '')}
              </p>
            </MasterLuxePanel>
          ))}
        </div>
      ) : null}

      {tab === 'templates' ? (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MasterLuxePanel padding="none">
            {templates.length === 0 ? (
              <div className="p-10 text-center text-sm" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد سجلات' : 'No records found'}
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {templates.map((t) => (
                  <li key={String(t.id)}>
                    <button
                      type="button"
                      className="w-full text-start p-3"
                      onClick={() => {
                        setEditId(String(t.id));
                        setBodyEn(String(t.body_en || ''));
                        setBodyAr(String(t.body_ar || ''));
                      }}
                    >
                      <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                        {isAr ? String(t.title_ar || t.title_en) : String(t.title_en || t.title_ar)}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
                        {String(t.channel)} · {String(t.template_key)} · {String(t.status)}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </MasterLuxePanel>
          <MasterLuxePanel className="space-y-3" padding="lg">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {editId
                ? isAr
                  ? 'تعديل القالب'
                  : 'Edit template'
                : isAr
                  ? 'اختر قالباً'
                  : 'Select a template'}
            </p>
            <MasterMetaLine>
              {isAr ? 'المتغيرات: الاسم، رقم الطلب، تاريخ الانتهاء' : 'Variables: name, request_id, expiry_date'}
            </MasterMetaLine>
            <textarea
              value={bodyAr}
              onChange={(e) => setBodyAr(e.target.value)}
              rows={4}
              disabled={!editId}
              placeholder={isAr ? 'المحتوى بالعربية' : 'Arabic body'}
              className="w-full rounded-xl border text-sm px-3 py-2 bg-transparent disabled:opacity-50"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            <textarea
              value={bodyEn}
              onChange={(e) => setBodyEn(e.target.value)}
              rows={4}
              disabled={!editId}
              placeholder={isAr ? 'المحتوى بالإنجليزية' : 'English body'}
              className="w-full rounded-xl border text-sm px-3 py-2 bg-transparent disabled:opacity-50"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            <button type="button" className="unity-btn-primary text-sm" disabled={!editId} onClick={() => void saveTemplate()}>
              {isAr ? 'حفظ' : 'Save'}
            </button>
          </MasterLuxePanel>
        </div>
      ) : null}

      {tab === 'deliveries' ? (
        <MasterLuxePanel className="mt-4 overflow-x-auto" padding="none">
          {deliveries.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد سجلات' : 'No records found'}
              </p>
              <MasterMetaLine>
                {isAr
                  ? 'لا يُسجَّل إرسال ناجح بدون مزود حقيقي'
                  : 'No Sent rows without a real provider'}
              </MasterMetaLine>
            </div>
          ) : (
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  <th className="text-start p-3">{isAr ? 'المستلم' : 'Recipient'}</th>
                  <th className="text-start p-3">{isAr ? 'القناة' : 'Channel'}</th>
                  <th className="text-start p-3">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="text-start p-3">{isAr ? 'الوقت' : 'When'}</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={String(d.id)} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="p-3 text-xs">{String(d.recipient)}</td>
                    <td className="p-3 text-xs">{String(d.channel)}</td>
                    <td className="p-3 text-xs">{String(d.status)}</td>
                    <td className="p-3 text-xs">{String(d.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </MasterLuxePanel>
      ) : null}
    </AdminPageShell>
  );
};
