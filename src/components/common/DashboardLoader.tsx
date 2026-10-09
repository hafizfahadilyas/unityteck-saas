import React from 'react';
import { Flower2, Sparkles, RefreshCw } from 'lucide-react';

interface DashboardLoaderProps {
  messageAr?: string;
  messageEn?: string;
  logoUrl?: string;
  isAr?: boolean;
  inline?: boolean;
  enabled?: boolean;
}

export const DashboardLoader: React.FC<DashboardLoaderProps> = ({
  messageAr = 'جاري مزامنة البيانات وتحديث لوحة التحكم…',
  messageEn = 'Loading dashboard and synchronizing catalog data…',
  logoUrl,
  isAr = true,
  inline = false,
  enabled = true,
}) => {
  const [imgError, setImgError] = React.useState(false);

  if (!enabled) return null;

  if (inline) {
    return (
      <div className="flex items-center justify-center gap-2.5 py-6 px-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>{isAr ? messageAr : messageEn}</span>
      </div>
    );
  }

  return (
    <div
      className="p-12 flex flex-col items-center justify-center min-h-[340px] w-full text-center select-none"
      aria-busy="true"
      role="status"
    >
      <div className="relative w-16 h-16 flex items-center justify-center mb-4">
        {/* Soft spinning outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/30 animate-spin [animation-duration:6s]" />
        <div className="absolute inset-1.5 rounded-full border-2 border-t-emerald-600 border-r-transparent border-b-emerald-600 border-l-transparent animate-spin [animation-duration:1.5s]" />

        {/* Center icon */}
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm overflow-hidden p-1">
          {logoUrl && !imgError ? (
            <img
              src={logoUrl}
              alt="Logo"
              onError={() => setImgError(true)}
              className="w-full h-full object-contain"
            />
          ) : (
            <Flower2 className="w-5 h-5 animate-pulse" />
          )}
        </div>
      </div>

      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5 mb-1">
        <span>{isAr ? messageAr : messageEn}</span>
        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {isAr ? 'يرجى الانتظار قليلاً' : 'Please wait a moment…'}
      </p>
    </div>
  );
};
