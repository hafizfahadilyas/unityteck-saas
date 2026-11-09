import React from 'react';

export type CashbackOfferPreviewProps = {
  isAr: boolean;
  type: 'percentage' | 'fixed';
  value: number | string;
  minCartValue?: number | string | null;
  enableMinCart?: boolean;
  imageUrl?: string | null;
  /** Compact storefront strip vs full dashboard card */
  compact?: boolean;
};

function formatValue(type: 'percentage' | 'fixed', value: number | string, isAr: boolean): string {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  if (type === 'percentage') {
    return `${safe}%`;
  }
  return isAr ? `${safe} ر.س` : `${safe} SAR`;
}

/**
 * Shared cashback offer visual — dashboard live preview + storefront cart banner.
 * Image is optional merchant media; empty = text-only pink voucher (no fake stock photo).
 */
export const CashbackOfferPreviewCard: React.FC<CashbackOfferPreviewProps> = ({
  isAr,
  type,
  value,
  minCartValue,
  enableMinCart = true,
  imageUrl,
  compact = false,
}) => {
  const valueLabel = formatValue(type, value, isAr);
  const minNum = Number(minCartValue);
  const showMin = enableMinCart && Number.isFinite(minNum) && minNum > 0;
  const hasImage = Boolean(imageUrl && String(imageUrl).trim());

  return (
    <div
      className={`rounded-2xl text-slate-900 bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/40 dark:to-rose-950/60 shadow-md border border-pink-200 dark:border-pink-900/40 relative overflow-hidden ${
        compact ? 'p-4' : 'p-5'
      }`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {hasImage && (
        <div className={`relative w-full overflow-hidden rounded-xl mb-3 ${compact ? 'h-28' : 'h-36'}`}>
          <img
            src={String(imageUrl)}
            alt={isAr ? 'صورة عرض الكاش باك' : 'Cashback offer image'}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-rose-100/80 via-transparent to-transparent dark:from-pink-950/50" />
        </div>
      )}

      <span className="px-2 py-0.5 rounded-full bg-pink-200 dark:bg-pink-900/60 text-pink-800 dark:text-pink-200 text-[10px] font-black uppercase tracking-wide">
        {isAr ? 'عرض كاش باك' : 'Cashback Offer'}
      </span>

      <div className={compact ? 'mt-2' : 'mt-4'}>
        <div className={`font-black text-pink-700 dark:text-pink-300 ${compact ? 'text-2xl' : 'text-3xl'}`}>
          {isAr ? `احصل على ${valueLabel}` : `Get ${valueLabel}`}
        </div>
        <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
          {isAr ? 'إلى محفظتك' : 'back to your wallet'}
        </div>
        {showMin && (
          <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            {isAr
              ? `عند إنفاق ${minNum} ر.س أو أكثر`
              : `When you spend ${minNum} SAR or more`}
          </div>
        )}
      </div>

      <div
        className={`${compact ? 'mt-3 pt-2' : 'mt-4 pt-3'} border-t border-pink-200 dark:border-pink-900/60 text-[10px] text-pink-800 dark:text-pink-300`}
      >
        {isAr
          ? 'سيتم إضافة الكاش باك إلى محفظتك تلقائياً بعد اكتمال الطلب.'
          : 'The cashback will be added to your wallet after the order is completed.'}
      </div>
    </div>
  );
};
