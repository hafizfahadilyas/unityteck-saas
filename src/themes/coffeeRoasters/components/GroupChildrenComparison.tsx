import React, { useMemo } from 'react';
import { Check, ShoppingBag, Star } from 'lucide-react';
import {
  buildGroupCompareRows,
  childComparePricing,
  formatCompareSar,
  rowValuesDiffer,
  type GroupCompareChild,
} from './groupChildrenComparisonLogic';

export type { GroupCompareChild };
export { buildGroupCompareRows } from './groupChildrenComparisonLogic';

interface GroupChildrenComparisonProps {
  children: GroupCompareChild[];
  selectedId: string | null;
  language: 'EN' | 'AR';
  onSelect: (childId: string) => void;
  onBuy: (child: GroupCompareChild) => void;
}

function childThumb(child: GroupCompareChild): string {
  return child.selectorImageUrl || child.images?.[0] || child.image || '';
}

function childDisplayName(child: GroupCompareChild, isAr: boolean): string {
  if (isAr) return (child.nameAr || child.name || '').trim() || '—';
  return (child.name || child.nameAr || '').trim() || '—';
}

function childBlurb(child: GroupCompareChild, isAr: boolean): string {
  const tag = isAr
    ? (child.taglineAr || child.tagline || '').trim()
    : (child.tagline || child.taglineAr || '').trim();
  if (tag) return tag;
  const overview = isAr
    ? (child.overviewAr || child.overview || '').trim()
    : (child.overview || child.overviewAr || '').trim();
  if (!overview) return '';
  return overview.length > 90 ? `${overview.slice(0, 89).trimEnd()}…` : overview;
}

