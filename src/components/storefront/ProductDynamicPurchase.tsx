/**
 * Product page block: every variation option (text, color, image), then the
 * custom fields saved on that same product.
 */
import React, { useState } from 'react';
import type {
  ProductConditionalRuleDefinition,
  ProductCustomField,
  ProductOptionDefinition,
  ProductVariation,
} from '../../types';
import { customFieldIsFillable } from '../../utils/customFieldTypes';
import { optionValuesList } from '../../utils/productVariants';
import {
  choiceLooksLikeColor,
  choiceLooksLikeImage,
  fieldControlKind,
  isCustomFieldVisible,
  optionKind,
  resolveSelectionPrice,
  type FieldValueMap,
} from '../../utils/storefrontPurchase';

export interface ProductDynamicPurchaseProps {
  options: ProductOptionDefinition[];
  variations?: ProductVariation[];
  fields?: ProductCustomField[];
  rules?: ProductConditionalRuleDefinition[];
  selected: Record<string, string>;
  onSelect: (next: Record<string, string>) => void;
  fieldValues: FieldValueMap;
  onFieldValues: (next: FieldValueMap) => void;
  isAr: boolean;
  tone: 'coffee' | 'mecca';
  basePrice: number;
}

function money(amount: number, isAr: boolean): string {
  const n = Number.isFinite(amount) ? amount : 0;
  const text = n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return isAr ? `${text} ر.س` : `SAR ${text}`;
}

