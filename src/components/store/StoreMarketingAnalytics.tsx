import React, { useEffect, useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import {
  fetchMarketingAnalyticsApi,
  type MarketingAnalyticsResponse,
} from '../../api/tenantApi';
import { isApiEnabled } from '../../api/client';
import { BarChart3, Layers, ShoppingCart, Target, TrendingUp, Users } from 'lucide-react';

type RangeKey = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom';

export const StoreMarketingAnalytics: React.FC = () => {
  const { activeStore } = useTenant();
  const { money, locale } = usePrefs();
  const isAr = locale === 'ar';
  const [range, setRange] = useState<RangeKey>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [data, setData] = useState<MarketingAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeStore?.id || !isApiEnabled()) {
      setData(null);
      return;
    }
    if (range === 'custom' && (!customFrom || !customTo)) {
      return;
    }
    let ok = true;
    setLoading(true);
    void fetchMarketingAnalyticsApi(
      activeStore.id,
      range === 'custom' ? { from: customFrom, to: customTo } : { range },
    )
      .then((res) => {
        if (ok) setData(res);
      })
      .catch(() => {
        if (ok) setData(null);
      })
      .finally(() => {
        if (ok) setLoading(false);
      });
    return () => {
      ok = false;
    };
  }, [activeStore?.id, range, customFrom, customTo]);

  const kpis = data?.kpis;
  const ranges: { key: RangeKey; labelEn: string; labelAr: string }[] = [
    { key: 'today', labelEn: 'Today', labelAr: 'اليوم' },
    { key: 'yesterday', labelEn: 'Yesterday', labelAr: 'أمس' },
    { key: '7d', labelEn: '7 Days', labelAr: '٧ أيام' },
    { key: '30d', labelEn: '30 Days', labelAr: '٣٠ يوماً' },
    { key: '90d', labelEn: '90 Days', labelAr: '٩٠ يوماً' },
    { key: 'custom', labelEn: 'Custom', labelAr: 'مخصص' },
  ];

  const sourceRows = useMemo(() => {
    const rows = Array.isArray(data?.traffic_by_source) ? data!.traffic_by_source : [];
    return rows.slice(0, 12);
  }, [data]);

  const campaignRows = useMemo(() => {
    const rows = Array.isArray(data?.campaign_performance) ? data!.campaign_performance : [];
    return rows.slice(0, 15);
  }, [data]);

  return (
    <div
      className="rounded-3xl border p-4 sm:p-6 space-y-5"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black" style={{ color: 'var(--text)' }}>
            {isAr ? 'تحليلات التسويق الداخلية' : 'Souq Marketing Analytics'}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'بيانات حقيقية من أحداث المتجر والطلبات — ليست من جوجل أناليتكس.'
              : 'Real storefront events + orders — separate from Google Analytics.'}
          </p>
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-2">
          <div className="flex flex-wrap gap-1.5 justify-end">
            {ranges.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                  range === r.key ? 'unity-btn-primary text-white border-transparent' : ''
                }`}
                style={
                  range === r.key
                    ? undefined
                    : { borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--surface)' }
                }
              >
                {isAr ? r.labelAr : r.labelEn}
              </button>
            ))}
          </div>
          {range === 'custom' && (
            <div className="flex flex-wrap gap-2 items-center justify-end">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-xl border px-2 py-1.5 text-[11px]"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                aria-label={isAr ? 'من تاريخ' : 'From date'}
              />
              <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                →
              </span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-xl border px-2 py-1.5 text-[11px]"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                aria-label={isAr ? 'إلى تاريخ' : 'To date'}
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {isAr ? 'جاري التحميل…' : 'Loading…'}
        </p>
      ) : !kpis ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {isAr ? 'لا توجد بيانات تسويق بعد لهذا المتجر.' : 'No marketing data for this store yet.'}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                icon: Users,
                label: isAr ? 'الجلسات' : 'Sessions',
                value: kpis.sessions.toLocaleString(),
              },
              {
                icon: Target,
                label: isAr ? 'زوار فريدون' : 'Unique visitors',
                value: kpis.unique_visitors.toLocaleString(),
              },
              {
                icon: ShoppingCart,
                label: isAr ? 'الطلبات' : 'Orders',
                value: kpis.total_orders.toLocaleString(),
              },
              {
                icon: TrendingUp,
                label: isAr ? 'الإيرادات' : 'Revenue',
                value: money(kpis.revenue),
              },
            ].map((card) => (
              <div
                key={card.label}
                className="p-3 rounded-2xl border space-y-1"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <card.icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                  {card.label}
                </p>
                <p className="text-lg font-black" style={{ color: 'var(--text)' }}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
              <p className="font-bold" style={{ color: 'var(--text)' }}>
                {kpis.conversion_rate}%
              </p>
              <p style={{ color: 'var(--muted)' }}>{isAr ? 'معدل التحويل' : 'Conversion rate'}</p>
            </div>
            <div className="p-2 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
              <p className="font-bold" style={{ color: 'var(--text)' }}>
                {money(kpis.average_order_value)}
              </p>
              <p style={{ color: 'var(--muted)' }}>{isAr ? 'متوسط قيمة الطلب' : 'AOV'}</p>
            </div>
            <div className="p-2 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
              <p className="font-bold" style={{ color: 'var(--text)' }}>
                {kpis.add_to_cart_rate}%
              </p>
              <p style={{ color: 'var(--muted)' }}>{isAr ? 'إضافة للسلة' : 'Add-to-cart rate'}</p>
            </div>
            <div className="p-2 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
              <p className="font-bold" style={{ color: 'var(--text)' }}>
                {kpis.checkout_abandonment_rate}%
              </p>
              <p style={{ color: 'var(--muted)' }}>{isAr ? 'تخلي عن الدفع' : 'Checkout abandon'}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--text)' }}>
                <Layers className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>{isAr ? 'الزيارات حسب المصدر' : 'Traffic by source'}</span>
              </h3>
              {sourceRows.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'لا سجلات' : 'No records found'}
                </p>
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {sourceRows.map((s, idx) => (
                    <li key={(s as { id?: string }).id || `${s.name}-${idx}`} className="flex justify-between gap-2">
                      <span style={{ color: 'var(--text)' }}>
                        {isAr ? (s as { name_ar?: string }).name_ar || s.name : s.name}
                      </span>
                      <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>
                        {s.visits ?? 0} · {s.percentage ?? 0}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--text)' }}>
                <BarChart3 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span>{isAr ? 'أداء الحملات' : 'Campaign performance'}</span>
              </h3>
              {campaignRows.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {isAr ? 'لا سجلات' : 'No records found'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr style={{ color: 'var(--muted)' }}>
                        <th className="text-start py-1">{isAr ? 'الحملة' : 'Campaign'}</th>
                        <th className="text-end py-1">{isAr ? 'طلبات' : 'Orders'}</th>
                        <th className="text-end py-1">{isAr ? 'إيراد' : 'Revenue'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaignRows.map((c) => (
                        <tr key={`${c.campaign}-${c.channel}`} className="border-t" style={{ borderColor: 'var(--border)' }}>
                          <td className="py-1.5" style={{ color: 'var(--text)' }}>
                            {c.campaign}
                            <span className="block text-[10px]" style={{ color: 'var(--muted)' }}>
                              {c.channel}
                            </span>
                          </td>
                          <td className="text-end font-mono">{c.orders}</td>
                          <td className="text-end font-mono">{money(c.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};