function sameId(a: string | null | undefined, b: string | null | undefined): boolean {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

/**
 * HiBrew grouped parent: readable side-by-side compare of real child products + Buy.
 * Selection mirrors the top gallery group thumbs (same activeChildId).
 */
export const GroupChildrenComparison: React.FC<GroupChildrenComparisonProps> = ({
  children: kids,
  selectedId,
  language,
  onSelect,
  onBuy,
}) => {
  const isAr = language === 'AR';
  const pool = useMemo(() => (kids || []).filter((c) => c?.id), [kids]);
  const rows = useMemo(() => buildGroupCompareRows(pool, isAr), [pool, isAr]);
  const childIds = useMemo(() => pool.map((c) => c.id), [pool]);

  if (pool.length < 2) return null;

  // Default = whatever is selected above; fall back to first child only if unset.
  const activeId =
    selectedId && pool.some((c) => sameId(c.id, selectedId))
      ? String(selectedId)
      : String(pool[0].id);
  const colMin = pool.length >= 4 ? 180 : 200;
  const gridCols = `minmax(132px, 160px) repeat(${pool.length}, minmax(${colMin}px, 1fr))`;

  return (
    <section
      id="specs-comparison-section"
      className="mt-12 sm:mt-16 scroll-mt-28 w-full border-t border-[#E5E5E5] pt-12 sm:pt-16"
      dir={isAr ? 'rtl' : 'ltr'}
      data-group-comparison="children"
    >
      <div className="max-w-3xl mx-auto mb-8 sm:mb-10 text-center space-y-2 px-1">
        <span className="inline-block text-xs font-bold tracking-wide text-neutral-700 bg-neutral-100 border border-neutral-200 px-3.5 py-1.5 rounded-full shadow-none">
          {isAr ? 'مقارنة الموديلات' : 'Model comparison'}
        </span>
        <h2
          className={`text-2xl sm:text-[2rem] font-extrabold text-neutral-900 ${isAr ? 'leading-[1.4]' : 'leading-tight'}`}
        >
          {isAr ? 'قارن واختر الأنسب لك' : 'Compare and pick what fits you'}
        </h2>
        <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
          {isAr
            ? 'راجع السعر والتوفر والتفاصيل لكل منتج داخل المجموعة، ثم اشترِ مباشرة.'
            : 'Review price, stock, and details for each product in this group, then buy.'}
        </p>
      </div>

      <div className="overflow-x-auto -mx-1 px-1 pb-2">
        <div
          className="min-w-[640px] rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-none"
          style={{ boxShadow: 'none' }}
        >
          {/* Header: product columns — equal-height slots for row alignment */}
          <div
            className="grid border-b border-neutral-200 bg-white"
            style={{ gridTemplateColumns: gridCols }}
          >
            <div className="px-3 sm:px-4 py-5 flex items-end border-e border-neutral-200">
              <span className="text-[11px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wide">
                {isAr ? 'المنتج' : 'Product'}
              </span>
            </div>
            {pool.map((child) => {
              const selected = sameId(child.id, activeId);
              const pricing = childComparePricing(child);
              const thumb = childThumb(child);
              const title = childDisplayName(child, isAr);
              const blurb = childBlurb(child, isAr);
              const inStock = typeof child.stock === 'number' ? child.stock > 0 : true;
              const saveAmt =
                pricing.compareAt != null && pricing.compareAt > pricing.price
                  ? pricing.compareAt - pricing.price
                  : 0;
              return (
                <div
                  key={child.id}
                  className={`relative px-3 sm:px-4 pt-4 pb-5 flex flex-col items-center text-center border-e border-neutral-200 last:border-e-0 ${
                    selected ? 'bg-white' : 'bg-[#FAFAFA]'
                  }`}
                  style={{ boxShadow: 'none' }}
                >
                  {/* Fixed badge slot so columns stay aligned */}
                  <div className="h-7 w-full mb-2 flex items-center justify-center">
                    {selected ? (
                      <span className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 shadow-none">
                        <Check className="w-3.5 h-3.5" />
                        {isAr ? 'محدد' : 'Selected'}
                      </span>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelect(String(child.id))}
                    className="w-full flex flex-col items-center cursor-pointer flex-1"
                    aria-pressed={selected}
                  >
                    <div
                      className={`w-full rounded-xl bg-white border border-solid mb-3 flex items-center justify-center p-3 shadow-none ${
                        selected ? 'border-neutral-900' : 'border-neutral-200'
                      }`}
                      style={{ boxShadow: 'none' }}
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={title}
                          className="h-28 sm:h-32 w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-28 sm:h-32 w-full rounded-lg bg-neutral-100 border border-neutral-200" />
                      )}
                    </div>

                    <h3 className="text-sm sm:text-[15px] font-extrabold text-neutral-900 leading-snug line-clamp-2 min-h-[2.6rem] w-full">
                      {title}
                    </h3>

                    <p className="mt-1.5 text-xs sm:text-[13px] text-neutral-600 leading-relaxed line-clamp-2 min-h-[2.4rem] w-full">
                      {blurb || '\u00a0'}
                    </p>

                    <div className="mt-3 w-full min-h-[3.5rem] flex flex-col items-center justify-start gap-1">
                      <div className="text-xl sm:text-2xl font-black text-neutral-900 font-sans tracking-tight leading-none">
                        {formatCompareSar(isAr, pricing.price)}
                      </div>
                      <div className="min-h-[1.5rem] flex flex-wrap items-center justify-center gap-1.5">
                        {pricing.compareAt != null && pricing.compareAt > pricing.price ? (
                          <>
                            <span className="text-sm text-neutral-400 line-through font-sans">
                              {formatCompareSar(isAr, pricing.compareAt)}
                            </span>
                            {saveAmt > 0 ? (
                              <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-full px-2 py-0.5 shadow-none">
                                {isAr
                                  ? `وفر ${formatCompareSar(true, saveAmt)}`
                                  : `Save ${formatCompareSar(false, saveAmt)}`}
                              </span>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-2 min-h-[1.75rem] flex flex-wrap items-center justify-center gap-1.5">
                      <span
                        className={`text-[11px] font-bold rounded-full px-2.5 py-1 border shadow-none ${
                          inStock
                            ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                            : 'text-rose-800 bg-rose-50 border-rose-200'
                        }`}
                      >
                        {typeof child.stock === 'number'
                          ? inStock
                            ? isAr
                              ? `${child.stock.toLocaleString('ar-SA')} متوفر`
                              : `${child.stock.toLocaleString('en-US')} in stock`
                            : isAr
                              ? 'غير متوفر'
                              : 'Out of stock'
                          : isAr
                            ? 'التوفر غير محدد'
                            : 'Stock unknown'}
                      </span>
                      {Number(child.rating) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 shadow-none">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {Number(child.rating).toFixed(1)}
                        </span>
                      ) : null}
                    </div>
                  </button>

                  <div className="mt-4 w-full space-y-2">
                    {selected ? (
                      <button
                        type="button"
                        aria-pressed
                        className="w-full rounded-full px-3 py-2.5 text-sm font-extrabold bg-neutral-900 text-white border border-neutral-900 cursor-default flex items-center justify-center gap-2 shadow-none"
                        style={{ boxShadow: 'none' }}
                      >
                        <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                        <span>{isAr ? 'تم الاختيار' : 'Selected'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelect(String(child.id))}
                        className="w-full rounded-full px-3 py-2.5 text-sm font-extrabold bg-[#8B5A2B] text-white border border-[#8B5A2B] hover:bg-[#734a24] hover:border-[#734a24] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-none"
                        style={{ boxShadow: 'none' }}
                      >
                        <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                        <span>{isAr ? 'اختر هذا المنتج' : 'Select this product'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onBuy(child)}
                      className="w-full rounded-full px-3 py-2.5 text-sm font-bold bg-black text-white border border-black hover:bg-neutral-800 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-none"
                      style={{ boxShadow: 'none' }}
                    >
                      <ShoppingBag className="w-4 h-4 shrink-0" />
                      <span>{isAr ? 'شراء الآن' : 'Buy now'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail rows — flat 1px borders, no inset/shadow */}
          {rows.length > 0 ? (
            <div>
              {rows.map((row, idx) => {
                const differs = rowValuesDiffer(row, childIds);
                return (
                  <div
                    key={row.key}
                    className={`grid border-t border-neutral-200 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'
                    }`}
                    style={{ gridTemplateColumns: gridCols, boxShadow: 'none' }}
                  >
                    <div className="px-3 sm:px-4 py-3.5 sm:py-4 flex items-center border-e border-neutral-200">
                      <span className="text-sm font-bold text-neutral-800 leading-snug">
                        {isAr ? row.labelAr : row.labelEn}
                      </span>
                    </div>
                    {pool.map((child) => {
                      const selected = sameId(child.id, activeId);
                      const value = row.values[child.id] || '—';
                      return (
                        <div
                          key={`${row.key}-${child.id}`}
                          className={`px-3 sm:px-4 py-3.5 sm:py-4 text-center border-e border-neutral-200 last:border-e-0 flex items-center justify-center ${
                            selected ? 'bg-white' : ''
                          }`}
                          style={{ boxShadow: 'none' }}
                        >
                          <span
                            className={`text-sm leading-relaxed break-words ${
                              differs && value !== '—'
                                ? 'font-semibold text-neutral-900'
                                : 'font-medium text-neutral-700'
                            }`}
                          >
                            {value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};