export const ProductDynamicPurchase: React.FC<ProductDynamicPurchaseProps> = ({
  options,
  variations,
  fields,
  rules,
  selected,
  onSelect,
  fieldValues,
  onFieldValues,
  isAr,
  tone,
  basePrice,
}) => {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const coffee = tone === 'coffee';
  const visibleFields = (fields || []).filter((field) =>
    isCustomFieldVisible(field, fieldValues, rules, selected),
  );
  if (options.length === 0 && visibleFields.length === 0) return null;

  const setField = (id: string, value: FieldValueMap[string]) => {
    onFieldValues({ ...fieldValues, [id]: value });
  };

  const sectionClass = coffee
    ? 'space-y-3 pt-3 border-t border-neutral-100'
    : 'space-y-2 pt-3 border-t border-[#e8e4dc] dark:border-slate-800';
  const titleClass = coffee
    ? 'text-base font-extrabold text-neutral-900 tracking-tight'
    : 'text-[11px] font-bold text-[#102a1c] dark:text-slate-200';

  return (
    <div className="space-y-4">
      {options.map((opt) => {
        const vals = optionValuesList(opt.values).filter((v) => v.selected !== false && v.label.trim());
        const kind = optionKind(opt);
        const current = selected[opt.name] || '';
        const currentRow = vals.find((v) => v.label === current);
        const currentLabel = isAr && currentRow?.labelAr ? currentRow.labelAr : current;
        const optionTitle = isAr && opt.nameAr ? opt.nameAr : opt.name;
        const valueLabel = (v: { label: string; labelAr?: string }) => (isAr && v.labelAr ? v.labelAr : v.label);
        return (
          <div key={opt.id || opt.name} className={sectionClass}>
            <h2 className={titleClass}>{optionTitle}</h2>
            {kind === 'color' ? (
              <div className="flex flex-wrap items-center gap-3">
                {vals.map((v) => {
                  const on = current === v.label;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      title={valueLabel(v)}
                      aria-label={valueLabel(v)}
                      aria-pressed={on}
                      onClick={() => onSelect({ ...selected, [opt.name]: v.label })}
                      className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        on
                          ? coffee
                            ? 'ring-2 ring-black ring-offset-2 scale-105'
                            : 'ring-2 ring-[#102a1c] dark:ring-emerald-400 ring-offset-2'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <span
                        className="w-full h-full rounded-full border border-neutral-300/80 shadow-xs block"
                        style={{ backgroundColor: v.colorHex || '#cbd5e1' }}
                      />
                    </button>
                  );
                })}
              </div>
            ) : kind === 'image' ? (
              <div className="flex flex-wrap gap-2">
                {vals.map((v) => {
                  const on = current === v.label;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      aria-label={valueLabel(v)}
                      aria-pressed={on}
                      onClick={() => onSelect({ ...selected, [opt.name]: v.label })}
                      className={`w-14 h-14 rounded-xl border-2 overflow-hidden cursor-pointer bg-white ${
                        on
                          ? coffee
                            ? 'border-black ring-2 ring-black/10'
                            : 'border-[#102a1c] dark:border-emerald-400'
                          : 'border-neutral-200'
                      }`}
                    >
                      {v.imageUrl ? (
                        <img src={v.imageUrl} alt={v.label} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold p-1 block text-neutral-800">{valueLabel(v)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={coffee ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'flex flex-wrap gap-1.5'}>
                {vals.map((v) => {
                  const on = current === v.label;
                  const quote = resolveSelectionPrice(
                    basePrice,
                    options,
                    { ...selected, [opt.name]: v.label },
                    variations,
                  );
                  return (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => onSelect({ ...selected, [opt.name]: v.label })}
                      className={
                        coffee
                          ? `p-4 rounded-2xl text-start transition-all cursor-pointer border ${
                              on
                                ? 'border-2 border-black bg-white shadow-xs'
                                : 'border-neutral-200 bg-white hover:border-neutral-400'
                            }`
                          : `px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                              on
                                ? 'border-[#102a1c] dark:border-emerald-500 bg-[#102a1c]/5 dark:bg-emerald-950/30'
                                : 'border-[#d6cfc0] dark:border-slate-700 bg-white dark:bg-slate-900'
                            }`
                      }
                    >
                      <div className={coffee ? 'font-extrabold text-sm text-neutral-900' : 'text-[#102a1c] dark:text-slate-100'}>
                        {valueLabel(v)}
                      </div>
                      {coffee && (
                        <div className="font-sans text-xs font-semibold text-neutral-600 mt-2">
                          {money(quote.selling, isAr)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {currentLabel && (
              <p className={coffee ? 'text-sm font-bold text-neutral-900' : 'text-[11px] font-bold text-[#102a1c] dark:text-slate-200'}>
                {currentLabel}
              </p>
            )}
          </div>
        );
      })}

      {visibleFields.map((field) => {
        const kind = fieldControlKind(field.type);
        const value = fieldValues[field.id];
        const text = Array.isArray(value) ? '' : String(value ?? '');
        const many = Array.isArray(value) ? value : [];
        const content = isAr ? field.contentAr || field.contentEn || field.description : field.contentEn || field.contentAr || field.description;
        const fillable = customFieldIsFillable(field.type);
        const extra = Number(field.extraPrice) || 0;
        return (
          <div key={field.id} className={sectionClass}>
            {kind === 'Divider' ? (
              <div className="h-px bg-neutral-200 dark:bg-slate-700" />
            ) : (
              <h2 className={titleClass}>
                {isAr && field.nameAr ? field.nameAr : field.name}
                {field.required ? <span className="text-rose-600"> *</span> : null}
                {extra > 0 ? (
                  <span className="ms-2 text-xs font-semibold text-neutral-500">+{money(extra, isAr)}</span>
                ) : null}
              </h2>
            )}
            {field.imageUrl ? (
              <img src={field.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
            ) : null}
            {field.videoUrl ? (
              <video src={field.videoUrl} controls className="w-full max-h-48 rounded-xl bg-black" />
            ) : null}
            {content ? <p className="text-xs text-neutral-700 dark:text-slate-300 whitespace-pre-line">{content}</p> : null}
            {fillable && kind !== 'Divider' && renderControl()}
          </div>
        );

        function renderControl() {
          const inputClass = coffee
            ? 'w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white text-xs text-neutral-900'
            : 'w-full px-3 py-2 rounded-xl border border-[#d6cfc0] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs';
          if (kind === 'Long Text') {
            return (
              <textarea
                rows={3}
                value={text}
                onChange={(e) => setField(field.id, e.target.value)}
                className={inputClass}
              />
            );
          }
          if (kind === 'Number') {
            return (
              <input
                type="number"
                value={text}
                onChange={(e) => setField(field.id, e.target.value)}
                className={inputClass}
              />
            );
          }
          if (kind === 'Date' || kind === 'Time' || kind === 'Date and Time') {
            const inputType = kind === 'Date' ? 'date' : kind === 'Time' ? 'time' : 'datetime-local';
            return (
              <input
                type={inputType}
                value={text}
                onChange={(e) => setField(field.id, e.target.value)}
                className={inputClass}
              />
            );
          }
          if (kind === 'Image Upload' || kind === 'File Upload') {
            return (
              <div className="space-y-2">
                <input
                  type="file"
                  accept={kind === 'Image Upload' ? 'image/*' : undefined}
                  className="text-xs"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setField(field.id, file.name);
                    if (kind === 'Image Upload') {
                      setPreviews((prev) => ({ ...prev, [field.id]: URL.createObjectURL(file) }));
                    }
                  }}
                />
                {previews[field.id] ? (
                  <img src={previews[field.id]} alt="" className="w-16 h-16 rounded-xl object-cover" />
                ) : null}
                {text ? <p className="text-[11px] text-neutral-500">{text}</p> : null}
              </div>
            );
          }
          const optionsList = field.options || [];
          const multiple = kind.startsWith('Multiple');
          if (
            kind === 'Single Choice' ||
            kind === 'Multiple Choice' ||
            kind === 'Size Selector' ||
            kind === 'Single Choice Image' ||
            kind === 'Multiple Choice Image' ||
            kind === 'Single Choice Color' ||
            kind === 'Multiple Choice Color' ||
            kind === 'Color Selector'
          ) {
            if (optionsList.length === 0 && kind === 'Color Selector') {
              return (
                <input
                  type="color"
                  value={choiceLooksLikeColor(text) ? text : '#1c1917'}
                  onChange={(e) => setField(field.id, e.target.value)}
                  className="w-10 h-10 p-1 rounded-lg border cursor-pointer"
                  aria-label={field.name}
                />
              );
            }
            const toggle = (opt: string) => {
              if (!multiple) {
                setField(field.id, opt);
                return;
              }
              const next = many.includes(opt) ? many.filter((item) => item !== opt) : [...many, opt];
              setField(field.id, next);
            };
            return (
              <div className="flex flex-wrap gap-2">
                {optionsList.map((opt) => {
                  const on = multiple ? many.includes(opt) : text === opt;
                  if (choiceLooksLikeColor(opt) || kind.includes('Color')) {
                    return (
                      <button
                        key={opt}
                        type="button"
                        title={opt}
                        aria-label={opt}
                        aria-pressed={on}
                        onClick={() => toggle(opt)}
                        className={`w-9 h-9 rounded-full border-2 cursor-pointer ${on ? 'border-black ring-2 ring-black/20' : 'border-neutral-200'}`}
                        style={{ backgroundColor: choiceLooksLikeColor(opt) ? opt : '#cbd5e1' }}
                      />
                    );
                  }
                  if (choiceLooksLikeImage(opt) || kind.includes('Image')) {
                    return (
                      <button
                        key={opt}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(opt)}
                        className={`w-14 h-14 rounded-xl border-2 overflow-hidden cursor-pointer bg-white ${
                          on ? 'border-black' : 'border-neutral-200'
                        }`}
                      >
                        {choiceLooksLikeImage(opt) ? (
                          <img src={opt} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold p-1 block">{opt}</span>
                        )}
                      </button>
                    );
                  }
                  return (
                    <button
                      key={opt}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(opt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                        on
                          ? coffee
                            ? 'bg-black text-white border-black'
                            : 'bg-[#102a1c] text-white border-[#102a1c]'
                          : 'bg-white text-neutral-800 border-neutral-200'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            );
          }
          return (
            <input
              type="text"
              value={text}
              onChange={(e) => setField(field.id, e.target.value)}
              placeholder={kind === 'Location' ? (isAr ? 'الموقع' : 'Location') : undefined}
              className={inputClass}
            />
          );
        }
      })}
    </div>
  );
};
