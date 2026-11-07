/**
 * Storefront product options picker — Text / Color / Image.
 * Resolves matching variant from existing product.variations (no duplicate catalog).
 */
import React, { useEffect, useMemo, useState } from 'react';
import type { Product, ProductOptionDefinition, ProductVariation } from '../../types';
import {
  findMatchingVariant,
  isVariantLowStock,
  isVariantPurchasable,
  optionValuesList,
  variantPriceParts,
} from '../../utils/productVariants';
import { pickLocaleText } from '../../utils/localeLabel';

export interface ProductOptionsPickerProps {
  product: Product;
  isAr?: boolean;
  onVariantChange?: (variant: ProductVariation | null, selected: Record<string, string>) => void;
}

function optionType(opt: ProductOptionDefinition): string {
  const t = String(opt.type || '').toLowerCase();
  if (t === 'color' || t.includes('color')) return 'color';
  if (t === 'image' || t.includes('image')) return 'image';
  return 'text';
}

export const ProductOptionsPicker: React.FC<ProductOptionsPickerProps> = ({
  product,
  isAr = false,
  onVariantChange,
}) => {
  const definitions = useMemo(() => {
    const raw = product.productOptions;
    if (!Array.isArray(raw) || raw.length === 0) return [] as ProductOptionDefinition[];
    return raw.filter((opt) => opt.visible !== false);
  }, [product.productOptions]);

  const variations = product.variations || [];

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const opt of definitions) {
      const vals = optionValuesList(opt.values).filter((v) => v.selected !== false);
      if (vals[0]) init[opt.name] = vals[0].label;
    }
    return init;
  });

  const matched = useMemo(
    () => findMatchingVariant(variations, selected),
    [variations, selected],
  );

  useEffect(() => {
    onVariantChange?.(matched, selected);
  }, [matched, selected, onVariantChange]);

  if (definitions.length === 0) return null;

  const purchasable = isVariantPurchasable(matched, 1);
  const low = matched ? isVariantLowStock(matched) : false;
  const parts = matched ? variantPriceParts(matched) : null;
  const weightUnitLabel = (unit?: string | null) => {
    const u = String(unit || 'kg').toLowerCase();
    if (u === 'g') return isAr ? 'جم' : 'g';
    return isAr ? 'كجم' : 'kg';
  };

  return (
    <div className="space-y-4">
      {definitions.map((opt) => {
        const vals = optionValuesList(opt.values).filter((v) => v.selected !== false);
        const kind = optionType(opt);
        return (
          <div key={opt.id || opt.name}>
            <p className="text-xs font-bold mb-2 text-slate-800 dark:text-slate-100">
              {pickLocaleText(isAr, opt.name, opt.nameAr)}
            </p>
            {kind === 'color' ? (
              <div className="flex flex-wrap gap-2">
                {vals.map((v) => {
                  const on = selected[opt.name] === v.label;
                  const shown = pickLocaleText(isAr, v.label, v.labelAr);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      title={shown}
                      onClick={() => setSelected((s) => ({ ...s, [opt.name]: v.label }))}
                      className={`w-9 h-9 rounded-full border-2 transition-all cursor-pointer ${
                        on ? 'border-teal-600 ring-2 ring-teal-500/30 scale-110' : 'border-slate-200'
                      }`}
                      style={{ backgroundColor: v.colorHex || '#cbd5e1' }}
                      aria-pressed={on}
                    />
                  );
                })}
              </div>
            ) : kind === 'image' ? (
              <div className="flex flex-wrap gap-2">
                {vals.map((v) => {
                  const on = selected[opt.name] === v.label;
                  const shown = pickLocaleText(isAr, v.label, v.labelAr);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelected((s) => ({ ...s, [opt.name]: v.label }))}
                      className={`w-14 h-14 rounded-xl border-2 overflow-hidden cursor-pointer ${
                        on ? 'border-teal-600 ring-2 ring-teal-500/30' : 'border-slate-200'
                      }`}
                      aria-pressed={on}
                    >
                      {v.imageUrl ? (
                        <img src={v.imageUrl} alt={shown} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold p-1 block">{shown}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {vals.map((v) => {
                  const on = selected[opt.name] === v.label;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelected((s) => ({ ...s, [opt.name]: v.label }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                        on
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                      aria-pressed={on}
                    >
                      {pickLocaleText(isAr, v.label, v.labelAr)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="text-xs space-y-1">
        {matched && parts ? (
          <>
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              {isAr ? 'الخيار' : 'Label'}:{' '}
              {definitions
                .map((opt) => {
                  const raw = selected[opt.name];
                  if (!raw) return '';
                  const match = optionValuesList(opt.values).find((v) => v.label === raw);
                  return pickLocaleText(isAr, raw, match?.labelAr);
                })
                .filter(Boolean)
                .join(' · ')}
            </p>
            {matched.imageUrl && (
              <img
                src={matched.imageUrl}
                alt=""
                className="w-16 h-16 rounded-xl object-cover border border-slate-200"
              />
            )}
            <p className="font-bold text-slate-900 dark:text-slate-100">
              {isAr ? 'سعر البيع' : 'Selling price'}:{' '}
              <span className="tabular-nums">
                {parts.selling != null
                  ? isAr
                    ? `${parts.selling} ر.س`
                    : `SAR ${parts.selling}`
                  : '—'}
              </span>
            </p>
            {parts.mrp != null && (
              <p className="text-slate-500">
                {isAr ? 'سعر التجزئة' : 'MRP'}:{' '}
                <span className="line-through tabular-nums">
                  {isAr ? `${parts.mrp} ر.س` : `SAR ${parts.mrp}`}
                </span>
              </p>
            )}
            {parts.discount > 0 && (
              <p className="font-bold text-rose-600">
                {isAr
                  ? `الخصم ${parts.discount} ر.س (${parts.percent}٪)`
                  : `Discount SAR ${parts.discount} (${parts.percent}%)`}
              </p>
            )}
            {matched.weight != null && Number(matched.weight) > 0 && (
              <p className="text-slate-700 dark:text-slate-200">
                {isAr ? 'الوزن' : 'Weight'}: {matched.weight} {weightUnitLabel(matched.weightUnit)}
              </p>
            )}
            {matched.unlimitedStock ? (
              <p className="text-emerald-600 font-semibold">
                {isAr ? 'متوفر (كمية غير محدودة)' : 'In stock (unlimited)'}
              </p>
            ) : purchasable ? (
              <p className={`font-semibold ${low ? 'text-amber-600' : 'text-emerald-600'}`}>
                {low
                  ? isAr
                    ? `تنبيه المخزون: ${matched.stock} قطعة`
                    : `Stock alert: ${matched.stock} items`
                  : isAr
                    ? `المتوفر: ${matched.stock} قطعة`
                    : `In stock: ${matched.stock} items`}
              </p>
            ) : (
              <p className="text-rose-600 font-bold">
                {isAr ? 'غير متوفر — لا يمكن الإضافة للسلة' : 'Out of stock — cannot add to cart'}
              </p>
            )}
          </>
        ) : (
          <p className="text-amber-600 font-semibold">
            {isAr ? 'لا يوجد تنويع مطابق لهذا الاختيار' : 'No matching variant for this selection'}
          </p>
        )}
      </div>
    </div>
  );
};
