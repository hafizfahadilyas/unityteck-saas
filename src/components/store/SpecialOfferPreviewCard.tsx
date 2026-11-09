import React from 'react';
import { Gift } from 'lucide-react';

export type SpecialOfferPreviewProduct = {
  id: string;
  name?: string;
  image?: string | null;
};

export type SpecialOfferPreviewCardProps = {
  isAr: boolean;
  title: string;
  discountLabel: string;
  bannerBgColor?: string | null;
  bannerImage?: string | null;
  productThumbs?: SpecialOfferPreviewProduct[];
  compact?: boolean;
};

const DEFAULT_BG = '#0c5c46';

/**
 * Shared special-offer customer banner — dashboard live preview + storefront.
 * Empty image → color-only banner (no fake stock photo).
 */
export const SpecialOfferPreviewCard: React.FC<SpecialOfferPreviewCardProps> = ({
  isAr,
  title,
  discountLabel,
  bannerBgColor,
  bannerImage,
  productThumbs = [],
  compact = false,
}) => {
  const bg = (bannerBgColor && String(bannerBgColor).trim()) || DEFAULT_BG;
  const hasImage = Boolean(bannerImage && String(bannerImage).trim());
  const thumbs = productThumbs.slice(0, 3);

  return (
    <div
      className={`rounded-2xl text-white shadow-lg relative overflow-hidden border border-black/10 ${
        compact ? 'p-4' : 'p-5'
      }`}
      style={{ backgroundColor: bg }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {hasImage && (
        <>
          <img
            src={String(bannerImage)}
            alt={isAr ? 'صورة بانر العرض' : 'Offer banner image'}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${bg}ee 0%, ${bg}99 45%, ${bg}55 100%)`,
            }}
          />
        </>
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wide">
            {isAr ? 'عرض خاص' : 'Special Offer'}
          </span>
        </div>

        <div className={compact ? 'mt-2' : 'mt-4'}>
          <div className={`font-black tracking-tight text-white ${compact ? 'text-2xl' : 'text-3xl'}`}>
            {discountLabel}
          </div>
          <div className="text-xs text-white/90 font-medium mt-1 line-clamp-2">{title}</div>
        </div>

        {thumbs.length > 0 && (
          <div
            className={`flex items-center gap-1.5 ${
              compact ? 'mt-3 pt-2' : 'mt-4 pt-3'
            } border-t border-white/25`}
          >
            {thumbs.map((p) => (
              <div key={p.id} className="w-8 h-8 rounded-lg bg-white/20 overflow-hidden flex items-center justify-center">
                {p.image ? (
                  <img src={p.image} alt={p.name || ''} className="w-full h-full object-cover" />
                ) : (
                  <Gift className="w-3.5 h-3.5 text-white/80" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
