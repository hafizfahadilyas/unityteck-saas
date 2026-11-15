/**
 * Official Canva Connect — Master Admin testing only.
 * Separate from Design Studio (`MasterCanvaStudio` / `CanvaImageStudioModal`).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Link2, Link2Off, Loader2, RefreshCw, ImagePlus, Download } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { isApiEnabled } from '../../api/client';
import {
  canvaConnectAuthUrl,
  canvaConnectCallback,
  canvaConnectCreateDesign,
  canvaConnectDisconnect,
  canvaConnectExportDesign,
  canvaConnectListDesigns,
  canvaConnectStatus,
  type CanvaConnectStatus,
  type CanvaConnectDesign,
} from '../../api/canvaConnectApi';

type Props = {
  onNavigateTab?: (tab: string) => void;
};

function masterRedirectUri(): string {
  if (typeof window === 'undefined') return '';
  const u = new URL(window.location.href);
  u.searchParams.set('tab', 'canva-real');
  u.searchParams.delete('code');
  u.searchParams.delete('state');
  u.searchParams.delete('error');
  return u.origin + u.pathname + '?' + u.searchParams.toString();
}

const PRESETS: Array<{ id: string; w: number; h: number; labelEn: string; labelAr: string }> = [
  { id: 'ig_post', w: 1080, h: 1080, labelEn: 'Instagram post', labelAr: 'منشور إنستغرام' },
  { id: 'ig_story', w: 1080, h: 1920, labelEn: 'Instagram story', labelAr: 'قصة إنستغرام' },
  { id: 'banner', w: 1600, h: 500, labelEn: 'Store banner', labelAr: 'بانر المتجر' },
  { id: 'logo', w: 800, h: 800, labelEn: 'Logo square', labelAr: 'شعار مربع' },
  { id: 'product', w: 1200, h: 1200, labelEn: 'Product image', labelAr: 'صورة منتج' },
];

export const MasterRealCanvaConnect: React.FC<Props> = ({ onNavigateTab }) => {
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [status, setStatus] = useState<CanvaConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [designs, setDesigns] = useState<CanvaConnectDesign[]>([]);
  const [title, setTitle] = useState(isAr ? 'اختبار سوق' : 'Souq Master Test');
  const [presetId, setPresetId] = useState('ig_post');

  const redirectUri = useMemo(() => masterRedirectUri(), []);

  const loadStatus = useCallback(async () => {
    if (!isApiEnabled()) {
      setStatus({
        configured: false,
        connected: false,
        table_ready: false,
        scopes: [],
        message: isAr ? 'واجهة البرمجة غير مفعّلة محلياً.' : 'API is not enabled locally.',
      });
      setLoading(false);
      return;
    }
    try {
      const res = await canvaConnectStatus();
      setStatus(res.data);
    } catch (err) {
      setStatus({
        configured: false,
        connected: false,
        table_ready: false,
        scopes: [],
        message: err instanceof Error ? err.message : 'status_failed',
      });
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  const loadDesigns = useCallback(async () => {
    if (!status?.connected) {
      setDesigns([]);
      return;
    }
    try {
      const res = await canvaConnectListDesigns(20);
      setDesigns(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDesigns([]);
    }
  }, [status?.connected]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    void loadDesigns();
  }, [loadDesigns]);

  /** OAuth return: ?code=&state= on this tab */
  useEffect(() => {
    if (typeof window === 'undefined' || !isApiEnabled()) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const err = params.get('error');
    if (err) {
      toast(isAr ? 'تم رفض التفويض من كانفا.' : 'Canva authorization was denied.', 'error');
      params.delete('error');
      const next = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', next);
      return;
    }
    if (!code || !state) return;

    let cancelled = false;
    (async () => {
      setBusy(true);
      try {
        await canvaConnectCallback({
          code,
          state,
          redirect_uri: redirectUri,
        });
        if (cancelled) return;
        toast(isAr ? 'تم ربط كانفا الرسمي.' : 'Official Canva connected.', 'success');
        params.delete('code');
        params.delete('state');
        params.set('tab', 'canva-real');
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
        await loadStatus();
      } catch (e) {
        if (!cancelled) {
          toast(
            e instanceof Error
              ? e.message
              : isAr
                ? 'فشل ربط كانفا.'
                : 'Canva connect failed.',
            'error',
          );
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAr, loadStatus, redirectUri, toast]);

  const onConnect = async () => {
    setBusy(true);
    try {
      const res = await canvaConnectAuthUrl(redirectUri);
      if (!res.auth_url) {
        toast(isAr ? 'رابط التفويض غير متوفر.' : 'Auth URL missing.', 'error');
        return;
      }
      window.location.assign(res.auth_url);
    } catch (e) {
      toast(
        e instanceof Error
          ? e.message
          : isAr
            ? 'تعذر بدء الربط. أضف بيانات كانفا في خادم الواجهة البرمجية.'
            : 'Could not start Connect. Set Canva credentials on the API server.',
        'error',
      );
      setBusy(false);
    }
  };

  const onDisconnect = async () => {
    setBusy(true);
    try {
      await canvaConnectDisconnect();
      toast(isAr ? 'تم قطع الاتصال.' : 'Disconnected.', 'success');
      await loadStatus();
      setDesigns([]);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Disconnect failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const onCreate = async () => {
    const preset = PRESETS.find((p) => p.id === presetId) || PRESETS[0];
    setBusy(true);
    try {
      const res = await canvaConnectCreateDesign({
        title: title.trim() || (isAr ? 'اختبار سوق' : 'Souq Master Test'),
        width: preset.w,
        height: preset.h,
      });
      const design = res.data;
      toast(isAr ? 'تم إنشاء التصميم.' : 'Design created.', 'success');
      const editUrl = design?.urls?.edit_url;
      if (editUrl) {
        window.open(editUrl, '_blank', 'noopener,noreferrer');
      }
      await loadDesigns();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Create failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const onExport = async (designId: string) => {
    setBusy(true);
    try {
      const res = await canvaConnectExportDesign(designId);
      const url = res.data?.urls?.[0];
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
        toast(isAr ? 'تم التصدير.' : 'Export ready.', 'success');
      } else {
        toast(isAr ? 'لا يوجد رابط تصدير بعد.' : 'No export URL yet.', 'error');
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Export failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const connected = Boolean(status?.connected);
  const configured = Boolean(status?.configured);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-ui)' }}>
            {isAr ? 'كانفا الرسمي (اختبار)' : 'Real Canva (testing)'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'اتصال رسمي عبر واجهة كانفا — منفصل عن استوديو التصميم الحالي. للاختبار من الماستر فقط.'
              : 'Official Canva Connect API — separate from Design Studio. Master testing only.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="unity-btn-primary inline-flex items-center gap-2 text-sm px-3 py-2"
            onClick={() => onNavigateTab?.('canva')}
          >
            {isAr ? 'استوديو التصميم' : 'Design studio'}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border"
            style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
            onClick={() => {
              setLoading(true);
              void loadStatus().then(loadDesigns);
            }}
            disabled={busy}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </div>

      <div
        className="rounded-xl border p-4 space-y-3"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full"
            style={{
              background: connected
                ? 'color-mix(in srgb, #10b981 22%, transparent)'
                : 'color-mix(in srgb, var(--muted) 18%, transparent)',
              color: connected ? '#059669' : 'var(--muted)',
            }}
          >
            {connected
              ? isAr
                ? 'متصل'
                : 'Connected'
              : isAr
                ? 'غير متصل'
                : 'Not Connected'}
          </span>
          {!configured && (
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'أضف معرّف العميل وسر العميل في خادم الواجهة البرمجية'
                : 'Set CANVA_CLIENT_ID + CANVA_CLIENT_SECRET on API .env'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            {isAr ? 'جاري التحميل…' : 'Loading…'}
          </div>
        ) : (
          <ul className="text-sm space-y-1" style={{ color: 'var(--muted)' }}>
            <li>
              {isAr ? 'إعداد الخادم: ' : 'Server configured: '}
              {configured ? (isAr ? 'نعم' : 'Yes') : isAr ? 'لا' : 'No'}
            </li>
            <li>
              {isAr ? 'جدول قاعدة البيانات: ' : 'DB table: '}
              {status?.table_ready ? (isAr ? 'جاهز' : 'Ready') : isAr ? 'ناقص — شغّل الترحيل' : 'Missing — run migration'}
            </li>
            {status?.redirect_uri ? (
              <li className="break-all">
                {isAr ? 'رابط الإرجاع: ' : 'Redirect URI: '}
                {status.redirect_uri}
              </li>
            ) : (
              <li>
                {isAr
                  ? `رابط الإرجاع المقترح: ${redirectUri}`
                  : `Suggested redirect: ${redirectUri}`}
              </li>
            )}
            {status?.last_error ? (
              <li style={{ color: '#e11d48' }}>
                {isAr ? 'آخر خطأ: ' : 'Last error: '}
                {status.last_error}
              </li>
            ) : null}
            {status?.message ? <li>{status.message}</li> : null}
          </ul>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {!connected ? (
            <button
              type="button"
              className="unity-btn-primary inline-flex items-center gap-2 text-sm px-4 py-2"
              onClick={() => void onConnect()}
              disabled={busy || !configured}
              aria-busy={busy}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              {isAr ? 'ربط كانفا الرسمي' : 'Connect Official Canva'}
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              onClick={() => void onDisconnect()}
              disabled={busy}
            >
              <Link2Off className="w-4 h-4" />
              {isAr ? 'قطع الاتصال' : 'Disconnect'}
            </button>
          )}
        </div>
      </div>

      {connected ? (
        <div
          className="rounded-xl border p-4 space-y-3"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {isAr ? 'إنشاء تصميم اختبار' : 'Create test design'}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm space-y-1 block">
              <span style={{ color: 'var(--muted)' }}>{isAr ? 'العنوان' : 'Title'}</span>
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="text-sm space-y-1 block">
              <span style={{ color: 'var(--muted)' }}>{isAr ? 'الحجم' : 'Size'}</span>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                value={presetId}
                onChange={(e) => setPresetId(e.target.value)}
              >
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {isAr ? p.labelAr : p.labelEn} ({p.w}×{p.h})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            className="unity-btn-primary inline-flex items-center gap-2 text-sm px-4 py-2"
            onClick={() => void onCreate()}
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            {isAr ? 'إنشاء وفتح في كانفا' : 'Create & open in Canva'}
          </button>

          <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
              {isAr ? 'التصاميم الأخيرة' : 'Recent designs'}
            </h3>
            {designs.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {isAr ? 'لا توجد سجلات.' : 'No records found.'}
              </p>
            ) : (
              <ul className="space-y-2">
                {designs.map((d) => {
                  const id = String(d.id || '');
                  const name = String(d.title || id || (isAr ? 'بدون عنوان' : 'Untitled'));
                  const edit = d.urls?.edit_url;
                  const thumb = d.thumbnail?.url;
                  return (
                    <li
                      key={id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border p-2"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      {thumb ? (
                        <img src={thumb} alt="" className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <div
                          className="w-12 h-12 rounded flex items-center justify-center text-xs"
                          style={{ background: 'var(--bg)', color: 'var(--muted)' }}
                        >
                          —
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                          {name}
                        </div>
                        <div className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                          {id}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {edit ? (
                          <a
                            href={edit}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border"
                            style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {isAr ? 'تعديل' : 'Edit'}
                          </a>
                        ) : null}
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border"
                          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                          onClick={() => void onExport(id)}
                          disabled={busy || !id}
                        >
                          <Download className="w-3.5 h-3.5" />
                          {isAr ? 'تصدير' : 'Export PNG'}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      <div
        className="rounded-xl border p-4 text-sm space-y-2"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted)' }}
      >
        <p className="font-semibold" style={{ color: 'var(--text)' }}>
          {isAr ? 'إعداد الاختبار' : 'Test setup'}
        </p>
        <ol className="list-decimal ms-5 space-y-1">
          <li>
            {isAr
              ? 'أنشئ تطبيقاً عاماً أو خاصاً في بوابة مطوري كانفا (تفويض المستخدم).'
              : 'Create a public/private app in Canva Developer Portal (user OAuth).'}
          </li>
          <li>
            {isAr
              ? 'فعّل صلاحيات قراءة/كتابة محتوى التصميم وبياناته الوصفية.'
              : 'Enable design:content:read, design:content:write, design:meta:read.'}
          </li>
          <li>
            {isAr
              ? 'أضف رابط الإرجاع في بوابة كانفا ليطابق عنوان الماستر مع تبويب كانفا الرسمي.'
              : 'Add redirect URL matching Master URL with tab=canva-real.'}
          </li>
          <li>
            {isAr
              ? 'ضع معرّف العميل وسر العميل ورابط الإرجاع في ملف بيئة خادم الواجهة البرمجية، ثم أنشئ جدول الاتصال.'
              : 'Set CANVA_CLIENT_ID / CANVA_CLIENT_SECRET / CANVA_REDIRECT_URI on API .env, then ensure DB table.'}
          </li>
        </ol>
      </div>
    </div>
  );
};
