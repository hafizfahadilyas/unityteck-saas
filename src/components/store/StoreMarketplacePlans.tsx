import React, { useCallback, useEffect, useState } from 'react';
import { Lock, RefreshCw, Sparkles, Crown, Server } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { usePrefs } from '../../i18n/PrefsContext';
import { useToast } from '../common/ToastProvider';
import { apiFetch } from '../../api/client';

type Period = {
  months: number;
  discount_pct: number;
  total_sar: number;
  monthly_effective_sar: number;
};

type AddonRow = {
  id: string;
  name_en: string;
  name_ar: string;
  price_sar: number;
  unlocked?: boolean;
  lock_reason?: string | null;
  billing_periods?: Period[];
  description_en?: string;
  description_ar?: string;
};

type PlanRow = {
  code: string;
  name: string;
  name_ar?: string;
  price_sar: number | null;
  billing_periods?: Period[];
  includes_free_hosting_domain?: boolean;
  free_hosting_note_en?: string | null;
  free_hosting_note_ar?: string | null;
};

/**
 * Store dashboard — price-first plans / AI add-ons / hosting (locked until Master unlock).
 */
export const StoreMarketplacePlans: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';
  const [busy, setBusy] = useState(true);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [addons, setAddons] = useState<AddonRow[]>([]);
  const [inactivity, setInactivity] = useState<{
    status: string;
    days_inactive: number;
    next_action_en: string;
    next_action_ar: string;
  } | null>(null);
  const [slots, setSlots] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!activeStore?.id) return;
    setBusy(true);
    try {
      const res = await apiFetch<{
        data: AddonRow[];
        plans?: PlanRow[];
        inactivity?: typeof inactivity;
        free_hosting_slots_remaining?: number;
        plan_code?: string;
      }>('/marketplace/addons', { storeId: activeStore.id });
      setAddons(Array.isArray(res.data) ? res.data : []);
      setPlans(Array.isArray(res.plans) ? res.plans : []);
      setInactivity(res.inactivity || null);
      setSlots(
        typeof res.free_hosting_slots_remaining === 'number'
          ? res.free_hosting_slots_remaining
          : null,
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setBusy(false);
    }
  }, [activeStore?.id, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!activeStore) {
    return (
      <div className="p-6 text-sm" style={{ color: 'var(--muted)' }}>
        {isAr ? 'لا يوجد متجر نشط.' : 'No active store.'}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-black" style={{ color: 'var(--text)' }}>
            {isAr ? 'الباقات والإضافات' : 'Plans & Add-ons'}
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'الأسعار ظاهرة أولاً. الدفع ثم موافقة الماستر لفتح القفل. ١ / ٦ / ١٢ شهراً مع خصم.'
              : 'Prices show first. Pay then Master unlocks. 1 / 6 / 12 months with discounts.'}
          </p>
        </div>
        <button
          type="button"
          className="unity-btn-primary text-xs px-3 py-2 rounded-xl inline-flex items-center gap-1.5"
          onClick={() => void load()}
          disabled={busy}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
          {isAr ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {inactivity && inactivity.status !== 'ok' ? (
        <div
          className="rounded-2xl border px-4 py-3 text-sm"
          style={{
            borderColor: inactivity.status === 'terminate' ? '#f43f5e' : '#f59e0b',
            background: 'color-mix(in srgb, #f59e0b 10%, var(--surface))',
            color: 'var(--text)',
          }}
        >
          <strong>{isAr ? 'تنبيه عدم النشاط' : 'Inactivity alert'}</strong>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            {isAr ? inactivity.next_action_ar : inactivity.next_action_en} (
            {inactivity.days_inactive} {isAr ? 'يوماً' : 'days'})
          </p>
        </div>
      ) : null}

      <section>
        <h2 className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Crown className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          {isAr ? 'اشتراك المتجر' : 'Store subscription'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {plans
            .filter((p) => ['starter', 'pro', 'premium', 'free'].includes(String(p.code)))
            .map((p) => {
              const title = isAr && p.name_ar ? p.name_ar : p.name;
              const active = String(activeStore.plan || '').toLowerCase() === p.code;
              return (
                <article
                  key={p.code}
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: active ? 'var(--accent)' : 'var(--border)',
                    background: 'var(--surface)',
                  }}
                >
                  <div className="text-sm font-black" style={{ color: 'var(--text)' }}>
                    {title}
                    {active ? (
                      <span className="ms-2 text-[10px] font-bold" style={{ color: 'var(--accent)' }}>
                        {isAr ? 'الحالي' : 'Current'}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 text-2xl font-black" style={{ color: 'var(--text)' }}>
                    {p.price_sar == null ? '—' : p.price_sar}
                    <span className="text-xs font-bold ms-1" style={{ color: 'var(--muted)' }}>
                      {isAr ? 'ر.س / شهر' : 'SAR / mo'}
                    </span>
                  </div>
                  {(p.billing_periods || []).length > 0 ? (
                    <ul className="mt-2 space-y-1 text-[11px]" style={{ color: 'var(--muted)' }}>
                      {p.billing_periods!.map((bp) => (
                        <li key={bp.months}>
                          {bp.months === 1
                            ? isAr
                              ? '١ شهر'
                              : '1 mo'
                            : bp.months === 6
                              ? isAr
                                ? '٦ أشهر'
                                : '6 mo'
                              : isAr
                                ? '١٢ شهراً'
                                : '12 mo'}
                          : <strong style={{ color: 'var(--text)' }}>{bp.total_sar}</strong>{' '}
                          {isAr ? 'ر.س' : 'SAR'}
                          {bp.discount_pct > 0 ? ` (−${bp.discount_pct}%)` : ''}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {p.includes_free_hosting_domain ? (
                    <p className="mt-2 text-[10px] font-semibold" style={{ color: 'var(--accent)' }}>
                      {isAr
                        ? p.free_hosting_note_ar || 'استضافة ونطاق مجاني لأول ٢٠ متجراً'
                        : p.free_hosting_note_en || 'Free hosting + domain for first 20 stores'}
                      {slots != null ? ` · ${slots}` : ''}
                    </p>
                  ) : null}
                </article>
              );
            })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          {isAr ? 'إضافات الذكاء والأتمتة' : 'AI & automation add-ons'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {busy && addons.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {isAr ? 'جاري التحميل…' : 'Loading…'}
            </p>
          ) : addons.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {isAr ? 'لا توجد سجلات' : 'No records found'}
            </p>
          ) : (
            addons.map((a) => {
              const unlocked = Boolean(a.unlocked);
              return (
                <article
                  key={a.id}
                  className="rounded-2xl border p-4 flex gap-3"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: unlocked
                        ? 'color-mix(in srgb, var(--accent) 18%, transparent)'
                        : 'color-mix(in srgb, #f59e0b 16%, transparent)',
                    }}
                  >
                    {unlocked ? (
                      <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    ) : (
                      <Lock className="w-4 h-4 text-amber-700" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-black" style={{ color: 'var(--text)' }}>
                        {isAr ? a.name_ar : a.name_en}
                      </h3>
                      <span className="text-sm font-black shrink-0" style={{ color: 'var(--text)' }}>
                        {a.price_sar} {isAr ? 'ر.س' : 'SAR'}
                      </span>
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
                      {isAr ? a.description_ar : a.description_en}
                    </p>
                    <p className="text-[10px] mt-2 font-bold" style={{ color: unlocked ? 'var(--accent)' : '#b45309' }}>
                      {unlocked
                        ? isAr
                          ? 'مفتوح'
                          : 'Unlocked'
                        : isAr
                          ? 'مقفل — ادفع ثم موافقة الماستر'
                          : 'Locked — pay then Master approve'}
                    </p>
                    {(a.billing_periods || []).length > 0 ? (
                      <p className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
                        {a.billing_periods!.map((bp) => `${bp.months}m:${bp.total_sar}`).join(' · ')}
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section
        className="rounded-2xl border p-4 flex gap-3 items-start"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      >
        <Server className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
        <div>
          <h2 className="text-sm font-black" style={{ color: 'var(--text)' }}>
            {isAr ? 'الاستضافة والنطاق من سوق' : 'Hosting & domain from Souq'}
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'اشترِ هوستنجر والنطاق من لوحة الإعدادات ← الاستضافة. الباقة المميزة (٥٠٠ ر.س): مجاناً لأول ٢٠ متجراً بعد موافقة الماستر.'
              : 'Buy Hostinger + domain under Settings → Hosting. Premium (500 SAR): free for first 20 stores after Master approval.'}
          </p>
        </div>
      </section>
    </div>
  );
};

export default StoreMarketplacePlans;
