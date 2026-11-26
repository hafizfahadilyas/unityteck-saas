import React, { useMemo } from 'react';
import { Gift, Image as ImageIcon, Lock, MessageSquareText, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import type { AiSuiteStatus } from '../../services/storeAiSuiteApi';
import { Skeleton } from '../common/skeleton';

type MeterRow = {
  key: string;
  Icon: React.ElementType;
  labelEn: string;
  labelAr: string;
  used: number;
  limit: number;
  remaining: number;
  locked: boolean;
  subEn?: string;
  subAr?: string;
};

function pct(used: number, limit: number): number {
  if (limit <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((used / limit) * 100)));
}

function barColor(remaining: number, limit: number): string {
  if (limit <= 0 || remaining <= 0) return '#e11d48';
  const left = remaining / Math.max(1, limit);
  if (left <= 0.2) return '#f59e0b';
  return 'var(--accent)';
}

export const StoreAiQuotaMeter: React.FC<{
  suite: AiSuiteStatus | null;
  loading?: boolean;
  isAr: boolean;
  onLockedClick?: (module: 'images' | 'text' | 'automation') => void;
  onUpgradeClick?: () => void;
}> = ({ suite, loading, isAr, onLockedClick, onUpgradeClick }) => {
  const trial = suite?.trial;
  const isTrialActive = Boolean(trial?.is_active && !trial?.is_paid);
  const isTrialExhausted = Boolean(!trial?.is_active && !trial?.is_paid);
  const isPaid = Boolean(trial?.is_paid);

  const rows = useMemo((): MeterRow[] => {
    const images = suite?.modules?.images;
    const text = suite?.modules?.text;
    const auto = suite?.modules?.automation;
    const gq = (images?.gemini_quota || {}) as Record<string, unknown>;

    const imgDailyLimit = Number(gq.images_daily_limit ?? 0);
    const imgDailyUsed = Number(gq.images_used_today ?? 0);
    const imgDailyRem = Number(
      gq.images_remaining_today ?? Math.max(0, imgDailyLimit - imgDailyUsed),
    );
    const imgMonthLimit = Number(gq.images_limit ?? images?.monthly_image_quota ?? 0);
    const imgMonthUsed = Number(gq.images_used ?? 0);
    const imgMonthRem = Math.max(0, imgMonthLimit - imgMonthUsed);

    const textDaily = Number(text?.daily_token_limit ?? 0);
    const textMonthly = Number(text?.monthly_token_limit ?? 0);
    const autoDaily = Number(auto?.daily_question_quota ?? 0);
    const autoMonthly = Number(auto?.monthly_question_quota ?? 0);

    const effectivelyUnlockedImg = images?.unlocked || isTrialActive;
    const effectivelyUnlockedText = text?.unlocked || isTrialActive;
    const effectivelyUnlockedAuto = auto?.unlocked || isTrialActive;

    return [
      {
        key: 'images_daily',
        Icon: ImageIcon,
        labelEn: 'Images today',
        labelAr: 'الصور اليوم',
        used: imgDailyUsed,
        limit: imgDailyLimit || 10,
        remaining: effectivelyUnlockedImg ? (imgDailyRem || 10) : 0,
        locked: !effectivelyUnlockedImg,
        subEn: `Month ${imgMonthUsed}/${imgMonthLimit} · left ${imgMonthRem}`,
        subAr: `الشهر ${imgMonthUsed}/${imgMonthLimit} · متبقي ${imgMonthRem}`,
      },
      {
        key: 'text',
        Icon: Wand2,
        labelEn: 'Text tokens / day',
        labelAr: 'رموز النص / يوم',
        used: 0,
        limit: textDaily || 50000,
        remaining: effectivelyUnlockedText ? (textDaily || 50000) : 0,
        locked: !effectivelyUnlockedText,
        subEn: `Monthly cap ${textMonthly.toLocaleString()}`,
        subAr: `الحد الشهري ${textMonthly.toLocaleString()}`,
      },
      {
        key: 'automation',
        Icon: MessageSquareText,
        labelEn: 'Automation Q&A / day',
        labelAr: 'أسئلة الأتمتة / يوم',
        used: 0,
        limit: autoDaily || 20,
        remaining: effectivelyUnlockedAuto ? (autoDaily || 20) : 0,
        locked: !effectivelyUnlockedAuto,
        subEn: `Monthly ${autoMonthly || 100}`,
        subAr: `شهرياً ${autoMonthly || 100}`,
      },
    ];
  }, [suite, isTrialActive]);

  return (
    <div
      className="rounded-2xl border overflow-hidden shadow-sm"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
      aria-busy={loading}
    >
      {/* Top Header */}
      <div
        className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b"
        style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--portal-cta) 6%, var(--surface))' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
            style={{ background: 'var(--portal-cta)' }}
          >
            <Sparkles className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-black tracking-tight" style={{ color: 'var(--text)' }}>
              {isAr ? 'محاسبة حدود وسعات الذكاء الاصطناعي' : 'AI Limits & Accounting Meter'}
            </div>
            <div className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
              {loading
                ? isAr
                  ? 'جاري تحديث السعات…'
                  : 'Updating limits…'
                : isAr
                  ? 'حدود واستخدامات هذا المتجر مستقلة ومعزولة كلياً'
                  : 'Isolated store accounting · daily & monthly quotas'}
            </div>
          </div>
        </div>

        {/* Status Pill & Action */}
        <div className="flex items-center gap-2">
          {isTrialActive && (
            <span
              className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5"
              style={{
                background: 'color-mix(in srgb, #10b981 18%, transparent)',
                color: '#059669',
                border: '1px solid color-mix(in srgb, #10b981 30%, transparent)',
              }}
            >
              <Gift className="w-3.5 h-3.5" />
              {isAr
                ? `تجربة مجانية: ${trial?.remaining} من ${trial?.limit} متبقية`
                : `Free Trial: ${trial?.remaining}/${trial?.limit} left`}
            </span>
          )}

          {isTrialExhausted && (
            <span
              className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 animate-pulse"
              style={{
                background: 'color-mix(in srgb, #e11d48 15%, transparent)',
                color: '#e11d48',
                border: '1px solid color-mix(in srgb, #e11d48 30%, transparent)',
              }}
            >
              <Lock className="w-3.5 h-3.5" />
              {isAr ? 'انتهت الـ 5 عناصر المجانية' : 'Free Trial Expired (5/5 used)'}
            </span>
          )}

          {isPaid && (
            <span
              className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5"
              style={{
                background: 'color-mix(in srgb, var(--accent) 18%, transparent)',
                color: 'var(--accent)',
                border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {isAr ? 'الباقة المدفوعة مفعلة ومفتوحة' : 'Paid Plan Active'}
            </span>
          )}

          <button
            type="button"
            onClick={onUpgradeClick}
            className="unity-btn-primary text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isAr ? 'ترقية وتأكيد الدفع' : 'Upgrade & Pay'}
          </button>
        </div>
      </div>

      {/* Free Trial Highlight Strip */}
      {trial && (
        <div
          className="px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b"
          style={{
            borderColor: 'var(--border)',
            background: isTrialActive
              ? 'color-mix(in srgb, #10b981 8%, var(--bg))'
              : isTrialExhausted
                ? 'color-mix(in srgb, #f59e0b 12%, var(--bg))'
                : 'color-mix(in srgb, var(--accent) 8%, var(--bg))',
          }}
        >
          <div className="flex items-center gap-2 font-bold" style={{ color: 'var(--text)' }}>
            <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isPaid
                ? isAr
                  ? '✅ تم ترقية المتجر بنجاح وكافة وكلاء الذكاء الاصطناعي مفعلين بسعات عالية.'
                  : '✅ Store upgraded! All AI Agents fully enabled with high quotas.'
                : isTrialActive
                  ? isAr
                    ? `🎁 لكل متجر جديد 5 عناصر مجانية لجميع وكلاء الذكاء الاصطناعي (استخدمت ${trial.used} من ${trial.limit}).`
                    : `🎁 5 Free trial items granted for all AI Agents (used ${trial.used} of ${trial.limit}).`
                  : isAr
                    ? '⚠️ لقد استهلكت الـ 5 عناصر المجانية. قم بسداد الرسوم وإرفاق إيصال التحويل لفتح جميع الوكلاء فوراً.'
                    : '⚠️ Free trial (5/5 items) reached. Pay and upload receipt to unlock all AI Agents.'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-black" style={{ color: 'var(--muted)' }}>
              {isPaid
                ? isAr ? 'مفتوح بالكامل' : 'Unlimited'
                : `${trial.used} / ${trial.limit} ${isAr ? 'مستخدم' : 'used'}`}
            </span>
            <div
              className="w-24 h-2 rounded-full overflow-hidden"
              style={{ background: 'color-mix(in srgb, var(--border) 60%, transparent)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: isPaid ? '100%' : `${Math.min(100, (trial.used / trial.limit) * 100)}%`,
                  background: isPaid ? '#10b981' : isTrialExhausted ? '#e11d48' : '#10b981',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Meter Bars */}
      {loading && !suite ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4" aria-busy="true" role="status">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2.5 p-2">
              <div className="flex justify-between items-center">
                <Skeleton variant="rounded" height="14px" width="50%" />
                <Skeleton variant="rounded" height="14px" width="30%" />
              </div>
              <Skeleton variant="rounded" height="10px" width="100%" className="rounded-full" />
            </div>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: 'var(--border)' }}>
        {rows.map((row) => {
          const usedPct = pct(row.used, row.limit);
          const fill = barColor(row.remaining, row.limit);
          const module: 'images' | 'text' | 'automation' =
            row.key === 'images_daily' ? 'images' : row.key === 'text' ? 'text' : 'automation';

          return (
            <button
              key={row.key}
              type="button"
              className="p-3.5 text-start w-full transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_4%,transparent)] cursor-pointer"
              style={{ color: 'var(--text)' }}
              onClick={() => {
                if (row.locked || row.remaining <= 0) onLockedClick?.(module);
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <row.Icon className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                  <span className="text-[11px] font-black truncate">
                    {isAr ? row.labelAr : row.labelEn}
                  </span>
                </div>
                <span className="text-[11px] font-black tabular-nums shrink-0">
                  {row.locked ? (
                    <span className="flex items-center gap-1 font-bold" style={{ color: '#b45309' }}>
                      <Lock className="w-3 h-3" />
                      {isAr ? 'مقفل (يلزم ترقية)' : 'Locked'}
                    </span>
                  ) : (
                    <>
                      <span style={{ color: fill }}>{row.remaining}</span>
                      <span style={{ color: 'var(--muted)' }}> / {row.limit}</span>
                    </>
                  )}
                </span>
              </div>

              <div
                className="h-2.5 rounded-full overflow-hidden"
                style={{ background: 'color-mix(in srgb, var(--border) 70%, transparent)' }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={Math.max(1, row.limit)}
                aria-valuenow={row.locked ? 0 : row.used}
                aria-label={isAr ? row.labelAr : row.labelEn}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{
                    width: row.locked ? '100%' : `${usedPct}%`,
                    background: row.locked
                      ? 'color-mix(in srgb, #f59e0b 55%, var(--border))'
                      : `linear-gradient(90deg, ${fill}, color-mix(in srgb, ${fill} 70%, #fff))`,
                    boxShadow: row.locked || row.remaining <= 0 ? undefined : `0 0 12px color-mix(in srgb, ${fill} 35%, transparent)`,
                  }}
                />
              </div>

              <div className="mt-1.5 text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
                {row.locked
                  ? isAr
                    ? 'اضغط للترقية وإرفاق إيصال الدفع'
                    : 'Tap to upgrade & upload payment receipt'
                  : isAr
                    ? `${row.subAr || ''} · متبقي ${row.remaining}`
                    : `${row.subEn || ''} · left ${row.remaining}`}
              </div>
            </button>
          );
        })}
      </div>
      )}
    </div>
  );
};

export default StoreAiQuotaMeter;
