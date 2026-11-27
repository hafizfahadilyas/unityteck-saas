import React, { useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Gift,
  Image as ImageIcon,
  Lock,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap,
} from 'lucide-react';
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
  gradient: string;
};

function pct(used: number, limit: number): number {
  if (limit <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((used / limit) * 100)));
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
        gradient: 'from-purple-500 via-indigo-500 to-blue-500',
      },
      {
        key: 'text',
        Icon: Wand2,
        labelEn: 'Text tokens / day',
        labelAr: 'رموز النص / يوم',
        used: 0,
        limit: textDaily || 80000,
        remaining: effectivelyUnlockedText ? (textDaily || 80000) : 0,
        locked: !effectivelyUnlockedText,
        subEn: `Monthly cap ${(textMonthly || 800000).toLocaleString()}`,
        subAr: `الحد الشهري ${(textMonthly || 800000).toLocaleString()}`,
        gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      },
      {
        key: 'automation',
        Icon: MessageSquareText,
        labelEn: 'Automation Q&A / day',
        labelAr: 'أسئلة الأتمتة / يوم',
        used: 0,
        limit: autoDaily || 30,
        remaining: effectivelyUnlockedAuto ? (autoDaily || 30) : 0,
        locked: !effectivelyUnlockedAuto,
        subEn: `Monthly ${autoMonthly || 200}`,
        subAr: `شهرياً ${autoMonthly || 200}`,
        gradient: 'from-blue-500 via-indigo-500 to-purple-500',
      },
    ];
  }, [suite, isTrialActive]);

  return (
    <div
      className="rounded-3xl border border-slate-700/60 shadow-xl overflow-hidden backdrop-blur-xl"
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 30, 0.98) 100%)',
        color: '#f8fafc',
      }}
      aria-busy={loading}
    >
      {/* Top Header Bar - Spacious & Luxurious */}
      <div className="px-5 sm:px-7 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm sm:text-base font-black tracking-tight text-white truncate">
                {isAr ? 'محاسبة حدود وسعات الذكاء الاصطناعي' : 'AI Limits & Accounting Meter'}
              </h2>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Live Isolated Quota
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">
              {loading
                ? isAr
                  ? 'جاري تحديث السعات المباشرة…'
                  : 'Updating live store quotas…'
                : isAr
                  ? 'سعات واستخدامات هذا المتجر مستقلة ومعزولة كلياً · حصص يومية وشهرية'
                  : 'Isolated store accounting · daily & monthly quotas'}
            </p>
          </div>
        </div>

        {/* Status Pill & Primary Action */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {isTrialActive && (
            <div className="px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
              <Gift className="w-3.5 h-3.5" />
              <span>
                {isAr
                  ? `تجربة مجانية: ${trial?.remaining} من ${trial?.limit} متبقية`
                  : `Free Trial: ${trial?.remaining}/${trial?.limit} left`}
              </span>
            </div>
          )}

          {isTrialExhausted && (
            <div className="px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm animate-pulse">
              <Lock className="w-3.5 h-3.5" />
              <span>{isAr ? 'انتهت العناصر المجانية (5/5 مستخدمة)' : 'Free Trial Expired (5/5 used)'}</span>
            </div>
          )}

          {isPaid && (
            <div className="px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isAr ? 'الباقة المدفوعة مفعلة ومفتوحة بالكامل' : 'Pro Plan Active & High Quotas'}</span>
            </div>
          )}

          <button
            type="button"
            onClick={onUpgradeClick}
            className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:brightness-110 shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'ترقية الباقة والدفع' : 'Upgrade & Pay'}</span>
          </button>
        </div>
      </div>

      {/* Free Trial Highlight Strip */}
      {trial && (
        <div
          className={`px-5 sm:px-7 py-3 text-xs flex flex-wrap items-center justify-between gap-3 border-b ${
            isTrialActive
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
              : isTrialExhausted
                ? 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                : 'bg-indigo-950/30 border-indigo-800/40 text-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2.5 font-bold">
            {isPaid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : isTrialActive ? (
              <Gift className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="leading-relaxed">
              {isPaid
                ? isAr
                  ? 'تم ترقية المتجر بنجاح وكافة وكلاء الذكاء الاصطناعي مفعلين بسعات عالية.'
                  : 'Store upgraded! All AI Agents fully enabled with high quotas.'
                : isTrialActive
                  ? isAr
                    ? `لكل متجر جديد 5 عناصر مجانية لجميع وكلاء الذكاء الاصطناعي (استخدمت ${trial.used} من ${trial.limit}).`
                    : `5 Free trial items granted for all AI Agents (used ${trial.used} of ${trial.limit}).`
                  : isAr
                    ? 'لقد استهلكت الـ 5 عناصر المجانية. اختر الباقة المناسبة وادفع لتفعيل جميع الوكلاء فوراً.'
                    : 'Free trial (5/5 items) reached. Pay to unlock all AI Agents instantly.'}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] font-black text-slate-300">
              {isPaid
                ? isAr ? 'مفتوح بالكامل' : 'Unlimited High Caps'
                : `${trial.used} / ${trial.limit} ${isAr ? 'مستخدم' : 'used'}`}
            </span>
            <div className="w-28 h-2 rounded-full overflow-hidden bg-slate-800">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: isPaid ? '100%' : `${Math.min(100, (trial.used / trial.limit) * 100)}%`,
                  background: isPaid
                    ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                    : isTrialExhausted
                      ? '#f43f5e'
                      : '#10b981',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Meter Bars - 3 Distinct Luxury Cards */}
      {loading && !suite ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5 sm:p-7">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton variant="rounded" height="18px" width="50%" />
                <Skeleton variant="rounded" height="18px" width="30%" />
              </div>
              <Skeleton variant="rounded" height="12px" width="100%" className="rounded-full" />
              <Skeleton variant="rounded" height="14px" width="60%" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 p-5 sm:p-7">
          {rows.map((row) => {
            const usedPct = pct(row.used, row.limit);
            const module: 'images' | 'text' | 'automation' =
              row.key === 'images_daily' ? 'images' : row.key === 'text' ? 'text' : 'automation';

            return (
              <button
                key={row.key}
                type="button"
                onClick={() => {
                  if (row.locked || row.remaining <= 0) onLockedClick?.(module);
                }}
                className={`text-start p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between ${
                  row.locked
                    ? 'border-amber-500/40 bg-amber-950/15 hover:bg-amber-950/25 hover:border-amber-500/60'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700 shadow-sm'
                }`}
              >
                <div>
                  {/* Card Title & Icon */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${row.gradient} text-white flex items-center justify-center shrink-0 shadow-md`}>
                        <row.Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-white truncate">
                        {isAr ? row.labelAr : row.labelEn}
                      </span>
                    </div>

                    <span className="text-xs font-black tabular-nums shrink-0">
                      {row.locked ? (
                        <span className="flex items-center gap-1 font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                          <Lock className="w-3 h-3" />
                          {isAr ? 'مقفل' : 'Locked'}
                        </span>
                      ) : (
                        <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                          {row.remaining} <span className="text-slate-400 font-normal">/ {row.limit}</span>
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Luxury Progress Bar */}
                  <div
                    className="h-3 rounded-full overflow-hidden bg-slate-800 p-0.5 border border-slate-700/60"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={Math.max(1, row.limit)}
                    aria-valuenow={row.locked ? 0 : row.used}
                    aria-label={isAr ? row.labelAr : row.labelEn}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${
                        row.locked
                          ? 'from-amber-500 to-rose-500'
                          : row.remaining <= 0
                            ? 'from-rose-500 to-orange-500'
                            : row.gradient
                      }`}
                      style={{
                        width: row.locked ? '100%' : `${Math.max(6, usedPct)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Subtitle / Quota Status */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>
                    {row.locked
                      ? isAr ? 'اضغط للترقية والفتح الفوري' : 'Tap to unlock'
                      : isAr ? row.subAr : row.subEn}
                  </span>
                  <span className={row.locked ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                    {row.locked
                      ? isAr ? 'ترقية ←' : 'Upgrade →'
                      : `${row.remaining} ${isAr ? 'متبقي' : 'left'}`}
                  </span>
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
