import React from 'react';
import { useSkeletonConfig } from './SkeletonConfigContext';
import { Skeleton } from './Skeleton';
import { SkeletonProductCard } from './SkeletonProductCard';
import { usePrefs } from '../../../i18n/PrefsContext';
import { Sparkles, Sliders, Zap, Eye, Gauge, ShieldCheck, Check } from 'lucide-react';
import type { SkeletonAnimation, SkeletonSpeed } from './types';

export const SkeletonSettingsCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { enabled, animation, speed, reducedMotion, setEnabled, setAnimation, setSpeed } = useSkeletonConfig();
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const animations: { id: SkeletonAnimation; labelEn: string; labelAr: string; descEn: string; descAr: string }[] = [
    {
      id: 'shimmer',
      labelEn: 'Smooth Shimmer (Default)',
      labelAr: 'وميض ناعم (الافتراضي)',
      descEn: 'GPU-accelerated wave animation that flows with language direction.',
      descAr: 'حركة موجية سلسة تتبع اتجاه اللغة (من اليمين لليسار بالعربية).',
    },
    {
      id: 'pulse',
      labelEn: 'Gentle Pulse',
      labelAr: 'نبض هادئ',
      descEn: 'Subtle opacity oscillation for minimal visual distraction.',
      descAr: 'تلاشي شفافية هادئ ومريح للعينين.',
    },
    {
      id: 'none',
      labelEn: 'Static Neutral',
      labelAr: 'ثابت بدون حركة',
      descEn: 'Zero animation, instant neutral placeholder blocks.',
      descAr: 'كتل نائبة محايدة ثابتة بدون أي حركة.',
    },
  ];

  const speeds: { id: SkeletonSpeed; labelEn: string; labelAr: string }[] = [
    { id: 'fast', labelEn: 'Fast (1.1s)', labelAr: 'سريع (1.1 ثانية)' },
    { id: 'normal', labelEn: 'Normal (1.6s)', labelAr: 'عادي (1.6 ثانية)' },
    { id: 'slow', labelEn: 'Slow (2.2s)', labelAr: 'هادئ (2.2 ثانية)' },
  ];

  return (
    <div
      className={`p-6 rounded-3xl border space-y-6 ${className}`}
      style={{
        background: 'var(--surface, #ffffff)',
        borderColor: 'var(--border, #e2e8f0)',
        boxShadow: 'var(--card-shadow, 0 1px 3px rgba(0,0,0,0.05))',
      }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border,#e2e8f0)]">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
            style={{ background: 'var(--portal-cta, linear-gradient(90deg, #1d8b94, #4fb8b4))' }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'نظام التحميل الهيكلي المركزي (Skeleton Loading System)' : 'Central Skeleton Loading System'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'إعدادات حركة ومظهر الهياكل النائبة عبر المتاجر ولوحات التحكم وواجهات العرض.'
                : 'Configure placeholder animation, speed, and shimmer across all platform stores and portals.'}
            </p>
          </div>
        </div>

        {/* Global Enabled Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {isAr ? 'تفعيل الهياكل:' : 'Skeleton Loading:'}
          </span>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
            aria-pressed={enabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? (isAr ? '-translate-x-6' : 'translate-x-6') : (isAr ? '-translate-x-1' : 'translate-x-1')
              }`}
            />
          </button>
        </div>
      </div>

      {/* Animation Style Selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
          {isAr ? 'نمط الحركة والوميض (Animation Style)' : 'Animation & Shimmer Style'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {animations.map((item) => {
            const isSelected = animation === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setAnimation(item.id)}
                className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 ring-1 ring-emerald-500/30'
                    : 'border-[var(--border,#e2e8f0)] bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {isAr ? item.labelAr : item.labelEn}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isAr ? item.descAr : item.descEn}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Animation Speed Selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
          {isAr ? 'سرعة الحركة (Animation Speed)' : 'Animation Speed'}
        </label>
        <div className="flex flex-wrap gap-2">
          {speeds.map((s) => {
            const isSelected = speed === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSpeed(s.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-600 text-white shadow-xs'
                    : 'border-[var(--border,#e2e8f0)] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {isAr ? s.labelAr : s.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reduced Motion & Accessibility Status */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-[var(--border,#e2e8f0)] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200 block">
            {isAr ? 'إمكانية الوصول وتفضيلات تقليل الحركة' : 'Accessibility & Reduced Motion'}
          </span>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            {reducedMotion
              ? isAr
                ? '⚡ نظام التشغيل مفعّل فيه خيار تقليل الحركة (Reduced Motion). تم تلقائياً تعطيل الوميض لتوفير تجربة مريحة وسلسة.'
                : '⚡ Operating system has prefers-reduced-motion enabled. Shimmer animations are automatically restrained.'
              : isAr
                ? 'نظام سوق يحترم تلقائياً تفضيلات النظام @media (prefers-reduced-motion) مع دعم كامل للتباين العالي واللغة العربية RTL.'
                : 'Souq platform respects native @media (prefers-reduced-motion) preferences with full RTL shimmer inversion and high-contrast support.'}
          </p>
        </div>
      </div>

      {/* Live Interactive Preview */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {isAr ? 'معاينة حية للمظهر الحالي:' : 'Live Component Preview:'}
          </label>
          <span className="text-[11px] text-slate-400 font-semibold">
            {isAr ? 'تحديث لحظي' : 'Realtime Shimmer'}
          </span>
        </div>
        <div className="p-4 rounded-2xl border border-[var(--border,#e2e8f0)] bg-[var(--bg,#f8fafc)] max-w-sm">
          <SkeletonProductCard variant="grid" />
        </div>
      </div>
    </div>
  );
};
