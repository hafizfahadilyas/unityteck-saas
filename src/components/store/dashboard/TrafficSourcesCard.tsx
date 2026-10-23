import React from 'react';
import {
  Link2,
  ChevronRight,
  MessageCircle,
  Share2,
  Globe,
  Instagram,
  Facebook,
  Ghost,
  Music2,
  Search,
  Mail,
  Video,
} from 'lucide-react';
import { usePrefs } from '../../../i18n/PrefsContext';

export interface TrafficChannel {
  id: string;
  name: string;
  nameAr: string;
  percentage: number;
  color: string;
  iconType: 'tiktok' | 'snapchat' | 'whatsapp' | 'instagram' | 'facebook' | 'google' | 'bing' | 'youtube' | 'x' | 'email' | 'other' | 'direct';
}

interface TrafficSourcesCardProps {
  totalVisits?: number;
  growthPercentage?: number;
  channels?: TrafficChannel[];
  onViewAll: () => void;
}

export const TrafficSourcesCard: React.FC<TrafficSourcesCardProps> = React.memo(({
  totalVisits = 0,
  growthPercentage = 0,
  channels = [],
  onViewAll,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const list = channels;

  // Donut chart geometry dynamically computed from actual channel percentages
  const radius = 38;
  const strokeWidth = 12.5;
  const circumference = 2 * Math.PI * radius;

  const donutSegments = list.map((ch) => ({
    pct: ch.percentage,
    color: ch.color,
  }));

  let accumulated = 0;

  const renderChannelIcon = (type: string) => {
    switch (type) {
      case 'tiktok':
        return (
          <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Music2 className="w-2.5 h-2.5" />
          </div>
        );
      case 'snapchat':
        return (
          <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-2xs">
            <Ghost className="w-2.5 h-2.5 fill-current" />
          </div>
        );
      case 'whatsapp':
        return (
          <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <MessageCircle className="w-2.5 h-2.5" />
          </div>
        );
      case 'instagram':
        return (
          <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Instagram className="w-2.5 h-2.5" />
          </div>
        );
      case 'facebook':
        return (
          <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Facebook className="w-2.5 h-2.5 fill-current" />
          </div>
        );
      case 'google':
        return (
          <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Search className="w-2.5 h-2.5" />
          </div>
        );
      case 'bing':
        return (
          <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Search className="w-2.5 h-2.5" />
          </div>
        );
      case 'youtube':
        return (
          <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Video className="w-2.5 h-2.5" />
          </div>
        );
      case 'x':
        return (
          <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shrink-0 shadow-2xs font-black text-[9px]">
            𝕏
          </div>
        );
      case 'email':
        return (
          <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Mail className="w-2.5 h-2.5" />
          </div>
        );
      case 'direct':
        return (
          <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Globe className="w-2.5 h-2.5" />
          </div>
        );
      default:
        return (
          <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-slate-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Share2 className="w-2.5 h-2.5" />
          </div>
        );
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-full">
      {/* ── Card Header ── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center border border-teal-200/60 dark:border-teal-800/40">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
              {isAr ? 'مصادر الزيارات' : 'Traffic Sources'}
            </h3>
            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              {isAr ? 'من أين يأتي زوار متجرك؟' : 'Where do your visitors come from?'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-bold text-teal-700 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200 flex items-center gap-1 hover:underline cursor-pointer transition-colors"
        >
          <span>{isAr ? 'عرض الكل' : 'View All'}</span>
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      </div>

      {/* ── Donut Chart + Channel List (Strict: Hide any traffic source when it has no visits) ── */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div className="flex flex-row items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
          {/* Donut Chart */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center self-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background / Neutral Track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className={donutSegments.length === 0 ? 'text-slate-100 dark:text-slate-800' : 'text-slate-50 dark:text-slate-800/50'}
              />
              {/* Active Segments */}
              {donutSegments.map((seg, i) => {
                const dasharray = `${(seg.pct / 100) * circumference} ${circumference}`;
                const dashoffset = -((accumulated / 100) * circumference);
                accumulated += seg.pct;
                return (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dasharray}
                    strokeDashoffset={dashoffset}
                    className="transition-all duration-300 hover:opacity-90"
                  />
                );
              })}
            </svg>

            {/* Center Label (100% Match with PDF Page 1) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-200 tracking-wider">
                {isAr ? 'إجمالي الزيارات' : 'Total Visits'}
              </span>
              <span className="text-sm sm:text-base md:text-lg font-black text-slate-950 dark:text-white tabular-nums tracking-tight">
                {totalVisits.toLocaleString()}
              </span>
              {growthPercentage > 0 && (
                <span className="text-[10px] sm:text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5">
                  <span>↑</span>
                  <span>{growthPercentage}%</span>
                </span>
              )}
            </div>
          </div>

          {/* Channels List or Genuine Empty State (Sources with 0 visits hidden) */}
          {list.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-3 sm:p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 my-auto">
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center border border-teal-200/50 dark:border-teal-800/40 mb-1.5">
                <Link2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'لا توجد مصادر زيارات مسجلة بعد' : 'No traffic sources recorded yet'}
              </p>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 max-w-[200px] leading-tight">
                {isAr ? 'يتم إخفاء أي مصدر ليس لديه زيارات فعلية' : 'Any traffic source without visits is automatically hidden'}
              </p>
            </div>
          ) : (
            <div className="flex-1 w-full space-y-1.5 sm:space-y-2 min-w-0">
              {list.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center justify-between gap-1.5 sm:gap-2 text-xs font-semibold py-0.5 px-1 sm:px-1.5 -mx-1 sm:-mx-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    {renderChannelIcon(ch.iconType)}
                    <span
                      className="text-slate-900 dark:text-slate-100 font-bold text-[11.5px] sm:text-xs whitespace-nowrap"
                      title={isAr ? ch.nameAr : ch.name}
                    >
                      {isAr ? ch.nameAr : ch.name}
                    </span>
                  </div>
                  <span className="text-slate-950 dark:text-white font-black text-xs tabular-nums shrink-0 ps-1.5">
                    {ch.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

TrafficSourcesCard.displayName = 'TrafficSourcesCard';
