/**
 * Real Email / WhatsApp / SMS delivery log for merchant notification manage page.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Mail,
  Smartphone,
  RefreshCw,
  CheckCheck,
  Send,
  AlertCircle,
  SkipForward,
} from 'lucide-react';
import {
  fetchNotificationDeliveriesApi,
  markNotificationDeliveriesReadApi,
} from '../../api/tenantApi';
import { usePrefs } from '../../i18n/PrefsContext';
import { formatRelativeTime } from '../utils/dateFilters';
import { WhatsAppBrandIcon } from '../../components/common/BrandIcons';

type DeliveryRow = {
  id: string;
  event: string;
  channel: 'whatsapp' | 'sms' | 'email' | string;
  audience: string;
  recipient?: string | null;
  status: 'sent' | 'failed' | 'skipped' | string;
  order_number?: string | null;
  preview?: string | null;
  error?: string | null;
  merchant_read?: boolean;
  created_at?: string;
};

type Summary = {
  total: number;
  unread: number;
  sent: number;
  failed: number;
  skipped: number;
  by_channel: { email: number; whatsapp: number; sms: number };
};

interface CustomerDeliveriesPanelProps {
  storeId: string;
}

const EVENT_LABELS: Record<string, { en: string; ar: string }> = {
  order_placed: { en: 'Order placed', ar: 'طلب جديد' },
  order_processing: { en: 'Processing', ar: 'قيد التنفيذ' },
  order_preparing: { en: 'Preparing', ar: 'قيد التجهيز' },
  order_shipped: { en: 'Shipped', ar: 'تم الشحن' },
  order_delivered: { en: 'Delivered', ar: 'تم التوصيل' },
  order_cancelled: { en: 'Cancelled', ar: 'ملغي' },
  order_refunded: { en: 'Return / Refund', ar: 'إرجاع / استرداد' },
  payment_received: { en: 'Payment received', ar: 'تم الدفع' },
  payment_pending: { en: 'Payment pending', ar: 'دفع معلّق' },
};

export const CustomerDeliveriesPanel: React.FC<CustomerDeliveriesPanelProps> = ({ storeId }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DeliveryRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'whatsapp' | 'sms'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed' | 'skipped'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchNotificationDeliveriesApi(storeId, {
        channel: channelFilter,
        status: statusFilter,
        limit: 100,
      });
      setItems(res?.data?.items || []);
      setSummary(res?.data?.summary || null);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [storeId, channelFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const markAllRead = async () => {
    try {
      await markNotificationDeliveriesReadApi(storeId, { all: true });
      await load();
    } catch {
      /* ignore */
    }
  };

  const channelIcon = (ch: string) => {
    if (ch === 'email') return <Mail className="w-3.5 h-3.5" />;
    if (ch === 'sms') return <Smartphone className="w-3.5 h-3.5" />;
    return <WhatsAppBrandIcon className="w-3.5 h-3.5" title="WhatsApp" />;
  };

  const statusBadge = (status: string) => {
    if (status === 'sent') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
          <Send className="w-3 h-3" />
          {isAr ? 'أُرسل' : 'Sent'}
        </span>
      );
    }
    if (status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
          <AlertCircle className="w-3 h-3" />
          {isAr ? 'فشل' : 'Failed'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <SkipForward className="w-3 h-3" />
        {isAr ? 'تخطّي' : 'Skipped'}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="px-5 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h3 className="text-sm font-black" style={{ color: 'var(--text)' }}>
            {isAr
              ? 'إشعارات العميل (البريد الإلكتروني / واتساب / الرسائل النصية)'
              : 'Customer alerts (Email / WhatsApp / SMS)'}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isAr
              ? 'كل ما يُرسل للعميل عند الطلب، الشحن، الإلغاء، والإرجاع — سجلات حقيقية.'
              : 'Real delivery log for order placed, shipped, cancelled, and return events.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => void load()}
            className="px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            {isAr ? 'قراءة الكل' : 'Mark all read'}
          </button>
        </div>
      </div>

      {summary && (
        <div className="px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 border-b" style={{ borderColor: 'var(--border)' }}>
          {[
            { label: isAr ? 'أُرسل' : 'Sent', value: summary.sent, color: 'text-emerald-600' },
            { label: isAr ? 'البريد الإلكتروني' : 'Email', value: summary.by_channel.email, color: 'text-sky-600' },
            { label: isAr ? 'واتساب' : 'WhatsApp', value: summary.by_channel.whatsapp, color: 'text-emerald-600' },
            { label: isAr ? 'الرسائل النصية' : 'SMS', value: summary.by_channel.sms, color: 'text-blue-600' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900/40 border" style={{ borderColor: 'var(--border)' }}>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{s.label}</div>
              <div className={`text-lg font-black ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="px-5 py-2.5 flex items-center gap-2 flex-wrap shrink-0 border-b" style={{ borderColor: 'var(--border)' }}>
        {(['all', 'email', 'whatsapp', 'sms'] as const).map((ch) => (
          <button
            key={ch}
            type="button"
            onClick={() => setChannelFilter(ch)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              channelFilter === ch
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {ch === 'all'
              ? isAr
                ? 'الكل'
                : 'All'
              : ch === 'email'
                ? isAr
                  ? 'البريد الإلكتروني'
                  : 'Email'
                : ch === 'whatsapp'
                  ? isAr
                    ? 'واتساب'
                    : 'WhatsApp'
                  : isAr
                    ? 'الرسائل النصية'
                    : 'SMS'}
          </button>
        ))}
        <span className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:inline-block" />
        {(['all', 'sent', 'failed', 'skipped'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              statusFilter === st
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {st === 'all'
              ? isAr
                ? 'كل الحالات'
                : 'Any status'
              : st === 'sent'
                ? isAr
                  ? 'أُرسل'
                  : 'Sent'
                : st === 'failed'
                  ? isAr
                    ? 'فشل'
                    : 'Failed'
                  : isAr
                    ? 'تخطّي'
                    : 'Skipped'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">{isAr ? 'جاري التحميل...' : 'Loading deliveries…'}</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-2 px-6">
            <Mail className="w-8 h-8 mx-auto opacity-40" />
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
              {isAr ? 'لا توجد سجلات إرسال بعد' : 'No customer deliveries yet'}
            </p>
            <p>
              {isAr
                ? 'عند تغيير حالة الطلب (شحن / إلغاء / إرجاع) ستظهر هنا قنوات البريد الإلكتروني وواتساب والرسائل النصية.'
                : 'When order status changes (ship / cancel / return), Email, WhatsApp and SMS attempts appear here.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {items.map((row) => {
              const eventLabel = EVENT_LABELS[row.event] || { en: row.event, ar: row.event };
              return (
                <li
                  key={row.id}
                  className={`px-5 py-3.5 flex items-start gap-3 ${
                    row.merchant_read ? 'opacity-80' : 'bg-emerald-50/30 dark:bg-emerald-950/10'
                  }`}
                >
                  <span
                    className="mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--surface)',
                      color: row.channel === 'email' ? '#0284c7' : row.channel === 'sms' ? '#2563eb' : '#059669',
                    }}
                  >
                    {channelIcon(row.channel)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-black truncate" style={{ color: 'var(--text)' }}>
                          {isAr ? eventLabel.ar : eventLabel.en}
                          {row.order_number ? (
                            <span className="ms-1.5 font-mono font-bold text-slate-500">#{row.order_number}</span>
                          ) : null}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {row.audience === 'merchant' ? (isAr ? 'للتاجر' : 'Merchant') : isAr ? 'للعميل' : 'Customer'}
                          {row.recipient ? ` · ${row.recipient}` : ''}
                          {' · '}
                          {row.channel === 'email'
                            ? isAr
                              ? 'البريد الإلكتروني'
                              : 'Email'
                            : row.channel === 'whatsapp'
                              ? isAr
                                ? 'واتساب'
                                : 'WhatsApp'
                              : row.channel === 'sms'
                                ? isAr
                                  ? 'الرسائل النصية'
                                  : 'SMS'
                                : String(row.channel)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {statusBadge(row.status)}
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {row.created_at ? formatRelativeTime(row.created_at, locale) : ''}
                        </span>
                      </div>
                    </div>
                    {row.preview && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {row.preview}
                      </p>
                    )}
                    {row.error && row.status !== 'sent' && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 line-clamp-2">{row.error}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CustomerDeliveriesPanel;
